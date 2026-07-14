import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { getViewer, scoredPeople, deckFor } from '../services/people.js'
import { semanticSearch } from '../engine/index.js'
import { personCard } from '../serialize.js'
import { computeStrength } from './auth.routes.js'
import { answer } from '../services/assistant.js'

/* Aggregate reads: home dashboard, smart search, hubs, analytics.
   Scale path: /home is the hottest read → cache per-user in Redis
   (60s TTL) and precompute the deck slice nightly. */

const HUBS = {
  startup: {
    icon: 'rocket', name: 'Startup Hub', kicker: 'Find your founding team',
    title: ['Great companies start as', 'great teams.'],
    sub: 'Tell Brivia what your startup lacks — it recommends people who fill exactly that gap.',
    roles: ['Co-founder', 'Backend', 'Frontend', 'Design', 'Marketing', 'Business', 'AI/ML', 'Interns', 'Investors', 'Mentors'],
    tags: ['Startup', 'Mentor'],
    stats: [['214', 'startups recruiting'], ['38', 'funded this year'], ['92%', 'co-founder match rate']],
  },
  hackathon: {
    icon: 'zap', name: 'Hackathon Hub', kicker: 'Squad up before the clock starts',
    title: ['Teams win hackathons.', 'Find yours.'],
    sub: 'Browse open teams, create your own, or let the AI draft a squad from builders going to your event.',
    roles: ['Full-stack', 'ML', 'Design', 'Pitch', 'Hardware', 'Domain expert'],
    tags: ['Hackathon', 'Side Project'],
    stats: [['46', 'events on radar'], ['1.2k', 'open team slots'], ['640', 'teams shipped']],
  },
  music: {
    icon: 'music', name: 'Music Hub', kicker: 'Your band is out there',
    title: ['Find the sound', "you're missing."],
    sub: 'Guitarists, pianists, drummers, singers, producers — matched on genre, schedule and vibe.',
    roles: ['Guitarist', 'Pianist', 'Drummer', 'Singer', 'Bassist', 'Violinist', 'Producer'],
    tags: ['Music'],
    stats: [['87', 'bands forming'], ['12', 'jams this month'], ['340', 'gig-ready members']],
  },
  creator: {
    icon: 'palette', name: 'Creator Hub', kicker: 'Make things people share',
    title: ['Every great channel', 'is a duo.'],
    sub: 'Editors, photographers, writers, animators and voice artists — find the other half of your craft.',
    roles: ['Editor', 'Photographer', 'Writer', 'Animator', 'Content creator', 'Voice artist'],
    tags: ['Creator'],
    stats: [['150+', 'creators onboard'], ['52', 'collabs shipped'], ['9', 'agencies scouting']],
  },
}

// hackathon-hub extras — becomes a Team model when team rooms ship (Phase-0 #4)
const HACKATHON_TEAMS = [
  { id: 1, name: 'AgriSense', event: 'Smart India Hackathon', looking: ['Designer', 'Agritech expert'], memberHandles: ['aarav', 'dev', 'zoya', 'rohan'], stack: ['React', 'FastAPI', 'YOLOv8'], spots: 2 },
  { id: 2, name: 'PayLater Guard', event: "HackBengaluru '26", looking: ['ML Engineer'], memberHandles: ['ananya', 'nikhil'], stack: ['Next.js', 'Python'], spots: 1 },
  { id: 3, name: 'MedScan', event: "HackBengaluru '26", looking: ['Full-stack', 'Designer', 'PM'], memberHandles: ['isha'], stack: ['PyTorch', 'FHIR'], spots: 3 },
]

const dayKey = (d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d).getDay()]

