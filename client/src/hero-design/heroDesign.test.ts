import {
  createHeroDesignDocument, validateHeroDesignDocument, HeroEngineRegistry, HeroDesignEventBus,
  heroDesignReducer, initialHeroDesignState, HeroLayer, HeroLocalStoragePersistenceAdapter,
  convertLegacyDesignStudioDocument, createHeroExportRequest, createHeroProductRequest, createHeroBlueprintRequest,
  HERO_SHAPE_IDS, HERO_SHAPE_LIBRARY, HeroShapeEngine, registerHeroShapeEngine, updateHeroShape,
  heroDocumentFromLegacyNail, loadHeroDocumentWithLegacyFallback, nailBasicsFromHero,
  HERO_NAIL_MASK_LIBRARY, HeroNailMaskEngine, maskReferenceForShape, registerHeroNailMaskEngine,
  resolveHeroNailMask,
  publishMaskResolution,
  createHeroSurfaceInput, connectHeroSurfaceInvalidation, HeroSurfaceRenderingEngine,
  registerHeroSurfaceRenderingEngine,
  DEFAULT_HERO_MATERIAL_REFERENCE, HERO_MATERIAL_LIBRARY, HeroMaterialEngine,
  registerHeroMaterialEngine, resolveHeroNailMaterial, updateHeroMaterial,
  validateHeroNailMaterial,
  HERO_EFFECT_IDS, HeroEffectEngine, registerHeroEffectEngine, applyHeroEffectToSurface, createMarbleVeinModel, deformMarbleControlPoints, nearestMarbleCenterlinePoint, normalizeCustomMarbleStreams, normalizeDeletedMarbleStreamIds, normalizeMarbleStreamOverrides, marbleWidthBoundsForClass, marblePathFromPoints, marbleRibbonBounds, marbleRibbonPath,
  updateHeroEffect, HeroLightingEngine, registerHeroLightingEngine, applyHeroLightingToEffect, connectHeroLightingInvalidation,
} from './index';

const layer = (id: string): HeroLayer => ({
  id, name: id, type: 'base', opacity: 1, visible: true, locked: false, blendMode: 'normal',
  transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, payload: { color: '#fff' },
});

describe('FX-R01E.3 continuous geological Marble model', () => {
  const marble = (extra = {}) => ({ id: 'Marble' as const, version: '1' as const, parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 1, marbleSeed: 'geology-r3', marbleGeometryVersion: 2, ...extra } });
  test('resolves and deforms arbitrary centerline sections with local falloff and bounded insertion', () => {
    const points = [{ x: 0, y: 0 }, { x: 40, y: 20 }, { x: 90, y: 12 }, { x: 140, y: 45 }];
    const hit = nearestMarbleCenterlinePoint(points, { x: 66, y: 15 });
    expect(hit.t).toBeGreaterThan(.35); expect(hit.t).toBeLessThan(.65); expect(hit.point).not.toEqual(points[1]);
    const changed = deformMarbleControlPoints(points, hit.t, 0, 30);
    expect(changed.length).toBe(5); expect(changed[2].y - points[2].y).toBeGreaterThan(changed[0].y - points[0].y);
    let repeated = changed; for (let index = 0; index < 30; index += 1) repeated = deformMarbleControlPoints(repeated, .47, 1, 0);
    expect(repeated.length).toBeLessThanOrEqual(12);
  });
  test('keeps geometry deterministic, styling-independent, hierarchical, and flow-coherent', () => {
    const first = createMarbleVeinModel(marble(), 'nail-a'); const again = createMarbleVeinModel(marble(), 'nail-a');
    const styled = createMarbleVeinModel(marble({ streamOverrides: { 'primary-0': { formulation: { color: '#D4AF37', finish: 'Glitter' } } } }), 'nail-a');
    expect(first.map((stream) => stream.generatedPath)).toEqual(again.map((stream) => stream.generatedPath)); expect(styled.map((stream) => stream.generatedPath)).toEqual(first.map((stream) => stream.generatedPath));
    const span = (stream: any) => Math.hypot(stream.controlPoints.at(-1).x - stream.controlPoints[0].x, stream.controlPoints.at(-1).y - stream.controlPoints[0].y);
    const average = (items: any[]) => items.reduce((sum, item) => sum + span(item), 0) / items.length;
    expect(average(first.filter((s) => s.veinClass === 'primary'))).toBeGreaterThan(average(first.filter((s) => s.veinClass === 'hairline')));
    expect(Math.max(...first.filter((s) => s.veinClass === 'hairline').map((s) => s.width))).toBeLessThan(Math.min(...first.filter((s) => s.veinClass === 'primary').map((s) => s.width)));
    expect(first.filter((s) => s.veinClass === 'primary')).toHaveLength(2); expect(first.filter((s) => s.veinClass === 'secondary')).toHaveLength(4);
  });
  test('merges persistent custom streams and generated tombstones without identity changes', () => {
    const custom = { 'custom-secondary-stable-a': { veinClass: 'secondary', controlPoints: [{ x: 10, y: 200 }, { x: 50, y: 150 }, { x: 90, y: 95 }], creationBaseline: [{ x: 10, y: 200 }, { x: 50, y: 150 }, { x: 90, y: 95 }], width: 1.1, widthProfile: { start: 1, middle: .8, end: .2 }, formulation: { color: '#D4AF37', finish: 'Glitter' }, opacity: .8, softness: 0, visible: true } };
    expect(Object.keys(normalizeCustomMarbleStreams(custom))).toEqual(['custom-secondary-stable-a']); expect(normalizeDeletedMarbleStreamIds(['secondary-1', 'bad'])).toEqual(['secondary-1']);
    const streams = createMarbleVeinModel(marble({ customStreams: custom, deletedStreamIds: ['secondary-1'] }), 'nail-a');
    expect(streams.find((stream) => stream.id === 'secondary-1')).toBeUndefined(); expect(streams.find((stream) => stream.id === 'custom-secondary-stable-a')).toMatchObject({ custom: true, finish: 'Glitter', width: 1.1 });
    expect(streams.find((stream) => stream.id === 'secondary-2')?.id).toBe('secondary-2');
  });
  test('uses identical class-sensitive width bounds for generated and custom stream IDs', () => {
    expect(marbleWidthBoundsForClass('primary')).toEqual({ min: .1, max: 8, default: 2.5 });
    const normalized = normalizeMarbleStreamOverrides({ 'primary-0': { width: 99 }, 'custom-primary-stable': { width: 6.75 }, 'secondary-0': { width: 99 }, 'custom-secondary-stable': { width: 99 }, 'hairline-0': { width: 99 }, 'custom-hairline-stable': { width: 99 } });
    expect(normalized['primary-0'].width).toBe(8); expect(normalized['custom-primary-stable'].width).toBe(6.75);
    expect(normalized['secondary-0'].width).toBe(5); expect(normalized['custom-secondary-stable'].width).toBe(5);
    expect(normalized['hairline-0'].width).toBe(1.5); expect(normalized['custom-hairline-stable'].width).toBe(1.5);
    expect(normalizeMarbleStreamOverrides({ 'custom-primary-bad': { width: Number.NaN, widthProfile: { start: 9, middle: -1, end: 'bad' } } })['custom-primary-bad']).toMatchObject({ width: 2.5, widthProfile: { start: 3, middle: .1, end: 1 } });
  });
});
const document = () => createHeroDesignDocument({ id: 'design-1', name: 'Hero', now: '2026-08-03T00:00:00.000Z', shapeId: 'Almond', maskId: 'almond-mask' });

