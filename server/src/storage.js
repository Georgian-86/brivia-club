import { createClient } from '@supabase/supabase-js'

/* ============================================================
   Supabase Storage — signed direct-to-bucket uploads.

   The service_role key lives ONLY here (server-side). The client
   never sees it: it asks /api/uploads/sign for a short-lived signed
   URL, PUTs the file straight to Supabase, then PATCHes the returned
   public URL onto its record. Bucket `brivia-uploads` is public-read.
   ============================================================ */

export const BUCKET = 'brivia-uploads'

let _sb = null
export function storageReady() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
}
function sb() {
  if (!storageReady()) throw new Error('Supabase Storage is not configured')
  if (!_sb) {
    _sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { persistSession: false },
    })
  }
  return _sb
}

const EXT = { image: ['png', 'jpg', 'jpeg', 'webp', 'gif'], video: ['mp4', 'webm', 'mov'], audio: ['webm', 'mp3', 'm4a', 'ogg'], doc: ['pdf', 'doc', 'docx'] }
const KIND_DIR = { avatar: 'avatars', cover: 'covers', resume: 'resumes', video: 'videos', attachment: 'attachments', voice: 'voice' }

const sanitizeExt = (ext, kind) => {
  const e = `${ext || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5)
  const bucket = kind === 'resume' ? 'doc' : kind === 'video' ? 'video' : kind === 'voice' ? 'audio' : 'image'
  return EXT[bucket].includes(e) ? e : EXT[bucket][0]
}

/** Create a one-time signed upload URL scoped to this user + kind. */
export async function signUpload(userId, kind, ext) {
  const dir = KIND_DIR[kind] || 'misc'
  // unique, non-guessable path; time component keeps repeat uploads distinct
  const rand = Math.random().toString(36).slice(2, 10)
  const path = `${dir}/${userId}/${Date.now()}-${rand}.${sanitizeExt(ext, kind)}`
  const { data, error } = await sb().storage.from(BUCKET).createSignedUploadUrl(path)
  if (error) throw new Error(error.message)
  const { data: pub } = sb().storage.from(BUCKET).getPublicUrl(path)
  // normalize to an absolute URL so the browser can PUT to it directly
  const uploadUrl = data.signedUrl.startsWith('http')
    ? data.signedUrl
    : `${process.env.SUPABASE_URL}${data.signedUrl}`
  return { path, token: data.token, uploadUrl, publicUrl: pub.publicUrl }
}
