import { sql } from "drizzle-orm";

import { db } from "./index";

async function main() {
  const result = await db.execute(sql`update "user" set role = 'admin' where role = 'super_admin'`);

  console.log(`Normalized legacy roles to admin. Updated ${result.rowCount ?? 0} users.`);
}

main().catch((error) => {
  console.error("Failed to normalize user roles.");
  console.error(error);
  process.exit(1);
});
