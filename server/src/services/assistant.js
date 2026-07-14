import { db } from '../db.js'
import { scoredPeople } from './people.js'
import { semanticSearch } from '../engine/index.js'
import { personCard } from '../serialize.js'
import { computeStrength } from '../routes/auth.routes.js'

/* ============================================================
   Brivia AI — provider-abstracted assistant.

   answer(viewer, q, history) -> { text, people[], follow }

   Default provider is the FREE heuristic engine: it reasons over
   the real matching engine + the viewer's graph with zero external
   calls and no API key. Setting ASSISTANT_PROVIDER=claude *and*
   ANTHROPIC_API_KEY flips to the Claude adapter (paid, usage-based)
   with no change to this contract or to Assistant.jsx.
   ============================================================ */

export function assistantProvider() {
  const p = (process.env.ASSISTANT_PROVIDER || 'heuristic').toLowerCase()
  if (p === 'claude' && process.env.ANTHROPIC_API_KEY) return 'claude'
  return 'heuristic'
}

export async function answer(viewer, rawQ, history = []) {
  const q = `${rawQ || ''}`.trim()
  if (assistantProvider() === 'claude') {
    try {
      return await claudeAnswer(viewer, q, history)
    } catch (err) {
      // Never hard-fail the user: fall back to the free engine.
      console.warn('[assistant] claude provider failed, using heuristic:', err.message)
    }
  }
  return heuristicAnswer(viewer, q)
}

/* ---------- FREE heuristic engine (default) ---------- */

const has = (q, kws) => kws.some((k) => q.includes(k))
const firstName = (n) => (n || 'they').split(' ')[0]

// deterministic template rotation — natural variety without RNG
const pick = (arr, q) => arr[q.length % arr.length]

/** Pull top people for a free-text ask — semantic when vectors are live,
    keyword re-rank of engine results otherwise. */
async function topPeople(viewer, { where = {}, tokens = [], limit = 3 } = {}) {
  const scoped = Object.keys(where).length ? where : null
  if (tokens.length) {
    const semantic = await semanticSearch(viewer, tokens.join(' '), { limit: 24, where: scoped })
    if (semantic?.length) {
      return semantic
        .slice(0, limit)
        .map((it) =>
          personCard(it.user, {
            match: it.score,
            why: it.why,
            communities: (it.user.memberships || []).map((m) => m.community.name),
          })
        )
    }
  }
  let people = await scoredPeople(viewer, { where: scoped, limit: 24 })
  if (tokens.length) {
    const hit = (p) =>
      tokens.some((t) =>
        `${p.role} ${p.skills.join(' ')} ${p.bio} ${p.lookingFor}`
          .toLowerCase()
          .includes(t.replace(/s$/, ''))
      )
    const ranked = people.filter(hit)
    if (ranked.length) people = ranked
  }
  return people.slice(0, limit)
}

const followFor = (people) =>
  people.length
    ? `${firstName(people[0].name)} matches on ${(people[0].why[0] || 'multiple factors').toLowerCase()}. Want me to draft an intro?`
    : null

