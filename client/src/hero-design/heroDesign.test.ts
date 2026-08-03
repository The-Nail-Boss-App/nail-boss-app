import {
  createHeroDesignDocument, validateHeroDesignDocument, HeroEngineRegistry, HeroDesignEventBus,
  heroDesignReducer, initialHeroDesignState, HeroLayer, HeroLocalStoragePersistenceAdapter,
  convertLegacyDesignStudioDocument, createHeroExportRequest, createHeroProductRequest, createHeroBlueprintRequest,
} from './index';

const layer = (id: string): HeroLayer => ({
  id, name: id, type: 'base', opacity: 1, visible: true, locked: false, blendMode: 'normal',
  transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 }, payload: { color: '#fff' },
});
const document = () => createHeroDesignDocument({ id: 'design-1', name: 'Hero', now: '2026-08-03T00:00:00.000Z', shapeId: 'almond', maskId: 'almond-mask' });

describe('Hero Design integration shell', () => {
  test('creates and validates the canonical document', () => {
    const created = document();
    expect(created.revision).toBe(0);
    expect(created).not.toHaveProperty('flattenedImage');
    expect(validateHeroDesignDocument(created)).toEqual({ valid: true, issues: [] });
    expect(validateHeroDesignDocument({ ...created, nail: { ...created.nail, width: 0 } }).valid).toBe(false);
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
