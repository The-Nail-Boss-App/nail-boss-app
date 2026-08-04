import { HeroEffectId, HeroEffectReference, HeroEngine, HeroValidationIssue, HeroValidationResult } from './contracts';
import { HeroDesignEventBus } from './events';
import { HeroResolvedNailMask } from './mask';
import { HeroResolvedNailMaterial } from './material';
import { HeroEngineRegistry } from './registry';
import { HeroShapeDefinition } from './shape';
import { resolveHeroShape } from './shape';
import { resolveHeroNailMask } from './mask';
import { resolveHeroNailMaterial } from './material';
import { HeroDesignDocument } from './contracts';
import { HeroDesignState, heroDesignReducer } from './state';
import { HeroSurfaceRenderResult } from './surface';

export const HERO_EFFECT_IDS = Object.freeze(['Solid', 'Gradient', 'Chrome', 'Cat Eye', 'Marble', 'Jelly'] as const);
export const DEFAULT_HERO_EFFECT_REFERENCE: Readonly<HeroEffectReference> = Object.freeze({
  id: 'Solid', version: '1', parameters: Object.freeze({ color: '#D94C70' }),
});

type ParameterRule = { required: boolean; validate: (value: unknown) => boolean; message: string };
const color = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const unit = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const angle = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 360;
const commonRules: Record<string, ParameterRule> = {
  opacity: { required: false, validate: unit, message: 'opacity must be between 0 and 1.' },
  viscosity: { required: false, validate: unit, message: 'viscosity must be between 0 and 1.' },
  shine: { required: false, validate: unit, message: 'shine must be between 0 and 1.' },
};
const finishRules: Record<HeroEffectId, Record<string, ParameterRule>> = {
  Solid: { color: { required: true, validate: color, message: 'color must be a six-digit hex color.' } },
  Gradient: {
    startColor: { required: true, validate: color, message: 'startColor must be a six-digit hex color.' },
    endColor: { required: true, validate: color, message: 'endColor must be a six-digit hex color.' },
    angle: { required: false, validate: angle, message: 'angle must be between 0 and 360.' },
  },
  Chrome: {
    color: { required: true, validate: color, message: 'color must be a six-digit hex color.' },
    intensity: { required: false, validate: unit, message: 'intensity must be between 0 and 1.' },
  },
  'Cat Eye': {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    stripeColor: { required: true, validate: color, message: 'stripeColor must be a six-digit hex color.' },
    angle: { required: false, validate: angle, message: 'angle must be between 0 and 360.' },
    position: { required: false, validate: unit, message: 'position must be between 0 and 1.' },
    width: { required: false, validate: unit, message: 'width must be between 0 and 1.' },
  },
  Marble: {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    veinColor: { required: true, validate: color, message: 'veinColor must be a six-digit hex color.' },
    intensity: { required: false, validate: unit, message: 'intensity must be between 0 and 1.' },
  },
  Jelly: {
    color: { required: true, validate: color, message: 'color must be a six-digit hex color.' },
  },
};
const rules = Object.fromEntries(Object.entries(finishRules).map(([id, schema]) => [id, { ...commonRules, ...schema }])) as Record<HeroEffectId, Record<string, ParameterRule>>;

const issue = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
export function validateHeroEffectReference(effect: HeroEffectReference | undefined): HeroValidationResult {
  const issues: HeroValidationIssue[] = [];
  if (!effect || !HERO_EFFECT_IDS.includes(effect.id as HeroEffectId)) return { valid: false, issues: [issue('effect.id', 'unsupported_effect', 'Effect ID is not approved.')] };
  if (effect.version !== '1') issues.push(issue('effect.version', 'unsupported_version', 'Effect version is not supported.'));
  if (!effect.parameters || typeof effect.parameters !== 'object' || Array.isArray(effect.parameters)) return { valid: false, issues: [...issues, issue('effect.parameters', 'malformed_parameters', 'Effect parameters must be an object.')] };
  const schema = rules[effect.id];
  Object.keys(effect.parameters).filter((key) => !schema[key]).forEach((key) => issues.push(issue(`effect.parameters.${key}`, 'unsupported_parameter', `${key} is not supported by ${effect.id}.`)));
  Object.entries(schema).forEach(([key, rule]) => {
    const value = effect.parameters[key];
    if (value === undefined && rule.required) issues.push(issue(`effect.parameters.${key}`, 'required', `${key} is required.`));
    else if (value !== undefined && !rule.validate(value)) issues.push(issue(`effect.parameters.${key}`, 'malformed_value', rule.message));
  });
  return { valid: issues.length === 0, issues };
}

