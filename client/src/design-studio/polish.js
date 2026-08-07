import { resolveNailMaterial } from "./materialFoundation.js";

export const POLISH_TYPES = ["Cream", "Jelly", "Milky", "Matte", "Glass", "Chrome-ready", "Chrome", "Glitter"];
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
export const SURFACE_MATERIAL_PRESETS = ["Cream", "Jelly", "Matte", "Glass", "Chrome-ready", "Chrome", "Glitter"];
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
  if (SURFACE_MATERIAL_PRESETS.includes(data.polishType)) return data.polishType;
  if (data.effect === "Chrome") return "Chrome";
  if (data.effect === "Glitter" || data.pattern === "glitter" || data.glitter === true) return "Glitter";
  if (data.polishType === "Jelly") return "Jelly";
  if (data.polishType === "Matte") return "Matte";
  if (data.polishType === "Chrome") return "Chrome";
  if (data.polishType === "Glitter") return "Glitter";
  return "Cream";
}

export function polishMaterialProfile(polishType = "Cream", shine = 0.62) {
  const material = resolveNailMaterial(polishType);
  const userShine = clampPolishNumber(shine, 0, 1, material.smoothness);
  // Cream's shine control modulates its optical top layer, while the opaque
  // pigment remains untouched. This preserves the existing control contract
  // without making low-shine Cream translucent or desaturated.
  const creamShineResponse = material.id === "cream" ? .55 + userShine * .45 : 1;
  return {
    ...material,
    gloss: material.id === "matte" ? Math.min(.08, userShine) : Math.max(material.smoothness, userShine),
    reflection: material.reflectionStrength * creamShineResponse,
    apex: material.specularStrength * creamShineResponse,
    clearCoat: material.clearCoat * creamShineResponse,
    depth: Math.max(.2, material.thicknessInfluence),
    edge: Math.max(.18, material.thicknessInfluence),
    blur: .35 + material.roughness * 2.65,
    glass: material.translucency,
    colorPreservation: 1 - material.diffusion * .5,
    microTexture: material.roughness * .24,
    sparkle: material.id === "glitter" ? 1 : 0,
  };
}
