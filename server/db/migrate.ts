import { resolve } from "node:path";

import { migrate } from "drizzle-orm/libsql/migrator";

import { db } from "./index";

async function main() {
  migrate(db, {
    migrationsFolder: resolve("./server/db/migrations"),
  });

  console.log("SQLite migrations applied.");
}

main().catch((error) => {
  console.error("Failed to apply SQLite migrations.");
  console.error(error);
  process.exit(1);
});
