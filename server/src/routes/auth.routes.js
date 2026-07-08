import { db } from '../db.js'
import { hashPassword, checkPassword, signToken, requireAuth } from '../auth.js'
import { fullMe } from '../serialize.js'

const PROFILE_FIELDS = [
  'name', 'headline', 'bio', 'roleTitle', 'org', 'campus', 'location', 'timezone',
  'avatar', 'cover', 'tag', 'skills', 'interests', 'languages', 'personality',
  'industries', 'purposes', 'lookingFor', 'availability', 'workStyle',
  'openToWork', 'openToCollab', 'hasVideo', 'experience', 'education',
  'achievements', 'certifications', 'startup', 'socials',
]

/** Profile strength is computed, never stored by hand. */
export function computeStrength(u) {
  let s = 20
  if (u.bio) s += 10
  if ((u.skills || []).length >= 4) s += 12
  if ((u.interests || []).length >= 2) s += 8
  if (u.availability) s += 8
  if (u.lookingFor) s += 8
  if (u.hasVideo) s += 9
  const v = u.verified || {}
  s += ['email', 'phone', 'github', 'linkedin', 'college', 'company'].filter((k) => v[k]).length * 4
  if ((u.experience || []).length) s += 6
  return Math.min(100, s)
}

export default async function authRoutes(app) {
  app.post('/api/auth/register', async (req, reply) => {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return reply.code(400).send({ error: 'Name, email and password are required' })
    if (await db.user.findUnique({ where: { email: email.toLowerCase() } }))
      return reply.code(409).send({ error: 'That email is already in the club — log in instead' })

    const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, '') + Math.random().toString(36).slice(2, 6)
    const user = await db.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: await hashPassword(password),
        handle,
        avatar: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=c8102e&textColor=ffffff`,
        verified: { email: true },
      },
    })
    return { token: signToken(user), me: fullMe(user) }
  })

  app.post('/api/auth/login', async (req, reply) => {
    const { email, password } = req.body || {}
    const user = await db.user.findUnique({ where: { email: (email || '').toLowerCase() } })
    if (!user || !(await checkPassword(password || '', user.password)))
      return reply.code(401).send({ error: 'Wrong email or password' })
    return { token: signToken(user), me: fullMe(user) }
  })

  app.get('/api/auth/me', { preHandler: requireAuth }, async (req, reply) => {
    const user = await db.user.findUnique({ where: { id: req.userId } })
    if (!user) return reply.code(401).send({ error: 'Account not found' })
    return { me: fullMe(user) }
  })

  app.patch('/api/users/me', { preHandler: requireAuth }, async (req) => {
    const data = {}
    for (const k of PROFILE_FIELDS) if (k in (req.body || {})) data[k] = req.body[k]
    let user = await db.user.update({ where: { id: req.userId }, data })
    user = await db.user.update({
      where: { id: req.userId },
      data: { profileStrength: computeStrength(user) },
    })
    return { me: fullMe(user) }
  })

  // start a verification check — v0 marks it done instantly; real
  // OAuth/OTP providers slot in behind this same endpoint
  app.post('/api/users/me/verify/:key', { preHandler: requireAuth }, async (req) => {
    const { key } = req.params
    const user = await db.user.findUnique({ where: { id: req.userId } })
    const verified = { ...(user.verified || {}), [key]: true }
    const badges = user.badges.includes('verified') ? user.badges : [...user.badges, 'verified']
    const updated = await db.user.update({ where: { id: req.userId }, data: { verified, badges } })
    await db.user.update({ where: { id: req.userId }, data: { profileStrength: computeStrength(updated) } })
    return { verified }
  })
}
