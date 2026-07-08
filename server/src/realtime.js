import { Server } from 'socket.io'
import { verifyToken } from './auth.js'
import { db } from './db.js'

/* Socket.IO on the same HTTP server. One room per user id.
   Scale path: io.adapter(createAdapter(redisPub, redisSub)) and
   this fan-out works unchanged across N API replicas. */

let io = null

export function initRealtime(httpServer) {
  io = new Server(httpServer, { path: '/socket.io', cors: { origin: true } })

  io.use((socket, next) => {
    try {
      const payload = verifyToken(socket.handshake.auth?.token)
      socket.userId = payload.sub
      next()
    } catch {
      next(new Error('unauthorized'))
    }
  })

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.userId}`)
    await db.user.update({ where: { id: socket.userId }, data: { online: true } }).catch(() => {})

    socket.on('disconnect', async () => {
      // only mark offline when the last tab closes
      const rooms = await io.in(`user:${socket.userId}`).fetchSockets()
      if (rooms.length === 0) {
        await db.user.update({ where: { id: socket.userId }, data: { online: false } }).catch(() => {})
      }
    })
  })

  return io
}

export function emitToUser(userId, event, payload) {
  io?.to(`user:${userId}`).emit(event, payload)
}

/** Persist a notification and push it live in one move. */
export async function notify(userId, kind, text, actorId = null) {
  const n = await db.notification.create({ data: { userId, kind, text, actorId } })
  emitToUser(userId, 'notification:new', n)
  return n
}