describe('Hero Design integration shell', () => {
  test('creates and validates the canonical document', () => {
    const created = document();
    expect(created.revision).toBe(0);
    expect(created).not.toHaveProperty('flattenedImage');
    expect(validateHeroDesignDocument(created)).toEqual({ valid: true, issues: [] });
    expect(validateHeroDesignDocument({ ...created, nail: { ...created.nail, width: 0 } }).valid).toBe(true);
  });

  test('registers, resolves, checks, and unregisters engines', () => {
    const registry = new HeroEngineRegistry();
    const engine = { id: 'Hero Shape Engine' as const, version: '1', capabilities: ['shape'], initialize: jest.fn(), process: jest.fn(), validate: jest.fn(), dispose: jest.fn() };
    registry.register(engine);
    expect(registry.has(engine.id)).toBe(true);
    expect(registry.supports(engine.id, 'shape')).toBe(true);
    expect(registry.resolve(engine.id)).toBe(engine);
    expect(registry.unregister(engine.id)).toBe(engine);
    expect(() => registry.resolve(engine.id)).toThrow('not registered');
  });

  test('loads all approved production shapes and registers the shape engine capabilities', () => {
    expect(HERO_SHAPE_LIBRARY.map(({ id }) => id)).toEqual(HERO_SHAPE_IDS);
    expect(HERO_SHAPE_LIBRARY).toHaveLength(8);
    const registry = new HeroEngineRegistry();
    const engine = registerHeroShapeEngine(registry);
    expect(registry.resolve('Hero Shape Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['shape.selection', 'shape.validation', 'shape.configuration']);
  });

  test('registers the mask engine and resolves every approved shape to its production mask', () => {
    const registry = new HeroEngineRegistry();
    const engine = registerHeroNailMaskEngine(registry);
    expect(registry.resolve('Hero Nail Mask Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['mask.resolve', 'mask.validate', 'mask.clip', 'mask.hit-test', 'mask.bounds']);
    expect(HERO_NAIL_MASK_LIBRARY).toHaveLength(8);
    HERO_SHAPE_IDS.forEach((shapeId) => {
      const reference = maskReferenceForShape(shapeId)!;
      const resolved = engine.process(reference);
      expect(resolved).toMatchObject({ maskId: `${shapeId.toLowerCase()}-mask`, shapeId, version: '1', bounds: { x: 0, y: 0, width: 1, height: 1 } });
      expect(resolved.clippingSource.assetId).toBe(`founder-approved-nail-mask:${shapeId}:1`);
    });
  });

  test('validates mask compatibility, safe margins, sources, normalized bounds, and hit testing', () => {
    const engine = new HeroNailMaskEngine();
    const almond = maskReferenceForShape('Almond')!;
    expect(engine.validate({ ...almond, shapeId: 'Duck' }).issues.map(({ code }) => code)).toContain('incompatible_shape');
    expect(engine.validate({ ...almond, safeMargin: 0.1 }).valid).toBe(true);
    expect(engine.validate({ ...almond, safeMargin: -0.01 }).issues.map(({ code }) => code)).toContain('range');
    expect(engine.validate({ ...almond, safeMargin: 0.26 }).valid).toBe(false);
    expect(engine.validate({ ...almond, source: { type: 'path', assetId: 'invented' } }).issues.map(({ code }) => code)).toContain('source_unavailable');
    const resolved = resolveHeroNailMask({ ...almond, safeMargin: 0.05 });
    expect(resolved.containsPoint(0.5, 0.5)).toBe(true);
    expect(resolved.containsPoint(0, 0.5)).toBe(false);
    expect(resolved.containsPoint(0.46, 0.95, true)).toBe(false);
    expect(Object.values(resolved.safeBoundary).every((value) => value >= 0 && value <= 1)).toBe(true);
    expect(validateHeroDesignDocument({ ...document(), nail: { ...document().nail, shape: { id: 'Duck', version: '1' } } }).issues.map(({ code }) => code)).toContain('incompatible_shape');
  });

  test('publishes mask resolution and controlled validation failure events', () => {
    const events = new HeroDesignEventBus(); const resolved = jest.fn(); const failed = jest.fn();
    events.subscribe('nail.mask.resolved', resolved); events.subscribe('nail.mask.validation.failed', failed);
    publishMaskResolution(maskReferenceForShape('Square')!, events, 'design-1');
    expect(resolved).toHaveBeenCalledWith(expect.objectContaining({ designId: 'design-1', mask: expect.objectContaining({ maskId: 'square-mask' }) }));
    expect(() => publishMaskResolution({ id: 'missing-mask' }, events, 'design-1')).toThrow('invalid');
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ designId: 'design-1', issues: expect.any(Array) }));
  });

  test('rejects invalid shape IDs, versions, dimensions, and orientations without substitution', () => {
    const engine = new HeroShapeEngine();
    const invalid = engine.validate({ shapeId: 'Ballerina', shapeVersion: '2', length: 2, width: -1, orientation: 'tip-up' as never });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues.map(({ code }) => code)).toEqual(expect.arrayContaining(['unsupported_shape', 'range', 'unsupported_orientation']));
    expect(() => engine.process({ shapeId: 'Ballerina', shapeVersion: '1', length: 0.5, width: 0.5, orientation: 'tip-down' })).toThrow('invalid');
  });

  test('updates shape dimensions, revision and events while preserving unrelated state', () => {
    const events = new HeroDesignEventBus();
    const selected = jest.fn(); const lengthChanged = jest.fn(); const widthChanged = jest.fn(); const updated = jest.fn(); const maskChanged = jest.fn();
    events.subscribe('shape.selected', selected); events.subscribe('shape.length.changed', lengthChanged);
    events.subscribe('shape.width.changed', widthChanged); events.subscribe('shape.updated', updated); events.subscribe('nail.mask.changed', maskChanged);
    const original = { ...document(), layers: [layer('kept')], lighting: { ...document().lighting }, product: { productId: 'kept' } };
    let state = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: original });
    state = updateHeroShape(state, { shapeId: 'Duck', length: 0.7, width: 0.8 }, events);
    expect(state.document?.nail).toMatchObject({ shape: { id: 'Duck', version: '1' }, length: 0.7, width: 0.8, tipDown: true });
    expect(state.document?.nail.mask).toMatchObject({ id: 'duck-mask', version: '1', shapeId: 'Duck' });
    expect(state.document?.revision).toBe(1);
    expect(state.dirty).toBe(true);
    expect(state.document?.layers).toEqual(original.layers);
    expect(state.document?.lighting).toEqual(original.lighting);
    expect(state.document?.product).toEqual(original.product);
    expect(selected).toHaveBeenCalledTimes(1); expect(lengthChanged).toHaveBeenCalledTimes(1);
    expect(widthChanged).toHaveBeenCalledTimes(1); expect(updated).toHaveBeenCalledTimes(1); expect(maskChanged).toHaveBeenCalledTimes(1);
  });

  test('publishes validation failures and leaves state unchanged', () => {
    const events = new HeroDesignEventBus(); const failed = jest.fn();
    events.subscribe('shape.validation.failed', failed);
    const state = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: document() });
    expect(() => updateHeroShape(state, { width: 8 }, events)).toThrow('invalid');
    expect(failed).toHaveBeenCalledWith(expect.objectContaining({ designId: 'design-1' }));
    expect(state.document?.revision).toBe(0);
  });

  test('publishes and unsubscribes typed events', () => {
    const events = new HeroDesignEventBus();
    const handler = jest.fn();
    const unsubscribe = events.subscribe('design:created', handler);
    events.publish('design:created', { document: document() });
    unsubscribe();
    events.publish('design:created', { document: document() });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  test('performs layer operations and increments revisions', () => {
    let state = heroDesignReducer(initialHeroDesignState, { type: 'createDesign', document: document() });
    state = heroDesignReducer(state, { type: 'addLayer', layer: layer('one') });
    state = heroDesignReducer(state, { type: 'addLayer', layer: layer('two') });
    state = heroDesignReducer(state, { type: 'updateLayer', layerId: 'one', patch: { opacity: 0.5 } });
    state = heroDesignReducer(state, { type: 'reorderLayer', layerId: 'two', toIndex: 0 });
    state = heroDesignReducer(state, { type: 'selectLayers', layerIds: ['two'] });
    state = heroDesignReducer(state, { type: 'removeLayer', layerId: 'one' });
    expect(state.document?.layers.map(({ id }) => id)).toEqual(['two']);
    expect(state.document?.revision).toBe(5);
    expect(state.selectedLayerIds).toEqual(['two']);
    expect(state.dirty).toBe(true);
    state = heroDesignReducer(state, { type: 'markSaved' });
    expect(state.saved).toBe(true);
  });

  test('persists, duplicates, and deletes through the adapter', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const adapter = new HeroLocalStoragePersistenceAdapter(storage);
    await adapter.create(document());
    expect((await adapter.load('design-1'))?.metadata.name).toBe('Hero');
    expect((await adapter.duplicate('design-1', 'design-2', 'Copy')).metadata.name).toBe('Copy');
    expect(await adapter.delete('design-1')).toBe(true);
    expect(await adapter.load('design-1')).toBeNull();
  });

  test('bridges legacy nail basics and restores persisted Hero values when available', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const adapter = new HeroLocalStoragePersistenceAdapter(storage);
    const legacyDocument = heroDocumentFromLegacyNail(
      { shape: 'Lipstick', length: 0.42, width: 0.61 },
      { id: 'legacy-1', name: 'Legacy' },
    );
    expect(nailBasicsFromHero(legacyDocument)).toEqual({ shape: 'Lipstick', length: 0.42, width: 0.61 });
    expect((await loadHeroDocumentWithLegacyFallback(adapter, 'legacy-1', 'Legacy', { shape: 'Duck', length: 0.2, width: 0.3 })).nail.shape.id).toBe('Duck');
    await adapter.save({ ...legacyDocument, nail: { ...legacyDocument.nail, shape: { id: 'Stiletto', version: '1' }, mask: maskReferenceForShape('Stiletto')!, length: 0.77, width: 0.33 } });
    expect(nailBasicsFromHero(await loadHeroDocumentWithLegacyFallback(adapter, 'legacy-1', 'Legacy', { shape: 'Duck' }))).toEqual({ shape: 'Stiletto', length: 0.77, width: 0.33 });
  });

  test('converts supported legacy fields, preserves original, and reports unsupported fields', () => {
    const legacy = {
      id: 'old-1', name: 'Old', revision: 2,
      metadata: { createdAt: '2026-01-01', updatedAt: '2026-01-02' },
      canvas: { width: 500, height: 600 }, maskId: 'mask-1',
      lighting: { intensity: 1, direction: { x: 0, y: 0, z: 1 }, color: '#fff' },
      nails: [{ id: 'nail', shape: 'almond', length: 0.8, width: 0.5, tipDown: true, view: { view: 'top', rotation: 0, zoom: 1 }, layers: [
        { ...layer('base'), type: 'base', data: { colorHex: '#fff' } },
        { ...layer('mystery'), type: 'unknown', data: {} },
      ] }],
      privateNote: 'preserve me',
    };
    const result = convertLegacyDesignStudioDocument(legacy);
    expect(result.document?.metadata.id).toBe('old-1');
    expect(result.document?.nail.shape).toEqual({ id: 'Almond', version: '1' });
    expect(result.document?.layers).toHaveLength(1);
    expect(result.original).toEqual(legacy);
    expect(result.unsupportedFields).toEqual(expect.arrayContaining(['nails.layers[1].type:unknown', 'privateNote']));
  });

  test('creates explicit downstream handoff requests', () => {
    const base = { requestId: 'request-1', document: document(), requestedAt: '2026-08-03' };
    expect(createHeroExportRequest({ ...base, format: 'png', quality: 'export' }).kind).toBe('export');
    expect(createHeroProductRequest({ ...base, productType: 'press-on-set' }).kind).toBe('product');
    expect(createHeroBlueprintRequest({ ...base, schemaVersion: '1' }).kind).toBe('blueprint');
  });

  test('registers the surface renderer and renders all eight approved masked shapes', () => {
    const registry = new HeroEngineRegistry();
    const engine = registerHeroSurfaceRenderingEngine(registry);
    expect(registry.resolve('Hero Surface Rendering Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['surface.render', 'surface.preview', 'surface.invalidate', 'surface.bounds', 'surface.refresh']);
    const paths = new Set<string>();
    HERO_SHAPE_IDS.forEach((shapeId) => {
      const hero = { ...document(), nail: { ...document().nail, shape: { id: shapeId, version: '1' }, mask: maskReferenceForShape(shapeId)! } };
      const result = engine.refresh(createHeroSurfaceInput(hero, { width: 240, height: 360 }));
      expect(result).toMatchObject({ shapeId, maskId: `${shapeId.toLowerCase()}-mask`, fill: '#F4E8E4' });
      expect(result.path).toMatch(/^M/);
      expect(result.bounds.width).toBeGreaterThan(0);
      expect(result.bounds.height).toBeGreaterThan(result.bounds.width);
      paths.add(result.path);
    });
    expect(paths.size).toBe(HERO_SHAPE_IDS.length);
    expect(engine.state).toBe('Rendered');
  });

  test('reports canonical free-edge render bounds for Round at default, long, and wide geometry', () => {
    const renderRound = (length: number, width: number) => {
      const base = document();
      const hero = { ...base, nail: { ...base.nail, shape: { id: 'Round' as const, version: '1' }, mask: maskReferenceForShape('Round')!, length, width } };
      return new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(hero, { width: 240, height: 360 }));
    };
    const defaultRound = renderRound(.5, .5);
    const longRound = renderRound(2.5, .5);
    const wideRound = renderRound(.5, 1);
    expect(defaultRound.bounds).toEqual({ x: 57, y: 83, width: 126, height: 247.925 });
    expect(defaultRound.bounds.y + defaultRound.bounds.height).toBeGreaterThan(318);
    expect(longRound.bounds.height).toBeCloseTo(480.025, 6);
    expect(longRound.bounds.y + longRound.bounds.height).toBeGreaterThan(318);
    expect(wideRound.bounds).toEqual({ x: 32, y: 83, width: 176, height: 247.925 });
    expect(wideRound.bounds.y + wideRound.bounds.height).toBeGreaterThan(318);
  });

  test.each(['Almond', 'Coffin', 'Square', 'Stiletto'] as const)('keeps nominal render bounds for %s', (shapeId) => {
    const base = document();
    const hero = { ...base, nail: { ...base.nail, shape: { id: shapeId, version: '1' }, mask: maskReferenceForShape(shapeId)! } };
    const result = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(hero, { width: 240, height: 360 }));
    expect(result.bounds).toEqual({ x: 32, y: 28, width: 176, height: 290 });
  });

  test('registers, validates, resolves, and caches the production Hero material', () => {
    const registry = new HeroEngineRegistry();
    const engine = registerHeroMaterialEngine(registry);
    expect(registry.resolve('Hero Material Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['material.resolve', 'material.validate', 'material.apply', 'material.invalidate', 'material.preview']);
    const input = { material: DEFAULT_HERO_MATERIAL_REFERENCE, shapeId: 'Almond' };
    const resolved = engine.process(input);
    expect(resolved).toMatchObject({ id: 'soft-gel-neutral', version: '1', category: 'soft-gel', compatible: true, diagnostics: [] });
    expect(resolveHeroNailMaterial(input)).toBe(resolved);
    expect(() => engine.process({ material: { id: 'missing', version: '1' }, shapeId: 'Almond' })).toThrow('not registered');
    const invalid = { ...HERO_MATERIAL_LIBRARY[0], opacity: 2 };
    expect(new HeroMaterialEngine().validate({ material: invalid, shapeId: 'Almond' }).valid).toBe(true);
    expect(validateHeroNailMaterial(invalid).issues.map(({ code }) => code)).toContain('range');
  });

  test('registers exactly the approved effect capabilities and renders every approved finish', () => {
    const registry = new HeroEngineRegistry(); const events = new HeroDesignEventBus(); const applied = jest.fn();
    events.subscribe('effect.applied', applied);
    const engine = registerHeroEffectEngine(registry, events);
    expect(registry.resolve('Hero Effect Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['effect.resolve', 'effect.validate', 'effect.apply', 'effect.invalidate', 'effect.preview']);
    const parameters = {
      Solid: { baseColor: '#C94A68' }, Gradient: { colorA: '#E95A82', colorB: '#792050', direction: 90 }, Aura: { baseColor: '#F9DDE8', centerColor: '#FFEAF2', auraColor: '#FF5EA8', softness: 0.86, intensity: 0.68 }, ColorBlock: { primaryColor: '#C94A68', secondaryColor: '#F5E7EC', direction: 'vertical', splitPosition: 0.5 }, NegativeSpace: { type: 'vertical-band', position: 0.5, size: 0.26, rotation: 45 },
      Chrome: { baseColor: '#B5A8D2' }, 'Cat Eye': { baseColor: '#351742', stripeDirection: 22, stripeWidth: 0.18, stripeStrength: 0.88 },
      Marble: { baseColor: '#F2E9E7', veinColor: '#9A727A', veinDensity: 0.4 }, Jelly: { baseColor: '#EE4775', translucency: 0.55, opacity: 1 },
    } as const;
    const surface = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(document(), { width: 240, height: 360 }));
    HERO_EFFECT_IDS.forEach((id) => {
      const hero = { ...document(), nail: { ...document().nail, effect: { id, version: '1' as const, parameters: parameters[id] } } };
      const result = applyHeroEffectToSurface(hero, surface, engine);
      expect(result).toMatchObject({ id, shapeId: 'Almond', maskId: 'almond-mask', material: { id: 'soft-gel-neutral' } });
      expect(result.layers.length).toBeGreaterThan(0);
      expect(result.geometry).toEqual({ path: surface.path, bounds: surface.bounds, viewBox: surface.viewBox });
    });
    expect(applied).toHaveBeenCalledTimes(HERO_EFFECT_IDS.length);
  });

  test('builds deterministic, per-nail marble geology without replacing material or mask ownership', () => {
    const marble = { id: 'Marble' as const, version: '1' as const, parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 0.46 } };
    const first = createMarbleVeinModel(marble, 'design-1:nail-2');
    expect(createMarbleVeinModel(marble, 'design-1:nail-2')).toEqual(first);
    expect(createMarbleVeinModel(marble, 'design-1:nail-3')).not.toEqual(first);
    expect(new Set(first.map(({ veinClass }) => veinClass))).toEqual(new Set(['primary', 'secondary', 'hairline', 'diffusion']));
    expect(new Set(first.filter(({ veinClass }) => veinClass === 'primary').map(({ width }) => width)).size).toBeGreaterThan(1);
    const input = createHeroSurfaceInput(document(), { width: 240, height: 360 }); const engine = new HeroEffectEngine();
    const applied = engine.process({ ...input, effect: marble, nailIdentity: 'design-1:nail-2' });
    const again = engine.process({ ...input, effect: marble, nailIdentity: 'design-1:nail-2', designId: 'unrelated-event-value' });
    expect(again).toBe(applied);
    expect(applied.material).toBe(input.material);
    expect(applied.layers).toHaveLength(1);
    expect(applied.layers[0]).toMatchObject({ kind: 'veins', clipToMask: true });
    expect(applied.layers.some((layer) => layer.kind === 'color')).toBe(false);
    expect(applied.maskId).toBe(input.mask.maskId);
  });

  test('keeps Marble geometry independent from styling, density, unrelated state, and serialization', () => {
    const marble = { id: 'Marble' as const, version: '1' as const, parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 0.46, marbleSeed: 'layout-a', opacity: .8, viscosity: .7, shine: .5 } };
    const geometry = (effect: typeof marble, nail = 'design-1:nail-2') => createMarbleVeinModel(effect, nail).map(({ id, path }) => ({ id, path }));
    const original = geometry(marble);
    for (const [property, value] of [['baseColor', '#FFFFFF'], ['veinColor', '#123456'], ['veinDensity', .9], ['opacity', .2], ['viscosity', .1], ['shine', 1]] as const) {
      expect(geometry({ ...marble, parameters: { ...marble.parameters, [property]: value } })).toEqual(original);
    }
    expect(geometry(JSON.parse(JSON.stringify(marble)))).toEqual(original);
    expect(geometry(marble, 'design-1:nail-3')).not.toEqual(original);
    expect(geometry({ ...marble, parameters: { ...marble.parameters, marbleSeed: 'layout-b' } })).not.toEqual(original);

    const sparse = createMarbleVeinModel({ ...marble, parameters: { ...marble.parameters, veinDensity: .2 } }, 'design-1:nail-2');
    const dense = createMarbleVeinModel({ ...marble, parameters: { ...marble.parameters, veinDensity: .8 } }, 'design-1:nail-2');
    const sparseVisible = sparse.filter(({ visible }) => visible);
    expect(dense.filter(({ visible }) => visible).length).toBeGreaterThan(sparseVisible.length);
    sparseVisible.forEach((stream) => expect(dense.find(({ id }) => id === stream.id)?.path).toBe(stream.path));
  });

  test('hydrates legacy Marble designs with a stable layout seed', async () => {
    const legacy = document();
    legacy.nail.effect = { id: 'Marble', version: '1', parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: .46, streamOverrides: { 'primary-0': { geometryOverride: { points: [{ x: 1, y: 2 }, { x: 30, y: 40 }] } } } } };
    const values = new Map([['anitaset.hero-design.v1:design-1', JSON.stringify(legacy)]]);
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) };
    const adapter = new HeroLocalStoragePersistenceAdapter(storage);
    const first = await adapter.load('design-1'); const second = await adapter.load('design-1');
    expect(first?.nail.effect.parameters.marbleSeed).toBe('marble-layout-v1');
    expect(first?.nail.effect.parameters.marbleGeometryVersion).toBe(1);
    expect(second?.nail.effect.parameters.marbleSeed).toBe(first?.nail.effect.parameters.marbleSeed);
    expect(first?.nail.effect.parameters.streamOverrides).toEqual(legacy.nail.effect.parameters.streamOverrides);
    const legacyGeometry = createMarbleVeinModel(first!.nail.effect, 'legacy:nail-0').map(({ id, generatedPath }) => ({ id, generatedPath }));
    const explicitV1 = createMarbleVeinModel({ ...first!.nail.effect, parameters: { ...first!.nail.effect.parameters, marbleGeometryVersion: 1 } }, 'legacy:nail-0').map(({ id, generatedPath }) => ({ id, generatedPath }));
    expect(legacyGeometry).toEqual(explicitV1);
    expect(adapter.compatibilityDiagnostics).toContain('Legacy Hero design design-1 had no Marble layout seed; the deterministic default was applied.');
  });

  test.each([1, 2])('hydrates and persists explicit Marble geometry version %i', async (version) => {
    const saved = document(); saved.nail.effect = { id: 'Marble', version: '1', parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: .46, marbleSeed: 'versioned-layout', marbleGeometryVersion: version } };
    const values = new Map<string, string>(); const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) }; const adapter = new HeroLocalStoragePersistenceAdapter(storage);
    await adapter.save(saved); expect((await adapter.load('design-1'))?.nail.effect.parameters.marbleGeometryVersion).toBe(version);
  });

  test('persists generated deletion tombstones and valid custom Primary widths', async () => {
    const saved = document(); saved.nail.effect = { id: 'Marble', version: '1', parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 1, marbleSeed: 'managed-layout', marbleGeometryVersion: 2, deletedStreamIds: ['primary-0'], customStreams: { 'custom-primary-wide': { veinClass: 'primary', controlPoints: [{ x: 1, y: 2 }, { x: 30, y: 40 }], creationBaseline: [{ x: 1, y: 2 }, { x: 30, y: 40 }], width: 6.75, widthProfile: { start: 1, middle: 1, end: .3 }, formulation: { color: '#D4AF37', finish: 'Cream' }, opacity: .8, softness: 0, visible: true } } } };
    const values = new Map<string, string>(); const adapter = new HeroLocalStoragePersistenceAdapter({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) });
    await adapter.save(saved); const loaded = await adapter.load('design-1'); const streams = createMarbleVeinModel(loaded!.nail.effect, 'managed:nail-0');
    expect(loaded?.nail.effect.parameters.deletedStreamIds).toEqual(['primary-0']); expect(streams.some(({ id }) => id === 'primary-0')).toBe(false);
    expect(streams.find(({ id }) => id === 'custom-primary-wide')?.width).toBe(6.75); expect(streams.some(({ id }) => id === 'primary-1')).toBe(true);
  });

  test('keeps Marble composition transforms and per-stream styling independent from geometry', () => {
    const base = { id: 'Marble' as const, version: '1' as const, parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: .8, marbleSeed: 'layout-controls' } };
    const geometry = (effect: typeof base) => createMarbleVeinModel(effect, 'design:nail-1').map(({ id, path }) => ({ id, path }));
    const original = geometry(base);
    for (const marbleTransform of [{ panX: 20, panY: 0, scale: 1, rotation: 0 }, { panX: 0, panY: 0, scale: 1.7, rotation: 0 }, { panX: 0, panY: 0, scale: 1, rotation: 45 }, { panX: 0, panY: 0, scale: 1, rotation: 0 }]) {
      expect(geometry({ ...base, parameters: { ...base.parameters, marbleTransform } })).toEqual(original);
    }
    const streams = createMarbleVeinModel(base, 'design:nail-1');
    const target = streams.find(({ veinClass }) => veinClass === 'secondary')!;
    const other = streams.find(({ id }) => id !== target.id)!;
    const customized = { ...base, parameters: { ...base.parameters, streamOverrides: { [target.id]: { color: '#D4AF37', width: 2.2, opacity: .31, softness: 1.4, visible: false } } } };
    const changed = createMarbleVeinModel(customized, 'design:nail-1');
    expect(geometry(customized)).toEqual(original);
    expect(changed.find(({ id }) => id === target.id)).toMatchObject({ color: '#D4AF37', width: 2.2, opacity: .31, softness: 1.4, visible: false });
    expect(changed.find(({ id }) => id === other.id)).toEqual(other);
  });

  test('retains subordinate Marble overrides across density eligibility changes', () => {
    const parameters = { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 1, marbleSeed: 'density-controls', streamOverrides: { 'secondary-3': { color: '#D4AF37' } } };
    const dense = createMarbleVeinModel({ id: 'Marble', version: '1', parameters }, 'nail-2').find(({ id }) => id === 'secondary-3')!;
    const sparse = createMarbleVeinModel({ id: 'Marble', version: '1', parameters: { ...parameters, veinDensity: 0 } }, 'nail-2').find(({ id }) => id === 'secondary-3')!;
    const restored = createMarbleVeinModel({ id: 'Marble', version: '1', parameters }, 'nail-2').find(({ id }) => id === 'secondary-3')!;
    expect(sparse.visible).toBe(false);
    expect(restored).toEqual(dense);
    expect(restored.color).toBe('#D4AF37');
  });

  test('keeps direct Marble shaping, taper, and formulation independent and persistent', async () => {
    const base = { id: 'Marble' as const, version: '1' as const, parameters: { baseColor: '#F2E9E7', veinColor: '#704F59', veinDensity: 1, marbleSeed: 'editable-layout' } };
    const generated = createMarbleVeinModel(base, 'design-1:nail-0'); const target = generated.find(({ id }) => id === 'primary-0')!; const untouched = generated.find(({ id }) => id === 'primary-1')!;
    const points = target.controlPoints.map((point, index) => index === 2 ? { x: point.x + 18, y: point.y - 24 } : point);
    const streamOverrides = { [target.id]: { geometryOverride: { points }, widthProfile: { start: 2.4, middle: 1.1, end: .25 }, formulation: { color: '#D4AF37', finish: 'Glitter' }, width: 4.2 } };
    const effect = { ...base, parameters: { ...base.parameters, marbleTransform: { panX: 22, panY: -14, scale: 1.6, rotation: 37 }, streamOverrides } };
    const edited = createMarbleVeinModel(effect, 'design-1:nail-0'); const changed = edited.find(({ id }) => id === target.id)!;
    expect(changed).toMatchObject({ color: '#D4AF37', finish: 'Glitter', width: 4.2, widthProfile: { start: 2.4, middle: 1.1, end: .25 } });
    expect(changed.path).toBe(marblePathFromPoints(points)); expect(changed.path).not.toBe(target.path);
    expect(edited.find(({ id }) => id === untouched.id)?.path).toBe(untouched.path);
    const hero = document(); hero.nail.effect = effect; const values = new Map<string, string>(); const adapter = new HeroLocalStoragePersistenceAdapter({ getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) });
    await adapter.save(hero); const loaded = await adapter.load(hero.metadata.id); const restored = createMarbleVeinModel(loaded!.nail.effect, 'design-1:nail-0').find(({ id }) => id === target.id)!;
    expect(restored.path).toBe(changed.path); expect(restored.widthProfile).toEqual(changed.widthProfile); expect(restored.finish).toBe('Glitter');
    expect(createMarbleVeinModel({ ...effect, parameters: { ...effect.parameters, marbleTransform: { panX: 0, panY: 0, scale: 1, rotation: 0 } } }, 'design-1:nail-0').find(({ id }) => id === target.id)?.path).toBe(changed.path);
  });

  test('builds a continuous variable-width ribbon without changing its centerline', () => {
    const points = [{ x: 10, y: 10 }, { x: 30, y: 45 }, { x: 65, y: 70 }, { x: 90, y: 110 }];
    const centerline = marblePathFromPoints(points);
    const thickToThin = marbleRibbonPath(points, 6, { start: 2, middle: 1, end: .2 });
    const thinToThick = marbleRibbonPath(points, 6, { start: .2, middle: 1, end: 2 });
    expect(thickToThin).toMatch(/^M .* Z$/); expect(thinToThick).toMatch(/^M .* Z$/);
    expect(thickToThin).not.toBe(thinToThick);
    expect(marblePathFromPoints(points)).toBe(centerline);
    expect(marbleRibbonPath(points, Number.NaN, { start: 1, middle: 1, end: 1 })).toBe('');
  });

  test('bounds tapered and deformed ribbons locally with safe material padding', () => {
    const original = [{ x: 10, y: 20 }, { x: 40, y: 70 }, { x: 80, y: 100 }];
    const deformed = original.map((point, index) => index === 1 ? { x: point.x + 35, y: point.y - 18 } : point);
    const ribbon = marbleRibbonPath(original, 8, { start: 2.5, middle: 1, end: .2 });
    const editedRibbon = marbleRibbonPath(deformed, 8, { start: 2.5, middle: 1, end: .2 });
    const bounds = marbleRibbonBounds(ribbon); const editedBounds = marbleRibbonBounds(editedRibbon);
    expect(bounds.width).toBeLessThan(176); expect(bounds.height).toBeLessThan(290);
    expect(editedBounds).not.toEqual(bounds);
    expect(bounds.x).toBeLessThan(10); expect(bounds.y).toBeLessThan(20);
  });


  test('registers and applies the Hero Lighting Engine to every approved finish without changing geometry', () => {
    const registry = new HeroEngineRegistry(); const events = new HeroDesignEventBus(); const applied = jest.fn();
    events.subscribe('lighting.applied', applied);
    const engine = registerHeroLightingEngine(registry, events);
    expect(registry.resolve('Hero Lighting Engine')).toBe(engine);
    expect(engine.capabilities).toEqual(['lighting.resolve', 'lighting.validate', 'lighting.apply', 'lighting.invalidate', 'lighting.preview']);
    const parameters = {
      Solid: { baseColor: '#C94A68' }, Gradient: { colorA: '#E95A82', colorB: '#792050', direction: 90 }, Aura: { baseColor: '#F9DDE8', centerColor: '#FFEAF2', auraColor: '#FF5EA8', softness: 0.86, intensity: 0.68 }, ColorBlock: { primaryColor: '#C94A68', secondaryColor: '#F5E7EC', direction: 'vertical', splitPosition: 0.5 }, NegativeSpace: { type: 'vertical-band', position: 0.5, size: 0.26, rotation: 45 },
      Chrome: { baseColor: '#B5A8D2', shine: 0.9 }, 'Cat Eye': { baseColor: '#351742', stripeDirection: 22, stripeWidth: 0.18, stripeStrength: 0.88 },
      Marble: { baseColor: '#F2E9E7', veinColor: '#9A727A', veinDensity: 0.4 }, Jelly: { baseColor: '#EE4775', translucency: 0.55, opacity: 1 },
    } as const;
    const surface = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(document(), { width: 240, height: 360 }));
    HERO_EFFECT_IDS.forEach((id) => {
      const hero = { ...document(), nail: { ...document().nail, effect: { id, version: '1' as const, parameters: parameters[id] } } };
      const effect = applyHeroEffectToSurface(hero, surface);
      const result = applyHeroLightingToEffect(hero, effect, engine);
      expect(result).toMatchObject({ shapeId: 'Almond', maskId: 'almond-mask', effectId: id, materialId: 'soft-gel-neutral' });
      expect(result.geometry).toEqual(effect.geometry);
      expect(result.reflections.map(({ id }) => id)).toEqual(['primary', 'secondary', 'edge', 'apex', 'depth']);
    });
    expect(applied).toHaveBeenCalledTimes(HERO_EFFECT_IDS.length);
  });

  test('resolves finish-specific lighting for chrome, cat eye, marble, jelly, and long nails', () => {
    const surface = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(document(), { width: 240, height: 360 }));
    const lit = (effect) => {
      const hero = { ...document(), nail: { ...document().nail, effect } };
      return applyHeroLightingToEffect(hero, applyHeroEffectToSurface(hero, surface), new HeroLightingEngine());
    };
    const solid = lit({ id: 'Solid', version: '1', parameters: { baseColor: '#C94A68', shine: 0.68 } });
    const chrome = lit({ id: 'Chrome', version: '1', parameters: { baseColor: '#B5A8D2', shine: 0.9 } });
    const catEye = lit({ id: 'Cat Eye', version: '1', parameters: { baseColor: '#351742', stripeDirection: 22, stripeWidth: 0.18, stripeStrength: 0.88 } });
    const marble = lit({ id: 'Marble', version: '1', parameters: { baseColor: '#F2E9E7', veinColor: '#9A727A', veinDensity: 0.4 } });
    const jelly = lit({ id: 'Jelly', version: '1', parameters: { baseColor: '#EE4775', translucency: 0.55, opacity: 1 } });
    expect(chrome.profile.reflection).toBeGreaterThan(solid.profile.reflection);
    expect(chrome.profile.specular).toBeGreaterThan(solid.profile.specular);
    expect(catEye.profile.magneticStripeAlignment).toBe(22);
    expect(marble.profile.veinPreservation).toBeLessThan(1);
    expect(jelly.profile.translucencyBoost).toBeGreaterThan(0.5);
    const longDocument = document(); longDocument.nail.length = 2.5;
    const longSurface = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(longDocument, { width: 240, height: 360 }));
    const longEffect = applyHeroEffectToSurface(longDocument, longSurface);
    const longLighting = applyHeroLightingToEffect(longDocument, longEffect);
    expect(longLighting.geometry).toEqual(longEffect.geometry);
    expect(longLighting.profile.curvatureFalloff).toBeGreaterThan(solid.profile.curvatureFalloff);
  });

  test('validates malformed lighting and invalidates renderer-only lighting state on render input changes', async () => {
    const events = new HeroDesignEventBus(); const redraw = jest.fn(); const failed = jest.fn(); events.subscribe('lighting.validation.failed', failed);
    const engine = new HeroLightingEngine(events);
    const surface = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(document(), { width: 240, height: 360 }));
    const effect = applyHeroEffectToSurface(document(), surface);
    const malformed = { ...document(), lighting: { intensity: 2, direction: { x: 0, y: 0, z: 3 }, color: 'white' } };
    expect(() => applyHeroLightingToEffect(malformed, effect, engine)).toThrow('invalid');
    expect(failed).toHaveBeenCalledTimes(1);
    const disconnect = connectHeroLightingInvalidation(engine, events, redraw);
    events.publish('nail.material.changed', { designId: 'design-1', previous: DEFAULT_HERO_MATERIAL_REFERENCE, material: DEFAULT_HERO_MATERIAL_REFERENCE });
    events.publish('effect.changed', { designId: 'design-1', previous: document().nail.effect, effect: document().nail.effect });
    await Promise.resolve(); expect(redraw).toHaveBeenCalledTimes(1); disconnect();
  });
  test('rejects unsupported, malformed, and incompatible effects and publishes failures', () => {
    const events = new HeroDesignEventBus(); const failed = jest.fn(); events.subscribe('effect.validation.failed', failed);
    const engine = new HeroEffectEngine(events); const input = createHeroSurfaceInput(document(), { width: 240, height: 360 });
    expect(() => engine.process({ ...input, effect: { id: 'Neon' as never, version: '1', parameters: {} }, designId: 'design-1' })).toThrow('not approved');
    expect(() => engine.process({ ...input, effect: { id: 'Jelly', version: '1', parameters: { baseColor: 'red', translucency: 2, noise: true } }, designId: 'design-1' })).toThrow('invalid');
    expect(() => engine.process({ ...input, mask: resolveHeroNailMask(maskReferenceForShape('Duck')!), effect: document().nail.effect, designId: 'design-1' })).toThrow('must match');
    expect(failed).toHaveBeenCalledTimes(3);
  });

  test('validates and resolves canonical Polish Studio finish controls', () => {
    const engine = new HeroEffectEngine();
    const input = createHeroSurfaceInput(document(), { width: 240, height: 360 });
    const effect = { id: 'Solid' as const, version: '1' as const, parameters: { baseColor: '#D94C70', opacity: 0.7, viscosity: 0.4, shine: 0.8 } };
    expect(engine.process({ ...input, effect })).toMatchObject({ opacity: 0.7, viscosity: 0.4, shine: 0.8, layers: [{ opacity: 0.7 }] });
    expect(engine.validate({ ...input, effect: { ...effect, parameters: { ...effect.parameters, shine: 1.1 } } }).issues.map(({ path }) => path)).toContain('effect.parameters.shine');
  });

  test('updates and persists effect parameters while preserving the Hero document', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const adapter = new HeroLocalStoragePersistenceAdapter(storage); const events = new HeroDesignEventBus(); const changedEvent = jest.fn(); const redraw = jest.fn();
    events.subscribe('effect.changed', changedEvent);
    const disconnect = connectHeroSurfaceInvalidation(new HeroSurfaceRenderingEngine(events), events, redraw);
    const original = { ...document(), layers: [layer('kept')], product: { productId: 'kept' } };
    const loaded = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: original });
    const negativeSpace = { id: 'NegativeSpace' as const, version: '1' as const, parameters: { type: 'diagonal-band', position: 0.35, size: 0.3, rotation: 55 } };
    const changed = updateHeroEffect(loaded, negativeSpace, events);
    expect(changed.document?.revision).toBe(1); expect(changed.dirty).toBe(true);
    expect(changed.document?.nail.shape).toEqual(original.nail.shape); expect(changed.document?.nail.material).toEqual(original.nail.material);
    expect(changed.document?.layers).toEqual(original.layers); expect(changed.document?.product).toEqual(original.product);
    await adapter.save(changed.document!);
    expect((await adapter.load('design-1'))?.nail.effect).toEqual(negativeSpace);
    expect(changedEvent).toHaveBeenCalledTimes(1);
    await Promise.resolve(); expect(redraw).toHaveBeenCalledTimes(1); disconnect();
  });

  test('applies material to every shape without changing geometry and emits material application', () => {
    const events = new HeroDesignEventBus(); const applied = jest.fn(); events.subscribe('surface.material.applied', applied);
    const engine = new HeroSurfaceRenderingEngine(events);
    HERO_SHAPE_IDS.forEach((shapeId) => {
      const hero = { ...document(), nail: { ...document().nail, shape: { id: shapeId, version: '1' }, mask: maskReferenceForShape(shapeId)! } };
      const before = createHeroSurfaceInput(hero, { width: 240, height: 360 }).shape;
      const result = engine.refresh(createHeroSurfaceInput(hero, { width: 240, height: 360 }));
      expect(result.material.id).toBe('soft-gel-neutral'); expect(result.shapeId).toBe(before.id);
    });
    expect(applied).toHaveBeenCalledTimes(HERO_SHAPE_IDS.length);
  });

  test('material changes preserve document content, increment revision, mark dirty, invalidate and redraw', async () => {
    const events = new HeroDesignEventBus(); const redraw = jest.fn(); const renderer = new HeroSurfaceRenderingEngine(events);
    const disconnect = connectHeroSurfaceInvalidation(renderer, events, redraw);
    const original = { ...document(), layers: [layer('kept')], product: { productId: 'kept' } };
    const loaded = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: original });
    const unchanged = updateHeroMaterial(loaded, DEFAULT_HERO_MATERIAL_REFERENCE, events);
    expect(unchanged).toBe(loaded);
    // The only production material is versioned; use a validated library alias to exercise state lifecycle.
    const alternate = { id: 'soft-gel-neutral', version: '1' };
    const source = { ...loaded, document: { ...original, nail: { ...original.nail, material: { id: 'soft-gel-neutral', version: '0' } } } };
    const changed = updateHeroMaterial(source, alternate, events);
    expect(changed.document?.revision).toBe(1); expect(changed.dirty).toBe(true);
    expect(changed.document?.layers).toEqual(original.layers); expect(changed.document?.product).toEqual(original.product);
    await Promise.resolve(); expect(redraw).toHaveBeenCalledTimes(1); disconnect();
  });

  test('renders a complete 250% nail without clipping while retaining Duck internally', () => {
    const longDocument = document();
    longDocument.nail.length = 2.5;
    const result = new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(longDocument, { width: 240, height: 360 }));
    const [, viewTop, , viewHeight] = result.viewBox.split(' ').map(Number);
    expect(HERO_SHAPE_IDS).toContain('Duck');
    expect(result.bounds.height).toBe(455);
    expect(viewTop).toBeLessThan(result.bounds.y);
    expect(viewHeight).toBeGreaterThan(result.bounds.height);
    expect(validateHeroDesignDocument(longDocument).valid).toBe(true);
  });

  test('rejects missing or mismatched shape and mask inputs instead of silently rendering a fallback', () => {
    const missingShape = { ...document(), nail: { ...document().nail, shape: { id: 'Missing', version: '1' } } };
    expect(() => createHeroSurfaceInput(missingShape, { width: 240, height: 360 })).toThrow('Hero shape is unavailable: Missing');

    const mismatchedMask = { ...document(), nail: { ...document().nail, mask: maskReferenceForShape('Duck')! } };
    expect(() => new HeroSurfaceRenderingEngine().process(createHeroSurfaceInput(mismatchedMask, { width: 240, height: 360 }))).toThrow('does not match');
  });

  test('publishes renderer transitions, invalidates geometry changes, coalesces redraws, and fails safely', async () => {
    const events = new HeroDesignEventBus(); const redraw = jest.fn();
    const engine = new HeroSurfaceRenderingEngine(events);
    const started = jest.fn(); const completed = jest.fn(); const invalidated = jest.fn(); const failed = jest.fn();
    events.subscribe('surface.render.started', started); events.subscribe('surface.render.completed', completed);
    events.subscribe('surface.render.invalidated', invalidated); events.subscribe('surface.render.failed', failed);
    engine.process(createHeroSurfaceInput(document(), { width: 240, height: 360 }));
    expect(started).toHaveBeenCalledTimes(1); expect(completed).toHaveBeenCalledTimes(1); expect(engine.state).toBe('Rendered');
    const disconnect = connectHeroSurfaceInvalidation(engine, events, redraw);
    events.publish('shape.length.changed', { designId: 'design-1', shapeId: 'Almond', length: 0.8 });
    events.publish('shape.width.changed', { designId: 'design-1', shapeId: 'Almond', width: 0.7 });
    expect(engine.state).toBe('Invalid'); expect(invalidated).toHaveBeenCalledTimes(2);
    await Promise.resolve(); expect(redraw).toHaveBeenCalledTimes(1);
    expect(() => engine.process({ ...createHeroSurfaceInput(document(), { width: 240, height: 360 }), viewport: { width: 0, height: 0 } })).toThrow('positive');
    expect(engine.state).toBe('Failed'); expect(failed).toHaveBeenCalledTimes(1);
    disconnect();
  });
});
