// ─────────────────────────────────────────────────────────────────────────────
// AnitaSet — server.js
// Node.js + Express  |  PostgreSQL-backed persistence  |  all routes implemented
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const { createStore, VALID_STATUSES } = require("./db/store");

const app = express();
const PORT = process.env.PORT || 4000;
let store;
try {
  store = createStore();
} catch (error) {
  console.error(`AnitaSet startup failed: ${error.message}`);
  process.exit(1);
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN
    ? process.env.ALLOWED_ORIGIN.split(",")
    : ["http://localhost:3000", "http://localhost:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));

app.use(express.json({ limit: "25kb" }));

// Serve plain HTML for the client-facing proposal page (no React needed)
app.use(express.urlencoded({ extended: false, limit: "25kb" }));

// ── Validation helpers ────────────────────────────────────────────────────────

const VALID_SHAPES = ["Almond", "Coffin", "Square", "Stiletto", "Oval"];
const VALID_EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];
const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const TERMINAL_STATUSES = ["Accepted", "ChangesRequested", "Declined"];

function err(res, code, message) {
  return res.status(code).json({ error: message });
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

// ── Health check ──────────────────────────────────────────────────────────────

app.get("/api/health", asyncRoute(async (_req, res) => {
  try {
    res.json(await store.health());
  } catch (_error) {
    res.status(503).json({
      status: "error",
      storage: "postgres",
      database: "unavailable",
      message: "database unavailable",
    });
  }
}));

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/designs
// Returns all designs, newest first.
app.get("/api/designs", asyncRoute(async (_req, res) => {
  res.json(await store.listDesigns());
}));

// GET /api/designs/:id
// Returns a single design by id.
app.get("/api/designs/:id", asyncRoute(async (req, res) => {
  const design = await store.getDesign(req.params.id);
  if (!design) return err(res, 404, "Design not found");
  return res.json(design);
}));

// POST /api/designs
// Creates a new design. Returns 201 + the created object.
app.post("/api/designs", asyncRoute(async (req, res) => {
  const {
    name,
    shape = "Almond",
    length = 0.5,
    width = 0.5,
    baseColorHex = "#E8A0BF",
    effect = "Solid",
    effectColorHex = "#FFFFFF",
    tags = [],
  } = req.body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return err(res, 400, "name is required and must be a non-empty string");
  }

  if (!VALID_SHAPES.includes(shape)) {
    return err(res, 400, `shape must be one of: ${VALID_SHAPES.join(", ")}`);
  }

  if (typeof length !== "number" || length < 0 || length > 1) {
    return err(res, 400, "length must be a number between 0 and 1");
  }

  if (typeof width !== "number" || width < 0 || width > 1) {
    return err(res, 400, "width must be a number between 0 and 1");
  }

  if (!HEX_RE.test(baseColorHex)) {
    return err(res, 400, "baseColorHex must be a valid hex color (e.g. #FF00AA)");
  }

  if (!VALID_EFFECTS.includes(effect)) {
    return err(res, 400, `effect must be one of: ${VALID_EFFECTS.join(", ")}`);
  }

  if (!HEX_RE.test(effectColorHex)) {
    return err(res, 400, "effectColorHex must be a valid hex color");
  }

  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    return err(res, 400, "tags must be an array of strings");
  }

  const design = await store.createDesign({
    id: uuidv4(),
    name: name.trim(),
    shape,
    length: Number(length),
    width: Number(width),
    baseColorHex,
    effect,
    effectColorHex,
    tags: tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean),
    createdAt: Date.now(),
  });

  return res.status(201).json(design);
}));

// DELETE /api/designs/:id
// Removes a design (database cascades to proposals and status history that reference it).
app.delete("/api/designs/:id", asyncRoute(async (req, res) => {
  const deleted = await store.deleteDesign(req.params.id);
  if (!deleted) return err(res, 404, "Design not found");
  return res.status(204).send();
}));

// ─────────────────────────────────────────────────────────────────────────────
// PROPOSAL ROUTES (JSON API)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/proposals
// Returns all proposals, newest first, with design info embedded.
app.get("/api/proposals", asyncRoute(async (_req, res) => {
  res.json(await store.listProposals());
}));

