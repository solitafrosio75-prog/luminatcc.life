/**
 * Barrel export del módulo Prisma/SQLite de tcc-lab.
 *
 * IMPORTANTE: Estos módulos solo funcionan en Node.js (tests, scripts, backend).
 * En el browser, usar los equivalentes Dexie de src/db/.
 */
export { prisma } from './client';
export * as conversationOpsPrisma from './conversationOps.prisma';
export { getLatestClinicalMessagePrisma } from './getLatestClinicalMessage.prisma';