async function heuristicAnswer(viewer, q) {
  const lc = q.toLowerCase()

  if (!q) {
    return {
      text: 'I can find you people, teams, projects or ideas — and I know your profile, your matches and every open circle in the club. Try a quick prompt below, or just describe who you need.',
      people: [],
      follow: null,
    }
  }

  // — who viewed me —
  if (has(lc, ['who viewed', 'viewed me', 'profile view', 'who saw', 'who looked at'])) {
    return whoViewedMe(viewer)
  }

  // — review / improve my profile —
  if (has(lc, ['my profile', 'profile strength', 'improve my', 'stronger profile', 'profile feedback', 'review me'])) {
    return reviewProfile(viewer)
  }

  // — what should I build —
  if (has(lc, ['what should i build', 'what to build', 'project idea', 'idea to build', 'startup idea'])) {
    const skills = (viewer.skills || []).slice(0, 3).join(' + ')
    const ints = viewer.interests?.length ? ` · ${viewer.interests.slice(0, 2).join(', ')}` : ''
    return {
      text: `From your profile (${skills || 'your stack'}${ints}), three directions score highest on founder-fit:`,
      people: [],
      follow:
        '1) A copilot in the domain you already know — pairs with your current work. 2) Tooling for the community you’re most active in. 3) The unglamorous workflow everyone in your field complains about. Want intros to domain experts for any of these?',
    }
  }

  // — music —
  if (has(lc, ['guitar', 'band', 'music', 'drum', 'sing', 'piano', 'producer', 'bass', 'jam', 'vocal'])) {
    const people = await topPeople(viewer, { where: { tag: 'Music' } })
    return {
      text: pick(
        [
          'Gig-ready musicians whose schedule and taste line up with yours:',
          'Here are the players I’d put in a room with you first:',
        ],
        q
      ),
      people,
      follow: followFor(people),
    }
  }

  // — hackathon / team —
  if (has(lc, ['hackathon', 'sih', 'teammate', 'squad', 'team for', 'ship this weekend'])) {
    const people = await topPeople(viewer, { where: { tag: { in: ['Hackathon', 'Side Project'] } } })
    return {
      text: 'For your next hackathon, these builders have the highest skill-fit with you:',
      people,
      follow: followFor(people),
    }
  }

  // — co-founder —
  if (has(lc, ['co-founder', 'cofounder', 'co founder', 'founding team', 'start a company', 'start a startup'])) {
    const people = await topPeople(viewer, { where: { tag: 'Startup' } })
    return {
      text: 'Founder-grade builders whose commitment and stage match yours — the ones worth a real conversation:',
      people,
      follow: followFor(people),
    }
  }

  // — role / skill search (designer, backend, ML, marketing, writer, …) —
  const ROLE_TOKENS = [
    'designer', 'design', 'backend', 'frontend', 'full-stack', 'fullstack', 'developer',
    'engineer', 'ml', 'ai', 'data', 'devops', 'mobile', 'marketing', 'growth', 'pm',
    'product', 'writer', 'editor', 'photographer', 'video', 'content', 'sales', 'finance',
  ]
  const tokens = lc.split(/\s+/).filter((w) => w.length > 2)
  const roleTokens = tokens.filter((t) => ROLE_TOKENS.some((r) => t.startsWith(r) || r.startsWith(t)))
  if (roleTokens.length) {
    const people = await topPeople(viewer, { tokens })
    if (people.length) {
      return {
        text: pick(
          [
            'Based on your stack, timezone and goals, these builders complement you best:',
            'Ranked on complementary skills and shared goals — not follower counts:',
          ],
          q
        ),
        people,
        follow: followFor(people),
      }
    }
  }

  // — general free-text —
  const people = await topPeople(viewer, { tokens })
  if (people.length) {
    return { text: 'Here’s who I’d put in front of you first:', people, follow: followFor(people) }
  }
  return {
    text: 'Nobody in the club matches that yet — it grows every day. Try broadening the ask, or tell me the skill you’re missing.',
    people: [],
    follow: null,
  }
}

async function whoViewedMe(viewer) {
  const views = await db.profileView.findMany({
    where: { targetId: viewer.id, viewerId: { not: null } },
    orderBy: { createdAt: 'desc' },
    take: 40,
  })
  const seen = new Set()
  const ids = []
  for (const v of views) {
    if (v.viewerId && !seen.has(v.viewerId)) {
      seen.add(v.viewerId)
      ids.push(v.viewerId)
    }
    if (ids.length >= 3) break
  }
  if (!ids.length) {
    return {
      text: 'No named profile views yet — keep swiping and your card will start showing up in other builders’ decks.',
      people: [],
      follow: null,
    }
  }
  // score them through the matching engine, then restore recency order
  const scored = await scoredPeople(viewer, { where: { id: { in: ids } }, limit: ids.length })
  const byId = new Map(scored.map((p) => [p.id, p]))
  const people = ids.map((id) => byId.get(id)).filter(Boolean)
  return {
    text: `${people.length} builder${people.length > 1 ? 's' : ''} checked out your profile recently:`,
    people,
    follow: 'Want me to draft a message to whichever one looks most relevant?',
  }
}

