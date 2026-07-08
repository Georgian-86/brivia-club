# The Brivia Club — Strategy, Competition & Roadmap
**Version 1.0 · July 2026 · Internal working document**

> **Epistemic note:** Competitor figures, funding amounts, and market sizes below are directional estimates compiled from public information available up to ~mid-2025. Before using any number with investors, re-verify it. Everything strategic (positioning, prioritization, sequencing) is a recommendation, not a fact.

---

## Table of contents

1. [Thesis & positioning](#1-thesis--positioning)
2. [Where we stand today](#2-where-we-stand-today)
3. [Market & why now](#3-market--why-now)
4. [Competitive landscape](#4-competitive-landscape)
5. [Our differentiation & the moat](#5-our-differentiation--the-moat)
6. [The new possibility (what AI unlocks)](#6-the-new-possibility)
7. [Feature inventory & prioritization](#7-feature-inventory--prioritization)
8. [Rollout plan (Phase 0 → 3)](#8-rollout-plan)
9. [What NOT to build early](#9-what-not-to-build-early)
10. [Go-to-market](#10-go-to-market)
11. [How people will use it](#11-how-people-will-use-it)
12. [How it will be misused — trust & safety](#12-how-it-will-be-misused--trust--safety)
13. [Business model & the unicorn math](#13-business-model--the-unicorn-math)
14. [Metrics that matter](#14-metrics-that-matter)
15. [Risks & kill criteria](#15-risks--kill-criteria)
16. [90-day action plan](#16-90-day-action-plan)

---

## 1. Thesis & positioning

**One line:** Brivia is the fastest way for a verified builder to go from "I have an idea / there's a hackathon this weekend" to "I have a committed team."

**Positioning statement:** For students and early-career builders who need teammates *for a specific thing with a specific deadline*, The Brivia Club is a matchmaking network that matches on **commitment, availability, and skill complementarity** — not on résumé keywords. Unlike LinkedIn (a rolodex) or hackathon Discord channels (chaos), every match opens a working team room and every shipped project becomes verified reputation.

**The core insight:** "Tinder for professionals" is the *interface*, not the business. Swiping is how you enter. The business is the **proof-of-ship graph** — a verified record of who built what, with whom, and how it went. Nobody owns that data today. LinkedIn knows where you worked; GitHub knows what you committed; nobody knows *who you can actually build with*. That graph, at scale, is worth more than the matching app that creates it.

---

## 2. Where we stand today

Honest inventory (as of this doc):

| Asset | Status |
|---|---|
| Brand & landing page | ✅ Strong — dark/red identity, full marketing site, responsive, deployed to GitHub Pages |
| Swipe deck | ✅ UI demo with hardcoded profiles — no backend |
| Login/signup | ✅ UI shell only — no auth, no database |
| Matching engine | ❌ Not started |
| Team rooms / chat | ❌ Not started |
| Verification | ❌ Not started |
| Users | 0 |

We are pre-product. That is fine — it means every choice below is still cheap to make. The landing page's job right now is to collect a waitlist and validate demand per campus/event.

---

## 3. Market & why now

**Beachhead market: the Indian student-builder circuit.** Our copy already speaks to it (IIT/BITS/NID/IIM, ₹, Smart India Hackathon). Directional numbers to validate:

- India has roughly **40 million** students in higher education; a meaningful single-digit-million slice participates in hackathons, case competitions, and startup activity.
- Indian competition/hackathon platforms (Unstop, Devfolio, HackerEarth) collectively claim **tens of millions of registered students** — proof the audience aggregates online for exactly this activity.
- Smart India Hackathon alone draws **hundreds of thousands of participants** per edition, all of whom must form teams of ~6 to even register.
- Globally: ~250M tertiary students, plus the indie-hacker/side-project economy (Product Hunt, GitHub, buildspace-style cohorts).

**Why now (the timing argument):**
1. **Team formation is the #1 unsolved friction** in the hackathon economy. Platforms solved discovery of *events*; nobody solved discovery of *people* beyond a "find teammates" forum tab.
2. **AI changed what matching can be.** Parsing GitHub/Devpost/Figma into skill embeddings, scoring complementarity, and *facilitating the team after the match* (icebreakers, role split, task plans) was not feasible before LLMs. Matching used to be filters; now it can be judgment.
3. **The co-founder shortage is chronic.** YC's own co-founder matching product proved demand at the top of the funnel; nothing serves the earlier "let's ship one project together first" stage — which is how good co-founders are actually vetted.
4. **Remote-native Gen Z** treats meeting strangers online to do things together as normal. The swipe grammar is pre-installed in their heads.

---

## 4. Competitive landscape

### Tier 1 — direct structural competitors

| Competitor | What it is | Their edge | Their gap (our opening) |
|---|---|---|---|
| **YC Co-Founder Matching** | Free co-founder matching by Y Combinator; profile-reviewed | Brand gravity, high-intent users, trust, free | Startup-only and late-stage intent ("commit your life"), US-centric, no time-boxed/low-commitment mode, no student focus, no post-match tooling |
| **Devfolio** (India) | Dominant Indian hackathon platform (ETHIndia etc.) with team-finder features | Owns event registration flow; builders already there | Team-finding is a directory/forum, not matching; no reputation loop across events; single-ecosystem |
| **Unstop** (ex-Dare2Compete) | Indian student competitions + hiring platform, tens of millions of registered users | Massive student reach, B2B revenue from employers | Breadth over depth — teammate-finding is a feature, not the product; no swipe-grade UX; no AI matching; hiring-first DNA |
| **Devpost** | Global hackathon listing + submission platform | Global event inventory, organizer relationships | Participant directory ≠ matchmaking; no mobile-grade UX; no persistent builder graph |
| **CoFoundersLab** | Long-running co-founder marketplace (hundreds of thousands of profiles) | SEO, scale of profiles, paid tier exists | Stale profiles, pay-to-message friction, no verification, reputation = zero; widely seen as low-signal |

### Tier 2 — adjacent giants

| Competitor | Their edge | Why they haven't won this |
|---|---|---|
| **LinkedIn** | The identity graph; 1B+ members; recruiting revenue machine | Optimized for *hiring and content*, not collaborating. Cold-DM culture. No intent/availability data. Building a "find a teammate this weekend" flow contradicts its enterprise DNA. Still: biggest strategic threat if they ever care. |
| **Discord / WhatsApp / Telegram groups** | Free, where the community already lives; zero friction | Unstructured chaos: "anyone need a designer?" scrolls away in minutes. No profiles, no verification, no memory. **This is the real incumbent we're replacing — informality.** |
| **GitHub** | The proof-of-work source of truth | Code-only, no matching intent, no non-engineers. It's our *data source*, not our competitor. |

### Tier 3 — cautionary tales (learn from their bodies)

| Product | What happened (directional) | The lesson for us |
|---|---|---|
| **Shapr** | Swipe-to-network app; hype, then faded away | Swiping on *people with no shared purpose* has no retention. Matches must anchor to a concrete thing (an event, a project) or users churn after novelty. |
| **Lunchclub** | AI 1:1 professional intros; raised significant VC (~$24M+); struggled with retention/monetization | An intro is not an outcome. If the product ends at "you two should talk," value leaks out of the platform. We must own what happens *after* the match. |
| **Bumble Bizz** | Networking mode inside a dating app | Mixed-intent pools poison trust — professional women got hit on. Verification + single-purpose branding is existential, not cosmetic. |
| **Polywork** | Collab-badge professional network; well funded (~$28M+); wound down | A prettier profile is not a reason to switch networks. Utility (get a team, ship a thing) must come before identity. |
| Long tail of "Tinder for co-founders" Product Hunt launches | Launch spike → dead pool | Matching products die of **liquidity starvation**. Never launch wide and thin; launch narrow and dense (one campus, one event). |

### Summary of the whole board

Everyone matches on **identity** (who you are on paper). Nobody matches on **commitment + availability + complementarity + deadline** (whether you'll actually show up Saturday and cover the skills I lack). And nobody accumulates **verified collaboration outcomes**. Both gaps are ours to take.

---

## 5. Our differentiation & the moat

Four layers, in order of defensibility (weakest → strongest):

1. **UX wedge (weeks to copy):** Swipe-grade matching with taste — small daily decks, not infinite directories. This gets us in the door; it is not a moat.
2. **Event-anchored liquidity (quarters to copy):** Partnerships with hackathon organizers so that "find your team on Brivia" is part of registration. Density per event beats total user count. Organizers get a real pain solved (solo registrants churn); we get concentrated liquidity on a deadline.
3. **Post-match activation (the Lunchclub fix):** Every match opens a **team room** — icebreakers, role tags, task board, event countdown. We own the collaboration, not just the introduction. This is where retention lives.
4. **The proof-of-ship graph (the actual moat, years to copy):** After every event: did the team submit? win? keep working together? Mutual reviews + verified outcomes accumulate into a reputation asset that (a) makes our matching smarter than any newcomer's cold start, (b) becomes the data product recruiters/investors will pay for, and (c) compounds — every match improves the next match. Classic data network effect.

**Differentiation one-liner for the pitch deck:** *LinkedIn tells you where someone worked. GitHub tells you what they wrote. Brivia tells you who they can ship with — and proves it.*

---

## 6. The new possibility

What specifically is possible in 2026 that wasn't in 2019 (when Shapr/Lunchclub-era products tried):

1. **Proof-of-work parsing.** LLMs can read a GitHub profile, Devpost submissions, a Figma portfolio, a resume PDF — and produce a structured, honest skill card ("ships React weekend projects; no infra depth; strong UI taste"). Profiles stop being self-reported fiction.
2. **Complementarity scoring, not similarity scoring.** Old matching found people *like* you. Team formation needs people *unlike* you in the right dimensions. LLM-scored "this pair covers frontend+ML but lacks design" is a genuinely new matching primitive.
3. **The AI scout.** Flip the model: a user says "SIH registration closes Friday, I need a designer and a domain expert in agritech" and the agent *drafts a team* and pings candidates. Matching becomes an outcome-delivery service, not a browsing activity.
4. **AI team facilitation.** First 48 hours of a stranger-team decide everything. An AI facilitator in the team room (kickoff agenda, role split proposal, scope-cutting suggestions, standup nudges) measurably raises the ship rate — and ship rate is our core metric.
5. **Outcome verification at near-zero cost.** Cross-checking a claimed win against Devpost results, a claimed repo against commit history — automatable now. Verified reputation used to require manual ops; now it's a pipeline.

---

## 7. Feature inventory & prioritization

Scoring: **RICE** (Reach × Impact × Confidence ÷ Effort), scores normalized 1–100 for readability. Reach assumes Phase-0 scale (~2–5k users across 2–3 campuses/events).

| # | Feature | Reach | Impact | Conf. | Effort | RICE | Phase |
|---|---|---|---|---|---|---|---|
| 1 | Verified signup (college email + GitHub/LinkedIn OAuth) | High | Critical — trust is the product | High | M | **95** | 0 |
| 2 | Profile card builder w/ proof-of-work import (GitHub, Devpost) | High | High — kills fake-profile problem, feeds matching | High | M–L | **90** | 0 |
| 3 | Event-anchored deck (swipe within one hackathon's pool) | High | Critical — solves liquidity + intent in one move | High | M | **92** | 0 |
| 4 | Mutual match → team room (chat + icebreakers + countdown) | High | Critical — owns the post-match moment | High | M | **90** | 0 |
| 5 | Report / block / basic moderation queue | All | Critical — table stakes before any launch | High | S | **88** | 0 |
| 6 | Waitlist + campus leaderboard (pre-launch growth) | High | Medium — density engine | High | S | **80** | 0 |
| 7 | AI-curated daily deck (complementarity scoring) | High | High — the "magic" differentiator | Med | L | **70** | 1 |
| 8 | Post-event outcome capture (shipped? won? mutual review) | Med | High — starts the moat | High | M | **75** | 1 |
| 9 | Hackathon radar (event listings + "who's going") | High | Medium–High | High | M | **68** | 1 |
| 10 | Skill-gap matching ("your team lacks a designer") | Med | High | Med | M | **62** | 1 |
| 11 | AI team facilitator in rooms (kickoff, roles, nudges) | Med | High — raises ship rate | Med | L | **55** | 1–2 |
| 12 | Co-founder mode (high-commitment track, deeper vetting) | Med | High — expands beyond events | Med | M | **58** | 2 |
| 13 | Opportunity board (gigs, grants, startup openings) | Med | Medium — revenue adjacent | Med | M | **45** | 2 |
| 14 | Organizer dashboard (B2B: team-formation-as-a-service) | Low now | High — first real revenue | Med | L | **50** | 2 |
| 15 | Pro tier (unlimited decks, priority visibility, filters) | Med | Medium — monetization test | High | S–M | **48** | 2 |
| 16 | Reputation graph API / recruiter scouting product | Low now | Very high later | Low now | XL | **30** | 3 |
| 17 | Native mobile apps | High later | Medium (PWA suffices at first) | High | XL | **25** | 3 |

**The Phase-0 cut is features 1–6. Nothing else ships before those work.** Rationale: 1–2 create trust, 3 creates liquidity, 4 creates retention, 5 creates safety, 6 creates the next cohort. Every one of the cautionary-tale companies above died from skipping one of these five jobs.

---

## 8. Rollout plan

### Phase 0 — "One event, one win" (Weeks 0–10)
- **Goal:** Prove the loop *swipe → match → team → submission* at 1–3 partner events on 2–3 campuses.
- Ship features 1–6. Backend: keep it boring (Postgres + simple service; realtime chat via managed service).
- Hand-pick the first 300–500 profiles (concierge onboarding — founders personally verify).
- Partner with 1 mid-size hackathon (500–2,000 participants) where the organizer promotes "form your team on Brivia."
- **Success bar:** ≥30% of solo registrants at the partner event form a team through us; ≥60% of matched teams exchange ≥10 messages; ≥25% of formed teams actually submit.

### Phase 1 — "The magic deck" (Months 3–6)
- Ship AI-curated decks, outcome capture, hackathon radar, skill-gap matching (features 7–10).
- Scale to 8–12 events per quarter via a repeatable organizer playbook + campus ambassador program (one paid/perked ambassador per campus).
- Start the reputation loop: badges for verified ships/wins render on profile cards.
- **Success bar:** 25k registered, 40% of users active during an event cycle, match→team conversion ≥35%, one event where organizers *approached us*.

### Phase 2 — "Beyond the weekend" (Months 6–12)
- Co-founder mode, opportunity board, organizer dashboard (first B2B revenue), Pro tier test.
- Teams that shipped together get "keep building" flows: project pods, grant/incubator pipelines.
- **Success bar:** 100k+ registered, first ₹ lakh-scale MRR from organizers/Pro, ≥100 teams still collaborating 30+ days post-event.

### Phase 3 — "The graph is the product" (Year 2+)
- Reputation/scouting products (recruiters pay for "show me students who shipped 3+ verified projects with strangers").
- API embedded in hackathon platforms (Devfolio/Devpost become channels, not competitors).
- Geographic expansion: SEA → global student circuits. Native apps when retention justifies them.

---

## 9. What NOT to build early

- **Open DMs without a match** — recreates LinkedIn spam; destroys the safety story.
- **A public content feed** — we are not a social network; feeds burn engineering and invite comparison to giants.
- **Video profiles** — production friction crushes profile-completion rates at this stage.
- **Native iOS/Android before PMF** — a good PWA covers the event use case; app-store cycles slow iteration.
- **Points/tokens/streaks gimmicks** — reputation must map to real shipped work or the graph is worthless.
- **Broad "all professionals" positioning** — mixed-intent pools are how Bumble Bizz died. Students/builders first; expand later.

---

## 10. Go-to-market

**Strategy: density over reach.** A matching product with 100k thin users loses to one with 2k users at a single event.

1. **Organizer-led (primary).** Sell team-formation-as-a-service to hackathon organizers — free at first. They promote us in registration emails; we deliver formed teams and a stat they can brag about ("94% of participants found teams"). Their pain (solo-registrant churn) is real and unserved.
2. **Campus ambassadors.** One credible senior builder per campus, perked with Pro + event access + a title. Ambassador launches = seeded deck of 50 known-good profiles before opening the floodgates.
3. **The waitlist leaderboard.** Campus-vs-campus referral competition pre-launch ("BITS is 212 signups ahead of IIT-B") — cheap, proven, on-brand.
4. **Proof-of-win content.** Every winning Brivia-formed team is a story: "They matched on Tuesday, won on Sunday." That is the entire content strategy for year one.
5. **SIH as the whale.** Smart India Hackathon's mandatory 6-person teams and mass participation make it the single highest-leverage event in the beachhead. Work backwards from its calendar.

---

## 11. How people will use it

Ranked by expected volume:

1. **Hackathon squads** — the core loop; deadline-driven, recurring 5–10×/year per active user.
2. **Case competitions & B-school events** — same mechanics, non-technical audience (IIM copy already in our brand).
3. **Side-project pods** — 2–4 people, evenings/weekends, "ship in a month" commitment level.
4. **Co-founder search** — the high-stakes track; users graduate into it after 1–2 shipped projects (our vetting *is* the shipped projects).
5. **Open-source / GSoC teams** — maintainers recruiting contributors for a defined scope.
6. **Startup first-hires** — a funded founder swiping for a founding engineer who has verified ship history.
7. **Campus club recruitment** — clubs running "tryout" decks at semester start.
8. **Mentor matching** — later; adjacent but different mechanics (asymmetric, not peer).

---

## 12. How it will be misused — trust & safety

This section is deliberately blunt. Every failure mode below has hit a comparable product. Ranked by severity × likelihood, with mitigations and the phase by which each mitigation must exist.

| # | Misuse | What it looks like | Mitigation | Must exist by |
|---|---|---|---|---|
| 1 | **Dating-ification of the swipe** | Users (statistically, mostly men) treating it as Tinder; flirty openers to women builders | Single-purpose branding; intent declared per deck; **first-message templates anchored to the project**; report category "romantic advance" with fast enforcement (first strike = warning, second = ban); monitor female-user retention as a *top-level KPI* — it is the canary | Phase 0 |
| 2 | **Harassment & stalking** | Persistent contact after unmatch; finding targets on other platforms | Unmatch kills the thread permanently; no last-seen/precise location ever; contact details revealed only by explicit mutual action; block propagates to future decks; safety center page | Phase 0 |
| 3 | **Fake profiles & credential fraud** | Invented IIT tags, stolen GitHub links, claimed wins | College-email verification; OAuth-linked (not typed) GitHub/Devpost; verified badges only from cross-checked sources; proof-of-work weighted matching (unverified claims barely move rank) | Phase 0 |
| 4 | **Recruiter spam / MLM / crypto-scam recruiting** | "Join my team" = unpaid labor funnel, token shills, pyramid pitches | Intent taxonomy enforced; rate-limit matches/day; ML + keyword flags on first messages ("investment," "guaranteed returns"); no recruiter accounts until a paid, verified B2B product exists | Phase 0–1 |
| 5 | **Equity/exploitation traps** | "CTO wanted, 2% equity, no salary, I'm the idea guy" | Structured commitment fields (hours/week, paid/unpaid, equity range) shown on card — sunlight is the disinfectant; community norms doc; flag category "misleading terms" | Phase 1 |
| 6 | **Reputation gaming** | Friend-teams five-starring each other; multi-accounting; review-bombing after conflict | Reviews are mutual + simultaneous-reveal (Airbnb pattern); outcomes verified against event results, not self-reported; graph anomaly detection (cliques of mutual praise with no external ships); one verified identity per person | Phase 1 |
| 7 | **Idea theft paranoia & real IP disputes** | "They matched with me just to steal my idea"; post-hackathon ownership fights | Expectation-setting in team room kickoff (AI facilitator proposes a lightweight collaboration agreement template); disclosure norms in guidelines; we never claim IP arbitration — provide templates, not verdicts | Phase 1 |
| 8 | **Bias in AI matching** | Model proxies for gender/campus-tier/region (and, in India, caste-correlated signals like surname or locality) suppressing some users' visibility | No protected attributes (or close proxies) as features; regular matched-rate audits across cohorts; human review of ranking-feature additions; publish a fairness note | Phase 1, audited every quarter |
| 9 | **Data scraping & resale** | Bots harvesting the builder directory for recruiting spam databases | No public profile URLs by default; rate limiting + bot detection; watermarked/canary profiles to catch scrapers; ToS with teeth | Phase 1 |
| 10 | **Minor safety** | Under-18s in college pools (common in India's first-years) | Age gate at signup; 16–18 allowed only with restricted messaging defaults if we choose to serve them at all — decide explicitly, not by accident | Phase 0 |
| 11 | **Our own misuse of the graph** | Future us selling reputation data in ways users never consented to | Write the data covenant *now*: outcome data is user-owned, exportable, and never sold at individual granularity without opt-in. This is also a trust-marketing asset. | Phase 0 (policy), enforced forever |

**Governing principle:** trust incidents are super-linear — one viral harassment screenshot on X undoes a semester of campus GTM. Safety features are not compliance overhead; in a matching product, **safety is a growth feature**, because the scarce side of our marketplace (experienced builders, women in tech) only stays if the pool feels serious.

---

## 13. Business model & the unicorn math

### Revenue layers (sequenced, not simultaneous)

1. **Phase 2 — B2B organizer tools:** team-formation-as-a-service for hackathons/fests (₹25k–₹2L per event depending on size); white-label matching for corporate hackathons pays more.
2. **Phase 2 — Pro tier (consumer):** ₹199–₹499/mo — unlimited decks, advanced filters, priority visibility, "who liked you." (Dating-app-proven monetization; Hinge alone reportedly crossed ~$500M/yr on this pattern.)
3. **Phase 3 — Scouting/recruiting on the graph:** employers/VC scouts pay for access to *verified shipped-work* talent — a fundamentally better signal than resume databases. This is the LinkedIn-Recruiter-sized prize.
4. **Ambient:** sponsored challenges, incubator/grant pipeline placement fees.

### The unicorn math (honest version)

A $1B valuation needs roughly **$50–100M ARR** at ordinary 10–20× multiples, or a strategic network position that commands more (comps: LinkedIn sold for $26.2B in 2016; Bumble IPO'd around ~$8B in 2021 on matching revenue).

Path A — consumer-led: 5M MAU × 4% paid × ~$36/yr ≈ **$7M ARR**. Not enough alone. Consumer subscription is a contributor, not the headline.

Path B — graph-led (the real path):
- 3–5M verified builders across India + SEA + global student circuits (~1–2% of tertiary students — aggressive but not absurd for a category winner),
- **$25–40M/yr** from recruiting/scouting seats (1,500–3,000 companies × $12–15k avg — compare LinkedIn Recruiter pricing),
- **$15–25M/yr** consumer Pro at that scale,
- **$10–15M/yr** B2B events/API.
- Total: **$50–80M ARR** → unicorn plausible at year 6–8, *if* the reputation graph is truly proprietary and the matching win-rate story holds.

**What actually makes it worth a unicorn is not any single revenue line — it's owning the canonical answer to "who can this person build with?"** LinkedIn became generational by owning "where has this person worked?" The collaboration graph is the same shape of asset, currently unclaimed. Every strategic acquirer (LinkedIn/Microsoft, Naukri/Info Edge, Unstop, GitHub) would rather buy that graph than rebuild its history.

---

## 14. Metrics that matter

**North star: Verified Teams Shipped (VTS)** — teams formed on Brivia that submit/deliver, per month.

Supporting funnel (in order):
1. **Liquidity:** % of active swipers who get ≥1 match within 48h (target ≥60% inside an event pool).
2. **Activation:** % of matches with ≥10 messages in first 24h (target ≥50%).
3. **Team conversion:** matches → formed teams (target ≥35% in event context).
4. **Ship rate:** formed teams → submitted projects (target ≥25% Phase 0, ≥40% with AI facilitation).
5. **Cycle retention:** % of users returning for their next event window (this, not DAU, is our retention truth — the product is cyclical by design).
6. **Canary metrics:** female-user 4-week retention vs. male; report rate per 1k matches; time-to-moderation-action.

---

## 15. Risks & kill criteria

| Risk | Likelihood | Mitigation | Kill/pivot signal |
|---|---|---|---|
| Chicken-and-egg liquidity failure | High (it kills most matching startups) | Event-anchored pools only; never launch a campus without 300+ seeded profiles | 3 consecutive event launches with <20% match rate |
| Novelty churn (Shapr syndrome) | Medium–High | Anchor every match to a deadline/outcome; cycle-based retention target | Cycle retention <15% after two event seasons |
| Devfolio/Unstop ships real matching | Medium | Move faster on AI matching + own the *cross-platform* reputation layer; consider partnering (be their matching API) | They bundle a credible clone AND our organizer pipeline stalls |
| LinkedIn adds "collab" intent | Low–Medium | Their DNA is hiring/enterprise; our speed + student focus is the counter | N/A — accelerant for acquisition interest as much as threat |
| Trust incident goes viral | Medium | Section 12 shipped on schedule; founder-led moderation early | A pattern of incidents our tooling can't catch — freeze growth, fix, relaunch |
| Monetizing too early poisons growth | Medium | No consumer paywall before 50k engaged users; organizers free until Phase 2 | — |
| Seasonality troughs (exam months) | Certain | Counter-program with side-project pods + opportunity board in off-cycles | — |

---

## 16. 90-day action plan

**Weeks 1–2 — decide & instrument**
- Lock Phase-0 scope (features 1–6). Write the data covenant + community guidelines v1.
- Add waitlist capture to the live landing page (email + campus + role + "next event you're targeting"). Instrument analytics.

**Weeks 3–6 — build the loop**
- Auth (college email + GitHub OAuth), profile cards with GitHub/Devpost import, event-pool decks, match → team room chat, report/block + admin queue.
- In parallel (founder job, not code): close 1 partner hackathon for a pilot; recruit 3 campus ambassadors; hand-verify the first 300 profiles.

**Weeks 7–10 — pilot event**
- Run the pilot. Founders in the (physical or Discord) room. Measure the Section-14 funnel end to end.
- Collect the first win stories; publish 2–3 "matched Tuesday, won Sunday" posts.

**Weeks 11–13 — decide with data**
- If funnel bars hit: raise/angel round conversation opens with real numbers; start Phase 1 (AI deck + outcome capture).
- If not: diagnose which stage broke (liquidity? activation? ship rate?) and fix *that stage only* before adding anything new.

---

*Document owner: founding team. Review cadence: after every event cycle. The strategy is a hypothesis; the funnel numbers are the judge.*
