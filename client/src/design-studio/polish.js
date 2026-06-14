export const POLISH_TYPES = ["Cream", "Jelly", "Milky", "Matte", "Chrome", "Cat Eye", "Glitter"];
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
export function polishNeeds(type, key) {
  return (key === "sparkle" && type === "Glitter") || (key === "catEye" && type === "Cat Eye") || (key === "chrome" && type === "Chrome");
}
export function clampPolishNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}
export function normalizePolishData(data = {}, fallbackColor = "#E8A0BF") {
  const polishType = POLISH_TYPES.includes(data.polishType) ? data.polishType : "Cream";
  const topCoat = TOP_COATS.includes(data.topCoat) ? data.topCoat : (polishType === "Matte" ? "Matte" : "Gloss");
  return {
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
}
export function polishOpacity(data = {}) {
  const type = data.polishType || "Cream";
  const base = type === "Jelly" ? 0.58 : type === "Milky" ? 0.76 : 1;
  return Math.max(0.05, Math.min(1, base - (data.transparency || 0) * 0.45));
}