function reviewProfile(viewer) {
  const strength = computeStrength(viewer)
  const gaps = []
  if (!viewer.bio) gaps.push('add a one-line bio that says what you’re building')
  if ((viewer.skills || []).length < 4) gaps.push('list at least 4 skills so the engine can find complements')
  if ((viewer.interests || []).length < 2) gaps.push('add a couple of interests to unlock shared-interest matches')
  if (!viewer.availability) gaps.push('set your availability (weekends / evenings / full-time)')
  if (!viewer.lookingFor) gaps.push('spell out who you’re looking for')
  if (!viewer.hasVideo) gaps.push('record a 20-second video intro — profiles with one match ~30% more')
  const v = viewer.verified || {}
  const unverified = ['github', 'linkedin', 'college', 'company'].filter((k) => !v[k])
  if (unverified.length) gaps.push(`verify your ${unverified[0]} for a trust boost`)

  const text =
    strength >= 90
      ? `Your profile is strong (${strength}/100). A couple of finishing touches:`
      : `Your profile is at ${strength}/100 — here’s the fastest way to raise it:`
  return {
    text,
    people: [],
    follow: gaps.length
      ? gaps.slice(0, 3).map((g, i) => `${i + 1}) ${g[0].toUpperCase()}${g.slice(1)}.`).join(' ')
      : 'You’re all set — the engine has everything it needs to match you well.',
  }
}

/* ---------- Claude adapter (dormant unless ASSISTANT_PROVIDER=claude + ANTHROPIC_API_KEY) ----------
   Uses the official @anthropic-ai/sdk with tool-use so Claude answers
   from the REAL matching engine instead of hallucinating. Lazy-imported
   so the free path needs no dependency installed. Non-streaming: keeps
   the same { text, people, follow } contract the client already speaks. */

const CLAUDE_MODEL = 'claude-opus-4-8'

async function claudeAnswer(viewer, q, history) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic() // reads ANTHROPIC_API_KEY

  const tools = [
    {
      name: 'search_people',
      description:
        'Search the Brivia network for builders that complement the current user, ranked by the matching engine. Use for any "find me a …" request.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Free-text description of who to find' },
          tag: { type: 'string', enum: ['Startup', 'Hackathon', 'Side Project', 'Music', 'Creator'], description: 'Optional intent filter' },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_profile_strength',
      description: 'Get the current user’s profile-strength score (0-100) and the concrete gaps holding it back.',
      input_schema: { type: 'object', properties: {}, required: [] },
    },
  ]

  const collectedPeople = []
  const runTool = async (name, input) => {
    if (name === 'search_people') {
      const where = input.tag ? { tag: input.tag } : {}
      const people = await topPeople(viewer, { where, tokens: `${input.query}`.toLowerCase().split(/\s+/) })
      collectedPeople.splice(0, collectedPeople.length, ...people)
      return people.map((p) => ({ name: p.name, role: p.role, org: p.org, match: p.match, why: p.why }))
    }
    if (name === 'get_profile_strength') {
      const r = reviewProfile(viewer)
      return { text: r.text, gaps: r.follow }
    }
    return { error: 'unknown tool' }
  }

  const system =
    `You are Brivia AI, the in-app matchmaking assistant. The current user is ${viewer.name} (${viewer.roleTitle || 'builder'}). ` +
    'Answer in 1-2 warm, concrete sentences. Always call search_people for people requests — never invent names. ' +
    'After using a tool, reply with just the framing sentence; the app renders the people cards separately.'

  const messages = [
    ...history.slice(-6).map((m) => ({ role: m.role === 'me' ? 'user' : 'assistant', content: `${m.text || ''}` })),
    { role: 'user', content: q },
  ]

  for (let i = 0; i < 4; i++) {
    const res = await client.messages.create({ model: CLAUDE_MODEL, max_tokens: 1024, system, tools, messages })
    if (res.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: res.content })
      const results = []
      for (const block of res.content) {
        if (block.type === 'tool_use') {
          const out = await runTool(block.name, block.input || {})
          results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(out) })
        }
      }
      messages.push({ role: 'user', content: results })
      continue
    }
    const text = res.content.filter((b) => b.type === 'text').map((b) => b.text).join(' ').trim()
    return { text: text || 'Here’s what I found:', people: collectedPeople.slice(0, 3), follow: followFor(collectedPeople) }
  }
  // ran out of tool iterations — return whatever we gathered
  return { text: 'Here are the strongest matches I found:', people: collectedPeople.slice(0, 3), follow: followFor(collectedPeople) }
}
