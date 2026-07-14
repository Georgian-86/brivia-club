import { db } from '../db.js'

/* ============================================================
   Behavioral stats — the network in motion, per candidate:

   reciprocity  Wilson lower bound on their like rate. Answers
                "if I show you this person, will a like come
                back?" — smoothed so 3 swipes can't fake 100%.
   activity     exponential decay on their latest action; a
                deck full of ghosts kills the product.
   freshness    joined in the last 14 days → surfaced more, so
                new members get liquidity before they churn.

   Cached in-process for 5 minutes — decks re-rank on real data
   without hammering Postgres on every request.
   ============================================================ */

const TTL = 5 * 60e3
let cache = { at: 0, map: new Map() }

const wilsonLower = (pos, n, z = 1.96) => {
  if (!n) return null
  const p = pos / n
  const z2 = z * z
  const denom = 1 + z2 / n
  const centre = p + z2 / (2 * n)
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n))
  return Math.max(0, (centre - margin) / denom)
}

const dayDecay = (date, halfLifeDays) => {
  if (!date) return null
  const days = (Date.now() - new Date(date).getTime()) / 864e5
  return Math.pow(0.5, days / halfLifeDays)
}

async function compute() {
  const [swipeAgg, lastSwipe, lastMsg, users] = await Promise.all([
    db.swipe.groupBy({ by: ['swiperId', 'action'], _count: { _all: true } }),
    db.swipe.groupBy({ by: ['swiperId'], _max: { createdAt: true } }),
    db.message.groupBy({ by: ['senderId'], _max: { createdAt: true } }),
    db.user.findMany({ select: { id: true, createdAt: true, online: true } }),
  ])

  const likes = new Map()
  const totals = new Map()
  for (const row of swipeAgg) {
    const n = row._count._all
    totals.set(row.swiperId, (totals.get(row.swiperId) || 0) + n)
    if (row.action !== 'PASS') likes.set(row.swiperId, (likes.get(row.swiperId) || 0) + n)
  }
  const lastSeen = new Map()
  const bump = (id, at) => {
    if (at && (!lastSeen.has(id) || at > lastSeen.get(id))) lastSeen.set(id, at)
  }
  for (const r of lastSwipe) bump(r.swiperId, r._max.createdAt)
  for (const r of lastMsg) bump(r.senderId, r._max.createdAt)

  const map = new Map()
  for (const u of users) {
    const n = totals.get(u.id) || 0
    const reciprocity = wilsonLower(likes.get(u.id) || 0, n)
    const activity = u.online ? 1 : dayDecay(lastSeen.get(u.id) || u.createdAt, 10)
    const freshness = dayDecay(u.createdAt, 14) // ~1 first week, fades by week 4
    map.set(u.id, {
      reciprocity: reciprocity == null ? null : Math.min(1, reciprocity / 0.85),
      activity,
      freshness: freshness > 0.15 ? freshness : null,
    })
  }
  return map
}

export async function behaviorStats() {
  if (Date.now() - cache.at > TTL) cache = { at: Date.now(), map: await compute() }
  return cache.map
}

export function invalidateStats() {
  cache.at = 0
}
