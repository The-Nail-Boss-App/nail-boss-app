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
- Updating a blueprint synchronizes legacy flat fields from the active nail/base layer where practical: `shape`, `length`, `width`, `baseColorHex`, `effect`, `effectColorHex`, and `tags`. The atomic existing-design update route also persists editable flat fields such as the submitted design `name`.
- Proposal APIs and public proposal HTML continue reading the flat design fields, so current workflows are not forced to understand layered documents yet.
- Deleting a design cascades to its blueprint and existing proposal/history relationships.

#### Blueprint validation limits

Server-side validation rejects malformed or oversized blueprint payloads safely. Current limits are:

- Request JSON body limit: `128kb` for API JSON requests, leaving wrapper overhead for atomic create/update-with-blueprint saves.
- Blueprint JSON document limit: `100kb` after serialization.
- Supported schema versions: `1`.
- Nails per blueprint: `1` to `10`.
- Layers per nail: up to `200`.
- Nail shapes: existing allowed shapes (`Almond`, `Coffin`, `Square`, `Stiletto`, `Oval`).
- Layer types: `base`, `gradient`, `pattern`, `drawing`, `charm`, `decal`, `jewel`.
- Length, width, and opacity must stay between `0` and `1`.
- Layer orders must be finite integers, transforms must be finite numbers, required colors must be valid HEX values, and `metadata.tags` must be an array of strings.

Safe `400` responses are returned for invalid blueprints, malformed JSON, and validation failures without exposing SQL internals or stack traces.

#### Milestone 4 visual Design Studio

Milestone 4 turns the React studio into a Canva-style layered visual editor backed by the Nail Blueprint API. It remains a **single-active-nail** workflow; five-nail and ten-nail full-set selection/editing is intentionally deferred to Milestone 5, but Milestone 4 loads, normalizes, saves, and round-trips the full multi-nail Nail Blueprint document without deleting inactive nails.

**Audit findings before implementation:**

- The previous `client/src/DesignStudio.jsx` was a self-contained component with inline constants, inline `NailSVG`, local form state, validation, and a `POST /api/designs` save handler.
- `NailSVG` built an SVG path from shape, length, and width sliders, then filled the path with base polish/effect definitions. It did not render persisted blueprint layers.
- Saving created only a compatible flat design using `POST /api/designs`; it reset the form after success and did not call `PUT /api/designs/:id/blueprint`.
- The existing blueprint API already returned and replaced version-1 documents through `GET /api/designs/:id/blueprint` and `PUT /api/designs/:id/blueprint`, with server-side validation and legacy flat-field synchronization.
- Compatibility risks were preserving flat cards/proposals, preventing non-base art from overwriting `baseColorHex`, keeping existing shape/effect names valid, and ensuring older flat designs still receive default blueprints.
- The old studio was large enough to split; Milestone 4 now separates state, canvas rendering, panels, assets, drawing controls, and styles.

**Component structure:**

- `client/src/DesignStudio.jsx` is a compatibility re-export for the app shell.
- `client/src/design-studio/DesignStudio.jsx` owns save/load workflow, blueprint state, undo/redo history, and panel orchestration.
- `client/src/design-studio/NailCanvas.jsx` renders the responsive SVG canvas, strict nail clipping, selected-layer outline, dragging, and freehand pointer input.
- `client/src/design-studio/LayersPanel.jsx` manages layer selection, visibility, lock state, ordering, and deletion.
- `client/src/design-studio/AssetLibrary.jsx` exposes original inline starter SVG assets.
- `client/src/design-studio/PropertiesPanel.jsx` edits selected-layer metadata, opacity, color, position, size, rotation, gradient settings, and pattern settings.
- `client/src/design-studio/DrawingToolbar.jsx` controls pen type, brush size, brush color, opacity, and eraser mode.
- `client/src/design-studio/blueprint.js` contains pure blueprint helpers, normalized transforms, default documents, flat-field synchronization helpers, strict-fit clamping, and future product-use quantity summaries.
- `client/src/design-studio/assets.js` contains original generic SVG asset definitions for charms, jewels, and decals.
- `client/src/design-studio/studioStyles.js` contains editor-specific inline style helpers that reuse the existing AnitaSet tokens.

**Supported visual layer types:**

- `base` — locked base polish layer synchronized with nail shape, length, width, base color, base effect, effect color, and tags.
- `charm`, `jewel`, and `decal` — original reusable SVG assets with selection, strict-fit drag, resize, rotation, opacity, color, duplicate, delete, visibility, lock, and reorder controls.
- `drawing` — editable vector strokes with normalized point data, solid/glitter/soft brush options, brush size, brush color, opacity, and a simple nearest-stroke eraser workflow.
- `gradient` — lightweight SVG-native overlay with two colors, direction, opacity, visibility, lock, reorder, and delete controls.
- `pattern` — dots, stripes, checker, french-tip guide, glitter overlay, and marble accent patterns rendered as SVG patterns.

**Starter asset categories:**

