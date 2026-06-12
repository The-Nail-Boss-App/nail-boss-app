#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.SMOKE_TEST_PORT || 4100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_DB_FILE = process.env.ANITASET_TEST_DB_FILE || path.join(".tmp", "smoke-test-db.json");

function request(method, requestPath, body) {
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE_URL}${requestPath}`,
      {
        method,
        headers: payload
          ? {
              "Content-Type": "application/json",
              "Content-Length": Buffer.byteLength(payload),
            }
          : undefined,
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          const contentType = res.headers["content-type"] || "";
          let parsed = data;
          if (contentType.includes("application/json") && data) {
            try {
              parsed = JSON.parse(data);
            } catch (error) {
              return reject(new Error(`Invalid JSON from ${method} ${requestPath}: ${error.message}`));
            }
          }
          resolve({ status: res.statusCode, headers: res.headers, body: parsed, rawBody: data });
        });
      },
    );

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function waitForServer(timeoutMs = 10000) {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const res = await request("GET", "/api/health");
      if (res.status === 200 && res.body.status === "ok") return res.body;
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Server did not become healthy: ${lastError ? lastError.message : "timeout"}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function layeredBlueprint() {
  const layerTypes = ["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel"];
  return {
    schemaVersion: 1,
    canvas: { mode: "single-nail", activeNailId: "nail-1" },
    nails: [{
      id: "nail-1",
      slot: "accent",
      shape: "Oval",
      length: 0.72,
      width: 0.44,
      baseColorHex: "#112233",
      layers: layerTypes.map((type, index) => ({
        id: `${type}-layer`,
        type,
        name: `${type} example`,
        visible: true,
        locked: type === "base",
        opacity: index === 0 ? 1 : 0.8,
        order: index,
        transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: index * 5 },
        data: type === "base"
          ? { colorHex: "#112233", effect: "Gradient", effectColorHex: "#ABCDEF" }
          : { colorHex: "#ABCDEF", effectColorHex: "#FFFFFF", label: `${type} payload` },
      })),
    }],
    metadata: { tags: ["layered", "smoke"] },
  };
}


function whitespaceLayerBlueprint() {
  const blueprint = layeredBlueprint();
  blueprint.nails[0].layers = blueprint.nails[0].layers.slice(0, 2).map((layer, index) => ({
    ...layer,
    id: index === 0 ? " base-layer " : " accent-layer ",
    type: index === 0 ? "base" : "decal",
    name: index === 0 ? "Padded Base" : "Padded Accent",
    order: index,
    data: index === 0
      ? { colorHex: "#112233", effect: "Gradient", effectColorHex: "#ABCDEF" }
      : { colorHex: "#ABCDEF", effectColorHex: "#FFFFFF", label: "accent payload" },
  }));
  return blueprint;
}

function whitespaceMultiNailBlueprint() {
  return {
    schemaVersion: 1,
    canvas: { mode: "full-set", activeNailId: " active-nail " },
    nails: [
      {
        id: " passive-nail ",
        slot: "index",
        shape: "Square",
        length: 0.31,
        width: 0.52,
        baseColorHex: "#101010",
        layers: [{
          id: "passive-base",
          type: "base",
          name: "Passive Base",
          visible: true,
          locked: true,
          opacity: 1,
          order: 0,
          transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
          data: { colorHex: "#101010", effect: "Chrome", effectColorHex: "#202020" },
        }],
      },
      {
        id: " active-nail ",
        slot: "accent",
        shape: "Coffin",
        length: 0.81,
        width: 0.37,
        baseColorHex: "#445566",
        layers: [{
          id: "active-base",
          type: "base",
          name: "Active Base",
          visible: true,
          locked: true,
          opacity: 1,
          order: 0,
          transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
          data: { colorHex: "#445566", effect: "CatEye", effectColorHex: "#FEDCBA" },
        }],
      },
    ],
    metadata: { tags: [" Active Tag ", "sync"] },
  };
}

function artOnlyBlueprint(type) {
  return {
    schemaVersion: 1,
    canvas: { mode: "single-nail", activeNailId: "art-only" },
    nails: [{
      id: "art-only",
      slot: "accent",
      shape: "Stiletto",
      length: 0.63,
      width: 0.42,
      baseColorHex: "#A1B2C3",
      layers: [{
        id: `${type}-only`,
        type,
        name: `${type} without base`,
        visible: true,
        locked: false,
        opacity: 0.7,
        order: 0,
        transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
        data: { colorHex: "#000000", effect: "Chrome", effectColorHex: "#111111", label: "non-base art" },
      }],
    }],
    metadata: { tags: ["art-only", type] },
  };
}

function taggedBlueprint(tags) {
  const blueprint = layeredBlueprint();
  blueprint.metadata.tags = tags;
  return blueprint;
}

function startServer() {
  const server = spawn(process.execPath, ["server.js"], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: "test",
      ANITASET_TEST_DB_FILE: TEST_DB_FILE,
      DATABASE_URL: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  server.stdout.on("data", (chunk) => { stdout += chunk; });
  server.stderr.on("data", (chunk) => { stderr += chunk; });

  return { server, getOutput: () => ({ stdout, stderr }) };
}

function stopServer(server) {
  return new Promise((resolve) => {
    if (server.killed || server.exitCode !== null) return resolve();
    server.once("exit", () => resolve());
    server.kill("SIGTERM");
    setTimeout(() => {
      if (server.exitCode === null) server.kill("SIGKILL");
    }, 3000);
  });
}

async function runFlow() {
  let res = await request("GET", "/api/health");
  assert(res.status === 200, "GET /api/health should return 200");
  assert(res.body.status === "ok", "GET /api/health should report ok");
  assert(res.body.database === "connected", "GET /api/health should report database connected");
  assert(typeof res.body.counts.designs === "number", "GET /api/health should include design count");
  assert(typeof res.body.counts.proposals === "number", "GET /api/health should include proposal count");

  res = await request("POST", "/api/designs", {
    name: "Smoke Test Design",
    shape: "Almond",
    length: 0.5,
    width: 0.5,
    baseColorHex: "#E8A0BF",
    effect: "Solid",
    effectColorHex: "#FFFFFF",
    tags: ["smoke"],
  });
  assert(res.status === 201, "POST /api/designs should return 201");
  assert(res.body.id, "POST /api/designs should return an id");
  const designId = res.body.id;

  res = await request("GET", `/api/designs/${designId}`);
  assert(res.status === 200, "GET /api/designs/:id should return 200");
  assert(res.body.name === "Smoke Test Design", "GET /api/designs/:id should return the created design");
  assert(res.body.updatedAt >= res.body.createdAt, "created design should include updatedAt");

  res = await request("GET", `/api/designs/${designId}/blueprint`);
  assert(res.status === 200, "GET /api/designs/:id/blueprint should return 200");
  assert(res.body.document.schemaVersion === 1, "default blueprint should use schema version 1");
  assert(res.body.document.nails[0].layers[0].type === "base", "default blueprint should include a base layer");

  const whitespaceBlueprint = whitespaceMultiNailBlueprint();
  res = await request("PUT", `/api/designs/${designId}/blueprint`, whitespaceBlueprint);
  assert(res.status === 200, "blueprints should accept nail ids and activeNailId with surrounding whitespace");
  assert(res.body.document.canvas.activeNailId === "active-nail", "activeNailId should be trimmed before persistence");
  assert(res.body.document.nails[0].id === "passive-nail", "nail ids should be trimmed before persistence");
  assert(res.body.document.nails[1].id === "active-nail", "active nail id should be trimmed before persistence");

  res = await request("GET", `/api/designs/${designId}`);
  assert(res.status === 200, "GET /api/designs/:id should return 200 after whitespace blueprint update");
  assert(res.body.shape === "Coffin", "legacy shape should sync from normalized active nail in multi-nail blueprints");
  assert(res.body.baseColorHex === "#445566", "legacy baseColorHex should sync from normalized active nail base layer");
  assert(res.body.effect === "CatEye", "legacy effect should sync from normalized active nail base layer");
  assert(res.body.effectColorHex === "#FEDCBA", "legacy effectColorHex should sync from normalized active nail base layer");
  assert(res.body.tags.includes("active tag"), "legacy tags should sync from normalized multi-nail blueprint metadata");

  const duplicateTrimmedBlueprint = {
    ...whitespaceBlueprint,
    canvas: { ...whitespaceBlueprint.canvas, activeNailId: "nail-dup" },
    nails: whitespaceBlueprint.nails.map((nail, index) => ({
      ...nail,
      id: index === 0 ? "nail-dup" : " nail-dup ",
    })),
  };
  res = await request("PUT", `/api/designs/${designId}/blueprint`, duplicateTrimmedBlueprint);
  assert(res.status === 400, "duplicate nail ids after trimming should be rejected");

  const whitespaceLayersBlueprint = whitespaceLayerBlueprint();
  res = await request("PUT", `/api/designs/${designId}/blueprint`, whitespaceLayersBlueprint);
  assert(res.status === 200, "blueprints should accept unique layer ids with surrounding whitespace");
  assert(res.body.document.nails[0].layers[0].id === "base-layer", "layer ids should be trimmed before persistence");
  assert(res.body.document.nails[0].layers[1].id === "accent-layer", "unique padded layer ids should persist in normalized form");
  assert(new Set(res.body.document.nails[0].layers.map((layer) => layer.id)).size === res.body.document.nails[0].layers.length, "persisted layer ids should stay unique within a nail");

  res = await request("GET", `/api/designs/${designId}/blueprint`);
  assert(res.status === 200, "GET /api/designs/:id/blueprint should return 200 after layer whitespace update");
  assert(res.body.document.nails[0].layers[0].id === "base-layer", "normalized layer ids should survive round-trip persistence");
  assert(res.body.document.nails[0].layers[1].id === "accent-layer", "normalized unique layer ids should round-trip after persistence");

  const duplicateTrimmedLayerBlueprint = whitespaceLayerBlueprint();
  duplicateTrimmedLayerBlueprint.nails[0].layers[0].id = "base";
  duplicateTrimmedLayerBlueprint.nails[0].layers[1].id = " base ";
  res = await request("PUT", `/api/designs/${designId}/blueprint`, duplicateTrimmedLayerBlueprint);
  assert(res.status === 400, "duplicate layer ids after trimming should be rejected");

  const emptyTrimmedLayerBlueprint = whitespaceLayerBlueprint();
  emptyTrimmedLayerBlueprint.nails[0].layers[0].id = "   ";
  res = await request("PUT", `/api/designs/${designId}/blueprint`, emptyTrimmedLayerBlueprint);
  assert(res.status === 400, "empty layer ids after trimming should be rejected");

  for (const type of ["charm", "drawing", "decal", "jewel"]) {
    res = await request("PUT", `/api/designs/${designId}/blueprint`, artOnlyBlueprint(type));
    assert(res.status === 200, `${type}-only blueprints without a base layer should save successfully`);

    res = await request("GET", `/api/designs/${designId}`);
    assert(res.status === 200, `GET /api/designs/:id should return 200 after ${type}-only blueprint update`);
    assert(res.body.shape === "Stiletto", `${type}-only blueprints should sync shape from the active nail`);
    assert(res.body.length === 0.63, `${type}-only blueprints should sync length from the active nail`);
    assert(res.body.width === 0.42, `${type}-only blueprints should sync width from the active nail`);
    assert(res.body.baseColorHex === "#A1B2C3", `${type}-only blueprints should preserve activeNail.baseColorHex as the legacy base color`);
    assert(res.body.effect === "Solid", `${type}-only blueprints should keep a safe default legacy effect`);
    assert(res.body.effectColorHex === "#FFFFFF", `${type}-only blueprints should keep a safe default legacy effect color`);
  }

  res = await request("POST", "/api/proposals", {
    designId,
    clientName: "Art Only Client",
    price: 65,
    notes: "Art-only base color smoke proposal",
  });
  assert(res.status === 201, "POST /api/proposals should return 201 for art-only designs");
  const artOnlyProposalId = res.body.id;

  res = await request("GET", `/api/proposals/${artOnlyProposalId}`);
  assert(res.status === 200, "GET /api/proposals/:id should return 200 for art-only proposals");
  assert(res.body.design.baseColorHex === "#A1B2C3", "proposal APIs should use activeNail.baseColorHex when no base layer exists");

  res = await request("GET", `/proposal/${artOnlyProposalId}`);
  assert(res.status === 200, "GET /proposal/:id should return 200 for art-only proposals");
  assert(res.rawBody.includes("#A1B2C3"), "proposal HTML should render the intended active nail base color without a base layer");
  assert(!res.rawBody.includes("#000000"), "proposal HTML should not render non-base art layer colors as the base color");

  const exactlyFiftyTags = Array.from({ length: 50 }, (_value, index) => ` Tag-${index + 1} `);
  res = await request("PUT", `/api/designs/${designId}/blueprint`, taggedBlueprint(exactlyFiftyTags));
  assert(res.status === 200, "blueprints with exactly 50 normalized tags should save successfully");
  assert(res.body.document.metadata.tags.length === 50, "exactly 50 tags should remain after normalization");
  assert(res.body.document.metadata.tags[0] === "tag-1", "successful tag saves should trim and lowercase tags");

  res = await request("GET", `/api/designs/${designId}/blueprint`);
  assert(res.status === 200, "GET /api/designs/:id/blueprint should return 200 after exactly 50 tags save");
  assert(res.body.document.metadata.tags.length === 50, "exactly 50 normalized tags should round-trip through persistence");

  const tooManyNormalizedTags = ["   ", ...Array.from({ length: 51 }, (_value, index) => `tag-${index + 1}`)];
  res = await request("PUT", `/api/designs/${designId}/blueprint`, taggedBlueprint(tooManyNormalizedTags));
  assert(res.status === 400, "blueprints with more than 50 normalized tags should return a safe 400 response");
  assert(res.body.error && res.body.error.includes("no more than 50 tags"), "oversized tag list errors should be safe and descriptive");

  const whitespaceTagsBlueprint = taggedBlueprint(["  Glossy  ", "   ", "NEON", "", " chrome "]);
  res = await request("PUT", `/api/designs/${designId}/blueprint`, whitespaceTagsBlueprint);
  assert(res.status === 200, "tag arrays with whitespace-only values should normalize safely");
  assert(JSON.stringify(res.body.document.metadata.tags) === JSON.stringify(["glossy", "neon", "chrome"]), "tags should trim, lowercase, and filter empty values");

  res = await request("GET", `/api/designs/${designId}/blueprint`);
  assert(res.status === 200, "GET /api/designs/:id/blueprint should return 200 after normalized tag save");
  assert(JSON.stringify(res.body.document.metadata.tags) === JSON.stringify(["glossy", "neon", "chrome"]), "normalized tags should persist on successful round-trip saves");

  const blueprint = layeredBlueprint();
  res = await request("PUT", `/api/designs/${designId}/blueprint`, blueprint);
  assert(res.status === 200, "PUT /api/designs/:id/blueprint should return 200");
  assert(res.body.document.nails[0].layers.length === 7, "layered blueprint should round-trip all layer examples");
  assert(res.body.document.nails[0].layers.some((layer) => layer.type === "jewel"), "layered blueprint should include jewel layer");

  res = await request("GET", `/api/designs/${designId}`);
  assert(res.status === 200, "GET /api/designs/:id should return 200 after blueprint update");
  assert(res.body.shape === "Oval", "legacy shape should sync from active nail");
  assert(res.body.baseColorHex === "#112233", "legacy baseColorHex should sync from active base layer");
  assert(res.body.effect === "Gradient", "legacy effect should sync from active base layer");
  assert(res.body.effectColorHex === "#ABCDEF", "legacy effectColorHex should sync from active base layer");
  assert(res.body.tags.includes("layered"), "legacy tags should sync from blueprint metadata");

  res = await request("PUT", `/api/designs/${designId}/blueprint`, { ...blueprint, nails: [] });
  assert(res.status === 400, "invalid blueprints should return safe 400 responses");
  assert(res.body.error && !res.body.error.includes("SELECT"), "invalid blueprint error should not expose SQL internals");

  res = await request("POST", "/api/proposals", {
    designId,
    clientName: "<script>alert(1)</script>",
    price: 75,
    notes: "Smoke proposal",
  });
  assert(res.status === 201, "POST /api/proposals should return 201");
  assert(res.body.id, "POST /api/proposals should return an id");
  const proposalId = res.body.id;

  res = await request("GET", `/api/proposals/${proposalId}`);
  assert(res.status === 200, "GET /api/proposals/:id should return 200");
  assert(res.body.design && res.body.design.id === designId, "GET /api/proposals/:id should embed the design");

  res = await request("GET", `/proposal/${proposalId}`);
  assert(res.status === 200, "GET /proposal/:id should return 200");
  assert(res.rawBody.includes("AnitaSet Proposal"), "GET /proposal/:id should return AnitaSet HTML");
  assert(!res.rawBody.includes("<script>alert(1)</script>"), "GET /proposal/:id should escape client names");
  assert(res.rawBody.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "GET /proposal/:id should include escaped client name");

  res = await request("POST", `/proposal/${proposalId}/action`, { action: "accept" });
  assert(res.status === 200, "POST /proposal/:id/action should return 200");
  assert(res.body.status === "Accepted", "POST /proposal/:id/action should accept the proposal");

  res = await request("POST", `/proposal/${proposalId}/action`, { action: "decline" });
  assert(res.status === 409, "repeated terminal proposal actions should return 409");
  assert(res.body.error.includes("final status"), "terminal overwrite response should explain final status conflict");

  res = await request("GET", `/api/proposals/${proposalId}`);
  assert(res.status === 200, "GET /api/proposals/:id should still return 200 after terminal conflict");
  assert(res.body.status === "Accepted", "terminal conflict should not overwrite the accepted status");

  res = await request("GET", `/api/proposals/${proposalId}/history`);
  assert(res.status === 200, "GET /api/proposals/:id/history should return 200");
  assert(Array.isArray(res.body), "GET /api/proposals/:id/history should return an array");
  assert(res.body.some((entry) => entry.newStatus === "Sent"), "history should include Sent");
  assert(res.body.some((entry) => entry.newStatus === "Viewed"), "history should include Viewed");
  assert(res.body.some((entry) => entry.newStatus === "Accepted"), "history should include Accepted");

  return { designId, proposalId };
}

async function main() {
  if (fs.existsSync(TEST_DB_FILE)) fs.unlinkSync(TEST_DB_FILE);

  let serverHandle = startServer();

  try {
    await waitForServer();
    const ids = await runFlow();
    await stopServer(serverHandle.server);

    serverHandle = startServer();
    await waitForServer();

    let res = await request("GET", `/api/designs/${ids.designId}`);
    assert(res.status === 200, "design should persist across restart with explicit test DB file");
    assert(res.body.shape === "Oval", "synced legacy fields should persist across restart");

    res = await request("GET", `/api/designs/${ids.designId}/blueprint`);
    assert(res.status === 200, "blueprint should persist across restart with explicit test DB file");
    assert(res.body.document.nails[0].layers.length === 7, "layered blueprint should survive restart");

    res = await request("GET", `/api/proposals/${ids.proposalId}`);
    assert(res.status === 200, "proposal should persist across restart with explicit test DB file");
    assert(res.body.status === "Accepted", "accepted status should persist across restart");

    res = await request("GET", `/api/proposals/${ids.proposalId}/history`);
    assert(res.status === 200, "history should persist across restart with explicit test DB file");
    assert(res.body.some((entry) => entry.newStatus === "Accepted"), "accepted history should persist across restart");

    res = await request("DELETE", `/api/designs/${ids.designId}`);
    assert(res.status === 204, "DELETE /api/designs/:id should delete the design");

    res = await request("GET", `/api/designs/${ids.designId}/blueprint`);
    assert(res.status === 404, "deleted design blueprint should return 404");

    res = await request("GET", `/api/proposals/${ids.proposalId}`);
    assert(res.status === 404, "deleting a design should remove related proposals safely");

    console.log("Smoke test passed");
  } catch (error) {
    const output = serverHandle.getOutput();
    console.error("Smoke test failed:", error.message);
    if (output.stdout) console.error("\nServer stdout:\n", output.stdout);
    if (output.stderr) console.error("\nServer stderr:\n", output.stderr);
    process.exitCode = 1;
  } finally {
    await stopServer(serverHandle.server);
  }
}

main();
