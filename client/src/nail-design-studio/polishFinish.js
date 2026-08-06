export const FINISH_DEFAULTS = Object.freeze({
  Cream: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .68 },
  Gradient: { colorA: '#D94C70', colorB: '#7D2E68', direction: 90, opacity: 1, viscosity: .62, shine: .68 },
  Chrome: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .9, metallicReflection: .7 },
  'Cat Eye': { baseColor: '#521A46', stripeDirection: 22, stripeWidth: .18, stripeStrength: .88, opacity: 1, viscosity: .68, shine: .76 },
  Marble: { baseColor: '#F1CAD8', veinColor: '#8A405D', veinDensity: .42, opacity: 1, viscosity: .72, shine: .58 },
  Jelly: { baseColor: '#D94C70', translucency: .52, opacity: 1, viscosity: .46, shine: .74 },
  Matte: { baseColor: '#D94C70', opacity: 1, viscosity: .66, shine: .08, matteSoftness: .72 },
  Glass: { baseColor: '#D94C70', translucency: .28, opacity: .82, viscosity: .44, shine: .92, glassClarity: .78 },
  'Chrome-ready': { baseColor: '#D94C70', opacity: 1, viscosity: .64, shine: .88, metallicReflection: .35 },
  Shimmer: { baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .8, shimmerIntensity: .42 },
  Metallic: { baseColor: '#D94C70', opacity: 1, viscosity: .66, shine: .9, metallicReflection: .76 },
  Glitter: { baseColor: '#D94C70', opacity: 1, viscosity: .7, shine: .82, glitterDensity: .46 },
});

const SHARED = ['opacity', 'viscosity', 'shine'];
const SPECIFIC = {
  Gradient: ['colorB', 'direction'], Chrome: ['metallicReflection'], 'Cat Eye': ['stripeDirection', 'stripeWidth', 'stripeStrength'],
  Marble: ['veinColor', 'veinDensity'], Jelly: ['translucency'], Matte: ['matteSoftness'], Glass: ['translucency', 'glassClarity'],
  'Chrome-ready': ['metallicReflection'], Shimmer: ['shimmerIntensity'], Metallic: ['metallicReflection'], Glitter: ['glitterDensity'],
};

/** The only boundary at which persisted or edited polish data changes finish. */
export function normalizePolishForFinish(polish = {}, requestedFinish = 'Cream') {
  const finish = FINISH_DEFAULTS[requestedFinish] ? requestedFinish : 'Cream';
  if (finish !== requestedFinish && typeof console !== 'undefined') console.warn(`Unsupported polish finish "${requestedFinish}" normalized to Cream.`);
  const defaults = FINISH_DEFAULTS[finish];
  const colorHex = /^#[0-9a-f]{6}$/i.test(polish.colorHex || polish.baseColor || polish.colorA || '') ? (polish.colorHex || polish.baseColor || polish.colorA).toUpperCase() : defaults.baseColor || defaults.colorA;
  const normalized = { name: polish.name || 'Blush Royalty', brand: polish.brand || 'AnitaSet Atelier', collection: polish.collection || 'AnitaSet Atelier', size: polish.size || '15 ml', colorHex, finish };
  [...SHARED, ...(SPECIFIC[finish] || [])].forEach((key) => { normalized[key] = polish[key] ?? defaults[key]; });
  return normalized;
}

/** Produces the strict, supported parameter schema consumed by the Hero engine. */
export function heroEffectForPolish(polish) {
  const p = normalizePolishForFinish(polish, polish.finish);
  const id = ({ Cream: 'Solid', Matte: 'Solid', Glass: 'Jelly', 'Chrome-ready': 'Chrome', Shimmer: 'Chrome', Metallic: 'Chrome', Glitter: 'Chrome' })[p.finish] || p.finish;
  const parameters = { [id === 'Gradient' ? 'colorA' : 'baseColor']: p.colorHex, opacity: p.opacity, viscosity: p.viscosity, shine: p.shine };
  const allowed = { Gradient: ['colorB', 'direction'], 'Cat Eye': ['stripeDirection', 'stripeWidth', 'stripeStrength'], Marble: ['veinColor', 'veinDensity'], Jelly: ['translucency'] }[id] || [];
  allowed.forEach((key) => { parameters[key] = p[key] ?? FINISH_DEFAULTS[p.finish][key]; });
  return { id, version: '1', parameters };
}

export function polishSignature(polish) {
  const p = normalizePolishForFinish(polish, polish.finish);
  return [p.colorHex, p.finish, p.opacity, p.viscosity, p.shine, ...(SPECIFIC[p.finish] || []).map((key) => p[key])].join('|');
}
