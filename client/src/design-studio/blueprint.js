export const SHAPES = ["Almond", "Coffin", "Square", "Stiletto", "Oval"];
export const EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];
export const PATTERNS = ["dots", "stripes", "checker", "french-tip", "glitter", "marble"];
export const GRADIENT_DIRECTIONS = ["vertical", "horizontal", "diagonal", "reverse-diagonal"];

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

export function getNailGeometry(nail) {
  const length = clamp(nail?.length ?? 0.5, 0, 1);
  const width = clamp(nail?.width ?? 0.5, 0, 1);
  const nailH = 180 + length * 110;
  const halfW = 38 + width * 50;
  const topY = TIP_BOTTOM - nailH;
  return {
    cx: VIEWBOX.cx,
    topY,
    bottomY: TIP_BOTTOM,
    height: nailH,
    halfW,
    left: VIEWBOX.cx - halfW,
    right: VIEWBOX.cx + halfW,
    width: halfW * 2,
  };
}

export function buildNailPath(shape = "Almond", nail) {
  const { cx, topY, bottomY, halfW, height } = getNailGeometry(nail);
  switch (shape) {
    case "Square":
      return [
        `M ${cx - halfW} ${topY + 12}`,
        `Q ${cx - halfW} ${topY} ${cx - halfW + 12} ${topY}`,
        `L ${cx + halfW - 12} ${topY}`,
        `Q ${cx + halfW} ${topY} ${cx + halfW} ${topY + 12}`,
        `L ${cx + halfW} ${bottomY - 12}`,
        `Q ${cx + halfW} ${bottomY} ${cx + halfW - 12} ${bottomY}`,
        `L ${cx - halfW + 12} ${bottomY}`,
        `Q ${cx - halfW} ${bottomY} ${cx - halfW} ${bottomY - 12}`,
        "Z",
      ].join(" ");
    case "Coffin": {
      const tipHW = halfW * 0.42;
      return [
        `M ${cx - halfW} ${topY + 16}`,
        `Q ${cx - halfW} ${topY} ${cx - halfW + 18} ${topY}`,
        `L ${cx + halfW - 18} ${topY}`,
        `Q ${cx + halfW} ${topY} ${cx + halfW} ${topY + 16}`,
        `L ${cx + halfW * 0.72} ${bottomY - 24}`,
        `L ${cx + tipHW} ${bottomY}`,
        `L ${cx - tipHW} ${bottomY}`,
        `L ${cx - halfW * 0.72} ${bottomY - 24}`,
        "Z",
      ].join(" ");
    }
    case "Stiletto":
      return [
        `M ${cx - halfW} ${topY + 18}`,
        `C ${cx - halfW} ${topY + height * 0.38} ${cx - halfW * 0.24} ${bottomY - height * 0.15} ${cx} ${bottomY}`,
        `C ${cx + halfW * 0.24} ${bottomY - height * 0.15} ${cx + halfW} ${topY + height * 0.38} ${cx + halfW} ${topY + 18}`,
        `Q ${cx} ${topY - 20} ${cx - halfW} ${topY + 18}`,
        "Z",
      ].join(" ");
    case "Oval":
      return [
        `M ${cx - halfW} ${topY + 26}`,
        `C ${cx - halfW} ${topY + height * 0.05} ${cx - halfW * 0.72} ${topY} ${cx} ${topY}`,
        `C ${cx + halfW * 0.72} ${topY} ${cx + halfW} ${topY + height * 0.05} ${cx + halfW} ${topY + 26}`,
        `C ${cx + halfW} ${topY + height * 0.64} ${cx + halfW * 0.62} ${bottomY} ${cx} ${bottomY}`,
        `C ${cx - halfW * 0.62} ${bottomY} ${cx - halfW} ${topY + height * 0.64} ${cx - halfW} ${topY + 26}`,
        "Z",
      ].join(" ");
    case "Almond":
    default:
      return [
        `M ${cx - halfW} ${topY + 24}`,
        `C ${cx - halfW} ${topY + height * 0.08} ${cx - halfW * 0.58} ${topY} ${cx} ${topY}`,
        `C ${cx + halfW * 0.58} ${topY} ${cx + halfW} ${topY + height * 0.08} ${cx + halfW} ${topY + 24}`,
        `C ${cx + halfW} ${topY + height * 0.55} ${cx + halfW * 0.42} ${bottomY - height * 0.07} ${cx} ${bottomY}`,
        `C ${cx - halfW * 0.42} ${bottomY - height * 0.07} ${cx - halfW} ${topY + height * 0.55} ${cx - halfW} ${topY + 24}`,
        "Z",
      ].join(" ");
  }
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
const ASSET_MIN_SCALE = 0.06;

function roundPoint(point) {
  return { x: Number(point.x.toFixed(6)), y: Number(point.y.toFixed(6)) };
}

function normalizedHalfWidthAtY(shape = "Almond", yValue = 0.5) {
  const y = clamp(yValue, 0, 1);
  switch (shape) {
    case "Square": {
      const corner = 0.055;
      if (y < corner) return 0.5 - corner + Math.sqrt(Math.max(0, corner * corner - (corner - y) ** 2));
      if (y > 1 - corner) return 0.5 - corner + Math.sqrt(Math.max(0, corner * corner - (y - (1 - corner)) ** 2));
      return 0.5;
    }
    case "Coffin":
      return y < 0.89 ? 0.5 - y * 0.08 : 0.428 - ((y - 0.89) / 0.11) * 0.218;
    case "Stiletto":
      return 0.5 * (1 - y ** 1.72) * Math.sin(Math.PI * (0.08 + y * 0.84)) ** 0.24;
    case "Oval":
      return 0.5 * Math.sin(Math.PI * y) ** 0.36;
    case "Almond":
    default:
      return 0.5 * Math.sin(Math.PI * y) ** 0.48 * (1 - 0.28 * y ** 1.7);
  }
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
  const half = Math.max(0, normalizedHalfWidthAtY(nail?.shape, y));
  return Math.abs(x - 0.5) <= half + 0.000001;
}

export function projectPointInsideNailSilhouette(point, nail) {
  const y = clamp(point?.y ?? 0.5, 0, 1);
  const half = Math.max(0.000001, normalizedHalfWidthAtY(nail?.shape, y));
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
  const scale = layerType === "drawing" || layerType === "pattern" || layerType === "gradient" ? 1 : clamp(Math.max(Math.abs(transform.scaleX ?? 0.18), Math.abs(transform.scaleY ?? 0.18)), ASSET_MIN_SCALE, 0.34);
  return {
    x: clamp(transform.x ?? 0.5, 0, 1),
    y: clamp(transform.y ?? 0.5, 0, 1),
    scaleX: scale,
    scaleY: scale,
    rotation: clamp(transform.rotation ?? 0, -180, 180),
  };
}

export function createBaseLayer(design = {}) {
  return {
    id: "base-layer",
    type: "base",
    name: "Base Color",
    visible: true,
    locked: true,
    opacity: 1,
    order: 0,
    transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
    data: {
      colorHex: normalizeHex(design.baseColorHex),
      effect: EFFECTS.includes(design.effect) ? design.effect : "Solid",
      effectColorHex: normalizeHex(design.effectColorHex, "#FFFFFF"),
    },
  };
}

export function createDefaultBlueprint(design = {}) {
  const nail = {
    id: "nail-1",
    slot: "accent",
    shape: SHAPES.includes(design.shape) ? design.shape : "Almond",
    length: clamp(design.length ?? 0.5, 0, 1),
    width: clamp(design.width ?? 0.5, 0, 1),
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
  if (!["base", "gradient", "pattern", "drawing", "charm", "decal", "jewel"].includes(layer.type)) return false;
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
    if (!/^#[0-9a-fA-F]{6}$/.test(layer.data.colorHex || "")) return false;
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
      data: { ...layer.data },
    })),
    ...(isPlainObject(nail.metadata) ? { metadata: { ...nail.metadata } } : {}),
  };
}

