"use strict";

const fs = require("fs");
const path = require("path");
const { URL } = require("url");
const { v4: uuidv4 } = require("uuid");

const LOCAL_DB_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const VALID_STATUSES = ["Sent", "Viewed", "Accepted", "ChangesRequested", "Declined"];
const TERMINAL_STATUSES = ["Accepted", "ChangesRequested", "Declined"];
const VALID_SHAPES = [
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
const VALID_EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];
const VALID_POLISH_TYPES = ["Cream", "Jelly", "Milky", "Matte"];
const VALID_TOP_COATS = ["Gloss", "Matte", "No-Wipe Shine", "Velvet"];
const MEANINGFUL_LEGACY_EFFECTS = ["Gradient", "Chrome", "CatEye", "Marble"];
const POLISH_NUMBER_RANGES = { shine: [0, 1], transparency: [0, 1], sparkleDensity: [0, 1], sparkleSize: [0, 1], catEyeAngle: [-180, 180], catEyeIntensity: [0, 1], chromeIntensity: [0, 1] };
const SUPPORTED_BLUEPRINT_SCHEMA_VERSIONS = [1];
const SUPPORTED_LAYER_TYPES = ["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel", "frenchTip"];
const FRENCH_TIP_STYLES = ["classic", "deep", "angled", "v", "reverse"];
const GRADIENT_DIRECTIONS = ["vertical", "reverse-vertical", "horizontal", "diagonal", "reverse-diagonal", "aura"];
const GRADIENT_RANGES = { blendPosition: [0.08, 0.92], softness: [0, 1], angle: [0, 360] };
const GRADIENT_COLOR_LIMITS = { min: 2, max: 7 };
const PATTERNS = ["dots", "stripes", "checker", "french-tip", "glitter", "marble", "camo", "houndstooth", "leopard", "cheetah", "zebra", "cow-print", "snake-print", "tiger-stripe"];
const FRENCH_TIP_STYLE_ALIASES = { "v-french": "v" };
const FRENCH_TIP_PRESETS = ["soft", "medium", "deep"];
const FRENCH_TIP_RANGES = {
  tipHeight: [0.08, 0.72],
  smileCurve: [0, 1],
  smileDepth: [0, 0.65],
  smileWidth: [0.25, 1],
  opacity: [0, 1],
  rotation: [-45, 45],
};
const NAIL_ARCHITECTURE_CONTROL_DEFAULT = 0.5;
const NAIL_ARCHITECTURE_CONTROL_RANGES = {
  taper: [0, 1],
  apexHeight: [0, 1],
  sidewallCurve: [0, 1],
  freeEdgeThickness: [0, 1],
};
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

function assertRangedNumber(value, [min, max], pathLabel) {
  if (!isFiniteNumber(value) || value < min || value > max) {
    throw new BlueprintValidationError(`${pathLabel} must be a number between ${min} and ${max}`);
  }
  return Number(value);
}

