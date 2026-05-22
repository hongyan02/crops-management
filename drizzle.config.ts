import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL ?? "./data/app.db";
const normalizedUrl = databaseUrl.startsWith("file:")
  ? databaseUrl
  : `file:${databaseUrl}`;

export default defineConfig({
  out: "./server/db/migrations",
  schema: "./server/db/schema/index.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: normalizedUrl,
  },
  strict: true,
  verbose: true,
});
