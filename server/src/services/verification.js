import crypto from 'node:crypto'
import { db } from '../db.js'

// ============================================================
// Single-use auth tokens (email verification, password reset).
// Only the sha256 of the token ever touches the database — a DB
// leak cannot be replayed as a live link.
// ============================================================

const TTL_MINUTES = {
  EMAIL_VERIFY: 60 * 24, // a day to click the signup link
  PASSWORD_RESET: 30,
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex')

/** Issue a fresh token for user+kind, invalidating any previous one. */
export async function issueToken(userId, kind) {
  const raw = crypto.randomBytes(32).toString('base64url')
  await db.authToken.deleteMany({ where: { userId, kind } })
  await db.authToken.create({
    data: {
      userId,
      kind,
      tokenHash: sha(raw),
      expiresAt: new Date(Date.now() + TTL_MINUTES[kind] * 60_000),
    },
  })
  return raw
}

/** Redeem a token exactly once. Returns the userId, or null if invalid/expired/used. */
export async function consumeToken(raw, kind) {
  if (!raw) return null
  const token = await db.authToken.findUnique({ where: { tokenHash: sha(String(raw)) } })
  if (!token || token.kind !== kind || token.usedAt || token.expiresAt < new Date()) return null
  await db.authToken.update({ where: { id: token.id }, data: { usedAt: new Date() } })
  return token.userId
}