function clampNumber(value, [min, max], fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cleanHex(value, fallback) {
  if (typeof value === "string" && HEX_RE.test(value)) {
    if (value.length === 4) return `#${value[1]}${value[1]}${value[2]}${value[2]}${value[3]}${value[3]}`.toUpperCase();
    return value.toUpperCase();
  }
  return fallback;
}

function normalizeNailArchitectureControls(nail, pathPrefix) {
  const controls = {};
  for (const [key, range] of Object.entries(NAIL_ARCHITECTURE_CONTROL_RANGES)) {
    controls[key] = Object.prototype.hasOwnProperty.call(nail, key)
      ? assertRangedNumber(nail[key], range, `${pathPrefix}.${key}`)
      : NAIL_ARCHITECTURE_CONTROL_DEFAULT;
  }
  return controls;
}

function normalizePolishFields(data, pathPrefix) {
  const next = { ...data };
  const hasValidPolishType = VALID_POLISH_TYPES.includes(next.polishType);
  const hasMeaningfulLegacyEffect = MEANINGFUL_LEGACY_EFFECTS.includes(next.effect);
  if (Object.prototype.hasOwnProperty.call(next, "polishType") && !hasValidPolishType) {
    if (next.polishType == null && hasMeaningfulLegacyEffect) delete next.polishType;
    else throw new BlueprintValidationError(`${pathPrefix}.data.polishType must be one of: ${VALID_POLISH_TYPES.join(", ")}`);
  }
  if (!hasValidPolishType && !hasMeaningfulLegacyEffect) next.polishType = "Cream";
  const polishTypeForDefaults = next.polishType || "Cream";
  if (Object.prototype.hasOwnProperty.call(next, "topCoat") && !VALID_TOP_COATS.includes(next.topCoat)) {
    throw new BlueprintValidationError(`${pathPrefix}.data.topCoat must be one of: ${VALID_TOP_COATS.join(", ")}`);
  }
  next.topCoat = next.topCoat || (polishTypeForDefaults === "Matte" ? "Matte" : "Gloss");
  const defaults = { shine: polishTypeForDefaults === "Matte" ? 0.08 : 0.62, transparency: polishTypeForDefaults === "Jelly" ? 0.45 : polishTypeForDefaults === "Milky" ? 0.28 : 0, sparkleDensity: 0.35, sparkleSize: 0.45, catEyeAngle: 28, catEyeIntensity: 0.65, chromeIntensity: 0.7 };
  for (const [key, range] of Object.entries(POLISH_NUMBER_RANGES)) {
    next[key] = Object.prototype.hasOwnProperty.call(next, key) ? assertRangedNumber(next[key], range, `${pathPrefix}.data.${key}`) : defaults[key];
  }
  return next;
}

function normalizeGradientStops(data, colorA, colorB) {
  const rawStops = Array.isArray(data.gradientStops) && data.gradientStops.length
    ? data.gradientStops
    : [{ color: colorA, position: 0 }, { color: colorB, position: 100 }];
  const cleaned = rawStops.slice(0, GRADIENT_COLOR_LIMITS.max).map((stop, index) => ({
    color: cleanHex(stop && (stop.color || stop.colorHex), index === 0 ? colorA : colorB),
    position: clampNumber(stop && stop.position, [0, 100], (index / Math.max(1, rawStops.length - 1)) * 100),
  })).sort((a, b) => a.position - b.position);
  while (cleaned.length < GRADIENT_COLOR_LIMITS.min) {
    cleaned.push({ color: cleaned.length === 0 ? colorA : colorB, position: cleaned.length === 0 ? 0 : 100 });
  }
  cleaned[0] = { ...cleaned[0], color: colorA, position: 0 };
  cleaned[cleaned.length - 1] = { ...cleaned[cleaned.length - 1], color: colorB, position: 100 };
  return cleaned.map((stop) => ({ color: stop.color, position: Math.round(stop.position) }));
}

function normalizeGradientData(data, pathPrefix) {
  const direction = data.direction || "vertical";
  if (!GRADIENT_DIRECTIONS.includes(direction)) {
    throw new BlueprintValidationError(`${pathPrefix}.data.direction must be one of: ${GRADIENT_DIRECTIONS.join(", ")}`);
  }
  assertHex(data.colorA || "#FFFFFF", `${pathPrefix}.data.colorA`);
  assertHex(data.colorB || "#E8A0BF", `${pathPrefix}.data.colorB`);
  const colorA = cleanHex(data.colorA || "#FFFFFF", "#FFFFFF");
  const colorB = cleanHex(data.colorB || "#E8A0BF", "#E8A0BF");
  return {
    ...data,
    colorA,
    colorB,
    direction,
    blendPosition: clampNumber(data.blendPosition, GRADIENT_RANGES.blendPosition, 0.5),
    softness: clampNumber(data.softness, GRADIENT_RANGES.softness, 0.62),
    angle: clampNumber(data.angle, GRADIENT_RANGES.angle, 90),
    gradientStops: normalizeGradientStops(data, colorA, colorB),
  };
}

function normalizeFrenchTipData(data, pathPrefix) {
  const style = FRENCH_TIP_STYLE_ALIASES[data.style] || data.style;
  if (!FRENCH_TIP_STYLES.includes(style)) {
    throw new BlueprintValidationError(`${pathPrefix}.data.style must be one of: ${FRENCH_TIP_STYLES.join(", ")}`);
  }
  if (!FRENCH_TIP_PRESETS.includes(data.preset)) {
    throw new BlueprintValidationError(`${pathPrefix}.data.preset must be one of: ${FRENCH_TIP_PRESETS.join(", ")}`);
  }
  assertHex(data.colorHex, `${pathPrefix}.data.colorHex`);
  const fillType = data.fillType === "pattern" ? "pattern" : "solid";
  const pattern = PATTERNS.includes(data.pattern) ? data.pattern : "dots";
  const patternColorHex = cleanHex(data.patternColorHex || data.colorHex, data.colorHex);
  const patternSecondaryColorHex = cleanHex(data.patternSecondaryColorHex || data.secondaryColorHex || "#3B1F35", "#3B1F35");
  if (Object.prototype.hasOwnProperty.call(data, "patternColorHex")) assertHex(data.patternColorHex, `${pathPrefix}.data.patternColorHex`);
  if (Object.prototype.hasOwnProperty.call(data, "patternSecondaryColorHex")) assertHex(data.patternSecondaryColorHex, `${pathPrefix}.data.patternSecondaryColorHex`);
  if (Object.prototype.hasOwnProperty.call(data, "opacity")) {
    assertRangedNumber(data.opacity, FRENCH_TIP_RANGES.opacity, `${pathPrefix}.data.opacity`);
  }
  return {
    ...data,
    style,
    preset: data.preset,
    colorHex: data.colorHex,
    fillType,
    pattern,
    patternColorHex,
    patternSecondaryColorHex,
    patternScale: clampNumber(data.patternScale, [0.2, 3], 1),
    tipHeight: assertRangedNumber(data.tipHeight, FRENCH_TIP_RANGES.tipHeight, `${pathPrefix}.data.tipHeight`),
    smileCurve: assertRangedNumber(data.smileCurve, FRENCH_TIP_RANGES.smileCurve, `${pathPrefix}.data.smileCurve`),
    smileDepth: assertRangedNumber(data.smileDepth, FRENCH_TIP_RANGES.smileDepth, `${pathPrefix}.data.smileDepth`),
    smileWidth: assertRangedNumber(data.smileWidth, FRENCH_TIP_RANGES.smileWidth, `${pathPrefix}.data.smileWidth`),
    rotation: assertRangedNumber(data.rotation, FRENCH_TIP_RANGES.rotation, `${pathPrefix}.data.rotation`),
  };
}

function normalizeTags(tags, pathLabel = "metadata.tags") {
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new BlueprintValidationError(`${pathLabel} must be an array of strings`);
  }
  const normalizedTags = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  if (normalizedTags.length > 50) {
    throw new BlueprintValidationError(`${pathLabel} must contain no more than 50 tags`);
  }
  return normalizedTags;
}

