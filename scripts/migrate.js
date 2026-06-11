#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function shouldUseSsl(databaseUrl) {
  if (process.env.PGSSLMODE === "disable" || process.env.DATABASE_SSL === "false") return false;
  if (process.env.DATABASE_SSL === "true" || process.env.PGSSLMODE === "require") return true;

  try {
    const { hostname } = new URL(databaseUrl);
    return !["localhost", "127.0.0.1", "::1"].includes(hostname);
  } catch (_error) {
    return process.env.NODE_ENV === "production";
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations.");
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    ssl: shouldUseSsl(databaseUrl) ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, "..", "migrations");
    const files = fs.readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE filename = $1",
        [file],
      );
      if (alreadyApplied.rowCount > 0) {
        console.log(`Skipping already-applied migration: ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      console.log(`Applying migration: ${file}`);
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
    }

    await client.query("COMMIT");
    console.log("Migrations complete");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
