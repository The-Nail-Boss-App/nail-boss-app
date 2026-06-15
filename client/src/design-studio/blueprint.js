export const SHAPES = ["Square", "Tapered Square", "Russian Square", "Coffin", "Slim Coffin", "Almond", "Russian Almond", "Oval", "Round", "Stiletto", "Edge", "Lipstick", "Flare", "Mountain Peak"];
export const EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];
export const POLISH_TYPES = ["Cream", "Jelly", "Milky", "Matte", "Chrome", "Cat Eye", "Glitter"];
export const TOP_COATS = ["Gloss", "Matte", "No-Wipe Shine", "Velvet"];
export const MEANINGFUL_LEGACY_EFFECTS = ["Gradient", "Chrome", "CatEye", "Marble"];
export function hasMeaningfulLegacyEffect(data = {}) {
  return MEANINGFUL_LEGACY_EFFECTS.includes(data.effect);
}
export function hasExplicitPolishType(data = {}) {
  return Object.prototype.hasOwnProperty.call(data, "polishType") && POLISH_TYPES.includes(data.polishType);
}
export function clearStalePolishTypeForLegacyEffect(data = {}, patch = {}) {
  const next = { ...data };
  const patchHasExplicitPolishType = POLISH_TYPES.includes(patch.polishType);
  const patchHasMeaningfulLegacyEffect = Object.prototype.hasOwnProperty.call(patch, "effect") && MEANINGFUL_LEGACY_EFFECTS.includes(patch.effect);
  if (patchHasExplicitPolishType) next.polishType = patch.polishType;
  else if (patchHasMeaningfulLegacyEffect) delete next.polishType;
  return next;
}
export function normalizePolishData(data = {}, fallbackColor = "#E8A0BF") {
  const hasValidPolishType = hasExplicitPolishType(data);
  const preserveAbsentLegacyPolishType = !hasValidPolishType && hasMeaningfulLegacyEffect(data);
  const polishType = hasValidPolishType ? data.polishType : "Cream";
  const topCoat = TOP_COATS.includes(data.topCoat) ? data.topCoat : (polishType === "Matte" ? "Matte" : "Gloss");
  const range = (value, min, max, fallback) => { const parsed = Number(value); return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback; };
  const normalized = {
    ...data,
    polishType,
    colorHex: normalizeHex(data.colorHex, fallbackColor),
    shine: range(data.shine, 0, 1, polishType === "Matte" ? 0.08 : 0.62),
    transparency: range(data.transparency, 0, 1, polishType === "Jelly" ? 0.45 : polishType === "Milky" ? 0.28 : 0),
    topCoat,
    sparkleDensity: range(data.sparkleDensity, 0, 1, 0.35),
    sparkleSize: range(data.sparkleSize, 0, 1, 0.45),
    catEyeAngle: range(data.catEyeAngle, -180, 180, 28),
    catEyeIntensity: range(data.catEyeIntensity, 0, 1, 0.65),
    chromeIntensity: range(data.chromeIntensity, 0, 1, 0.7),
  };
  if (preserveAbsentLegacyPolishType) {
    delete normalized.polishType;
  }
  return normalized;
}
export const PATTERNS = ["dots", "stripes", "checker", "french-tip", "glitter", "marble"];
export const GRADIENT_DIRECTIONS = ["vertical", "horizontal", "diagonal", "reverse-diagonal"];
export const FRENCH_TIP_STYLES = ["classic", "deep", "angled", "v", "reverse"];
export const FRENCH_TIP_PRESETS = {
  soft: { tipHeight: 0.24, smileCurve: 0.18, smileDepth: 0.14, smileWidth: 0.72, rotation: 0 },
  medium: { tipHeight: 0.32, smileCurve: 0.32, smileDepth: 0.24, smileWidth: 0.82, rotation: 0 },
  deep: { tipHeight: 0.42, smileCurve: 0.5, smileDepth: 0.36, smileWidth: 0.92, rotation: 0 },
};

export const VIEWBOX = { width: 240, height: 360, cx: 120 };
const BASE_TOP = 42;
const TIP_BOTTOM = 318;
const HISTORY_LIMIT = 50;

