import { PrismaClient } from '@prisma/client'

const catalogUrl = process.env.TCGDB_URL

const globalForPrisma = global as unknown as { prismaCatalog: PrismaClient }

export const prismaCatalog = catalogUrl
  ? globalForPrisma.prismaCatalog ||
    new PrismaClient({
      datasources: {
        db: { url: catalogUrl },
      },
    })
  : undefined

if (process.env.NODE_ENV !== 'production' && prismaCatalog) {
  globalForPrisma.prismaCatalog = prismaCatalog
}
