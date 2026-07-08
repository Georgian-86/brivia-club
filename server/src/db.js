import { PrismaClient } from '@prisma/client'

/** Single Prisma instance per process — pooling is Prisma's job.
 *  At scale: point DATABASE_URL at PgBouncer, add read-replica URLs. */
export const db = new PrismaClient()
