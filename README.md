# AnitaSet — Nail Proposal App

**Tagline:** Design. Price. Sell. Grow.

AnitaSet is a design-first operating system foundation for independent nail businesses. The current app includes a React client, an Express API, public proposal pages, and a PostgreSQL persistence layer suitable for Render deployments.

## Architecture

- **Client:** React app in `client/`, built with the root `npm run build` script.
- **Server:** Express app in `server.js`, serving API routes, public proposal HTML, and the production React build when present.
- **Persistence:** PostgreSQL-backed store in `db/store.js`, selected with `DATABASE_URL`.
- **Migrations:** SQL migrations in `migrations/`, applied by `scripts/migrate.js`.
- **Test fallback:** A file-backed fallback is available only when `ANITASET_TEST_DB_FILE` is explicitly set. It is intended for smoke tests and never silently replaces PostgreSQL in production.

## PostgreSQL persistence

The store uses PostgreSQL whenever `DATABASE_URL` is present. It uses parameterized queries, maps database snake_case columns into camelCase API responses, and enables Render-friendly SSL for non-local database hosts without logging credentials.

If the app starts without `DATABASE_URL` and without the explicit `ANITASET_TEST_DB_FILE` test override, startup fails with a clear configuration error instead of falling back to volatile memory.

### Schema

`migrations/001_initial_schema.sql` creates these non-destructive tables if they do not already exist:

- `schema_migrations` — tracks applied migration files and checksums.
- `designs` — saved nail designs.
- `proposals` — client proposals linked to designs.
- `proposal_status_history` — status audit history for proposal lifecycle events.

Allowed proposal statuses are preserved:

- `Sent`
- `Viewed`
- `Accepted`
- `ChangesRequested`
- `Declined`

## API routes

Health:

- `GET /api/health` — verifies storage and returns safe counts.

Designs:

- `GET /api/designs` — list designs, newest first.
- `GET /api/designs/:id` — fetch one design.
- `POST /api/designs` — create a design.
- `DELETE /api/designs/:id` — delete a design and cascade related proposals/history.

Proposals:

- `GET /api/proposals` — list proposals, newest first, with embedded design data.
- `GET /api/proposals/:id` — fetch one proposal with embedded design data.
- `POST /api/proposals` — create a proposal linked to a design.
- `PATCH /api/proposals/:id/status` — transactionally update status.
- `GET /api/proposals/:id/history` — list proposal status history.

Client-facing HTML:

- `GET /proposal/:id` — public proposal page; marks `Sent` proposals as `Viewed`.
- `POST /proposal/:id/action` — public proposal response endpoint for accept, request changes, or decline.

The public proposal page keeps safe HTML escaping for user-supplied values.

## Health response

A successful PostgreSQL health response is shaped like:

```json
{
  "status": "ok",
  "storage": "postgres",
  "database": "connected",
  "counts": {
    "designs": 0,
    "proposals": 0
  }
}
```

If PostgreSQL is unavailable, the health route returns a non-200 response with a safe message such as `database unavailable` and does not expose SQL internals or credentials.

## Local installation

```bash
npm install
```

The root build script installs client dependencies as part of the build:

```bash
npm run build
```

## Local PostgreSQL setup

1. Create a local database.
2. Export `DATABASE_URL` with a local PostgreSQL URL.
3. Run migrations.
4. Start the server.

Example:

```bash
createdb anitaset_dev
export DATABASE_URL=postgres://localhost:5432/anitaset_dev
npm run db:migrate
npm start
```

By default, the API runs on:

```text
http://localhost:4000
```

## Migration flow

Run all unapplied migrations with:

```bash
npm run db:migrate
```

The migration runner:

- Reads `DATABASE_URL` only from environment variables.
- Creates `schema_migrations` if needed.
- Applies `migrations/*.sql` in sorted order.
- Skips already-applied migrations with matching checksums.
- Fails on checksum mismatches.
- Logs a safe database label without credentials.

## Render deployment notes

`render.yaml` defines one Node web service:

- Service name: `the-nail-boss`.
- Runtime: `node`.
- Build command: `npm install && npm run build`.
- Pre-deploy migration command: `npm run db:migrate`.
- Start command: `npm start`.
- No fixed `PORT`; Render provides `$PORT` and the server binds to `process.env.PORT || 4000`.
- Environment:
  - `NODE_ENV=production`
  - `DATABASE_URL` as a non-synced environment variable.

### Render DATABASE_URL setup

1. Provision a Render PostgreSQL database or use an existing managed PostgreSQL database.
2. Add the app service environment variable `DATABASE_URL` as a secret/non-synced value.
3. Ensure the value is available to both the pre-deploy migration command and runtime service.
4. Deploy the branch.
5. Confirm `/api/health` returns `200 OK` with `storage: "postgres"` and `database: "connected"`.

## Tests and smoke checks

Run the smoke test suite with:

```bash
npm test
```

The test script intentionally sets `ANITASET_TEST_DB_FILE=.tmp/smoke-test-db.json` so it can verify API behavior without requiring a local PostgreSQL server. The smoke test verifies:

- Health check.
- Create/read design.
- Create/read proposal.
- Public proposal HTML.
- Malicious client name escaping.
- Accept proposal.
- Status history.
- Persistence across restart using the explicit test-only file fallback.

## Rollback guidance

If a deploy fails after introducing PostgreSQL persistence:

1. Roll back the Render service to the previous known-good commit.
2. Leave the database intact; the initial migration is non-destructive and uses `CREATE TABLE IF NOT EXISTS`.
3. Investigate migration logs and `/api/health` output.
4. Fix forward with a new migration rather than editing an already-applied migration.
5. If the service cannot connect, verify `DATABASE_URL`, network access, and Render PostgreSQL status before redeploying.

## Known limitations

- No user accounts or tenant separation yet.
- Authorization is not implemented for design/proposal management.
- Public proposal IDs are UUIDs but are accessible to anyone with the link.
- No rate limiting, request logging, CSRF strategy, or authentication middleware is currently present.
- Validation is basic and should be strengthened before production use.
- The test-only file fallback is not a production database and should never be configured in Render production.
