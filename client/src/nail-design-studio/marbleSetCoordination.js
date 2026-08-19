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

const rounded = (value) => Number(value.toFixed(2));
const FLOW_STREAMS = Object.freeze([
  Object.freeze({ id: 'diffusion-0', role: 'primary', phase: .11, amplitude: 22 }),
  Object.freeze({ id: 'diffusion-1', role: 'primary', phase: .63, amplitude: 17 }),
  Object.freeze({ id: 'primary-0', role: 'primary', phase: .18, amplitude: 19 }),
  Object.freeze({ id: 'primary-1', role: 'primary', phase: .71, amplitude: 15 }),
  Object.freeze({ id: 'secondary-0', role: 'secondary', phase: .31, amplitude: 11 }),
  Object.freeze({ id: 'secondary-1', role: 'secondary', phase: .82, amplitude: 9 }),
]);

/**
 * Builds geology in virtual-set coordinates before any nail is considered.
 * X is measured in logical nail-window widths; Y is the canonical Hero space.
 */
export function createVirtualMarbleComposition(coordination) {
  const set = normalizeMarbleSetCoordination(coordination);
  const count = Math.max(1, set.participatingNailIds.length);
  const angleSlope = Math.tan(set.flow.angle * Math.PI / 180) * 34;
  return Object.freeze({
    id: `virtual-slab-v1|${set.setSeed}|${set.flow.angle}|${set.flow.curvature}|${count}`,
    windowCount: count,
    streams: Object.freeze(FLOW_STREAMS.map((definition, index) => {
      const base = 62 + unit(`${set.setSeed}|${definition.id}|base`) * 190;
      const frequency = .58 + unit(`${set.setSeed}|${definition.id}|frequency`) * .72;
      const phase = (definition.phase + unit(`${set.setSeed}|${definition.id}|phase`)) * Math.PI * 2;
      const amplitude = definition.amplitude * (.72 + unit(`${set.setSeed}|${definition.id}|amplitude`) * .56);
      const branchStart = definition.role === 'secondary' ? Math.floor(unit(`${set.setSeed}|${definition.id}|start`) * Math.max(1, count - 1)) : 0;
      const branchEnd = definition.role === 'secondary' ? Math.min(count, branchStart + 2 + Math.floor(unit(`${set.setSeed}|${definition.id}|span`) * Math.max(1, count - branchStart - 1))) : count;
      return Object.freeze({ ...definition, index, base, frequency, phase, amplitude, angleSlope, curvature: set.flow.curvature, start: branchStart, end: branchEnd });
    })),
  });
}

const virtualY = (stream, x) => stream.base + stream.angleSlope * (x - 2.25)
  + Math.sin(x * stream.frequency + stream.phase) * stream.amplitude
  + Math.sin(x * .31 + stream.phase * .47) * stream.curvature * 24;

/** Projects one stable logical window into nail-local Hero composition space. */
export function projectVirtualMarbleWindow(composition, order) {
  const sampleX = [-30, 35, 100, 165, 230];
  return Object.fromEntries(composition.streams.map((stream) => {
    const outsideBranch = stream.role === 'secondary' && (order < stream.start || order >= stream.end);
    const points = sampleX.map((x) => ({ x, y: rounded(outsideBranch ? -240 : virtualY(stream, order + x / 200)) }));
    return [stream.id, Object.freeze(points)];
  }));
}
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
  const flowProjection = set.mode === 'flow' ? projectVirtualMarbleWindow(createVirtualMarbleComposition(set), order) : null;
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
      ...(flowProjection?.[id] && !local.geometryOverride ? { geometryOverride: { points: flowProjection[id] } } : {}),
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
      panX: finite(localTransform.panX, 0),
      rotation: finite(localTransform.rotation, 0) + (set.mode === 'coordinated' ? set.flow.angle + jitter * 18 : 0),
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
