import {
  createHeroDesignDocument, validateHeroDesignDocument, HeroEngineRegistry, HeroDesignEventBus,
  heroDesignReducer, initialHeroDesignState, HeroLayer, HeroLocalStoragePersistenceAdapter,
  convertLegacyDesignStudioDocument, createHeroExportRequest, createHeroProductRequest, createHeroBlueprintRequest,
  HERO_SHAPE_IDS, HERO_SHAPE_LIBRARY, HeroShapeEngine, registerHeroShapeEngine, updateHeroShape,
  heroDocumentFromLegacyNail, loadHeroDocumentWithLegacyFallback, nailBasicsFromHero,
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

  test('rejects invalid shape IDs, versions, dimensions, and orientations without substitution', () => {
    const engine = new HeroShapeEngine();
    const invalid = engine.validate({ shapeId: 'Ballerina', shapeVersion: '2', length: 2, width: -1, orientation: 'tip-up' as never });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues.map(({ code }) => code)).toEqual(expect.arrayContaining(['unsupported_shape', 'range', 'unsupported_orientation']));
    expect(() => engine.process({ shapeId: 'Ballerina', shapeVersion: '1', length: 0.5, width: 0.5, orientation: 'tip-down' })).toThrow('invalid');
  });

  test('updates shape dimensions, revision and events while preserving unrelated state', () => {
    const events = new HeroDesignEventBus();
    const selected = jest.fn(); const lengthChanged = jest.fn(); const widthChanged = jest.fn(); const updated = jest.fn();
    events.subscribe('shape.selected', selected); events.subscribe('shape.length.changed', lengthChanged);
    events.subscribe('shape.width.changed', widthChanged); events.subscribe('shape.updated', updated);
    const original = { ...document(), layers: [layer('kept')], lighting: { ...document().lighting }, product: { productId: 'kept' } };
    let state = heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document: original });
    state = updateHeroShape(state, { shapeId: 'Duck', length: 0.7, width: 0.8 }, events);
    expect(state.document?.nail).toMatchObject({ shape: { id: 'Duck', version: '1' }, length: 0.7, width: 0.8, tipDown: true });
    expect(state.document?.revision).toBe(1);
    expect(state.dirty).toBe(true);
    expect(state.document?.layers).toEqual(original.layers);
    expect(state.document?.lighting).toEqual(original.lighting);
    expect(state.document?.product).toEqual(original.product);
    expect(selected).toHaveBeenCalledTimes(1); expect(lengthChanged).toHaveBeenCalledTimes(1);
    expect(widthChanged).toHaveBeenCalledTimes(1); expect(updated).toHaveBeenCalledTimes(1);
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
    await adapter.save({ ...legacyDocument, nail: { ...legacyDocument.nail, shape: { id: 'Stiletto', version: '1' }, length: 0.77, width: 0.33 } });
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
});
