import { HeroDesignDocument, HeroEngine, HeroLightingConfiguration, HeroValidationIssue, HeroValidationResult } from './contracts';
import { HeroAppliedEffect, HERO_EFFECT_IDS } from './effect';
import { HeroDesignEventBus } from './events';
import { HeroResolvedNailMaterial } from './material';
import { HeroEngineRegistry } from './registry';
import { HeroShapeDefinition, resolveHeroShape } from './shape';

export interface HeroLightingInput {
  document: HeroDesignDocument;
  shape: HeroShapeDefinition;
  material: HeroResolvedNailMaterial;
  effect: HeroAppliedEffect;
  lighting?: HeroLightingConfiguration;
  designId?: string;
}

export interface HeroLightingReflection {
  id: 'primary' | 'secondary' | 'edge' | 'apex' | 'depth';
  opacity: number;
  width: number;
  blur: number;
  offset: number;
  color: string;
  angle: number;
  blendMode: 'screen' | 'overlay' | 'multiply';
}

export interface HeroLightingProfile {
  finishId: HeroAppliedEffect['id'];
  specular: number;
  reflection: number;
  edgeSheen: number;
  apex: number;
  curvatureFalloff: number;
  depthCue: number;
  translucencyBoost: number;
  veinPreservation: number;
  magneticStripeAlignment?: number;
}

export interface HeroAppliedLighting {
  id: 'Hero Lighting Engine';
  version: '1';
  profile: HeroLightingProfile;
  reflections: readonly HeroLightingReflection[];
  shapeId: string;
  maskId: string;
  effectId: HeroAppliedEffect['id'];
  materialId: string;
  geometry: NonNullable<HeroAppliedEffect['geometry']>;
  cacheKey: string;
}

const unit = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const color = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const issue = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
const clamp = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(4))));
const num = (parameters: Readonly<Record<string, unknown>>, key: string, fallback: number) => unit(parameters[key]) ? parameters[key] as number : fallback;

function resolveProfile(input: HeroLightingInput): HeroLightingProfile {
  const shine = num(input.effect.parameters, 'shine', input.effect.shine);
  const roughness = input.material.surfaceRoughness;
  const curvature = input.material.curvatureDepth;
  const lengthBoost = clamp((input.document.nail.length - 1) * 0.1 + 0.08);
  const base = {
    Solid: { specular: 0.42, reflection: 0.24, edgeSheen: 0.26, apex: 0.36, depthCue: 0.26, translucencyBoost: 0, veinPreservation: 1 },
    Aura: { specular: 0.46, reflection: 0.28, edgeSheen: 0.28, apex: 0.38, depthCue: 0.28, translucencyBoost: 0, veinPreservation: 1 },
    Gradient: { specular: 0.46, reflection: 0.28, edgeSheen: 0.28, apex: 0.38, depthCue: 0.28, translucencyBoost: 0, veinPreservation: 1 },
    Chrome: { specular: 0.86, reflection: 0.78, edgeSheen: 0.55, apex: 0.62, depthCue: 0.34, translucencyBoost: 0, veinPreservation: 1 },
    'Cat Eye': { specular: 0.58, reflection: 0.44, edgeSheen: 0.38, apex: 0.5, depthCue: 0.32, translucencyBoost: 0, veinPreservation: 1 },
    Marble: { specular: 0.34, reflection: 0.2, edgeSheen: 0.22, apex: 0.3, depthCue: 0.42, translucencyBoost: 0, veinPreservation: 0.78 },
    Jelly: { specular: 0.5, reflection: 0.32, edgeSheen: 0.34, apex: 0.44, depthCue: 0.5, translucencyBoost: 0.52, veinPreservation: 1 },
  }[input.effect.id];
  return Object.freeze({
    finishId: input.effect.id,
    specular: clamp(base.specular * (0.74 + shine * 0.46) * (1 - roughness * 0.32)),
    reflection: clamp(base.reflection * (0.82 + shine * 0.38)),
    edgeSheen: clamp(base.edgeSheen * (0.9 + curvature * 0.5)),
    apex: clamp(base.apex * (0.9 + curvature * 0.55)),
    curvatureFalloff: clamp(0.45 + curvature * 0.35 + lengthBoost),
    depthCue: clamp(base.depthCue + input.material.density * 0.1),
    translucencyBoost: clamp(base.translucencyBoost + input.material.translucency * (input.effect.id === 'Jelly' ? 0.45 : 0.08)),
    veinPreservation: base.veinPreservation,
    magneticStripeAlignment: input.effect.id === 'Cat Eye' ? input.effect.parameters.stripeDirection as number : undefined,
  });
}