function normalizeEditableNail(raw, fallback, index) {
  const nail = {
    id: String(raw.id || `nail-${index + 1}`).trim() || `nail-${index + 1}`,
    slot: raw.slot || "accent",
    shape: SHAPES.includes(raw.shape) ? raw.shape : fallback.shape,
    length: clamp(raw.length ?? fallback.length, 0, 1),
    width: clamp(raw.width ?? fallback.width, 0, 1),
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
      data: { ...(layer.data || {}) },
    };
    if (normalized.type === "drawing") {
      normalized.data.strokes = (normalized.data.strokes || []).map((stroke) => ({ ...stroke, points: constrainStrokePoints(stroke.points || [], nail) }));
    }
    if (normalized.type === "base") {
      normalized.id = "base-layer";
      normalized.name = "Base Color";
      normalized.locked = true;
      normalized.order = 0;
      normalized.data = {
        colorHex: normalizeHex(normalized.data.colorHex, nail.baseColorHex),
        effect: EFFECTS.includes(normalized.data.effect) ? normalized.data.effect : "Solid",
        effectColorHex: normalizeHex(normalized.data.effectColorHex, "#FFFFFF"),
      };
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
      };
      return { ...layer, data, locked: true, visible: true, transform: safeTransform(layer.transform, nextNail, "base") };
    });
    return { ...nextNail, baseColorHex: normalizeHex(patch.baseColorHex ?? patch.colorHex ?? nextNail.baseColorHex), layers };
  });
}

export function flatDesignFromBlueprint(blueprint, name) {
  const nail = getActiveNail(blueprint);
  const base = nail.layers.find((layer) => layer.type === "base") || createBaseLayer(nail);
  return {
    name: String(name || "").trim(),
    shape: nail.shape,
    length: nail.length,
    width: nail.width,
    baseColorHex: base.data.colorHex,
    effect: base.data.effect,
    effectColorHex: base.data.effectColorHex,
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

export function quantitySummary(blueprint) {
  const nail = getActiveNail(blueprint);
  const counts = { charm: 0, jewel: 0, decal: 0 };
  for (const layer of nail.layers) {
    if (counts[layer.type] !== undefined && layer.visible !== false && assetFitsNailSilhouette(layer.transform, nail, layer)) counts[layer.type] += 1;
  }
  return counts;
}
