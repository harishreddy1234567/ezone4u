import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const createPrismaClient = () => {
  const databaseUrl =
    process.env.DATABASE_URL || "mysql://root:password@127.0.0.1:3306/ezone4u";

  // Ensure allowPublicKeyRetrieval=true is present for MySQL 8 caching_sha2_password authentication
  const separator = databaseUrl.includes("?") ? "&" : "?";
  const urlWithParams = databaseUrl.includes("allowPublicKeyRetrieval")
    ? databaseUrl
    : `${databaseUrl}${separator}allowPublicKeyRetrieval=true`;

  const adapter = new PrismaMariaDb(urlWithParams);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
