"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { v4: uuidv4 } = require("uuid");

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VALID_STATUSES = ["Sent", "Viewed", "Accepted", "ChangesRequested", "Declined"];

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

function createPgPool() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    if (isTestFileFallbackEnabled()) return null;
    throw new Error("DATABASE_URL is required unless ANITASET_TEST_DB_FILE is intentionally set for tests");
  }

  const parsed = parseDatabaseUrl(databaseUrl);
  const host = parsed.hostname;
  const ssl = LOCAL_DB_HOSTS.has(host) ? false : { rejectUnauthorized: false };

  const { Pool } = require("pg");
  return new Pool({ connectionString: databaseUrl, ssl });
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
    const result = await this.pool.query(
      `INSERT INTO designs
        (id, name, shape, length, width, base_color_hex, effect, effect_color_hex, tags, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        input.id,
        input.name,
        input.shape,
        input.length,
        input.width,
        input.baseColorHex,
        input.effect,
        input.effectColorHex,
        input.tags,
        input.createdAt,
      ],
    );
    return mapDesign(result.rows[0]);
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

  async updateProposalStatus(id, status, note = "") {
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
          [uuidv4(), id, current.status, status, note || "", Date.now()],
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
    this.data = { designs: [], proposals: [], proposalStatusHistory: [] };
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
        designs: parsed.designs || [],
        proposals: parsed.proposals || [],
        proposalStatusHistory: parsed.proposalStatusHistory || [],
      };
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
    return [...this.data.designs].sort((a, b) => b.createdAt - a.createdAt);
  }

  async getDesign(id) {
    return this.data.designs.find((design) => design.id === id) || null;
  }

  async createDesign(input) {
    this.data.designs.push({ ...input });
    this.persist();
    return { ...input };
  }

  async deleteDesign(id) {
    const before = this.data.designs.length;
    this.data.designs = this.data.designs.filter((design) => design.id !== id);
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

  async updateProposalStatus(id, status, note = "") {
    if (!VALID_STATUSES.includes(status)) throw new Error("Invalid proposal status");

    const proposal = this.data.proposals.find((item) => item.id === id);
    if (!proposal) return null;

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
        createdAt: Date.now(),
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
};