export interface HeroEffectInput {
  effect: HeroEffectReference;
  shape: HeroShapeDefinition;
  mask: HeroResolvedNailMask;
  material: HeroResolvedNailMaterial;
  surface?: HeroSurfaceRenderResult;
  designId?: string;
}
export interface HeroFinishLayer { kind: 'color' | 'linear-gradient' | 'veins'; opacity: number; color?: string; colors?: readonly string[]; angle?: number; position?: number; width?: number; paths?: readonly string[] }
export interface HeroAppliedEffect {
  id: HeroEffectId;
  version: '1';
  parameters: Readonly<Record<string, unknown>>;
  /** Original material remains available; this renderer-only style decorates it. */
  material: HeroResolvedNailMaterial;
  layers: readonly HeroFinishLayer[];
  /** Canonical Polish Studio controls, resolved without changing the underlying material. */
  opacity: number;
  viscosity: number;
  shine: number;
  shapeId: string;
  maskId: string;
  geometry?: Pick<HeroSurfaceRenderResult, 'path' | 'bounds' | 'viewBox'>;
  cacheKey: string;
}

const numberParameter = (parameters: Record<string, unknown>, key: string, fallback: number) => parameters[key] === undefined ? fallback : parameters[key] as number;
function finishLayers(effect: HeroEffectReference): readonly HeroFinishLayer[] {
  const p = effect.parameters;
  const opacity = numberParameter(p, 'opacity', effect.id === 'Jelly' ? 0.48 : 1);
  switch (effect.id) {
    case 'Solid': return [{ kind: 'color', color: p.color as string, opacity }];
    case 'Gradient': return [{ kind: 'linear-gradient', colors: [p.startColor as string, p.endColor as string], angle: numberParameter(p, 'angle', 90), opacity }];
    case 'Chrome': {
      const intensity = numberParameter(p, 'intensity', 0.82);
      return [{ kind: 'linear-gradient', colors: [p.color as string, '#FFFFFF', p.color as string, '#64646B', p.color as string], angle: 90, opacity: opacity * (0.72 + intensity * 0.28) }];
    }
    case 'Cat Eye': return [
      { kind: 'color', color: p.baseColor as string, opacity },
      { kind: 'linear-gradient', colors: ['transparent', p.stripeColor as string, 'transparent'], angle: numberParameter(p, 'angle', 22), position: numberParameter(p, 'position', 0.5), width: numberParameter(p, 'width', 0.18), opacity: 0.88 },
    ];
    case 'Marble': return [
      { kind: 'color', color: p.baseColor as string, opacity: opacity * 0.94 },
      { kind: 'veins', color: p.veinColor as string, opacity: numberParameter(p, 'intensity', 0.42), paths: ['M-.08 .18 C.22 .08 .16 .43 .52 .38 S.78 .68 1.08 .53', 'M.07 .83 C.31 .64 .41 .91 .66 .73 S.87 .44 1.03 .33', 'M.18 -.05 C.38 .21 .62 .06 .74 .31'] },
    ];
    case 'Jelly': return [{ kind: 'color', color: p.color as string, opacity }];
  }
}

