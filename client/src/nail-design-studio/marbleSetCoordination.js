import { GENERATED_MARBLE_STREAM_IDS, RENDERABLE_GENERATED_MARBLE_STREAM_IDS } from '../hero-design/marbleInventory';

export const MARBLE_SET_COORDINATION_VERSION = 3;
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
    const serialized = Array.isArray(stream?.controlPoints) ? stream.controlPoints : stream?.points;
    if (!stream || typeof stream.id !== 'string' || typeof stream.sourceStreamId !== 'string' || !Array.isArray(serialized) || serialized.length < 2) return [];
    const raw = serialized.flatMap((point) => Number.isFinite(Number(point?.x)) && Number.isFinite(Number(point?.y)) ? [{ ...(Number.isFinite(Number(point.u)) ? { u: Number(point.u) } : {}), x: rounded(Number(point.x)), y: rounded(Number(point.y)) }] : []);
    const hasStableU = Number(source.version) >= 3 && raw.every((point, index) => Number.isFinite(point.u) && (index === 0 || point.u >= raw[index - 1].u));
    const controlPoints = hasStableU ? raw : parameterize(raw);
    const renderStreamId = typeof stream.renderStreamId === 'string' ? stream.renderStreamId.slice(0, 160) : stream.sourceStreamId.slice(0, 160);
    if (controlPoints.length < 2 || !RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(renderStreamId)) return [];
    const range = stream.sourceRange; const migratedRange = Number(source.version) < 3 ? legacySourceRange(controlPoints, source) : null;
    return [{ id: stream.id.slice(0, 160), sourceStreamId: stream.sourceStreamId.slice(0, 160), renderStreamId, veinClass: ['diffusion', 'primary', 'secondary', 'hairline'].includes(stream.veinClass) ? stream.veinClass : 'primary', controlPoints, sourceRange: Array.isArray(range) && range.length === 2 ? [finite(range[0], 0), finite(range[1], 1)] : migratedRange || [0, 1], deformed: stream.deformed === true, widthSamples: Array.isArray(stream.widthSamples) ? stream.widthSamples.map((item) => Math.max(.1, finite(item, 1))) : [] }];
  });
  return {
    mode, version: MARBLE_SET_COORDINATION_VERSION,
    setSeed: typeof source.setSeed === 'string' && source.setSeed ? source.setSeed.slice(0, 128) : 'marble-set-default-v1',
    participatingNailIds: [...new Set((Array.isArray(source.participatingNailIds) ? source.participatingNailIds : []).filter((id) => typeof id === 'string'))].sort((a, b) => nailOrder(a) - nailOrder(b)),
    flow: { angle: Math.max(-75, Math.min(75, finite(source.flow?.angle, -28))), curvature: Math.max(-1, Math.min(1, finite(source.flow?.curvature, .2))) },
    variation, density: Math.max(0, Math.min(1, finite(source.density, .42))), palette,
    sourceNailId: typeof source.sourceNailId === 'string' ? source.sourceNailId : '', sharedFlowStreams: sharedStreams,
    flowInitializationState: sharedStreams.length ? 'ready' : (source.flowInitializationState === 'legacy' ? 'legacy' : (source.flowInitializationState === 'uninitialized' || Number(source.version) >= 3 ? 'uninitialized' : 'legacy')),
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

const parameterize = (points) => {
  if (!points.length) return [];
  const distances = [0];
  for (let index = 1; index < points.length; index += 1) distances.push(distances[index - 1] + Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y));
  const total = distances.at(-1) || 1;
  return points.map((point, index) => ({ u: Number((distances[index] / total).toFixed(8)), x: rounded(point.x), y: rounded(point.y) }));
};

const legacyUAtX = (points, x, preferLast = false) => {
  const matches = [];
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1], b = points[index];
    if (x < Math.min(a.x, b.x) || x > Math.max(a.x, b.x)) continue;
    const t = Math.abs(b.x - a.x) < .0001 ? 0 : (x - a.x) / (b.x - a.x);
    matches.push(a.u + (b.u - a.u) * t);
  }
  return matches.length ? matches[preferLast ? matches.length - 1 : 0] : null;
};

/** Recovers the old v2 source x-window; malformed curves use nail-order fractions deterministically. */
const legacySourceRange = (points, source) => {
  const start = legacyUAtX(points, FLOW_WINDOW_LEFT); const end = legacyUAtX(points, FLOW_WINDOW_RIGHT, true);
  if (start !== null && end !== null && end > start) return [Number(start.toFixed(8)), Number(end.toFixed(8))];
  const ids = [...new Set((Array.isArray(source.participatingNailIds) ? source.participatingNailIds : []).filter((id) => typeof id === 'string'))].sort((a, b) => nailOrder(a) - nailOrder(b));
  const count = Math.max(1, ids.length); const order = Math.max(0, ids.indexOf(source.sourceNailId));
  return [order / count, (order + 1) / count];
};

