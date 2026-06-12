"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { v4: uuidv4 } = require("uuid");

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VALID_STATUSES = ["Sent", "Viewed", "Accepted", "ChangesRequested", "Declined"];
const TERMINAL_STATUSES = ["Accepted", "ChangesRequested", "Declined"];
const VALID_SHAPES = ["Almond", "Coffin", "Square", "Stiletto", "Oval"];
const VALID_EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];
const SUPPORTED_BLUEPRINT_SCHEMA_VERSIONS = [1];
const SUPPORTED_LAYER_TYPES = ["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel"];
const MAX_BLUEPRINT_NAILS = 10;
const MAX_BLUEPRINT_LAYERS_PER_NAIL = 200;
const MAX_BLUEPRINT_JSON_BYTES = 100 * 1024;
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const SELF_SIGNED_TLS_ENV = "ANITASET_ALLOW_SELF_SIGNED_DB_TLS";

class ProposalStatusConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProposalStatusConflictError";
    this.statusCode = 409;
  }
}

class BlueprintValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "BlueprintValidationError";
    this.statusCode = 400;
  }
}

function isTestFileFallbackEnabled() {
  return Boolean(process.env.ANITASET_TEST_DB_FILE);
}

function parseDatabaseUrl(databaseUrl) {
  try {
    return new URL(databaseUrl);
  } catch (_error) {
    throw new Error("DATABASE_URL is not a valid PostgreSQL connection string");
  }
}

function getPostgresSslConfig(parsed) {
  if (LOCAL_DB_HOSTS.has(parsed.hostname)) return false;
  if (process.env[SELF_SIGNED_TLS_ENV] === "true") return { rejectUnauthorized: false };
  return { rejectUnauthorized: true };
}

function createPgPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    if (isTestFileFallbackEnabled()) return null;
    throw new Error("DATABASE_URL is required unless ANITASET_TEST_DB_FILE is intentionally set for tests");
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  const ssl = getPostgresSslConfig(parsed);

  const { Pool } = require("pg");
  return new Pool({ connectionString: databaseUrl, ssl });
}

function nowMs() {
  return Date.now();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteInteger(value) {
  return Number.isInteger(value) && Number.isFinite(value);
}

function assertHex(value, pathLabel) {
  if (typeof value !== "string" || !HEX_RE.test(value)) {
    throw new BlueprintValidationError(`${pathLabel} must be a valid hex color`);
  }
}

function normalizeTags(tags, pathLabel = "metadata.tags") {
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new BlueprintValidationError(`${pathLabel} must be an array of strings`);
  }
  return tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 50);
}

function getActiveNail(blueprint) {
  const activeNailId = blueprint.canvas && blueprint.canvas.activeNailId;
  return blueprint.nails.find((nail) => nail.id === activeNailId) || blueprint.nails[0];
}

function getBaseLayer(nail) {
  return nail.layers.find((layer) => layer.type === "base") || nail.layers[0];
}

