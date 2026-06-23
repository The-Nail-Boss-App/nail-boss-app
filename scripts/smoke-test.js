#!/usr/bin/env node
"use strict";

const fs = require("fs");
const http = require("http");
const path = require("path");
const { spawn } = require("child_process");

const PORT = Number(process.env.SMOKE_TEST_PORT || 4100);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const TEST_DB_FILE = process.env.ANITASET_TEST_DB_FILE || path.join(".tmp", "smoke-test-db.json");
const MAX_BLUEPRINT_JSON_BYTES = 100 * 1024;

const SHAPE_ENGINE_V2_SHAPES = [
  "Square",
  "Tapered Square",
  "Russian Square",
  "Coffin",
  "Slim Coffin",
  "Almond",
  "Russian Almond",
  "Oval",
  "Round",
  "Stiletto",
  "Edge",
  "Lipstick",
  "Flare",
  "Mountain Peak",
];
const ARCHITECTURE_CONTROL_KEYS = ["taper", "apexHeight", "sidewallCurve", "freeEdgeThickness"];

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

function assertNailShopProfilePersistenceSource() {
  const nailShopSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "NailShop.jsx"), "utf8");
  const appSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "App.jsx"), "utf8");
  const proposalsSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "Proposals.jsx"), "utf8");
  const blueprintEngineSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "blueprintEngine.js"), "utf8");


  assert(blueprintEngineSource.includes("export function createBlueprintFromDesign") && blueprintEngineSource.includes("export function normalizeBlueprint") && blueprintEngineSource.includes("export function normalizeBlueprintTheme"), "Blueprint Engine helper exports should exist");
  assert(blueprintEngineSource.includes("export function getDefaultBlueprintThemes") && ["Classic", "Luxury", "Editorial", "Bridal", "Summer", "Holiday", "Goth", "Mermaid", "Cheetah", "Minimal"].every((theme) => blueprintEngineSource.includes(theme)), "default Blueprint Themes should exist");
  assert(blueprintEngineSource.includes("export function buildBlueprintPreviewSummary") && blueprintEngineSource.includes("designSnapshot") && blueprintEngineSource.includes("pricingGuidance"), "Blueprint preview summary should derive from normalized Blueprint content");
  assert(blueprintEngineSource.includes("normalizeBlueprintTheme(source.theme)") && blueprintEngineSource.includes("pricingGuidance: { suggestedPrice") && blueprintEngineSource.includes("designSnapshot: {"), "Blueprint theme normalization should not mutate designSnapshot or pricingGuidance");
  assert(blueprintEngineSource.includes("isObject(input) ? input : {}") && blueprintEngineSource.includes("DEFAULT_THEME") && blueprintEngineSource.includes("safeColor"), "malformed Blueprint and theme input should safely fall back");
  assert(nailShopSource.includes("Blueprint Engine Preview") && nailShopSource.includes('data-testid="blueprint-engine-preview-section"'), "Blueprint Engine Preview should exist in Nail Shop");
  assert(nailShopSource.includes('data-testid="blueprint-theme-selector"') && nailShopSource.includes('data-testid="blueprint-theme-preview-card"'), "Blueprint Theme selector and themed preview should exist");
  assert(nailShopSource.includes("Preview only") && nailShopSource.includes("does not publish to Gallery or Marketplace") && nailShopSource.includes("connect to Proposals") && nailShopSource.includes("connect to Design Studio"), "Blueprint Engine Preview should clearly stay local and unpublished");
  assert(nailShopSource.includes("Blueprint Library") && nailShopSource.includes('data-testid={`nail-shop-tab-${section.id}`}'), "Blueprint Library tab exists");
  assert(nailShopSource.includes("BLUEPRINT_LIBRARY_STORAGE_KEY") && nailShopSource.includes("anitaset.blueprintLibrary.v1"), "Blueprint Library should use required localStorage key");
  assert(nailShopSource.includes("loadSavedBlueprintLibrary") && nailShopSource.includes("persistBlueprintLibrary") && nailShopSource.includes("window.localStorage.setItem(BLUEPRINT_LIBRARY_STORAGE_KEY"), "Blueprint Library should load from and persist to localStorage");
  assert(nailShopSource.includes("normalizeBlueprintLibrary(JSON.parse(saved))") && nailShopSource.includes("return []"), "malformed localStorage fallback exists for Blueprint Library");
  assert(nailShopSource.includes('data-testid="blueprint-save-button"') && nailShopSource.includes('data-testid="blueprint-library-save-button"') && nailShopSource.includes("Save Blueprint"), "Save Blueprint button exists");
  assert(nailShopSource.includes("Blueprint saved to Library: ${record.title}.") && nailShopSource.includes('data-testid="blueprint-save-confirmation"'), "Save confirmation text exists near Blueprint save actions");
  assert(nailShopSource.includes("Blueprint could not be saved. Check browser storage and try again.") && nailShopSource.includes("setBlueprintLibraryMessageType('error')"), "Save error fallback exists for Blueprint Library storage failures");
  assert(nailShopSource.includes("persistBlueprintLibrary(nextLibrary);") && nailShopSource.indexOf("persistBlueprintLibrary(nextLibrary);") < nailShopSource.indexOf("setBlueprintLibrary(nextLibrary);"), "Save action still persists before showing confirmation state");
  assert(nailShopSource.includes("useEffect(() =>") && nailShopSource.includes("window.setTimeout") && nailShopSource.includes("Dismiss Blueprint save message"), "Blueprint save confirmation is temporary or dismissible");
  assert(nailShopSource.includes("onClick={() => setBlueprintLibraryMessage('')}") && nailShopSource.includes('data-testid="blueprint-save-confirmation"'), "Confirmation dismiss logic should not trigger an extra save");
  assert(nailShopSource.includes("createBlueprintLibraryRecord(sampleBlueprint") && nailShopSource.includes("theme: selectedBlueprintTheme") && nailShopSource.includes("collectionName: selectedBlueprintTheme.collectionLabel"), "saved blueprint includes content and theme");
  assert(nailShopSource.includes('data-testid="blueprint-library-grid"') && nailShopSource.includes('data-testid="blueprint-library-card"'), "library grid exists");
  assert(nailShopSource.includes('data-testid="blueprint-library-search"') && nailShopSource.includes("Search title, collection, tags"), "Blueprint Library search exists");
  assert(nailShopSource.includes('data-testid="blueprint-library-filter"') && ["All", "Private", "Portfolio", "Gallery Ready"].every((label) => nailShopSource.includes(label)), "Blueprint Library filters exist");
  assert(nailShopSource.includes('data-testid="blueprint-library-sort"') && ["Newest", "Oldest", "Recently Updated", "Title A-Z"].every((label) => nailShopSource.includes(label)), "Blueprint Library sort exists");
  assert(nailShopSource.includes('data-testid="blueprint-library-duplicate-button"') && nailShopSource.includes("duplicateBlueprintLibraryRecord"), "duplicate action exists");
  assert(nailShopSource.includes('data-testid="blueprint-library-rename-button"') && nailShopSource.includes("window.prompt('Rename Blueprint'"), "rename action exists");
  assert(nailShopSource.includes('data-testid="blueprint-library-delete-button"') && nailShopSource.includes("window.confirm('Delete this local Blueprint?"), "delete action exists with safe confirmation");
  assert(nailShopSource.includes("Blueprint Library is private and local-only for now. It does not publish to Gallery, Marketplace, or Proposals."), "Blueprint Library preview-only guardrail copy exists");

  assert(nailShopSource.includes("export default function NailShop()"), "Nail Shop renders through the NailShop component");
  assert(nailShopSource.includes("data-testid=\"nail-shop-save\"") && nailShopSource.includes("Save Shop"), "Save Shop button should exist");
  assert(nailShopSource.includes("NAIL_SHOP_PROFILE_STORAGE_KEY") && nailShopSource.includes("window.localStorage.setItem"), "Nail Shop profile should save to localStorage");
  assert(nailShopSource.includes("window.localStorage.getItem") && nailShopSource.includes("useState(loadSavedProfile)"), "Nail Shop should load saved profile from localStorage");
  assert(nailShopSource.includes("JSON.parse(saved)") && nailShopSource.includes("catch (error)") && nailShopSource.includes("return DEFAULT_PROFILE"), "malformed localStorage should safely fall back to defaults");
  assert(nailShopSource.includes("Reset to Default") && nailShopSource.includes("persistProfile(DEFAULT_PROFILE)"), "reset should restore defaults and update localStorage");
  assert(nailShopSource.includes("Shop saved."), "saving should show a saved confirmation message");
  assert(nailShopSource.includes("Service Menu") && nailShopSource.includes("data-testid=\"service-menu-manager\""), "Service Menu section should exist");
  assert(nailShopSource.includes("NAIL_SHOP_SERVICES_STORAGE_KEY") && nailShopSource.includes("nailBoss.nailShop.services.v1"), "services should use the required localStorage key");
  assert(nailShopSource.includes("Classic Full Set") && nailShopSource.includes("Fill-In") && nailShopSource.includes("Custom Press-On Set"), "default starter services should exist");
  assert(nailShopSource.includes("loadSavedServices") && nailShopSource.includes("persistServices") && nailShopSource.includes("window.localStorage.setItem(NAIL_SHOP_SERVICES_STORAGE_KEY"), "services should load from and persist to localStorage");
  assert(nailShopSource.includes("normalizeServices(JSON.parse(saved))") && nailShopSource.includes("return DEFAULT_SERVICES"), "malformed services localStorage should safely fall back to defaults");
  assert(nailShopSource.includes("data-testid=\"service-save-button\"") && nailShopSource.includes("Save Service"), "add service controls should exist");
  assert(nailShopSource.includes("data-testid=\"service-edit-button\"") && nailShopSource.includes("Edit Service"), "edit service controls should exist");
  assert(nailShopSource.includes("data-testid=\"service-delete-button\"") && nailShopSource.includes("Delete Service") && nailShopSource.includes("window.confirm"), "delete service controls should exist with confirmation");
  assert(nailShopSource.includes("data-testid=\"service-toggle-button\"") && nailShopSource.includes("data-testid=\"service-status-badge\""), "active/inactive toggle and badge should exist");
  assert(nailShopSource.includes("normalizePrice") && nailShopSource.includes("Number.isFinite"), "starting price should be numeric-safe");
  assert(nailShopSource.includes("Pricing Library") && nailShopSource.includes("data-testid=\"pricing-library-manager\""), "Pricing Library section should exist");
  assert(nailShopSource.includes("NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY") && nailShopSource.includes("nailBoss.nailShop.pricingLibrary.v1"), "pricing library should use the required localStorage key");
  assert(nailShopSource.includes("Length Pricing") && nailShopSource.includes("Finish Pricing") && nailShopSource.includes("Nail Art Pricing") && nailShopSource.includes("Embellishment Pricing") && nailShopSource.includes("Time Add-Ons"), "default pricing categories should exist");
  assert(nailShopSource.includes("Medium") && nailShopSource.includes("French Tip") && nailShopSource.includes("Character Art") && nailShopSource.includes("Luxury Charm") && nailShopSource.includes("Charm Placement"), "default modifier rows should exist");
  assert(nailShopSource.includes("data-testid=\"pricing-add-modifier-button\"") && nailShopSource.includes("Add Modifier"), "add modifier controls should exist");
  assert(nailShopSource.includes("data-testid=\"pricing-delete-modifier-button\"") && nailShopSource.includes("Delete Modifier"), "delete modifier controls should exist");
  assert(nailShopSource.includes("data-testid=\"pricing-library-save-button\"") && nailShopSource.includes("Save Pricing Library"), "Save Pricing Library button should exist");
  assert(nailShopSource.includes("loadSavedPricingLibrary") && nailShopSource.includes("persistPricingLibrary") && nailShopSource.includes("window.localStorage.setItem(NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY"), "pricing library should persist to localStorage");
  assert(nailShopSource.includes("normalizePricingLibrary(JSON.parse(saved))") && nailShopSource.includes("catch (error)") && nailShopSource.includes("return normalizePricingLibrary()"), "malformed pricing library localStorage should safely fall back to defaults");
  assert(nailShopSource.includes("Suggested Deposit Percent") && nailShopSource.includes("clampPercent") && nailShopSource.includes("data-testid=\"pricing-deposit-percent-input\""), "deposit percent should be present and clamped");
  assert(nailShopSource.includes("Cost Engine Sandbox™") && nailShopSource.includes("data-testid=\"cost-engine-sandbox\""), "Cost Engine Sandbox section should exist");
  assert(nailShopSource.includes("data-testid=\"cost-engine-service-select\"") && nailShopSource.includes("normalizedServices.map"), "Cost Engine service selector should load Service Menu data");
  assert(nailShopSource.includes("normalizedPricingLibrary") && nailShopSource.includes("findModifierAmount") && nailShopSource.includes("calculateCostEngine"), "Cost Engine should load Pricing Library data and calculate from modifiers");
  assert(nailShopSource.includes("suggestedPrice") && nailShopSource.includes("suggestedDeposit") && nailShopSource.includes("estimatedTime"), "Cost Engine should calculate suggested price, deposit, and estimated time");
  assert(nailShopSource.includes("data-testid=\"cost-engine-breakdown\"") && nailShopSource.includes("Price Breakdown"), "Cost Engine breakdown should render");
  assert(nailShopSource.includes("data-testid=\"cost-engine-reset-button\"") && nailShopSource.includes("Reset Calculation") && nailShopSource.includes("setCostEngineForm(EMPTY_COST_ENGINE_FORM)"), "Cost Engine reset button should reset calculation inputs");
  assert(nailShopSource.includes("Missing modifier") === false && nailShopSource.includes("return 0;"), "missing Cost Engine modifiers should safely resolve to zero");
  assert(nailShopSource.includes("Policies & Booking Rules") && nailShopSource.includes("data-testid=\"policies-booking-rules-manager\""), "Policies & Booking Rules Manager section should exist");
  assert(nailShopSource.includes("NAIL_SHOP_POLICIES_STORAGE_KEY") && nailShopSource.includes("nailBoss.nailShop.policies.v1"), "policies should use the required localStorage key");
  assert(nailShopSource.includes("Deposit Rules") && nailShopSource.includes("Cancellation Policy") && nailShopSource.includes("Appointment Rules") && nailShopSource.includes("Press-On Rules") && nailShopSource.includes("Business Hours") && nailShopSource.includes("Booking Requirements"), "all policies sections should exist");
  assert(nailShopSource.includes("loadSavedPolicies") && nailShopSource.includes("persistPolicies") && nailShopSource.includes("window.localStorage.setItem(NAIL_SHOP_POLICIES_STORAGE_KEY"), "policies should load from and persist to localStorage");
  assert(nailShopSource.includes("normalizePolicies(JSON.parse(saved))") && nailShopSource.includes("return normalizePolicies(DEFAULT_POLICIES)"), "malformed policies localStorage should safely fall back to defaults");
  assert(nailShopSource.includes("data-testid=\"policies-save-button\"") && nailShopSource.includes("Save Policies"), "Save Policies button should exist");
  assert(nailShopSource.includes("data-testid=\"policies-reset-button\"") && nailShopSource.includes("Reset to Defaults"), "Reset to Defaults button should exist");
  assert(nailShopSource.includes("normalizePolicyNumber") && nailShopSource.includes("depositPercent: clampPercent"), "policy numeric inputs should be safe and deposit percent clamped");
  assert(nailShopSource.includes("Proposal Readiness™") && nailShopSource.includes(`data-testid="proposal-readiness-section"`), "Proposal Readiness section should exist");
  assert(nailShopSource.includes(`data-testid="proposal-readiness-checklist"`) && nailShopSource.includes(`data-testid="proposal-readiness-card"`), "readiness checklist should exist");
  assert(nailShopSource.includes(`data-testid="proposal-readiness-overall-status"`) && nailShopSource.includes("Proposal Ready") && nailShopSource.includes("Needs Setup"), "overall readiness status should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-summary-preview"`) && nailShopSource.includes("Proposal Draft Summary"), "draft summary preview should exist");
  assert(nailShopSource.includes(`data-testid="proposal-copy-summary-button"`) && nailShopSource.includes("Copy Summary"), "copy summary button should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-section"`) && nailShopSource.includes("Proposal Draft Generator"), "Proposal Draft tab section should exist");
  assert(nailShopSource.includes("{ id: 'proposalDraft', label: 'Proposal Draft' }"), "Proposal Draft tab should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-generate-button"`) && nailShopSource.includes("Generate Draft"), "Generate Draft button should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-copy-button"`) && nailShopSource.includes("Copy Draft Text"), "Copy Draft Text button should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-reset-button"`) && nailShopSource.includes("Reset Draft"), "Reset Draft button should exist");
  assert(nailShopSource.includes(`data-testid="proposal-draft-full-set-hero-preview"`) && nailShopSource.includes("Full Set Hero Preview"), "Full Set Hero Preview should appear in Proposal Draft section");
  assert(nailShopSource.includes("getProposalDraftData") && nailShopSource.includes("formatProposalDraftText"), "proposal draft should derive local preview text from Nail Shop data");
  assert(nailShopSource.includes("Shop name:") && nailShopSource.includes("Selected service:"), "draft should include shop name and selected service");
  assert(nailShopSource.includes("Suggested price:") && nailShopSource.includes("Suggested deposit:") && nailShopSource.includes("Estimated time:"), "draft should include suggested price, deposit, and time");
  assert(nailShopSource.includes("Client not set") && nailShopSource.includes("Service not selected") && nailShopSource.includes("Pricing unavailable") && nailShopSource.includes("Policy not set"), "proposal draft missing-data fallbacks should exist");
  assert(nailShopSource.includes("setGeneratedProposalDraft(liveProposalDraftData)") && nailShopSource.includes("Nothing was sent or saved"), "Generate Draft should only create local preview state");
  assert(nailShopSource.includes("navigator.clipboard?.writeText") && nailShopSource.includes("Clipboard unavailable"), "copy summary and draft text should fail safely when clipboard API is unavailable");
  assert(nailShopSource.includes("buildProposalReadiness") && nailShopSource.includes("buildProposalDraftSummary"), "proposal readiness helpers should derive from Nail Shop data only");
  assert(proposalsSource.includes("buildProposalV2Snapshots") && proposalsSource.includes("proposalVersion: 2"), "proposal creation should build v2 snapshot payloads");
  assert(proposalsSource.includes(`data-testid="proposal-create-snapshot-preview"`) && proposalsSource.includes("Internal preview"), "proposal create form should show an internal text-only snapshot preview");
  assert(proposalsSource.includes("NAIL_SHOP_PROFILE_STORAGE_KEY") && proposalsSource.includes("NAIL_SHOP_SERVICES_STORAGE_KEY") && proposalsSource.includes("NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY") && proposalsSource.includes("NAIL_SHOP_POLICIES_STORAGE_KEY"), "proposal v2 snapshots should derive from available Nail Shop local data");
  assert(proposalsSource.includes("Client not set") && proposalsSource.includes("Service not selected") && proposalsSource.includes("Pricing unavailable") && proposalsSource.includes("Policy not set"), "proposal create missing-data fallbacks should exist");
  assert(appSource.includes("setPage(PAGES.STUDIO)"), "login should still land on Design Studio");
  const fullSetRendererSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "FullSetRenderer.jsx"), "utf8");
  const fullSetRendererHelperSource = fs.readFileSync(path.join(__dirname, "..", "client", "src", "fullSetRenderer.js"), "utf8");
  assert(fullSetRendererSource.includes("FullSetRenderer") && fullSetRendererHelperSource.includes("normalizeFullSetDesign"), "FullSetRenderer engine and helpers should exist");
  assert(fullSetRendererSource.includes("data-testid={`full-set-renderer-${renderMode}`}") && fullSetRendererHelperSource.includes("FULL_SET_RENDER_MODES = ['left', 'right', 'full', 'hero']"), "left, right, full, and hero render modes should be supported");
  assert(fullSetRendererHelperSource.includes("normalizeFullSetNail") && fullSetRendererHelperSource.includes("normalizeLayers") && fullSetRendererHelperSource.includes("DEFAULT_COLORS"), "missing full set data should safely fall back to placeholder nails");
  assert(fullSetRendererHelperSource.includes("HAND_SLOTS = ['thumb', 'index', 'middle', 'ring', 'pinky']"), "full set fallback should define Thumb, Index, Middle, Ring, and Pinky slots");
  assert(["Thumb", "Index", "Middle", "Ring", "Pinky"].every((label) => fullSetRendererHelperSource.includes(label)), "full set renderer should preserve visible finger labels for both hands");
  assert(fullSetRendererSource.includes("nails: [...normalized.left, ...normalized.right]"), "Hero View should render all 10 normalized nails without slicing thumbs or pinkies");
  assert(!fullSetRendererSource.includes("slice(0, 7)") && !fullSetRendererSource.includes(".slice(1)"), "Hero 7 exact regression should stay removed");
  assert(fullSetRendererSource.includes("flexWrap: 'nowrap'") && fullSetRendererSource.includes("overflow: 'visible'"), "Hero View should use a horizontal showcase layout without clipping the full set");
  assert(fullSetRendererHelperSource.includes("flatNails.slice(0, HAND_SLOTS.length)") && fullSetRendererHelperSource.includes("flatNails.slice(HAND_SLOTS.length, HAND_SLOTS.length * 2)"), "flat full-set data should normalize into 5 left nails and 5 right nails");
  assert(fullSetRendererSource.includes("NailThumbnail") && fullSetRendererSource.includes("./design-studio/NailThumbnail"), "FullSetRenderer should reuse the existing thumbnail renderer");
  assert(nailShopSource.includes("Full Set Renderer Preview") && nailShopSource.includes("full-set-renderer-preview-section"), "Nail Shop should include a visual-only Full Set Renderer Preview section");
  assert(!nailShopSource.includes("Full Set Composition"), "Full Set Composition should stay absent from Nail Shop");
}

function layeredBlueprint() {
  const layerTypes = ["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel", "frenchTip"];
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
          : type === "frenchTip"
            ? { style: "classic", preset: "medium", colorHex: "#ABCDEF", tipHeight: 0.32, smileCurve: 0.32, smileDepth: 0.24, smileWidth: 0.82, rotation: 0 }
            : { colorHex: "#ABCDEF", effectColorHex: "#FFFFFF", label: `${type} payload` },
      })),
    }],
    metadata: { tags: ["layered", "smoke"] },
  };
}


function multiNailBlueprint(count, activeIndex = 2) {
  const shapes = ["Almond", "Coffin", "Square", "Stiletto", "Oval"];
  return {
    schemaVersion: 1,
    canvas: { mode: "full-set", activeNailId: `multi-nail-${activeIndex + 1}` },
    nails: Array.from({ length: count }, (_value, index) => {
      const hex = `#${String(index + 1).repeat(6).slice(0, 6)}`;
      return {
        id: `multi-nail-${index + 1}`,
        slot: `slot-${index + 1}`,
        shape: shapes[index % shapes.length],
        length: Number((0.25 + index * 0.04).toFixed(2)),
        width: Number((0.3 + index * 0.03).toFixed(2)),
        baseColorHex: hex,
        metadata: { originalIndex: index, label: `Nail ${index + 1}` },
        layers: [
          {
            id: "base-layer",
            type: "base",
            name: "Base Color",
            visible: true,
            locked: true,
            opacity: 1,
            order: 0,
            transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
            data: { colorHex: hex, effect: index === activeIndex ? "CatEye" : "Solid", effectColorHex: "#FFFFFF" },
          },
          {
            id: `inactive-art-${index + 1}`,
            type: "decal",
            name: `Decal ${index + 1}`,
            visible: true,
            locked: false,
            opacity: 0.85,
            order: 1,
            transform: { x: 0.5, y: 0.5, scaleX: 0.08, scaleY: 0.08, rotation: index * 7 },
            data: { assetId: "sparkle", colorHex: "#ABCDEF", label: `payload-${index + 1}` },
          },
        ],
      };
    }),
    metadata: { tags: ["multi-nail", `${count}-nails`] },
  };
}


