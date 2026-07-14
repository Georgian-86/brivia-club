import { db } from '../db.js'
import { requireAuth } from '../auth.js'
import { getViewer, deckFor } from '../services/people.js'
import { scorePair, recordSwipe, logMatch } from '../engine/index.js'
import { personCard } from '../serialize.js'
import { notify, emitToUser } from '../realtime.js'

const pair = (a, b) => (a < b ? [a, b] : [b, a])

export default async function deckRoutes(app) {
  app.get('/api/deck', { preHandler: requireAuth }, async (req) => {
    const viewer = await getViewer(req.userId)
    return { deck: await deckFor(viewer, 12) }
  })

  app.post('/api/swipes', { preHandler: requireAuth }, async (req, reply) => {
    const { targetId, action } = req.body || {}
    if (!targetId || !['LIKE', 'PASS', 'SUPER'].includes(action))
      return reply.code(400).send({ error: 'targetId and a valid action are required' })

    const target = await db.user.findUnique({
      where: { id: targetId },
      include: { memberships: { include: { community: true } } },
    })
    if (!target) return reply.code(404).send({ error: 'No such member' })

    await db.swipe.upsert({
      where: { swiperId_targetId: { swiperId: req.userId, targetId } },
      create: { swiperId: req.userId, targetId, action },
      update: { action },
    })

    // swiping on someone counts as a profile view — feeds analytics
    await db.profileView.create({ data: { viewerId: req.userId, targetId } })

    const me = await getViewer(req.userId)
    // every swipe = one training example + one step of the member's taste model
    recordSwipe(me, target, action).catch(() => {})

    if (action === 'PASS') return { matched: false }

    if (action === 'SUPER') await notify(targetId, 'match', `🔥 Super Connect! Someone jumped the queue for you.`, req.userId)

    // mutual interest → match. SUPER connects instantly (that's the perk).
    const reverse = await db.swipe.findUnique({
      where: { swiperId_targetId: { swiperId: targetId, targetId: req.userId } },
    })
    const mutual = action === 'SUPER' || (reverse && reverse.action !== 'PASS')
    if (!mutual) return { matched: false }

    const { score, why } = await scorePair(me, target)
    const [userAId, userBId] = pair(req.userId, targetId)
    const match = await db.match.upsert({
      where: { userAId_userBId: { userAId, userBId } },
      create: { userAId, userBId, score, why },
      update: {},
    })
    logMatch(userAId, userBId, score).catch(() => {})

    await notify(targetId, 'match', `New match! You and ${me.name} both swiped right.`, req.userId)
    emitToUser(targetId, 'match:new', { matchId: match.id })

    return {
      matched: true,
      match: { id: match.id, score, person: personCard(target, { match: score, why }) },
    }
  })
}
