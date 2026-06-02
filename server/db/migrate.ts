import { resolve } from "node:path";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db } from "./index";

async function main() {
  await migrate(db, {
    migrationsFolder: resolve("./server/db/pg-migrations"),
  });

  console.log("PostgreSQL migrations applied.");
}

main().catch((error) => {
  console.error("Failed to apply PostgreSQL migrations.");
  console.error(error);
  process.exit(1);
});
