import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import { schema } from "./schema";

const rawUrl = process.env.DATABASE_URL ?? "./data/app.db";
const localPath = rawUrl.startsWith("file:") ? rawUrl.replace(/^file:/, "") : rawUrl;
const resolvedUrl = resolve(localPath);
const databaseUrl = rawUrl.startsWith("file:") ? rawUrl : `file:${resolvedUrl}`;

mkdirSync(dirname(resolvedUrl), { recursive: true });

const globalForDatabase = globalThis as typeof globalThis & {
  sqliteClient?: ReturnType<typeof createClient>;
};

const sqliteClient = globalForDatabase.sqliteClient ?? createClient({ url: databaseUrl });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.sqliteClient = sqliteClient;
}

export { sqliteClient };
export const db = drizzle(sqliteClient, { schema });