// GET /api/proposals/:id/history
// Returns proposal status changes, oldest first.
app.get("/api/proposals/:id/history", asyncRoute(async (req, res) => {
  const proposal = await store.getProposal(req.params.id);
  if (!proposal) return err(res, 404, "Proposal not found");
  return res.json(await store.listProposalHistory(req.params.id));
}));

// GET /api/proposals/:id
// Returns a single proposal with embedded design.
app.get("/api/proposals/:id", asyncRoute(async (req, res) => {
  const proposal = await store.getProposal(req.params.id);
  if (!proposal) return err(res, 404, "Proposal not found");
  return res.json(proposal);
}));

// POST /api/proposals
// Creates a proposal linked to a design. Initial status is "Sent".
app.post("/api/proposals", asyncRoute(async (req, res) => {
  const { designId, clientName, price, notes = "" } = req.body;

  if (!designId || typeof designId !== "string") {
    return err(res, 400, "designId is required");
  }

  if (!await store.getDesign(designId)) {
    return err(res, 400, `No design found with id "${designId}"`);
  }

  if (!clientName || typeof clientName !== "string" || !clientName.trim()) {
    return err(res, 400, "clientName is required");
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
    return err(res, 400, "price must be a positive number");
  }

  const proposal = await store.createProposal({
    id: uuidv4(),
    designId,
    clientName: clientName.trim(),
    price: parsedPrice,
    status: "Sent",
    notes: typeof notes === "string" ? notes.trim() : "",
    createdAt: Date.now(),
  });

  return res.status(201).json(proposal);
}));

// PATCH /api/proposals/:id/status
// Internal tech-side status override (any valid status).
app.patch("/api/proposals/:id/status", asyncRoute(async (req, res) => {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return err(res, 400, `status must be one of: ${VALID_STATUSES.join(", ")}`);
  }

  const proposal = await store.updateProposalStatus(req.params.id, status);
  if (!proposal) return err(res, 404, "Proposal not found");
  return res.json(proposal);
}));

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT-FACING PROPOSAL PAGE  (HTML, no React)
// ─────────────────────────────────────────────────────────────────────────────