function getActiveNail(blueprint) {
  const activeNailId = blueprint.canvas && blueprint.canvas.activeNailId;
  return blueprint.nails.find((nail) => nail.id === activeNailId) || blueprint.nails[0];
}

function getBaseLayer(nail) {
  return nail.layers.find((layer) => layer.type === "base");
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
  const data = layer.type === "base" ? normalizePolishFields(layer.data, pathPrefix) : layer.type === "frenchTip" ? normalizeFrenchTipData(layer.data, pathPrefix) : layer.type === "gradient" ? normalizeGradientData(layer.data, pathPrefix) : { ...layer.data };

  return {
    id: normalizedLayerId,
    type: layer.type,
    name: typeof layer.name === "string" && layer.name.trim() ? layer.name.trim() : layer.type,
    visible: layer.visible,
    locked: layer.locked,
    opacity: Number(layer.opacity),
    order: layer.order,
    transform,
    data,
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
    const architectureControls = normalizeNailArchitectureControls(nail, pathPrefix);
    assertHex(nail.baseColorHex, `${pathPrefix}.baseColorHex`);
    if (!Array.isArray(nail.layers) || nail.layers.length > MAX_BLUEPRINT_LAYERS_PER_NAIL) {
      throw new BlueprintValidationError(`${pathPrefix}.layers must be an array with at most ${MAX_BLUEPRINT_LAYERS_PER_NAIL} layers`);
    }
    const seenLayerIds = new Set();
    const layers = nail.layers.map((layer, layerIndex) => normalizeLayer(layer, nailIndex, layerIndex, seenLayerIds));
    const nailMetadata = isPlainObject(nail.metadata) ? { ...nail.metadata } : undefined;
    return {
      id: normalizedNailId,
      slot: typeof nail.slot === "string" && nail.slot.trim() ? nail.slot.trim() : `nail-${nailIndex + 1}`,
      shape: nail.shape,
      length: Number(nail.length),
      width: Number(nail.width),
      ...architectureControls,
      baseColorHex: nail.baseColorHex,
      layers,
      ...(nailMetadata ? { metadata: nailMetadata } : {}),
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
  const baseEffect = VALID_EFFECTS.includes(design.effect) ? design.effect : "Solid";
  const hasMeaningfulLegacyEffect = MEANINGFUL_LEGACY_EFFECTS.includes(baseEffect);
  const baseData = {
    colorHex: design.baseColorHex || "#E8A0BF",
    effect: baseEffect,
    effectColorHex: design.effectColorHex || "#FFFFFF",
    shine: 0.62,
    transparency: 0,
    topCoat: "Gloss",
    sparkleDensity: 0.35,
    sparkleSize: 0.45,
    catEyeAngle: 28,
    catEyeIntensity: 0.65,
    chromeIntensity: 0.7,
  };
  if (!hasMeaningfulLegacyEffect) baseData.polishType = "Cream";
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
        data: baseData,
      }],
    }],
    metadata: { tags: Array.isArray(design.tags) ? design.tags : [] },
  });
}

