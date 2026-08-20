import { coordinatedMarbleParameters, createMarbleSetSeed, createVirtualMarbleComposition, deformSharedFlowStream, deriveCoordinationFromNail, deriveSharedFlowStreams, detachMarbleParameters, mapSourceStructureToRenderableStreams, marbleGeometryIdentity, materializeMarbleSourceHandoff, nailLocalToSharedFlow, normalizeMarbleSetCoordination, projectSharedFlowStream, projectVirtualMarbleWindow, resolveMarbleRenderState, sharedFlowStreamForSegment } from './marbleSetCoordination';
import { RENDERABLE_GENERATED_MARBLE_STREAM_IDS } from '../hero-design/marbleInventory';
import { heroEffectForPolish, normalizePolishForFinish } from './polishFinish';
import { createMarbleVeinModel } from '../hero-design/index.ts';

const set = normalizeMarbleSetCoordination({ mode: 'coordinated', setSeed: 'slab-7', participatingNailIds: ['nail-1', 'nail-0'], variation: 'low', flow: { angle: 12, curvature: .3 } });
describe('Marble set coordination', () => {
  it('derives one persistent source-ancestry Flow curve and successive continuous windows', () => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'source-flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1', 'nail-2'] });
    const source = [{ id: 'primary-0', veinClass: 'primary', visible: true, controlPoints: [{ x: -30, y: 280 }, { x: 70, y: 220 }, { x: 150, y: 170 }, { x: 230, y: 135 }] }];
    const sharedFlowStreams = deriveSharedFlowStreams(base, source); const flow = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams });
    expect(sharedFlowStreams).toHaveLength(1); expect(sharedFlowStreams[0]).toMatchObject({ sourceStreamId: 'primary-0', renderStreamId: 'primary-0' });
    expect(normalizeMarbleSetCoordination(JSON.parse(JSON.stringify(flow))).sharedFlowStreams).toEqual(flow.sharedFlowStreams);
    const index = projectSharedFlowStream(sharedFlowStreams[0], flow, 'nail-0'); const middle = projectSharedFlowStream(sharedFlowStreams[0], flow, 'nail-1');
    expect(index).not.toEqual(middle); expect(index.at(-1).y).toBe(middle[0].y);
    expect(sharedFlowStreamForSegment(flow, 'primary-0')?.id).toBe(sharedFlowStreams[0].id);
  });
  it('maps non-source nail edits into shared space with localized cross-window deformation', () => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'edit-flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1', 'nail-2', 'nail-3'] });
    const stream = deriveSharedFlowStreams(base, [{ id: 'primary-0', veinClass: 'primary', visible: true, controlPoints: [{ x: -30, y: 260 }, { x: 70, y: 215 }, { x: 150, y: 175 }, { x: 230, y: 145 }] }])[0];
    const flow = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: [stream] }); const grab = nailLocalToSharedFlow({ x: 100, y: projectSharedFlowStream(stream, flow, 'nail-1')[2].y }, flow, 'nail-1');
    const changed = deformSharedFlowStream(stream, grab, 0, 40, 170); const near = stream.points.reduce((best, point, index) => Math.abs(point.x - grab.x) < Math.abs(stream.points[best].x - grab.x) ? index : best, 0);
    expect(changed.points[near].y - stream.points[near].y).toBeGreaterThan(30);
    expect(Math.abs(changed.points[0].y - stream.points[0].y)).toBeLessThan(1);
    const beforeMiddle = projectSharedFlowStream(stream, flow, 'nail-1'); const afterFlow = normalizeMarbleSetCoordination({ ...flow, sharedFlowStreams: [changed] });
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-1')).not.toEqual(beforeMiddle);
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-0').at(-1).y).toBe(projectSharedFlowStream(changed, afterFlow, 'nail-1')[0].y);
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-1').at(-1).y).toBe(projectSharedFlowStream(changed, afterFlow, 'nail-2')[0].y);
  });
  it('hydrates legacy documents as Independent without inference', () => expect(normalizeMarbleSetCoordination(undefined).mode).toBe('independent'));
  it('is deterministic, unique by stable nail identity, and independent of layout pixels', () => {
    expect(marbleGeometryIdentity(set, 'nail-0')).toBe(marbleGeometryIdentity(set, 'nail-0'));
    expect(marbleGeometryIdentity(set, 'nail-0')).not.toBe(marbleGeometryIdentity(set, 'nail-1'));
  });
  it('keeps style out of geometry identity', () => expect(marbleGeometryIdentity(set, 'nail-0')).toBe(marbleGeometryIdentity({ ...set, palette: { primary: { color: '#FFFFFF', finish: 'Glitter' } } }, 'nail-0')));
  it('preserves local overrides, custom artwork, deletions, and nail-local transform', () => {
    const source = { veinDensity: .4, marbleTransform: { panX: 9, panY: 3 }, customStreams: { 'custom-primary-art': {} }, deletedStreamIds: ['primary-1'], streamOverrides: { 'primary-0': { formulation: { color: '#112233', finish: 'Matte' } } } };
    const next = coordinatedMarbleParameters(source, set, 'nail-0');
    expect(next.streamOverrides['primary-0'].formulation).toEqual(source.streamOverrides['primary-0'].formulation);
    expect(next.customStreams).toBe(source.customStreams); expect(next.deletedStreamIds).toBe(source.deletedStreamIds); expect(next.marbleTransform.panX).toBe(9);
  });
  it('uses logical order for deterministic Flow Across Set windows', () => {
    const flow = { ...set, mode: 'flow' };
    const left = coordinatedMarbleParameters({}, flow, 'nail-0'); const right = coordinatedMarbleParameters({}, flow, 'nail-1');
    expect(left.streamOverrides['primary-0'].geometryOverride).not.toEqual(right.streamOverrides['primary-0'].geometryOverride);
  });
  it('creates one deterministic virtual slab whose primary trajectories meet at neighboring boundaries', () => {
    const flow = normalizeMarbleSetCoordination({ ...set, mode: 'flow', participatingNailIds: ['nail-4', 'nail-0', 'nail-2', 'nail-1', 'nail-3'] });
    const slab = createVirtualMarbleComposition(flow); const again = createVirtualMarbleComposition(JSON.parse(JSON.stringify(flow)));
    expect(again).toEqual(slab);
    expect(createVirtualMarbleComposition({ ...flow, setSeed: 'another-slab' })).not.toEqual(slab);
    const first = projectVirtualMarbleWindow(slab, 0)['primary-0']; const second = projectVirtualMarbleWindow(slab, 1)['primary-0'];
    const rightEdge = first.find(({ x }) => x === 230); const leftEdge = second.find(({ x }) => x === 35);
    expect(Math.abs(rightEdge.y - leftEdge.y)).toBeLessThan(14);
  });
  it('keeps Coordinated related but independently seeded instead of projecting slab geometry', () => {
    const first = coordinatedMarbleParameters({}, set, 'nail-0'); const second = coordinatedMarbleParameters({}, set, 'nail-1');
    expect(first.marbleSeed).not.toBe(second.marbleSeed);
    expect(first.streamOverrides['primary-0'].geometryOverride).toBeUndefined();
  });
  it('uses stable identities, not responsive pixels, to select distinct slab portions', () => {
    const flow = normalizeMarbleSetCoordination({ ...set, mode: 'flow', participatingNailIds: ['nail-2', 'nail-0', 'nail-1'] });
    const geometry = (id) => coordinatedMarbleParameters({}, flow, id).streamOverrides['primary-0'].geometryOverride.points;
    expect(geometry('nail-0')).toEqual(geometry('nail-0'));
    expect(geometry('nail-0')).not.toEqual(geometry('nail-2'));
  });
  it.each([
    ['formulation color', { formulation: { color: '#123456' } }],
    ['formulation finish', { formulation: { finish: 'Glitter' } }],
    ['opacity', { opacity: .37 }],
    ['width', { width: 4.2 }],
  ])('keeps projected Flow geometry when Primary has a local %s override', (_label, override) => {
    const flow = { ...set, mode: 'flow' };
    const projected = projectVirtualMarbleWindow(createVirtualMarbleComposition(flow), 0)['primary-0'];
    const resolved = coordinatedMarbleParameters({ streamOverrides: { 'primary-0': override } }, flow, 'nail-0');
    expect(resolved.streamOverrides['primary-0']).toMatchObject(override);
    expect(resolved.streamOverrides['primary-0'].geometryOverride.points).toEqual(projected);
  });
  it('lets explicit local geometry win over projected Flow geometry', () => {
    const geometryOverride = { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] };
    const resolved = coordinatedMarbleParameters({ streamOverrides: { 'primary-0': { geometryOverride, opacity: .5 } } }, { ...set, mode: 'flow' }, 'nail-0');
    expect(resolved.streamOverrides['primary-0'].geometryOverride).toBe(geometryOverride);
  });
  it('projects shared-slab geometry onto diffusion independently of generated style', () => {
    const flow = { ...set, mode: 'flow' }; const slab = createVirtualMarbleComposition(flow);
    const resolved = coordinatedMarbleParameters({ streamOverrides: { 'diffusion-0': { softness: 4 } } }, flow, 'nail-0');
    expect(resolved.streamOverrides['diffusion-0'].geometryOverride.points).toEqual(projectVirtualMarbleWindow(slab, 0)['diffusion-0']);
    expect(resolved.streamOverrides['diffusion-0'].softness).toBe(4);
  });
  it('keeps a Flow vein path and neighboring continuity stable through color and finish edits', () => {
    const flow = normalizeMarbleSetCoordination({ ...set, mode: 'flow' });
    const effect = (streamOverrides = {}) => ({ id: 'Marble', version: '1', parameters: { veinColor: '#8A405D', veinDensity: 1, marbleSetCoordination: flow, streamOverrides } });
    const baseline = createMarbleVeinModel(effect(), 'desk:nail-0').find(({ id }) => id === 'primary-0');
    const styled = createMarbleVeinModel(effect({ 'primary-0': { formulation: { color: '#ABCDEF', finish: 'Glitter' } } }), 'desk:nail-0').find(({ id }) => id === 'primary-0');
    expect(styled.path).toBe(baseline.path);
    const left = coordinatedMarbleParameters(effect().parameters, flow, 'nail-0').streamOverrides['primary-0'].geometryOverride.points;
    const right = coordinatedMarbleParameters(effect({ 'primary-0': { formulation: { color: '#ABCDEF', finish: 'Glitter' } } }).parameters, flow, 'nail-1').streamOverrides['primary-0'].geometryOverride.points;
    expect(Math.abs(left.at(-1).y - right[1].y)).toBeLessThan(14);
  });
  it('derives style and flow without changing the source effect', () => {
    const effect = { id: 'Marble', parameters: { veinDensity: .7, marbleTransform: { rotation: 33 }, streamOverrides: { 'primary-0': { formulation: { color: '#ABCDEF', finish: 'Jelly' } } } } };
    const before = JSON.stringify(effect); const derived = deriveCoordinationFromNail(effect, set);
    expect(JSON.stringify(effect)).toBe(before); expect(derived.palette.primary).toEqual({ color: '#ABCDEF', finish: 'Jelly' }); expect(derived.flow.angle).toBe(33);
  });
  it('re-derives structural intent without mutating the source or cloning its artwork', () => {
    const effect = { id: 'Marble', parameters: { veinDensity: .7, customStreams: {
      'custom-primary-source': { veinClass: 'primary', visible: true, controlPoints: [{ x: 1, y: 2 }, { x: 9, y: 12 }] },
      'custom-hairline-source': { veinClass: 'hairline', visible: true },
    }, deletedStreamIds: ['secondary-1'], streamOverrides: {} } };
    const before = JSON.stringify(effect); const updated = deriveCoordinationFromNail(effect, set, 'nail-0');
    expect(JSON.stringify(effect)).toBe(before);
    expect(updated.sourceNailId).toBe('nail-0');
    expect(updated.sourceStructure).toEqual({ primary: 1, secondary: 0, hairline: 1, deletedGeneratedIds: ['secondary-1'] });
    expect(updated).not.toHaveProperty('customStreams');
  });
  it.each(['coordinated', 'flow'])('uses updated source structure for %s while preserving neighbor overrides', (mode) => {
    const baseline = normalizeMarbleSetCoordination({ ...set, mode, sourceNailId: 'nail-0' });
    const updated = normalizeMarbleSetCoordination({ ...baseline, sourceStructure: { primary: 1, deletedGeneratedIds: ['secondary-1'] } });
    expect(marbleGeometryIdentity(updated, 'nail-1')).not.toBe(marbleGeometryIdentity(baseline, 'nail-1'));
    if (mode === 'flow') {
      const slab = createVirtualMarbleComposition(updated);
      expect(slab.streams.some(({ id }) => id === 'secondary-2')).toBe(true);
      expect(slab.streams.some(({ id }) => id === 'secondary-1')).toBe(false);
    }
    const geometryOverride = { points: [{ x: 4, y: 5 }, { x: 8, y: 9 }] };
    const customStreams = { local: { veinClass: 'primary' } }; const deletedStreamIds = ['primary-1'];
    const local = { customStreams, deletedStreamIds, marbleTransform: { panX: 8 }, streamOverrides: { 'primary-0': { geometryOverride, formulation: { color: '#123456', finish: 'Jelly' }, opacity: .4 } } };
    const resolved = coordinatedMarbleParameters(local, updated, 'nail-1');
    expect(resolved.streamOverrides['primary-0']).toMatchObject(local.streamOverrides['primary-0']);
    expect(resolved.customStreams).toBe(customStreams); expect(resolved.deletedStreamIds).toEqual(['primary-1', 'secondary-1']); expect(resolved.marbleTransform.panX).toBe(8);
  });
  it('keeps the source nail byte-for-byte visually authoritative after an update', () => {
    const source = { marbleSeed: 'source', customStreams: { art: { veinClass: 'primary' } }, deletedStreamIds: ['primary-1'], streamOverrides: { 'primary-0': { opacity: .3 } } };
    const updated = normalizeMarbleSetCoordination({ ...set, mode: 'flow', sourceNailId: 'nail-0', sourceStructure: { primary: 1 } });
    expect(coordinatedMarbleParameters(source, updated, 'nail-0')).toEqual(source);
  });
  it.each(['coordinated', 'flow'])('materializes the complete visible %s state before source handoff', (mode) => {
    const coordination = normalizeMarbleSetCoordination({ ...set, mode, sourceNailId: 'nail-0' });
    const localGeometry = { points: [{ x: 7, y: 8 }, { x: 30, y: 40 }] };
    const effect = { id: 'Marble', version: '1', parameters: { veinColor: '#8A405D', veinDensity: .7, marbleSeed: 'old-local', marbleTransform: { panX: 6, panY: 2, scale: 1.1, rotation: 4 }, customStreams: { local: { veinClass: 'primary', visible: true } }, deletedStreamIds: ['hairline-4'], streamOverrides: { 'primary-0': { geometryOverride: localGeometry, formulation: { color: '#123456', finish: 'Jelly' }, opacity: .4 } } } };
    const before = resolveMarbleRenderState(effect, coordination, 'nail-1');
    const handoff = materializeMarbleSourceHandoff(effect, coordination, 'nail-1');
    expect(handoff.coordination.sourceNailId).toBe('nail-1');
    expect(handoff.materializedEffect.parameters).toMatchObject(before.parameters);
    const rerendered = resolveMarbleRenderState({ ...handoff.materializedEffect, parameters: { ...handoff.materializedEffect.parameters, marbleSetCoordination: handoff.coordination } }, handoff.coordination, 'nail-1').parameters;
    expect({ ...rerendered, marbleSetCoordination: undefined }).toEqual(handoff.materializedEffect.parameters);
    expect(coordinatedMarbleParameters(effect.parameters, handoff.coordination, 'nail-0').marbleSeed).toContain('nail-0');
    expect(handoff.materializedEffect.parameters.streamOverrides['primary-0']).toMatchObject({ geometryOverride: localGeometry, formulation: { color: '#123456', finish: 'Jelly' }, opacity: .4 });
    expect(handoff.materializedEffect.parameters.customStreams).toBe(effect.parameters.customStreams);
    expect(handoff.materializedEffect.parameters.deletedStreamIds).toContain('hairline-4');
  });
  it('compresses maximum source intent exclusively into renderable generated streams', () => {
    const sourceStructure = { primary: 4, secondary: 8, hairline: 12 };
    const mapped = mapSourceStructureToRenderableStreams(sourceStructure);
    expect(mapped).toHaveLength(7);
    expect(mapped.reduce((total, { weight }) => total + weight, 0)).toBe(24);
    expect(mapped.every(({ id }) => RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(id))).toBe(true);
    const flow = normalizeMarbleSetCoordination({ ...set, mode: 'flow', sourceStructure });
    const slab = createVirtualMarbleComposition(flow);
    expect(slab.streams.every(({ id }) => RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(id))).toBe(true);
    expect(new Set(slab.streams.map(({ id }) => id)).size).toBe(slab.streams.length);
    expect(marbleGeometryIdentity(flow, 'nail-1')).not.toBe(marbleGeometryIdentity({ ...flow, sourceStructure: {} }, 'nail-1'));
  });
  it('creates persisted-looking deterministic seeds without Math.random geometry', () => expect(createMarbleSetSeed(123)).toBe(createMarbleSetSeed(123)));
  it('carries the normalized relationship through the canonical Hero effect factory', () => {
    const polish = normalizePolishForFinish({ finish: 'Marble', marbleSetCoordination: set }, 'Marble');
    expect(heroEffectForPolish(polish).parameters.marbleSetCoordination).toEqual(set);
    expect(heroEffectForPolish(polish).parameters).toMatchObject({ marbleSeed: 'marble-layout-v1', customStreams: {}, deletedStreamIds: [] });
  });
  it.each(['geometryOverride', 'opacity', 'width'])('retains set formulation beside a partial %s override', (property) => {
    const value = property === 'geometryOverride' ? { points: [{ x: 1, y: 2 }, { x: 3, y: 4 }] } : .6;
    const parameters = coordinatedMarbleParameters({ streamOverrides: { 'primary-0': { [property]: value } } }, { ...set, palette: { ...set.palette, primary: { color: '#D4AF37', finish: 'Glitter' } } }, 'nail-0');
    expect(parameters.streamOverrides['primary-0']).toMatchObject({ [property]: value, formulation: { color: '#D4AF37', finish: 'Glitter' } });
  });
  it('merges explicit partial formulation properties over set style', () => {
    const parameters = coordinatedMarbleParameters({ streamOverrides: { 'primary-0': { formulation: { color: '#FF1493', finish: 'Jelly' } } } }, set, 'nail-0');
    expect(parameters.streamOverrides['primary-0'].formulation).toEqual({ color: '#FF1493', finish: 'Jelly' });
  });
  it('resolves render transforms without mutating the artist transform', () => {
    const local = { panX: 7, panY: 4, scale: 1.2, rotation: 9 };
    const effect = { id: 'Marble', parameters: { marbleTransform: local } };
    const flow = { ...set, mode: 'flow' }; const resolved = resolveMarbleRenderState(effect, flow, 'nail-0');
    expect(resolved.parameters.marbleTransform).toEqual(local);
    expect(resolved.parameters.streamOverrides['primary-0'].geometryOverride.points).toHaveLength(5);
    expect(effect.parameters.marbleTransform).toBe(local);
    expect(resolveMarbleRenderState(effect, undefined, 'nail-0').parameters.marbleTransform).toEqual(local);
  });
  it.each(['coordinated', 'flow'])('materializes the exact %s resolved state before detach', (mode) => {
    const coordination = { ...set, mode };
    const effect = { id: 'Marble', parameters: { marbleSeed: 'local', marbleTransform: { panX: 3, panY: 4, scale: 1, rotation: 5 }, customStreams: { art: {} }, deletedStreamIds: ['primary-1'], streamOverrides: { 'primary-0': { opacity: .6 } }, marbleSetCoordination: coordination } };
    const before = resolveMarbleRenderState(effect, coordination, 'nail-0').parameters;
    const detached = detachMarbleParameters(effect, 'nail-0');
    expect(detached.parameters).toMatchObject({ marbleSeed: before.marbleSeed, veinDensity: before.veinDensity, marbleTransform: before.marbleTransform, streamOverrides: before.streamOverrides, customStreams: effect.parameters.customStreams, deletedStreamIds: effect.parameters.deletedStreamIds });
    expect(detached.parameters.marbleSetCoordination.mode).toBe('independent');
  });
});
