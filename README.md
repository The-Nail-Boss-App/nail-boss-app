# AnitaSet

**Design. Price. Sell. Grow.**

AnitaSet is a design-first operating system for independent nail businesses. The current MVP focuses on a simple flow: start with a nail design, save it, price it, and share a client proposal. Designs, proposals, and proposal status history now persist in PostgreSQL when `DATABASE_URL` is configured.

> The AI Shop Manager will be named **Anita** in future milestones. This MVP does not yet include AI assistant functionality.

## Repository audit

### Current folder structure

```text
.
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Dashboard.jsx
│   │   ├── DesignStudio.jsx
│   │   ├── Login.jsx
│   │   ├── NailPreview.jsx
│   │   ├── Proposals.jsx
│   │   ├── index.jsx
│   │   └── styles.js
│   ├── package.json
│   └── package-lock.json
├── package.json
├── package-lock.json
├── render.yaml
└── server.js
```

### Frameworks and dependencies

Root server package:

- Node.js / npm application
- Express `^4.18.2`
- CORS `^2.8.5`
- UUID `^9.0.0`
- Dev tooling: concurrently `^8.2.2`, nodemon `^3.0.2`

Client package:

- React `^18.2.0`
- React DOM `^18.2.0`
- react-scripts `5.0.1`

### Existing frontend pages and components

- `App.jsx` — single-page app shell, sidebar navigation, login/session state.
- `Login.jsx` — lightweight local login screen; no real authentication yet.
- `Dashboard.jsx` — overview cards for saved designs and proposals plus workflow guidance.
- `DesignStudio.jsx` — form controls and SVG nail preview for designing and saving nail looks.
- `Proposals.jsx` — proposal creation form and proposal list with client-view links.
- `NailPreview.jsx` — reusable nail preview component.
- `styles.js` — shared colors, layout styles, logo mark, nav item, and status badge.

### Existing backend routes and APIs

JSON API:

- `GET /api/health` — service health, storage backend, and persisted object counts.
- `GET /api/designs` — list designs, newest first.
- `GET /api/designs/:id` — fetch one design.
- `POST /api/designs` — create a design.
- `DELETE /api/designs/:id` — delete a design and cascade-delete linked proposals.
- `GET /api/proposals` — list proposals, newest first, with embedded design data.
- `GET /api/proposals/:id` — fetch one proposal with embedded design data.
- `GET /api/proposals/:id/history` — fetch proposal status history.
- `POST /api/proposals` — create a proposal linked to a design.
- `PATCH /api/proposals/:id/status` — update proposal status and write status history.

Client-facing HTML routes:

- `GET /proposal/:id` — public proposal page; marks `Sent` proposals as `Viewed`.
- `POST /proposal/:id/action` — public proposal response endpoint for accept, request changes, or decline.

Production/static route:

- Serves `client/build` when that directory exists.
- Non-API/non-proposal routes fall back to `client/build/index.html`.

### Current MVP capabilities that work

- Build the React client from the root package.
- Start the Express server from the root package when `DATABASE_URL` is configured.
- Serve the React build from Express in production mode.
- Create, read, and list nail designs from PostgreSQL.
- Create, read, and list proposals tied to saved designs from PostgreSQL.
- Open public proposal pages.
- Accept, decline, or request changes from the proposal page.
- Track proposal statuses and status history persistently.

### Current storage method and limitations

Data is persisted in PostgreSQL through `db/store.js` when `DATABASE_URL` is present. The schema is managed by SQL migrations in `migrations/` and contains:

- `designs` — design metadata, colors, tags, and timestamps.
- `proposals` — client proposal data, current status, notes, and timestamps.
- `proposal_status_history` — auditable status transitions for proposals.

Local smoke tests use a documented file-backed fallback through `ANITASET_TEST_DB_FILE` so tests can run without a local PostgreSQL server. Production and normal local development must set `DATABASE_URL`; the app no longer silently falls back to in-memory storage.

Limitations:

- No user accounts or tenant separation.
- No automated backup policy is configured in this repository; use Render PostgreSQL backups/snapshots.
- Public proposal IDs are UUIDs but are not protected by authentication.

### Current Render deployment configuration

`render.yaml` defines one Node web service:

- Service name: `the-nail-boss` (intentionally not renamed yet)
- Runtime: `node`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Migration command: `npm run db:migrate`
- Do not set a fixed `PORT` in the blueprint; Render provides the port value and the server binds to `process.env.PORT`.
- Environment:
  - `NODE_ENV=production`
  - `DATABASE_URL` from the Render PostgreSQL internal connection string

Render provides `$PORT` for the web service; the server reads `process.env.PORT || 4000`.

### Incomplete, fragile, duplicated, or broken areas

