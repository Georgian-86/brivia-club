# The Brivia Matching Engine

*v1 — shipped 2026-07-14. Replaces the v0 heuristic (`matching.js scoreMatch`) end to end.*

Every surface that ranks a person — deck, home, search, hubs, assistant — runs through
`server/src/engine/`. One engine, one score, one explanation language.

## Why this is a moat, not a feature

1. **Bidirectional intent matching.** Every member is embedded twice: a *profile vector*
   ("who I am": bio, skills, interests, industries) and an *intent vector* ("who I'm looking
   for": purposes, lookingFor, availability). A match is scored cross-wise — *my intent vs
   their profile* AND *their intent vs my profile*. Dating apps match similar people; team
   formation needs "they are what I need, and I am what they need." Nobody in the campus
   space does this.
2. **A taste model per member.** Every like/pass is an online-SGD step on that member's own
   feature weights. Two people with identical profiles get different decks within ~15 swipes.
   The engine literally learns what each member values — and because the weights are named
   (not a neural blob), we can always say *why*.
3. **Explainable evidence.** Every score ships with why-chips generated from the top real
   contributions — actual skill names, actual shared interests, actual location tier. The
   engine never invents a reason; below-threshold features can't produce a chip.
4. **Honest calibration.** No 40-point floor. Scores follow `25 + 74·σ(K·(m − M0))` over
   evidence-weighted features; a nothing-in-common pair really does score in the 30s. On the
   current network: p10=46, p50=54, p90=90. Believability *is* the product (BRV-015 spirit).

## The four layers

| Layer | Signals | Files |
|---|---|---|
| Semantic | intent↔profile cross-fit ×2, profile affinity (pgvector cosine) | `text.js`, `embeddings.js`, `store.js` |
| Structured | purposes+tag (heaviest), lookingFor↔skills both ways, skill complementarity, interests, industries, languages, personality, workStyle, location ladder (campus>city>timezone), availability bands, shared communities | `features.js` |
| Behavioral | reciprocity (Wilson lower bound on like-back rate), activity decay, freshness boost, profile completeness | `stats.js` |
| Learned | per-member weight vector, SGD on every swipe, L2-pulled toward the shared prior | `learn.js` |

Missing data is **absent, not zero** — the scorer renormalizes over present evidence, so a
sparse profile gets an honest mid score instead of a punished one, and a fuller profile
genuinely unlocks better matching (profile completion now has teeth).

## Candidate selection (the BRV-006 fix)

`candidates.js` unions four sources instead of `findMany take:400`:
ANN nearest-neighbors on both intent directions (HNSW-indexed), recently-active members,
newest members, and a **rotating daily window** ordered by `md5(id‖viewer‖day)` — every
member is reachable in some deck within days, at any network size. After scoring, decks get
a greedy MMR diversity pass (profile-vector de-duplication) plus a deterministic epsilon
exploration slot (~18% of decks carry one wildcard, tagged `deck:explore` in the log).

## The interaction log (BRV-025 foundation)

Every serve and swipe appends to `Interaction` **with the exact feature vector scored at
serve time**: `deck_served | like | pass | super | match`, context `deck | home | search |
hub | direct (+':explore')`. This is the training set for the v2 learned re-ranker — it
started accruing the day this shipped.

## Embedding providers

Same pattern as the assistant — free default, env-flag upgrades:

| `EMBEDDINGS_PROVIDER` | What happens |
|---|---|
| *(unset)* / `local` | MiniLM (384-dim) via `@huggingface/transformers`, quantized ONNX, CPU, in-process. ~30MB one-time model download, then offline. No key, no per-call cost. |
| `openai` (+ `OPENAI_API_KEY`) | `text-embedding-3-small` at `dimensions:384` — same column shape, drop-in. |
| `none` | Semantic features drop out; structured+behavioral+learned layers keep decks alive. |

The engine **degrades gracefully**: if the model can't load, matching still works. Empty
profiles are never embedded (noise vectors are worse than none). Provider switches change
the `textHash`, so `npm run engine:backfill` re-embeds exactly what needs it.

## Search

`/api/search` is semantic-first: name/handle ILIKE hits come first (exact people lookups),
then query-embedding ANN re-ranked by `0.65·querySim + 0.35·engineFit`. Query sims are
min-max normalized within the result set (raw query→profile cosines run low); a flat sim
spread (<0.06) means the query didn't discriminate and engine fit takes over. Keyword scan
remains as the no-vector fallback. The assistant's `search_people` tool rides the same path.

## Ops

```bash
# local dev — docker-compose now uses pgvector/pgvector:pg16 (data volume: brivia-pgdata-v2)
npm run engine:backfill        # embed anyone missing/changed (idempotent, --force to redo)
npm run seed                   # reseeds AND re-embeds everyone at the end
node scripts/engine-report.js "Mohit Yadav"   # score distribution + a sample deck
```

- **Prod:** the migration (`20260714060000_matching_engine_v1`) runs `CREATE EXTENSION
  vector` — bundled on Supabase, applied automatically by the existing
  `prisma migrate deploy` in the Render build. Run the backfill once after first deploy.
- **Memory:** MiniLM adds ~150–200MB RSS. Fine on Starter (512MB) alongside Fastify; if the
  free tier OOMs, set `EMBEDDINGS_PROVIDER=openai` or `none` — no code change.
- **Tuning:** `STEEPNESS`/`MIDPOINT` in `weights.js` calibrate the score spread — re-run
  `engine-report.js` after weight changes. Learning rate/regularization live in `learn.js`
  (passes deliberately teach at half the rate of likes).

## Roadmap mapping

| Sheet item | Status |
|---|---|
| BRV-006 candidate-selection bug | ✅ closed (union pool + daily rotation) |
| BRV-028 matching v0.5 whole-profile | ✅ closed (all fields scored, floor killed, honest spread) |
| BRV-029 v1 reciprocity/exploration/new-user | ✅ core closed (Wilson reciprocity, ε-slot, freshness; Redis precompute deferred until scale demands) |
| BRV-025 interaction log | ✅ log live with features; PostHog dashboards still to do |
| BRV-043 v2 embeddings + semantic search | ✅ embeddings + semantic search live; GBDT re-ranker on the Interaction log remains (needs volume) |

**v2 next:** train the re-ranker on `Interaction` once the beta generates ~5k swipes;
event-anchored decks (BRV-030) = one `where` filter + event context on this engine.