function flatFieldsFromBlueprint(blueprint) {
  const activeNail = getActiveNail(blueprint);
  const baseLayer = getBaseLayer(activeNail);
  const data = baseLayer && isPlainObject(baseLayer.data) ? baseLayer.data : {};
  return {
    shape: activeNail.shape,
    length: activeNail.length,
    width: activeNail.width,
    baseColorHex: baseLayer ? data.colorHex : activeNail.baseColorHex,
    effect: baseLayer && VALID_EFFECTS.includes(data.effect) ? data.effect : "Solid",
    effectColorHex: baseLayer ? data.effectColorHex || "#FFFFFF" : "#FFFFFF",
    tags: normalizeTags((blueprint.metadata && blueprint.metadata.tags) || []),
  };
}

function uniqueList(items) {
  return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
}

function generateProposalBlueprintSummary(blueprint, design) {
  const document = validateAndNormalizeBlueprint(blueprint);
  const activeNail = getActiveNail(document);
  const baseLayer = getBaseLayer(activeNail);
  const baseData = baseLayer && isPlainObject(baseLayer.data) ? baseLayer.data : {};
  const layerCounts = {};
  const palette = [];
  const addColor = (value) => {
    if (typeof value === "string" && HEX_RE.test(value)) palette.push(cleanHex(value, value));
  };
  const vendorReferences = [];
  for (const nail of document.nails || []) {
    addColor(nail.baseColorHex);
    for (const layer of nail.layers || []) {
      if (layer.visible === false) continue;
      layerCounts[layer.type] = (layerCounts[layer.type] || 0) + 1;
      const data = isPlainObject(layer.data) ? layer.data : {};
      addColor(data.colorHex);
      addColor(data.effectColorHex);
      addColor(data.colorA);
      addColor(data.colorB);
      if (["charm", "jewel", "decal"].includes(layer.type)) {
        vendorReferences.push({
          type: layer.type,
          name: layer.name || data.assetId || layer.type,
          assetId: data.assetId || "custom",
          colorHex: cleanHex(data.colorHex, "#FFFFFF"),
          vendor: data.vendor || "Vendor TBD",
          sku: data.sku || "SKU TBD",
        });
      }
    }
  }
  const metadata = isPlainObject(document.metadata) ? document.metadata : {};
  const polishType = baseData.polishType || (MEANINGFUL_LEGACY_EFFECTS.includes(baseData.effect) ? baseData.effect : "Cream");
  const materialsSummary = uniqueList([
    `${polishType} polish ${cleanHex(baseData.colorHex || activeNail.baseColorHex, "#E8A0BF")}`,
    `${baseData.topCoat || "Gloss"} top coat`,
    layerCounts.gradient ? `${layerCounts.gradient} gradient layer(s)` : "",
    layerCounts.pattern ? `${layerCounts.pattern} pattern layer(s)` : "",
    layerCounts.frenchTip ? `${layerCounts.frenchTip} French tip layer(s)` : "",
    layerCounts.drawing ? `${layerCounts.drawing} hand-painted drawing layer(s)` : "",
    vendorReferences.length ? `${vendorReferences.length} charm/jewel/decal placement(s)` : "",
  ]);
  return {
    schemaVersion: 1,
    designSummary: {
      name: design?.name || "Untitled design",
      styleCategory: metadata.styleCategory || "Custom",
      activeShape: activeNail.shape,
      nailCount: document.nails.length,
      palette: uniqueList(palette),
      notes: metadata.internalNotes || "",
    },
    serviceSummary: { serviceType: document.nails.length >= 10 ? "Full set" : "Custom nail art", shape: activeNail.shape, length: activeNail.length, width: activeNail.width, layerCounts },
    pricingSummary: { estimatedServicePrice: metadata.estimatedServicePrice || "Not priced yet" },
    materialsSummary,
    marketingTags: normalizeTags(metadata.tags || []),
    vendorReferences,
  };
}