- Login is local UI state only and does not authenticate users.
- Authorization is not implemented for design/proposal management.
- Proposal links were previously hard-coded to `:4000`, which works locally but is wrong on Render.
- Dashboard navigation props were mismatched, which could break the dashboard CTA buttons at runtime.
- The Design Studio and `NailPreview.jsx` contain overlapping nail-rendering logic.
- Validation is basic and should be strengthened before production use.
- Automated coverage is currently a smoke test; broader unit/integration/e2e coverage is still needed.

### Security and deployment risks

- No exposed secrets were found in tracked source files.
- CORS allows local origins by default; production should set `ALLOWED_ORIGIN` explicitly when a separate frontend origin exists.
- Public proposal pages are accessible to anyone with the UUID link.
- JSON and URL-encoded request bodies are limited to 25 KB for this MVP.
- No rate limiting, request logging, CSRF strategy, or authentication middleware is currently present.
- Database availability is now required for production startup and request handling.

### Why Render may return HTTP 503

The local build and startup path succeeds when `DATABASE_URL` is configured and migrations have run. If Render is returning HTTP 503, likely causes are:

1. The deployed service is running an older commit that did not contain the current root-level `package.json`, `server.js`, and `render.yaml` structure.
2. The service root/build command does not match the app directory in Render settings.
3. The server failed to start during deploy because dependencies, `DATABASE_URL`, migrations, or the client build were missing in the deployed environment.
4. The service is sleeping/cold-starting or crashing after boot because the database is unavailable.
5. A proxy/network layer may be blocking health checks from some environments.

## Local installation

```bash
npm install
```

The root build script installs client dependencies as part of the build:

```bash
npm run build
```

## Start locally

```bash
npm start
```

By default, the API runs on:

```text
http://localhost:4000
```

## Development mode

Run server and client development processes together:

```bash
npm run dev
```

Or separately:

```bash
npm run dev:server
npm run dev:client
```

## Tests

Run the smoke test suite, which explicitly sets `ANITASET_TEST_DB_FILE`, starts the server on a temporary local port using the documented test-only file-backed fallback, verifies the core design/proposal flow, checks proposal status history and HTML escaping, then confirms data survives a server restart:

```bash
npm test
```

## Database setup

### Local PostgreSQL

1. Create a local PostgreSQL database.
2. Export `DATABASE_URL`; for local non-SSL PostgreSQL, disable SSL explicitly:

```bash
export DATABASE_URL=postgres://USER:PASSWORD@localhost:5432/anitaset
export PGSSLMODE=disable
```

3. Run migrations:

```bash
npm run db:migrate
```

4. Start the app:

```bash
npm start
```

If `DATABASE_URL` is missing, the app fails clearly instead of using in-memory production storage. Only `npm test` uses `ANITASET_TEST_DB_FILE` as a documented test-only persistence fallback.

## API quick test examples

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/designs
curl http://localhost:4000/api/proposals
```

Create a design:

```bash
curl -X POST http://localhost:4000/api/designs \
  -H 'Content-Type: application/json' \
  -d '{"name":"Sunset Glam","shape":"Almond","length":0.5,"width":0.5,"baseColorHex":"#E8A0BF","effect":"Solid","effectColorHex":"#FFFFFF","tags":["summer"]}'
```

Create a proposal:

```bash
curl -X POST http://localhost:4000/api/proposals \
  -H 'Content-Type: application/json' \
  -d '{"designId":"<design-id>","clientName":"Client Name","price":85,"notes":"Optional note"}'
```

## Render deployment notes

- Keep the existing Render service name and URL until the infrastructure rebrand is intentionally scheduled.
- Create a Render PostgreSQL database from the Render dashboard.
- Add the database internal connection string to the web service as `DATABASE_URL`. Do not commit real credentials.
- Use the root `render.yaml` for the current web service.
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Migration command after provisioning or deploy: `npm run db:migrate` (also configured as `preDeployCommand` in `render.yaml`)
- Do not set a fixed `PORT` in the blueprint; Render provides the port value and the server binds to `process.env.PORT`.
- Ensure the deployed branch contains the root app files and `client/` directory.
- Confirm `/api/health` returns `200 OK` and includes `storage: "postgres"` after deploy.

### Rollback guidance

The initial migration only creates tables, indexes, and timestamp triggers with `IF NOT EXISTS`; it does not drop or rewrite existing data. To roll back the application, redeploy the previous app version while keeping the database intact. Before any future destructive migration, take a Render PostgreSQL backup/snapshot first.

## Known limitation

PostgreSQL persistence is in place, but user accounts, tenant separation, and authorization are not implemented yet.

## Recommended next milestone

Add real user accounts/authorization around shop data and proposals, then model Nail Blueprint data more formally for Design Studio and future Anita workflows.
