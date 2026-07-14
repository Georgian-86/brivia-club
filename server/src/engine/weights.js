/* ============================================================
   Scoring — weighted evidence → honest 25–99.

   score = 25 + 74 · σ( K · (m − M0) )
   where m = Σ w·f / Σ|w| over the features PRESENT for the pair.

   PRIOR is the hand-tuned cold-start brain (purposes heaviest,
   per BRV-028). Each member's TasteProfile starts as a copy and
   drifts with their swipes — so the same candidate can honestly
   score 84 for you and 61 for your roommate.

   No floor, no cap-hugging: an empty-overlap pair really does
   land in the low 30s. Believability is the product.
   ============================================================ */

export const PRIOR = {
  // semantic — the AI layer
  semTheyFitMyIntent: 1.5,
  semIFitTheirIntent: 1.5,
  semAffinity: 0.8,
  // structured — the whole onboarding form
  purpose: 2.2,
  skillComplement: 1.2,
  theyAreWhoINeed: 1.7,
  iAmWhoTheyNeed: 1.7,
  interests: 1.2,
  industry: 0.7,
  language: 0.4,
  personality: 0.5,
  workStyle: 0.4,
  location: 1.0,
  availability: 0.7,
  communities: 0.6,
  // behavioral — the network in motion
  reciprocity: 0.9,
  activity: 0.8,
  freshness: 0.5,
  completeness: 0.4,
}

// calibration — tuned on the live network (scripts/engine-report.js):
// thin-evidence pairs land ~45-55, real fits 70+, standouts 85-99
export const STEEPNESS = 12
export const MIDPOINT = 0.36

const sigmoid = (z) => 1 / (1 + Math.exp(-z))

/**
 * scoreFeatures(features, weights?) → { score, p, m, contributions }
 * Only features present on the pair participate; weights renormalize
 * over that evidence so sparse profiles aren't punished for blanks.
 */
export function scoreFeatures(features, weights = PRIOR) {
  let num = 0
  let den = 0
  const contributions = {}
  for (const [k, w] of Object.entries(weights)) {
    const f = features[k]
    if (f == null) continue
    num += w * f
    den += Math.abs(w)
    contributions[k] = w * f
  }
  const m = den ? num / den : 0
  const p = sigmoid(STEEPNESS * (m - MIDPOINT))
  return { score: Math.round(25 + 74 * p), p, m, contributions }
}

/* ---------- explainability — why chips cite real evidence ---------- */

const first = (arr, n = 2) => (arr || []).slice(0, n).join(' + ')

const EXPLAIN = {
  theyAreWhoINeed: (f, meta) =>
    meta.needHits?.length ? `They bring what you're looking for — ${first(meta.needHits)}` : null,
  iAmWhoTheyNeed: (f, meta) =>
    meta.neededByThem?.length ? `You're exactly who they need — ${first(meta.neededByThem)}` : null,
  purpose: (f, meta, me, them) =>
    meta.tagMatch
      ? `Both here for ${them.tag.toLowerCase()} building`
      : meta.sharedPurposes?.length
        ? `Both here to build — ${first(meta.sharedPurposes, 2)}`
        : null,
  semTheyFitMyIntent: () => 'Their profile reads like what you described wanting',
  semIFitTheirIntent: () => 'Your profile matches what they said they want',
  semAffinity: () => 'Your stories rhyme — similar builder DNA',
  skillComplement: (f, meta) => (meta.newSkills?.length ? `Complementary skills — brings ${first(meta.newSkills)}` : null),
  interests: (f, meta) => (meta.sharedInterests?.length ? `Both into ${first(meta.sharedInterests, 2)}` : null),
  industry: (f, meta) => (meta.sharedIndustries?.length ? `Same industry focus — ${first(meta.sharedIndustries, 1)}` : null),
  location: (f, meta) => meta.locationWhy || null,
  availability: () => 'Availability lines up',
  communities: (f, meta) =>
    meta.sharedCommunities?.length
      ? `${meta.sharedCommunities.length} shared communit${meta.sharedCommunities.length > 1 ? 'ies' : 'y'}`
      : null,
  reciprocity: (f) => (f > 0.62 ? 'Active connector — likely to swipe back' : null),
  freshness: (f) => (f > 0.7 ? 'New to the club — early mover advantage' : null),
  personality: (f) => (f >= 0.5 ? 'Personality types click' : null),
  workStyle: (f) => (f === 1 ? 'Same work style' : null),
}

/** Top real contributions → human sentences. Never invents evidence. */
export function explain(features, contributions, meta, me, them, limit = 5) {
  return Object.entries(contributions)
    .filter(([k]) => (features[k] ?? 0) >= 0.34) // only genuine signal explains a match
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => EXPLAIN[k]?.(features[k], meta, me, them))
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, limit)
}
