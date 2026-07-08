import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { initRealtime } from './realtime.js'
import authRoutes from './routes/auth.routes.js'
import deckRoutes from './routes/deck.routes.js'
import chatRoutes from './routes/chat.routes.js'
import socialRoutes from './routes/social.routes.js'
import metaRoutes from './routes/meta.routes.js'
import adminRoutes from './routes/admin.routes.js'

/* Brivia API — modular monolith. Each route module is a future
   service boundary; the process is stateless (JWT + Postgres +
   Socket.IO), so it scales horizontally behind a load balancer. */

const app = Fastify({ logger: { level: 'warn' } })

await app.register(cors, { origin: true })

app.get('/api/health', async () => ({ ok: true, service: 'brivia-api' }))

await app.register(authRoutes)
await app.register(deckRoutes)
await app.register(chatRoutes)
await app.register(socialRoutes)
await app.register(metaRoutes)
await app.register(adminRoutes)

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
