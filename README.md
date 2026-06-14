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
- Nail shapes: Shape Engine V2 families (`Square`, `Tapered Square`, `Russian Square`, `Coffin`, `Slim Coffin`, `Almond`, `Russian Almond`, `Oval`, `Round`, `Stiletto`, `Edge`, `Lipstick`, `Flare`, `Mountain Peak`). The legacy shape names remain valid for existing saved designs.
- Nail architecture controls: `taper`, `apexHeight`, `sidewallCurve`, and `freeEdgeThickness` are persisted inside each nail object in the blueprint JSON. They do not require separate database columns and are not copied into the legacy flat design columns.
- Architecture control validation: each control must be a numeric value from `0` to `1`, matching the practical frontend slider range. Malformed non-numeric values are rejected with a safe `400`; omitted values default to `0.5` so older blueprints load safely.
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

**Inline SVG security policy:**

- Blueprint `layer.data.svg` is not trusted because saved or imported blueprints can contain arbitrary layer data.
- Runtime rendering supports built-in charm, jewel, and decal artwork by resolving known internal `layer.data.assetId` values through `assets.js`.
- Untrusted inline SVG from blueprint data is ignored during canvas and thumbnail rendering, and frontend blueprint normalization strips `svg` fields from charm, jewel, and decal layer data.
- Full-set previews render built-in charms, jewels, and decals safely from internal asset IDs while preserving asset color, opacity, position, scale, rotation, clipping, and layer order.

**Silhouette-based strict-fit architecture:**

- The active nail silhouette is treated as a hard physical design boundary. SVG clip paths remain in place as a rendering safety layer, but persisted artwork is also validated before it is saved or displayed.
- `blueprint.js` exposes deterministic geometry helpers for point-in-silhouette checks, point projection, asset-boundary sampling, asset transform constraints, stroke-point constraints, and layer revalidation after nail geometry changes.
- The strict-fit model stores all transforms and drawing points in normalized 0–1 nail coordinates. Rendering converts those normalized values back through the active nail geometry, so responsive scaling does not change persisted data.
- The browser-visible nail path and the testable helper model use the same Shape Engine V2 family list: Square, Tapered Square, Russian Square, Coffin, Slim Coffin, Almond, Russian Almond, Oval, Round, Stiletto, Edge, Lipstick, Flare, and Mountain Peak. The helper model approximates each path with a normalized half-width curve instead of browser-only SVG path APIs; this keeps placement deterministic in Node tests and future backend/product-use calculations.
- Round, Oval, Almond, and Russian Almond use distinct Shape Engine V2 silhouettes: Round keeps a wider, shorter-looking rounded free edge with softer sidewalls; Oval stays broader and softer than Almond with a rounded salon tip; Almond remains tapered to an elegant point; Russian Almond remains slimmer and more dramatic than Almond. French Tip overlays continue to clip through the active silhouette for each of these shapes.
- Charms, jewels, and decals are checked with multiple transformed boundary samples around the rotated asset box, not only the center point. If a layer would overhang a curved sidewall, coffin edge, narrow stiletto tip, resized oval, or shortened nail, strict-fit mode repositions it and, when needed, reduces scale until the sampled boundary fits.
- Shape, length, and width changes rebuild the nail path and revalidate existing asset transforms plus drawing strokes. When artwork is adjusted after a geometry change, the editor shows a non-blocking notice that AnitaSet kept the artwork inside the updated boundary.
- Freehand drawing input is projected into the active silhouette before stroke points are persisted. Drawing layers are still clipped to the SVG path as a second safety layer, but saved/reloaded stroke data contains only valid visible nail-surface points. If draw mode is active after the previous drawing layer was deleted, the first completed stroke creates the replacement drawing layer and inserts that stroke in the same blueprint/history transition, so the user does not need to draw twice and undo/redo treats it as one meaningful edit.
- Canvas drag state uses explicit gesture variants: asset gestures store `{ kind: "asset", layerId, start, original }`, while brush gestures store `{ kind: "drawing", stroke }`. Asset transform code is skipped in Draw and Eraser modes, so normal multi-point strokes accumulate through the canvas drawing handler and create one history entry when the completed stroke is committed.
- Pattern and gradient layers fill only the clipped nail surface. In Select mode they remain selectable and editable as layers, but in Draw and Eraser modes their full-canvas SVG overlays opt out of pointer events so brush input reaches the root canvas handler. Selected-layer outlines and editor handles may appear outside the nail as controls, but they do not persist as artwork.

