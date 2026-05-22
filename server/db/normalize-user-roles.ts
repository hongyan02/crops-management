import { sqliteClient } from "./index";

async function main() {
  const result = await sqliteClient.execute({
    sql: "update user set role = ? where role = ?",
    args: ["admin", "super_admin"],
  });

  console.log(`Normalized legacy roles to admin. Updated ${result.rowsAffected ?? 0} users.`);
}

main().catch((error) => {
  console.error("Failed to normalize user roles.");
  console.error(error);
  process.exit(1);
});
