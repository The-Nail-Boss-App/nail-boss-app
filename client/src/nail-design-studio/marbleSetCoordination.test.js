import { coordinatedMarbleParameters, createMarbleSetSeed, createVirtualMarbleComposition, deriveCoordinationFromNail, detachMarbleParameters, marbleGeometryIdentity, normalizeMarbleSetCoordination, projectVirtualMarbleWindow, resolveMarbleRenderState } from './marbleSetCoordination';
import { heroEffectForPolish, normalizePolishForFinish } from './polishFinish';

const set = normalizeMarbleSetCoordination({ mode: 'coordinated', setSeed: 'slab-7', participatingNailIds: ['nail-1', 'nail-0'], variation: 'low', flow: { angle: 12, curvature: .3 } });
describe('Marble set coordination', () => {
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
  it('derives style and flow without changing the source effect', () => {
    const effect = { id: 'Marble', parameters: { veinDensity: .7, marbleTransform: { rotation: 33 }, streamOverrides: { 'primary-0': { formulation: { color: '#ABCDEF', finish: 'Jelly' } } } } };
    const before = JSON.stringify(effect); const derived = deriveCoordinationFromNail(effect, set);
    expect(JSON.stringify(effect)).toBe(before); expect(derived.palette.primary).toEqual({ color: '#ABCDEF', finish: 'Jelly' }); expect(derived.flow.angle).toBe(33);
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
