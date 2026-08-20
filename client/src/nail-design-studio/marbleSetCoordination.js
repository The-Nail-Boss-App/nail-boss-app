import { GENERATED_MARBLE_STREAM_IDS, RENDERABLE_GENERATED_MARBLE_STREAM_IDS } from '../hero-design/marbleInventory';

export const MARBLE_SET_COORDINATION_VERSION = 2;
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
  const sharedStreams = (Array.isArray(source.sharedFlowStreams) ? source.sharedFlowStreams : []).flatMap((stream) => {
    if (!stream || typeof stream.id !== 'string' || typeof stream.sourceStreamId !== 'string' || !Array.isArray(stream.points) || stream.points.length < 2) return [];
    const points = stream.points.flatMap((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)) ? [{ x: rounded(Number(point.x)), y: rounded(Number(point.y)) }] : []);
    if (points.length < 2) return [];
    return [{ id: stream.id.slice(0, 160), sourceStreamId: stream.sourceStreamId.slice(0, 160), renderStreamId: typeof stream.renderStreamId === 'string' ? stream.renderStreamId.slice(0, 160) : stream.sourceStreamId.slice(0, 160), veinClass: ['diffusion', 'primary', 'secondary', 'hairline'].includes(stream.veinClass) ? stream.veinClass : 'primary', points, widthSamples: Array.isArray(stream.widthSamples) ? stream.widthSamples.map((item) => Math.max(.1, finite(item, 1))) : [] }];
  });
  return {
    mode, version: MARBLE_SET_COORDINATION_VERSION,
    setSeed: typeof source.setSeed === 'string' && source.setSeed ? source.setSeed.slice(0, 128) : 'marble-set-default-v1',
    participatingNailIds: [...new Set((Array.isArray(source.participatingNailIds) ? source.participatingNailIds : []).filter((id) => typeof id === 'string'))].sort((a, b) => nailOrder(a) - nailOrder(b)),
    flow: { angle: Math.max(-75, Math.min(75, finite(source.flow?.angle, -28))), curvature: Math.max(-1, Math.min(1, finite(source.flow?.curvature, .2))) },
    variation, density: Math.max(0, Math.min(1, finite(source.density, .42))), palette,
    sourceNailId: typeof source.sourceNailId === 'string' ? source.sourceNailId : '', sharedFlowStreams: sharedStreams,
    sourceStructure: {
      primary: Math.max(0, Math.min(4, Math.floor(finite(source.sourceStructure?.primary, 0)))),
      secondary: Math.max(0, Math.min(8, Math.floor(finite(source.sourceStructure?.secondary, 0)))),
      hairline: Math.max(0, Math.min(12, Math.floor(finite(source.sourceStructure?.hairline, 0)))),
      deletedGeneratedIds: [...new Set((Array.isArray(source.sourceStructure?.deletedGeneratedIds) ? source.sourceStructure.deletedGeneratedIds : []).filter((id) => /^(diffusion|primary|secondary|hairline)-\d+$/.test(id)))].sort(),
    },
  };
}

export const nailOrder = (id) => { const match = String(id).match(/nail-(\d+)$/); return match ? Number(match[1]) : hash(String(id)); };

const rounded = (value) => Number(value.toFixed(2));
export const FLOW_WINDOW_WIDTH = 260;
export const FLOW_WINDOW_LEFT = -30;
export const FLOW_WINDOW_RIGHT = 230;

const interpolateSharedPoint = (points, x) => {
  if (x <= points[0].x) return { x, y: points[0].y };
  if (x >= points.at(-1).x) return { x, y: points.at(-1).y };
  const right = points.findIndex((point) => point.x >= x); const a = points[right - 1]; const b = points[right];
  const t = (x - a.x) / Math.max(.0001, b.x - a.x);
  return { x, y: a.y + (b.y - a.y) * t };
};

/** Maps stable nail-local Hero coordinates into layout-independent shared set space. */
export function nailLocalToSharedFlow(point, coordination, nailId) {
  const set = normalizeMarbleSetCoordination(coordination); const order = set.participatingNailIds.indexOf(nailId);
  if (order < 0) return null;
  return { x: rounded(order * FLOW_WINDOW_WIDTH + finite(point?.x, 0)), y: rounded(finite(point?.y, 0)) };
}

