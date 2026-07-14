import { db } from '../db.js'
import { rankFor, logDeckServed } from '../engine/index.js'
import { personCard } from '../serialize.js'

/* People service — every surface that shows a person goes through
   here, so scoring + serialization stay consistent. Scoring itself
   lives in ../engine (semantic + structured + behavioral + learned
   taste); this file just adapts it to cards. */

export async function getViewer(id) {
  return db.user.findUnique({
    where: { id },
    include: { memberships: { include: { community: true } } },
  })
}

const commNames = (u) => (u.memberships || []).map((m) => m.community.name)

const toCard = (item) =>
  personCard(item.user, {
    match: item.score,
    why: item.why,
    communities: commNames(item.user),
  })

/** Scored, serialized people for a viewer. `where` scopes hubs/id-sets. */
export async function scoredPeople(viewer, { where = null, limit = 50 } = {}) {
  const items = await rankFor(viewer, { where, limit })
  return items.map(toCard)
}

/** Deck = engine ranking minus anyone already swiped or matched,
    diversified + exploration slot, and logged as training data. */
export async function deckFor(viewer, limit = 12, context = 'deck') {
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
  const items = await rankFor(viewer, { exclude: [...seen], limit, deck: true })
  logDeckServed(viewer.id, items, context) // fire-and-forget: the training log
  return items.map(toCard)
}
