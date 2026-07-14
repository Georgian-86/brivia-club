import { db } from '../db.js'
import { buildFeatures } from './features.js'
import { scoreFeatures, explain } from './weights.js'
import { getTaste, learnFromSwipe } from './learn.js'
import { behaviorStats } from './stats.js'
import { candidatePool, diversify, withExploration } from './candidates.js'
import { refreshUserEmbedding, getVectors, semanticNeighborIds } from './store.js'
import { embed, warmup as warmupEmbeddings } from './embeddings.js'

/* ============================================================
   Brivia matching engine v1 — the public API.

   rankFor         scored, explained, diversified people list
   scorePair       one (viewer, target) score at match time
   semanticSearch  free-text → embedding → ANN → engine re-rank
   recordSwipe     interaction log + one online-learning step
   logDeckServed   append served cards (training data, BRV-025)

   Layers: semantic (pgvector embeddings, bidirectional intent)
   + structured (whole onboarding form) + behavioral (reciprocity,
   activity, freshness) + a per-member learned taste model.
   Every score ships with human-readable evidence.
   ============================================================ */

export { refreshUserEmbedding, warmupEmbeddings, learnFromSwipe }

const commNames = (u) => (u.memberships || []).map((m) => m.community.name)
const include = { memberships: { include: { community: true } } }

/** Assemble scoring context once per request: vectors, stats, taste. */
async function contextFor(viewer, candidates) {
  const ids = [viewer.id, ...candidates.map((c) => c.id)]
  const [vectors, stats, taste] = await Promise.all([getVectors(ids), behaviorStats(), getTaste(viewer.id)])
  const mine = new Set(commNames(viewer))
  return {
    vectors,
    stats,
    taste,
    sharedFor: (cand) => commNames(cand).filter((n) => mine.has(n)),
  }
}

function scoreCandidate(viewer, cand, ctx) {
  const { features, meta } = buildFeatures(viewer, cand, {
    vectors: ctx.vectors,
    stats: ctx.stats,
    sharedCommunities: ctx.sharedFor(cand),
  })
  const { score, contributions } = scoreFeatures(features, ctx.taste.weights)
  const why = explain(features, contributions, meta, viewer, cand)
  return { user: cand, score, why, features }
}

/**
 * rankFor(viewer, opts) → [{ user, score, why, features, explore? }]
 * opts.where   extra Prisma filter (hub tags, id sets) — skips pool selection
 * opts.exclude ids never to serve (swiped, matched, self)
 * opts.deck    apply MMR diversity + exploration slot (deck surfaces)
 */
export async function rankFor(viewer, { limit = 12, where = null, exclude = [], deck = false, poolSize = 220 } = {}) {
  let candidates
  if (where) {
    candidates = await db.user.findMany({
      where: { id: { not: viewer.id, notIn: exclude }, role: 'MEMBER', ...where },
      include,
      take: poolSize,
    })
  } else {
    const ids = await candidatePool(viewer, { excludeIds: exclude, poolSize })
    // role re-check: ANN/rotation sources scan embeddings, not membership rules
    candidates = await db.user.findMany({ where: { id: { in: ids }, role: 'MEMBER' }, include })
  }
  if (!candidates.length) return []

  const ctx = await contextFor(viewer, candidates)
  const ranked = candidates.map((c) => scoreCandidate(viewer, c, ctx)).sort((a, b) => b.score - a.score)

  if (!deck) return ranked.slice(0, limit)
  const diverse = diversify(ranked, ctx.vectors, Math.min(limit * 2, ranked.length))
  return withExploration(diverse, limit, viewer.id)
}

/** Score one pair (used at match creation + swipe learning fallback). */
export async function scorePair(viewer, target) {
  const ctx = await contextFor(viewer, [target])
  return scoreCandidate(viewer, target, ctx)
}

/**
 * Semantic people search: "flutter dev who knows fintech and can design"
 * finds people whose PROFILES mean that, not just keyword hits.
 * Blend: 55% query↔profile meaning, 45% engine fit for the viewer.
 */
export async function semanticSearch(viewer, query, { limit = 30, where = null } = {}) {
  const q = `${query || ''}`.trim()
  if (!q) return rankFor(viewer, { limit, where })

  const qv = await embed(q)
  if (!qv) return null // provider off — caller falls back to keyword search

  const neighbors = await semanticNeighborIds(qv[0], { limit: Math.max(40, limit * 2), excludeIds: [viewer.id] })
  if (!neighbors.length) return []
  const simById = new Map(neighbors.map((n) => [n.userId, n.sim]))

  const candidates = await db.user.findMany({
    where: { id: { in: [...simById.keys()] }, role: 'MEMBER', ...(where || {}) },
    include,
  })
  const ctx = await contextFor(viewer, candidates)

  // query→profile cosines run low in absolute terms — what carries meaning
  // is their ORDER, so min-max normalize within this result set. If the
  // whole set is flat, the query didn't discriminate: rank by engine fit.
  const sims = candidates.map((c) => simById.get(c.id) ?? 0)
  const lo = Math.min(...sims)
  const spread = Math.max(...sims) - lo
  const informative = spread >= 0.06

  return candidates
    .map((c) => {
      const item = scoreCandidate(viewer, c, ctx)
      const semQ = informative ? ((simById.get(c.id) ?? 0) - lo) / spread : 0.5
      return { ...item, relevance: Math.round(100 * (0.65 * semQ + 0.35 * (item.score / 99))) }
    })
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
}

/* ---------- interaction log + learning ---------- */

/** Append served cards — every future ranking model trains on this. */
export async function logDeckServed(viewerId, items, context = 'deck') {
  if (!items.length) return
  await db.interaction
    .createMany({
      data: items.map((it) => ({
        userId: viewerId,
        targetId: it.user?.id ?? it.id,
        event: 'deck_served',
        context: it.explore ? `${context}:explore` : context,
        features: it.features ?? null,
        score: it.score ?? null,
      })),
    })
    .catch((err) => console.warn('[engine] deck_served log failed:', err.message))
}

/**
 * Log a swipe + take one learning step against the features the card
 * was actually served with (recomputed if the serve is stale/missing).
 */
export async function recordSwipe(viewer, target, action) {
  const served = await db.interaction.findFirst({
    where: { userId: viewer.id, targetId: target.id, event: 'deck_served' },
    orderBy: { createdAt: 'desc' },
  })
  let features = served?.features ?? null
  let score = served?.score ?? null
  if (!features) {
    const scored = await scorePair(viewer, target)
    features = scored.features
    score = scored.score
  }
  await db.interaction
    .create({
      data: {
        userId: viewer.id,
        targetId: target.id,
        event: action.toLowerCase(), // like | pass | super
        context: served?.context ?? 'direct',
        features,
        score,
      },
    })
    .catch((err) => console.warn('[engine] swipe log failed:', err.message))
  // learning is best-effort and off the request's critical path
  learnFromSwipe(viewer.id, features, action).catch((err) => console.warn('[engine] learn failed:', err.message))
  return { features, score }
}

/** Log a mutual match (outcome signal for the future re-ranker). */
export async function logMatch(userAId, userBId, score) {
  await db.interaction
    .createMany({
      data: [
        { userId: userAId, targetId: userBId, event: 'match', score },
        { userId: userBId, targetId: userAId, event: 'match', score },
      ],
    })
    .catch(() => {})
}
