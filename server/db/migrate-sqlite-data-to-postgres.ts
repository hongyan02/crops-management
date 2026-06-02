import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

import pg from "pg";

import "./config";

type SqliteRow = Record<string, unknown>;

type TableConfig = {
  name: string;
  columns: string[];
  transform?: (row: SqliteRow) => Record<string, unknown>;
  sequenceColumn?: string;
};

const { Pool } = pg;
const sqliteDatabasePath = resolve(process.env.SQLITE_DATABASE_PATH ?? "data/app.db");
const shouldTruncate = process.argv.includes("--truncate");

const authTimestampColumns = new Set([
  "createdAt",
  "updatedAt",
  "expiresAt",
  "accessTokenExpiresAt",
  "refreshTokenExpiresAt",
  "lastLoginAt",
]);

const businessTimestampColumns = new Set(["created_at", "recorded_at", "quoted_at"]);

const tables: TableConfig[] = [
  {
    name: "user",
    columns: [
      "id",
      "name",
      "email",
      "emailVerified",
      "image",
      "createdAt",
      "updatedAt",
      "username",
      "displayUsername",
      "role",
      "status",
      "lastLoginAt",
      "createdBy",
    ],
    transform: (row) => ({
      ...convertTimestamps(row, authTimestampColumns, 1),
      emailVerified: Boolean(Number(row.emailVerified ?? 0)),
    }),
  },
  {
    name: "session",
    columns: ["id", "expiresAt", "token", "createdAt", "updatedAt", "ipAddress", "userAgent", "userId"],
    transform: (row) => convertTimestamps(row, authTimestampColumns, 1),
  },
  {
    name: "account",
    columns: [
      "id",
      "accountId",
      "providerId",
      "userId",
      "accessToken",
      "refreshToken",
      "idToken",
      "accessTokenExpiresAt",
      "refreshTokenExpiresAt",
      "scope",
      "password",
      "createdAt",
      "updatedAt",
    ],
    transform: (row) => convertTimestamps(row, authTimestampColumns, 1),
  },
  {
    name: "verification",
    columns: ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
    transform: (row) => convertTimestamps(row, authTimestampColumns, 1),
  },
  {
    name: "products",
    columns: ["id", "name", "category", "unit", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "quality_metrics",
    columns: ["id", "name", "unit", "description", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "product_metrics",
    columns: ["product_id", "metric_id", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
  },
  {
    name: "suppliers",
    columns: ["id", "name", "contact", "phone", "address", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "supplier_products",
    columns: ["supplier_id", "product_id", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
  },
  {
    name: "supplier_quality",
    columns: [
      "id",
      "supplier_id",
      "product_id",
      "metric_id",
      "value",
      "batch_no",
      "recorded_at",
      "created_at",
    ],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "buyers",
    columns: ["id", "name", "contact", "phone", "address", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "buyer_products",
    columns: ["buyer_id", "product_id", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
  },
  {
    name: "buyer_requirements",
    columns: [
      "id",
      "buyer_id",
      "product_id",
      "metric_id",
      "quality_level",
      "min_value",
      "max_value",
      "quality_standard",
      "notes",
      "created_at",
    ],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
  {
    name: "supplier_product_prices",
    columns: ["id", "supplier_id", "product_id", "price", "quoted_at", "note", "created_at"],
    transform: (row) => convertTimestamps(row, businessTimestampColumns, 1000),
    sequenceColumn: "id",
  },
];

function quoteIdentifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function readSqliteRows(tableName: string) {
  const output = execFileSync("sqlite3", [
    sqliteDatabasePath,
    "-json",
    `select * from ${quoteIdentifier(tableName)}`,
  ]).toString();

  return output.trim() ? (JSON.parse(output) as SqliteRow[]) : [];
}

function convertTimestamps(row: SqliteRow, timestampColumns: Set<string>, multiplier: number) {
  const converted = { ...row };

  for (const column of timestampColumns) {
    const value = converted[column];

    if (value === null || value === undefined || value === "") {
      converted[column] = null;
      continue;
    }

    converted[column] = new Date(Number(value) * multiplier);
  }

  return converted;
}

async function truncateTables(client: pg.PoolClient) {
  const tableList = [...tables].reverse().map((table) => quoteIdentifier(table.name)).join(", ");
  await client.query(`truncate table ${tableList} restart identity cascade`);
}

async function insertRows(client: pg.PoolClient, table: TableConfig, rows: SqliteRow[]) {
  if (rows.length === 0) {
    return 0;
  }

  const tableName = quoteIdentifier(table.name);
  const columns = table.columns.map(quoteIdentifier).join(", ");
  const placeholders = table.columns.map((_, index) => `$${index + 1}`).join(", ");
  const sql = `insert into ${tableName} (${columns}) values (${placeholders})`;

  for (const row of rows) {
    const transformed = table.transform ? table.transform(row) : row;
    const values = table.columns.map((column) => transformed[column] ?? null);
    await client.query(sql, values);
  }

  return rows.length;
}

async function resetSequence(client: pg.PoolClient, table: TableConfig) {
  if (!table.sequenceColumn) {
    return;
  }

  const tableName = quoteIdentifier(table.name);
  const columnName = quoteIdentifier(table.sequenceColumn);

  await client.query(`
    select setval(
      pg_get_serial_sequence('${table.name}', '${table.sequenceColumn}'),
      coalesce((select max(${columnName}) from ${tableName}), 1),
      exists(select 1 from ${tableName})
    )
  `);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required.");
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query("begin");

    if (shouldTruncate) {
      await truncateTables(client);
    }

    const summary: Record<string, number> = {};

    for (const table of tables) {
      const rows = readSqliteRows(table.name);
      summary[table.name] = await insertRows(client, table, rows);
      await resetSequence(client, table);
    }

    await client.query("commit");
    console.table(summary);
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Failed to migrate SQLite data to PostgreSQL.");
  console.error(error);
  process.exit(1);
});