- Charms: bow, heart, star, flower, butterfly, moon, crown, and chain link.
- Jewels: round rhinestone, oval rhinestone, teardrop rhinestone, square gem, pearl, and crystal cluster.
- Decals: smiley face, flame, lightning bolt, lips, checker accent, abstract swirl, tiny flower, and sparkle.

All starter assets are generic inline SVG shapes stored in the repository. No external URLs, branded icons, licensed marketplace assets, or bitmap screenshots are required for persistence.

**Silhouette-based strict-fit architecture:**

- The active nail silhouette is treated as a hard physical design boundary. SVG clip paths remain in place as a rendering safety layer, but persisted artwork is also validated before it is saved or displayed.
- `blueprint.js` exposes deterministic geometry helpers for point-in-silhouette checks, point projection, asset-boundary sampling, asset transform constraints, stroke-point constraints, and layer revalidation after nail geometry changes.
- The strict-fit model stores all transforms and drawing points in normalized 0–1 nail coordinates. Rendering converts those normalized values back through the active nail geometry, so responsive scaling does not change persisted data.
- The browser-visible nail path and the testable helper model use the same supported shape family (Almond, Coffin, Square, Stiletto, and Oval). The helper model approximates each path with a normalized half-width curve instead of browser-only SVG path APIs; this keeps placement deterministic in Node tests and future backend/product-use calculations.
- Charms, jewels, and decals are checked with multiple transformed boundary samples around the rotated asset box, not only the center point. If a layer would overhang a curved sidewall, coffin edge, narrow stiletto tip, resized oval, or shortened nail, strict-fit mode repositions it and, when needed, reduces scale until the sampled boundary fits.
- Shape, length, and width changes rebuild the nail path and revalidate existing asset transforms plus drawing strokes. When artwork is adjusted after a geometry change, the editor shows a non-blocking notice that AnitaSet kept the artwork inside the updated boundary.
- Freehand drawing input is projected into the active silhouette before stroke points are persisted. Drawing layers are still clipped to the SVG path as a second safety layer, but saved/reloaded stroke data contains only valid visible nail-surface points. If draw mode is active after the previous drawing layer was deleted, the first completed stroke creates the replacement drawing layer and inserts that stroke in the same blueprint/history transition, so the user does not need to draw twice and undo/redo treats it as one meaningful edit.
- Pattern and gradient layers fill only the clipped nail surface. Selected-layer outlines and editor handles may appear outside the nail as controls, but they do not persist as artwork.

**Single-active-nail editing and full-document preservation:**

- The current canvas renders and edits only `canvas.activeNailId`; legacy flat fields are synchronized from that active nail/base layer only. This keeps the Milestone 4 UI focused while preparing the state model for Milestone 5 full-set nail selection.
- Blueprint normalization preserves nail order and up to the backend limit of 10 nails. Inactive nails keep their `id`, `slot`, `shape`, `length`, `width`, `baseColorHex`, `layers`, transforms, and nail-level metadata unless strict-fit validation must adjust invalid geometry for server-safe persistence.
- Loading a five- or ten-nail blueprint, editing only the active nail, saving, and reloading should keep every inactive nail intact. A no-op load/save should not delete inactive nails or convert a full-set document into a single-nail document. If `activeNailId` is missing or invalid, normalization repairs it to a preserved nail rather than dropping nails.

**Save/load workflow:**

- New layered design: enter a name, create layered art, click Save, and the frontend sends one atomic `POST /api/designs/with-blueprint` request containing both the flat compatibility payload and the complete Nail Blueprint v1 document. The editor does not mark the design selected or saved until the atomic response succeeds, so a failed create leaves the unsaved blueprint in memory for retry.
- Atomic create validates the flat design payload, validates and normalizes the blueprint, derives synchronized legacy flat fields from the active nail/base layer, then inserts the design row and blueprint row in one persistence operation. PostgreSQL uses a single transaction; the file-backed smoke-test store snapshots and restores state to match rollback behavior. Invalid blueprints, oversized blueprints, and blueprint persistence failures leave no orphan default design row behind.
- Edit saved design: select an existing design, fetch its blueprint with `GET /api/designs/:id/blueprint`, edit layers or rename the design, then save with atomic `PUT /api/designs/:id/with-blueprint`. The request includes `{ design, blueprint }`; the backend validates both payloads, preserves the submitted design name, synchronizes legacy flat fields from the normalized active nail/base layer, and updates the design row plus blueprint row in one transaction. The successful response returns both the updated design and saved blueprint so local saved-design and proposal selectors can show the new name immediately.
- Existing compatibility routes are preserved: legacy `POST /api/designs` still creates a flat design plus default blueprint, and `PUT /api/designs/:id/blueprint` still saves blueprint-only edits for older clients. New Design Studio saves use the atomic create/update routes so dirty state is cleared only after the combined persistence operation commits.
- Rollback guarantee: if flat design validation, blueprint validation/normalization, the design update, or blueprint persistence fails, the PostgreSQL transaction rolls back the entire operation. The explicit file-backed smoke-test store snapshots state before mutation and restores it on failure, so there is no partial rename, partial flat-field sync, or half-saved blueprint.
- Before saving, the frontend serializes the blueprint and rejects clearly oversized documents above the server's `100kb` blueprint limit without sending a create request. It warns after successful saves when a blueprint is approaching the limit so users can simplify before adding many more strokes or layers. The server remains the source of truth for final validation.
- The editor shows loading, saving, saved, unsaved-change, and safe error states. It confirms before replacing unsaved work when loading another design or starting a new one.

