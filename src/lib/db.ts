import { PrismaClient } from '../generated/prisma';

/**
 * Prisma Client DB Singleton
 * 
 * This creates a single PrismaClient instance shared across all requests.
 */

// Prevent multiple instances in development due to hot reloading
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

  // This creates a singleton instance of PrismaClient.
export const db =
  globalThis.prisma ||
  new PrismaClient({
    // Configure logging based on environment - reduce verbosity
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });// In development, preserve the instance across hot reloads
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Handle graceful shutdown
const handleShutdown = async () => {
  await db.$disconnect();
  process.exit(0);
};

if (typeof process !== 'undefined') {
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);
}

// Export types for better TypeScript support
export * from '../generated/prisma';

// Export the default db instance
export default db;
