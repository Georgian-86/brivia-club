/* ============================================================
   Embedding provider — same pattern as the assistant: a FREE
   local default with zero keys, swappable to a paid API by env.

   local  (default) — MiniLM sentence embeddings via
                      @huggingface/transformers, quantized ONNX,
                      runs on CPU in-process. ~30MB one-time
                      model download, then fully offline.
   openai            EMBEDDINGS_PROVIDER=openai + OPENAI_API_KEY,
                      text-embedding-3-small at 384 dims so the
                      pgvector column never changes shape.
   none              structured + behavioral scoring only.

   If the local model can't load (no disk, no network on first
   boot), the engine degrades gracefully to 'none' — decks still
   work, semantic features just drop out of the score.
   ============================================================ */

export const EMBEDDING_DIM = 384

const LOCAL_MODEL = process.env.EMBEDDINGS_MODEL || 'Xenova/all-MiniLM-L6-v2'

let localPipe = null // resolved pipeline
let localLoading = null // in-flight promise
let localFailed = false

export function embeddingsProvider() {
  const p = (process.env.EMBEDDINGS_PROVIDER || 'local').toLowerCase()
  if (p === 'openai' && process.env.OPENAI_API_KEY) return 'openai'
  if (p === 'none') return 'none'
  return localFailed ? 'none' : 'local'
}

async function localPipeline() {
  if (localPipe) return localPipe
  if (!localLoading) {
    localLoading = (async () => {
      const { pipeline } = await import('@huggingface/transformers')
      localPipe = await pipeline('feature-extraction', LOCAL_MODEL, { dtype: 'q8' })
      return localPipe
    })().catch((err) => {
      localFailed = true
      localLoading = null
      console.warn(`[engine] local embedding model unavailable (${err.message}) — semantic layer off`)
      return null
    })
  }
  return localLoading
}

/** Fire-and-forget warmup so the first signup/search doesn't pay the load. */
export function warmup() {
  if (embeddingsProvider() === 'local') localPipeline()
}

async function embedLocal(texts) {
  const pipe = await localPipeline()
  if (!pipe) return null
  const out = await pipe(texts, { pooling: 'mean', normalize: true })
  return out.tolist()
}

async function embedOpenAI(texts) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts, dimensions: EMBEDDING_DIM }),
  })
  if (!res.ok) throw new Error(`openai embeddings ${res.status}`)
  const json = await res.json()
  return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding)
}

/**
 * embed(texts) → number[][] (unit-normalized) or null when no provider.
 * Never throws on the local path — matching must not depend on a model file.
 */
export async function embed(texts) {
  const list = Array.isArray(texts) ? texts : [texts]
  if (!list.length) return []
  const provider = embeddingsProvider()
  try {
    if (provider === 'openai') return await embedOpenAI(list)
    if (provider === 'local') return await embedLocal(list)
  } catch (err) {
    console.warn(`[engine] embed failed via ${provider}: ${err.message}`)
  }
  return null
}

/** Cosine of two unit vectors (dot product). Returns null if either is missing. */
export function cosine(a, b) {
  if (!a || !b || a.length !== b.length) return null
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}