/** Projects a shared stream into one nail's logical window (the SVG mask clips paint locally). */
export function projectSharedFlowStream(stream, coordination, nailId) {
  const set = normalizeMarbleSetCoordination(coordination); const order = set.participatingNailIds.indexOf(nailId);
  if (order < 0) return [];
  const start = order * FLOW_WINDOW_WIDTH + FLOW_WINDOW_LEFT; const end = order * FLOW_WINDOW_WIDTH + FLOW_WINDOW_RIGHT;
  const xs = [start, ...stream.points.filter((point) => point.x > start && point.x < end).map((point) => point.x), end];
  return xs.map((x) => { const point = interpolateSharedPoint(stream.points, x); return { x: rounded(x - order * FLOW_WINDOW_WIDTH), y: rounded(point.y) }; });
}

/**
 * Creates one ancestry-bearing curve per currently visible eligible source stream.
 * The source's resolved points are embedded unchanged; only its continuation is generated.
 */
export function deriveSharedFlowStreams(coordination, sourceStreams) {
  const set = normalizeMarbleSetCoordination(coordination); const sourceOrder = Math.max(0, set.participatingNailIds.indexOf(set.sourceNailId));
  const minX = FLOW_WINDOW_LEFT; const maxX = Math.max(1, set.participatingNailIds.length - 1) * FLOW_WINDOW_WIDTH + FLOW_WINDOW_RIGHT;
  const used = new Set((sourceStreams || []).filter((stream) => !stream?.custom).map((stream) => stream.id));
  const available = RENDERABLE_GENERATED_MARBLE_STREAM_IDS.filter((id) => !used.has(id)); let customIndex = 0;
  return (sourceStreams || []).filter((stream) => stream?.visible !== false && Array.isArray(stream.controlPoints) && stream.controlPoints.length > 1).flatMap((stream) => {
    const renderStreamId = stream.custom ? available[customIndex++] : stream.id;
    if (!renderStreamId) return [];
    const source = stream.controlPoints.map((point) => ({ x: rounded(sourceOrder * FLOW_WINDOW_WIDTH + point.x), y: rounded(point.y) })).sort((a, b) => a.x - b.x);
    const first = source[0], second = source[1], last = source.at(-1), beforeLast = source.at(-2);
    const slopeBefore = (second.y - first.y) / Math.max(1, second.x - first.x); const slopeAfter = (last.y - beforeLast.y) / Math.max(1, last.x - beforeLast.x);
    const seedPhase = unit(`${set.setSeed}|${stream.id}|continuation`) * Math.PI * 2;
    const points = [];
    for (let x = minX; x < first.x; x += 52) { const distance = x - first.x; points.push({ x, y: rounded(first.y + slopeBefore * distance + Math.sin(distance / 155 + seedPhase) * Math.min(18, Math.abs(distance) * .035)) }); }
    points.push(...source);
    for (let x = last.x + 52; x <= maxX + 52; x += 52) { const distance = x - last.x; points.push({ x, y: rounded(last.y + slopeAfter * distance + Math.sin(distance / 145 + seedPhase) * Math.min(24, distance * .04)) }); }
    return [Object.freeze({ id: `flow-${hash(`${set.setSeed}|${stream.id}`).toString(36)}`, sourceStreamId: stream.id, renderStreamId, veinClass: stream.veinClass, points: points.sort((a, b) => a.x - b.x), widthSamples: [] })];
  });
}

/** Gaussian falloff keeps a grabbed section local while retaining a seam-free curve. */
export function deformSharedFlowStream(stream, grabPoint, dx, dy, radius = 180) {
  const safeRadius = Math.max(24, finite(radius, 180));
  return { ...stream, points: stream.points.map((point) => {
    const distance = Math.hypot(point.x - grabPoint.x, (point.y - grabPoint.y) * .35); const influence = Math.exp(-4 * (distance / safeRadius) ** 2);
    return { x: rounded(point.x + dx * influence), y: rounded(point.y + dy * influence) };
  }).sort((a, b) => a.x - b.x) };
}

