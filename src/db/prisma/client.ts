/**
 * Singleton de PrismaClient para tcc-lab.
 *
 * Prisma 7 requiere un adapter explícito para SQLite. Usamos
 * @prisma/adapter-better-sqlite3 que opera sobre better-sqlite3.
 *
 * Usa el patrón globalThis para evitar múltiples instancias en desarrollo
 * (HMR recrea módulos, pero globalThis persiste).
 *
 * IMPORTANTE: Este cliente solo funciona en entornos Node.js (tests, scripts,
 * futuro backend). En el browser, la app usa Dexie (IndexedDB).
 */
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

// URL de conexión SQLite — misma que en prisma.config.ts
// Ruta relativa al cwd del proceso (project root)
const DB_URL = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

function createPrismaClient(): PrismaClient {
    const adapter = new PrismaBetterSqlite3({ url: DB_URL });
    return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
    __prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prisma = prisma;
}
