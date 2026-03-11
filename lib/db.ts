import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getConnectionString(): string {
  const url = process.env.DATABASE_URL!;
  if (url.startsWith("prisma+postgres://")) {
    const parsed = new URL(url.replace("prisma+postgres://", "https://"));
    const apiKey = parsed.searchParams.get("api_key");
    if (apiKey) {
      const decoded = JSON.parse(Buffer.from(apiKey, "base64").toString());
      return decoded.databaseUrl;
    }
  }
  return url;
}

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: getConnectionString(),
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