function shouldSimulateBlueprintPersistenceFailure(blueprint) {
  return process.env.NODE_ENV === "test"
    && blueprint
    && blueprint.metadata
    && blueprint.metadata.simulatePersistenceFailure === "smoke-test";
}


function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pickSnapshot(input, shape) {
  const source = isPlainObject(input) ? input : {};
  return Object.fromEntries(Object.entries(shape).map(([key, type]) => {
    if (type === "number") return [key, cleanOptionalNumber(source[key])];
    if (type === "boolean") return [key, Boolean(source[key])];
    if (type === "array") return [key, Array.isArray(source[key]) ? source[key].map((item) => (isPlainObject(item) ? { ...item } : item)) : []];
    if (type === "object") return [key, isPlainObject(source[key]) ? { ...source[key] } : null];
    return [key, cleanString(source[key])];
  }));
}

function normalizeProposalSnapshots(input = {}, fallback = {}) {
  const proposalVersion = Number(input.proposalVersion) === 2 || Number(fallback.proposalVersion) === 2 ? 2 : undefined;
  if (proposalVersion !== 2) return {};

  const createdAt = Number(input.createdAt || fallback.createdAt || nowMs());
  const updatedAt = Number(input.updatedAt || fallback.updatedAt || createdAt);

  return {
    proposalVersion: 2,
    clientSnapshot: pickSnapshot(input.clientSnapshot || fallback.clientSnapshot, { name: "string", contact: "string", email: "string", phone: "string" }),
    shopSnapshot: pickSnapshot(input.shopSnapshot || fallback.shopSnapshot, { shopName: "string", tagline: "string", contactEmail: "string", phone: "string", location: "string", website: "string", bookingLink: "string" }),
    serviceSnapshot: pickSnapshot(input.serviceSnapshot || fallback.serviceSnapshot, { serviceName: "string", category: "string", description: "string", startingPrice: "number", estimatedTime: "string", serviceType: "string" }),
    priceSnapshot: pickSnapshot(input.priceSnapshot || fallback.priceSnapshot, { suggestedPrice: "number", suggestedDeposit: "number", depositPercent: "number", estimatedTime: "string", breakdown: "array" }),
    policySnapshot: pickSnapshot(input.policySnapshot || fallback.policySnapshot, { depositPolicy: "string", cancellationPolicy: "string", bookingRequirements: "object", appointmentRules: "object", pressOnRules: "object" }),
    visualSnapshot: pickSnapshot(input.visualSnapshot || fallback.visualSnapshot, { mode: "string", designName: "string", heroLabel: "string", fullSetData: "object", createdFromRenderer: "boolean" }),
    draftSnapshot: pickSnapshot(input.draftSnapshot || fallback.draftSnapshot, { title: "string", notes: "string", customMessage: "string", draftText: "string" }),
    createdAt: Number.isFinite(createdAt) ? createdAt : nowMs(),
    updatedAt: Number.isFinite(updatedAt) ? updatedAt : (Number.isFinite(createdAt) ? createdAt : nowMs()),
  };
}

