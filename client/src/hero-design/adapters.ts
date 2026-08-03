import { HeroDesignDocument, HeroLayer, HeroLayerType } from './contracts';
import { validateHeroDesignDocument } from './validation';
import { HERO_SHAPE_IDS, HERO_SHAPE_VERSION, HeroShapeId } from './shape';
import { maskReferenceForShape } from './mask';

export interface HeroLegacyConversionResult<TLegacy = unknown> {
  document: HeroDesignDocument | null;
  original: TLegacy;
  unsupportedFields: string[];
  missingFields: string[];
}

const LEGACY_LAYER_TYPES: Record<string, HeroLayerType> = {
  base: 'base', drawing: 'brush', decal: 'sticker', charm: 'embellishment', jewel: 'embellishment',
  gradient: 'effect', pattern: 'effect', frenchTip: 'effect', mask: 'mask', adjustment: 'adjustment', material: 'material',
};
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const own = (value: object, key: string) => Object.prototype.hasOwnProperty.call(value, key);
const LEGACY_SHAPES = new Map<string, HeroShapeId>(HERO_SHAPE_IDS.flatMap((id) => [[id, id], [id.toLowerCase(), id]]));

/** Converts only fields present in current Design Studio documents and reports every omission. */
export function convertLegacyDesignStudioDocument<TLegacy extends Record<string, any>>(legacy: TLegacy): HeroLegacyConversionResult<TLegacy> {
  const original = clone(legacy);
  const unsupportedFields: string[] = [];
  const missingFields: string[] = [];
  const blueprint = legacy.blueprint ?? legacy;
  const nail = blueprint.nails?.find((item: any) => item.id === blueprint.canvas?.activeNailId) ?? blueprint.nails?.[0] ?? legacy.activeNail;
  const metadata = legacy.metadata ?? {};
  const id = legacy.id ?? metadata.id;
  const name = legacy.name ?? legacy.designName ?? metadata.name;
  const legacyShapeId = nail?.shape ?? legacy.shape;
  const shapeId = LEGACY_SHAPES.get(legacyShapeId);
  const shapeVersion = nail?.shapeVersion ?? legacy.shapeVersion ?? HERO_SHAPE_VERSION;
  if (legacyShapeId != null && !shapeId) unsupportedFields.push(`nail.shape:${String(legacyShapeId)}`);
  if (shapeId && shapeVersion !== HERO_SHAPE_VERSION) unsupportedFields.push(`nail.shape.version:${String(shapeVersion)}`);
  const suppliedMaskId = nail?.maskId ?? legacy.maskId;
  const compatibleMask = shapeId ? maskReferenceForShape(shapeId, shapeVersion) : undefined;
  const maskId = suppliedMaskId ?? compatibleMask?.id;
  if (suppliedMaskId && compatibleMask && suppliedMaskId !== compatibleMask.id) unsupportedFields.push(`nail.mask.id:${String(suppliedMaskId)}`);
  const width = blueprint.canvas?.width ?? legacy.canvas?.width;
  const height = blueprint.canvas?.height ?? legacy.canvas?.height;
  ([['metadata.id', id], ['metadata.name', name], ['nail.shape.id', shapeId], ['nail.mask.id', maskId],
    ['nail.length', nail?.length], ['nail.width', nail?.width], ['canvas.width', width], ['canvas.height', height]] as Array<[string, unknown]>)
    .forEach(([path, value]) => { if (value === undefined || value === null || value === '') missingFields.push(path); });

  const layers: HeroLayer[] = [];
  (nail?.layers ?? []).forEach((layer: any, index: number) => {
    const type = LEGACY_LAYER_TYPES[layer.type];
    if (!type) { unsupportedFields.push(`nails.layers[${index}].type:${String(layer.type)}`); return; }
    const transform = layer.transform;
    if (!transform || ['x', 'y', 'scaleX', 'scaleY', 'rotation'].some((key) => !own(transform, key))) {
      missingFields.push(`nails.layers[${index}].transform`); return;
    }
    layers.push({
      id: layer.id, name: layer.name, type, opacity: layer.opacity,
      visible: layer.visible, locked: layer.locked, blendMode: layer.blendMode ?? 'normal',
      transform: clone(transform), payload: clone(layer.data),
    });
    if (!own(layer, 'blendMode')) unsupportedFields.push(`nails.layers[${index}].blendMode:defaulted-normal`);
  });

  const knownTopLevel = new Set(['id', 'name', 'designName', 'metadata', 'blueprint', 'nails', 'canvas', 'activeNail', 'shape', 'shapeVersion', 'maskId', 'lighting', 'product', 'productMetadata', 'blueprintMetadata', 'revision']);
  Object.keys(legacy).filter((key) => !knownTopLevel.has(key)).forEach((key) => unsupportedFields.push(key));
  if (missingFields.length) return { document: null, original, unsupportedFields, missingFields };

  const document: HeroDesignDocument = {
    metadata: { id, name, createdAt: metadata.createdAt, updatedAt: metadata.updatedAt, authorId: metadata.authorId, description: metadata.description, tags: metadata.tags },
    nail: {
      shape: { id: shapeId, version: shapeVersion }, mask: suppliedMaskId === compatibleMask?.id ? compatibleMask! : (compatibleMask ?? { id: maskId }), length: nail.length, width: nail.width,
      tipDown: nail.tipDown,
      view: nail.view,
    },
    layers,
    lighting: legacy.lighting,
    canvas: { width, height, background: blueprint.canvas?.background ?? legacy.canvas?.background, pixelRatio: blueprint.canvas?.pixelRatio ?? legacy.canvas?.pixelRatio },
    product: legacy.product ?? legacy.productMetadata,
    blueprint: legacy.blueprintMetadata,
    revision: legacy.revision,
  };
  const validation = validateHeroDesignDocument(document);
  validation.issues.forEach(({ path }) => { if (!missingFields.includes(path)) missingFields.push(path); });
  return { document: validation.valid ? document : null, original, unsupportedFields, missingFields };
}
