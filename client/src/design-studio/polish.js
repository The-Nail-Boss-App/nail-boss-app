export const POLISH_TYPES = ["Cream", "Jelly", "Milky", "Matte", "Chrome", "Glitter"];
export const TOP_COATS = ["Gloss", "Matte", "No-Wipe Shine", "Velvet"];
export const POLISH_DEFAULTS = {
  polishType: "Cream",
  colorHex: "#E8A0BF",
  shine: 0.62,
  transparency: 0,
  topCoat: "Gloss",
  sparkleDensity: 0.35,
  sparkleSize: 0.45,
  catEyeAngle: 28,
  catEyeIntensity: 0.65,
  chromeIntensity: 0.7,
};
const HEX = /^#[0-9a-fA-F]{6}$/;
export function polishNeeds() {
  return false;
}
export function clampPolishNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
export const LEGACY_EFFECT_POLISH_TYPE = {
  Solid: "Cream",
  Gradient: "Gradient",
  Chrome: "Cream",
  CatEye: "Cream",
  Marble: "Cream",
};
export const LEGACY_RENDER_POLISH_TYPES = ["Gradient", "Marble"];
export const SURFACE_MATERIAL_PRESETS = ["Cream", "Jelly", "Matte", "Chrome", "Glitter"];
export function hasExplicitPolishType(data = {}) {
  return Object.prototype.hasOwnProperty.call(data, "polishType") && POLISH_TYPES.includes(data.polishType);
}
export function legacyEffectPolishType(data = {}) {
  return LEGACY_EFFECT_POLISH_TYPE[data.effect] || "Cream";
}
export function resolvePolishDataForRender(data = {}, fallbackColor = "#E8A0BF") {
  const normalized = normalizePolishData(data, fallbackColor);
  if (hasExplicitPolishType(data)) return normalized;
  const legacyPolishType = legacyEffectPolishType(data);
  if (legacyPolishType === "Cream") return normalized;
  return { ...normalized, polishType: legacyPolishType };
}
export function normalizePolishData(data = {}, fallbackColor = "#E8A0BF") {
  const hasValidPolishType = hasExplicitPolishType(data);
  const legacyPolishType = legacyEffectPolishType(data);
  const preserveAbsentLegacyPolishType = !hasValidPolishType && legacyPolishType !== "Cream";
  const polishType = hasValidPolishType ? data.polishType : "Cream";
  const topCoat = TOP_COATS.includes(data.topCoat) ? data.topCoat : (polishType === "Matte" ? "Matte" : "Gloss");
  const normalized = {
    ...data,
    polishType,
    colorHex: HEX.test(data.colorHex || "") ? data.colorHex.toUpperCase() : fallbackColor,
    shine: clampPolishNumber(data.shine, 0, 1, polishType === "Matte" ? 0.08 : POLISH_DEFAULTS.shine),
    transparency: clampPolishNumber(data.transparency, 0, 1, polishType === "Jelly" ? 0.45 : polishType === "Milky" ? 0.28 : 0),
    topCoat,
    sparkleDensity: clampPolishNumber(data.sparkleDensity, 0, 1, POLISH_DEFAULTS.sparkleDensity),
    sparkleSize: clampPolishNumber(data.sparkleSize, 0, 1, POLISH_DEFAULTS.sparkleSize),
    catEyeAngle: clampPolishNumber(data.catEyeAngle, -180, 180, POLISH_DEFAULTS.catEyeAngle),
    catEyeIntensity: clampPolishNumber(data.catEyeIntensity, 0, 1, POLISH_DEFAULTS.catEyeIntensity),
    chromeIntensity: clampPolishNumber(data.chromeIntensity, 0, 1, POLISH_DEFAULTS.chromeIntensity),
  };
  if (preserveAbsentLegacyPolishType) delete normalized.polishType;
  return normalized;
}
export function polishOpacity(data = {}) {
  const type = data.polishType || "Cream";
  const base = type === "Jelly" ? 0.72 : type === "Milky" ? 0.76 : 1;
  const transparencyImpact = type === "Jelly" ? 0.22 : 0.45;
  return Math.max(0.05, Math.min(1, base - (data.transparency || 0) * transparencyImpact));
}


export function polishSurfacePreset(data = {}) {
  if (SURFACE_MATERIAL_PRESETS.includes(data.materialPreset)) return data.materialPreset;
  if (data.effect === "Chrome") return "Chrome";
  if (data.effect === "Glitter" || data.pattern === "glitter" || data.glitter === true) return "Glitter";
  if (data.polishType === "Jelly") return "Jelly";
  if (data.polishType === "Matte") return "Matte";
  if (data.polishType === "Chrome") return "Chrome";
  if (data.polishType === "Glitter") return "Glitter";
  return "Cream";
}

export function polishMaterialProfile(polishType = "Cream", shine = 0.62) {
  if (polishType === "Matte") {
    return { gloss: 0.035, reflection: 0.045, apex: 0.10, depth: 0.72, edge: 0.50, blur: 2.8, diffusion: 0.035, glass: 0.04, colorPreservation: 0.96, microTexture: 0.22, metallic: 0, sparkle: 0 };
  }
  if (polishType === "Chrome") {
    return { gloss: Math.max(0.96, shine), reflection: 1, apex: 0.82, depth: 0.92, edge: 0.92, blur: 0.36, diffusion: 0, glass: 0.44, colorPreservation: 0.78, microTexture: 0.02, metallic: 1, sparkle: 0.16 };
  }
  if (polishType === "Glitter") {
    return { gloss: Math.max(0.8, shine), reflection: 0.78, apex: 0.64, depth: 0.86, edge: 0.78, blur: 0.8, diffusion: 0.018, glass: 0.34, colorPreservation: 0.84, microTexture: 0.12, metallic: 0.30, sparkle: 1 };
  }
  if (polishType === "Jelly") {
    return { gloss: Math.max(0.86, shine), reflection: 0.82, apex: 0.62, depth: 1, edge: 0.84, blur: 0.72, diffusion: 0.01, glass: 0.68, colorPreservation: 0.88, microTexture: 0.02, metallic: 0, sparkle: 0 };
  }
  if (polishType === "Milky") {
    return { gloss: Math.min(0.56, shine), reflection: 0.32, apex: 0.72, depth: 0.72, edge: 0.52, blur: 1.45, diffusion: 0.44, glass: 0.18, colorPreservation: 0.68, microTexture: 0.08, metallic: 0, sparkle: 0 };
  }
  return { gloss: shine, reflection: 0.68, apex: 0.56, depth: 0.78, edge: 0.62, blur: 1, diffusion: 0.04, glass: 0.2, colorPreservation: 0.88, microTexture: 0.04, metallic: 0, sparkle: 0 };
}