function normalizeProposalRecord(proposal) {
  if (!proposal) return null;
  const createdAt = Number(proposal.createdAt || nowMs());
  const base = {
    ...proposal,
    clientName: cleanString(proposal.clientName),
    price: Number(proposal.price),
    notes: typeof proposal.notes === "string" ? proposal.notes : "",
    createdAt: Number.isFinite(createdAt) ? createdAt : nowMs(),
  };
  return { ...base, ...normalizeProposalSnapshots(proposal, base) };
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
  return normalizeProposalRecord({
    id: row.id,
    designId: row.design_id,
    clientName: row.client_name,
    price: Number(row.price),
    status: row.status,
    notes: row.notes || "",
    proposalVersion: row.proposal_version ? Number(row.proposal_version) : undefined,
    clientSnapshot: row.client_snapshot,
    shopSnapshot: row.shop_snapshot,
    serviceSnapshot: row.service_snapshot,
    priceSnapshot: row.price_snapshot,
    policySnapshot: row.policy_snapshot,
    visualSnapshot: row.visual_snapshot,
    draftSnapshot: row.draft_snapshot,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at ?? row.created_at),
  });
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

  async createDesignWithBlueprint(input, blueprintInput) {
    const blueprint = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(blueprint);
    const createdAt = input.createdAt || nowMs();
    const designInput = {
      ...input,
      ...flat,
      createdAt,
      updatedAt: input.updatedAt || createdAt,
    };
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const designResult = await client.query(
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
      if (shouldSimulateBlueprintPersistenceFailure(blueprint)) {
        throw new Error("Simulated blueprint persistence failure");
      }
      const blueprintResult = await client.query(
        `INSERT INTO design_blueprints (design_id, schema_version, document, created_at, updated_at)
         VALUES ($1, $2, $3::jsonb, $4, $5)
         RETURNING *`,
        [designInput.id, blueprint.schemaVersion, JSON.stringify(blueprint), designInput.createdAt, designInput.updatedAt],
      );
      await client.query("COMMIT");
      return { design: mapDesign(designResult.rows[0]), blueprint: mapBlueprint(blueprintResult.rows[0]) };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async updateDesignWithBlueprint(designId, input, blueprintInput) {
    const blueprint = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(blueprint);
    const updatedAt = nowMs();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const currentResult = await client.query("SELECT * FROM designs WHERE id = $1 FOR UPDATE", [designId]);
      if (!currentResult.rows[0]) {
        await client.query("ROLLBACK");
        return null;
      }
      const current = mapDesign(currentResult.rows[0]);
      const designResult = await client.query(
        `UPDATE designs
         SET name = $2,
             shape = $3,
             length = $4,
             width = $5,
             base_color_hex = $6,
             effect = $7,
             effect_color_hex = $8,
             tags = $9,
             updated_at = $10
         WHERE id = $1
         RETURNING *`,
        [
          designId,
          input.name,
          flat.shape,
          flat.length,
          flat.width,
          flat.baseColorHex,
          flat.effect,
          flat.effectColorHex,
          flat.tags,
          updatedAt,
        ],
      );
      if (shouldSimulateBlueprintPersistenceFailure(blueprint)) {
        throw new Error("Simulated blueprint persistence failure");
      }
      const blueprintResult = await client.query(
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
      return { design: mapDesign(designResult.rows[0]), blueprint: mapBlueprint(blueprintResult.rows[0]) };
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
    input = normalizeProposalRecord(input);
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        `INSERT INTO proposals (id, design_id, client_name, price, status, notes, proposal_version, client_snapshot, shop_snapshot, service_snapshot, price_snapshot, policy_snapshot, visual_snapshot, draft_snapshot, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::jsonb, $12::jsonb, $13::jsonb, $14::jsonb, $15, $16)
         RETURNING *`,
        [input.id, input.designId, input.clientName, input.price, input.status, input.notes, input.proposalVersion || null, JSON.stringify(input.clientSnapshot || null), JSON.stringify(input.shopSnapshot || null), JSON.stringify(input.serviceSnapshot || null), JSON.stringify(input.priceSnapshot || null), JSON.stringify(input.policySnapshot || null), JSON.stringify(input.visualSnapshot || null), JSON.stringify(input.draftSnapshot || null), input.createdAt, input.updatedAt || input.createdAt],
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
           SET status = $2, notes = CASE WHEN $3::text <> '' THEN $3 ELSE notes END, updated_at = $4
           WHERE id = $1
           RETURNING *`,
          [id, status, note || "", nowMs()],
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
    const design = await this.getDesign(proposal.designId);
    const blueprint = design ? await this.getDesignBlueprint(proposal.designId) : null;
    return { ...normalizeProposalRecord(proposal), design, blueprintSummary: blueprint ? generateProposalBlueprintSummary(blueprint.document, design) : null };
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
        proposals: (parsed.proposals || []).map((proposal) => normalizeProposalRecord(proposal)),
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

  async createDesignWithBlueprint(input, blueprintInput) {
    const document = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(document);
    const createdAt = input.createdAt || nowMs();
    const design = { ...input, ...flat, createdAt, updatedAt: input.updatedAt || createdAt };
    const snapshot = {
      designs: this.data.designs.map((item) => ({ ...item })),
      designBlueprints: this.data.designBlueprints.map((item) => ({ ...item, document: item.document })),
      proposals: this.data.proposals.map((item) => ({ ...item })),
      proposalStatusHistory: this.data.proposalStatusHistory.map((item) => ({ ...item })),
    };
    try {
      this.data.designs.push(design);
      if (shouldSimulateBlueprintPersistenceFailure(document)) {
        throw new Error("Simulated blueprint persistence failure");
      }
      const blueprint = {
        designId: design.id,
        schemaVersion: document.schemaVersion,
        document,
        createdAt: design.createdAt,
        updatedAt: design.updatedAt,
      };
      this.data.designBlueprints.push(blueprint);
      this.persist();
      return { design: { ...design }, blueprint: { ...blueprint, document } };
    } catch (error) {
      this.data = snapshot;
      this.persist();
      throw error;
    }
  }

  async updateDesignWithBlueprint(designId, input, blueprintInput) {
    const design = this.data.designs.find((item) => item.id === designId);
    if (!design) return null;
    const document = validateAndNormalizeBlueprint(blueprintInput);
    const flat = flatFieldsFromBlueprint(document);
    const updatedAt = nowMs();
    const snapshot = {
      designs: this.data.designs.map((item) => ({ ...item })),
      designBlueprints: this.data.designBlueprints.map((item) => ({ ...item, document: item.document })),
      proposals: this.data.proposals.map((item) => ({ ...item })),
      proposalStatusHistory: this.data.proposalStatusHistory.map((item) => ({ ...item })),
    };
    try {
      Object.assign(design, {
        name: input.name,
        ...flat,
        updatedAt,
      });
      if (shouldSimulateBlueprintPersistenceFailure(document)) {
        throw new Error("Simulated blueprint persistence failure");
      }
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
      return { design: { ...design }, blueprint: { ...blueprint, document } };
    } catch (error) {
      this.data = snapshot;
      this.persist();
      throw error;
    }
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
    const proposal = normalizeProposalRecord(input);
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
      proposal.updatedAt = nowMs();
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
    const design = await this.getDesign(proposal.designId);
    const blueprint = design ? await this.getDesignBlueprint(proposal.designId) : null;
    return { ...normalizeProposalRecord(proposal), design, blueprintSummary: blueprint ? generateProposalBlueprintSummary(blueprint.document, design) : null };
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
