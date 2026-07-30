// ============================================================
// Canonical URLs + origin allowlist, resolved once at boot.
// API_URL   — public base of this API (OAuth redirect URIs)
// CLIENT_URL — public base of the SPA (email links, OAuth return)
// In the single-origin deploy (Render serves dist/) both point at
// the same host; in a split deploy (Vercel SPA + Render API) they
// differ and CORS_ORIGINS must list every SPA origin.
// ============================================================

const strip = (u) => (u ? u.replace(/\/+$/, '') : undefined)

export const isProd = process.env.NODE_ENV === 'production'

export const API_URL = strip(process.env.API_URL) || `http://localhost:${process.env.PORT || 4200}`
export const CLIENT_URL = strip(process.env.CLIENT_URL) || (isProd ? API_URL : 'http://localhost:5173')

const listed = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => strip(s.trim()))
  .filter(Boolean)

// dev stays open; prod locks to the explicit list (or the client origin)
export const corsOrigin = isProd ? (listed.length ? listed : [CLIENT_URL]) : true
