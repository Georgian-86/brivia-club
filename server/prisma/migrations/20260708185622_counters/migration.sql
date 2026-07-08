-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "applicantsBase" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "postedLabel" TEXT NOT NULL DEFAULT 'new';

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "likesBase" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "applicantsBase" INTEGER NOT NULL DEFAULT 0;
