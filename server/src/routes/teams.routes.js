import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { personCard } from '../serialize.js'
import { notify } from '../realtime.js'

/* Team rooms — squads inside a hub. Replaces the hardcoded
   HACKATHON_TEAMS array; mirrors the community join pattern. */

const shape = (t, viewerId) => ({
  id: t.id,
  name: t.name,
  hub: t.hub,
  event: t.event,
  looking: t.looking,
  stack: t.stack,
  spots: Math.max(0, t.spots - t.members.length),
  owner: personCard(t.owner),
  members: t.members.map((m) => personCard(m.user)),
  isMember: t.members.some((m) => m.userId === viewerId),
  isOwner: t.ownerId === viewerId,
})

export default async function teamRoutes(app) {
  app.get('/api/teams', { preHandler: requireAuth }, async (req) => {
    const where = req.query?.hub ? { hub: req.query.hub } : {}
    const rows = await db.team.findMany({
      where,
      include: { owner: true, members: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return { teams: rows.map((t) => shape(t, req.userId)) }
  })

  app.post('/api/teams', { preHandler: requireAuth }, async (req, reply) => {
    const b = req.body || {}
    if (!`${b.name || ''}`.trim()) return reply.code(400).send({ error: 'Give your team a name' })
    const arr = (v) => (Array.isArray(v) ? v : `${v || ''}`.split(',').map((s) => s.trim()).filter(Boolean))
    const t = await db.team.create({
      data: {
        name: `${b.name}`.trim(),
        hub: b.hub || 'hackathon',
        event: b.event || null,
        looking: arr(b.looking),
        stack: arr(b.stack),
        spots: Math.max(1, Number(b.spots) || 3),
        ownerId: req.userId,
        members: { create: { userId: req.userId, role: 'Founder' } }, // owner auto-joins
      },
      include: { owner: true, members: { include: { user: true } } },
    })
    return { team: shape(t, req.userId) }
  })

  app.post('/api/teams/:id/join', { preHandler: requireAuth }, async (req, reply) => {
    const team = await db.team.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    })
    if (!team) return reply.code(404).send({ error: 'Team not found' })
    if (team.members.some((m) => m.userId === req.userId)) return reply.code(409).send({ error: 'You’re already on this team' })
    if (team.members.length >= team.spots) return reply.code(409).send({ error: 'This team is full' })

    await db.teamMember.create({ data: { userId: req.userId, teamId: team.id, role: req.body?.role || null } })
    const me = await db.user.findUnique({ where: { id: req.userId }, select: { name: true } })
    await notify(team.ownerId, 'invite', `${me.name} joined your team ${team.name}.`, req.userId)

    const full = await db.team.findUnique({
      where: { id: team.id },
      include: { owner: true, members: { include: { user: true } } },
    })
    return { team: shape(full, req.userId) }
  })
}