function normalizeLayer(layer, nailIndex, layerIndex, seenLayerIds) {
  const pathPrefix = `nails[${nailIndex}].layers[${layerIndex}]`;
  if (!isPlainObject(layer)) throw new BlueprintValidationError(`${pathPrefix} must be an object`);
  if (typeof layer.id !== "string") throw new BlueprintValidationError(`${pathPrefix}.id must be a non-empty string`);
  const normalizedLayerId = layer.id.trim();
  if (!normalizedLayerId) throw new BlueprintValidationError(`${pathPrefix}.id must be a non-empty string`);
  if (seenLayerIds.has(normalizedLayerId)) throw new BlueprintValidationError(`layer ids must be unique within each nail`);
  seenLayerIds.add(normalizedLayerId);
  if (!SUPPORTED_LAYER_TYPES.includes(layer.type)) {
    throw new BlueprintValidationError(`${pathPrefix}.type must be one of: ${SUPPORTED_LAYER_TYPES.join(", ")}`);
  }
  if (typeof layer.visible !== "boolean") throw new BlueprintValidationError(`${pathPrefix}.visible must be a boolean`);
  if (typeof layer.locked !== "boolean") throw new BlueprintValidationError(`${pathPrefix}.locked must be a boolean`);
  if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) {
    throw new BlueprintValidationError(`${pathPrefix}.opacity must be a number between 0 and 1`);
  }
  if (!isFiniteInteger(layer.order)) throw new BlueprintValidationError(`${pathPrefix}.order must be a finite integer`);
  if (!isPlainObject(layer.transform)) throw new BlueprintValidationError(`${pathPrefix}.transform must be an object`);

  const transform = {};
  for (const key of ["x", "y", "scaleX", "scaleY", "rotation"]) {
    if (!isFiniteNumber(layer.transform[key])) {
      throw new BlueprintValidationError(`${pathPrefix}.transform.${key} must be a finite number`);
    }
    transform[key] = Number(layer.transform[key]);
  }

  if (!isPlainObject(layer.data)) throw new BlueprintValidationError(`${pathPrefix}.data must be an object`);
  if (Object.prototype.hasOwnProperty.call(layer.data, "colorHex")) assertHex(layer.data.colorHex, `${pathPrefix}.data.colorHex`);
  if (Object.prototype.hasOwnProperty.call(layer.data, "effectColorHex")) assertHex(layer.data.effectColorHex, `${pathPrefix}.data.effectColorHex`);
  if (layer.type === "base") {
    assertHex(layer.data.colorHex, `${pathPrefix}.data.colorHex`);
    if (typeof layer.data.effect !== "string" || !VALID_EFFECTS.includes(layer.data.effect)) {
      throw new BlueprintValidationError(`${pathPrefix}.data.effect must be one of: ${VALID_EFFECTS.join(", ")}`);
    }
    assertHex(layer.data.effectColorHex, `${pathPrefix}.data.effectColorHex`);
  }

  return {
    id: normalizedLayerId,
    type: layer.type,
    name: typeof layer.name === "string" && layer.name.trim() ? layer.name.trim() : layer.type,
    visible: layer.visible,
    locked: layer.locked,
    opacity: Number(layer.opacity),
    order: layer.order,
    transform,
    data: { ...layer.data },
  };
}

function validateAndNormalizeBlueprint(input) {
  if (!isPlainObject(input)) throw new BlueprintValidationError("blueprint must be an object");

  let byteLength;
  try {
    byteLength = Buffer.byteLength(JSON.stringify(input), "utf8");
  } catch (_error) {
    throw new BlueprintValidationError("blueprint must be valid JSON");
  }
  if (byteLength > MAX_BLUEPRINT_JSON_BYTES) {
    throw new BlueprintValidationError(`blueprint payload must be ${MAX_BLUEPRINT_JSON_BYTES} bytes or less`);
  }

  if (!SUPPORTED_BLUEPRINT_SCHEMA_VERSIONS.includes(input.schemaVersion)) {
    throw new BlueprintValidationError(`schemaVersion must be one of: ${SUPPORTED_BLUEPRINT_SCHEMA_VERSIONS.join(", ")}`);
  }
  if (!isPlainObject(input.canvas)) throw new BlueprintValidationError("canvas must be an object");
  if (!Array.isArray(input.nails) || input.nails.length < 1 || input.nails.length > MAX_BLUEPRINT_NAILS) {
    throw new BlueprintValidationError(`nails must contain 1 to ${MAX_BLUEPRINT_NAILS} nails`);
  }

  const seenNailIds = new Set();
  const nails = input.nails.map((nail, nailIndex) => {
    const pathPrefix = `nails[${nailIndex}]`;
    if (!isPlainObject(nail)) throw new BlueprintValidationError(`${pathPrefix} must be an object`);
    if (typeof nail.id !== "string") throw new BlueprintValidationError(`${pathPrefix}.id must be a non-empty string`);
    const normalizedNailId = nail.id.trim();
    if (!normalizedNailId) throw new BlueprintValidationError(`${pathPrefix}.id must be a non-empty string`);
    if (seenNailIds.has(normalizedNailId)) throw new BlueprintValidationError("nail ids must be unique strings");
    seenNailIds.add(normalizedNailId);
    if (!VALID_SHAPES.includes(nail.shape)) throw new BlueprintValidationError(`${pathPrefix}.shape must be one of: ${VALID_SHAPES.join(", ")}`);
    if (!isFiniteNumber(nail.length) || nail.length < 0 || nail.length > 1) {
      throw new BlueprintValidationError(`${pathPrefix}.length must be a number between 0 and 1`);
    }
    if (!isFiniteNumber(nail.width) || nail.width < 0 || nail.width > 1) {
      throw new BlueprintValidationError(`${pathPrefix}.width must be a number between 0 and 1`);
    }
    assertHex(nail.baseColorHex, `${pathPrefix}.baseColorHex`);
    if (!Array.isArray(nail.layers) || nail.layers.length > MAX_BLUEPRINT_LAYERS_PER_NAIL) {
      throw new BlueprintValidationError(`${pathPrefix}.layers must be an array with at most ${MAX_BLUEPRINT_LAYERS_PER_NAIL} layers`);
    }
    const seenLayerIds = new Set();
    const layers = nail.layers.map((layer, layerIndex) => normalizeLayer(layer, nailIndex, layerIndex, seenLayerIds));
    return {
      id: normalizedNailId,
      slot: typeof nail.slot === "string" && nail.slot.trim() ? nail.slot.trim() : `nail-${nailIndex + 1}`,
      shape: nail.shape,
      length: Number(nail.length),
      width: Number(nail.width),
      baseColorHex: nail.baseColorHex,
      layers,
    };
  });

  if (typeof input.canvas.activeNailId !== "string") {
    throw new BlueprintValidationError("canvas.activeNailId must reference an existing nail");
  }
  const activeNailId = input.canvas.activeNailId.trim();
  if (!activeNailId || !seenNailIds.has(activeNailId)) {
    throw new BlueprintValidationError("canvas.activeNailId must reference an existing nail");
  }

  const metadata = isPlainObject(input.metadata) ? input.metadata : {};
  const tags = normalizeTags(metadata.tags || []);

  return {
    schemaVersion: 1,
    canvas: {
      mode: typeof input.canvas.mode === "string" && input.canvas.mode.trim() ? input.canvas.mode.trim() : "single-nail",
      activeNailId,
    },
    nails,
    metadata: { ...metadata, tags },
  };
}

