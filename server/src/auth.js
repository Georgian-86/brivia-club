import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from './db.js'

// Fail closed: a prod boot without JWT_SECRET must crash, not fall
// back to a publicly known signing key.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production')
  throw new Error('JWT_SECRET is required in production')
const SECRET = process.env.JWT_SECRET || 'dev-secret'
const TOKEN_TTL = '7d'

export const hashPassword = (plain) => bcrypt.hash(plain, 10)
export const checkPassword = (plain, hash) => bcrypt.compare(plain, hash)

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: TOKEN_TTL })

export const verifyToken = (token) => jwt.verify(token, SECRET)

// short-lived signed blobs (OAuth state etc.) — same key, tiny TTLs
export const signPayload = (payload, ttl) => jwt.sign(payload, SECRET, { expiresIn: ttl })
export const readPayload = (token) => {
  try {
    return jwt.verify(token, SECRET)
  } catch {
    return null
  }
}

/** Fastify preHandler — attaches req.userId / req.userRole or 401s. */
export async function requireAuth(req, reply) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return reply.code(401).send({ error: 'Not authenticated' })
  try {
    const payload = verifyToken(token)
    req.userId = payload.sub
    req.userRole = payload.role
  } catch {
    return reply.code(401).send({ error: 'Session expired' })
  }
}

export async function requireAdmin(req, reply) {
  await requireAuth(req, reply)
  if (reply.sent) return
  if (req.userRole !== 'ADMIN') return reply.code(403).send({ error: 'Admin only' })
}

export const getUser = (id) => db.user.findUnique({ where: { id } })
