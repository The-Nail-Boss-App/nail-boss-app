import { normalizeMarbleSetCoordination } from './marbleSetCoordination';

export const FINISH_DEFAULTS = Object.freeze({
  Cream: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .68 },
  Gradient: { colorA: '#D94C70', colorB: '#7D2E68', direction: 90, opacity: 1, viscosity: .62, shine: .68 },
  Chrome: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .9, metallicReflection: .7 },
  'Cat Eye': { baseColor: '#521A46', stripeDirection: 22, stripeWidth: .18, stripeStrength: .88, opacity: 1, viscosity: .68, shine: .76 },
  Marble: { baseColor: '#F1CAD8', veinColor: '#8A405D', veinDensity: .42, marbleSeed: 'marble-layout-v1', marbleGeometryVersion: 2, marbleTransform: Object.freeze({ panX: 0, panY: 0, scale: 1, rotation: 0 }), streamOverrides: Object.freeze({}), customStreams: Object.freeze({}), deletedStreamIds: Object.freeze([]), opacity: 1, viscosity: .72, shine: .58 },
  Aura: { baseColor: '#F9DDE8', centerColor: '#FFEAF2', auraColor: '#FF5EA8', softness: .86, intensity: .68, opacity: 1, viscosity: .62, shine: .68 },
  Jelly: { baseColor: '#D94C70', translucency: .52, opacity: 1, viscosity: .46, shine: .74 },
  Matte: { baseColor: '#D94C70', opacity: 1, viscosity: .66, shine: .08, matteSoftness: .72 },
  Glass: { baseColor: '#D94C70', translucency: .28, opacity: .82, viscosity: .44, shine: .92, glassClarity: .78 },
  'Chrome-ready': { baseColor: '#D94C70', opacity: 1, viscosity: .64, shine: .88, metallicReflection: .35 },
  Shimmer: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .8, shimmerIntensity: .42 },
  Metallic: { baseColor: '#D94C70', opacity: 1, viscosity: .66, shine: .9, metallicReflection: .76 },
  Glitter: { baseColor: '#D94C70', fleckColor: '#E8D7A8', opacity: 1, viscosity: .7, shine: .82, glitterDensity: .46 },
});

// DS-03.3 exposes only materials whose dedicated renderer is complete. The
// defaults above intentionally remain intact so persisted formulations keep
// normalizing and rendering without data loss.
export const VISIBLE_POLISH_FINISHES = Object.freeze(['Cream', 'Matte', 'Jelly', 'Glitter']);

export const COLOR_BLOCK_DEFAULTS = Object.freeze({ primaryColor: '#D94C70', secondaryColor: '#F5E7EC', direction: 'vertical', splitPosition: .5, opacity: 1, viscosity: .62, shine: .68 });
export const NEGATIVE_SPACE_DEFAULTS = Object.freeze({ type: 'vertical-band', position: .5, size: .26, rotation: 45 });

export function colorBlockEffect(parameters = {}) {
  return { id: 'ColorBlock', version: '1', parameters: { ...COLOR_BLOCK_DEFAULTS, ...parameters } };
}

export function negativeSpaceEffect(parameters = {}) {
  return { id: 'NegativeSpace', version: '1', parameters: { ...NEGATIVE_SPACE_DEFAULTS, ...parameters } };
}

const SHARED = ['opacity', 'viscosity', 'shine'];
const SPECIFIC = {
  Gradient: ['colorB', 'direction'], Chrome: ['metallicReflection'], 'Cat Eye': ['stripeDirection', 'stripeWidth', 'stripeStrength'],
  Marble: ['veinColor', 'veinDensity', 'marbleSeed', 'marbleGeometryVersion', 'marbleTransform', 'streamOverrides', 'customStreams', 'deletedStreamIds', 'marbleSetCoordination'], Aura: ['centerColor', 'auraColor', 'softness', 'intensity'], Jelly: ['translucency'], Matte: ['matteSoftness'], Glass: ['translucency', 'glassClarity'],
  'Chrome-ready': ['metallicReflection'], Shimmer: ['shimmerIntensity'], Metallic: ['metallicReflection'], Glitter: ['fleckColor', 'glitterDensity'],
};

