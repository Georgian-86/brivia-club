import { db } from '../src/db.js'
import { refreshUserEmbedding } from '../src/engine/index.js'
import { embeddingsProvider } from '../src/engine/embeddings.js'

/* Backfill / repair profile embeddings for every member.
   Run after seeding, after switching EMBEDDINGS_PROVIDER, or on
   first deploy of the engine:  npm run engine:backfill
   Idempotent — unchanged profiles are skipped via textHash. */

const force = process.argv.includes('--force')

const users = await db.user.findMany()
console.log(`[backfill] ${users.length} members via provider "${embeddingsProvider()}"${force ? ' (forced)' : ''}`)

let done = 0
let skipped = 0
for (const u of users) {
  const wrote = await refreshUserEmbedding(u, { force })
  wrote ? done++ : skipped++
  if ((done + skipped) % 25 === 0) console.log(`[backfill] ${done + skipped}/${users.length}`)
}

console.log(`[backfill] complete — ${done} embedded, ${skipped} skipped (unchanged or provider off)`)
await db.$disconnect()