function createDefaultBlueprintForDesign(design) {
  return validateAndNormalizeBlueprint({
    schemaVersion: 1,
    canvas: { mode: "single-nail", activeNailId: "nail-1" },
    nails: [{
      id: "nail-1",
      slot: "accent",
      shape: design.shape || "Almond",
      length: Number(design.length ?? 0.5),
      width: Number(design.width ?? 0.5),
      baseColorHex: design.baseColorHex || "#E8A0BF",
      layers: [{
        id: "base-layer",
        type: "base",
        name: "Base Color",
        visible: true,
        locked: true,
        opacity: 1,
        order: 0,
        transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
        data: {
          colorHex: design.baseColorHex || "#E8A0BF",
          effect: design.effect || "Solid",
          effectColorHex: design.effectColorHex || "#FFFFFF",
        },
      }],
    }],
    metadata: { tags: Array.isArray(design.tags) ? design.tags : [] },
  });
}

function flatFieldsFromBlueprint(blueprint) {
  const activeNail = getActiveNail(blueprint);
  const baseLayer = getBaseLayer(activeNail) || { data: {} };
  const data = isPlainObject(baseLayer.data) ? baseLayer.data : {};
  return {
    shape: activeNail.shape,
    length: activeNail.length,
    width: activeNail.width,
    baseColorHex: data.colorHex || activeNail.baseColorHex,
    effect: VALID_EFFECTS.includes(data.effect) ? data.effect : "Solid",
    effectColorHex: data.effectColorHex || "#FFFFFF",
    tags: normalizeTags((blueprint.metadata && blueprint.metadata.tags) || []),
  };
}

function mapDesign(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    shape: row.shape,
    length: Number(row.length),
    width: Number(row.width),
    baseColorHex: row.base_color_hex,
    effect: row.effect,
    effectColorHex: row.effect_color_hex,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at ?? row.created_at),
  };
}

function mapProposal(row) {
  if (!row) return null;
  return {
    id: row.id,
    designId: row.design_id,
    clientName: row.client_name,
    price: Number(row.price),
    status: row.status,
    notes: row.notes || "",
    createdAt: Number(row.created_at),
  };
}

function mapHistory(row) {
  if (!row) return null;
  return {
    id: row.id,
    proposalId: row.proposal_id,
    oldStatus: row.old_status,
    newStatus: row.new_status,
    note: row.note || "",
    createdAt: Number(row.created_at),
  };
}

function mapBlueprint(row) {
  if (!row) return null;
  return {
    designId: row.design_id,
    schemaVersion: Number(row.schema_version),
    document: validateAndNormalizeBlueprint(row.document),
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
  };
}

class PostgresStore {
  constructor(pool) {
    this.pool = pool;
    this.storage = "postgres";
  }

