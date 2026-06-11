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

    res = await request("GET", `/api/proposals/${ids.proposalId}`);
    assert(res.status === 200, "proposal should persist across restart with explicit test DB file");
    assert(res.body.status === "Accepted", "accepted status should persist across restart");

    res = await request("GET", `/api/proposals/${ids.proposalId}/history`);
    assert(res.status === 200, "history should persist across restart with explicit test DB file");
    assert(res.body.some((entry) => entry.newStatus === "Accepted"), "accepted history should persist across restart");

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