**Single-active-nail editing and full-document preservation:**

- The current canvas renders and edits only `canvas.activeNailId`; legacy flat fields are synchronized from that active nail/base layer only. This keeps the Milestone 4 UI focused while preparing the state model for Milestone 5 full-set nail selection.
- Blueprint normalization preserves nail order and up to the backend limit of 10 nails. Backend-valid inactive nails are cloned without destructive frontend normalization: their `id`, `slot`, `shape`, `length`, `width`, `baseColorHex`, layer IDs, layer order, non-uniform `scaleX`/`scaleY`, rotation, opacity, visibility, lock state, data, transforms, and nail-level metadata survive no-op load/save round trips exactly. Invalid inactive nails are the boundary case: the editor repairs malformed data only when needed to produce a server-safe Nail Blueprint v1 document.
- Loading a five- or ten-nail blueprint, editing only the active nail, saving, and reloading should keep every inactive nail intact. A no-op load/save should not delete inactive nails, clamp their valid transforms, or convert a full-set document into a single-nail document. If `activeNailId` is missing or invalid, normalization repairs it to a preserved nail rather than dropping nails, preparing Milestone 5 to activate and strictly revalidate one nail at a time.

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

- This milestone edits one active nail (`canvas.activeNailId`) only while preserving all nails in the loaded blueprint. Full-surface gradient and pattern overlays are visually stacked and clipped with the rest of the art, but their SVG canvas rendering is non-interactive so they cannot block charms, jewels, decals, drawing strokes, or eraser input below them; select and edit those overlay layers from the Layers panel and Properties panel. Multi-nail set selection, per-finger navigation, and simultaneous full-set editing arrive in Milestone 5.
- Drawing, asset-drag, and eraser gestures store explicit drag-state variants with the starting `pointerId`; only the matching captured pointer may finish, cancel, release capture, clear drag state, create history, or mark the blueprint dirty. Unrelated `pointerup` and `pointercancel` events from other fingers, pens, or mice are ignored.
- Drawing gestures capture the root SVG pointer for the full stroke, so moving or releasing outside the SVG still delivers the terminal pointer event and commits the constrained stroke once on matching `pointerup`. `pointercancel` is intentionally separate from `pointerup`: AnitaSet releases capture, discards the interrupted in-progress drawing stroke, restores any interrupted asset drag to its original transform, and clears drag state without committing history, marking the blueprint dirty, creating a drawing layer, or saving partial geometry.
- Hidden drawing layers are preserved exactly as hidden historical artwork, but new strokes never append to layers with `visible === false`; if no visible unlocked drawing layer exists, the first completed stroke creates a new visible unlocked drawing layer and inserts that stroke in one undoable transition.
- The eraser workflow stages a single nearest-stroke target on pointerdown without mutating the blueprint. A matching `pointerup` commits one erase, creates one history entry, and marks the design dirty; a matching `pointercancel` releases capture and discards the pending erase without modifying hidden, locked, or visible layers. Hidden or locked drawing layers are ignored and left unchanged; if no visible unlocked drawing layer exists, the studio shows a non-blocking notice and does not create a layer merely for erasing.
- Strict-fit collision uses deterministic shape-specific half-width curves and sampled transformed asset boundaries rather than exact SVG path boolean operations; it is intentionally conservative near curved edges and narrow tips.
- The project does not introduce a large frontend unit-test framework. A lightweight deterministic geometry helper test runs in Node without browser APIs.

**Laptop responsive layout:**

- The studio remains a desktop-first three-panel editor, but the grid now uses flexible `minmax()` columns instead of fixed 300/420/330 pixel minimums. The left controls, center canvas, and right Assets/Layers/Properties panel can fit within common laptop content widths around 1024px and 1100px after the app sidebar is present.
- The active nail canvas is top-aligned inside the center panel with reduced vertical padding and viewport-bounded sizing so the editable nail remains visible near the top of the studio on laptop screens without shrinking below a comfortable design size.
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