function shapeEngineBlueprint(shape = "Almond", controls = {}) {
  const blueprint = layeredBlueprint();
  blueprint.nails[0] = {
    ...blueprint.nails[0],
    shape,
    ...controls,
  };
  return blueprint;
}

function fullSetArchitectureBlueprint() {
  const blueprint = multiNailBlueprint(10, 4);
  blueprint.nails = blueprint.nails.map((nail, index) => ({
    ...nail,
    shape: SHAPE_ENGINE_V2_SHAPES[index % SHAPE_ENGINE_V2_SHAPES.length],
    taper: Number((0.1 + index * 0.07).toFixed(2)),
    apexHeight: Number((0.9 - index * 0.06).toFixed(2)),
    sidewallCurve: Number((0.2 + index * 0.05).toFixed(2)),
    freeEdgeThickness: Number((0.8 - index * 0.04).toFixed(2)),
  }));
  return blueprint;
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

function designPayload(name = "Atomic Layered Smoke") {
  return {
    name,
    shape: "Almond",
    length: 0.5,
    width: 0.5,
    baseColorHex: "#E8A0BF",
    effect: "Solid",
    effectColorHex: "#FFFFFF",
    tags: ["smoke"],
  };
}

function oversizedBlueprint() {
  const blueprint = layeredBlueprint();
  blueprint.metadata.notes = "x".repeat(MAX_BLUEPRINT_JSON_BYTES + 1);
  return blueprint;
}

function frenchTipValidationBlueprint(data) {
  const blueprint = layeredBlueprint();
  blueprint.nails[0].layers = blueprint.nails[0].layers.filter((layer) => layer.type !== "frenchTip");
  blueprint.nails[0].layers.push({
    id: "french-validation",
    type: "frenchTip",
    name: "French validation",
    visible: true,
    locked: false,
    opacity: 1,
    order: 99,
    transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
    data,
  });
  return blueprint;
}

async function designCount() {
  const res = await request("GET", "/api/designs");
  assert(res.status === 200, "GET /api/designs should return 200 for count checks");
  return res.body.length;
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

  let beforeCount = await designCount();
  const atomicBlueprint = layeredBlueprint();
  res = await request("POST", "/api/designs/with-blueprint", { design: designPayload("Atomic Layered Design"), blueprint: atomicBlueprint });
  assert(res.status === 201, "POST /api/designs/with-blueprint should return 201 for a valid layered design");
  assert(res.body.design && res.body.design.id, "atomic create should return the created design");
  assert(res.body.blueprint && res.body.blueprint.document.nails[0].layers.length === atomicBlueprint.nails[0].layers.length, "atomic create should return the full saved blueprint");
  const atomicDesignId = res.body.design.id;
  assert(await designCount() === beforeCount + 1, "atomic create success should add exactly one design");

  res = await request("GET", `/api/designs/${atomicDesignId}/blueprint`);
  assert(res.status === 200, "atomic-created blueprint should be readable");
  assert(res.body.document.nails[0].layers.some((layer) => layer.type === "jewel"), "atomic-created blueprint should persist layered artwork, not a default blueprint");

  res = await request("POST", "/api/proposals", {
    designId: atomicDesignId,
    clientName: "Atomic Proposal Client",
    price: 70,
    notes: "Proposal compatibility after atomic create",
  });
  assert(res.status === 201, "proposal creation should remain compatible after atomic create");

  const renamedBlueprint = layeredBlueprint();
  renamedBlueprint.nails[0].shape = "Coffin";
  renamedBlueprint.nails[0].baseColorHex = "#334455";
  renamedBlueprint.nails[0].layers[0].data = { colorHex: "#334455", effect: "Chrome", effectColorHex: "#FFFFFF" };
  renamedBlueprint.metadata.tags = ["renamed", "atomic update"];
  res = await request("PUT", `/api/designs/${atomicDesignId}/with-blueprint`, { design: designPayload("Renamed Atomic Design"), blueprint: renamedBlueprint });
  assert(res.status === 200, "PUT /api/designs/:id/with-blueprint should return 200 for existing design updates");
  assert(res.body.design.name === "Renamed Atomic Design", "atomic existing updates should preserve the submitted design name");
  assert(res.body.design.shape === "Coffin", "atomic existing updates should sync flat shape from the blueprint");
  assert(res.body.blueprint.document.nails[0].shape === "Coffin", "atomic existing updates should return the saved blueprint");

  res = await request("GET", `/api/designs/${atomicDesignId}`);
  assert(res.status === 200, "renamed atomic design should remain readable");
  assert(res.body.name === "Renamed Atomic Design", "existing design rename should survive reload through /api/designs/:id");

  res = await request("GET", "/api/designs");
  assert(res.status === 200, "GET /api/designs should return 200 after atomic rename");
  assert(res.body.some((design) => design.id === atomicDesignId && design.name === "Renamed Atomic Design"), "renamed design should display correctly in saved-design selectors");

  res = await request("GET", "/api/proposals");
  assert(res.status === 200, "GET /api/proposals should return 200 after atomic rename");
  assert(res.body.some((proposal) => proposal.designId === atomicDesignId && proposal.design && proposal.design.name === "Renamed Atomic Design"), "renamed design should display correctly in proposal selectors");

  const beforeFailedUpdateDesign = res.body.find((proposal) => proposal.designId === atomicDesignId).design;
  const failingUpdateBlueprint = layeredBlueprint();
  failingUpdateBlueprint.metadata.simulatePersistenceFailure = "smoke-test";
  res = await request("PUT", `/api/designs/${atomicDesignId}/with-blueprint`, { design: designPayload("Failed Rename Should Roll Back"), blueprint: failingUpdateBlueprint });
  assert(res.status === 500, "simulated existing design persistence failure should return 500");
  res = await request("GET", `/api/designs/${atomicDesignId}`);
  assert(res.status === 200, "design should remain readable after failed atomic update");
  assert(res.body.name === beforeFailedUpdateDesign.name, "failed atomic update should roll back the design rename");
  assert(res.body.shape === beforeFailedUpdateDesign.shape, "failed atomic update should roll back flat field changes");
  res = await request("GET", `/api/designs/${atomicDesignId}/blueprint`);
  assert(res.status === 200, "blueprint should remain readable after failed atomic update");
  assert(res.body.document.nails[0].shape === "Coffin", "failed atomic update should leave the previous blueprint intact");

  beforeCount = await designCount();
  res = await request("POST", "/api/designs/with-blueprint", { design: designPayload("Invalid Atomic Design"), blueprint: { ...layeredBlueprint(), nails: [] } });
  assert(res.status === 400, "invalid atomic blueprints should return 400");
  assert(await designCount() === beforeCount, "invalid atomic blueprints should not create orphan design rows");

  beforeCount = await designCount();
  res = await request("POST", "/api/designs/with-blueprint", { design: designPayload("Oversized Atomic Design"), blueprint: oversizedBlueprint() });
  assert(res.status === 400 || res.status === 413, "oversized atomic blueprints should return 400 or 413");
  assert(await designCount() === beforeCount, "oversized atomic blueprints should not create orphan design rows");

  beforeCount = await designCount();
  const failingBlueprint = layeredBlueprint();
  failingBlueprint.metadata.simulatePersistenceFailure = "smoke-test";
  res = await request("POST", "/api/designs/with-blueprint", { design: designPayload("Rollback Atomic Design"), blueprint: failingBlueprint });
  assert(res.status === 500, "simulated atomic blueprint persistence failure should return 500");
  assert(await designCount() === beforeCount, "simulated atomic blueprint persistence failure should roll back the flat design row");


  for (const shape of SHAPE_ENGINE_V2_SHAPES) {
    const createBlueprint = shapeEngineBlueprint(shape, { taper: 0.21, apexHeight: 0.37, sidewallCurve: 0.63, freeEdgeThickness: 0.79 });
    res = await request("POST", "/api/designs/with-blueprint", { design: designPayload(`Shape V2 ${shape}`), blueprint: createBlueprint });
    assert(res.status === 201, `POST /api/designs/with-blueprint should save Shape Engine V2 shape ${shape}`);
    assert(res.body.design.shape === shape, `atomic create should sync flat shape for ${shape}`);
    const shapeDesignId = res.body.design.id;

    res = await request("GET", `/api/designs/${shapeDesignId}/blueprint`);
    assert(res.status === 200, `GET /api/designs/:id/blueprint should reload ${shape}`);
    assert(res.body.document.nails[0].shape === shape, `reloaded blueprint should preserve ${shape}`);
    for (const key of ARCHITECTURE_CONTROL_KEYS) {
      assert(res.body.document.nails[0][key] === createBlueprint.nails[0][key], `reloaded ${shape} blueprint should preserve ${key}`);
    }
  }

  res = await request("POST", "/api/designs", { ...designPayload("Flat Shape V2 Design"), shape: "Russian Almond" });
  assert(res.status === 201, "legacy flat design create should accept Shape Engine V2 shapes");
  assert(res.body.shape === "Russian Almond", "legacy flat design should preserve the Shape Engine V2 shape");

  res = await request("POST", "/api/designs/with-blueprint", { design: designPayload("Invalid Shape Design"), blueprint: shapeEngineBlueprint("Banana") });
  assert(res.status === 400, "invalid Shape Engine V2 blueprint shape names should be rejected");

  for (const key of ARCHITECTURE_CONTROL_KEYS) {
    const controls = { [key]: 0.88 };
    res = await request("PUT", `/api/designs/${designId}/blueprint`, shapeEngineBlueprint("Tapered Square", controls));
    assert(res.status === 200, `PUT /api/designs/:id/blueprint should save non-default ${key}`);
    assert(res.body.document.nails[0][key] === 0.88, `PUT response should preserve non-default ${key}`);

    res = await request("GET", `/api/designs/${designId}/blueprint`);
    assert(res.status === 200, `GET /api/designs/:id/blueprint should reload after ${key} save`);
    assert(res.body.document.nails[0][key] === 0.88, `GET reload should preserve non-default ${key}`);
  }

  for (const key of ARCHITECTURE_CONTROL_KEYS) {
    res = await request("PUT", `/api/designs/${designId}/blueprint`, shapeEngineBlueprint("Almond", { [key]: "0.5" }));
    assert(res.status === 400, `malformed non-numeric ${key} should be rejected`);
  }

  const legacyNoControlsBlueprint = shapeEngineBlueprint("Round");
  for (const key of ARCHITECTURE_CONTROL_KEYS) delete legacyNoControlsBlueprint.nails[0][key];
  res = await request("PUT", `/api/designs/${designId}/blueprint`, legacyNoControlsBlueprint);
  assert(res.status === 200, "legacy blueprints without architecture controls should save with defaults");
  for (const key of ARCHITECTURE_CONTROL_KEYS) {
    assert(res.body.document.nails[0][key] === 0.5, `legacy blueprints should default missing ${key} safely`);
  }

  const fullSetArchitecture = fullSetArchitectureBlueprint();
  res = await request("PUT", `/api/designs/${designId}/blueprint`, fullSetArchitecture);
  assert(res.status === 200, "full-set blueprints should preserve per-nail architecture controls");
  assert(JSON.stringify(res.body.document.nails.map((nail) => ARCHITECTURE_CONTROL_KEYS.map((key) => nail[key]))) === JSON.stringify(fullSetArchitecture.nails.map((nail) => ARCHITECTURE_CONTROL_KEYS.map((key) => nail[key]))), "full-set architecture controls should round-trip exactly on save");
  const duplicatedNail = { ...res.body.document.nails[0], id: "duplicated-architecture-nail", slot: "duplicate" };
  const mirroredNail = { ...res.body.document.nails[1], id: "mirrored-architecture-nail", slot: "mirror" };
  const copyPasteBlueprint = {
    ...res.body.document,
    canvas: { ...res.body.document.canvas, activeNailId: duplicatedNail.id },
    nails: [duplicatedNail, mirroredNail],
  };
  res = await request("PUT", `/api/designs/${designId}/blueprint`, copyPasteBlueprint);
  assert(res.status === 200, "copy/paste/duplicate/mirror style blueprints should preserve valid architecture controls");
  for (const nail of res.body.document.nails) {
    for (const key of ARCHITECTURE_CONTROL_KEYS) assert(typeof nail[key] === "number", `duplicated/mirrored ${key} should remain numeric`);
  }

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
  assert(res.body.document.nails[0].layers.length === 8, "layered blueprint should round-trip all layer examples");
  assert(res.body.document.nails[0].layers.some((layer) => layer.type === "jewel"), "layered blueprint should include jewel layer");

  const validFrenchTipData = { style: "angled", preset: "deep", colorHex: "#ABCDEF", tipHeight: 0.42, smileCurve: 0, smileDepth: 0, smileWidth: 0.82, rotation: -30 };
  res = await request("PUT", `/api/designs/${designId}/blueprint`, frenchTipValidationBlueprint(validFrenchTipData));
  assert(res.status === 200, "valid French Tip layer data should save successfully");
  const savedFrenchTip = res.body.document.nails[0].layers.find((layer) => layer.type === "frenchTip");
  assert(savedFrenchTip.data.smileCurve === 0 && savedFrenchTip.data.smileDepth === 0 && savedFrenchTip.data.rotation === -30, "French Tip validation should preserve valid zero sliders and rotations");

  for (const [label, patch] of [
    ["invalid style", { style: "sideways" }],
    ["invalid preset", { preset: "banana" }],
    ["invalid numeric range", { tipHeight: 999 }],
    ["invalid rotation type", { rotation: "bad" }],
    ["invalid color", { colorHex: "not-a-color" }],
  ]) {
    res = await request("PUT", `/api/designs/${designId}/blueprint`, frenchTipValidationBlueprint({ ...validFrenchTipData, ...patch }));
    assert(res.status === 400, `${label} French Tip data should be rejected`);
  }

  res = await request("GET", `/api/designs/${designId}`);
  assert(res.status === 200, "GET /api/designs/:id should return 200 after blueprint update");
  assert(res.body.shape === "Oval", "legacy shape should sync from active nail");
  assert(res.body.baseColorHex === "#112233", "legacy baseColorHex should sync from active base layer");
  assert(res.body.effect === "Gradient", "legacy effect should sync from active base layer");
  assert(res.body.effectColorHex === "#ABCDEF", "legacy effectColorHex should sync from active base layer");
  assert(res.body.tags.includes("layered"), "legacy tags should sync from blueprint metadata");


  for (const count of [5, 10]) {
    const multi = multiNailBlueprint(count);
    res = await request("PUT", `/api/designs/${designId}/blueprint`, multi);
    assert(res.status === 200, `${count}-nail blueprint should save successfully`);
    assert(res.body.document.nails.length === count, `${count}-nail blueprint should preserve all nails on save`);
    assert(res.body.document.canvas.activeNailId === "multi-nail-3", `${count}-nail blueprint should keep activeNailId valid`);
    assert(res.body.document.nails.map((nail) => nail.id).join(",") === multi.nails.map((nail) => nail.id).join(","), `${count}-nail blueprint should preserve nail ordering`);
    assert(res.body.document.nails[count - 1].layers[1].id === `inactive-art-${count}`, `${count}-nail blueprint should preserve inactive nail layer ids`);
    assert(res.body.document.nails[count - 1].layers[1].transform.rotation === (count - 1) * 7, `${count}-nail blueprint should preserve inactive transforms`);
    assert(res.body.document.nails[count - 1].metadata.originalIndex === count - 1, `${count}-nail blueprint should preserve nail metadata`);

    const noOpRoundTrip = res.body.document;
    res = await request("PUT", `/api/designs/${designId}/blueprint`, noOpRoundTrip);
    assert(res.status === 200, `${count}-nail no-op blueprint save should succeed`);
    assert(JSON.stringify(res.body.document.nails) === JSON.stringify(noOpRoundTrip.nails), `${count}-nail no-op save should not modify or delete inactive nails`);

    const activeOnlyEdit = JSON.parse(JSON.stringify(noOpRoundTrip));
    activeOnlyEdit.nails[2].shape = "Oval";
    activeOnlyEdit.nails[2].baseColorHex = "#AABBCC";
    activeOnlyEdit.nails[2].layers[0].data.colorHex = "#AABBCC";
    res = await request("PUT", `/api/designs/${designId}/blueprint`, activeOnlyEdit);
    assert(res.status === 200, `${count}-nail active-only edit should save successfully`);
    assert(res.body.document.nails.length === count, `${count}-nail active-only edit should keep all nails`);
    assert(res.body.document.nails[2].baseColorHex === "#AABBCC", `${count}-nail active-only edit should update the active nail`);
    assert(JSON.stringify(res.body.document.nails[count - 1]) === JSON.stringify(noOpRoundTrip.nails[count - 1]), `${count}-nail active-only edit should preserve inactive nail data exactly`);

    res = await request("GET", `/api/designs/${designId}`);
    assert(res.status === 200, `${count}-nail active-only edit should keep design readable`);
    assert(res.body.baseColorHex === "#AABBCC", `${count}-nail flat base color should sync from active nail only`);
  }

  res = await request("PUT", `/api/designs/${designId}/blueprint`, { ...blueprint, nails: [] });
  assert(res.status === 400, "invalid blueprints should return safe 400 responses");
  assert(res.body.error && !res.body.error.includes("SELECT"), "invalid blueprint error should not expose SQL internals");

  res = await request("PUT", `/api/designs/${designId}/blueprint`, blueprint);
  assert(res.status === 200, "single-nail layered blueprint should be restorable after multi-nail preservation checks");

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
  assert(res.body.clientName === "<script>alert(1)</script>" && res.body.price === 75 && res.body.status === "Sent" && res.body.notes === "Smoke proposal", "v1 proposal compatibility fields should remain readable");

  const v2Payload = {
    designId,
    clientName: "Snapshot Client",
    price: 125,
    notes: "Snapshot proposal",
    proposalVersion: 2,
    clientSnapshot: { name: " Snapshot Client ", email: "client@example.com" },
    shopSnapshot: { shopName: "Nail Boss Studio", bookingLink: "https://example.test/book" },
    serviceSnapshot: { serviceName: "Gel Full Set", startingPrice: "110", serviceType: "full-set" },
    priceSnapshot: { suggestedPrice: "125", suggestedDeposit: 25, depositPercent: "20", breakdown: [{ label: "Base", amount: 110 }] },
    policySnapshot: { depositPolicy: "20% deposit", appointmentRules: { lateWindowMinutes: 10 } },
    visualSnapshot: { mode: "hero", designName: "Smoke Hero", createdFromRenderer: true },
    draftSnapshot: { title: "Your custom set", draftText: "Draft only" },
  };
  res = await request("POST", "/api/proposals", v2Payload);
  assert(res.status === 201, "POST /api/proposals should accept v2 snapshot fields");
  assert(res.body.proposalVersion === 2, "v2 proposal should return proposalVersion 2");
  assert(res.body.clientSnapshot.name === "Snapshot Client" && res.body.clientSnapshot.contact === "", "v2 client snapshot should normalize missing nested fields safely");
  assert(res.body.shopSnapshot.phone === "" && res.body.shopSnapshot.bookingLink === "https://example.test/book", "v2 shop snapshot should include safe fallback fields");
  assert(res.body.serviceSnapshot.startingPrice === 110 && res.body.priceSnapshot.breakdown.length === 1, "v2 numeric and array snapshots should normalize safely");
  assert(res.body.visualSnapshot.createdFromRenderer === true && res.body.visualSnapshot.fullSetData === null, "v2 visual snapshot should allow renderer placeholder data");
  assert(Number.isFinite(res.body.createdAt) && Number.isFinite(res.body.updatedAt), "v2 proposals should include createdAt and updatedAt timestamps");
  const v2ProposalId = res.body.id;

  res = await request("GET", `/api/proposals/${v2ProposalId}`);
  assert(res.status === 200, "GET /api/proposals/:id should return 200 for v2 proposals");
  assert(res.body.proposalVersion === 2 && res.body.draftSnapshot.notes === "", "GET /api/proposals/:id should return normalized v2 snapshots");

  res = await request("PATCH", `/api/proposals/${v2ProposalId}/status`, { status: "ChangesRequested" });
  assert(res.status === 200 && res.body.status === "ChangesRequested", "PATCH /api/proposals/:id/status should still update proposal status");
  assert(res.body.updatedAt >= res.body.createdAt, "status updates should preserve safe proposal timestamps");


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
  assertNailShopProfilePersistenceSource();

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
    assert(res.body.document.nails[0].layers.length === 8, "layered blueprint should survive restart");

    res = await request("GET", `/api/proposals/${ids.proposalId}`);
    assert(res.status === 200, "proposal should persist across restart with explicit test DB file");
    assert(res.body.status === "Accepted", "accepted status should persist across restart");

    res = await request("GET", `/api/proposals/${ids.proposalId}/history`);
    assert(res.status === 200, "history should persist across restart with explicit test DB file");
    assert(res.body.some((entry) => entry.newStatus === "Accepted"), "accepted history should persist across restart");

    const savedBlueprint = await request("GET", `/api/designs/${ids.designId}/blueprint`);
    const creamDefault = JSON.parse(JSON.stringify(savedBlueprint.body.document));
    creamDefault.nails[0].layers[0].data.effect = "Solid";
    delete creamDefault.nails[0].layers[0].data.polishType;
    delete creamDefault.nails[0].layers[0].data.shine;
    res = await request("PUT", `/api/designs/${ids.designId}/blueprint`, creamDefault);
    assert(res.status === 200, "old base polish data should save with safe Cream defaults");
    assert(res.body.document.nails[0].layers[0].data.polishType === "Cream", "old base polish data should default to Cream");

    for (const effect of ["Gradient", "Chrome", "CatEye", "Marble"]) {
      const legacyEffectBlueprint = JSON.parse(JSON.stringify(savedBlueprint.body.document));
      legacyEffectBlueprint.nails[0].layers[0].data.effect = effect;
      legacyEffectBlueprint.nails[0].layers[0].data.effectColorHex = "#FEDCBA";
      delete legacyEffectBlueprint.nails[0].layers[0].data.polishType;
      res = await request("PUT", `/api/designs/${ids.designId}/blueprint`, legacyEffectBlueprint);
      assert(res.status === 200, `legacy ${effect} base polish data should save without forcing Cream`);
      assert(!Object.prototype.hasOwnProperty.call(res.body.document.nails[0].layers[0].data, "polishType"), `legacy ${effect} should preserve absent polishType`);
      assert(res.body.document.nails[0].layers[0].data.effectColorHex === "#FEDCBA", `legacy ${effect} should preserve effectColorHex`);

      res = await request("POST", "/api/designs", { ...designPayload(`Flat Legacy ${effect}`), effect, effectColorHex: "#ABCDEF" });
      assert(res.status === 201, `flat legacy ${effect} design should be created`);
      const flatLegacyId = res.body.id;
      res = await request("GET", `/api/designs/${flatLegacyId}/blueprint`);
      assert(res.status === 200, `flat legacy ${effect} default blueprint should be readable`);
      assert(!Object.prototype.hasOwnProperty.call(res.body.document.nails[0].layers[0].data, "polishType"), `flat legacy ${effect} default blueprint should not become explicit Cream`);
      assert(res.body.document.nails[0].layers[0].data.effect === effect, `flat legacy ${effect} default blueprint should preserve effect`);
    }

    const invalidPolishType = JSON.parse(JSON.stringify(savedBlueprint.body.document));
    invalidPolishType.nails[0].layers[0].data.polishType = "Gelato";
    res = await request("PUT", `/api/designs/${ids.designId}/blueprint`, invalidPolishType);
    assert(res.status === 400, "invalid polishType should be rejected");

    const invalidPolishValue = JSON.parse(JSON.stringify(savedBlueprint.body.document));
    invalidPolishValue.nails[0].layers[0].data.chromeIntensity = 4;
    res = await request("PUT", `/api/designs/${ids.designId}/blueprint`, invalidPolishValue);
    assert(res.status === 400, "malformed polish control values should be rejected");

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
