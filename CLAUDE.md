# Brivia Club (legacy backend and engine reference)

This repo holds the **older** Brivia Club: Fastify, Prisma, Postgres/pgvector, and matching engine v1 in
`server/src/engine/`. The product UI and the source of truth for the product's aim now live in
**`brivia-club-v1`**. Read its `CLAUDE.md`, `docs/VISION.md` and `docs/ORBIT_ENGINE.md` before changing anything here.

- What to reuse from here: embeddings (`embeddings.js`, `store.js`), the interaction log, per-member taste learning
  (`learn.js`), MMR diversity and exploration (`candidates.js`), and evidence-only explanations (`weights.js` `explain`).
- What is being replaced: the scoring model (`features.js` + `weights.js` PRIOR). It is builder/team-formation
  oriented, and location carries only ~5% of the score. See `brivia-club-v1/docs/ENGINE_AUDIT.md`.
- `docs/MATCHING.md` describes engine v1 as shipped. `docs/STRATEGY.md` is the original builder-focused strategy,
  now superseded by `brivia-club-v1/docs/VISION.md`.
