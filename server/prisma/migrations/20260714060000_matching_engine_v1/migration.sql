-- Matching engine v1: pgvector embeddings + interaction log + learned taste profiles.
-- pgvector ships natively on Supabase; local dev uses the pgvector/pgvector:pg16 image.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateTable
CREATE TABLE "ProfileEmbedding" (
    "userId" TEXT NOT NULL,
    "profileVec" vector(384),
    "intentVec" vector(384),
    "textHash" TEXT NOT NULL DEFAULT '',
    "provider" TEXT NOT NULL DEFAULT 'local-minilm',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileEmbedding_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Interaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "context" TEXT NOT NULL DEFAULT 'deck',
    "features" JSONB,
    "score" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TasteProfile" (
    "userId" TEXT NOT NULL,
    "weights" JSONB NOT NULL,
    "bias" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "samples" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TasteProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "Interaction_userId_targetId_createdAt_idx" ON "Interaction"("userId", "targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Interaction_event_createdAt_idx" ON "Interaction"("event", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileEmbedding" ADD CONSTRAINT "ProfileEmbedding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TasteProfile" ADD CONSTRAINT "TasteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ANN indexes (HNSW, cosine) — overkill at beta scale, load-bearing at 10k members.
CREATE INDEX "ProfileEmbedding_profileVec_hnsw" ON "ProfileEmbedding" USING hnsw ("profileVec" vector_cosine_ops);
CREATE INDEX "ProfileEmbedding_intentVec_hnsw" ON "ProfileEmbedding" USING hnsw ("intentVec" vector_cosine_ops);
