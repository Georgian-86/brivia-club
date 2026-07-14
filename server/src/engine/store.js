import { Prisma } from '@prisma/client'
import { db } from '../db.js'
import { profileDoc, intentDoc, textHash } from './text.js'
import { embed, embeddingsProvider } from './embeddings.js'

/* ============================================================
   Vector store — the only file that speaks pgvector SQL.
   Prisma can't address vector columns, so reads/writes here are
   raw and parameterized; everything returns plain JS arrays.
   ============================================================ */

const vecLiteral = (arr) => `[${arr.map((x) => +x.toFixed(6)).join(',')}]`

/** Compute + persist both embeddings for a user. No-op when text is unchanged. */
export async function refreshUserEmbedding(user, { force = false } = {}) {
  const provider = embeddingsProvider()
  if (provider === 'none') return false
  const hash = textHash(user, provider)
  if (!force) {
    const existing = await db.profileEmbedding.findUnique({ where: { userId: user.id }, select: { textHash: true } })
    if (existing?.textHash === hash) return false
  }
  const pDoc = profileDoc(user)
  const iDoc = intentDoc(user)
  // an empty form embeds to noise — no vector is more honest than a fake one
  if (pDoc.length + iDoc.length < 40) return false
  const vecs = await embed([pDoc, iDoc])
  if (!vecs) return false
  const [profileVec, intentVec] = vecs.map(vecLiteral)
  await db.$executeRaw`
    INSERT INTO "ProfileEmbedding" ("userId", "profileVec", "intentVec", "textHash", "provider", "updatedAt")
    VALUES (${user.id}, ${profileVec}::vector, ${intentVec}::vector, ${hash}, ${provider}, now())
    ON CONFLICT ("userId") DO UPDATE
    SET "profileVec" = EXCLUDED."profileVec", "intentVec" = EXCLUDED."intentVec",
        "textHash" = EXCLUDED."textHash", "provider" = EXCLUDED."provider", "updatedAt" = now()`
  return true
}

/** Batch-fetch vectors → Map(userId → { profile: number[], intent: number[] }). */
export async function getVectors(userIds) {
  const out = new Map()
  if (!userIds.length) return out
  const rows = await db.$queryRaw`
    SELECT "userId", "profileVec"::text AS p, "intentVec"::text AS i
    FROM "ProfileEmbedding" WHERE "userId" IN (${Prisma.join(userIds)})`
  for (const r of rows) {
    out.set(r.userId, {
      profile: r.p ? JSON.parse(r.p) : null,
      intent: r.i ? JSON.parse(r.i) : null,
    })
  }
  return out
}

/**
 * ANN candidates for a viewer, bidirectional: members whose PROFILE sits
 * closest to my INTENT, unioned with members whose INTENT sits closest
 * to my PROFILE. Cosine distance, HNSW-indexed.
 */
export async function annCandidateIds(viewerId, { perSide = 80, excludeIds = [] } = {}) {
  const excl = [viewerId, ...excludeIds]
  const rows = await db.$queryRaw`
    WITH me AS (SELECT "profileVec" AS pv, "intentVec" AS iv FROM "ProfileEmbedding" WHERE "userId" = ${viewerId})
    (SELECT e."userId" FROM "ProfileEmbedding" e, me
      WHERE e."userId" NOT IN (${Prisma.join(excl)}) AND e."profileVec" IS NOT NULL AND me.iv IS NOT NULL
      ORDER BY e."profileVec" <=> me.iv LIMIT ${perSide})
    UNION
    (SELECT e."userId" FROM "ProfileEmbedding" e, me
      WHERE e."userId" NOT IN (${Prisma.join(excl)}) AND e."intentVec" IS NOT NULL AND me.pv IS NOT NULL
      ORDER BY e."intentVec" <=> me.pv LIMIT ${perSide})`
  return rows.map((r) => r.userId)
}

/** Nearest profiles to a free-text query vector — semantic people search. */
export async function semanticNeighborIds(queryVec, { limit = 40, excludeIds = [] } = {}) {
  const lit = vecLiteral(queryVec)
  const excl = excludeIds.length ? Prisma.sql`AND "userId" NOT IN (${Prisma.join(excludeIds)})` : Prisma.empty
  const rows = await db.$queryRaw`
    SELECT "userId", 1 - ("profileVec" <=> ${lit}::vector) AS sim
    FROM "ProfileEmbedding"
    WHERE "profileVec" IS NOT NULL ${excl}
    ORDER BY "profileVec" <=> ${lit}::vector
    LIMIT ${limit}`
  return rows.map((r) => ({ userId: r.userId, sim: Number(r.sim) }))
}

/** Members that still need an embedding (for backfill / self-heal). */
export async function usersMissingEmbedding(limit = 50) {
  return db.$queryRaw`
    SELECT u.id FROM "User" u
    LEFT JOIN "ProfileEmbedding" e ON e."userId" = u.id
    WHERE e."userId" IS NULL
    LIMIT ${limit}`
}
