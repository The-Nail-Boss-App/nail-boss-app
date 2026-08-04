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
  HERO_EFFECT_IDS, HeroEffectEngine, registerHeroEffectEngine, applyHeroEffectToSurface,
  updateHeroEffect,
} from './index';

const layer = (id: string): HeroLayer => ({
  id, name: id, type: 'base', opacity: 1, visible: true, locked: false, blendMode: 'normal',
  transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, payload: { color: '#fff' },
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
    expect(engine.capabilities).toEqual(['effect.resolve', 'effect.validate', 'effect.apply', 'effect.preview', 'effect.invalidate']);
    const parameters = {
      Solid: { color: '#C94A68' }, Gradient: { startColor: '#E95A82', endColor: '#792050', angle: 90 },
      Chrome: { color: '#B5A8D2', intensity: 0.8 }, 'Cat Eye': { baseColor: '#351742', stripeColor: '#E9A9DE', position: 0.5 },
      Marble: { baseColor: '#F2E9E7', veinColor: '#9A727A', intensity: 0.4 }, Jelly: { color: '#EE4775', opacity: 0.45 },
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

  test('rejects unsupported, malformed, and incompatible effects and publishes failures', () => {
    const events = new HeroDesignEventBus(); const failed = jest.fn(); events.subscribe('effect.validation.failed', failed);
    const engine = new HeroEffectEngine(events); const input = createHeroSurfaceInput(document(), { width: 240, height: 360 });
    expect(() => engine.process({ ...input, effect: { id: 'Neon' as never, version: '1', parameters: {} }, designId: 'design-1' })).toThrow('not approved');
    expect(() => engine.process({ ...input, effect: { id: 'Jelly', version: '1', parameters: { color: 'red', opacity: 2, noise: true } }, designId: 'design-1' })).toThrow('invalid');
    expect(() => engine.process({ ...input, mask: resolveHeroNailMask(maskReferenceForShape('Duck')!), effect: document().nail.effect, designId: 'design-1' })).toThrow('must match');
    expect(failed).toHaveBeenCalledTimes(3);
  });

  test('updates and persists effect parameters while preserving the Hero document', async () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
    const adapter = new HeroLocalStoragePersistenceAdapter(storage); const events = new HeroDesignEventBus(); const changedEvent = jest.fn(); const redraw = jest.fn();
    events.subscribe('effect.changed', changedEvent);
    const disconnect = connectHeroSurfaceInvalidation(new HeroSurfaceRenderingEngine(events), events, redraw);
    const original = { ...document(), layers: [layer('kept')], product: { productId: 'kept' } };
    const loaded = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: original });
    const changed = updateHeroEffect(loaded, { id: 'Jelly', version: '1', parameters: { color: '#EE4775', opacity: 0.45 } }, events);
    expect(changed.document?.revision).toBe(1); expect(changed.dirty).toBe(true);
    expect(changed.document?.nail.shape).toEqual(original.nail.shape); expect(changed.document?.nail.material).toEqual(original.nail.material);
    expect(changed.document?.layers).toEqual(original.layers); expect(changed.document?.product).toEqual(original.product);
    await adapter.save(changed.document!);
    expect((await adapter.load('design-1'))?.nail.effect).toEqual({ id: 'Jelly', version: '1', parameters: { color: '#EE4775', opacity: 0.45 } });
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
