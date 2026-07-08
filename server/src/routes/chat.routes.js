import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { personCard } from '../serialize.js'
import { icebreakers } from '../matching.js'
import { notify, emitToUser } from '../realtime.js'

const matchInclude = {
  userA: { include: { memberships: { include: { community: true } } } },
  userB: { include: { memberships: { include: { community: true } } } },
}

function shape(match, meId, lastMessage, unread) {
  const other = match.userAId === meId ? match.userB : match.userA
  const me = match.userAId === meId ? match.userA : match.userB
  return {
    id: match.id,
    score: match.score,
    person: personCard(other, { match: match.score, why: match.why }),
    icebreakers: icebreakers(me, other, match.why),
    lastMessage: lastMessage
      ? { body: lastMessage.kind === 'CODE' ? '{ code snippet }' : lastMessage.body, at: lastMessage.createdAt, mine: lastMessage.senderId === meId }
      : null,
    unread,
  }
}

export default async function chatRoutes(app) {
  app.get('/api/matches', { preHandler: requireAuth }, async (req) => {
    const matches = await db.match.findMany({
      where: { OR: [{ userAId: req.userId }, { userBId: req.userId }] },
      include: {
        ...matchInclude,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })
    const shaped = await Promise.all(
      matches.map(async (m) => {
        const lastSeen = m.userAId === req.userId ? m.lastSeenA : m.lastSeenB
        const unread = await db.message.count({
          where: { matchId: m.id, senderId: { not: req.userId }, createdAt: { gt: lastSeen } },
        })
        return shape(m, req.userId, m.messages[0], unread)
      })
    )
    shaped.sort((a, b) => new Date(b.lastMessage?.at || 0) - new Date(a.lastMessage?.at || 0))
    return { matches: shaped }
  })

  app.get('/api/matches/:id/messages', { preHandler: requireAuth }, async (req, reply) => {
    const match = await db.match.findUnique({ where: { id: req.params.id } })
    if (!match || (match.userAId !== req.userId && match.userBId !== req.userId))
      return reply.code(404).send({ error: 'Match not found' })

    const seenField = match.userAId === req.userId ? 'lastSeenA' : 'lastSeenB'
    await db.match.update({ where: { id: match.id }, data: { [seenField]: new Date() } })

    const messages = await db.message.findMany({
      where: { matchId: match.id },
      orderBy: { createdAt: 'asc' },
    })
    return {
      messages: messages.map((m) => ({
        id: m.id,
        from: m.senderId === req.userId ? 'me' : 'them',
        kind: m.kind,
        body: m.body,
        at: m.createdAt,
      })),
    }
  })

  app.post('/api/matches/:id/messages', { preHandler: requireAuth }, async (req, reply) => {
    const { body, kind = 'TEXT' } = req.body || {}
    if (!body?.trim()) return reply.code(400).send({ error: 'Empty message' })
    const match = await db.match.findUnique({ where: { id: req.params.id } })
    if (!match || (match.userAId !== req.userId && match.userBId !== req.userId))
      return reply.code(404).send({ error: 'Match not found' })

    const msg = await db.message.create({
      data: { matchId: match.id, senderId: req.userId, body: body.trim(), kind },
    })
    const otherId = match.userAId === req.userId ? match.userBId : match.userAId
    const sender = await db.user.findUnique({ where: { id: req.userId }, select: { name: true } })

    emitToUser(otherId, 'message:new', {
      matchId: match.id,
      message: { id: msg.id, from: 'them', kind: msg.kind, body: msg.body, at: msg.createdAt },
    })
    await notify(otherId, 'message', `${sender.name}: "${body.slice(0, 60)}${body.length > 60 ? '…' : ''}"`, req.userId)

    return { message: { id: msg.id, from: 'me', kind: msg.kind, body: msg.body, at: msg.createdAt } }
  })
}
