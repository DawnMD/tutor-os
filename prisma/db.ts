import { PrismaClient } from "@/prisma/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "@/env";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient;
};

const neonAdaptor = new PrismaNeon({
  connectionString: env.DATABASE_URL,
});

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: neonAdaptor,
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { prisma as db };
