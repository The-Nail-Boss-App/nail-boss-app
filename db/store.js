"use strict";

const fs = require("fs");
const path = require("path");
const VALID_STATUSES = ["Sent", "Viewed", "Accepted", "ChangesRequested", "Declined"];

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

function createPgPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return null;

  const { Pool } = require("pg");
  const sslEnabled = shouldUseSsl(databaseUrl);
  return new Pool({
    connectionString: databaseUrl,
    ssl: sslEnabled ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PGPOOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

function toTimestamp(value) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
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
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  };
}

function mapProposal(row) {
  if (!row) return null;
  const proposal = {
    id: row.id,
    designId: row.design_id,
    clientName: row.client_name,
    price: Number(row.price),
    status: row.status,
    notes: row.notes || "",
    createdAt: toTimestamp(row.created_at),
    updatedAt: toTimestamp(row.updated_at),
  };

  if (row.design_id_populated) {
    proposal.design = mapDesign({
      id: row.design_id_populated,
      name: row.design_name,
      shape: row.design_shape,
      length: row.design_length,
      width: row.design_width,
      base_color_hex: row.design_base_color_hex,
      effect: row.design_effect,
      effect_color_hex: row.design_effect_color_hex,
      tags: row.design_tags,
      created_at: row.design_created_at,
      updated_at: row.design_updated_at,
    });
  }

  return proposal;
}

function mapHistory(row) {
  return {
    id: row.id,
    proposalId: row.proposal_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    notes: row.notes || "",
    createdAt: toTimestamp(row.created_at),
  };
}

const PROPOSAL_SELECT = `
  SELECT
    p.id,
    p.design_id,
    p.client_name,
    p.price,
    p.status,
    p.notes,
    p.created_at,
    p.updated_at,
    d.id AS design_id_populated,
    d.name AS design_name,
    d.shape AS design_shape,
    d.length AS design_length,
    d.width AS design_width,
    d.base_color_hex AS design_base_color_hex,
    d.effect AS design_effect,
    d.effect_color_hex AS design_effect_color_hex,
    d.tags AS design_tags,
    d.created_at AS design_created_at,
    d.updated_at AS design_updated_at
  FROM proposals p
  LEFT JOIN designs d ON d.id = p.design_id
`;

function createPostgresStore(pool) {
  async function query(text, params = []) {
    try {
      return await pool.query(text, params);
    } catch (error) {
      error.message = `Database query failed: ${error.message}`;
      throw error;
    }
  }

  async function updateProposalStatus(proposalId, newStatus, notes = "") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const current = await client.query("SELECT status, notes FROM proposals WHERE id = $1 FOR UPDATE", [proposalId]);
      if (current.rowCount === 0) {
        await client.query("ROLLBACK");
        return null;
      }

      const previousStatus = current.rows[0].status;
      const nextNotes = typeof notes === "string" && notes.trim() ? notes.trim() : current.rows[0].notes;

      if (previousStatus !== newStatus || nextNotes !== current.rows[0].notes) {
        await client.query(
          `UPDATE proposals
             SET status = $2,
                 notes = $3,
                 updated_at = NOW()
           WHERE id = $1`,
          [proposalId, newStatus, nextNotes],
        );
      }

      if (previousStatus !== newStatus) {
        await client.query(
          `INSERT INTO proposal_status_history (proposal_id, previous_status, new_status, notes)
           VALUES ($1, $2, $3, $4)`,
          [proposalId, previousStatus, newStatus, typeof notes === "string" ? notes.trim() : ""],
        );
      }

      const updated = await client.query(`${PROPOSAL_SELECT} WHERE p.id = $1`, [proposalId]);
      await client.query("COMMIT");
      return mapProposal(updated.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK");
      error.message = `Database transaction failed: ${error.message}`;
      throw error;
    } finally {
      client.release();
    }
  }

  return {
    kind: "postgres",
    async assertReady() {
      await query("SELECT 1");
    },
    async getCounts() {
      const result = await query(`
        SELECT
          (SELECT COUNT(*)::int FROM designs) AS designs,
          (SELECT COUNT(*)::int FROM proposals) AS proposals
      `);
      return result.rows[0];
    },
    async listDesigns() {
      const result = await query("SELECT * FROM designs ORDER BY created_at DESC");
      return result.rows.map(mapDesign);
    },
    async getDesign(id) {
      const result = await query("SELECT * FROM designs WHERE id = $1", [id]);
      return mapDesign(result.rows[0]);
    },
    async createDesign(design) {
      const result = await query(
        `INSERT INTO designs (id, name, shape, length, width, base_color_hex, effect, effect_color_hex, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          design.id,
          design.name,
          design.shape,
          design.length,
          design.width,
          design.baseColorHex,
          design.effect,
          design.effectColorHex,
          design.tags,
        ],
      );
      return mapDesign(result.rows[0]);
    },
    async deleteDesign(id) {
      const result = await query("DELETE FROM designs WHERE id = $1", [id]);
      return result.rowCount > 0;
    },
    async listProposals() {
      const result = await query(`${PROPOSAL_SELECT} ORDER BY p.created_at DESC`);
      return result.rows.map(mapProposal);
    },
    async getProposal(id) {
      const result = await query(`${PROPOSAL_SELECT} WHERE p.id = $1`, [id]);
      return mapProposal(result.rows[0]);
    },
    async createProposal(proposal) {
      const result = await query(
        `INSERT INTO proposals (id, design_id, client_name, price, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [proposal.id, proposal.designId, proposal.clientName, proposal.price, proposal.status, proposal.notes],
      );
      return this.getProposal(result.rows[0].id);
    },
    async updateProposalStatus(proposalId, newStatus, notes = "") {
      if (!VALID_STATUSES.includes(newStatus)) throw new Error(`Invalid proposal status: ${newStatus}`);
      return updateProposalStatus(proposalId, newStatus, notes);
    },
    async listProposalHistory(proposalId) {
      const result = await query(
        `SELECT * FROM proposal_status_history WHERE proposal_id = $1 ORDER BY created_at ASC, id ASC`,
        [proposalId],
      );
      return result.rows.map(mapHistory);
    },
    async close() {
      await pool.end();
    },
  };
}