## Milestone 5 — Full Nail Set Studio

Milestone 5 expands AnitaSet's Design Studio from a single-active-nail editor into a full 10-nail set workflow while preserving the Nail Blueprint v1 document and Milestone 4 safety rules.

### Audit findings before implementation

- **Active-nail state flow:** `canvas.activeNailId` selects one editable nail. Left controls, the main `NailCanvas`, `LayersPanel`, and `PropertiesPanel` all read from `getActiveNail()`, while `updateActiveNail()` and `synchronizeBase()` mutate only that nail.
- **Blueprint structure:** Nail Blueprint v1 stores `schemaVersion`, `canvas`, ordered `nails`, and `metadata`. Each nail owns `id`, `slot`, `shape`, `length`, `width`, `baseColorHex`, `layers`, and optional nail `metadata`; legacy flat design fields are derived from the active nail only.
- **Inactive-nail preservation:** `ensureBlueprint()`, `cloneInactiveNailVerbatim()`, `updateActiveNail()`, `synchronizeBase()`, `addLayerToBlueprint()`, and `addStrokeToDrawingLayer()` keep inactive nails unchanged unless an explicit full-set helper targets them.
- **Strict-fit geometry:** asset transforms are constrained with deterministic silhouette checks, drawing points are projected into the nail surface, SVG clipping remains a rendering backstop, and resize/shape edits re-run validation against the current active nail.
- **Atomic persistence:** layered designs continue to save through `POST /api/designs/with-blueprint` and update through `PUT /api/designs/:id/with-blueprint`, preserving rollback guarantees and avoiding orphan blueprint rows.
- **Compatibility risks:** proposal cards and legacy endpoints still expect active-nail flat fields; therefore Milestone 5 keeps those fields synchronized from `canvas.activeNailId` and leaves public proposal previews on the legacy active-nail preview for now.
- **Recommended additions:** reusable `FullSetPreview`, `HandPreview`, `NailThumbnail`, and `BulkActionsPanel` components provide full-set navigation, realistic thumbnails, and explicit bulk tools without rebuilding the editor.

### 10-nail slot model and active editing

Full-set blueprints use stable normalized slots in this order:

1. `left-thumb`
2. `left-index`
3. `left-middle`
4. `left-ring`
5. `left-pinky`
6. `right-thumb`
7. `right-index`
8. `right-middle`
9. `right-ring`
10. `right-pinky`

New designs initialize all 10 nails by default with a unique stable nail ID, slot, default shape, default length, default width, base color, and locked base layer. The documented default active slot is `right-index`. Legacy one-nail blueprints are upgraded safely by preserving the original nail and filling missing slots with default nails; existing multi-nail blueprints are never reset during load.

The full-size `NailCanvas` still edits one nail at a time. Clicking a full-set thumbnail changes `canvas.activeNailId`, updates left-side shape/length/width/base controls, updates Layers and Properties for the active nail, and preserves unsaved edits on every inactive nail. Undo/redo uses a single blueprint-level history capped by the existing history limit, so bulk changes and nail switches remain predictable across the whole set.

### New full-set components

- `FullSetPreview.jsx` renders Full Set, Left Hand, and Right Hand preview tabs and routes thumbnail clicks to active-nail switching.
- `HandPreview.jsx` renders five thumbnails for one hand in thumb-to-pinky order.
- `NailThumbnail.jsx` renders a read-only clipped SVG thumbnail using each nail's shape, length, width, base color, visible drawing, gradient, pattern, charm, jewel, and decal layers in stacking order. Hidden layers remain saved on the nail but do not render in the thumbnail or full-set preview.
- `BulkActionsPanel.jsx` exposes copy, paste, duplicate, mirror, apply, and reset actions with explicit selected-slot targeting.

### Bulk action behavior

Milestone 5 supports copying the active nail, pasting to selected slots, duplicating to the current hand, duplicating to all nails, copying to the matching finger on the opposite hand, mirroring one hand to the opposite hand, applying base color to the active hand or all nails, applying shape/width/length to the active hand or all nails, and resetting a selected nail to its base layer only.