export function sharedFlowStreamForSegment(coordination, sourceStreamId) {
  return normalizeMarbleSetCoordination(coordination).sharedFlowStreams.find((stream) => stream.sourceStreamId === sourceStreamId || stream.renderStreamId === sourceStreamId || stream.id === sourceStreamId) || null;
}
const FLOW_STREAMS = Object.freeze([
  Object.freeze({ id: 'diffusion-0', role: 'primary', phase: .11, amplitude: 22 }),
  Object.freeze({ id: 'diffusion-1', role: 'primary', phase: .63, amplitude: 17 }),
  Object.freeze({ id: 'primary-0', role: 'primary', phase: .18, amplitude: 19 }),
  Object.freeze({ id: 'primary-1', role: 'primary', phase: .71, amplitude: 15 }),
  Object.freeze({ id: 'secondary-0', role: 'secondary', phase: .31, amplitude: 11 }),
  Object.freeze({ id: 'secondary-1', role: 'secondary', phase: .82, amplitude: 9 }),
]);
const FLOW_BASE_IDS = new Set(FLOW_STREAMS.map(({ id }) => id));

/** Compresses arbitrary source counts into the finite inventory the renderer owns. */
export function mapSourceStructureToRenderableStreams(sourceStructure) {
  const structure = normalizeMarbleSetCoordination({ sourceStructure }).sourceStructure;
  const candidates = [
    ...GENERATED_MARBLE_STREAM_IDS.secondary.filter((id) => !FLOW_BASE_IDS.has(id)),
    ...GENERATED_MARBLE_STREAM_IDS.hairline,
  ];
  const weightedIntent = [
    ...Array.from({ length: structure.primary }, () => 'primary'),
    ...Array.from({ length: structure.secondary }, () => 'secondary'),
    ...Array.from({ length: structure.hairline }, () => 'hairline'),
  ];
  // Capacity overflow intentionally folds back onto existing candidates and
  // increases their geological weight rather than inventing an identity.
  const mapped = new Map();
  weightedIntent.forEach((role, index) => {
    const id = candidates[index % candidates.length]; const current = mapped.get(id);
    mapped.set(id, { id, role: current?.role === 'primary' || role === 'primary' ? 'primary' : role, rank: candidates.indexOf(id), weight: (current?.weight || 0) + 1 });
  });
  return Object.freeze([...mapped.values()].map(Object.freeze));
}

/**
 * Builds geology in virtual-set coordinates before any nail is considered.
 * X is measured in logical nail-window widths; Y is the canonical Hero space.
 */
