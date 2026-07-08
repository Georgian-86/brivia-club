# Brivia API

Fastify + Prisma + PostgreSQL + Socket.IO. A **modular monolith**: one deployable process,
but every route module (`auth`, `deck`, `chat`, `social`, `meta`, `admin`) is a future
service boundary, and the matching engine (`src/matching.js`) is a pure function ready to
extract.

## Run it

```bash
docker compose up -d          # Postgres 16 on :5433 (from repo root)
cd server
npm install
npx prisma migrate dev        # apply schema
npm run seed                  # seed the club (idempotent)
npm run dev                   # API on :4200 (frontend proxies /api + /socket.io)
```

**Demo login:** `mohit@brivia.club` / `brivia123` (admin).
Every seeded member: `<handle>@brivia.club` / `brivia123` (e.g. `sara@`, `zoya@`).

## Architecture

```
React SPA (Vite, CDN-served)
   │  /api (REST, JWT)          /socket.io (chat + notifications)
   ▼                             ▼
Fastify ── routes → services → Prisma ──► PostgreSQL 16
   │
   └─ matching.js  (pure scoring: complementarity + interests +
                    communities + timezone + availability + intent)
```

Stateless by design — JWT auth, DB-backed everything, socket rooms keyed by user id.
That means N replicas behind a load balancer work today, with one addition:

## Scale path (in order, only when the metric demands it)

1. **Redis** — Socket.IO adapter for cross-replica fan-out, per-user deck cache (1h TTL),
   rate limiting on swipes/messages.
2. **PgBouncer + read replicas** — Prisma points writes at primary, heavy reads
   (deck candidates, search) at replicas.
3. **Batch scoring** — nightly job precomputes `match_scores`; `/deck` becomes an
   indexed read. `pgvector` for skill/bio embeddings; `matching.js` becomes the re-ranker.
4. **Extract services** — matching engine first (it's already a pure module), then chat.
5. **Object storage (S3/R2)** — avatars, covers, video intros, resumes, voice notes.

## Hardening before real users

- Refresh-token rotation (access 15m / refresh 7d, httpOnly) — replace the single 7d JWT
- Rate limiting (`@fastify/rate-limit`) + request schema validation on every route
- Report/block endpoints wired to the moderation queue (strategy doc §12 is Phase-0)
- Real verification: college-email OTP, GitHub/LinkedIn OAuth behind `/users/me/verify/:key`
- TypeScript migration module-by-module; OpenTelemetry traces; Sentry