const interpolateSharedPoint = (points, u) => {
  if (u <= points[0].u) return { ...points[0], u };
  if (u >= points.at(-1).u) return { ...points.at(-1), u };
  const right = points.findIndex((point) => point.u >= u); const a = points[right - 1]; const b = points[right];
  const t = (u - a.u) / Math.max(.00000001, b.u - a.u);
  return { u, x: rounded(a.x + (b.x - a.x) * t), y: rounded(a.y + (b.y - a.y) * t) };
};

const nailParameterRange = (set, nailId, stream) => {
  const order = set.participatingNailIds.indexOf(nailId); const count = set.participatingNailIds.length; const sourceOrder = Math.max(0, set.participatingNailIds.indexOf(set.sourceNailId));
  if (order < 0 || !count) return null;
  if (!stream?.sourceRange) return [order / count, (order + 1) / count];
  const [sourceStart, sourceEnd] = stream.sourceRange;
  if (order === sourceOrder) return [sourceStart, sourceEnd];
  if (order < sourceOrder) return [sourceStart * order / sourceOrder, sourceStart * (order + 1) / sourceOrder];
  const afterCount = count - sourceOrder - 1; const afterIndex = order - sourceOrder - 1;
  return [sourceEnd + (1 - sourceEnd) * afterIndex / afterCount, sourceEnd + (1 - sourceEnd) * (afterIndex + 1) / afterCount];
};

/** Maps stable nail-local Hero coordinates into layout-independent shared set space. */
export function nailLocalToSharedFlow(point, coordination, nailId, sharedStreamId) {
  const set = normalizeMarbleSetCoordination(coordination); const stream = set.sharedFlowStreams.find((item) => item.id === sharedStreamId || item.sourceStreamId === sharedStreamId || item.renderStreamId === sharedStreamId);
  if (!stream) return null;
  let best = null; const projected = projectSharedFlowStream(stream, set, nailId); const target = { x: finite(point?.x, 0), y: finite(point?.y, 0) };
  projected.slice(1).forEach((right, index) => {
    const left = projected[index]; const vx = right.x - left.x, vy = right.y - left.y; const lengthSquared = vx * vx + vy * vy;
    const t = Math.max(0, Math.min(1, lengthSquared ? ((target.x - left.x) * vx + (target.y - left.y) * vy) / lengthSquared : 0));
    const x = left.x + vx * t, y = left.y + vy * t; const distance = Math.hypot(x - target.x, y - target.y);
    if (!best || distance < best.distance) best = { u: left.u + (right.u - left.u) * t, x: rounded(x), y: rounded(y), distance, projectionScale: left.projectionScale, sharedStreamId: stream.id, projectedParameterRange: left.projectedParameterRange };
  });
  return best;
}

/** Projects a shared stream into one nail's logical window (the SVG mask clips paint locally). */
export function projectSharedFlowStream(stream, coordination, nailId) {
  const set = normalizeMarbleSetCoordination(coordination); const range = nailParameterRange(set, nailId, stream);
  if (!range) return [];
  const points = stream.controlPoints || parameterize(stream.points || []); const [start, end] = range;
  const sampled = [interpolateSharedPoint(points, start), ...points.filter(({ u }) => u > start && u < end), interpolateSharedPoint(points, end)];
  const isSource = nailId === set.sourceNailId; const minX = Math.min(...sampled.map(({ x }) => x)); const maxX = Math.max(...sampled.map(({ x }) => x)); const minY = Math.min(...sampled.map(({ y }) => y)); const maxY = Math.max(...sampled.map(({ y }) => y));
  const scale = isSource ? 1 : Math.min(1, FLOW_WINDOW_WIDTH / Math.max(1, maxX - minX), 290 / Math.max(1, maxY - minY));
  const offsetX = isSource ? 0 : 100 - (minX + maxX) * scale / 2; const offsetY = isSource ? 0 : 165 - (minY + maxY) * scale / 2;
  return sampled.map(({ u, x, y }) => ({ x: rounded(x * scale + offsetX), y: rounded(y * scale + offsetY), u, sharedX: x, sharedY: y, projectionScale: scale, sharedStreamId: stream.id, projectedParameterRange: range }));
}

/**
 * Creates one ancestry-bearing curve per currently visible eligible source stream.
 * The source's resolved points are embedded unchanged; only its continuation is generated.
 */