function createFileStore(filePath) {
  const absolutePath = path.resolve(filePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  if (!fs.existsSync(absolutePath)) {
    fs.writeFileSync(absolutePath, JSON.stringify({ designs: [], proposals: [], proposalStatusHistory: [] }, null, 2));
  }

  function read() {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  }

  function write(data) {
    fs.writeFileSync(absolutePath, JSON.stringify(data, null, 2));
  }

  function attachDesign(data, proposal) {
    if (!proposal) return null;
    return { ...proposal, design: data.designs.find((design) => design.id === proposal.designId) || null };
  }

  return {
    kind: "test-file",
    async assertReady() {
      read();
    },
    async getCounts() {
      const data = read();
      return { designs: data.designs.length, proposals: data.proposals.length };
    },
    async listDesigns() {
      return read().designs.sort((a, b) => b.createdAt - a.createdAt);
    },
    async getDesign(id) {
      return read().designs.find((design) => design.id === id) || null;
    },
    async createDesign(design) {
      const data = read();
      const now = Date.now();
      const row = { ...design, createdAt: now, updatedAt: now };
      data.designs.push(row);
      write(data);
      return row;
    },
    async deleteDesign(id) {
      const data = read();
      const before = data.designs.length;
      data.designs = data.designs.filter((design) => design.id !== id);
      data.proposals = data.proposals.filter((proposal) => proposal.designId !== id);
      write(data);
      return data.designs.length < before;
    },
    async listProposals() {
      const data = read();
      return data.proposals
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((proposal) => attachDesign(data, proposal));
    },
    async getProposal(id) {
      const data = read();
      return attachDesign(data, data.proposals.find((proposal) => proposal.id === id) || null);
    },
    async createProposal(proposal) {
      const data = read();
      const now = Date.now();
      const row = { ...proposal, createdAt: now, updatedAt: now };
      data.proposals.push(row);
      write(data);
      return attachDesign(data, row);
    },
    async updateProposalStatus(proposalId, newStatus, notes = "") {
      const data = read();
      const proposal = data.proposals.find((item) => item.id === proposalId);
      if (!proposal) return null;
      const previousStatus = proposal.status;
      const trimmedNotes = typeof notes === "string" ? notes.trim() : "";
      proposal.status = newStatus;
      if (trimmedNotes) proposal.notes = trimmedNotes;
      proposal.updatedAt = Date.now();
      if (previousStatus !== newStatus) {
        data.proposalStatusHistory.push({
          id: `${proposalId}:${data.proposalStatusHistory.length + 1}`,
          proposalId,
          previousStatus,
          newStatus,
          notes: trimmedNotes,
          createdAt: Date.now(),
        });
      }
      write(data);
      return attachDesign(data, proposal);
    },
    async listProposalHistory(proposalId) {
      return read().proposalStatusHistory.filter((item) => item.proposalId === proposalId);
    },
    async close() {},
  };
}

function createStore() {
  const pool = createPgPool();
  if (pool) return createPostgresStore(pool);

  if (process.env.ANITASET_TEST_DB_FILE) {
    return createFileStore(process.env.ANITASET_TEST_DB_FILE);
  }

  throw new Error(
    "DATABASE_URL is required for AnitaSet persistent storage. " +
    "For local development, create a PostgreSQL database, set DATABASE_URL, and run `npm run db:migrate`. " +
    "Tests may set ANITASET_TEST_DB_FILE for the documented file-backed smoke-test fallback.",
  );
}

module.exports = {
  createStore,
  VALID_STATUSES,
};
