import { db } from '../db.js'
import { signToken, signPayload, readPayload } from '../auth.js'
import { API_URL, CLIENT_URL } from '../config.js'
import { computeStrength } from './auth.routes.js'
import { refreshUserEmbedding } from '../engine/index.js'

// ============================================================
// Social sign-in — Google + GitHub (both free). Server-side flow:
//   GET /api/auth/oauth/:provider           → 302 to provider
//   GET /api/auth/oauth/:provider/callback
//        → exchange code → find-or-create user
//        → 302 to  CLIENT_URL/auth/callback#token=…&next=…
// CSRF/state is a short-lived signed JWT, so no session store is
// needed. Providers activate purely from env vars; /api/auth/
// providers tells the SPA which buttons to render.
// (Apple sign-in was dropped — it requires the paid $99/yr Apple
// Developer Program. Re-add as a PROVIDERS entry if that changes.)
// ============================================================

const env = process.env
const callbackUrl = (provider) => `${API_URL}/api/auth/oauth/${provider}/callback`

async function postForm(url, params, headers = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json', ...headers },
    body: new URLSearchParams(params),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error_description || data.error || `token exchange failed (${res.status})`)
  return data
}

const decodeJwt = (token) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())

/* Each provider resolves to the same identity shape:
   { key, email, emailVerified, name, avatar, socials, flags } */
const PROVIDERS = {
  google: {
    enabled: () => !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    authorizeUrl: (state) =>
      'https://accounts.google.com/o/oauth2/v2/auth?' +
      new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: callbackUrl('google'),
        response_type: 'code',
        scope: 'openid email profile',
        prompt: 'select_account',
        state,
      }),
    async identity(code) {
      const tokens = await postForm('https://oauth2.googleapis.com/token', {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: callbackUrl('google'),
        grant_type: 'authorization_code',
      })
      // id_token came straight from Google over TLS — decode, sanity-check the audience
      const claims = decodeJwt(tokens.id_token)
      if (claims.aud !== env.GOOGLE_CLIENT_ID) throw new Error('audience mismatch')
      return {
        key: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified === true,
        name: claims.name,
        avatar: claims.picture,
        flags: { email: true },
      }
    },
  },

  github: {
    enabled: () => !!(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
    authorizeUrl: (state) =>
      'https://github.com/login/oauth/authorize?' +
      new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: callbackUrl('github'),
        scope: 'read:user user:email',
        state,
      }),
    async identity(code) {
      const tokens = await postForm('https://github.com/login/oauth/access_token', {
        code,
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        redirect_uri: callbackUrl('github'),
      })
      const gh = { authorization: `Bearer ${tokens.access_token}`, 'user-agent': 'brivia-club', accept: 'application/vnd.github+json' }
      const user = await (await fetch('https://api.github.com/user', { headers: gh })).json()
      const emails = await (await fetch('https://api.github.com/user/emails', { headers: gh })).json()
      const primary = Array.isArray(emails)
        ? emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified)
        : null
      return {
        key: String(user.id),
        email: primary?.email || user.email,
        emailVerified: !!primary,
        name: user.name || user.login,
        avatar: user.avatar_url,
        socials: { github: user.html_url },
        // real OAuth proof-of-builder — this is the only path that may set it
        flags: { github: true, ...(primary ? { email: true } : {}) },
      }
    },
  },
}

/** Only same-app paths may ride the post-login redirect — no open redirects. */
const sanitizeNext = (next) =>
  typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') ? next : ''

export default async function oauthRoutes(app) {
  // the SPA renders only the buttons that are actually configured
  app.get('/api/auth/providers', async () => ({
    google: PROVIDERS.google.enabled(),
    github: PROVIDERS.github.enabled(),
  }))

  app.get('/api/auth/oauth/:provider', async (req, reply) => {
    const provider = PROVIDERS[req.params.provider]
    if (!provider?.enabled())
      return reply.code(404).send({ error: 'This sign-in method is not configured yet' })
    const state = signPayload({ oauth: req.params.provider, next: sanitizeNext(req.query.next) }, '10m')
    return reply.redirect(provider.authorizeUrl(state))
  })

  app.get('/api/auth/oauth/:provider/callback', async (req, reply) => {
      const back = (error) =>
        reply.redirect(`${CLIENT_URL}/login?error=${encodeURIComponent(error)}`)

      const name = req.params.provider
      const provider = PROVIDERS[name]
      if (!provider?.enabled()) return back('This sign-in method is not configured yet')

      const src = req.query || {}
      if (src.error) return back('Sign-in was cancelled')

      const state = readPayload(src.state)
      if (!state || state.oauth !== name) return back('Sign-in expired — please try again')

      let identity
      try {
        identity = await provider.identity(src.code)
      } catch (err) {
        req.log.warn({ err }, `oauth ${name} failed`)
        return back(`Could not sign in with ${name} — please try again`)
      }
      const email = identity.email?.toLowerCase()
      if (!email) return back(`Your ${name} account did not share an email address`)

      // 1) returning social user  2) same-email link  3) brand-new member
      const linked = await db.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider: name, providerAccountId: identity.key } },
      })
      let user = linked && (await db.user.findUnique({ where: { id: linked.userId } }))
      let isNew = false

      if (!user) {
        user = await db.user.findUnique({ where: { email } })
        // never attach a provider to an existing account on an unverified email claim
        if (user && !identity.emailVerified)
          return back(`Verify the email on your ${name} account first`)
        if (!user) {
          isNew = true
          const display = identity.name || email.split('@')[0]
          const handle =
            display.toLowerCase().replace(/[^a-z0-9]+/g, '') + Math.random().toString(36).slice(2, 6)
          user = await db.user.create({
            data: {
              name: display,
              email,
              password: null, // social-only until they set one via reset
              handle,
              avatar:
                identity.avatar ||
                `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(display)}&backgroundColor=c8102e&textColor=ffffff`,
            },
          })
        }
        await db.oAuthAccount.create({
          data: { userId: user.id, provider: name, providerAccountId: identity.key, email },
        })
      }

      const verified = { ...(user.verified || {}), ...identity.flags }
      const badges = user.badges.includes('verified') ? user.badges : [...user.badges, 'verified']
      const socials = identity.socials ? { ...(user.socials || {}), ...identity.socials } : user.socials
      user = await db.user.update({
        where: { id: user.id },
        data: { verified, badges, socials: socials ?? undefined },
      })
      await db.user.update({
        where: { id: user.id },
        data: { profileStrength: computeStrength(user) },
      })
      if (isNew)
        refreshUserEmbedding(user).catch((err) =>
          console.warn('[oauth] embedding refresh failed:', err.message)
        )

      const fragment = new URLSearchParams({
        token: signToken(user),
        next: state.next || '',
        newuser: isNew ? '1' : '0',
      })
      return reply.redirect(`${CLIENT_URL}/auth/callback#${fragment}`)
  })
}