export default async function metaRoutes(app) {
  /* ---------- home dashboard ---------- */
  app.get('/api/home', { preHandler: requireAuth }, async (req) => {
    const viewer = await getViewer(req.userId)
    const [deck, requests, invitations, communities, events, matches] = await Promise.all([
      deckFor(viewer, 4, 'home'),
      db.connectionRequest.findMany({ where: { toId: req.userId, status: 'PENDING' }, include: { from: true } }),
      db.invitation.findMany({ where: { toId: req.userId, status: 'PENDING' }, include: { from: true } }),
      db.community.findMany({ where: { trending: true }, include: { _count: { select: { members: true, posts: true } } } }),
      db.event.findMany({ take: 3, include: { _count: { select: { rsvps: true } } } }),
      db.match.findMany({
        where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
        include: { userA: true, userB: true },
        orderBy: { score: 'desc' },
        take: 1,
      }),
    ])
    const top = matches[0]
    const topPerson = top ? (top.userAId === req.userId ? top.userB : top.userA) : null
    return {
      firstName: viewer.name.split(' ')[0],
      recommended: deck,
      requests: requests.map((r) => ({ id: r.id, note: r.note, person: personCard(r.from) })),
      invitations: invitations.map((i) => ({ id: i.id, kind: i.kind, title: i.title, detail: i.detail, icon: i.icon, from: personCard(i.from) })),
      trending: communities.map((c) => ({ id: c.id, name: c.name, icon: c.icon, members: 800 + c._count.members * 37, posts: 20 + c._count.posts * 11 })),
      events: events.map((e) => ({ id: e.id, name: e.name, kind: e.kind, date: e.date, going: e.going + e._count.rsvps })),
      topMatch: top && topPerson ? { matchId: top.id, score: top.score, person: personCard(topPerson) } : null,
      profileStrength: viewer.profileStrength,
      stats: {
        topMatch: deck[0]?.match || null,
        pendingRequests: requests.length,
        invitations: invitations.length,
      },
    }
  })

  /* ---------- smart search — semantic first, keywords as fallback ---------- */
  app.get('/api/search', { preHandler: requireAuth }, async (req) => {
    const viewer = await getViewer(req.userId)
    const q = (req.query.q || '').toLowerCase().trim()
    if (!q) return { results: await scoredPeople(viewer, { limit: 60 }) }

    // exact people first: name/handle lookups shouldn't depend on embeddings
    const named = await db.user.findMany({
      where: {
        id: { not: viewer.id },
        role: 'MEMBER',
        OR: [{ name: { contains: q, mode: 'insensitive' } }, { handle: { contains: q, mode: 'insensitive' } }],
      },
      select: { id: true },
      take: 8,
    })
    const nameHits = named.length
      ? await scoredPeople(viewer, { where: { id: { in: named.map((u) => u.id) } }, limit: 8 })
      : []

    // meaning search: "flutter dev into fintech who can design" → people
    const semantic = await semanticSearch(viewer, q, { limit: 60 })
    if (semantic) {
      const seen = new Set(nameHits.map((p) => p.id))
      const rest = semantic
        .filter((it) => !seen.has(it.user.id))
        .map((it) =>
          personCard(it.user, {
            match: it.score,
            why: it.why,
            communities: (it.user.memberships || []).map((m) => m.community.name),
          })
        )
      return { results: [...nameHits, ...rest] }
    }

    // embeddings offline → old keyword scan still works
    const words = q.split(/\s+/).filter((w) => w.length > 2)
    const people = (await scoredPeople(viewer, { limit: 60 }))
      .map((p) => {
        const hay = `${p.name} ${p.role} ${p.org} ${p.tag} ${p.bio} ${p.skills.join(' ')} ${p.location} ${p.lookingFor} ${p.communities.join(' ')}`.toLowerCase()
        const hits = words.filter((w) => hay.includes(w.replace(/s$/, ''))).length
        return { ...p, _hits: hits }
      })
      .filter((p) => p._hits > 0)
      .sort((a, b) => b._hits - a._hits || b.match - a.match)
    return { results: people }
  })

  /* ---------- hubs ---------- */
  app.get('/api/hubs/:hubId', { preHandler: requireAuth }, async (req, reply) => {
    const hub = HUBS[req.params.hubId]
    if (!hub) return reply.code(404).send({ error: 'No such hub' })
    const viewer = await getViewer(req.userId)
    const people = await scoredPeople(viewer, { where: { tag: { in: hub.tags } }, limit: 8 })
    const payload = { ...hub, people }
    if (req.params.hubId === 'hackathon') {
      const members = await db.user.findMany({ where: { handle: { in: HACKATHON_TEAMS.flatMap((t) => t.memberHandles) } } })
      const byHandle = Object.fromEntries(members.map((m) => [m.handle, m]))
      payload.teams = HACKATHON_TEAMS.map((t) => ({
        ...t,
        members: t.memberHandles.map((h) => byHandle[h]).filter(Boolean).map((m) => ({ name: m.name, img: m.avatar })),
      }))
      const winners = await db.user.findMany({ where: { badges: { has: 'hackathon-winner' } }, take: 5 })
      payload.leaderboard = winners.map((w, i) => ({
        rank: i + 1, name: w.name, img: w.avatar, points: 2840 - i * 280, wins: 3 - Math.floor(i / 2),
      }))
    }
    return payload
  })

  /* ---------- analytics ---------- */
  app.get('/api/analytics', { preHandler: requireAuth }, async (req) => {
    const me = await db.user.findUnique({ where: { id: req.userId } })
    const weekAgo = new Date(Date.now() - 7 * 86400e3)
    const monthAgo = new Date(Date.now() - 30 * 86400e3)

    const [matches, views, myLikes, allSwipes, applications, chats, viewsWeek, matchesWeek] = await Promise.all([
      db.match.count({ where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] } }),
      db.profileView.count({ where: { targetId: req.userId, createdAt: { gt: monthAgo } } }),
      db.swipe.count({ where: { swiperId: req.userId, action: { in: ['LIKE', 'SUPER'] } } }),
      db.swipe.count({ where: { swiperId: req.userId } }),
      db.application.count({ where: { userId: req.userId } }),
      db.match.count({
        where: { OR: [{ userAId: req.userId }, { userBId: req.userId }], messages: { some: {} } },
      }),
      db.profileView.findMany({ where: { targetId: req.userId, createdAt: { gt: weekAgo } }, select: { createdAt: true } }),
      db.match.findMany({ where: { OR: [{ userAId: req.userId }, { userBId: req.userId }], createdAt: { gt: weekAgo } }, select: { createdAt: true } }),
    ])

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const weekly = days.map((day) => ({
      day,
      views: viewsWeek.filter((v) => dayKey(v.createdAt) === day).length,
      matches: matchesWeek.filter((m) => dayKey(m.createdAt) === day).length,
    }))

    const acceptance = myLikes ? Math.round((matches / myLikes) * 100) : 0
    const v = me.verified || {}
    return {
      stats: [
        { label: 'Connections', value: matches, delta: `${matchesWeek.length ? '+' + matchesWeek.length : 'none'} this week` },
        { label: 'Profile views', value: views, delta: `${viewsWeek.length} this week` },
        { label: 'Acceptance rate', value: `${Math.min(100, acceptance)}%`, delta: 'likes → matches' },
        { label: 'Projects joined', value: applications, delta: `${applications ? applications + ' active' : 'apply to one'}` },
      ],
      weekly,
      strength: {
        value: me.profileStrength,
        items: [
          { item: 'Add a 30-second video intro', done: me.hasVideo, boost: '+9%' },
          { item: 'Verify your current company', done: !!v.company, boost: '+4%' },
          { item: 'Link GitHub', done: !!v.github, boost: '+4%' },
          { item: 'Add availability & timezone', done: !!me.availability, boost: '+8%' },
        ],
      },
      funnel: [
        { value: allSwipes + 12, label: 'cards dealt' },
        { value: myLikes, label: 'right swipes' },
        { value: matches, label: 'mutual matches' },
        { value: chats, label: 'active chats' },
        { value: await db.invitation.count({ where: { toId: req.userId, status: 'ACCEPTED' } }), label: 'teams joined' },
      ],
    }
  })

  /* ---------- assistant ----------
     Provider-abstracted (services/assistant.js): FREE heuristic engine
     by default; flips to Claude when ASSISTANT_PROVIDER=claude + a key. */
  app.post('/api/assistant', { preHandler: requireAuth }, async (req) => {
    const viewer = await getViewer(req.userId)
    return answer(viewer, req.body?.q || '', req.body?.history || [])
  })
}
