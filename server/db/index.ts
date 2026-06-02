import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

import { getDatabaseConfig } from "./config";
import { schema } from "./schema";

const databaseConfig = getDatabaseConfig();
const { Pool } = pg;

const globalForDatabase = globalThis as typeof globalThis & {
  pgPool?: pg.Pool;
};

const pgPool =
  globalForDatabase.pgPool ??
  new Pool({
    connectionString: databaseConfig.url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.pgPool = pgPool;
}

export { pgPool };
export const db = drizzle(pgPool, { schema });
