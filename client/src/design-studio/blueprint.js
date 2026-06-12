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

export function safeTransform(transform = {}, nail, layerType = "asset") {
  const size = Math.max(Math.abs(transform.scaleX ?? 0.18), Math.abs(transform.scaleY ?? 0.18));
  const maxScale = layerType === "jewel" ? 0.24 : 0.34;
  const minScale = layerType === "drawing" || layerType === "pattern" || layerType === "gradient" ? 1 : 0.06;
  const scale = layerType === "drawing" || layerType === "pattern" || layerType === "gradient" ? 1 : clamp(size, minScale, maxScale);
  const margin = layerType === "jewel" || layerType === "charm" || layerType === "decal" ? Math.max(0.07, scale * 0.42) : 0;
  return {
    x: clamp(transform.x ?? 0.5, margin, 1 - margin),
    y: clamp(transform.y ?? 0.5, margin, 1 - margin),
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

export function ensureBlueprint(input, design = {}) {
  const fallback = createDefaultBlueprint(design);
  const source = input && typeof input === "object" ? input : fallback;
  const activeId = source.canvas?.activeNailId || source.nails?.[0]?.id || "nail-1";
  const nails = Array.isArray(source.nails) && source.nails.length ? source.nails : fallback.nails;
  const normalizedNails = nails.slice(0, 1).map((raw, index) => {
    const base = fallback.nails[0];
    const nail = {
      id: String(raw.id || `nail-${index + 1}`).trim() || `nail-${index + 1}`,
      slot: raw.slot || "accent",
      shape: SHAPES.includes(raw.shape) ? raw.shape : base.shape,
      length: clamp(raw.length ?? base.length, 0, 1),
      width: clamp(raw.width ?? base.width, 0, 1),
      baseColorHex: normalizeHex(raw.baseColorHex, base.baseColorHex),
      layers: Array.isArray(raw.layers) ? raw.layers : [],
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

export function quantitySummary(blueprint) {
  const nail = getActiveNail(blueprint);
  const counts = { charm: 0, jewel: 0, decal: 0 };
  for (const layer of nail.layers) if (counts[layer.type] !== undefined) counts[layer.type] += 1;
  return counts;
}