export class HeroEffectEngine implements HeroEngine<HeroEffectInput, HeroAppliedEffect> {
  readonly id = 'Hero Effect Engine' as const;
  readonly version = '1';
  readonly capabilities = ['effect.resolve', 'effect.validate', 'effect.apply', 'effect.preview', 'effect.invalidate'] as const;
  private cache = new Map<string, HeroAppliedEffect>();
  constructor(private readonly events = new HeroDesignEventBus()) {}
  initialize(): void {}
  validate(input: HeroEffectInput): HeroValidationResult {
    const validation = validateHeroEffectReference(input?.effect);
    const issues = [...validation.issues];
    if (!input?.shape || input.mask?.shapeId !== input.shape.id) issues.push(issue('effect.compatibility', 'incompatible_geometry', 'Effect shape and mask must match.'));
    if (!input?.material?.compatibleShapeIds.includes(input?.shape?.id as never)) issues.push(issue('effect.compatibility', 'incompatible_material', 'Effect material is incompatible with the shape.'));
    if (input?.surface && (input.surface.shapeId !== input.shape?.id || input.surface.maskId !== input.mask?.maskId)) issues.push(issue('effect.compatibility', 'incompatible_surface', 'Effect cannot replace the rendered surface geometry.'));
    return { valid: issues.length === 0, issues };
  }
  process(input: HeroEffectInput): HeroAppliedEffect {
    const validation = this.validate(input);
    if (!validation.valid) { this.events.publish('effect.validation.failed', { designId: input?.designId, issues: validation.issues }); throw new Error(`Hero effect is invalid: ${validation.issues.map(({ message }) => message).join(' ')}`); }
    const key = [input.effect.id, input.effect.version, JSON.stringify(input.effect.parameters), input.material.cacheKey, input.shape.id, input.mask.maskId, input.surface?.path ?? ''].join(':');
    let applied = this.cache.get(key);
    if (!applied) {
      applied = Object.freeze({ id: input.effect.id, version: input.effect.version, parameters: Object.freeze({ ...input.effect.parameters }), material: input.material, layers: Object.freeze(finishLayers(input.effect)), opacity: numberParameter(input.effect.parameters, 'opacity', input.effect.id === 'Jelly' ? 0.48 : 1), viscosity: numberParameter(input.effect.parameters, 'viscosity', 0.62), shine: numberParameter(input.effect.parameters, 'shine', 0.68), shapeId: input.shape.id, maskId: input.mask.maskId, geometry: input.surface ? { path: input.surface.path, bounds: input.surface.bounds, viewBox: input.surface.viewBox } : undefined, cacheKey: key });
      this.cache.set(key, applied);
    }
    this.events.publish('effect.applied', { designId: input.designId, effect: applied });
    return applied;
  }
  invalidate(): void { this.cache.clear(); }
  dispose(): void { this.cache.clear(); }
}

export const registerHeroEffectEngine = (registry: HeroEngineRegistry, events?: HeroDesignEventBus): HeroEffectEngine => { const engine = new HeroEffectEngine(events); registry.register(engine); return engine; };

/** Final, non-lighted pipeline handoff: decorates an existing surface without changing its path or bounds. */
export function applyHeroEffectToSurface(document: HeroDesignDocument, surface: HeroSurfaceRenderResult, engine = new HeroEffectEngine()): HeroAppliedEffect {
  const shape = resolveHeroShape(document.nail.shape.id, document.nail.shape.version);
  if (!shape) throw new Error(`Hero effect shape is unavailable: ${document.nail.shape.id}`);
  return engine.process({
    designId: document.metadata.id, effect: document.nail.effect, shape,
    mask: resolveHeroNailMask(document.nail.mask),
    material: resolveHeroNailMaterial({ material: document.nail.material, shapeId: shape.id }),
    surface,
  });
}

export function updateHeroEffect(state: HeroDesignState, effect: HeroEffectReference, events = new HeroDesignEventBus()): HeroDesignState {
  if (!state.document) return state;
  const validation = validateHeroEffectReference(effect);
  if (!validation.valid) { events.publish('effect.validation.failed', { designId: state.document.metadata.id, issues: validation.issues }); throw new Error(`Hero effect is invalid: ${validation.issues.map(({ message }) => message).join(' ')}`); }
  const previous = state.document.nail.effect;
  if (previous.id === effect.id && previous.version === effect.version && JSON.stringify(previous.parameters) === JSON.stringify(effect.parameters)) return state;
  const next = heroDesignReducer(state, { type: 'updateNail', patch: { effect: { ...effect, parameters: { ...effect.parameters } } } });
  events.publish('effect.changed', { designId: state.document.metadata.id, previous, effect });
  return next;
}