export function uid(prefix = "layer") {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${random}`;
}

export function clamp(number, min, max) {
  const parsed = Number(number);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, parsed));
}

export function normalizeHex(value, fallback = "#E8A0BF") {
  return /^#[0-9a-fA-F]{6}$/.test(value || "") ? value.toUpperCase() : fallback;
}

export function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  return String(value || "").split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean);
}

export function layerSort(a, b) {
  return (a.order ?? 0) - (b.order ?? 0);
}

const SHAPE_ARCHITECTURE = {
  "Square": { cuticle: 0.72, shoulder: 1, tip: 0.94, taper: 0.08, curve: 0.18, apexY: 0.42, freeEdge: 0.22, freeEdgeSlant: 0 },
  "Tapered Square": { cuticle: 0.7, shoulder: 1, tip: 0.68, taper: 0.34, curve: 0.2, apexY: 0.44, freeEdge: 0.25, freeEdgeSlant: 0 },
  "Russian Square": { cuticle: 0.74, shoulder: 1.03, tip: 0.86, taper: 0.18, curve: 0.11, apexY: 0.38, freeEdge: 0.3, freeEdgeSlant: 0 },
  "Coffin": { cuticle: 0.68, shoulder: 1, tip: 0.46, taper: 0.52, curve: 0.16, apexY: 0.46, freeEdge: 0.32, freeEdgeSlant: 0 },
  "Slim Coffin": { cuticle: 0.62, shoulder: 0.92, tip: 0.34, taper: 0.64, curve: 0.18, apexY: 0.48, freeEdge: 0.36, freeEdgeSlant: 0 },
  "Almond": { cuticle: 0.64, shoulder: 0.98, tip: 0.04, taper: 0.8, curve: 0.5, apexY: 0.47, freeEdge: 0.36, freeEdgeSlant: 0 },
  "Russian Almond": { cuticle: 0.6, shoulder: 0.94, tip: 0.015, taper: 0.88, curve: 0.38, apexY: 0.41, freeEdge: 0.42, freeEdgeSlant: 0 },
  "Oval": { cuticle: 0.68, shoulder: 0.99, tip: 0.36, taper: 0.38, curve: 0.82, apexY: 0.47, freeEdge: 0.24, freeEdgeSlant: 0 },
  "Round": { cuticle: 0.72, shoulder: 0.96, tip: 0.52, taper: 0.22, curve: 0.96, apexY: 0.43, freeEdge: 0.16, freeEdgeSlant: 0 },
  "Stiletto": { cuticle: 0.58, shoulder: 0.94, tip: 0, taper: 0.96, curve: 0.26, apexY: 0.5, freeEdge: 0.46, freeEdgeSlant: 0 },
  "Edge": { cuticle: 0.62, shoulder: 0.96, tip: 0.02, taper: 0.9, curve: 0.12, apexY: 0.4, freeEdge: 0.44, freeEdgeSlant: 0 },
  "Lipstick": { cuticle: 0.68, shoulder: 0.98, tip: 0.48, taper: 0.36, curve: 0.16, apexY: 0.43, freeEdge: 0.3, freeEdgeSlant: 0.16 },
  "Flare": { cuticle: 0.72, shoulder: 0.9, tip: 1.16, taper: -0.22, curve: 0.18, apexY: 0.42, freeEdge: 0.28, freeEdgeSlant: 0 },
  "Mountain Peak": { cuticle: 0.6, shoulder: 0.9, tip: 0, taper: 0.9, curve: 0.18, apexY: 0.48, freeEdge: 0.28, freeEdgeSlant: 0 },
};

function shapeProfile(shape = "Almond") { return SHAPE_ARCHITECTURE[shape] || SHAPE_ARCHITECTURE.Almond; }
function nailControl(nail, key, fallback = 0.5) { return clamp(nail?.[key] ?? fallback, 0, 1); }

function defaultShapeControls(source = {}) {
  return {
    taper: clamp(source.taper ?? 0.5, 0, 1),
    apexHeight: clamp(source.apexHeight ?? 0.5, 0, 1),
    sidewallCurve: clamp(source.sidewallCurve ?? 0.5, 0, 1),
    freeEdgeThickness: clamp(source.freeEdgeThickness ?? 0.5, 0, 1),
  };
}

export function getNailGeometry(nail) {
  const length = nailControl(nail, "length");
  const width = nailControl(nail, "width");
  const nailH = 180 + length * 110;
  const halfW = 38 + width * 50;
  const topY = TIP_BOTTOM - nailH;
  return { cx: VIEWBOX.cx, topY, bottomY: TIP_BOTTOM, height: nailH, halfW, left: VIEWBOX.cx - halfW, right: VIEWBOX.cx + halfW, width: halfW * 2 };
}

export function getNailArchitecture(nail = {}) {
  const g = getNailGeometry(nail);
  const profile = shapeProfile(nail.shape);
  const apexHeight = nailControl(nail, "apexHeight", 0.5);
  const sidewallCurve = nailControl(nail, "sidewallCurve", 0.5);
  const freeEdgeThickness = nailControl(nail, "freeEdgeThickness", 0.5);
  const apexYNorm = clamp(profile.apexY - (apexHeight - 0.5) * 0.12, 0.26, 0.62);
  const cuticleDip = g.height * 0.055;
  const freeEdgeYNorm = clamp(1 - (profile.freeEdge + (freeEdgeThickness - 0.5) * 0.16), 0.48, 0.9);
  return {
    ...g,
    apexYNorm,
    freeEdgeYNorm,
    apex: { x: g.cx, y: g.topY + g.height * apexYNorm },
    cuticle: { y: g.topY + cuticleDip, halfW: g.halfW * profile.cuticle },
    sidewallCurve,
    freeEdgeThickness,
  };
}

function normalizedHalfWidthAtY(shape = "Almond", yValue = 0.5, nail = {}) {
  const y = clamp(yValue, 0, 1);
  const p = shapeProfile(shape);
  const taperControl = nailControl(nail, "taper", 0.5) - 0.5;
  const curveControl = nailControl(nail, "sidewallCurve", 0.5) - 0.5;
  const freeEdgeControl = nailControl(nail, "freeEdgeThickness", 0.5) - 0.5;
  const cuticle = p.cuticle * 0.5;
  const shoulder = p.shoulder * 0.5;
  const tip = clamp((p.tip - taperControl * 0.34 + freeEdgeControl * 0.12) * 0.5, 0, 0.62);
  const shoulderY = clamp(0.2 + p.apexY * 0.18, 0.2, 0.34);
  if (y <= shoulderY) {
    const t = y / shoulderY;
    const eased = Math.sin((t * Math.PI) / 2) ** (0.8 + curveControl * 0.55);
    return cuticle + (shoulder - cuticle) * eased;
  }
  const t = (y - shoulderY) / (1 - shoulderY);
  const exponent = clamp(0.82 + p.curve + p.taper * 0.35 + curveControl * 0.7, 0.45, 2.1);
  const tapered = shoulder + (tip - shoulder) * (t ** exponent);
  if (shape === "Edge") return tapered * (1 - 0.07 * Math.max(0, Math.sin(Math.PI * t)));
  if (shape === "Lipstick" && y > 0.9) return tapered * (1 - ((y - 0.9) / 0.1) * 0.08);
  return Math.max(0, tapered);
}

export function getNailShapeMetrics(shape = "Almond", nail = {}) {
  const scopedNail = { ...nail, shape };
  return {
    shoulderHalfWidth: Number(normalizedHalfWidthAtY(shape, 0.28, scopedNail).toFixed(6)),
    sidewallHalfWidth: Number(normalizedHalfWidthAtY(shape, 0.62, scopedNail).toFixed(6)),
    freeEdgeHalfWidth: Number(normalizedHalfWidthAtY(shape, 0.86, scopedNail).toFixed(6)),
    tipHalfWidth: Number(normalizedHalfWidthAtY(shape, 1, scopedNail).toFixed(6)),
  };
}

function pathPoint(nail, y, side = 1) {
  const g = getNailGeometry(nail);
  const p = shapeProfile(nail.shape);
  const slant = p.freeEdgeSlant ? (side * p.freeEdgeSlant * Math.max(0, y - 0.84) * g.height) : 0;
  return { x: g.cx + side * normalizedHalfWidthAtY(nail.shape, y, nail) * g.width + slant, y: g.topY + y * g.height };
}

export function buildNailPath(shape = "Almond", nail = {}) {
  const scopedNail = { ...nail, shape };
  const arch = getNailArchitecture(scopedNail);
  const topY = arch.topY + arch.height * 0.055;
  const cuticleHalf = normalizedHalfWidthAtY(shape, 0, scopedNail) * arch.width;
  const samples = [0.07, 0.16, 0.28, 0.42, 0.58, 0.74, 0.88, 1];
  const right = samples.map((y) => pathPoint(scopedNail, y, 1));
  const left = [...samples].reverse().map((y) => pathPoint(scopedNail, y, -1));
  const cmds = [`M ${arch.cx - cuticleHalf} ${topY}`, `C ${arch.cx - cuticleHalf * 0.82} ${arch.topY - arch.height * 0.018} ${arch.cx + cuticleHalf * 0.82} ${arch.topY - arch.height * 0.018} ${arch.cx + cuticleHalf} ${topY}`];
  for (const pt of right) cmds.push(`L ${pt.x.toFixed(3)} ${pt.y.toFixed(3)}`);
  for (const pt of left) cmds.push(`L ${pt.x.toFixed(3)} ${pt.y.toFixed(3)}`);
  cmds.push("Z");
  return cmds.join(" ");
}

export function normalizedToSvg(point, nail) {
  const g = getNailGeometry(nail);
  return { x: g.left + clamp(point.x, 0, 1) * g.width, y: g.topY + clamp(point.y, 0, 1) * g.height };
}

export function svgToNormalized(point, nail) {
  const g = getNailGeometry(nail);
  return { x: clamp((point.x - g.left) / g.width, 0, 1), y: clamp((point.y - g.topY) / g.height, 0, 1) };
}

const ASSET_LAYER_TYPES = new Set(["charm", "jewel", "decal"]);
const NON_ASSET_FULL_SURFACE_TYPES = new Set(["drawing", "pattern", "gradient", "frenchTip"]);
const ASSET_MIN_SCALE = 0.06;

function roundPoint(point) {
  return { x: Number(point.x.toFixed(6)), y: Number(point.y.toFixed(6)) };
}

/**
 * Lightweight silhouette model used for strict-fit validation.
 *
 * The renderer still uses buildNailPath() and SVG clipping for visual safety, while the
 * helpers below use a deterministic normalized half-width curve per supported shape. The
 * curves intentionally approximate the same silhouettes without browser path APIs so
 * save/load, tests, and future product-use estimators can reason about valid nail-surface
 * geometry in Node as well as the browser. Editor handles may sit outside this model; saved
 * artwork and drawing points may not.
 */
export function isPointInsideNailSilhouette(point, nail) {
  const x = Number(point?.x);
  const y = Number(point?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1 || y < 0 || y > 1) return false;
  const half = Math.max(0, normalizedHalfWidthAtY(nail?.shape, y, nail));
  return Math.abs(x - 0.5) <= half + 0.000001;
}

export function projectPointInsideNailSilhouette(point, nail) {
  const y = clamp(point?.y ?? 0.5, 0, 1);
  const half = Math.max(0.000001, normalizedHalfWidthAtY(nail?.shape, y, nail));
  return roundPoint({ x: clamp(point?.x ?? 0.5, 0.5 - half, 0.5 + half), y });
}

function assetBoundaryPoints(transform = {}, nail) {
  const g = getNailGeometry(nail);
  const rotation = ((transform.rotation ?? 0) * Math.PI) / 180;
  const renderedSize = Math.min(g.width, g.height) * Math.abs(transform.scaleX ?? 0.18);
  const halfX = (renderedSize / g.width) / 2;
  const halfY = (renderedSize / g.height) / 2;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const samples = [
    [-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [0, 0],
  ];
  return samples.map(([sx, sy]) => {
    const dx = sx * halfX;
    const dy = sy * halfY;
    return { x: (transform.x ?? 0.5) + dx * cos - dy * sin, y: (transform.y ?? 0.5) + dx * sin + dy * cos };
  });
}

export function assetFitsNailSilhouette(transform = {}, nail, layer = {}) {
  if (!ASSET_LAYER_TYPES.has(layer.type || layer)) return true;
  return assetBoundaryPoints(transform, nail).every((point) => isPointInsideNailSilhouette(point, nail));
}

function fitSearch(transform, nail, layer) {
  if (assetFitsNailSilhouette(transform, nail, layer)) return transform;
  const center = projectPointInsideNailSilhouette(transform, nail);
  const offsets = [0, 0.01, -0.01, 0.025, -0.025, 0.05, -0.05, 0.08, -0.08, 0.12, -0.12, 0.16, -0.16, 0.22, -0.22];
  let best = null;
  let bestDistance = Infinity;
  for (const dy of offsets) {
    for (const dx of offsets) {
      const candidateCenter = projectPointInsideNailSilhouette({ x: center.x + dx, y: center.y + dy }, nail);
      const candidate = { ...transform, ...candidateCenter };
      if (!assetFitsNailSilhouette(candidate, nail, layer)) continue;
      const distance = Math.hypot(candidate.x - center.x, candidate.y - center.y);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
  }
  return best;
}

export function constrainAssetTransform(transform = {}, nail, layer = {}) {
  const layerType = layer.type || layer;
  const maxScale = layerType === "jewel" ? 0.24 : 0.34;
  let scale = clamp(Math.max(Math.abs(transform.scaleX ?? 0.18), Math.abs(transform.scaleY ?? 0.18)), ASSET_MIN_SCALE, maxScale);
  let candidate = {
    x: clamp(transform.x ?? 0.5, 0, 1),
    y: clamp(transform.y ?? 0.5, 0, 1),
    scaleX: scale,
    scaleY: scale,
    rotation: clamp(transform.rotation ?? 0, -180, 180),
  };
  candidate = { ...candidate, ...projectPointInsideNailSilhouette(candidate, nail) };
  while (scale >= ASSET_MIN_SCALE) {
    const found = fitSearch(candidate, nail, layerType);
    if (found) return { ...found, scaleX: Number(scale.toFixed(6)), scaleY: Number(scale.toFixed(6)) };
    scale *= 0.92;
    candidate = { ...candidate, scaleX: scale, scaleY: scale };
  }
  const safeCenter = projectPointInsideNailSilhouette({ x: 0.5, y: 0.5 }, nail);
  return { ...candidate, ...safeCenter, scaleX: ASSET_MIN_SCALE, scaleY: ASSET_MIN_SCALE };
}

export function constrainStrokePoints(points = [], nail) {
  return points.map((point) => projectPointInsideNailSilhouette(point, nail));
}

export function revalidateLayersAfterNailResize(blueprint) {
  return updateActiveNail(blueprint, (nail) => revalidateNailLayers(nail));
}

function legacyRevalidateLayersAfterNailResize(blueprint) {
  return updateActiveNail(blueprint, (nail) => ({
    ...nail,
    layers: nail.layers.map((layer) => {
      if (ASSET_LAYER_TYPES.has(layer.type)) return { ...layer, transform: constrainAssetTransform(layer.transform, nail, layer) };
      if (layer.type === "drawing") {
        return {
          ...layer,
          data: {
            ...layer.data,
            strokes: (layer.data?.strokes || []).map((stroke) => ({ ...stroke, points: constrainStrokePoints(stroke.points || [], nail) })),
          },
        };
      }
      return { ...layer, transform: safeTransform(layer.transform, nail, layer.type) };
    }),
  }));
}

export function safeTransform(transform = {}, nail, layerType = "asset") {
  if (ASSET_LAYER_TYPES.has(layerType)) return constrainAssetTransform(transform, nail, layerType);
  const scale = NON_ASSET_FULL_SURFACE_TYPES.has(layerType) ? 1 : clamp(Math.max(Math.abs(transform.scaleX ?? 0.18), Math.abs(transform.scaleY ?? 0.18)), ASSET_MIN_SCALE, 0.34);
  return {
    x: clamp(transform.x ?? 0.5, 0, 1),
    y: clamp(transform.y ?? 0.5, 0, 1),
    scaleX: scale,
    scaleY: scale,
    rotation: clamp(transform.rotation ?? 0, -180, 180),
  };
}

export function createBaseLayer(design = {}) {
  const data = {
    colorHex: normalizeHex(design.baseColorHex),
    effect: EFFECTS.includes(design.effect) ? design.effect : "Solid",
    effectColorHex: normalizeHex(design.effectColorHex, "#FFFFFF"),
  };
  if (POLISH_TYPES.includes(design.polishType)) data.polishType = design.polishType;
  return {
    id: "base-layer",
    type: "base",
    name: "Base Color",
    visible: true,
    locked: true,
    opacity: 1,
    order: 0,
    transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
    data: normalizePolishData(data, normalizeHex(design.baseColorHex)),
  };
}

export function createDefaultBlueprint(design = {}) {
  if (design.fullSet !== false) return createFullSetBlueprint(design);
  const nail = {
    id: "nail-1",
    slot: "accent",
    shape: SHAPES.includes(design.shape) ? design.shape : "Almond",
    length: clamp(design.length ?? 0.5, 0, 1),
    width: clamp(design.width ?? 0.5, 0, 1),
    ...defaultShapeControls(design),
    baseColorHex: normalizeHex(design.baseColorHex),
    layers: [createBaseLayer(design)],
  };
  return {
    schemaVersion: 1,
    canvas: { mode: "single-nail", activeNailId: nail.id },
    nails: [nail],
    metadata: { tags: normalizeTags(design.tags || []) },
  };
}

export function getActiveNail(blueprint) {
  const activeId = blueprint?.canvas?.activeNailId;
  return blueprint?.nails?.find((nail) => nail.id === activeId) || blueprint?.nails?.[0];
}


function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function isFiniteInteger(value) {
  return Number.isInteger(value) && Number.isFinite(value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBackendValidInactiveLayer(layer, seenLayerIds) {
  if (!isPlainObject(layer)) return false;
  const id = typeof layer.id === "string" ? layer.id.trim() : "";
  if (!id || seenLayerIds.has(id)) return false;
  seenLayerIds.add(id);
  if (!["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel", "frenchTip"].includes(layer.type)) return false;
  if (typeof layer.visible !== "boolean" || typeof layer.locked !== "boolean") return false;
  if (!isFiniteNumber(layer.opacity) || layer.opacity < 0 || layer.opacity > 1) return false;
  if (!isFiniteInteger(layer.order)) return false;
  if (!isPlainObject(layer.transform)) return false;
  for (const key of ["x", "y", "scaleX", "scaleY", "rotation"]) {
    if (!isFiniteNumber(layer.transform[key])) return false;
  }
  if (!isPlainObject(layer.data)) return false;
  if (Object.prototype.hasOwnProperty.call(layer.data, "colorHex") && !/^#[0-9a-fA-F]{6}$/.test(layer.data.colorHex || "")) return false;
  if (Object.prototype.hasOwnProperty.call(layer.data, "effectColorHex") && !/^#[0-9a-fA-F]{6}$/.test(layer.data.effectColorHex || "")) return false;
  if (layer.type === "base") {
    const polish = normalizePolishData(layer.data, layer.data.colorHex);
    if (!/^#[0-9a-fA-F]{6}$/.test(polish.colorHex || "")) return false;
    if (!EFFECTS.includes(layer.data.effect)) return false;
    if (!/^#[0-9a-fA-F]{6}$/.test(layer.data.effectColorHex || "")) return false;
  }
  return true;
}

function isBackendValidInactiveNail(nail) {
  if (!isPlainObject(nail)) return false;
  if (typeof nail.id !== "string" || !nail.id.trim()) return false;
  if (!SHAPES.includes(nail.shape)) return false;
  if (!isFiniteNumber(nail.length) || nail.length < 0 || nail.length > 1) return false;
  if (!isFiniteNumber(nail.width) || nail.width < 0 || nail.width > 1) return false;
  for (const key of ["taper", "apexHeight", "sidewallCurve", "freeEdgeThickness"]) {
    if (Object.prototype.hasOwnProperty.call(nail, key) && (!isFiniteNumber(nail[key]) || nail[key] < 0 || nail[key] > 1)) return false;
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(nail.baseColorHex || "")) return false;
  if (!Array.isArray(nail.layers)) return false;
  const seenLayerIds = new Set();
  return nail.layers.every((layer) => isBackendValidInactiveLayer(layer, seenLayerIds));
}

function cloneInactiveNailVerbatim(nail) {
  return {
    ...nail,
    layers: nail.layers.map((layer) => ({
      ...layer,
      transform: { ...layer.transform },
      data: normalizeLayerData(layer),
    })),
    ...(isPlainObject(nail.metadata) ? { metadata: { ...nail.metadata } } : {}),
  };
}

export function normalizeFrenchTipData(data = {}) {
  const presetName = Object.prototype.hasOwnProperty.call(FRENCH_TIP_PRESETS, data.preset) ? data.preset : "medium";
  const preset = FRENCH_TIP_PRESETS[presetName];
  const style = FRENCH_TIP_STYLES.includes(data.style) ? data.style : "classic";
  return {
    style,
    preset: presetName,
    tipHeight: clamp(data.tipHeight ?? preset.tipHeight, 0.08, 0.72),
    smileCurve: clamp(data.smileCurve ?? preset.smileCurve, 0, 1),
    smileDepth: clamp(data.smileDepth ?? preset.smileDepth, 0, 0.65),
    smileWidth: clamp(data.smileWidth ?? preset.smileWidth, 0.25, 1),
    colorHex: normalizeHex(data.colorHex, "#FFFFFF"),
    rotation: clamp(data.rotation ?? preset.rotation, -45, 45),
  };
}

function normalizeLayerData(layer) {
  const data = { ...(layer.data || {}) };
  if (["charm", "jewel", "decal"].includes(layer.type)) delete data.svg;
  if (layer.type === "frenchTip") return normalizeFrenchTipData(data);
  return data;
}

function normalizeEditableNail(raw, fallback, index) {
  const nail = {
    id: String(raw.id || `nail-${index + 1}`).trim() || `nail-${index + 1}`,
    slot: raw.slot || "accent",
    shape: SHAPES.includes(raw.shape) ? raw.shape : fallback.shape,
    length: clamp(raw.length ?? fallback.length, 0, 1),
    width: clamp(raw.width ?? fallback.width, 0, 1),
    ...defaultShapeControls({ ...fallback, ...raw }),
    baseColorHex: normalizeHex(raw.baseColorHex, fallback.baseColorHex),
    layers: Array.isArray(raw.layers) ? raw.layers : [],
    metadata: raw.metadata && typeof raw.metadata === "object" ? { ...raw.metadata } : undefined,
  };
  const hasBase = nail.layers.some((layer) => layer.type === "base");
  const layers = (hasBase ? nail.layers : [createBaseLayer(nail), ...nail.layers]).map((layer, layerIndex) => {
    const normalized = {
      id: String(layer.id || uid(layer.type || "layer")).trim() || uid(layer.type || "layer"),
      type: layer.type || "decal",
      name: String(layer.name || layer.type || "Layer").trim(),
      visible: layer.visible !== false,
      locked: layer.type === "base" ? true : Boolean(layer.locked),
      opacity: clamp(layer.opacity ?? 1, 0, 1),
      order: Number.isFinite(layer.order) ? layer.order : layerIndex,
      transform: safeTransform(layer.transform || {}, nail, layer.type),
      data: normalizeLayerData(layer),
    };
    if (normalized.type === "drawing") {
      normalized.data.strokes = (normalized.data.strokes || []).map((stroke) => ({ ...stroke, points: constrainStrokePoints(stroke.points || [], nail) }));
    }
    if (normalized.type === "base") {
      normalized.id = "base-layer";
      normalized.name = "Base Color";
      normalized.locked = true;
      normalized.order = 0;
      normalized.data = normalizePolishData({
        ...normalized.data,
        colorHex: normalizeHex(normalized.data.colorHex, nail.baseColorHex),
        effect: EFFECTS.includes(normalized.data.effect) ? normalized.data.effect : "Solid",
        effectColorHex: normalizeHex(normalized.data.effectColorHex, "#FFFFFF"),
      }, nail.baseColorHex);
      nail.baseColorHex = normalized.data.colorHex;
    }
    return normalized;
  });
  nail.layers = renumberLayers(layers);
  return nail;
}

export function ensureBlueprint(input, design = {}) {
  const fallback = createDefaultBlueprint(design);
  const source = input && typeof input === "object" ? input : fallback;
  const activeId = source.canvas?.activeNailId || source.nails?.[0]?.id || "nail-1";
  const nails = Array.isArray(source.nails) && source.nails.length ? source.nails : fallback.nails;
  const normalizedNails = nails.slice(0, 10).map((raw, index) => {
    const base = fallback.nails[0];
    const rawId = typeof raw?.id === "string" ? raw.id.trim() : "";
    const isActive = rawId && rawId === activeId;
    if (!isActive && isBackendValidInactiveNail(raw)) return cloneInactiveNailVerbatim(raw);
    return normalizeEditableNail(raw || {}, base, index);
  });
  return {
    schemaVersion: 1,
    canvas: { mode: "single-nail", activeNailId: normalizedNails.some((n) => n.id === activeId) ? activeId : normalizedNails[0].id },
    nails: normalizedNails,
    metadata: { ...(source.metadata || {}), tags: normalizeTags(source.metadata?.tags || design.tags || []) },
  };
}

export function renumberLayers(layers) {
  return [...layers].sort(layerSort).map((layer, index) => ({ ...layer, order: index }));
}

export function updateActiveNail(blueprint, updater) {
  const activeId = blueprint.canvas.activeNailId;
  return { ...blueprint, nails: blueprint.nails.map((nail) => (nail.id === activeId ? updater(nail) : nail)) };
}

export function synchronizeBase(blueprint, patch) {
  return updateActiveNail(blueprint, (nail) => {
    const nextNail = { ...nail, ...patch };
    const layers = nail.layers.map((layer) => {
      if (layer.type === "drawing") {
        return { ...layer, data: { ...layer.data, strokes: (layer.data?.strokes || []).map((stroke) => ({ ...stroke, points: constrainStrokePoints(stroke.points || [], nextNail) })) }, transform: safeTransform(layer.transform, nextNail, layer.type) };
      }
      if (layer.type !== "base") return { ...layer, transform: safeTransform(layer.transform, nextNail, layer.type) };
      const data = {
        ...layer.data,
        colorHex: normalizeHex(patch.baseColorHex ?? patch.colorHex ?? layer.data.colorHex, layer.data.colorHex),
        effect: EFFECTS.includes(patch.effect) ? patch.effect : layer.data.effect,
        effectColorHex: normalizeHex(patch.effectColorHex ?? layer.data.effectColorHex, layer.data.effectColorHex),
        shine: patch.shine ?? layer.data.shine,
        transparency: patch.transparency ?? layer.data.transparency,
        topCoat: patch.topCoat ?? layer.data.topCoat,
        sparkleDensity: patch.sparkleDensity ?? layer.data.sparkleDensity,
        sparkleSize: patch.sparkleSize ?? layer.data.sparkleSize,
        catEyeAngle: patch.catEyeAngle ?? layer.data.catEyeAngle,
        catEyeIntensity: patch.catEyeIntensity ?? layer.data.catEyeIntensity,
        chromeIntensity: patch.chromeIntensity ?? layer.data.chromeIntensity,
      };
      const patchedData = clearStalePolishTypeForLegacyEffect(data, patch);
      if (POLISH_TYPES.includes(patch.polishType)) data.polishType = patchedData.polishType;
      else if (!Object.prototype.hasOwnProperty.call(patchedData, "polishType")) delete data.polishType;
      else if (POLISH_TYPES.includes(layer.data.polishType)) data.polishType = layer.data.polishType;
      else delete data.polishType;
      const normalizedPolish = normalizePolishData(data, data.colorHex);
      return { ...layer, data: normalizedPolish, locked: true, visible: true, transform: safeTransform(layer.transform, nextNail, "base") };
    });
    return { ...nextNail, baseColorHex: normalizeHex(patch.baseColorHex ?? patch.colorHex ?? nextNail.baseColorHex), layers };
  });
}

export function getVisibleBaseColor(nail) {
  const base = nail?.layers?.find((layer) => layer.type === "base");
  return normalizeHex(base?.data?.colorHex, normalizeHex(nail?.baseColorHex));
}

export function flatDesignFromBlueprint(blueprint, name) {
  const nail = getActiveNail(blueprint);
  const base = nail.layers.find((layer) => layer.type === "base") || createBaseLayer(nail);
  return {
    name: String(name || "").trim(),
    shape: nail.shape,
    length: nail.length,
    width: nail.width,
    taper: nail.taper ?? 0.5,
    apexHeight: nail.apexHeight ?? 0.5,
    sidewallCurve: nail.sidewallCurve ?? 0.5,
    freeEdgeThickness: nail.freeEdgeThickness ?? 0.5,
    baseColorHex: getVisibleBaseColor(nail),
    effect: base.data.effect,
    effectColorHex: base.data.effectColorHex,
    polishType: base.data.polishType || "Cream",
    tags: normalizeTags(blueprint.metadata?.tags || []),
  };
}

export function makeHistoryEntry(blueprint) {
  return JSON.stringify(blueprint);
}

export function pushHistory(history, blueprint) {
  const snapshot = makeHistoryEntry(blueprint);
  if (history.past[history.past.length - 1] === snapshot) return history;
  return { past: [...history.past.slice(-(HISTORY_LIMIT - 1)), snapshot], future: [] };
}

export function restoreHistorySnapshot(snapshot) {
  return JSON.parse(snapshot);
}

export function assetLayer(asset, nail) {
  const type = asset.category === "jewels" ? "jewel" : asset.category === "charms" ? "charm" : "decal";
  return {
    id: uid(type),
    type,
    name: asset.name,
    visible: true,
    locked: false,
    opacity: 1,
    order: 99,
    transform: safeTransform({ x: 0.5, y: 0.5, scaleX: type === "jewel" ? 0.14 : 0.2, scaleY: type === "jewel" ? 0.14 : 0.2, rotation: 0 }, nail, type),
    data: { assetId: asset.id, colorHex: asset.defaultColor || "#FFFFFF" },
  };
}

export function gradientLayer(nail) {
  return {
    id: uid("gradient"), type: "gradient", name: "Gradient Overlay", visible: true, locked: false, opacity: 0.75, order: 99,
    transform: safeTransform({ x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, nail, "gradient"),
    data: { colorA: "#FFFFFF", colorB: "#E8A0BF", direction: "vertical" },
  };
}

export function patternLayer(nail, pattern = "dots") {
  return {
    id: uid("pattern"), type: "pattern", name: `${pattern} pattern`, visible: true, locked: false, opacity: 0.7, order: 99,
    transform: safeTransform({ x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, nail, "pattern"),
    data: { pattern, colorHex: "#FFFFFF", secondaryColorHex: "#3B1F35", density: 0.5 },
  };
}

export function frenchTipLayer(nail, style = "classic", preset = "medium") {
  const presetData = FRENCH_TIP_PRESETS[preset] || FRENCH_TIP_PRESETS.medium;
  return {
    id: uid("frenchTip"), type: "frenchTip", name: "French Tip", visible: true, locked: false, opacity: 1, order: 99,
    transform: safeTransform({ x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, nail, "frenchTip"),
    data: normalizeFrenchTipData({ ...presetData, style, preset, colorHex: "#FFFFFF" }),
  };
}

export function applyFrenchTipToSlots(blueprint, sourceLayer, slots = []) {
  if (!sourceLayer || sourceLayer.type !== "frenchTip") return blueprint;
  const targets = new Set(slots);
  return { ...blueprint, nails: blueprint.nails.map((nail) => {
    if (!targets.has(nail.slot)) return nail;
    const existing = nail.layers.find((layer) => layer.type === "frenchTip" && layer.id === sourceLayer.id) || nail.layers.find((layer) => layer.type === "frenchTip");
    const layer = {
      ...sourceLayer,
      id: existing?.id || uid("frenchTip"),
      order: existing?.order ?? nail.layers.length,
      transform: safeTransform(sourceLayer.transform, nail, "frenchTip"),
      data: normalizeFrenchTipData(sourceLayer.data),
    };
    const layers = existing
      ? nail.layers.map((item) => item.id === existing.id ? layer : item)
      : [...nail.layers, layer];
    return revalidateNailLayers({ ...nail, layers: renumberLayers(layers) });
  }) };
}

export function isReusableDrawingLayer(layer) {
  return layer?.type === "drawing" && layer.locked !== true && layer.visible !== false;
}

export function drawingLayer(nail, tool = "solid") {
  return {
    id: uid("drawing"), type: "drawing", name: "Drawing Layer", visible: true, locked: false, opacity: 1, order: 99,
    transform: safeTransform({ x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, nail, "drawing"),
    data: { tool, strokes: [] },
  };
}

export function addLayerToBlueprint(blueprint, layer) {
  return updateActiveNail(blueprint, (nail) => ({ ...nail, layers: renumberLayers([...nail.layers, { ...layer, order: nail.layers.length }]) }));
}

export function addStrokeToDrawingLayer(blueprint, stroke, tool = "solid", preferredLayerId = "") {
  let drawingId = preferredLayerId || "";
  let created = false;
  const next = updateActiveNail(blueprint, (nail) => {
    const preferred = drawingId
      ? nail.layers.find((layer) => layer.id === drawingId && isReusableDrawingLayer(layer))
      : null;
    const drawing = preferred || nail.layers.find(isReusableDrawingLayer);
    if (drawing) {
      drawingId = drawing.id;
      return {
        ...nail,
        layers: nail.layers.map((layer) => (layer.id === drawing.id
          ? { ...layer, data: { ...layer.data, tool, strokes: [...(layer.data?.strokes || []), stroke] } }
          : layer)),
      };
    }
    const layer = drawingLayer(nail, tool);
    drawingId = layer.id;
    created = true;
    return {
      ...nail,
      layers: renumberLayers([
        ...nail.layers,
        { ...layer, data: { ...layer.data, tool, strokes: [stroke] }, order: nail.layers.length },
      ]),
    };
  });
  return { blueprint: next, layerId: drawingId, created };
}


export const LEFT_HAND_SLOTS = ["left-thumb", "left-index", "left-middle", "left-ring", "left-pinky"];
export const RIGHT_HAND_SLOTS = ["right-thumb", "right-index", "right-middle", "right-ring", "right-pinky"];
export const FULL_SET_SLOTS = [...LEFT_HAND_SLOTS, ...RIGHT_HAND_SLOTS];
export const DEFAULT_ACTIVE_SLOT = "right-index";
export const STYLE_CATEGORIES = ["Minimal", "French", "Glam", "Abstract", "Bridal", "Seasonal", "Custom"];

export function slotLabel(slot = "") {
  const finger = String(slot).split("-").pop() || slot;
  return finger.charAt(0).toUpperCase() + finger.slice(1);
}

function defaultNailForSlot(slot, design = {}) {
  return {
    id: `nail-${slot}`,
    slot,
    shape: SHAPES.includes(design.shape) ? design.shape : "Almond",
    length: clamp(design.length ?? 0.5, 0, 1),
    width: clamp(design.width ?? 0.5, 0, 1),
    ...defaultShapeControls(design),
    baseColorHex: normalizeHex(design.baseColorHex),
    layers: [createBaseLayer(design)],
    metadata: {},
  };
}

export function createFullSetBlueprint(design = {}) {
  const nails = FULL_SET_SLOTS.map((slot) => defaultNailForSlot(slot, design));
  const active = nails.find((nail) => nail.slot === DEFAULT_ACTIVE_SLOT) || nails[0];
  return {
    schemaVersion: 1,
    canvas: { mode: "full-set", activeNailId: active.id },
    nails,
    metadata: {
      tags: normalizeTags(design.tags || []),
      internalNotes: String(design.internalNotes || ""),
      estimatedServicePrice: design.estimatedServicePrice ?? "",
      styleCategory: STYLE_CATEGORIES.includes(design.styleCategory) ? design.styleCategory : "Custom",
    },
  };
}

function revalidateNailLayers(nail) {
  return {
    ...nail,
    layers: renumberLayers((nail.layers || []).map((layer) => {
      if (ASSET_LAYER_TYPES.has(layer.type)) return { ...layer, transform: constrainAssetTransform(layer.transform, nail, layer) };
      if (layer.type === "drawing") return { ...layer, transform: safeTransform(layer.transform, nail, layer.type), data: { ...layer.data, strokes: (layer.data?.strokes || []).map((stroke) => ({ ...stroke, points: constrainStrokePoints(stroke.points || [], nail) })) } };
      return { ...layer, transform: safeTransform(layer.transform, nail, layer.type) };
    })),
  };
}

export function revalidateAllNails(blueprint) {
  return { ...blueprint, nails: (blueprint.nails || []).map(revalidateNailLayers) };
}

export function ensureFullSetBlueprint(input, design = {}) {
  const normalized = ensureBlueprint(input, design);
  const existingBySlot = new Map();
  const usedIds = new Set();
  normalized.nails.forEach((nail, index) => {
    const slot = FULL_SET_SLOTS.includes(nail.slot) ? nail.slot : (index === 0 ? DEFAULT_ACTIVE_SLOT : FULL_SET_SLOTS[index]);
    if (!existingBySlot.has(slot)) existingBySlot.set(slot, { ...nail, slot });
  });
  const nails = FULL_SET_SLOTS.map((slot) => {
    const nail = existingBySlot.get(slot) || defaultNailForSlot(slot, design);
    let id = String(nail.id || `nail-${slot}`).trim() || `nail-${slot}`;
    if (usedIds.has(id)) id = `nail-${slot}`;
    let suffix = 2;
    while (usedIds.has(id)) id = `nail-${slot}-${suffix++}`;
    usedIds.add(id);
    return { ...nail, id, slot, metadata: nail.metadata && typeof nail.metadata === "object" ? { ...nail.metadata } : {} };
  });
  const previousActive = normalized.canvas?.activeNailId;
  const active = nails.find((nail) => nail.id === previousActive) || nails.find((nail) => nail.slot === DEFAULT_ACTIVE_SLOT) || nails[0];
  return {
    schemaVersion: 1,
    canvas: { ...(normalized.canvas || {}), mode: "full-set", activeNailId: active.id },
    nails,
    metadata: {
      ...normalized.metadata,
      tags: normalizeTags(normalized.metadata?.tags || design.tags || []),
      internalNotes: String(normalized.metadata?.internalNotes || ""),
      estimatedServicePrice: normalized.metadata?.estimatedServicePrice ?? "",
      styleCategory: STYLE_CATEGORIES.includes(normalized.metadata?.styleCategory) ? normalized.metadata.styleCategory : "Custom",
    },
  };
}

export function getNailBySlot(blueprint, slot) {
  return blueprint?.nails?.find((nail) => nail.slot === slot) || null;
}

export function setActiveNailBySlot(blueprint, slot) {
  const nail = getNailBySlot(blueprint, slot);
  return nail ? { ...blueprint, canvas: { ...blueprint.canvas, activeNailId: nail.id } } : blueprint;
}

function cloneLayerForNail(layer, destinationNail) {
  const cloned = { ...layer, id: layer.type === "base" ? "base-layer" : uid(layer.type), locked: layer.type === "base" ? true : Boolean(layer.locked), data: { ...(layer.data || {}) }, transform: { ...(layer.transform || {}) } };
  if (cloned.type === "drawing") cloned.data.strokes = (cloned.data.strokes || []).map((stroke) => ({ ...stroke, id: uid("stroke"), points: constrainStrokePoints(stroke.points || [], destinationNail) }));
  if (ASSET_LAYER_TYPES.has(cloned.type)) cloned.transform = constrainAssetTransform(cloned.transform, destinationNail, cloned);
  else cloned.transform = safeTransform(cloned.transform, destinationNail, cloned.type);
  return cloned;
}

export function cloneNailDesign(sourceNail, destinationNail) {
  const base = sourceNail.layers?.find((layer) => layer.type === "base") || createBaseLayer(sourceNail);
  const next = {
    ...destinationNail,
    shape: sourceNail.shape,
    length: sourceNail.length,
    width: sourceNail.width,
    taper: sourceNail.taper ?? 0.5,
    apexHeight: sourceNail.apexHeight ?? 0.5,
    sidewallCurve: sourceNail.sidewallCurve ?? 0.5,
    freeEdgeThickness: sourceNail.freeEdgeThickness ?? 0.5,
    baseColorHex: normalizeHex(sourceNail.baseColorHex, destinationNail.baseColorHex),
    metadata: { ...(destinationNail.metadata || {}), copiedFromSlot: sourceNail.slot },
  };
  next.layers = renumberLayers((sourceNail.layers || [base]).map((layer) => cloneLayerForNail(layer, next)));
  return revalidateNailLayers(next);
}

export function copyNailToSlots(blueprint, sourceSlot, destinationSlots = []) {
  const source = getNailBySlot(blueprint, sourceSlot);
  if (!source) return blueprint;
  const destinations = new Set(destinationSlots.filter((slot) => slot !== sourceSlot));
  return { ...blueprint, nails: blueprint.nails.map((nail) => destinations.has(nail.slot) ? cloneNailDesign(source, nail) : nail) };
}

export function mirrorHandDesign(blueprint, fromHand = "left") {
  const fromSlots = fromHand === "left" ? LEFT_HAND_SLOTS : RIGHT_HAND_SLOTS;
  const toSlots = fromHand === "left" ? RIGHT_HAND_SLOTS : LEFT_HAND_SLOTS;
  let next = blueprint;
  fromSlots.forEach((slot, index) => { next = copyNailToSlots(next, slot, [toSlots[index]]); });
  return next;
}

export function applyBaseToSlots(blueprint, patch = {}, slots = []) {
  const targets = new Set(slots);
  return {
    ...blueprint,
    nails: blueprint.nails.map((nail) => {
      if (!targets.has(nail.slot)) return nail;
      const resolvedBaseColor = normalizeHex(patch.baseColorHex ?? patch.colorHex ?? nail.baseColorHex, nail.baseColorHex);
      return revalidateNailLayers({
        ...nail,
        ...patch,
        baseColorHex: resolvedBaseColor,
        layers: nail.layers.map((layer) => {
          if (layer.type !== "base") return layer;
          const resolvedLayerColor = normalizeHex(patch.baseColorHex ?? patch.colorHex ?? layer.data.colorHex, layer.data.colorHex);
          const data = {
            ...layer.data,
            ...patch,
            colorHex: resolvedLayerColor,
            effect: EFFECTS.includes(patch.effect) ? patch.effect : layer.data.effect,
            effectColorHex: normalizeHex(patch.effectColorHex ?? layer.data.effectColorHex, layer.data.effectColorHex),
          };
          if (POLISH_TYPES.includes(patch.polishType)) data.polishType = patch.polishType;
          else if (POLISH_TYPES.includes(layer.data.polishType)) data.polishType = layer.data.polishType;
          else delete data.polishType;
          return { ...layer, data: normalizePolishData(data, resolvedLayerColor) };
        }),
      });
    }),
  };
}

export function resetNailDesign(blueprint, slot) {
  return { ...blueprint, nails: blueprint.nails.map((nail) => nail.slot === slot ? { ...nail, baseColorHex: normalizeHex(nail.baseColorHex), layers: [createBaseLayer(nail)] } : nail) };
}

export function summarizeFullSetAssets(blueprint) {
  const summary = { nailCount: 0, charmsByAssetId: {}, jewelsByAssetId: {}, decalsByAssetId: {}, visibleDrawingLayerCount: 0, visibleGradientLayerCount: 0, visiblePatternLayerCount: 0, visibleFrenchTipLayerCount: 0 };
  for (const nail of blueprint?.nails || []) {
    summary.nailCount += 1;
    for (const layer of nail.layers || []) {
      if (layer.visible === false) continue;
      if (ASSET_LAYER_TYPES.has(layer.type) && assetFitsNailSilhouette(layer.transform, nail, layer)) {
        const key = layer.data?.assetId || "unknown";
        const bucket = layer.type === "charm" ? summary.charmsByAssetId : layer.type === "jewel" ? summary.jewelsByAssetId : summary.decalsByAssetId;
        bucket[key] = (bucket[key] || 0) + 1;
      }
      if (layer.type === "drawing") summary.visibleDrawingLayerCount += 1;
      if (layer.type === "gradient") summary.visibleGradientLayerCount += 1;
      if (layer.type === "pattern") summary.visiblePatternLayerCount += 1;
      if (layer.type === "frenchTip") summary.visibleFrenchTipLayerCount += 1;
    }
  }
  return summary;
}


export function quantitySummary(blueprint) {
  const nail = getActiveNail(blueprint);
  const counts = { charm: 0, jewel: 0, decal: 0 };
  for (const layer of nail.layers) {
    if (counts[layer.type] !== undefined && layer.visible !== false && assetFitsNailSilhouette(layer.transform, nail, layer)) counts[layer.type] += 1;
  }
  return counts;
}
