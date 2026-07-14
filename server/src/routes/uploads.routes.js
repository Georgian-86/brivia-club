import { requireAuth } from '../auth.js'
import { signUpload, storageReady } from '../storage.js'

/* Uploads — hand the client a signed URL; it PUTs the file straight
   to Supabase, then PATCHes the returned publicUrl onto its record. */

export default async function uploadRoutes(app) {
  app.post('/api/uploads/sign', { preHandler: requireAuth }, async (req, reply) => {
    if (!storageReady()) return reply.code(503).send({ error: 'File uploads are not configured yet' })
    const { kind, ext } = req.body || {}
    const allowed = ['avatar', 'cover', 'resume', 'video', 'attachment', 'voice']
    if (!allowed.includes(kind)) return reply.code(400).send({ error: 'Unknown upload kind' })
    try {
      return await signUpload(req.userId, kind, ext)
    } catch (err) {
      return reply.code(502).send({ error: err.message })
    }
  })
}
