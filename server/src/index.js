import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { corsOrigin } from './config.js'
import { initRealtime } from './realtime.js'
import { warmupEmbeddings } from './engine/index.js'
import authRoutes from './routes/auth.routes.js'
import oauthRoutes from './routes/oauth.routes.js'
import deckRoutes from './routes/deck.routes.js'
import chatRoutes from './routes/chat.routes.js'
import socialRoutes from './routes/social.routes.js'
import metaRoutes from './routes/meta.routes.js'
import adminRoutes from './routes/admin.routes.js'
import uploadRoutes from './routes/uploads.routes.js'
import teamRoutes from './routes/teams.routes.js'

/* Brivia API — modular monolith. Each route module is a future
   service boundary; the process is stateless (JWT + Postgres +
   Socket.IO), so it scales horizontally behind a load balancer. */

// trustProxy: Render/Vercel sit behind a proxy — rate limits must
// key on the real client IP, not the load balancer's.
const app = Fastify({ logger: { level: 'warn' }, trustProxy: true })

await app.register(helmet, { contentSecurityPolicy: false, crossOriginEmbedderPolicy: false })
await app.register(cors, { origin: corsOrigin })
// global ceiling; auth routes declare tighter per-route budgets
await app.register(rateLimit, { max: 300, timeWindow: '1 minute' })

app.get('/api/health', async () => ({ ok: true, service: 'brivia-api' }))

await app.register(authRoutes)
await app.register(oauthRoutes)
await app.register(deckRoutes)
await app.register(chatRoutes)
await app.register(socialRoutes)
await app.register(metaRoutes)
await app.register(adminRoutes)
await app.register(uploadRoutes)
await app.register(teamRoutes)

// In prod the API serves the built SPA too — one origin, one deploy,
// no CORS, and Socket.IO shares the port. CDN goes in front later.
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist')
if (existsSync(dist)) {
  await app.register(fastifyStatic, {
    root: dist,
    immutable: true,
    maxAge: '7d',
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) res.setHeader('cache-control', 'no-cache')
    },
  })
  app.setNotFoundHandler((req, reply) => {
    if (req.raw.url.startsWith('/api') || req.raw.url.startsWith('/socket.io')) {
      return reply.code(404).send({ error: 'Not found' })
    }
    return reply.type('text/html').sendFile('index.html') // SPA fallback
  })
}

initRealtime(app.server)

const port = Number(process.env.PORT || 4200)
await app.listen({ port, host: '0.0.0.0' })
console.log(`⚡ Brivia API on :${port}`)

// load the embedding model off the boot path — first search/signup stays fast
warmupEmbeddings()
