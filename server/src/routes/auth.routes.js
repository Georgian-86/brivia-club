import { db } from '../db.js'
import { hashPassword, checkPassword, signToken, requireAuth } from '../auth.js'
import { fullMe } from '../serialize.js'
import { refreshUserEmbedding } from '../engine/index.js'
import { sendMail, authEmail } from '../services/mailer.js'
import { issueToken, consumeToken } from '../services/verification.js'
import { API_URL, CLIENT_URL } from '../config.js'

// embeddings refresh off the request path — signup/edit must stay fast
const reembed = (user) =>
  refreshUserEmbedding(user).catch((err) => console.warn('[auth] embedding refresh failed:', err.message))

const PROFILE_FIELDS = [
  'name', 'headline', 'bio', 'roleTitle', 'org', 'campus', 'location', 'timezone',
  'avatar', 'cover', 'tag', 'skills', 'interests', 'languages', 'personality',
  'industries', 'purposes', 'lookingFor', 'availability', 'workStyle',
  'openToWork', 'openToCollab', 'hasVideo', 'experience', 'education',
  'achievements', 'certifications', 'startup', 'socials',
]

// these are earned through real flows now — never self-served
const REAL_VERIFICATION = { email: 'the verification email', github: 'GitHub sign-in' }

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

/** Fire-and-forget the signup verification mail — never blocks the response. */
function sendVerificationMail(user) {
  return issueToken(user.id, 'EMAIL_VERIFY')
    .then((raw) =>
      sendMail({
        to: user.email,
        subject: 'Verify your email — The Brivia Club',
        ...authEmail({
          title: `Welcome to the club, ${user.name.split(' ')[0]}.`,
          body: 'One click and your profile carries a real verified-email badge — decks, matches and invites all trust it.',
          ctaLabel: 'Verify my email',
          ctaUrl: `${API_URL}/api/auth/verify-email?token=${raw}`,
          footnote: 'This link lasts 24 hours. If you did not create a Brivia Club account, ignore this email.',
        }),
      })
    )
    .catch((err) => console.warn('[auth] verification mail failed:', err.message))
}

export default async function authRoutes(app) {
  const tight = (max) => ({ config: { rateLimit: { max, timeWindow: '1 minute' } } })

  app.post('/api/auth/register', tight(5), async (req, reply) => {
    const { name, email, password } = req.body || {}
    if (!name || !email || !password) return reply.code(400).send({ error: 'Name, email and password are required' })
    if (password.length < 6) return reply.code(400).send({ error: 'Password needs at least 6 characters' })
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
        // honest default: {} — the badge appears when the link is clicked
        verified: {},
      },
    })
    reembed(user)
    sendVerificationMail(user)
    return { token: signToken(user), me: fullMe(user), verificationSent: true }
  })

  app.post('/api/auth/login', tight(10), async (req, reply) => {
    const { email, password } = req.body || {}
    const user = await db.user.findUnique({ where: { email: (email || '').toLowerCase() } })
    if (!user) return reply.code(401).send({ error: 'Wrong email or password' })
    if (!user.password) {
      const linked = await db.oAuthAccount.findMany({ where: { userId: user.id }, select: { provider: true } })
      const names = [...new Set(linked.map((a) => a.provider))].join(' / ') || 'social sign-in'
      return reply.code(401).send({
        error: `This account signs in with ${names} — use that button, or "Forgot password" to add a password`,
      })
    }
    if (!(await checkPassword(password || '', user.password)))
      return reply.code(401).send({ error: 'Wrong email or password' })
    return { token: signToken(user), me: fullMe(user) }
  })

  // clicked from the email — lands the user on a friendly SPA page either way
  app.get('/api/auth/verify-email', async (req, reply) => {
    const userId = await consumeToken(req.query.token, 'EMAIL_VERIFY')
    if (!userId) return reply.redirect(`${CLIENT_URL}/verify-email?status=expired`)
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return reply.redirect(`${CLIENT_URL}/verify-email?status=expired`)
    const verified = { ...(user.verified || {}), email: true }
    const badges = user.badges.includes('verified') ? user.badges : [...user.badges, 'verified']
    const updated = await db.user.update({ where: { id: userId }, data: { verified, badges } })
    await db.user.update({ where: { id: userId }, data: { profileStrength: computeStrength(updated) } })
    return reply.redirect(`${CLIENT_URL}/verify-email?status=ok`)
  })

  app.post('/api/auth/resend-verification', { preHandler: requireAuth, ...tight(3) }, async (req) => {
    const user = await db.user.findUnique({ where: { id: req.userId } })
    if (user?.verified?.email) return { ok: true, already: true }
    if (user) await sendVerificationMail(user)
    return { ok: true }
  })

  // always 200 — the response must not reveal whether an email is registered
  app.post('/api/auth/forgot-password', tight(5), async (req) => {
    const email = (req.body?.email || '').toLowerCase()
    const user = email && (await db.user.findUnique({ where: { email } }))
    if (user) {
      const raw = await issueToken(user.id, 'PASSWORD_RESET')
      sendMail({
        to: user.email,
        subject: 'Reset your password — The Brivia Club',
        ...authEmail({
          title: 'Reset your password',
          body: `Someone (hopefully you) asked to reset the password for ${user.email}. The link below works once and expires in 30 minutes.`,
          ctaLabel: 'Choose a new password',
          ctaUrl: `${CLIENT_URL}/reset-password?token=${raw}`,
          footnote: 'If this was not you, your account is safe — the link simply expires.',
        }),
      }).catch((err) => console.warn('[auth] reset mail failed:', err.message))
    }
    return { ok: true }
  })

  app.post('/api/auth/reset-password', tight(5), async (req, reply) => {
    const { token, password } = req.body || {}
    if (!password || password.length < 6)
      return reply.code(400).send({ error: 'Password needs at least 6 characters' })
    const userId = await consumeToken(token, 'PASSWORD_RESET')
    if (!userId) return reply.code(400).send({ error: 'This reset link expired — request a new one' })
    let user = await db.user.findUnique({ where: { id: userId } })
    if (!user) return reply.code(400).send({ error: 'Account not found' })
    // completing the email round-trip proves mailbox ownership too
    const verified = { ...(user.verified || {}), email: true }
    user = await db.user.update({
      where: { id: userId },
      data: { password: await hashPassword(password), verified },
    })
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
    reembed(user)
    return { me: fullMe(user) }
  })

  // legacy self-serve verification — email/github now require the real
  // flows above, and no key grants the "verified" badge from here.
  app.post('/api/users/me/verify/:key', { preHandler: requireAuth }, async (req, reply) => {
    const { key } = req.params
    if (REAL_VERIFICATION[key])
      return reply.code(400).send({ error: `${key} is verified through ${REAL_VERIFICATION[key]}` })
    const user = await db.user.findUnique({ where: { id: req.userId } })
    const verified = { ...(user.verified || {}), [key]: true }
    const updated = await db.user.update({ where: { id: req.userId }, data: { verified } })
    await db.user.update({ where: { id: req.userId }, data: { profileStrength: computeStrength(updated) } })
    return { verified }
  })
}