// GET /proposal/:id
// Renders a standalone HTML page the tech sends to the client.
// On first visit the status advances from "Sent" → "Viewed".
app.get("/proposal/:id", asyncRoute(async (req, res) => {
  let proposal = await store.getProposal(req.params.id);
  if (!proposal) {
    return res.status(404).send("<h2>Proposal not found.</h2>");
  }

  if (proposal.status === "Sent") {
    proposal = await store.updateProposalStatus(proposal.id, "Viewed", "Proposal opened") || proposal;
  }

  const design = proposal.design;
  const statusColor = {
    Sent: "#6b7280",
    Viewed: "#2563eb",
    Accepted: "#16a34a",
    ChangesRequested: "#d97706",
    Declined: "#dc2626",
  }[proposal.status] ?? "#6b7280";

  const actionable = !TERMINAL_STATUSES.includes(proposal.status);

  const actionButtons = actionable ? `
    <div class="actions">
      <button class="btn btn-accept"   onclick="sendAction('accept')">✓ Accept</button>
      <button class="btn btn-changes"  onclick="showChanges()">✎ Ask for Changes</button>
      <button class="btn btn-decline"  onclick="sendAction('decline')">✕ Decline</button>
    </div>
    <div id="changes-box" style="display:none; margin-top:16px;">
      <textarea id="changes-msg" placeholder="Describe what you'd like changed…" rows="4"></textarea>
      <button class="btn btn-changes" style="margin-top:8px;" onclick="sendChanges()">Send Change Request</button>
    </div>
  ` : `<p class="status-note">You already responded to this proposal.</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AnitaSet Proposal — ${escapeHtml(proposal.clientName)}</title>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{
      font-family:'Segoe UI',system-ui,sans-serif;
      background:#faf8f7;color:#1a1018;
      min-height:100vh;display:flex;align-items:center;justify-content:center;
      padding:24px;
    }
    .card{
      background:#fff;border-radius:20px;
      box-shadow:0 4px 32px rgba(60,20,50,.10);
      max-width:480px;width:100%;padding:36px 32px;
    }
    .brand{font-size:12px;font-weight:700;letter-spacing:.08em;
           color:#9c8a96;text-transform:uppercase;margin-bottom:20px}
    h1{font-size:22px;font-weight:700;color:#1a1018;margin-bottom:4px}
    .subtitle{font-size:14px;color:#9c8a96;margin-bottom:24px}
    .detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
    .detail{background:#faf8f7;border-radius:12px;padding:14px 16px}
    .detail-label{font-size:11px;font-weight:600;text-transform:uppercase;
                  letter-spacing:.06em;color:#9c8a96;margin-bottom:4px}
    .detail-value{font-size:15px;font-weight:600;color:#1a1018}
    .color-swatch{
      display:inline-block;width:18px;height:18px;border-radius:50%;
      border:2px solid #ede8eb;vertical-align:middle;margin-right:6px;
    }
    .status-row{
      display:flex;align-items:center;gap:8px;
      background:#faf8f7;border-radius:12px;padding:12px 16px;
      margin-bottom:24px;
    }
    .status-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
    .status-text{font-size:13px;font-weight:600}
    .notes-box{
      background:#fdf8f6;border:1px solid #ede8eb;border-radius:12px;
      padding:14px 16px;margin-bottom:24px;
      font-size:13px;color:#6b5b66;line-height:1.6;
    }
    .actions{display:flex;flex-direction:column;gap:10px}
    .btn{
      width:100%;padding:13px 16px;border:none;border-radius:12px;
      font-size:14px;font-weight:600;cursor:pointer;
      transition:opacity .15s,transform .1s;
    }
    .btn:active{transform:scale(.98)}
    .btn-accept  {background:#3b1f35;color:#fff}
    .btn-accept:hover{opacity:.88}
    .btn-changes {background:#f3e8f0;color:#3b1f35}
    .btn-changes:hover{opacity:.8}
    .btn-decline {background:transparent;color:#dc2626;border:1.5px solid #fecaca}
    .btn-decline:hover{background:#fee2e2}
    textarea{
      width:100%;padding:12px 14px;border:1.5px solid #ede8eb;
      border-radius:10px;font-size:13px;font-family:inherit;
      resize:vertical;outline:none;
    }
    textarea:focus{border-color:#3b1f35}
    .status-note{
      text-align:center;font-size:13px;color:#9c8a96;
      background:#faf8f7;border-radius:12px;padding:16px;
    }
    #confirm-msg{
      display:none;text-align:center;padding:20px;
      font-size:15px;font-weight:600;color:#16a34a;
      background:#f0fdf4;border-radius:12px;margin-top:16px;
    }
    .price-big{font-size:24px;font-weight:800;color:#3b1f35}
    footer{
      text-align:center;margin-top:28px;font-size:11px;color:#c4b8bf;
      letter-spacing:.04em;
    }
  </style>
</head>
<body>
<div class="card">
  <p class="brand">✦ AnitaSet</p>
  <h1>Hey ${escapeHtml(proposal.clientName)} 👋</h1>
  <p class="subtitle">Your nail tech sent you this AnitaSet design proposal.</p>

  <div class="detail-grid">
    <div class="detail">
      <div class="detail-label">Design</div>
      <div class="detail-value">${escapeHtml(design ? design.name : "—")}</div>
    </div>
    <div class="detail">
      <div class="detail-label">Shape</div>
      <div class="detail-value">${escapeHtml(design ? design.shape : "—")}</div>
    </div>
    <div class="detail">
      <div class="detail-label">Effect</div>
      <div class="detail-value">${escapeHtml(design ? design.effect : "—")}</div>
    </div>
    <div class="detail">
      <div class="detail-label">Base Color</div>
      <div class="detail-value">
        ${design ? `<span class="color-swatch" style="background:${escapeHtml(design.baseColorHex)}"></span>${escapeHtml(design.baseColorHex)}` : "—"}
      </div>
    </div>
  </div>

  <div class="detail-grid" style="grid-template-columns:1fr">
    <div class="detail">
      <div class="detail-label">Total Price</div>
      <div class="price-big">$${proposal.price.toFixed(2)}</div>
    </div>
  </div>

  ${proposal.notes ? `<div class="notes-box">${escapeHtml(proposal.notes)}</div>` : ""}

  <div class="status-row">
    <div class="status-dot" style="background:${statusColor}"></div>
    <span class="status-text" style="color:${statusColor}">${proposal.status}</span>
  </div>

  ${actionButtons}
  <div id="confirm-msg"></div>
</div>
<footer>Powered by AnitaSet</footer>

<script>
  var PROPOSAL_ID = "${proposal.id}";

  function sendAction(action, message) {
    fetch("/proposal/" + PROPOSAL_ID + "/action", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action, message }),
    })
    .then(r => r.json())
    .then(data => {
      var msgs = {
        accept:  "✓ Proposal accepted! Your nail tech has been notified.",
        changes: "✎ Change request sent! Your nail tech will be in touch.",
        decline: "✕ You've declined this proposal.",
      };
      document.querySelector(".actions") && (document.querySelector(".actions").style.display = "none");
      document.getElementById("changes-box") && (document.getElementById("changes-box").style.display = "none");
      var el = document.getElementById("confirm-msg");
      el.textContent = msgs[action] || "Response recorded.";
      el.style.display = "block";
      el.style.color = action === "accept" ? "#16a34a" : action === "decline" ? "#dc2626" : "#d97706";
      el.style.background = action === "accept" ? "#f0fdf4" : action === "decline" ? "#fee2e2" : "#fef9c3";
    })
    .catch(() => alert("Something went wrong. Please try again."));
  }

  function showChanges() {
    var box = document.getElementById("changes-box");
    box.style.display = box.style.display === "none" ? "block" : "none";
  }

  function sendChanges() {
    var msg = document.getElementById("changes-msg").value.trim();
    sendAction("changes", msg || undefined);
  }
</script>
</body>
</html>`;

  return res.send(html);
}));

