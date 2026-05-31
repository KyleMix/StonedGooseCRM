// Single Prisma client for the whole app.
//
// This is the ONLY place that instantiates Prisma. Every query goes through
// here, which is what keeps a future swap to a hosted DB (Turso/Postgres) a
// small, localized change.
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
