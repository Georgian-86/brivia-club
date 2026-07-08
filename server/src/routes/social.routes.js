import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { personCard } from '../serialize.js'
import { notify } from '../realtime.js'

const pair = (a, b) => (a < b ? [a, b] : [b, a])

export default async function socialRoutes(app) {
  /* ---------- communities ---------- */
  app.get('/api/communities', { preHandler: requireAuth }, async (req) => {
    const rows = await db.community.findMany({
      include: { _count: { select: { members: true, posts: true } }, members: { where: { userId: req.userId } } },
      orderBy: { name: 'asc' },
    })
    return {
      communities: rows.map((c) => ({
        id: c.id, slug: c.slug, name: c.name, blurb: c.blurb, icon: c.icon, banner: c.banner,
        trending: c.trending,
        members: 800 + c._count.members * 37, // seeded scale illusion until real liquidity
        posts: 20 + c._count.posts * 11,
        joined: c.members.length > 0,
      })),
    }
  })

  app.post('/api/communities/:id/toggle', { preHandler: requireAuth }, async (req) => {
    const key = { userId: req.userId, communityId: req.params.id }
    const existing = await db.communityMember.findUnique({ where: { userId_communityId: key } })
    if (existing) {
      await db.communityMember.delete({ where: { userId_communityId: key } })
      return { joined: false }
    }
    await db.communityMember.create({ data: key })
    return { joined: true }
  })

  app.get('/api/posts', { preHandler: requireAuth }, async (req) => {
    const posts = await db.post.findMany({
      include: {
        author: true, community: true,
        _count: { select: { likes: true } },
        likes: { where: { userId: req.userId } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return {
      posts: posts.map((p) => ({
        id: p.id, kind: p.kind, title: p.title, body: p.body, replies: p.replies,
        community: p.community.name,
        author: personCard(p.author),
        likes: p.likesBase + p._count.likes,
        liked: p.likes.length > 0,
        time: p.createdAt,
      })),
    }
  })

  app.post('/api/posts/:id/like', { preHandler: requireAuth }, async (req) => {
    const key = { userId: req.userId, postId: req.params.id }
    const existing = await db.postLike.findUnique({ where: { userId_postId: key } })
    if (existing) {
      await db.postLike.delete({ where: { userId_postId: key } })
      return { liked: false }
    }
    await db.postLike.create({ data: key })
    return { liked: true }
  })

  /* ---------- events ---------- */
  app.get('/api/events', { preHandler: requireAuth }, async (req) => {
    const rows = await db.event.findMany({
      include: { _count: { select: { rsvps: true } }, rsvps: { where: { userId: req.userId } } },
    })
    return {
      events: rows.map((e) => ({
        id: e.id, slug: e.slug, kind: e.kind, name: e.name, date: e.date, location: e.location,
        prize: e.prize, img: e.img, blurb: e.blurb, featured: e.featured,
        going: e.going + e._count.rsvps,
        rsvp: e.rsvps.length > 0,
      })),
    }
  })

  app.post('/api/events/:id/rsvp', { preHandler: requireAuth }, async (req) => {
    const key = { userId: req.userId, eventId: req.params.id }
    const existing = await db.rsvp.findUnique({ where: { userId_eventId: key } })
    if (existing) {
      await db.rsvp.delete({ where: { userId_eventId: key } })
      return { rsvp: false }
    }
    await db.rsvp.create({ data: key })
    return { rsvp: true }
  })

  /* ---------- projects ---------- */
  app.get('/api/projects', { preHandler: requireAuth }, async (req) => {
    const rows = await db.project.findMany({
      include: {
        owner: true,
        _count: { select: { applications: true } },
        applications: { where: { userId: req.userId } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return {
      projects: rows.map((p) => ({
        id: p.id, name: p.name, blurb: p.blurb, banner: p.banner, roles: p.roles, stack: p.stack,
        timeline: p.timeline, difficulty: p.difficulty, pay: p.pay, equity: p.equity,
        owner: personCard(p.owner),
        applicants: p.applicantsBase + p._count.applications,
        applied: p.applications.length > 0,
      })),
    }
  })

  app.post('/api/projects/:id/apply', { preHandler: requireAuth }, async (req) => {
    await db.application.upsert({
      where: { userId_projectId: { userId: req.userId, projectId: req.params.id } },
      create: { userId: req.userId, projectId: req.params.id },
      update: {},
    })
    const project = await db.project.findUnique({ where: { id: req.params.id } })
    const applicant = await db.user.findUnique({ where: { id: req.userId }, select: { name: true } })
    await notify(project.ownerId, 'project', `${applicant.name} applied to ${project.name.split(' — ')[0]}.`, req.userId)
    return { applied: true }
  })

  /* ---------- jobs ---------- */
  app.get('/api/jobs', { preHandler: requireAuth }, async (req) => {
    const rows = await db.job.findMany({
      include: { _count: { select: { applications: true } }, applications: { where: { userId: req.userId } } },
      orderBy: { createdAt: 'desc' },
    })
    return {
      jobs: rows.map((j) => ({
        id: j.id, title: j.title, org: j.org, type: j.type, mode: j.mode, pay: j.pay,
        tags: j.tags, hot: j.hot, posted: j.postedLabel,
        applicants: j.applicantsBase + j._count.applications,
        applied: j.applications.length > 0,
      })),
    }
  })

  app.post('/api/jobs/:id/apply', { preHandler: requireAuth }, async (req) => {
    await db.jobApplication.upsert({
      where: { userId_jobId: { userId: req.userId, jobId: req.params.id } },
      create: { userId: req.userId, jobId: req.params.id },
      update: {},
    })
    return { applied: true }
  })

  /* ---------- saved collection ---------- */
  app.get('/api/saved', { preHandler: requireAuth }, async (req) => {
    const rows = await db.savedItem.findMany({ where: { userId: req.userId } })
    return { keys: rows.map((r) => `${r.itemType}:${r.refId}`) }
  })

  app.put('/api/saved/:type/:refId', { preHandler: requireAuth }, async (req) => {
    const key = { userId: req.userId, itemType: req.params.type, refId: req.params.refId }
    const existing = await db.savedItem.findUnique({ where: { userId_itemType_refId: key } })
    if (existing) {
      await db.savedItem.delete({ where: { userId_itemType_refId: key } })
      return { saved: false }
    }
    await db.savedItem.create({ data: key })
    return { saved: true }
  })

  /* ---------- connection requests ---------- */
  app.get('/api/requests', { preHandler: requireAuth }, async (req) => {
    const rows = await db.connectionRequest.findMany({
      where: { toId: req.userId, status: 'PENDING' },
      include: { from: true },
      orderBy: { createdAt: 'desc' },
    })
    return { requests: rows.map((r) => ({ id: r.id, note: r.note, person: personCard(r.from) })) }
  })

  app.post('/api/requests', { preHandler: requireAuth }, async (req, reply) => {
    const { toId, note } = req.body || {}
    if (!toId || toId === req.userId) return reply.code(400).send({ error: 'Invalid target' })
    await db.connectionRequest.upsert({
      where: { fromId_toId: { fromId: req.userId, toId } },
      create: { fromId: req.userId, toId, note: note || null },
      update: {},
    })
    const from = await db.user.findUnique({ where: { id: req.userId }, select: { name: true } })
    await notify(toId, 'invite', `${from.name} wants to connect with you.`, req.userId)
    return { sent: true }
  })

  app.post('/api/requests/:id/respond', { preHandler: requireAuth }, async (req, reply) => {
    const { accept } = req.body || {}
    const r = await db.connectionRequest.findUnique({ where: { id: req.params.id } })
    if (!r || r.toId !== req.userId) return reply.code(404).send({ error: 'Request not found' })
    await db.connectionRequest.update({
      where: { id: r.id },
      data: { status: accept ? 'ACCEPTED' : 'DECLINED' },
    })
    if (accept) {
      const [userAId, userBId] = pair(r.fromId, r.toId)
      await db.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId, score: 75, why: ['Connected via direct request'] },
        update: {},
      })
      const me = await db.user.findUnique({ where: { id: req.userId }, select: { name: true } })
      await notify(r.fromId, 'match', `${me.name} accepted your connection request.`, req.userId)
    }
    return { ok: true }
  })

  /* ---------- invitations ---------- */
  app.get('/api/invitations', { preHandler: requireAuth }, async (req) => {
    const rows = await db.invitation.findMany({
      where: { toId: req.userId, status: 'PENDING' },
      include: { from: true },
    })
    return {
      invitations: rows.map((i) => ({
        id: i.id, kind: i.kind, title: i.title, detail: i.detail, icon: i.icon,
        from: personCard(i.from),
      })),
    }
  })

  app.post('/api/invitations/:id/respond', { preHandler: requireAuth }, async (req, reply) => {
    const inv = await db.invitation.findUnique({ where: { id: req.params.id } })
    if (!inv || inv.toId !== req.userId) return reply.code(404).send({ error: 'Invitation not found' })
    await db.invitation.update({
      where: { id: inv.id },
      data: { status: req.body?.accept ? 'ACCEPTED' : 'DECLINED' },
    })
    return { ok: true }
  })

  /* ---------- notifications ---------- */
  app.get('/api/notifications', { preHandler: requireAuth }, async (req) => {
    const rows = await db.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    })
    const actorIds = [...new Set(rows.map((n) => n.actorId).filter(Boolean))]
    const actors = await db.user.findMany({ where: { id: { in: actorIds } } })
    const avatarOf = Object.fromEntries(actors.map((a) => [a.id, a.avatar]))
    return {
      notifications: rows.map((n) => ({
        id: n.id, kind: n.kind, text: n.text, read: n.read, at: n.createdAt,
        avatar: n.actorId ? avatarOf[n.actorId] : null,
      })),
    }
  })

  app.post('/api/notifications/read-all', { preHandler: requireAuth }, async (req) => {
    await db.notification.updateMany({ where: { userId: req.userId, read: false }, data: { read: true } })
    return { ok: true }
  })
}
