export const MARBLE_SET_COORDINATION_VERSION = 1;
export const MARBLE_SET_MODES = Object.freeze(['independent', 'coordinated', 'flow']);
export const MARBLE_SET_VARIATIONS = Object.freeze(['low', 'medium', 'high']);

const DEFAULT_STYLE = Object.freeze({
  primary: Object.freeze({ color: '#8A405D', finish: 'Cream' }),
  secondary: Object.freeze({ color: '#A7647D', finish: 'Cream' }),
  hairline: Object.freeze({ color: '#6F3048', finish: 'Cream' }),
});
const hash = (text) => { let value = 2166136261; for (const char of text) { value ^= char.charCodeAt(0); value = Math.imul(value, 16777619); } return value >>> 0; };
const unit = (text) => hash(text) / 4294967295;
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const color = (value, fallback) => /^#[0-9a-f]{6}$/i.test(value || '') ? value.toUpperCase() : fallback;
const finish = (value, fallback) => ['Cream', 'Jelly', 'Matte', 'Glitter'].includes(value) ? value : fallback;

export const createMarbleSetSeed = (nonce = Date.now()) => `marble-set-${hash(`v1|${nonce}`).toString(36)}`;

/** Normalized document-level relationship data. Missing/legacy data is deliberately Independent. */
export function normalizeMarbleSetCoordination(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const mode = MARBLE_SET_MODES.includes(source.mode) ? source.mode : 'independent';
  const variation = MARBLE_SET_VARIATIONS.includes(source.variation) ? source.variation : 'medium';
  const palette = {};
  for (const role of Object.keys(DEFAULT_STYLE)) {
    const item = source.palette?.[role] || source.formulationDefaults?.[role] || {};
    palette[role] = { color: color(item.color, DEFAULT_STYLE[role].color), finish: finish(item.finish, DEFAULT_STYLE[role].finish) };
  }
  return {
    mode, version: MARBLE_SET_COORDINATION_VERSION,
    setSeed: typeof source.setSeed === 'string' && source.setSeed ? source.setSeed.slice(0, 128) : 'marble-set-default-v1',
    participatingNailIds: [...new Set((Array.isArray(source.participatingNailIds) ? source.participatingNailIds : []).filter((id) => typeof id === 'string'))].sort((a, b) => nailOrder(a) - nailOrder(b)),
    flow: { angle: Math.max(-75, Math.min(75, finite(source.flow?.angle, -28))), curvature: Math.max(-1, Math.min(1, finite(source.flow?.curvature, .2))) },
    variation, density: Math.max(0, Math.min(1, finite(source.density, .42))), palette,
  };
}

export const nailOrder = (id) => { const match = String(id).match(/nail-(\d+)$/); return match ? Number(match[1]) : hash(String(id)); };
export const marbleGeometryIdentity = (coordination, nailId) => {
  const set = normalizeMarbleSetCoordination(coordination);
  if (set.mode === 'independent' || !set.participatingNailIds.includes(nailId)) return null;
  // Style is intentionally absent. Only version, persisted seed, mode, flow, variation and stable identity participate.
  return `set-v${set.version}|${set.setSeed}|${set.mode}|${set.flow.angle}|${set.flow.curvature}|${set.variation}|${nailId}`;
};

export function coordinatedMarbleParameters(parameters, coordination, nailId) {
  const set = normalizeMarbleSetCoordination(coordination);
  const identity = marbleGeometryIdentity(set, nailId);
  if (!identity) return { ...parameters };
  const strength = { low: .28, medium: .55, high: .82 }[set.variation];
  const order = set.participatingNailIds.indexOf(nailId);
  const jitter = (unit(`${identity}|variation`) - .5) * strength;
  const flowPan = set.mode === 'flow' ? (order - (set.participatingNailIds.length - 1) / 2) * 34 : 0;
  const generatedStyle = {};
  for (const role of ['primary', 'secondary', 'hairline']) {
    for (let index = 0; index < (role === 'primary' ? 2 : role === 'secondary' ? 4 : 5); index += 1) {
      const id = `${role}-${index}`;
      // Explicit artist formulation wins; otherwise install the set default.
      if (!parameters.streamOverrides?.[id]?.formulation) generatedStyle[id] = { formulation: { ...set.palette[role] } };
    }
  }
  const localOverrides = parameters.streamOverrides || {};
  const streamOverrides = { ...localOverrides };
  for (const [id, generated] of Object.entries(generatedStyle)) {
    const local = localOverrides[id] || {};
    streamOverrides[id] = {
      ...generated, ...local,
      formulation: { ...(generated.formulation || {}), ...(local.formulation || {}) },
    };
  }
  const localTransform = parameters.marbleTransform || {};
  return {
    ...parameters,
    marbleSeed: identity,
    veinDensity: Math.max(.08, Math.min(1, set.density + jitter * .18)),
    marbleTransform: {
      ...localTransform,
      panX: finite(localTransform.panX, 0) + flowPan,
      rotation: finite(localTransform.rotation, 0) + set.flow.angle + jitter * 18,
    },
    streamOverrides,
  };
}

/** Renderer-only resolution. The supplied artist parameters are never mutated. */
export function resolveMarbleRenderState(effect, coordination, nailId) {
  if (!effect || effect.id !== 'Marble') return effect;
  return { ...effect, parameters: coordinatedMarbleParameters(effect.parameters, coordination, nailId) };
}

export function deriveCoordinationFromNail(effect, coordination) {
  const set = normalizeMarbleSetCoordination(coordination);
  const streams = effect?.parameters?.streamOverrides || {};
  const palette = { ...set.palette };
  for (const role of ['primary', 'secondary', 'hairline']) {
    const explicit = Object.entries(streams).find(([id, item]) => id.startsWith(`${role}-`) && item?.visible !== false && item?.formulation)?.[1]?.formulation;
    if (explicit) palette[role] = { color: color(explicit.color, palette[role].color), finish: finish(explicit.finish, palette[role].finish) };
  }
  return normalizeMarbleSetCoordination({ ...set, density: effect?.parameters?.veinDensity, flow: { ...set.flow, angle: effect?.parameters?.marbleTransform?.rotation ?? set.flow.angle }, palette });
}

export function detachMarbleParameters(effect, nailId) {
  if (!effect || effect.id !== 'Marble') return effect;
  const coordination = normalizeMarbleSetCoordination(effect.parameters.marbleSetCoordination);
  const resolved = coordinatedMarbleParameters(effect.parameters, coordination, nailId);
  return { ...effect, parameters: { ...resolved, marbleSetCoordination: normalizeMarbleSetCoordination(undefined) } };
}
