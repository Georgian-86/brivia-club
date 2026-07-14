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

## AI Assistant (`/api/assistant`)

Provider-abstracted in `src/services/assistant.js` — `answer(viewer, q, history)` always
returns `{ text, people[], follow }`, so the client never changes.

- **`heuristic` (default, FREE, no key):** a scored intent engine over the real matching
  engine (`scoredPeople`) + the viewer's graph — handles find-a-role, who-viewed-me,
  review-my-profile, what-to-build, music/hackathon/co-founder intents. Zero external calls.
- **`claude` (optional, PAID):** set `ASSISTANT_PROVIDER=claude` **and** `ANTHROPIC_API_KEY`.
  Uses `@anthropic-ai/sdk` (`npm i @anthropic-ai/sdk` in `server/`) with tool-use
  (`claude-opus-4-8`) so the model answers from real data, not hallucinations. The Anthropic
  API is **paid, usage-based — there is no free tier**; the code ships dormant and falls back
  to the heuristic engine on any error. A free-tier LLM (e.g. Gemini) can slot into the same
  `answer()` interface later.

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
5. **Object storage** — ✅ live via **Supabase Storage** (`src/storage.js`, bucket `brivia-uploads`).
   Client asks `POST /api/uploads/sign` for a signed URL, PUTs the file straight to Supabase, then
   PATCHes the public URL onto its record. Needs `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` in `.env`
   (service_role — server-only). Powers avatar / cover / resume uploads + project & team creation.

## Hardening before real users

- Refresh-token rotation (access 15m / refresh 7d, httpOnly) — replace the single 7d JWT
- Rate limiting (`@fastify/rate-limit`) + request schema validation on every route
- Report/block endpoints wired to the moderation queue (strategy doc §12 is Phase-0)
- Real verification: college-email OTP, GitHub/LinkedIn OAuth behind `/users/me/verify/:key`
- TypeScript migration module-by-module; OpenTelemetry traces; Sentry
