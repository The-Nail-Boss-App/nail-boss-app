import { HeroDesignEventBus } from './events';
import { HeroNailMaterial, HeroNailMaterialReference, HeroEngine, HeroValidationIssue, HeroValidationResult } from './contracts';
import { HeroEngineRegistry } from './registry';
import { HERO_SHAPE_IDS, HeroShapeId } from './shape';
import { HeroDesignState, heroDesignReducer } from './state';

export const DEFAULT_HERO_MATERIAL_REFERENCE: Readonly<HeroNailMaterialReference> = Object.freeze({ id: 'soft-gel-neutral', version: '1' });
export const HERO_MATERIAL_LIBRARY: readonly Readonly<HeroNailMaterial>[] = Object.freeze([Object.freeze({
  id: 'soft-gel-neutral', version: '1', category: 'soft-gel', opacity: 0.88, translucency: 0.26,
  density: 0.72, edgeSoftness: 0.42, surfaceRoughness: 0.18, curvatureDepth: 0.38, baseTint: '#F2DDD8',
})]);
export interface HeroMaterialResolutionInput { material: HeroNailMaterialReference; shapeId: string }
export interface HeroResolvedNailMaterial extends HeroNailMaterial {
  compatible: boolean; compatibleShapeIds: readonly HeroShapeId[]; diagnostics: HeroValidationIssue[]; cacheKey: string;
}
const error = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
const rangeProperties: (keyof HeroNailMaterial)[] = ['opacity', 'translucency', 'density', 'edgeSoftness', 'surfaceRoughness', 'curvatureDepth'];

export function validateHeroNailMaterial(material: HeroNailMaterial | undefined): HeroValidationResult {
  const issues: HeroValidationIssue[] = [];
  if (!material) return { valid: false, issues: [error('material.id', 'unsupported_material', 'Hero material ID and version are not registered.')] };
  if (!material.id) issues.push(error('material.id', 'required', 'Material ID is required.'));
  if (!material.version) issues.push(error('material.version', 'required', 'Material version is required.'));
  if (!['natural-nail', 'clear-tip', 'soft-gel', 'acrylic', 'builder-gel'].includes(material.category)) issues.push(error('material.category', 'unsupported_category', 'Material category is not supported.'));
  rangeProperties.forEach((property) => { const value = material[property]; if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) issues.push(error(`material.${property}`, 'range', `${property} must be between 0 and 1.`)); });
  if (material.baseTint !== undefined && !/^#[0-9a-f]{6}$/i.test(material.baseTint)) issues.push(error('material.baseTint', 'invalid_color', 'Base tint must be a six-digit hex color.'));
  return { valid: issues.length === 0, issues };
}

const resolutionCache = new Map<string, HeroResolvedNailMaterial>();
export function resolveHeroNailMaterial(input: HeroMaterialResolutionInput): HeroResolvedNailMaterial {
  const definition = HERO_MATERIAL_LIBRARY.find(({ id, version }) => id === input.material?.id && version === input.material?.version);
  const validation = validateHeroNailMaterial(definition as HeroNailMaterial | undefined);
  if (!validation.valid) throw new Error(`Hero material is invalid: ${validation.issues.map(({ message }) => message).join(' ')}`);
  if (!HERO_SHAPE_IDS.includes(input.shapeId as HeroShapeId)) throw new Error(`Hero material shape is unsupported: ${input.shapeId}`);
  const cacheKey = `${definition!.id}@${definition!.version}:${input.shapeId}:${rangeProperties.map((key) => definition![key]).join(':')}:${definition!.baseTint ?? ''}`;
  const cached = resolutionCache.get(cacheKey); if (cached) return cached;
  const resolved = Object.freeze({ ...definition!, compatible: true, compatibleShapeIds: HERO_SHAPE_IDS, diagnostics: [], cacheKey });
  resolutionCache.set(cacheKey, resolved); return resolved;
}

export class HeroMaterialEngine implements HeroEngine<HeroMaterialResolutionInput, HeroResolvedNailMaterial> {
  readonly id = 'Hero Material Engine' as const;
  readonly version = '1';
  readonly capabilities = ['material.resolve', 'material.validate', 'material.apply', 'material.invalidate', 'material.preview'] as const;
  constructor(private readonly events = new HeroDesignEventBus()) {}
  initialize(): void {}
  validate(input: HeroMaterialResolutionInput): HeroValidationResult {
    const definition = HERO_MATERIAL_LIBRARY.find(({ id, version }) => id === input?.material?.id && version === input?.material?.version);
    const result = validateHeroNailMaterial(definition as HeroNailMaterial | undefined);
    if (result.valid && !HERO_SHAPE_IDS.includes(input.shapeId as HeroShapeId)) result.issues.push(error('shapeId', 'incompatible_shape', 'Material is incompatible with the requested shape.'));
    return { valid: result.issues.length === 0, issues: result.issues };
  }
  process(input: HeroMaterialResolutionInput): HeroResolvedNailMaterial {
    const validation = this.validate(input);
    if (!validation.valid) { this.events.publish('nail.material.validation.failed', { issues: validation.issues }); throw new Error(`Hero material is invalid: ${validation.issues.map(({ message }) => message).join(' ')}`); }
    const material = resolveHeroNailMaterial(input); this.events.publish('nail.material.resolved', { material }); return material;
  }
  dispose(): void {}
}
export const registerHeroMaterialEngine = (registry: HeroEngineRegistry, events?: HeroDesignEventBus): HeroMaterialEngine => { const engine = new HeroMaterialEngine(events); registry.register(engine); return engine; };

export function updateHeroMaterial(state: HeroDesignState, reference: HeroNailMaterialReference, events = new HeroDesignEventBus()): HeroDesignState {
  if (!state.document) return state;
  new HeroMaterialEngine(events).process({ material: reference, shapeId: state.document.nail.shape.id });
  const previous = state.document.nail.material;
  if (previous.id === reference.id && previous.version === reference.version) return state;
  const next = heroDesignReducer(state, { type: 'updateNail', patch: { material: { ...reference } } });
  events.publish('nail.material.changed', { designId: state.document.metadata.id, previous, material: reference });
  return next;
}
