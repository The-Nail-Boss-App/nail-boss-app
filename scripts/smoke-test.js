#!/usr/bin/env node
"use strict";

const http = require("http");
const { spawn } = require("child_process");

const PORT = Number(process.env.SMOKE_TEST_PORT || 4100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

function request(method, path, body) {
  const payload = body ? JSON.stringify(body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      `${BASE_URL}${path}`,
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
              return reject(new Error(`Invalid JSON from ${method} ${path}: ${error.message}`));
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
      if (res.status === 200 && res.body.status === "ok") return;
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

async function main() {
  const server = spawn(process.execPath, ["server.js"], {
    env: { ...process.env, PORT: String(PORT), NODE_ENV: "test" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  server.stdout.on("data", (chunk) => { stdout += chunk; });
  server.stderr.on("data", (chunk) => { stderr += chunk; });

  const shutdown = () => {
    if (!server.killed) server.kill("SIGTERM");
  };

  try {
    await waitForServer();

    let res = await request("GET", "/api/designs");
    assert(res.status === 200, "GET /api/designs should return 200");
    assert(Array.isArray(res.body), "GET /api/designs should return an array");

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

    res = await request("GET", "/api/proposals");
    assert(res.status === 200, "GET /api/proposals should return 200");
    assert(Array.isArray(res.body), "GET /api/proposals should return an array");

    res = await request("POST", "/api/proposals", {
      designId,
      clientName: "<script>alert(1)</script>",
      price: 75,
      notes: "Smoke proposal",
    });
    assert(res.status === 201, "POST /api/proposals should return 201");
    assert(res.body.id, "POST /api/proposals should return an id");
    const proposalId = res.body.id;

    res = await request("GET", `/proposal/${proposalId}`);
    assert(res.status === 200, "GET /proposal/:id should return 200");
    assert(res.rawBody.includes("AnitaSet Proposal"), "GET /proposal/:id should return AnitaSet HTML");
    assert(!res.rawBody.includes("<script>alert(1)</script>"), "GET /proposal/:id should escape client names");
    assert(res.rawBody.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "GET /proposal/:id should include escaped client name");

    res = await request("POST", `/proposal/${proposalId}/action`, { action: "accept" });
    assert(res.status === 200, "POST /proposal/:id/action should return 200");
    assert(res.body.status === "Accepted", "POST /proposal/:id/action should accept the proposal");

    console.log("Smoke test passed");
  } catch (error) {
    console.error("Smoke test failed:", error.message);
    if (stdout) console.error("\nServer stdout:\n", stdout);
    if (stderr) console.error("\nServer stderr:\n", stderr);
    process.exitCode = 1;
  } finally {
    shutdown();
  }
}

main();