Destructive overwrite actions ask for confirmation. Destination nails keep their own nail IDs and slots. Bulk copy, duplicate, paste, and mirror preserve the full visible layer model: base, drawing, gradient, pattern, charm, jewel, and decal layers. Hidden layers also copy with their hidden state intact when the full design is copied, and locked layer state is preserved except for the always-locked base layer. Copied layers receive fresh layer IDs, copied drawing strokes receive fresh stroke IDs, and destination artwork is revalidated against that nail's current geometry. Strict-fit revalidation keeps recoverable asset layers visible by re-fitting them inside the destination nail silhouette instead of dropping them; AnitaSet shows a lightweight notice when copied or mirrored artwork is adjusted to fit.

Paste to Selected is a three-step workflow: click **Copy active nail**, check one or more destination nail boxes, then click **Paste to selected**. The panel helper text says “Select destination nails, then paste copied design.” If a user attempts to paste before copying a nail or before choosing destinations, AnitaSet shows a non-blocking notice instead of silently doing nothing.

### Autosave and draft recovery preparation

Layered Nail Blueprint designs now have a debounced autosave path. Meaningful edits mark the design dirty, show **Unsaved changes**, and schedule an autosave approximately 20 seconds after the latest meaningful edit. Pointermove updates during drag gestures do not create save requests; only completed actions such as asset drag completion, drawing stroke completion, eraser completion, layer mutations, base/shape/width/length changes, bulk actions, and paused metadata edits schedule autosave.

Autosave uses the same atomic routes as manual save:

- New valid drafts use `POST /api/designs/with-blueprint`.
- Existing saved drafts use `PUT /api/designs/:id/with-blueprint`.

Repeated autosaves update the same draft row after the first successful create. New unnamed autosaved drafts receive an editable generated name such as `Untitled Set 1`. The status label reports **Unsaved changes**, **Saving…**, **Autosaved**, or **Save failed — changes kept locally**. Dirty state is not cleared until the atomic request succeeds, failed autosaves preserve the dirty blueprint in frontend memory, overlapping requests are prevented, and a follow-up autosave is queued when edits occur while a save is in progress. A later enhancement should add safe local browser draft recovery; Milestone 5 intentionally avoids localStorage recovery to keep persistence atomic and low risk.

### Repeated strict-fit revalidation

Every active geometry change (`shape`, `width`, or `length`) re-runs strict-fit validation using the current nail geometry and current layer transforms. This is not a one-time migration: Almond → Square → Coffin → Stiletto → Oval → Almond sequences continue to re-fit artwork deterministically. Assets preserve relative placement and rotation where possible, only repositioning or reducing scale when needed. Drawing points are re-projected into the current silhouette so hidden off-silhouette stroke points are not persisted. SVG clipping remains a visual safety layer, but persisted transforms and stroke points are physically valid.

Revalidation is idempotent. Running the same validation twice without another geometry change produces identical output, avoids cumulative center drift, and avoids repeated shrinking once artwork already fits. Bulk copy, paste, duplicate, mirror, and apply-shape actions revalidate every affected destination nail independently.

### Set-level metadata and product-use hooks

Blueprint metadata can now store tags, optional internal artist notes, an estimated service price placeholder, and a style category: Minimal, French, Glam, Abstract, Bridal, Seasonal, or Custom. No schema migration is required because the data lives inside the existing blueprint metadata object.

`summarizeFullSetAssets()` provides deterministic product-use hooks for later pricing and inventory work. It counts nails, visible valid charms by asset ID, visible valid jewels by asset ID, visible valid decals by asset ID, visible drawing-layer count, visible gradient-layer count, visible pattern-layer count, and visible French Tip layer count. French Tip layers are counted separately from pattern layers so future pricing and inventory logic can keep those product categories distinct. Invalid off-silhouette asset geometry is excluded.

### Save, load, and proposal compatibility

New full-set designs and upgraded legacy designs save atomically through the existing blueprint routes. Existing single-nail designs upgrade to 10 slots without discarding the original nail. Existing full-set designs reload with all nails intact and continue editing from the persisted active nail when valid. Design rename persistence, failed-save frontend state preservation, rollback guarantees, and no-orphan-design behavior remain tied to the existing atomic server workflow.

