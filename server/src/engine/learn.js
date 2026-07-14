import { db } from '../db.js'
import { PRIOR, STEEPNESS, MIDPOINT } from './weights.js'

/* ============================================================
   Online learning — every swipe is a labeled example.

   LIKE/SUPER → y=1, PASS → y=0 against the feature vector the
   card was SERVED with. One SGD step on logistic loss, with an
   L2 pull back toward the shared PRIOR so ten angry passes
   can't lobotomize a deck. Learning rate decays as evidence
   accumulates: early swipes teach big, later swipes fine-tune.

   Result: two members with identical profiles get different
   decks within ~15 swipes. That's the moat — the engine learns
   each member's taste, and it's inspectable (named weights,
   not a black box).
   ============================================================ */

const sigmoid = (z) => 1 / (1 + Math.exp(-z))
const CLIP = [-1.5, 4]
const LAMBDA = 0.03 // pull toward prior

export async function getTaste(userId) {
  const row = await db.tasteProfile.findUnique({ where: { userId } })
  if (!row) return { weights: { ...PRIOR }, samples: 0 }
  return { weights: { ...PRIOR, ...row.weights }, samples: row.samples }
}

/** One SGD step from a swipe. Fire-and-forget from the route. */
export async function learnFromSwipe(userId, features, action) {
  if (!features || !Object.keys(features).length) return
  const y = action === 'PASS' ? 0 : 1
  const { weights, samples } = await getTaste(userId)

  // current prediction with the member's own brain
  let num = 0
  let den = 0
  for (const [k, w] of Object.entries(weights)) {
    const f = features[k]
    if (f == null) continue
    num += w * f
    den += Math.abs(w)
  }
  const p = sigmoid(STEEPNESS * ((den ? num / den : 0) - MIDPOINT))

  // passes are weak evidence (mood, photo, timing); likes are strong.
  // early swipes teach fast, later ones fine-tune — but never twitchy.
  const lr = (0.3 / (1 + samples / 40)) * (y === 0 ? 0.5 : 1)
  const err = p - y // >0 means "engine liked them more than the member did"
  const next = { ...weights }
  for (const [k, f] of Object.entries(features)) {
    if (f == null || next[k] == null) continue
    const grad = err * f + LAMBDA * (next[k] - (PRIOR[k] ?? 0))
    next[k] = Math.max(CLIP[0], Math.min(CLIP[1], next[k] - lr * grad))
  }

  await db.tasteProfile.upsert({
    where: { userId },
    create: { userId, weights: next, samples: 1 },
    update: { weights: next, samples: { increment: 1 } },
  })
}