// POST /proposal/:id/action
// Client submits a response: accept | changes | decline
app.post("/proposal/:id/action", asyncRoute(async (req, res) => {
  const proposal = await store.getProposal(req.params.id);
  if (!proposal) return err(res, 404, "Proposal not found");

  const { action, message } = req.body;
  const ACTION_MAP = {
    accept: "Accepted",
    changes: "ChangesRequested",
    decline: "Declined",
  };

  if (!ACTION_MAP[action]) {
    return err(res, 400, 'action must be one of: "accept", "changes", "decline"');
  }

  if (TERMINAL_STATUSES.includes(proposal.status)) {
    return err(res, 409, `Proposal already has a final status: ${proposal.status}`);
  }

  const note = message && typeof message === "string" ? message.trim() : "";
  return res.json(await store.updateProposalStatus(proposal.id, ACTION_MAP[action], note));
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Serve React build (for sandbox / production use) ────────────────────────
const clientBuild = path.join(__dirname, "client", "build");
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  // All non-API, non-proposal routes → React index.html
  app.get(/^(?!\/api|\/proposal).*/, (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

app.use((error, _req, res, _next) => {
  console.error(`Request failed: ${error.message}`);
  res.status(500).json({ error: "internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════╗
║  ✦  AnitaSet API                                    ║
║      http://localhost:${PORT}                           ║
╠══════════════════════════════════════════════════════╣
║  GET  /api/health            health check            ║
║  GET  /api/designs           list designs            ║
║  POST /api/designs           create design           ║
║  GET  /api/proposals         list proposals          ║
║  POST /api/proposals         create proposal         ║
║  GET  /proposal/:id          client HTML page        ║
║  POST /proposal/:id/action   client response         ║
╚══════════════════════════════════════════════════════╝
`);
});

async function shutdown() {
  server.close(async () => {
    await store.close();
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
