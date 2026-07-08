/* ============================================================
   Matching Engine v0 — deterministic, explainable scoring.
   Pure function: (viewer, candidate) → { score, why[] }.

   Scale path: this module is the future service boundary.
   v1 = nightly batch precompute into a match_scores table;
   v2 = pgvector embeddings for skills/bio + this as re-ranker.
   ============================================================ */

const overlap = (a = [], b = []) => {
  const setB = new Set((b || []).map((x) => x.toLowerCase()))
  return (a || []).filter((x) => setB.has(x.toLowerCase()))
}

export function scoreMatch(me, them, shared = {}) {
  let score = 40 // liquidity floor — nobody scores insultingly low
  const why = []

  // Complementary skills — they cover what you don't (team formation ≠ similarity)
  const theirNew = (them.skills || []).filter(
    (s) => !(me.skills || []).some((m) => m.toLowerCase() === s.toLowerCase())
  )
  if (theirNew.length >= 2) {
    score += Math.min(18, theirNew.length * 5)
    why.push(`Complementary skills — brings ${theirNew.slice(0, 2).join(' + ')}`)
  }

  // What they're looking for vs what you are
  const lf = `${them.lookingFor || ''}`.toLowerCase()
  if ((me.skills || []).some((s) => lf.includes(s.toLowerCase().split(' ')[0]))) {
    score += 12
    why.push('They need exactly your skill set')
  }

  const sharedInterests = overlap(me.interests, them.interests)
  if (sharedInterests.length) {
    score += Math.min(15, sharedInterests.length * 6)
    why.push(`Both into ${sharedInterests.slice(0, 2).join(' & ')}`)
  }

  const sharedComms = shared.communities || []
  if (sharedComms.length) {
    score += Math.min(10, sharedComms.length * 5)
    why.push(`${sharedComms.length} shared communit${sharedComms.length > 1 ? 'ies' : 'y'}`)
  }

  if (me.timezone && me.timezone === them.timezone) {
    score += 8
    why.push('Same timezone')
  }

  const avA = `${me.availability || ''}`.toLowerCase()
  const avB = `${them.availability || ''}`.toLowerCase()
  if (avA && avB && ['weekend', 'evening', 'full-time'].some((w) => avA.includes(w) && avB.includes(w))) {
    score += 7
    why.push('Availability lines up')
  }

  if (me.tag && me.tag === them.tag) {
    score += 6
    why.push(`Both here for ${me.tag.toLowerCase()} building`)
  }

  return { score: Math.min(99, score), why: why.slice(0, 5) }
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
