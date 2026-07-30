# Auth — setup & operations

The API owns every flow; the SPA only renders buttons and landing pages.
**Free stack by design**: Gmail SMTP for mail, Google + GitHub for social
sign-in — no paid service anywhere. Providers and email **activate purely
from env vars** — nothing is hardcoded, `GET /api/auth/providers` tells the
SPA which social buttons to show, and with no `SMTP_USER`/`SMTP_PASS` every
mail prints to server stdout so the flows are fully testable locally.

> Apple sign-in is intentionally absent: it requires the paid ($99/yr) Apple
> Developer Program. If that's ever approved, re-add a provider entry in
> `src/routes/oauth.routes.js` (git history has a working implementation).

## What exists

| Flow | Endpoints | Notes |
|---|---|---|
| Email + password signup | `POST /api/auth/register` | sends a verification link; `verified.email` is **no longer auto-set** |
| Email verification | `GET /api/auth/verify-email?token=…` → redirects to `{CLIENT_URL}/verify-email?status=ok\|expired` | link lasts 24 h, single-use |
| Resend verification | `POST /api/auth/resend-verification` (authed) | also wired to the Profile "email" verify tile |
| Login | `POST /api/auth/login` | social-only accounts get told which button to use |
| Forgot password | `POST /api/auth/forgot-password` | always 200 (no account enumeration); link lasts 30 min |
| Reset password | `POST /api/auth/reset-password` | proves mailbox ownership → also sets `verified.email`; returns a session |
| Google / GitHub | `GET /api/auth/oauth/:provider?next=/app` → provider → `GET /api/auth/oauth/:provider/callback` → `{CLIENT_URL}/auth/callback#token=…` | state = signed 10-min JWT (no session store); token travels in the URL **fragment** |
| Provider discovery | `GET /api/auth/providers` | `{ google, github }` booleans |

Account linking: a social login with a **verified** provider email attaches to
an existing account with the same email; unverified provider emails are
rejected. New social users get `password = null` — they can add a password
later via the reset flow.

Hardening shipped alongside: JWT fails closed in prod (no more `dev-secret`
fallback), CORS + Socket.IO locked to `CLIENT_URL`/`CORS_ORIGINS` in prod,
`@fastify/helmet`, global rate limit (300/min/IP) with tight budgets on auth
routes (register 5/min, login 10/min, forgot/reset 5/min, resend 3/min),
`trustProxy` for real client IPs behind Render/Vercel.

## Environment variables

See [server/.env.example](../server/.env.example) — every var is documented
there with the exact redirect URI each console needs.

## Provider setup (all free)

### Gmail SMTP (email) — 5 minutes
1. Pick the sending Gmail account (a dedicated one like
   `brivia.club.mail@gmail.com` keeps the personal inbox out of prod).
2. Google Account → **Security** → turn ON **2-Step Verification** (App
   Passwords don't exist without it).
3. Security → **App passwords** → app "Mail" → copy the 16-character code.
4. Set `SMTP_USER=<the address>`, `SMTP_PASS=<the app password>`,
   `EMAIL_FROM=The Brivia Club <the address>`.

Notes: Gmail rewrites the From *address* to `SMTP_USER` (the display name
sticks) unless you configure that address as a "Send mail as" alias in Gmail
settings. Free quota is roughly **500 recipients/day** (~2,000 on Google
Workspace) — plenty for beta; if campus volume ever exceeds it, we pick a
bigger relay together first (most are paid).

### Google sign-in — 15 minutes
1. console.cloud.google.com → create project `brivia-club` (free).
2. **APIs & Services → OAuth consent screen**: External, app name, support
   email, domain. Publish (staying in "testing" = only allowlisted users).
3. **Credentials → Create → OAuth client ID → Web application**:
   - Authorized JavaScript origins: `https://brivia.club`, `http://localhost:5173`
   - Authorized redirect URIs: `https://api.brivia.club/api/auth/oauth/google/callback`,
     `http://localhost:4200/api/auth/oauth/google/callback`
4. Copy `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

### GitHub sign-in — 5 minutes
1. github.com/settings/developers → **New OAuth App** (use the org account).
2. Homepage `https://brivia.club`; callback
   `https://api.brivia.club/api/auth/oauth/github/callback` (one app per
   environment — make a second app with the localhost callback for dev).
3. Copy `GITHUB_CLIENT_ID`, generate a client secret.
   GitHub sign-in doubles as **real builder verification** — it's the only
   path that sets `verified.github` and imports the profile link.

## Redirect map (what talks to what)

```
SPA /login ── click ──▶ API /api/auth/oauth/google ──302──▶ Google consent
Google ──302──▶ API /api/auth/oauth/google/callback
API ──302──▶ SPA /auth/callback#token=…&next=/app&newuser=0|1
SPA stores token → /app (or /onboarding for new users)

signup email link ──▶ API /api/auth/verify-email?token=…
API ──302──▶ SPA /verify-email?status=ok|expired

reset email link ──▶ SPA /reset-password?token=… ──POST──▶ API reset → session
```

After changing domains, update **all three**: provider consoles (redirect
URIs), Render env (`API_URL`, `CLIENT_URL`, `CORS_ORIGINS`), Vercel env
(`VITE_API_URL`) — then redeploy the SPA (Vite bakes env at build time).

## Custom domain on Vercel (SPA)

1. Vercel → your project → **Settings → Domains** → Add → `brivia.club` and
   `www.brivia.club` (CLI: `vercel domains add brivia.club`).
2. At your registrar add the records Vercel shows:
   - apex `brivia.club` → **A `76.76.21.21`**
   - `www` → **CNAME `cname.vercel-dns.com`**
   (or switch the domain's nameservers to Vercel and skip manual records)
3. Wait for DNS + auto-TLS (minutes to ~1 h). Pick ONE canonical host —
   set `brivia.club` as primary so `www` 308-redirects to it.
4. Vercel → Settings → **Environment Variables**: `VITE_API_URL=https://api.brivia.club`
   → redeploy.
5. Render → the API service → **Settings → Custom Domains** → add
   `api.brivia.club` → registrar: CNAME `api` → `<service>.onrender.com`.
6. Render env: `API_URL=https://api.brivia.club`,
   `CLIENT_URL=https://brivia.club`, and re-point both OAuth consoles at the
   new hosts.

Single-origin alternative (no Vercel): the API already serves the built SPA —
point the apex at Render instead and skip `VITE_API_URL` entirely. Fewer
moving parts, no CORS, sockets stay first-class; Vercel wins on static-asset
CDN + preview deploys. Both are wired — choose per environment.

Cost note: Vercel Hobby, Render free tier, Supabase free tier, Gmail SMTP,
Google/GitHub OAuth — all ₹0. The only unavoidable spend is the domain name
itself (~₹800–2500/yr at the registrar). Render's free tier sleeps after
~15 min idle (≈30 s cold start) — upgrading to Starter is a paid decision to
make together closer to launch.
