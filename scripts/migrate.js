#!/usr/bin/env node
"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { Pool } = require("pg");

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to run migrations");

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch (_error) {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection string");
  }

  return {
    connectionString: databaseUrl,
    ssl: LOCAL_DB_HOSTS.has(parsed.hostname) ? false : { rejectUnauthorized: false },
    safeLabel: `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname}`,
  };
}

function checksum(sql) {
  return crypto.createHash("sha256").update(sql).digest("hex");
}

async function main() {
  const config = getDatabaseConfig();
  const pool = new Pool({ connectionString: config.connectionString, ssl: config.ssl });
  const migrationsDir = path.join(__dirname, "..", "migrations");
  const migrations = fs.readdirSync(migrationsDir)
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  console.log(`Running AnitaSet migrations against ${config.safeLabel}`);

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const file of migrations) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
      const hash = checksum(sql);
      const applied = await pool.query("SELECT checksum FROM schema_migrations WHERE id = $1", [file]);

      if (applied.rows[0]) {
        if (applied.rows[0].checksum !== hash) {
          throw new Error(`Migration checksum mismatch for ${file}`);
        }
        console.log(`Skipping already-applied migration ${file}`);
        continue;
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (id, checksum) VALUES ($1, $2)",
          [file, hash],
        );
        await client.query("COMMIT");
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }

    console.log("AnitaSet migrations complete");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(`Migration failed: ${error.message}`);
  process.exit(1);
});
