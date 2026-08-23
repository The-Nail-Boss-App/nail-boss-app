import { coordinatedMarbleParameters, createMarbleSetSeed, createVirtualMarbleComposition, deformSharedFlowStream, deriveCoordinationFromNail, deriveSharedFlowStreams, detachMarbleParameters, mapSourceStructureToRenderableStreams, marbleGeometryIdentity, materializeMarbleSourceHandoff, nailLocalToSharedFlow, normalizeMarbleSetCoordination, projectSharedFlowStream, projectVirtualMarbleWindow, regenerateSharedFlowStreams, resolveMarbleRenderState, sharedFlowStreamForSegment } from './marbleSetCoordination';
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
    expect(index).not.toEqual(middle); expect(index.at(-1).sharedY).toBe(middle[0].sharedY);
    expect(sharedFlowStreamForSegment(flow, 'primary-0')?.id).toBe(sharedFlowStreams[0].id);
  });
  it('maps non-source nail edits into shared space with localized cross-window deformation', () => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'edit-flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1', 'nail-2', 'nail-3'] });
    const stream = deriveSharedFlowStreams(base, [{ id: 'primary-0', veinClass: 'primary', visible: true, controlPoints: [{ x: -30, y: 260 }, { x: 70, y: 215 }, { x: 150, y: 175 }, { x: 230, y: 145 }] }])[0];
    const flow = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: [stream] }); const grab = nailLocalToSharedFlow({ x: 100, y: projectSharedFlowStream(stream, flow, 'nail-1')[2].y }, flow, 'nail-1', stream.id);
    const changed = deformSharedFlowStream(stream, grab, 0, 40, 170); const near = stream.controlPoints.reduce((best, point, index) => Math.abs(point.u - grab.u) < Math.abs(stream.controlPoints[best].u - grab.u) ? index : best, 0);
    expect(changed.controlPoints[near].y - stream.controlPoints[near].y).toBeGreaterThan(30);
    expect(Math.abs(changed.controlPoints[0].y - stream.controlPoints[0].y)).toBeLessThan(1);
    const beforeMiddle = projectSharedFlowStream(stream, flow, 'nail-1'); const afterFlow = normalizeMarbleSetCoordination({ ...flow, sharedFlowStreams: [changed] });
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-1')).not.toEqual(beforeMiddle);
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-0').at(-1).sharedY).toBe(projectSharedFlowStream(changed, afterFlow, 'nail-1')[0].sharedY);
    expect(projectSharedFlowStream(changed, afterFlow, 'nail-1').at(-1).sharedY).toBe(projectSharedFlowStream(changed, afterFlow, 'nail-2')[0].sharedY);
  });
  it('reserves render IDs from visible ownership so hidden reserves cannot starve custom ancestry', () => {
    const flow = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'custom-flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1'] });
    const points = [{ x: -30, y: 260 }, { x: 90, y: 190 }, { x: 230, y: 130 }];
    const inventory = RENDERABLE_GENERATED_MARBLE_STREAM_IDS.map((id, index) => ({ id, veinClass: id.split('-')[0], visible: index === 0, controlPoints: points }));
    const streams = deriveSharedFlowStreams(flow, [...inventory, { id: 'custom-primary-a', custom: true, veinClass: 'primary', visible: true, controlPoints: points }, { id: 'custom-secondary-b', custom: true, veinClass: 'secondary', visible: true, controlPoints: points }]);
    const custom = streams.filter((stream) => stream.sourceStreamId.startsWith('custom-'));
    expect(custom).toHaveLength(2); expect(custom.every((stream) => RENDERABLE_GENERATED_MARBLE_STREAM_IDS.includes(stream.renderStreamId))).toBe(true);
    expect(streams.every((stream) => stream.renderStreamId)).toBe(true);
    const resolved = coordinatedMarbleParameters({}, normalizeMarbleSetCoordination({ ...flow, sharedFlowStreams: streams }), 'nail-1');
    custom.forEach((stream) => expect(resolved.streamOverrides[stream.renderStreamId].geometryOverride.points.length).toBeGreaterThan(1));
  });
  it('keeps source-relative geometry fixed when a preceding participant detaches', () => {
    const before = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'relative-flow', sourceNailId: 'nail-2', participatingNailIds: ['nail-0', 'nail-1', 'nail-2', 'nail-3'] });
    const source = [{ id: 'primary-0', veinClass: 'primary', visible: true, controlPoints: [{ x: -30, y: 270 }, { x: 80, y: 210 }, { x: 230, y: 145 }] }];
    const withGeometry = normalizeMarbleSetCoordination({ ...before, sharedFlowStreams: deriveSharedFlowStreams(before, source) });
    const sourceBefore = projectSharedFlowStream(withGeometry.sharedFlowStreams[0], withGeometry, 'nail-2');
    const detached = normalizeMarbleSetCoordination({ ...withGeometry, participatingNailIds: ['nail-0', 'nail-2', 'nail-3'] });
    expect(projectSharedFlowStream(detached.sharedFlowStreams[0], detached, 'nail-2')).toEqual(sourceBefore);
    expect(normalizeMarbleSetCoordination(JSON.parse(JSON.stringify(detached))).sharedFlowStreams).toEqual(detached.sharedFlowStreams);
    expect(projectSharedFlowStream(detached.sharedFlowStreams[0], detached, 'nail-2').at(-1).sharedY).toBe(projectSharedFlowStream(detached.sharedFlowStreams[0], detached, 'nail-3')[0].sharedY);
  });
  it('randomizes persisted continuation deterministically while preserving source ancestry and anchor', () => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', setSeed: 'old-seed', sourceNailId: 'nail-1', participatingNailIds: ['nail-0', 'nail-1', 'nail-2'] });
    const source = [{ id: 'primary-0', veinClass: 'primary', visible: true, controlPoints: [{ x: -30, y: 270 }, { x: 80, y: 205 }, { x: 230, y: 140 }] }];
    const initial = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: deriveSharedFlowStreams(base, source) });
    const randomized = regenerateSharedFlowStreams(initial, 'new-seed'); const repeated = regenerateSharedFlowStreams(initial, 'new-seed');
    expect(randomized.setSeed).toBe('new-seed'); expect(randomized.sharedFlowStreams).toEqual(repeated.sharedFlowStreams);
    expect(randomized.sharedFlowStreams[0].controlPoints).not.toEqual(initial.sharedFlowStreams[0].controlPoints);
    expect(randomized.sharedFlowStreams[0].sourceStreamId).toBe(initial.sharedFlowStreams[0].sourceStreamId);
    expect(projectSharedFlowStream(randomized.sharedFlowStreams[0], randomized, 'nail-1').map(({ x, y }) => ({ x, y }))).toEqual(projectSharedFlowStream(initial.sharedFlowStreams[0], initial, 'nail-1').map(({ x, y }) => ({ x, y })));
    expect(normalizeMarbleSetCoordination(JSON.parse(JSON.stringify(randomized))).sharedFlowStreams).toEqual(randomized.sharedFlowStreams);
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
  it.each([
    ['vertical', [{ x: 80, y: 290 }, { x: 80, y: 220 }, { x: 80, y: 130 }]],
    ['repeated x', [{ x: 40, y: 280 }, { x: 90, y: 230 }, { x: 90, y: 180 }, { x: 150, y: 120 }]],
    ['S curve', [{ x: 30, y: 270 }, { x: 150, y: 230 }, { x: 45, y: 180 }, { x: 170, y: 120 }]],
    ['backtracking', [{ x: 30, y: 270 }, { x: 170, y: 220 }, { x: 70, y: 170 }, { x: 140, y: 110 }]],
  ])('preserves authored order for %s shared geometry', (_name, points) => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', sourceNailId: 'nail-1', participatingNailIds: ['nail-0', 'nail-1', 'nail-2'] });
    const stream = deriveSharedFlowStreams(base, [{ id: 'primary-0', veinClass: 'primary', controlPoints: points }])[0];
    const source = projectSharedFlowStream(stream, { ...base, sharedFlowStreams: [stream] }, 'nail-1');
    expect(source.map(({ x, y }) => ({ x, y }))).toEqual(points);
    expect(stream.controlPoints.every((point, index) => index === 0 || point.u >= stream.controlPoints[index - 1].u)).toBe(true);
  });
  it('migrates v2 arrays without sorting and rejects implicit v3 slab fallback', () => {
    const points = [{ x: 120, y: 10 }, { x: 20, y: 30 }, { x: 120, y: 50 }];
    const migrated = normalizeMarbleSetCoordination({ version: 2, mode: 'flow', sharedFlowStreams: [{ id: 'old', sourceStreamId: 'primary-0', points }] });
    expect(migrated.sharedFlowStreams[0].controlPoints.map(({ x, y }) => ({ x, y }))).toEqual(points);
    const invalid = normalizeMarbleSetCoordination({ version: 3, mode: 'flow', participatingNailIds: ['nail-0'] });
    expect(createVirtualMarbleComposition(invalid).streams).toEqual([]);
  });
  it('maps a neighboring projection to u and deforms by curve distance without reordering', () => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1', 'nail-2'] });
    const stream = deriveSharedFlowStreams(base, [{ id: 'primary-0', veinClass: 'primary', controlPoints: [{ x: 20, y: 280 }, { x: 180, y: 220 }, { x: 30, y: 150 }] }])[0];
    const set = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: [stream] }); const neighbor = projectSharedFlowStream(stream, set, 'nail-1');
    const grab = nailLocalToSharedFlow(neighbor[1], set, 'nail-1', stream.id); const changed = deformSharedFlowStream(stream, grab, 80, 0, 90);
    expect(grab.sharedStreamId).toBe(stream.id); expect(grab.u).toBe(neighbor[1].u);
    expect(changed.controlPoints.map(({ u }) => u)).toEqual(stream.controlPoints.map(({ u }) => u));
    expect(projectSharedFlowStream(changed, { ...set, sharedFlowStreams: [changed] }, 'nail-1')).not.toEqual(neighbor);
  });
  it.each([
    ['vertical', [{ x: 80, y: 290 }, { x: 80, y: 210 }, { x: 80, y: 120 }]],
    ['S', [{ x: 25, y: 285 }, { x: 175, y: 225 }, { x: 35, y: 165 }, { x: 170, y: 105 }]],
    ['backtracking', [{ x: 30, y: 280 }, { x: 180, y: 220 }, { x: 55, y: 155 }, { x: 145, y: 95 }]],
  ])('projects successive %s topology into nail-local Hero bounds', (_name, points) => {
    const base = normalizeMarbleSetCoordination({ mode: 'flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1', 'nail-2'] });
    const stream = deriveSharedFlowStreams(base, [{ id: 'primary-0', veinClass: 'primary', controlPoints: points }])[0]; const set = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: [stream] });
    const source = projectSharedFlowStream(stream, set, 'nail-0'); const second = projectSharedFlowStream(stream, set, 'nail-1'); const later = projectSharedFlowStream(stream, set, 'nail-2');
    expect(source.map(({ x, y }) => ({ x, y }))).toEqual(points);
    [second, later].forEach((projection) => expect(projection.every(({ x, y }) => x >= -30 && x <= 230 && y >= 20 && y <= 310)).toBe(true));
    expect(second[0].projectedParameterRange).not.toEqual(later[0].projectedParameterRange); expect(second.every(({ sharedStreamId }) => sharedStreamId === stream.id)).toBe(true);
    expect(second.at(-1).u).toBe(later[0].u); expect(second.at(-1).sharedX).toBe(later[0].sharedX); expect(second.at(-1).sharedY).toBe(later[0].sharedY);
  });
  it('recovers a nonzero-source v2 logical window and reloads idempotently', () => {
    const points = [{ x: -550, y: 280 }, { x: -290, y: 240 }, { x: -30, y: 210 }, { x: 100, y: 170 }, { x: 230, y: 135 }, { x: 490, y: 100 }];
    const migrated = normalizeMarbleSetCoordination({ version: 2, mode: 'flow', sourceNailId: 'nail-2', participatingNailIds: ['nail-0', 'nail-1', 'nail-2', 'nail-3'], sharedFlowStreams: [{ id: 'v2', sourceStreamId: 'primary-0', points }] });
    const stream = migrated.sharedFlowStreams[0]; expect(stream.controlPoints.map(({ x, y }) => ({ x, y }))).toEqual(points); expect(stream.sourceRange[0]).toBeGreaterThan(0); expect(stream.sourceRange[1]).toBeLessThan(1);
    const before = projectSharedFlowStream(stream, migrated, 'nail-1')[0].projectedParameterRange; const after = projectSharedFlowStream(stream, migrated, 'nail-3')[0].projectedParameterRange;
    expect(before[1]).toBe(stream.sourceRange[0]); expect(after[0]).toBe(stream.sourceRange[1]); expect(before[0]).toBeGreaterThanOrEqual(0); expect(after[1]).toBeLessThanOrEqual(1);
    expect(normalizeMarbleSetCoordination(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
  });
  it.each(['flow-a', 'flow-b'])('restricts crossing lookup and deformation to selected %s', (selectedId) => {
    const base = normalizeMarbleSetCoordination({ version: 3, mode: 'flow', sourceNailId: 'nail-0', participatingNailIds: ['nail-0', 'nail-1'] });
    const make = (id, renderStreamId, points) => ({ id, sourceStreamId: renderStreamId, renderStreamId, veinClass: 'primary', controlPoints: points.map((point, index) => ({ ...point, u: index / 2 })), sourceRange: [0, .5] });
    const a = make('flow-a', 'primary-0', [{ x: 20, y: 280 }, { x: 100, y: 170 }, { x: 180, y: 70 }]); const b = make('flow-b', 'primary-1', [{ x: 180, y: 280 }, { x: 100, y: 170 }, { x: 20, y: 70 }]);
    const set = normalizeMarbleSetCoordination({ ...base, sharedFlowStreams: [a, b] }); const selected = set.sharedFlowStreams.find(({ id }) => id === selectedId); const other = set.sharedFlowStreams.find(({ id }) => id !== selectedId);
    const crossing = projectSharedFlowStream(selected, set, 'nail-0')[1]; const grab = nailLocalToSharedFlow(crossing, set, 'nail-0', selected.id); const changed = deformSharedFlowStream(selected, grab, 30, 0, 80);
    expect(grab.sharedStreamId).toBe(selected.id); expect(changed.controlPoints).not.toEqual(selected.controlPoints); expect(other.controlPoints).toEqual(set.sharedFlowStreams.find(({ id }) => id === other.id).controlPoints);
  });

});