**Undo/redo scope:**

Undo and redo are local only, capped to a small in-memory history, and are reset when another saved design is loaded. History covers meaningful blueprint edits such as layer add/delete/duplicate/reorder, property edits, visibility, lock state, drawing strokes, pattern/gradient edits, base geometry changes, and drag gestures. Dragging captures the pre-drag blueprint before transient pointer-move updates and records one undo step at pointer-up, so Undo returns to the exact pre-drag position and Redo restores the completed drag. Resize and rotation edits continue to use normalized strict-fit transforms so undo/redo restores safe persisted geometry. Undo history is not persisted to PostgreSQL.

**Product-use planning hooks:**

Milestone 4 does not build a full cost estimator. It preserves the data needed for a later estimator: nail shape, length, width, normalized silhouette-valid transforms, stable asset IDs, charm/jewel/decal quantities, vector strokes, and pattern/gradient settings. Quantity summaries count visible charms, jewels, and decals only when the transformed asset boundary is valid inside the active silhouette. Hidden off-silhouette drawing geometry is excluded because drawing points are projected before persistence, while future polish-coverage estimates can use the same clipped nail surface for gradients, patterns, and brush coverage. An advanced controlled-overhang mode may be added later for experienced artists, but it should include warnings, limits, and explicit opt-in because the Milestone 4 MVP uses strict-fit mode.

**Known limitations:**

- This milestone edits one active nail (`canvas.activeNailId`) only while preserving all nails in the loaded blueprint. Multi-nail set selection, per-finger navigation, and simultaneous full-set editing arrive in Milestone 5.
- The eraser workflow removes the nearest stroke in the selected drawing layer rather than doing partial path boolean erasure.
- Strict-fit collision uses deterministic shape-specific half-width curves and sampled transformed asset boundaries rather than exact SVG path boolean operations; it is intentionally conservative near curved edges and narrow tips.
- The project does not introduce a large frontend unit-test framework. A lightweight deterministic geometry helper test runs in Node without browser APIs.

**Laptop responsive layout:**

- The studio remains a desktop-first three-panel editor, but the grid now uses flexible `minmax()` columns instead of fixed 300/420/330 pixel minimums. The left controls, center canvas, and right Assets/Layers/Properties panel can fit within common laptop content widths around 1024px and 1100px after the app sidebar is present.
- Panel minimums were reduced while keeping readable labels and usable native controls. The center canvas keeps the largest flexible share, and the right panel remains reachable rather than being clipped by `overflow: hidden`.
- Horizontal scrolling is not the primary layout strategy; panel contents scroll vertically when needed, while the outer studio allows safe overflow instead of hiding essential controls. Manual viewport checks should cover 1280x720, 1366x768, 1440x900, and 1920x1080.
- Full mobile optimization is not part of Milestone 4. Very narrow phone-width layouts may still be cramped and should receive a dedicated drawer or single-column mobile workflow in a later milestone.

**Accessibility notes:**

- Controls use native buttons, inputs, ranges, color pickers, and selects where practical.
- The editable nail canvas has an accessible image label, while layer editing remains primarily pointer-driven in this MVP. Keyboard nudging and richer ARIA canvas semantics should be considered in a future accessibility pass.

## API routes

Health:

- `GET /api/health` — verifies storage and returns safe counts.

Designs:

- `GET /api/designs` — list designs, newest first.
- `GET /api/designs/:id` — fetch one design.
- `POST /api/designs` — create a flat-compatible design and default blueprint for legacy callers.
- `POST /api/designs/with-blueprint` — atomically create a design with a complete validated Nail Blueprint document; rolls back the design if validation or blueprint persistence fails.
- `PUT /api/designs/:id/with-blueprint` — atomically update editable flat design fields and the complete Nail Blueprint document; rolls back both writes if either side fails.
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
- Blueprint GET/PUT round-trips with all supported future layer types, including five- and ten-nail preservation, active-nail-only edits, active `activeNailId` validity, and no-op multi-nail load/save preservation.
- Atomic create-with-blueprint success, invalid-blueprint rollback, oversized-blueprint rollback, simulated blueprint-persistence rollback, and no orphan default designs after failed atomic creates.
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
- Nail Blueprint validation is structural and persistence-focused; advanced visual editing constraints are enforced in the Milestone 4 editor helpers and covered by deterministic geometry tests.
- The test-only file fallback is not a production database and should never be configured in Render production.
