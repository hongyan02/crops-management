import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./server/db/config";

const databaseConfig = getDatabaseConfig();

export default defineConfig({
  out: "./server/db/pg-migrations",
  schema: "./server/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseConfig.url,
  },
  strict: true,
  verbose: true,
});
