import { cosine } from './embeddings.js'

/* ============================================================
   Feature extraction — one (viewer, candidate) pair → a named
   feature vector, every value in [0,1].

   Three families:
     semantic    cross-fit of intent↔profile embeddings
     structured  the whole onboarding form, scored honestly
     behavioral  reciprocity, activity, freshness, completeness

   A feature that CAN'T be known (either side left the field
   blank, or no vectors yet) is ABSENT, not zero — the scorer
   renormalizes over available evidence, so sparse profiles get
   honest mid scores instead of punished ones.
   ============================================================ */

const norm = (s) => `${s || ''}`.toLowerCase().trim()
const clamp01 = (x) => Math.max(0, Math.min(1, x))

const toSet = (arr) => new Set((arr || []).map(norm).filter(Boolean))
const shared = (a, b) => {
  const B = toSet(b)
  return (a || []).filter((x) => B.has(norm(x)))
}

/** Jaccard against the smaller set — "of what we could share, how much do we?" */
const overlapRatio = (a, b) => {
  const A = toSet(a)
  const B = toSet(b)
  if (!A.size || !B.size) return null
  let hit = 0
  for (const x of A) if (B.has(x)) hit++
  return hit / Math.min(A.size, B.size)
}

/* MiniLM cosines between unrelated profile texts sit ~0.10–0.35; strong
   fits reach ~0.65+. Stretch that band across [0,1] so the feature has
   contrast instead of everything landing at 0.4. */
const semScale = (cos) => (cos == null ? null : clamp01((cos - 0.1) / 0.55))

const STOP = new Set([
  'the', 'and', 'for', 'with', 'who', 'can', 'our', 'your', 'their', 'that', 'this',
  'someone', 'people', 'person', 'looking', 'need', 'needs', 'want', 'wants', 'into',
  'about', 'from', 'have', 'has', 'are', 'was', 'will', 'would', 'like', 'love',
])
const tokens = (s) =>
  norm(s)
    .split(/[^a-z0-9+#.]+/)
    .filter((t) => t.length > 2 && !STOP.has(t))

const stem = (t) => t.replace(/s$/, '')

/** Does A's lookingFor text land on B's skills / role / headline? → hit ratio + matched terms. */
function needFit(lookingFor, them) {
  const want = tokens(lookingFor)
  if (!want.length) return { value: null, hits: [] }
  const hay = new Set(
    [...(them.skills || []), them.roleTitle, them.headline, them.tag]
      .flatMap((s) => tokens(s))
      .map(stem)
  )
  const hits = want.filter((t) => hay.has(stem(t)))
  return { value: clamp01(hits.length / Math.min(want.length, 4)), hits }
}

const cityOf = (loc) => norm(loc).split(',')[0].trim()

const AVAIL_BANDS = ['weekend', 'evening', 'night', 'full-time', 'fulltime', 'flexible', 'part-time']
function availabilityFit(a, b) {
  const A = norm(a)
  const B = norm(b)
  if (!A || !B) return null
  const bandsA = AVAIL_BANDS.filter((w) => A.includes(w))
  const bandsB = AVAIL_BANDS.filter((w) => B.includes(w))
  if (!bandsA.length || !bandsB.length) return A === B ? 1 : null
  return bandsA.some((w) => bandsB.includes(w)) ? 1 : 0
}

/**
 * buildFeatures(viewer, cand, ctx) → { features, meta }
 * ctx: { vectors: Map(userId→{profile,intent}), stats: Map(userId→{reciprocity,activity,freshness}),
 *        sharedCommunities: string[] }
 */
export function buildFeatures(me, them, ctx = {}) {
  const features = {}
  const meta = {}
  const put = (k, v) => {
    if (v != null && !Number.isNaN(v)) features[k] = clamp01(v)
  }

  /* ---------- semantic ---------- */
  const vMe = ctx.vectors?.get(me.id)
  const vThem = ctx.vectors?.get(them.id)
  put('semTheyFitMyIntent', semScale(cosine(vMe?.intent, vThem?.profile)))
  put('semIFitTheirIntent', semScale(cosine(vThem?.intent, vMe?.profile)))
  put('semAffinity', semScale(cosine(vMe?.profile, vThem?.profile)))

  /* ---------- structured ---------- */
  const tagMatch = me.tag && them.tag ? (norm(me.tag) === norm(them.tag) ? 1 : 0) : null
  const purposeOverlap = overlapRatio(me.purposes, them.purposes)
  if (tagMatch != null || purposeOverlap != null)
    put('purpose', 0.55 * (purposeOverlap ?? tagMatch) + 0.45 * (tagMatch ?? purposeOverlap))
  meta.tagMatch = tagMatch === 1
  meta.sharedPurposes = shared(me.purposes, them.purposes)

  const newSkills = (them.skills || []).filter((s) => !toSet(me.skills).has(norm(s)))
  if ((them.skills || []).length) put('skillComplement', newSkills.length / Math.max(3, Math.min(6, them.skills.length)))
  meta.newSkills = newSkills

  const iNeed = needFit(me.lookingFor, them)
  const theyNeed = needFit(them.lookingFor, me)
  put('theyAreWhoINeed', iNeed.value)
  put('iAmWhoTheyNeed', theyNeed.value)
  meta.needHits = iNeed.hits
  meta.neededByThem = theyNeed.hits

  const sharedInterests = shared(me.interests, them.interests)
  if ((me.interests || []).length && (them.interests || []).length)
    put('interests', sharedInterests.length / 3)
  meta.sharedInterests = sharedInterests

  put('industry', overlapRatio(me.industries, them.industries))
  meta.sharedIndustries = shared(me.industries, them.industries)
  put('language', overlapRatio(me.languages, them.languages))
  put('personality', overlapRatio(me.personality, them.personality))

  if (me.workStyle && them.workStyle)
    put('workStyle', norm(me.workStyle) === norm(them.workStyle) ? 1 : 0)

  // location ladder: campus → city → timezone
  let locScore = null
  if (me.campus && them.campus && norm(me.campus) === norm(them.campus)) {
    locScore = 1
    meta.locationWhy = `Same campus — ${them.campus}`
  } else if (cityOf(me.location) && cityOf(me.location) === cityOf(them.location)) {
    locScore = 0.8
    meta.locationWhy = `Both in ${them.location.split(',')[0].trim()}`
  } else if (me.timezone && me.timezone === them.timezone) {
    locScore = 0.45
    meta.locationWhy = 'Same timezone'
  } else if (me.location || them.location) {
    locScore = 0.12
  }
  put('location', locScore)

  put('availability', availabilityFit(me.availability, them.availability))

  const comms = ctx.sharedCommunities || []
  put('communities', comms.length ? comms.length / 3 : null)
  meta.sharedCommunities = comms

  /* ---------- behavioral ---------- */
  const st = ctx.stats?.get(them.id)
  if (st) {
    put('reciprocity', st.reciprocity)
    put('activity', st.activity)
    put('freshness', st.freshness)
  }
  put('completeness', (them.profileStrength ?? 35) / 100)

  return { features, meta }
}
