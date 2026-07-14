/* ============================================================
   Matching lives in ./engine (semantic embeddings + structured
   scoring + behavioral signals + per-member learned taste).
   This file keeps only conversation helpers.
   ============================================================ */

const overlap = (a = [], b = []) => {
  const setB = new Set((b || []).map((x) => x.toLowerCase()))
  return (a || []).filter((x) => setB.has(x.toLowerCase()))
}

/** Icebreakers a chat opens with — anchored to the match, not small talk. */
export function icebreakers(me, them, why = []) {
  const out = []
  const shared = overlap(me.interests, them.interests)
  if (shared.length) out.push(`Ask ${them.name.split(' ')[0]} what they're building in ${shared[0]}`)
  if (them.lookingFor) out.push(`They're looking for a ${them.lookingFor.toLowerCase()} — pitch yourself in one line`)
  out.push(`Propose a 48-hour mini-sprint to test the fit`)
  return out.slice(0, 3)
}