  async close() {
    await this.pool.end();
  }

  async health() {
    const result = await this.pool.query(`
      SELECT
        (SELECT count(*)::int FROM designs) AS designs,
        (SELECT count(*)::int FROM proposals) AS proposals
    `);

    return {
      status: "ok",
      storage: this.storage,
      database: "connected",
      counts: {
        designs: Number(result.rows[0].designs),
        proposals: Number(result.rows[0].proposals),
      },
    };
  }

  async listDesigns() {
    const result = await this.pool.query("SELECT * FROM designs ORDER BY created_at DESC");
    return result.rows.map(mapDesign);
  }

  async getDesign(id) {
    const result = await this.pool.query("SELECT * FROM designs WHERE id = $1", [id]);
    return mapDesign(result.rows[0]);
  }

  async createDesign(input) {
    const createdAt = input.createdAt || nowMs();
    const designInput = { ...input, createdAt, updatedAt: input.updatedAt || createdAt };
    const blueprint = createDefaultBlueprintForDesign(designInput);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO designs
          (id, name, shape, length, width, base_color_hex, effect, effect_color_hex, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          designInput.id,
          designInput.name,
          designInput.shape,
          designInput.length,
          designInput.width,
          designInput.baseColorHex,
          designInput.effect,
          designInput.effectColorHex,
          designInput.tags,
          designInput.createdAt,
          designInput.updatedAt,
        ],
      );
      await client.query(
        `INSERT INTO design_blueprints (design_id, schema_version, document, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5)`,
        [designInput.id, blueprint.schemaVersion, JSON.stringify(blueprint), designInput.createdAt, designInput.updatedAt],
      );
      await client.query("COMMIT");
      return mapDesign(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getDesignBlueprint(designId) {
    const design = await this.getDesign(designId);
    if (!design) return null;
    let result = await this.pool.query("SELECT * FROM design_blueprints WHERE design_id = $1", [designId]);
    if (!result.rows[0]) {
      await this.upsertDesignBlueprint(designId, createDefaultBlueprintForDesign(design));
      result = await this.pool.query("SELECT * FROM design_blueprints WHERE design_id = $1", [designId]);
    }
    return mapBlueprint(result.rows[0]);
  }

  async upsertDesignBlueprint(designId, blueprintInput) {
    const blueprint = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(blueprint);
    const updatedAt = nowMs();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const designResult = await client.query("SELECT * FROM designs WHERE id = $1 FOR UPDATE", [designId]);
      if (!designResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      const current = mapDesign(designResult.rows[0]);
      await client.query(
        `UPDATE designs
         SET shape = $2,
             length = $3,
             width = $4,
             base_color_hex = $5,
             effect = $6,
             effect_color_hex = $7,
             tags = $8,
             updated_at = $9
         WHERE id = $1`,
        [designId, flat.shape, flat.length, flat.width, flat.baseColorHex, flat.effect, flat.effectColorHex, flat.tags, updatedAt],
      );
      const result = await client.query(
        `INSERT INTO design_blueprints (design_id, schema_version, document, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5)
         ON CONFLICT (design_id) DO UPDATE
         SET schema_version = EXCLUDED.schema_version,
             document = EXCLUDED.document,
             updated_at = EXCLUDED.updated_at
         RETURNING *`,
        [designId, blueprint.schemaVersion, JSON.stringify(blueprint), current.createdAt, updatedAt],
      );
      await client.query("COMMIT");
      return mapBlueprint(result.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteDesign(id) {
    const result = await this.pool.query("DELETE FROM designs WHERE id = $1", [id]);
    return result.rowCount > 0;
  }

  async listProposals() {
    const result = await this.pool.query("SELECT * FROM proposals ORDER BY created_at DESC");
    return Promise.all(result.rows.map(async (row) => this.populateProposal(mapProposal(row))));
  }

  async getProposal(id) {
    const result = await this.pool.query("SELECT * FROM proposals WHERE id = $1", [id]);
    return this.populateProposal(mapProposal(result.rows[0]));
  }

  async createProposal(input) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO proposals (id, design_id, client_name, price, status, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [input.id, input.designId, input.clientName, input.price, input.status, input.notes, input.createdAt],
      );
      await client.query(
        `INSERT INTO proposal_status_history (id, proposal_id, old_status, new_status, note, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [uuidv4(), input.id, null, input.status, "Proposal created", input.createdAt],
      );
      await client.query("COMMIT");
      return this.populateProposal(mapProposal(result.rows[0]));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateProposalStatus(id, status, note = "", options = {}) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Invalid proposal status");

    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const currentResult = await client.query("SELECT * FROM proposals WHERE id = $1 FOR UPDATE", [id]);
      const current = mapProposal(currentResult.rows[0]);
      if (!current) {
        await client.query("ROLLBACK");
        return null;
      }

      if (options.rejectIfCurrentTerminal && TERMINAL_STATUSES.includes(current.status)) {
        throw new ProposalStatusConflictError(`Proposal already has a final status: ${current.status}`);
      }

      if (TERMINAL_STATUSES.includes(current.status) && current.status !== status) {
        throw new ProposalStatusConflictError(`Proposal already has a final status: ${current.status}`);
      }

      let updated = current;
      if (current.status !== status || note) {
        const result = await client.query(
          `UPDATE proposals
           SET status = $2, notes = CASE WHEN $3::text <> '' THEN $3 ELSE notes END
           WHERE id = $1
           RETURNING *`,
          [id, status, note || ""],
        );
        updated = mapProposal(result.rows[0]);
        await client.query(
          `INSERT INTO proposal_status_history (id, proposal_id, old_status, new_status, note, created_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [uuidv4(), id, current.status, status, note || "", nowMs()],
        );
      }

      await client.query("COMMIT");
      return this.populateProposal(updated);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listProposalHistory(proposalId) {
    const result = await this.pool.query(
      "SELECT * FROM proposal_status_history WHERE proposal_id = $1 ORDER BY created_at ASC",
      [proposalId],
    );
    return result.rows.map(mapHistory);
  }

  async populateProposal(proposal) {
    if (!proposal) return null;
    return { ...proposal, design: await this.getDesign(proposal.designId) };
  }
}

class FileStore {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
    this.storage = "file-test";
    this.data = { designs: [], designBlueprints: [], proposals: [], proposalStatusHistory: [] };
    this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      this.persist();
      return;
    }

    const raw = fs.readFileSync(this.filePath, "utf8");
    if (raw.trim()) {
      const parsed = JSON.parse(raw);
      this.data = {
        designs: (parsed.designs || []).map((design) => ({ ...design, updatedAt: design.updatedAt || design.createdAt })),
        designBlueprints: parsed.designBlueprints || [],
        proposals: parsed.proposals || [],
        proposalStatusHistory: parsed.proposalStatusHistory || [],
      };
      for (const design of this.data.designs) {
        if (!this.data.designBlueprints.some((blueprint) => blueprint.designId === design.id)) {
          this.data.designBlueprints.push({
            designId: design.id,
            schemaVersion: 1,
            document: createDefaultBlueprintForDesign(design),
            createdAt: design.createdAt,
            updatedAt: design.updatedAt || design.createdAt,
          });
        }
      }
    }
  }

  persist() {
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath, `${JSON.stringify(this.data, null, 2)}\n`);
  }

  async close() {}

  async health() {
    return {
      status: "ok",
      storage: this.storage,
      database: "connected",
      counts: { designs: this.data.designs.length, proposals: this.data.proposals.length },
    };
  }

  async listDesigns() {
    return [...this.data.designs].sort((a, b) => b.createdAt - a.createdAt).map((design) => ({ ...design }));
  }

  async getDesign(id) {
    const design = this.data.designs.find((item) => item.id === id);
    return design ? { ...design } : null;
  }

  async createDesign(input) {
    const createdAt = input.createdAt || nowMs();
    const design = { ...input, createdAt, updatedAt: input.updatedAt || createdAt };
    const blueprint = createDefaultBlueprintForDesign(design);
    this.data.designs.push(design);
    this.data.designBlueprints.push({
      designId: design.id,
      schemaVersion: blueprint.schemaVersion,
      document: blueprint,
      createdAt: design.createdAt,
      updatedAt: design.updatedAt,
    });
    this.persist();
    return { ...design };
  }

  async getDesignBlueprint(designId) {
    const design = await this.getDesign(designId);
    if (!design) return null;
    let blueprint = this.data.designBlueprints.find((item) => item.designId === designId);
    if (!blueprint) {
      const document = createDefaultBlueprintForDesign(design);
      blueprint = {
        designId,
        schemaVersion: document.schemaVersion,
        document,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt || design.createdAt,
      };
      this.data.designBlueprints.push(blueprint);
      this.persist();
    }
    return { ...blueprint, document: validateAndNormalizeBlueprint(blueprint.document) };
  }

  async upsertDesignBlueprint(designId, blueprintInput) {
    const design = this.data.designs.find((item) => item.id === designId);
    if (!design) return null;
    const document = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(document);
    const updatedAt = nowMs();
    Object.assign(design, flat, { updatedAt });

    const existing = this.data.designBlueprints.find((item) => item.designId === designId);
    const blueprint = {
      designId,
      schemaVersion: document.schemaVersion,
      document,
      createdAt: existing ? existing.createdAt : design.createdAt,
      updatedAt,
    };
    if (existing) Object.assign(existing, blueprint);
    else this.data.designBlueprints.push(blueprint);
    this.persist();
    return { ...blueprint, document };
  }

  async deleteDesign(id) {
    const before = this.data.designs.length;
    this.data.designs = this.data.designs.filter((design) => design.id !== id);
    this.data.designBlueprints = this.data.designBlueprints.filter((blueprint) => blueprint.designId !== id);
    this.data.proposals = this.data.proposals.filter((proposal) => proposal.designId !== id);
    this.data.proposalStatusHistory = this.data.proposalStatusHistory.filter((entry) =>
      this.data.proposals.some((proposal) => proposal.id === entry.proposalId),
    );
    this.persist();
    return this.data.designs.length !== before;
  }

  async listProposals() {
    const proposals = [...this.data.proposals].sort((a, b) => b.createdAt - a.createdAt);
    return Promise.all(proposals.map((proposal) => this.populateProposal(proposal)));
  }

  async getProposal(id) {
    return this.populateProposal(this.data.proposals.find((proposal) => proposal.id === id) || null);
  }

  async createProposal(input) {
    const proposal = { ...input };
    this.data.proposals.push(proposal);
    this.data.proposalStatusHistory.push({
      id: uuidv4(),
      proposalId: proposal.id,
      oldStatus: null,
      newStatus: proposal.status,
      note: "Proposal created",
      createdAt: proposal.createdAt,
    });
    this.persist();
    return this.populateProposal(proposal);
  }

  async updateProposalStatus(id, status, note = "", options = {}) {
    if (!VALID_STATUSES.includes(status)) throw new Error("Invalid proposal status");

    const proposal = this.data.proposals.find((item) => item.id === id);
    if (!proposal) return null;

    if (options.rejectIfCurrentTerminal && TERMINAL_STATUSES.includes(proposal.status)) {
      throw new ProposalStatusConflictError(`Proposal already has a final status: ${proposal.status}`);
    }

    if (TERMINAL_STATUSES.includes(proposal.status) && proposal.status !== status) {
      throw new ProposalStatusConflictError(`Proposal already has a final status: ${proposal.status}`);
    }

    if (proposal.status !== status || note) {
      const oldStatus = proposal.status;
      proposal.status = status;
      if (note) proposal.notes = note;
      this.data.proposalStatusHistory.push({
        id: uuidv4(),
        proposalId: id,
        oldStatus,
        newStatus: status,
        note: note || "",
        createdAt: nowMs(),
      });
      this.persist();
    }

    return this.populateProposal(proposal);
  }

  async listProposalHistory(proposalId) {
    return this.data.proposalStatusHistory
      .filter((entry) => entry.proposalId === proposalId)
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  async populateProposal(proposal) {
    if (!proposal) return null;
    return { ...proposal, design: await this.getDesign(proposal.designId) };
  }
}

function createStore() {
  const pool = createPgPool();
  if (pool) return new PostgresStore(pool);

  if (isTestFileFallbackEnabled()) {
    return new FileStore(process.env.ANITASET_TEST_DB_FILE);
  }

  throw new Error("No persistence backend configured");
}

module.exports = {
  createStore,
  VALID_STATUSES,
  TERMINAL_STATUSES,
  VALID_SHAPES,
  VALID_EFFECTS,
  SUPPORTED_LAYER_TYPES,
  MAX_BLUEPRINT_NAILS,
  MAX_BLUEPRINT_LAYERS_PER_NAIL,
  MAX_BLUEPRINT_JSON_BYTES,
  BlueprintValidationError,
  ProposalStatusConflictError,
  createDefaultBlueprintForDesign,
  validateAndNormalizeBlueprint,
  flatFieldsFromBlueprint,
};
