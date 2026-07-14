import { createHash } from 'node:crypto'
import { Prisma } from '@prisma/client'
import { db } from '../db.js'
import { annCandidateIds } from './store.js'
import { cosine } from './embeddings.js'

/* ============================================================
   Candidate selection — kills the old `take: 400` blindness.

   A deck's raw pool is the union of four honest sources:
     ANN        nearest neighbors by bidirectional intent
     active     members moving in the network right now
     fresh      newest members (liquidity for newcomers)
     rotation   deterministic daily shuffle — md5(id + viewer + day)
                walks the ENTIRE member base over successive days,
                so nobody is permanently invisible (BRV-006)

   Diversity happens after scoring: a greedy MMR pass over
   profile vectors + an epsilon exploration slot, so decks are
   neither identical campus-wide nor pure echo chambers.
   ============================================================ */

const dayKey = () => new Date().toISOString().slice(0, 10)

export async function candidatePool(viewer, { excludeIds = [], poolSize = 220 } = {}) {
  const excl = [...new Set([viewer.id, ...excludeIds])]
  const base = { id: { notIn: excl }, role: 'MEMBER' }

  const [ann, active, fresh, rotation] = await Promise.all([
    annCandidateIds(viewer.id, { perSide: 80, excludeIds: excl }).catch(() => []),
    db.swipe
      .groupBy({ by: ['swiperId'], _max: { createdAt: true }, orderBy: { _max: { createdAt: 'desc' } }, take: 80 })
      .then((rows) => rows.map((r) => r.swiperId)),
    db.user.findMany({ where: base, orderBy: { createdAt: 'desc' }, take: 50, select: { id: true } }).then((r) => r.map((u) => u.id)),
    db.$queryRaw`
      SELECT id FROM "User"
      WHERE role = 'MEMBER' AND id NOT IN (${Prisma.join(excl)})
      ORDER BY md5(id || ${viewer.id} || ${dayKey()})
      LIMIT 60`.then((rows) => rows.map((r) => r.id)),
  ])

  const exclSet = new Set(excl)
  const pool = []
  const seen = new Set()
  for (const id of [...ann, ...active, ...fresh, ...rotation]) {
    if (!seen.has(id) && !exclSet.has(id)) {
      seen.add(id)
      pool.push(id)
      if (pool.length >= poolSize) break
    }
  }
  return pool
}

/* ---------- deck shaping ---------- */

const seededFloat = (...parts) => {
  const h = createHash('md5').update(parts.join('|')).digest()
  return h.readUInt32BE(0) / 0xffffffff
}

/**
 * Greedy max-marginal-relevance: pick high scores, but penalize a card
 * for reading like one already picked. λ=0.78 → relevance-heavy.
 */
export function diversify(scored, vectors, limit, lambda = 0.78) {
  if (scored.length <= limit) return scored
  const picked = []
  const rest = [...scored]
  while (picked.length < limit && rest.length) {
    let bestIdx = 0
    let bestVal = -Infinity
    for (let i = 0; i < rest.length; i++) {
      const cand = rest[i]
      let maxSim = 0
      const cv = vectors.get(cand.user.id)?.profile
      if (cv) {
        for (const p of picked) {
          const sim = cosine(cv, vectors.get(p.user.id)?.profile)
          if (sim != null && sim > maxSim) maxSim = sim
        }
      }
      const val = lambda * (cand.score / 99) - (1 - lambda) * maxSim
      if (val > bestVal) {
        bestVal = val
        bestIdx = i
      }
    }
    picked.push(rest.splice(bestIdx, 1)[0])
  }
  return picked
}

/**
 * Epsilon slot — one card per deck comes from outside the top ranks
 * (deterministic per viewer+day). Exploration data feeds the learner;
 * serendipity feeds the product story.
 */
export function withExploration(ranked, limit, viewerId, eps = 0.18) {
  if (ranked.length <= limit) return ranked.slice(0, limit)
  if (seededFloat(viewerId, dayKey(), 'eps') > eps) return ranked.slice(0, limit)
  const tail = ranked.slice(limit, Math.min(ranked.length, limit * 4))
  if (!tail.length) return ranked.slice(0, limit)
  const wild = tail[Math.floor(seededFloat(viewerId, dayKey(), 'pick') * tail.length)]
  const deck = ranked.slice(0, limit - 1)
  const slot = 2 + Math.floor(seededFloat(viewerId, dayKey(), 'slot') * Math.min(6, limit - 2))
  deck.splice(slot, 0, { ...wild, explore: true })
  return deck
}