Proposal compatibility is preserved by keeping legacy flat fields synchronized from the active nail only. Public proposal cards may continue using the active-nail preview in Milestone 5; richer full-set proposal previews are intentionally deferred.

### Known limitations and Milestone 5.1 French-tip backlog

Known limitations:

- Public proposal previews remain active-nail based rather than full-set thumbnails.
- Autosave recovery is memory-only after a failed save; safe local browser draft recovery is deferred.
- The product-use summary is a counting hook, not a complete product estimator or pricing engine.
- Bulk action UI uses browser confirmations for destructive operations.

Milestone 5.1 French-tip refinement backlog:

- adjustable French-tip height
- adjustable smile-line curve
- soft, medium, and deep smile-line presets
- angled French tip
- V-French tip
- reverse French tip
- per-nail French-tip controls
- bulk-apply French-tip settings across selected nails

### Milestone 5 review hardening

The PR #6 review follow-up tightened the full-set editor around autosave races, replacement safety, history retention, and inactive-nail compatibility.

- **Full-set initializer:** the studio now initializes new editor state with `createFullSetBlueprint()`, which creates exactly ten slots and selects the documented `right-index` default active nail.
- **Edit-generation autosave protection:** every meaningful local mutation increments an editor generation counter. Save requests capture the submitted generation, and a successful response may only replace the visible blueprint or clear dirty state when no newer local edits occurred while the request was in flight. If a newer edit exists, the response is treated as a persisted older snapshot only: the database ID from a first create is preserved, the newer local blueprint and design name stay visible, dirty state remains true, and a follow-up autosave is queued from the latest refs so only one draft row is created.
- **Save-result navigation gating:** `save()` returns a structured `{ ok, designId, savedRevision }` or `{ ok: false, reason }` result. Loading another saved design or starting a new design first waits for the active save when needed; if dirty work cannot be saved, the current blueprint remains open and replacement requires an explicit discard confirmation.
- **Autosave history preservation:** successful background and manual saves no longer clear undo/redo stacks. History is intentionally reset only when a different design is loaded, a new design is started, or the editor blueprint is otherwise deliberately replaced.
- **Structural normalization versus destructive revalidation:** `ensureFullSetBlueprint()` now performs full-set structural repair (slot coverage, ID uniqueness, metadata defaults, and active-nail validity) without revalidating every nail. Destructive geometry revalidation stays scoped to active-nail geometry edits and explicit bulk destinations such as copy, mirror, apply-shape, and reset.
- **Inactive nail no-op preservation guarantee:** backend-valid inactive nails remain byte-for-byte stable for IDs, slots, layers, stroke IDs, order, transforms including non-uniform scale, rotation, metadata, visibility, locked state, and drawing points during load and no-op save normalization. Invalid nails may still be repaired to keep the Nail Blueprint v1 document server-safe.
- **Known limitations:** this is still a frontend deterministic smoke layer rather than a browser automation suite. The autosave race and navigation protections are covered by helper-source assertions and pure helper tests; a future Playwright/Vitest harness should simulate delayed network responses in a mounted React environment.

### App-level dirty-work leave protection

Design Studio dirty-work protection now extends beyond in-studio design replacement. The app shell gates sidebar navigation and logout through the studio's imperative leave guard before unmounting the editor. When dirty work exists, the studio first attempts an immediate save and waits for the result. Successful saves allow the requested navigation or logout; failed saves keep the user in Design Studio with the local blueprint still open and require an explicit discard confirmation before leaving.

The studio also registers a browser `beforeunload` warning while dirty work exists. This warning is intentionally conservative: it alerts that unsaved work exists, but it does not promise that an async save can complete during tab close, refresh, or browser shutdown.

Active nail selection remains stored as `canvas.activeNailId` for blueprint compatibility, but thumbnail navigation is UI selection state rather than a content mutation. Clicking a thumbnail updates the local blueprint ref and visible active nail immediately, while clicking the already-active nail is a no-op. Clean thumbnail browsing does not mark the editor dirty, schedule autosave, create history entries, generate an `Untitled Set` name, or create a draft row. A separate selection revision prevents older in-flight save responses from jumping the UI back to a prior nail; the current `activeNailId` is persisted on the next meaningful content save or explicit manual save.

