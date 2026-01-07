// Prisma is optional - only loaded when needed
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let prisma: any = null;
let PrismaClient: any = null;

/**
 * Get or create a singleton PrismaClient instance.
 * Safe for use in long-running Node processes.
 * 
 * Note: Only call this if your app uses a database.
 * Throws an error if @prisma/client is not installed.
 */
export function getPrismaClient(): any {
  if (!prisma) {
    if (!PrismaClient) {
      try {
        // Dynamic import to make Prisma optional
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        PrismaClient = require("@prisma/client").PrismaClient;
      } catch {
        throw new Error(
          "Prisma is not installed. Run 'npm install @prisma/client prisma' to use database features."
        );
      }
    }
    prisma = new PrismaClient();
  }
  return prisma;
}

/**
 * Disconnect the Prisma client.
 * Useful for graceful shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}