/** The only boundary at which persisted or edited polish data changes finish. */
export function normalizePolishForFinish(polish = {}, requestedFinish = 'Cream', { marbleGeometryFallback = 2 } = {}) {
  const finish = FINISH_DEFAULTS[requestedFinish] ? requestedFinish : 'Cream';
  if (finish !== requestedFinish && typeof console !== 'undefined') console.warn(`Unsupported polish finish "${requestedFinish}" normalized to Cream.`);
  const defaults = FINISH_DEFAULTS[finish];
  const requestedColor = polish.colorHex || polish.baseColor || polish.colorA || polish.glitter?.baseColor || '';
  const colorHex = /^#[0-9a-f]{6}$/i.test(requestedColor) ? requestedColor.toUpperCase() : defaults.baseColor || defaults.colorA;
  const normalized = { name: polish.name || 'Blush Royalty', brand: polish.brand || 'AnitaSet Atelier', collection: polish.collection || 'AnitaSet Atelier', size: polish.size || '15 ml', colorHex, finish };
  [...SHARED, ...(SPECIFIC[finish] || [])].forEach((key) => { normalized[key] = polish[key] ?? defaults[key]; });
  if (finish === 'Marble') {
    normalized.veinColor = /^#[0-9a-f]{6}$/i.test(polish.veinColor || '') ? polish.veinColor.toUpperCase() : defaults.veinColor;
    const density = Number(polish.veinDensity);
    normalized.veinDensity = Number.isFinite(density) ? Math.min(1, Math.max(0, density)) : defaults.veinDensity;
    normalized.marbleSeed = typeof polish.marbleSeed === 'string' && polish.marbleSeed.length > 0 && polish.marbleSeed.length <= 128 ? polish.marbleSeed : defaults.marbleSeed;
    normalized.marbleGeometryVersion = [1, 2].includes(polish.marbleGeometryVersion) ? polish.marbleGeometryVersion : marbleGeometryFallback;
    const transform = polish.marbleTransform || {};
    const clamp = (value, min, max, fallback) => Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
    normalized.marbleTransform = { panX: clamp(transform.panX, -120, 120, 0), panY: clamp(transform.panY, -180, 180, 0), scale: clamp(transform.scale, .55, 2.5, 1), rotation: clamp(transform.rotation, -180, 180, 0) };
    normalized.streamOverrides = polish.streamOverrides && typeof polish.streamOverrides === 'object' && !Array.isArray(polish.streamOverrides) ? polish.streamOverrides : {};
    normalized.customStreams = polish.customStreams && typeof polish.customStreams === 'object' && !Array.isArray(polish.customStreams) ? polish.customStreams : {};
    normalized.deletedStreamIds = Array.isArray(polish.deletedStreamIds) ? polish.deletedStreamIds : [];
    normalized.marbleSetCoordination = normalizeMarbleSetCoordination(polish.marbleSetCoordination);
  }
  if (finish === 'Glitter') {
    // Older saves have no fleck color. This fixed warm-silver fallback remains
    // stable across hydration and deliberately independent of base pigment.
    normalized.fleckColor = /^#[0-9a-f]{6}$/i.test(polish.fleckColor || polish.glitter?.fleckColor || '')
      ? (polish.fleckColor || polish.glitter.fleckColor).toUpperCase() : defaults.fleckColor;
    const requestedDensity = Number(polish.glitterDensity ?? polish.glitter?.density ?? defaults.glitterDensity);
    normalized.glitterDensity = Number.isFinite(requestedDensity) ? Math.min(1, Math.max(0, requestedDensity)) : defaults.glitterDensity;
    normalized.glitter = Object.freeze({ baseColor: colorHex, fleckColor: normalized.fleckColor, density: normalized.glitterDensity });
  }
  return normalized;
}

/** Produces the strict, supported parameter schema consumed by the Hero engine. */
export function heroEffectForPolish(polish) {
  const p = normalizePolishForFinish(polish, polish.finish);
  const id = ({ Cream: 'Solid', Matte: 'Solid', Glitter: 'Solid', Glass: 'Jelly', 'Chrome-ready': 'Chrome', Shimmer: 'Chrome', Metallic: 'Chrome' })[p.finish] || p.finish;
  const parameters = { [id === 'Gradient' ? 'colorA' : 'baseColor']: p.colorHex, opacity: p.opacity, viscosity: p.viscosity, shine: p.shine };
  const allowed = { Gradient: ['colorB', 'direction'], 'Cat Eye': ['stripeDirection', 'stripeWidth', 'stripeStrength'], Marble: ['veinColor', 'veinDensity', 'marbleSeed', 'marbleGeometryVersion', 'marbleTransform', 'streamOverrides', 'customStreams', 'deletedStreamIds', 'marbleSetCoordination'], Aura: ['centerColor', 'auraColor', 'softness', 'intensity'], Jelly: ['translucency'] }[id] || [];
  allowed.forEach((key) => { parameters[key] = p[key] ?? FINISH_DEFAULTS[p.finish][key]; });
  return { id, version: '1', parameters };
}

/** Converts the legacy center-glow gradient payload without rewriting stored data. */
export function normalizePersistedAuraEffect(effect) {
  const parameters = effect?.parameters || effect?.data || {};
  const isAura = effect?.id === 'Aura' || effect?.type === 'Aura' ||
    ((effect?.id === 'Gradient' || effect?.type === 'gradient') && parameters.direction === 'aura');
  if (!isAura) return null;
  const stops = Array.isArray(parameters.gradientStops) ? parameters.gradientStops : [];
  return heroEffectForPolish(normalizePolishForFinish({
    ...parameters, finish: 'Aura',
    baseColor: parameters.baseColor || parameters.colorB || stops.at(-1)?.color,
    centerColor: parameters.centerColor || parameters.colorA || stops[0]?.color,
    auraColor: parameters.auraColor || stops[Math.floor(stops.length / 2)]?.color || parameters.colorB,
    intensity: parameters.intensity ?? effect.opacity,
  }, 'Aura'));
}

export function polishSignature(polish) {
  const p = normalizePolishForFinish(polish, polish.finish);
  return [p.colorHex, p.finish, p.opacity, p.viscosity, p.shine, ...(SPECIFIC[p.finish] || []).map((key) => p[key])].join('|');
}
