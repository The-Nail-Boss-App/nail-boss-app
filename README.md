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

The store uses PostgreSQL whenever `DATABASE_URL` is present. It uses parameterized queries, maps database snake_case columns into camelCase API responses, and enables TLS for non-local database hosts without logging credentials.

### PostgreSQL TLS behavior

- Local hosts (`localhost`, `127.0.0.1`, and `::1`) connect without TLS so local development works with default PostgreSQL installs.
- All non-local `DATABASE_URL` hosts use TLS with certificate verification enabled by default in both the app and migration runner.
- If a known development database uses a self-signed certificate, set `ANITASET_ALLOW_SELF_SIGNED_DB_TLS=true` to opt in to unverified TLS for that environment only. Do not set this variable in production unless the database provider explicitly requires a private/self-signed CA workflow and the risk is accepted.
- Logs include only a safe protocol/host/database label and never print credentials or full connection strings.

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

### Nail Blueprint foundation

Milestone 3 adds a structured Nail Blueprint alongside the existing flat design fields. The blueprint is the durable editing document for future Canva-style single-nail and full-set tools, while the legacy fields remain the compatibility layer for saved-design cards, proposal creation, and public proposal rendering.

`migrations/002_nail_blueprint_foundation.sql` adds:

- `design_blueprints` with one row per design (`design_id` is the primary key and cascades on design delete).
- `schema_version`, JSONB `document`, `created_at`, and `updated_at` columns.
- A JSONB GIN index for future blueprint queries.
- `updated_at` on `designs`.
- A safe backfill that creates a version-1 blueprint for every existing design without modifying `migrations/001_initial_schema.sql`.

The version-1 document shape is:

```json
{
  "schemaVersion": 1,
  "canvas": {
    "mode": "single-nail",
    "activeNailId": "nail-1"
  },
  "nails": [
    {
      "id": "nail-1",
      "slot": "accent",
      "shape": "Almond",
      "length": 0.5,
      "width": 0.5,
      "baseColorHex": "#E8A0BF",
      "layers": [
        {
          "id": "base-layer",
          "type": "base",
          "name": "Base Color",
          "visible": true,
          "locked": true,
          "opacity": 1,
          "order": 0,
          "transform": {
            "x": 0.5,
            "y": 0.5,
            "scaleX": 1,
            "scaleY": 1,
            "rotation": 0
          },
          "data": {
            "colorHex": "#E8A0BF",
            "effect": "Solid",
            "effectColorHex": "#FFFFFF"
          }
        }
      ]
    }
  ],
  "metadata": {
    "tags": []
  }
}
```

Supported layer types are prepared for future editing tools:

- `base`
- `gradient`
- `pattern`
- `drawing`
- `charm`
- `decal`
- `jewel`

Transforms use normalized coordinates (`x`, `y`, `scaleX`, `scaleY`, `rotation`) so artwork can scale across nail shapes and screen sizes in Milestone 4.

#### Blueprint compatibility strategy

- Existing `designs` rows are preserved and backfilled into `design_blueprints`.
- Creating a normal flat design creates a default version-1 blueprint transactionally.
- Updating a blueprint synchronizes legacy flat fields from the active nail/base layer where practical: `shape`, `length`, `width`, `baseColorHex`, `effect`, `effectColorHex`, and `tags`.
- Proposal APIs and public proposal HTML continue reading the flat design fields, so current workflows are not forced to understand layered documents yet.
- Deleting a design cascades to its blueprint and existing proposal/history relationships.

#### Blueprint validation limits

Server-side validation rejects malformed or oversized blueprint payloads safely. Current limits are:

- Request JSON body limit: `100kb` for API JSON requests.
- Blueprint JSON document limit: `100kb` after serialization.
- Supported schema versions: `1`.
- Nails per blueprint: `1` to `10`.
- Layers per nail: up to `200`.
- Nail shapes: existing allowed shapes (`Almond`, `Coffin`, `Square`, `Stiletto`, `Oval`).
- Layer types: `base`, `gradient`, `pattern`, `drawing`, `charm`, `decal`, `jewel`.
- Length, width, and opacity must stay between `0` and `1`.
- Layer orders must be finite integers, transforms must be finite numbers, required colors must be valid HEX values, and `metadata.tags` must be an array of strings.

Safe `400` responses are returned for invalid blueprints, malformed JSON, and validation failures without exposing SQL internals or stack traces.

#### Milestone 4 note

Advanced visual editing tools are intentionally not part of this milestone. Milestone 4 should build the interactive editor on top of this persisted blueprint document: nail selector/full-set mode, layer panel, drag/scale/rotate controls, drawing tools, reusable asset palettes, and preview rendering for the supported layer types.

## API routes

Health:

- `GET /api/health` — verifies storage and returns safe counts.

Designs:

- `GET /api/designs` — list designs, newest first.
- `GET /api/designs/:id` — fetch one design.
- `POST /api/designs` — create a design.
- `DELETE /api/designs/:id` — delete a design and cascade related proposals/history.
- `GET /api/designs/:id/blueprint` — fetch the versioned Nail Blueprint document for one design.
- `PUT /api/designs/:id/blueprint` — validate and replace the complete Nail Blueprint document, then synchronize legacy flat design fields.

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
- Uses the same PostgreSQL TLS rules documented above.

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
- Automatic default blueprint creation for flat saved designs.
- Blueprint GET/PUT round-trips with all supported future layer types.
- Legacy flat-field synchronization from the active nail base layer.
- Safe 400 responses for invalid blueprints.
- Cascade cleanup of design blueprints and related proposals after design deletion.

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
- Nail Blueprint validation is structural and persistence-focused; advanced visual editing constraints arrive with the Milestone 4 editor.
- The test-only file fallback is not a production database and should never be configured in Render production.