Save responses are also scoped to the editor session that submitted them. Each save captures the current editor-session token, selected design ID, and whether the request is a first draft create, existing-design update, manual save, or autosave. Loading another design, starting a new design, or intentionally replacing/discarding editor state invalidates older in-flight saves. If a previous session's response returns later, the studio may record the saved row in the saved-design list, but it does not apply that response's blueprint, name, dirty state, or selected-design ID to the current editor. This includes stale first-create responses: their created ID is not attached to a newer draft, so future saves for the current session cannot update the old row by accident.

Undo and Redo are treated as editor mutations. Each operation updates the blueprint ref, marks the design dirty, restores the "Unsaved changes" save label, and schedules the standard 20-second debounced autosave while preserving undo/redo history.

Generated names for unnamed autosaved drafts are stable for the lifetime of that draft. The first generated or server-returned `Untitled Set N` name is reused by stale-response handling, queued follow-up saves, and later autosaves until the user starts a truly new design, loads another design, or enters an authoritative manual name. Existing saved designs do not generate `Untitled Set` names during autosave: if the visible name input is blank, autosave preserves the last persisted design name instead of renaming the row. Manual Save follows the same preserve-and-restore behavior for existing designs with a blank name, and user-entered valid renames remain authoritative on the next successful save.

Base-color synchronization uses the active nail's visible base layer as the source of truth. When a base layer color is edited from Properties, the active nail's legacy `baseColorHex` is synchronized to that layer color where possible; bulk "apply base" actions and legacy flat-field save sync prefer the active base layer `data.colorHex` when it is valid and fall back to `activeNail.baseColorHex` only when the layer color is missing or invalid.

Known limitation: browser unload protection depends on native browser confirmation UI and cannot show the richer in-app discard confirmation or guarantee network persistence during page shutdown.

### Stale autosave timer protection

Pending autosave timers are cleared and nulled whenever the editor becomes clean, including successful manual saves, successful autosaves with no newer local edits, loaded/replaced designs, clean new designs, explicit discard/replacement flows, and studio unmount cleanup. Queued follow-up autosaves are preserved when newer local edits remain dirty.

Each scheduled autosave captures the current editor-session token. Timer callbacks clear their own timer ref, verify the studio is still mounted, verify the captured session still matches the current draft/session, and verify `dirtyRef.current` is still true before calling `save({ autosave: true })`. Starting a new draft or loading/replacing editor state increments the session token, preventing a timer created for one draft from saving a later clean replacement draft or generating an unwanted `Untitled Set` row.

### Manual QA: full-set asset thumbnail rendering

Use this focused regression check for full-set previews after bulk copying asset artwork:

1. Create or open a full-set nail design.
2. On one nail, add at least one charm, one jewel, and one decal layer. Add a drawing stroke too so mixed layer ordering is visible.
3. Use **Duplicate all** from the bulk actions panel.
4. Confirm the full-set preview shows the charm, jewel, and decal on every copied nail thumbnail.
5. Confirm the left-hand and right-hand filtered hand previews also show the charm, jewel, and decal.
6. Copy the decorated nail, select a different destination nail, and use **Paste selected**; confirm the selected nail preview shows all asset types.
7. Use **Mirror hand**; confirm the destination hand previews show all asset types.
8. Click an individual copied thumbnail and confirm the Layers panel still lists the copied charm, jewel, decal, drawing, and base layers.
9. Save the design, reload it, and confirm both the copied layers and the full-set/hand preview rendering still show the charm, jewel, and decal.

## Milestone 5.1 — French Tip Precision Editor

Milestone 5.1 adds a dedicated `frenchTip` blueprint layer for practical salon French-tip layout while preserving the layered Nail Blueprint v1 document and all existing layer types. The layer is saved in the same `design_blueprints.document` JSON payload, so no database migration is required.

### French Tip layer model

A French Tip layer uses `type: "frenchTip"` and stores normalized vector controls in `layer.data`:

- `style` — one of `classic`, `deep`, `angled`, `v`, or `reverse`.
- `preset` — one of `soft`, `medium`, or `deep` for quick smile-line starting points.
- `tipHeight` — normalized tip coverage from the free edge.
- `smileCurve` — normalized curve lift for the smile line.
- `smileDepth` — normalized center depth of the smile line.
- `smileWidth` — normalized smile-line width across the nail.
- `colorHex` — the tip polish color.
- `rotation` — a bounded angle used for angled or rotated French layouts.

The layer also keeps standard layer fields (`id`, `name`, `visible`, `locked`, `opacity`, `order`, and `transform`) so autosave, undo/redo, layer ordering, saved/reloaded designs, proposal compatibility, and bulk copy/paste/mirror continue to operate through the existing blueprint architecture.

Backend blueprint validation accepts only the documented French Tip styles (`classic`, `deep`, `angled`, `v`, `reverse`) and presets (`soft`, `medium`, `deep`). It validates `colorHex` as a hex color and enforces the same practical frontend ranges for `tipHeight` (0.08–0.72), `smileCurve` (0–1), `smileDepth` (0–0.65), `smileWidth` (0.25–1), layer opacity (0–1), and `rotation` (-45–45). Malformed French Tip payloads are rejected with blueprint validation errors rather than persisted raw. Existing legacy `v-french` style payloads are normalized to the supported `v` style on save.

### Controls

The Design Studio now includes a French Tip Precision panel and top-toolbar action:

- **Add French Tip** creates a dedicated French Tip vector layer on the active nail.
- **Tip height**, **Smile curve**, and **Smile depth** sliders tune the visible tip shape.
- **Tip color** uses the existing color picker and hex-safe normalization.
- **Preset** switches between `soft`, `medium`, and `deep` smile-line defaults.
- **Style** switches between classic French, deep French, angled French, V-French, and reverse French.
- The Properties panel also exposes French Tip layer controls, including smile width, opacity, and angle.
- Zero-valued smile controls are valid: Smile curve and Smile depth can remain at `0` without the UI falling back to preset defaults.

### Presets and styles

- **Soft** is a shallow, subtle smile line for minimal French looks.
- **Medium** is the default balanced salon French shape.
- **Deep** increases tip height and smile depth for dramatic French sets.
- **Classic French** uses a curved smile line at the free edge.
- **Deep French** extends the smile line deeper toward the nail bed.
- **Angled French** offsets and rotates the smile line for diagonal tips.
- **V-French** renders a pointed center V.
- **Reverse French** renders the French shape from the cuticle side.

### Preview behavior

French Tip rendering is SVG-vector based and clipped by the same nail silhouette used by the main canvas and thumbnails. It respects each nail's current shape, length, and width because the rendered path is generated from the nail geometry at render time. Revalidation after shape, length, or width changes preserves French Tip layers and re-normalizes their full-surface transform without touching base, drawing, charm, jewel, decal, gradient, or pattern layers.
French Tip SVG overlays opt out of pointer events in the editable canvas and previews, matching gradient and pattern overlay behavior. Artists select and edit French Tip layers through the Layers panel and Properties panel, while clicks, drags, Draw, and Eraser gestures pass through the visible tip overlay to underlying artwork or the root canvas handler.

French Tip layers appear in:

- the main `NailCanvas` editor,
- hand previews,
- full-set previews,
- saved and reloaded blueprint designs.

### Bulk apply behavior

French Tip controls can apply the selected or first available French Tip layer to:

- the active nail,
- the current hand,
- all nails in the full set.

Bulk application reuses the active layer's normalized French Tip data, creates or updates one French Tip layer on each target nail, and revalidates target nails through the existing strict-fit helpers. Existing bulk copy, paste, duplicate, and mirror flows also copy French Tip layers with fresh destination-safe layer IDs.

### Known limitations

- French Tip controls are numeric/vector approximations, not a freeform Bezier editor.
- Multiple French Tip layers can be stacked manually through normal layer duplication, but the bulk apply workflow updates the first existing French Tip layer per target nail.
- Rotation is intentionally bounded to keep angled French designs practical inside strict-fit nail silhouettes.
- Public proposal cards continue using legacy flat fields for compatibility; French Tip detail is preserved in the editable blueprint and studio previews.