export function deriveSharedFlowStreams(coordination, sourceStreams) {
  const set = normalizeMarbleSetCoordination(coordination); const sourceOrder = Math.max(0, set.participatingNailIds.indexOf(set.sourceNailId));
  const visible = (sourceStreams || []).filter((stream) => stream?.visible !== false && Array.isArray(stream.controlPoints) && stream.controlPoints.length > 1);
  // Hidden procedural reserve streams are deliberately absent here: they must
  // remain showable as local inventory without starving visible custom ancestry.
  const used = new Set(visible.filter((stream) => !stream?.custom && RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(stream.id)).map((stream) => stream.id));
  const available = RENDERABLE_GENERATED_MARBLE_STREAM_IDS.filter((id) => !used.has(id)); let customIndex = 0;
  return visible.flatMap((stream) => {
    const renderStreamId = stream.renderStreamId || (stream.custom ? available[customIndex++] : stream.id);
    if (!RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(renderStreamId)) return [];
    const source = stream.controlPoints.map((point) => ({ x: rounded(point.x), y: rounded(point.y) }));
    const first = source[0], second = source[1], last = source.at(-1), beforeLast = source.at(-2);
    const seedPhase = unit(`${set.setSeed}|${stream.id}|continuation`) * Math.PI * 2;
    const evolve = (anchor, tangent, count, direction) => {
      const length = Math.hypot(tangent.x, tangent.y) || 1; let angle = Math.atan2(tangent.y, tangent.x); let current = { ...anchor }; const result = [];
      for (let index = 1; index <= count * 5; index += 1) {
        angle += direction * set.flow.curvature * .018 + Math.sin(seedPhase + index * .61) * .012;
        current = { x: rounded(current.x + Math.cos(angle) * 52 * direction), y: rounded(current.y + Math.sin(angle) * 52 * direction) };
        result.push(current);
      }
      return result;
    };
    const before = evolve(first, { x: second.x - first.x, y: second.y - first.y }, sourceOrder, -1).reverse();
    const after = evolve(last, { x: last.x - beforeLast.x, y: last.y - beforeLast.y }, set.participatingNailIds.length - sourceOrder - 1, 1);
    const controlPoints = parameterize([...before, ...source, ...after]);
    const sourceStart = controlPoints[before.length].u; const sourceEnd = controlPoints[before.length + source.length - 1].u;
    return [Object.freeze({ id: `flow-${hash(`${set.setSeed}|${stream.id}`).toString(36)}`, sourceStreamId: stream.id, renderStreamId, veinClass: stream.veinClass, controlPoints, sourceRange: [sourceStart, sourceEnd], widthSamples: [] })];
  });
}

/** Regenerates continuation from the persisted source-relative anchor section. */
export function regenerateSharedFlowStreams(coordination, setSeed) {
  const current = normalizeMarbleSetCoordination(coordination); const next = normalizeMarbleSetCoordination({ ...current, setSeed });
  const sourceStreams = current.sharedFlowStreams.map((stream) => ({
    id: stream.sourceStreamId, renderStreamId: stream.renderStreamId, veinClass: stream.veinClass, visible: true,
    custom: stream.sourceStreamId.startsWith('custom-'),
    controlPoints: [interpolateSharedPoint(stream.controlPoints, stream.sourceRange[0]), ...stream.controlPoints.filter(({ u }) => u > stream.sourceRange[0] && u < stream.sourceRange[1]), interpolateSharedPoint(stream.controlPoints, stream.sourceRange[1])],
  }));
  return normalizeMarbleSetCoordination({ ...next, sharedFlowStreams: deriveSharedFlowStreams(next, sourceStreams) });
}

/** Gaussian falloff keeps a grabbed section local while retaining a seam-free curve. */
export function deformSharedFlowStream(stream, grabPoint, dx, dy, radius = 320) {
  const safeRadius = Math.max(24, finite(radius, 320));
  const points = stream.controlPoints || parameterize(stream.points || []); const totalLength = points.slice(1).reduce((sum, point, index) => sum + Math.hypot(point.x - points[index].x, point.y - points[index].y), 0);
  return { ...stream, deformed: true, controlPoints: points.map((point) => {
    const distance = Math.abs(point.u - finite(grabPoint?.u, .5)) * totalLength; const influence = Math.exp(-4 * (distance / safeRadius) ** 2);
    return { u: point.u, x: rounded(point.x + dx * influence), y: rounded(point.y + dy * influence) };
  }) };
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
  if (set.sharedFlowStreams.length) return Object.freeze({ id: `shared-flow-v3|${set.setSeed}`, windowCount: count, sourceOrder: Math.max(0, set.participatingNailIds.indexOf(set.sourceNailId)), shared: true, streams: Object.freeze(set.sharedFlowStreams.map((stream) => Object.freeze({ ...stream, id: stream.renderStreamId, role: stream.veinClass }))) });
  if (set.mode === 'flow' && set.flowInitializationState === 'uninitialized') return Object.freeze({ id: `shared-flow-v3-uninitialized|${set.setSeed}`, windowCount: count, shared: true, streams: Object.freeze([]) });
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
    const nailId = `__window-${order}`; const coordination = { mode: 'flow', sourceNailId: `__window-${composition.sourceOrder || 0}`, participatingNailIds: Array.from({ length: composition.windowCount }, (_, index) => `__window-${index}`) };
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
  if (set.sourceNailId === nailId && set.participatingNailIds.includes(nailId) && (!(set.mode === 'flow' && set.sharedFlowStreams.length) || set.sharedFlowStreams.every((stream) => !stream.deformed))) return { ...parameters };
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