export function createVirtualMarbleComposition(coordination) {
  const set = normalizeMarbleSetCoordination(coordination);
  const count = Math.max(1, set.participatingNailIds.length);
  if (set.sharedFlowStreams.length) return Object.freeze({ id: `shared-flow-v2|${set.setSeed}`, windowCount: count, shared: true, streams: Object.freeze(set.sharedFlowStreams.map((stream) => Object.freeze({ ...stream, id: stream.renderStreamId, role: stream.veinClass }))) });
  const angleSlope = Math.tan(set.flow.angle * Math.PI / 180) * 34;
  const deleted = new Set(set.sourceStructure.deletedGeneratedIds);
  // Source additions describe hierarchy, not cloned artwork. Map them onto
  // unused generated stream classes so they become coherent slab trajectories.
  const additions = mapSourceStructureToRenderableStreams(set.sourceStructure).map(({ id, role, rank, weight }) => ({ id, role: role === 'primary' ? 'primary' : 'secondary', phase: .24 + rank * .11, amplitude: Math.max(4.5, 16 - rank * .65) * (1 + Math.min(.3, (weight - 1) * .06)) }));
  const definitions = [...FLOW_STREAMS, ...additions].filter((item, index, items) => !deleted.has(item.id) && items.findIndex(({ id }) => id === item.id) === index);
  if (definitions.some(({ id }) => !RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(id))) throw new Error('Flow structure mapped to a non-renderable Marble stream.');
  return Object.freeze({
    id: `virtual-slab-v1|${set.setSeed}|${JSON.stringify(set.sourceStructure)}|${set.flow.angle}|${set.flow.curvature}|${count}`,
    windowCount: count,
    streams: Object.freeze(definitions.map((definition, index) => {
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
  if (composition.shared) {
    const nailId = `__window-${order}`; const coordination = { mode: 'flow', participatingNailIds: Array.from({ length: composition.windowCount }, (_, index) => `__window-${index}`) };
    return Object.fromEntries(composition.streams.map((stream) => [stream.id, Object.freeze(projectSharedFlowStream(stream, coordination, nailId))]));
  }
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
  return `set-v${set.version}|${set.setSeed}|${JSON.stringify(set.sourceStructure)}|${set.mode}|${set.flow.angle}|${set.flow.curvature}|${set.variation}|${nailId}`;
};

export function coordinatedMarbleParameters(parameters, coordination, nailId) {
  const set = normalizeMarbleSetCoordination(coordination);
  // The source is the reference artwork. Set regeneration is applied beneath
  // neighboring local state and must never regenerate the source itself.
  if (set.sourceNailId === nailId && set.participatingNailIds.includes(nailId) && !(set.mode === 'flow' && set.sharedFlowStreams.length)) return { ...parameters };
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
  // Geometry and style have separate ownership. In particular, formulation
  // edits must never remove a projected slab window, and diffusion receives
  // geometry even though it has no generated palette role.
  const resolvedIds = new Set([...Object.keys(generatedStyle), ...Object.keys(flowProjection || {})]);
  for (const id of resolvedIds) {
    const generated = generatedStyle[id] || {};
    const local = localOverrides[id] || {};
    const resolved = { ...generated, ...local };
    // Shared Flow geometry always owns shape. Local overrides continue to own
    // appearance; legacy slab geometry still yields to explicit local edits.
    if (flowProjection?.[id] && (set.sharedFlowStreams.length || !local.geometryOverride)) resolved.geometryOverride = { points: flowProjection[id] };
    const localFormulation = {
      ...(local.formulation || {}),
      ...(local.color ? { color: local.color } : {}),
      ...(local.finish ? { finish: local.finish } : {}),
    };
    if (generated.formulation || Object.keys(localFormulation).length) resolved.formulation = { ...(generated.formulation || {}), ...localFormulation };
    streamOverrides[id] = resolved;
  }
  const localTransform = parameters.marbleTransform || {};
  return {
    ...parameters,
    marbleSeed: identity,
    veinDensity: Math.max(.08, Math.min(1, Math.max(set.density + jitter * .18, set.sourceStructure.primary ? .76 : 0))),
    deletedStreamIds: set.sourceStructure.deletedGeneratedIds.length ? [...new Set([...(parameters.deletedStreamIds || []), ...set.sourceStructure.deletedGeneratedIds])] : parameters.deletedStreamIds,
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

export function deriveCoordinationFromNail(effect, coordination, sourceNailId = '') {
  const set = normalizeMarbleSetCoordination(coordination);
  const streams = effect?.parameters?.streamOverrides || {};
  const palette = { ...set.palette };
  for (const role of ['primary', 'secondary', 'hairline']) {
    const explicit = Object.entries(streams).find(([id, item]) => id.startsWith(`${role}-`) && item?.visible !== false && item?.formulation)?.[1]?.formulation;
    if (explicit) palette[role] = { color: color(explicit.color, palette[role].color), finish: finish(explicit.finish, palette[role].finish) };
  }
  const custom = Object.values(effect?.parameters?.customStreams || {}).filter((stream) => stream?.visible !== false);
  const sourceStructure = {
    primary: custom.filter((stream) => stream.veinClass === 'primary').length,
    secondary: custom.filter((stream) => stream.veinClass === 'secondary').length,
    hairline: custom.filter((stream) => stream.veinClass === 'hairline').length,
    deletedGeneratedIds: effect?.parameters?.deletedStreamIds || [],
  };
  return normalizeMarbleSetCoordination({ ...set, sourceNailId: sourceNailId || set.sourceNailId, sourceStructure, density: effect?.parameters?.veinDensity, flow: { ...set.flow, angle: effect?.parameters?.marbleTransform?.rotation ?? set.flow.angle }, palette });
}

/** Freezes exactly what is visible before transferring source ownership. */
export function materializeMarbleSourceHandoff(effect, coordination, sourceNailId) {
  const currentSet = normalizeMarbleSetCoordination(coordination);
  const materializedEffect = resolveMarbleRenderState({ ...effect, parameters: { ...effect.parameters, marbleSetCoordination: currentSet } }, currentSet, sourceNailId);
  const nextCoordination = deriveCoordinationFromNail(materializedEffect, currentSet, sourceNailId);
  return { materializedEffect: { ...materializedEffect, parameters: { ...materializedEffect.parameters, marbleSetCoordination: undefined } }, coordination: nextCoordination };
}

export function detachMarbleParameters(effect, nailId) {
  if (!effect || effect.id !== 'Marble') return effect;
  const coordination = normalizeMarbleSetCoordination(effect.parameters.marbleSetCoordination);
  const resolved = coordinatedMarbleParameters(effect.parameters, coordination, nailId);
  return { ...effect, parameters: { ...resolved, marbleSetCoordination: normalizeMarbleSetCoordination(undefined) } };
}