### Milestone 6 Polish Engine

Milestone 6 adds the Polish Engine so AnitaSet designs read more like salon polish on a shaped nail and less like flat vector artwork. The engine keeps the existing Nail Blueprint v1 layer system intact: base layers now carry safe polish fields, and older saved designs are normalized as **Cream** polish with conservative defaults when they are opened or saved.

**Supported Polish Types**

- **Cream** — smooth salon color with subtle gloss and soft body.
- **Jelly** — translucent color that lets light and lower depth show through.
- **Milky** — semi-sheer cloudy polish with a softened veil.
- **Matte** — low-shine surface with topcoat shine suppressed.
- **Chrome** — metallic-style reflective finish controlled by Chrome Intensity.
- **Cat Eye** — magnetic directional highlight controlled by Cat Eye Angle and Cat Eye Intensity.
- **Glitter** — scattered reflective sparkle controlled by Glitter Density and Glitter Size.

**Polish Settings controls**

The Design Studio base layer now exposes Polish Settings using nail-industry language: Polish Type, Color, Shine, Transparency, Top Coat, Glitter Density, Glitter Size, Cat Eye Angle, Cat Eye Intensity, and Chrome Intensity. Glitter controls only show for Glitter polish, Cat Eye controls only show for Cat Eye polish, and Chrome Intensity only shows for Chrome polish. Legacy effect controls remain available for compatibility but are visually separated from the salon-facing Polish Settings.

**Rendering behavior**

A shared Polish Renderer is used by the editable NailCanvas plus thumbnail, hand, and full-set previews. It paints the selected Polish Type, then applies automatic realism layers clipped to Shape Engine V2 geometry: apex highlight, sidewall shadow, free-edge highlight, and Top Coat shine. Charms, jewels, and decals keep the same data model but receive a small contact shadow; jewels also get a small highlight where practical.

**Validation, defaults, and legacy effect compatibility**

The backend validates `polishType`, `topCoat`, and all numeric polish controls during blueprint persistence. Existing base layers that do not have polish fields default to Cream polish with safe Shine, Transparency, Top Coat, sparkle, Cat Eye, and Chrome values. Invalid polish types or malformed numeric controls are rejected with blueprint validation errors. No database migration is required because the fields live inside existing blueprint layer data.

Legacy base effect fields remain render-compatible for older saved designs, cards, thumbnails, hand/full-set previews, and proposal flows. Rendering does not mutate stored designs just to preview them: when a base layer has `effect`/`effectColorHex` but no explicit user-selected `polishType`, the renderer maps legacy effects into the Polish Engine as follows:

| Legacy base effect | Polish Engine rendering behavior |
| --- | --- |
| `Solid` | Safe Cream polish rendering. |
| `Gradient` | Preserves a two-color legacy gradient using base color plus `effectColorHex`. |
| `Chrome` | Maps to Chrome polish rendering and keeps the chrome-like reflective finish. |
| `CatEye` | Maps to Cat Eye polish rendering and keeps the directional magnetic-style highlight. |
| `Marble` | Uses a marble-like compatibility overlay with legacy veining color from `effectColorHex`. |

If both `polishType` and legacy `effect` are present, the explicit Polish Type is authoritative. This lets intentionally migrated or newly edited designs keep the user-selected Polish Type while preserving older designs that only have legacy effect data. Save/load continues to preserve `effect` and `effectColorHex` flat fields unless the user intentionally changes the newer Polish Type settings.

**Compatibility and limitations**

Polish Engine does not add AI, marketplace, inventory, or hand-preview feature upgrades. It preserves Shape Engine V2, French Tips, drawings, charms, jewels, decals, gradients, patterns, full-set workflow, copy/paste/duplicate/mirror, autosave, undo/redo, save/load, and proposal compatibility. The renderer is deterministic SVG/CSS-style polish simulation rather than physically based ray tracing; Chrome, Cat Eye, Jelly, and Glitter are stylized salon approximations optimized for fast previews.