function reflections(profile: HeroLightingProfile, light: HeroLightingConfiguration): readonly HeroLightingReflection[] {
  const angle = Math.atan2(light.direction.y, light.direction.x || 0.001) * 180 / Math.PI;
  return Object.freeze([
    { id: 'primary', opacity: clamp(profile.specular * light.intensity), width: clamp(0.14 + profile.reflection * 0.16), blur: 0.18, offset: -0.18, color: light.color, angle, blendMode: 'screen' },
    { id: 'secondary', opacity: clamp(profile.reflection * 0.55 * light.intensity), width: 0.36, blur: 0.36, offset: 0.2, color: light.color, angle: angle + 18, blendMode: 'screen' },
    { id: 'edge', opacity: clamp(profile.edgeSheen * light.intensity), width: 0.18, blur: 0.22, offset: 0, color: light.color, angle: 90, blendMode: 'screen' },
    { id: 'apex', opacity: clamp(profile.apex * light.intensity), width: 0.22, blur: 0.28, offset: -0.04, color: light.color, angle: profile.magneticStripeAlignment ?? 88, blendMode: 'screen' },
    { id: 'depth', opacity: clamp(profile.depthCue * (1 - profile.translucencyBoost * 0.35)), width: 0.3, blur: 0.34, offset: 0.42, color: '#000000', angle: 90, blendMode: 'multiply' },
  ]);
}

export class HeroLightingEngine implements HeroEngine<HeroLightingInput, HeroAppliedLighting> {
  readonly id = 'Hero Lighting Engine' as const;
  readonly version = '1';
  readonly capabilities = ['lighting.resolve', 'lighting.validate', 'lighting.apply', 'lighting.invalidate', 'lighting.preview'] as const;
  private cache = new Map<string, HeroAppliedLighting>();
  constructor(private readonly events = new HeroDesignEventBus()) {}
  initialize(): void {}
  validate(input: HeroLightingInput): HeroValidationResult {
    const issues: HeroValidationIssue[] = [];
    if (!input?.shape) issues.push(issue('lighting.shape', 'required', 'Lighting requires a resolved Hero shape.'));
    if (!input?.material) issues.push(issue('lighting.material', 'required', 'Lighting requires a resolved Hero material.'));
    if (!input?.effect || !HERO_EFFECT_IDS.includes(input.effect.id)) issues.push(issue('lighting.effect', 'unsupported_finish', 'Lighting finish is not approved.'));
    if (!input?.effect?.geometry) issues.push(issue('lighting.geometry', 'required', 'Lighting cannot alter or invent geometry.'));
    if (input?.effect && input?.shape && input.effect.shapeId !== input.shape.id) issues.push(issue('lighting.geometry', 'incompatible_geometry', 'Lighting cannot change shape geometry.'));
    const light = input?.lighting ?? input?.document?.lighting;
    if (!light || !unit(light.intensity)) issues.push(issue('lighting.intensity', 'range', 'Lighting intensity must be between 0 and 1.'));
    if (light && !color(light.color)) issues.push(issue('lighting.color', 'invalid_color', 'Lighting color must be a six-digit hex color.'));
    ['x', 'y', 'z'].forEach((axis) => { const value = light?.direction?.[axis as 'x' | 'y' | 'z']; if (typeof value !== 'number' || !Number.isFinite(value) || value < -1 || value > 1) issues.push(issue(`lighting.direction.${axis}`, 'range', 'Lighting direction components must be between -1 and 1.')); });
    return { valid: issues.length === 0, issues };
  }
  process(input: HeroLightingInput): HeroAppliedLighting {
    const validation = this.validate(input);
    if (!validation.valid) { this.events.publish('lighting.validation.failed', { designId: input?.designId, issues: validation.issues }); throw new Error(`Hero lighting is invalid: ${validation.issues.map(({ message }) => message).join(' ')}`); }
    const light = input.lighting ?? input.document.lighting;
    const key = [input.shape.id, input.effect.cacheKey, input.material.cacheKey, input.document.nail.length, input.document.nail.width, JSON.stringify(light)].join(':');
    let applied = this.cache.get(key);
    if (!applied) {
      const profile = resolveProfile(input);
      applied = Object.freeze({ id: this.id, version: this.version, profile, reflections: reflections(profile, light), shapeId: input.shape.id, maskId: input.effect.maskId, effectId: input.effect.id, materialId: input.material.id, geometry: input.effect.geometry!, cacheKey: key });
      this.cache.set(key, applied);
    }
    this.events.publish('lighting.applied', { designId: input.designId, lighting: applied });
    return applied;
  }
  invalidate(): void { this.cache.clear(); }
  dispose(): void { this.cache.clear(); }
}

export const registerHeroLightingEngine = (registry: HeroEngineRegistry, events?: HeroDesignEventBus): HeroLightingEngine => { const engine = new HeroLightingEngine(events); registry.register(engine); return engine; };

export function applyHeroLightingToEffect(document: HeroDesignDocument, effect: HeroAppliedEffect, engine = new HeroLightingEngine()): HeroAppliedLighting {
  const shape = resolveHeroShape(document.nail.shape.id, document.nail.shape.version);
  if (!shape) throw new Error(`Hero lighting shape is unavailable: ${document.nail.shape.id}`);
  return engine.process({ document, shape, material: effect.material, effect, lighting: document.lighting, designId: document.metadata.id });
}

export function connectHeroLightingInvalidation(engine: HeroLightingEngine, events: HeroDesignEventBus, redraw: () => void): () => void {
  let queued = false;
  const invalidate = () => { engine.invalidate(); if (!queued) { queued = true; queueMicrotask(() => { queued = false; redraw(); }); } };
  const subscriptions = [
    events.subscribe('shape.selected', invalidate), events.subscribe('shape.length.changed', invalidate), events.subscribe('shape.width.changed', invalidate),
    events.subscribe('nail.material.changed', invalidate), events.subscribe('effect.changed', invalidate),
  ];
  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}
