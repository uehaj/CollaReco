import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client/web";

import { env } from "~/env";

const createPrismaClient = () => {
  if (env.TURSO_DATABASE_URL !== undefined) {
    const libsql = createClient({
      url: env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({
      adapter,
      log:
        env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
  else {
    return new PrismaClient({
      log:
        env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
  }
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// import { PrismaClient } from "@prisma/client";
// 
// import { env } from "~/env";
// 
// const createPrismaClient = () =>
//   new PrismaClient({
//     log:
//       env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
//   });
// 
// const globalForPrisma = globalThis as unknown as {
//   prisma: ReturnType<typeof createPrismaClient> | undefined;
// };
// 
// export const db = globalForPrisma.prisma ?? createPrismaClient();
// 
// if (env.NODE_ENV !== "production") globalForPrisma.prisma = db;
