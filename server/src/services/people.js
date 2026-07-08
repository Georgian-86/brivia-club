import { db } from '../db.js'
import { scoreMatch } from '../matching.js'
import { personCard } from '../serialize.js'

/* People service — every surface that shows a person goes through
   here, so scoring + serialization stay consistent.
   Scale path: cache the viewer's scored list in Redis (TTL 1h),
   invalidate on profile edits; then batch-precompute nightly. */

export async function getViewer(id) {
  return db.user.findUnique({
    where: { id },
    include: { memberships: { include: { community: true } } },
  })
}

const commNames = (u) => (u.memberships || []).map((m) => m.community.name)

/** Scored, serialized people for a viewer. */
export async function scoredPeople(viewer, { where = {}, limit = 50 } = {}) {
  const candidates = await db.user.findMany({
    where: { id: { not: viewer.id }, role: 'MEMBER', ...where },
    include: { memberships: { include: { community: true } } },
    take: 400, // hard cap; beyond this the precomputed path takes over
  })
  const mine = new Set(commNames(viewer))
  return candidates
    .map((c) => {
      const shared = commNames(c).filter((n) => mine.has(n))
      const { score, why } = scoreMatch(viewer, c, { communities: shared })
      return personCard(c, { match: score, why, communities: commNames(c) })
    })
    .sort((a, b) => b.match - a.match)
    .slice(0, limit)
}

/** Deck = scored people minus anyone already swiped or matched. */
export async function deckFor(viewer, limit = 12) {
  const [swipes, matches] = await Promise.all([
    db.swipe.findMany({ where: { swiperId: viewer.id }, select: { targetId: true } }),
    db.match.findMany({
      where: { OR: [{ userAId: viewer.id }, { userBId: viewer.id }] },
      select: { userAId: true, userBId: true },
    }),
  ])
  const seen = new Set(swipes.map((s) => s.targetId))
  matches.forEach((m) => {
    seen.add(m.userAId)
    seen.add(m.userBId)
  })
  return scoredPeople(viewer, { where: { id: { notIn: [...seen] } }, limit })
}
