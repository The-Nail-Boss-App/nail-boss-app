/**
 * @typedef {Object} NailMaterialPreset
 * @property {string} id
 * @property {number} opacity
 * @property {number} translucency
 * @property {number} roughness
 * @property {number} smoothness
 * @property {number} specularStrength
 * @property {number} reflectionStrength
 * @property {number} diffusion
 * @property {number} transmission
 * @property {number} scattering
 * @property {number} thicknessInfluence
 * @property {number} metallic
 * @property {number} clearCoat
 * @property {number} clearCoatRoughness
 */

/** @typedef {'texture'|'roughness'|'reflection'|'normal'|'height'|'gloss'|'noise'|'detail'} NailMaterialMapKind */

const clamp01 = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.min(1, Math.max(0, numeric)) : fallback;
};

const preset = (id, values) => Object.freeze({ id, ...values });

/** Central, color-independent optical presets used by every polish surface. */
export const NAIL_MATERIAL_PRESETS = Object.freeze({
  Cream: preset("cream", { opacity: 1, translucency: 0, roughness: .1, smoothness: .9, specularStrength: .82, reflectionStrength: .72, diffusion: .025, transmission: 0, scattering: .015, thicknessInfluence: .24, metallic: 0, clearCoat: .92, clearCoatRoughness: .07 }),
  Jelly: preset("jelly", { opacity: .68, translucency: .58, roughness: .1, smoothness: .9, specularStrength: .78, reflectionStrength: .82, diffusion: .02, transmission: .48, scattering: .22, thicknessInfluence: .82, metallic: 0, clearCoat: .86, clearCoatRoughness: .08 }),
  Milky: preset("milky", { opacity: .78, translucency: .28, roughness: .38, smoothness: .62, specularStrength: .38, reflectionStrength: .32, diffusion: .44, transmission: .2, scattering: .64, thicknessInfluence: .52, metallic: 0, clearCoat: .48, clearCoatRoughness: .3 }),
  Matte: preset("matte", { opacity: .96, translucency: 0, roughness: .92, smoothness: .08, specularStrength: .08, reflectionStrength: .045, diffusion: .2, transmission: 0, scattering: .12, thicknessInfluence: .2, metallic: 0, clearCoat: .04, clearCoatRoughness: .94 }),
  Glass: preset("glass", { opacity: .3, translucency: .86, roughness: .04, smoothness: .96, specularStrength: .94, reflectionStrength: .94, diffusion: 0, transmission: .88, scattering: .06, thicknessInfluence: .94, metallic: 0, clearCoat: .94, clearCoatRoughness: .03 }),
  "Chrome-ready": preset("chrome-ready", { opacity: 1, translucency: 0, roughness: .08, smoothness: .92, specularStrength: .98, reflectionStrength: .98, diffusion: 0, transmission: 0, scattering: 0, thicknessInfluence: .28, metallic: 0, clearCoat: .78, clearCoatRoughness: .06 }),
  Chrome: preset("chrome", { opacity: 1, translucency: 0, roughness: .04, smoothness: .96, specularStrength: 1, reflectionStrength: 1, diffusion: 0, transmission: 0, scattering: 0, thicknessInfluence: .18, metallic: 1, clearCoat: .72, clearCoatRoughness: .04 }),
  Glitter: preset("glitter", { opacity: .94, translucency: .08, roughness: .2, smoothness: .8, specularStrength: .76, reflectionStrength: .64, diffusion: .02, transmission: .08, scattering: .14, thicknessInfluence: .42, metallic: 0, clearCoat: .78, clearCoatRoughness: .12 }),
});

export const DEFAULT_NAIL_MATERIAL = NAIL_MATERIAL_PRESETS.Cream;

/** Legacy names resolve here, keeping persisted designs schema-neutral. */
export const LEGACY_MATERIAL_ALIASES = Object.freeze({ solid: "Cream", cream: "Cream", jelly: "Jelly", milky: "Milky", matte: "Matte", glass: "Glass", chrome: "Chrome", "chrome-ready": "Chrome-ready", glitter: "Glitter" });

export function resolveNailMaterial(value = "Cream", overrides = {}) {
  const source = typeof value === "string" ? value : value?.id;
  const key = NAIL_MATERIAL_PRESETS[source] ? source : LEGACY_MATERIAL_ALIASES[String(source || "").toLowerCase()] || "Cream";
  const base = NAIL_MATERIAL_PRESETS[key];
  if (!overrides || Object.keys(overrides).length === 0) return base;
  const resolved = { ...base };
  Object.keys(base).forEach((property) => {
    if (property !== "id" && Object.prototype.hasOwnProperty.call(overrides, property)) resolved[property] = clamp01(overrides[property], base[property]);
  });
  return Object.freeze(resolved);
}

const SAFE_MAP_SOURCE = /^(?:data:image\/(?:png|jpeg|webp|gif);base64,|blob:|\/|\.\/|\.\.\/)/i;

/** Invalid and missing maps become null so procedural fallbacks always render. */
export function resolveMaterialMaps(maps = {}) {
  const resolved = {};
  ["texture", "roughness", "reflection", "normal", "height", "gloss", "noise", "detail"].forEach((kind) => {
    const candidate = maps?.[kind];
    resolved[kind] = typeof candidate === "string" && SAFE_MAP_SOURCE.test(candidate) ? candidate : null;
  });
  return Object.freeze(resolved);
}

/** Pigment stays independent of optical behavior. */
export function resolvePigment(input = {}) {
  return Object.freeze({
    baseColor: /^#[\da-f]{6}$/i.test(input.baseColor) ? input.baseColor.toUpperCase() : "#E8A0BF",
    opacity: clamp01(input.opacity, 1),
    saturation: clamp01(input.saturation, 1),
    tint: clamp01(input.tint, 0),
    pigmentStrength: clamp01(input.pigmentStrength, 1),
  });
}
