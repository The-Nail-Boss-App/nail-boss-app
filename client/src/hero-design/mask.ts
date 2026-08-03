import { FOUNDER_APPROVED_NAIL_MASKS } from '../design-studio/blueprint';
import { HeroEngine, HeroNailMaskReference, HeroValidationIssue, HeroValidationResult } from './contracts';
import { HeroDesignEventBus } from './events';
import { HeroEngineRegistry } from './registry';
import { HERO_SHAPE_IDS, HERO_SHAPE_VERSION, HeroShapeId } from './shape';

export const HERO_MASK_VERSION = '1' as const;
export const HERO_MASK_SAFE_MARGIN_RANGE = { min: 0, max: 0.25 } as const;
export interface HeroNormalizedBounds { x: number; y: number; width: number; height: number }
export interface HeroMaskDiagnostics { valid: boolean; issues: HeroValidationIssue[] }
export interface HeroResolvedNailMask {
  maskId: string;
  version: string;
  shapeId: HeroShapeId;
  bounds: HeroNormalizedBounds;
  safeBoundary: HeroNormalizedBounds;
  clippingSource: { type: 'path'; assetId: string };
  containsPoint(x: number, y: number, safe?: boolean): boolean;
  diagnostics: HeroMaskDiagnostics;
}

type Profile = { halfWidths: readonly (readonly [number, number])[]; xBounds?: readonly (readonly [number, number, number])[] };
export interface HeroMaskDefinition extends Required<HeroNailMaskReference> { shapeId: HeroShapeId; version: typeof HERO_MASK_VERSION; source: { type: 'path'; assetId: string } }
const issue = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
const maskIdFor = (shapeId: HeroShapeId) => `${shapeId.toLowerCase()}-mask`;

export const HERO_NAIL_MASK_LIBRARY: readonly HeroMaskDefinition[] = Object.freeze(HERO_SHAPE_IDS.map((shapeId) => Object.freeze({
  id: maskIdFor(shapeId), version: HERO_MASK_VERSION, shapeId, coordinateSpace: 'normalized' as const, safeMargin: 0,
  source: { type: 'path' as const, assetId: `founder-approved-nail-mask:${shapeId}:${HERO_MASK_VERSION}` },
})));

export function maskReferenceForShape(shapeId: string, shapeVersion = HERO_SHAPE_VERSION, safeMargin = 0): HeroNailMaskReference | undefined {
  const definition = HERO_NAIL_MASK_LIBRARY.find((entry) => entry.shapeId === shapeId && entry.version === shapeVersion);
  return definition && { ...definition, source: { ...definition.source }, safeMargin };
}

export function validateHeroNailMask(reference: HeroNailMaskReference): HeroValidationResult {
  const issues: HeroValidationIssue[] = [];
  const definitions = HERO_NAIL_MASK_LIBRARY.filter(({ id }) => id === reference?.id);
  if (!definitions.length) issues.push(issue('nail.mask.id', 'unsupported_mask', `Unsupported Hero nail mask: ${String(reference?.id)}`));
  else if (!definitions.some(({ version }) => version === reference.version)) issues.push(issue('nail.mask.version', 'unsupported_version', `Unsupported mask version: ${String(reference.version)}`));
  const match = definitions.find(({ version }) => version === reference.version);
  if (match && match.shapeId !== reference.shapeId) issues.push(issue('nail.mask.shapeId', 'incompatible_shape', `Mask ${reference.id} is not compatible with ${String(reference.shapeId)}.`));
  if (reference?.coordinateSpace !== 'normalized') issues.push(issue('nail.mask.coordinateSpace', 'unsupported_coordinate_space', 'Mask coordinates must be normalized.'));
  if (typeof reference?.safeMargin !== 'number' || !Number.isFinite(reference.safeMargin) || reference.safeMargin < 0 || reference.safeMargin > HERO_MASK_SAFE_MARGIN_RANGE.max)
    issues.push(issue('nail.mask.safeMargin', 'range', 'Safe margin must be between 0 and 0.25 normalized units.'));
  if (!reference?.source?.assetId || reference.source.type !== 'path' || (match && reference.source.assetId !== match.source.assetId))
    issues.push(issue('nail.mask.source', 'source_unavailable', 'The approved production clipping source is unavailable.'));
  return { valid: issues.length === 0, issues };
}

const interpolate = (points: readonly (readonly number[])[], y: number, index: number) => {
  const upper = points.findIndex((point) => point[0] >= y);
  if (upper <= 0) return points[Math.max(upper, 0)][index];
  if (upper < 0) return points[points.length - 1][index];
  const a = points[upper - 1]; const b = points[upper]; const t = (y - a[0]) / (b[0] - a[0]);
  return a[index] + (b[index] - a[index]) * t;
};

function profileContains(profile: Profile, x: number, y: number, margin: number): boolean {
  if (x < margin || x > 1 - margin || y < margin || y > 1 - margin) return false;
  if (profile.xBounds) return x >= interpolate(profile.xBounds, y, 1) + margin && x <= interpolate(profile.xBounds, y, 2) - margin;
  const half = interpolate(profile.halfWidths, y, 1);
  return x >= 0.5 - half + margin && x <= 0.5 + half - margin;
}

export function resolveHeroNailMask(reference: HeroNailMaskReference): HeroResolvedNailMask {
  const validation = validateHeroNailMask(reference);
  if (!validation.valid) throw new HeroMaskValidationError(validation.issues);
  const definition = HERO_NAIL_MASK_LIBRARY.find(({ id, version }) => id === reference.id && version === reference.version)!;
  const profile = FOUNDER_APPROVED_NAIL_MASKS[definition.shapeId] as Profile;
  const margin = reference.safeMargin!;
  return { maskId: definition.id, version: definition.version, shapeId: definition.shapeId,
    bounds: { x: 0, y: 0, width: 1, height: 1 }, safeBoundary: { x: margin, y: margin, width: 1 - 2 * margin, height: 1 - 2 * margin },
    clippingSource: { ...definition.source }, containsPoint: (x, y, safe = false) => profileContains(profile, x, y, safe ? margin : 0),
    diagnostics: { valid: true, issues: [] } };
}

export class HeroMaskValidationError extends Error { constructor(readonly issues: HeroValidationIssue[]) { super('Hero nail mask is invalid.'); this.name = 'HeroMaskValidationError'; } }
export class HeroNailMaskEngine implements HeroEngine<HeroNailMaskReference, HeroResolvedNailMask> {
  readonly id = 'Hero Nail Mask Engine' as const; readonly version = HERO_MASK_VERSION;
  readonly capabilities = ['mask.resolve', 'mask.validate', 'mask.clip', 'mask.hit-test', 'mask.bounds'] as const;
  initialize(): void {} process(input: HeroNailMaskReference): HeroResolvedNailMask { return resolveHeroNailMask(input); }
  validate(input: HeroNailMaskReference): HeroValidationResult { return validateHeroNailMask(input); } dispose(): void {}
}
export function registerHeroNailMaskEngine(registry: HeroEngineRegistry): HeroNailMaskEngine { const engine = new HeroNailMaskEngine(); registry.register(engine); return engine; }
export function publishMaskResolution(reference: HeroNailMaskReference, events: HeroDesignEventBus, designId?: string): HeroResolvedNailMask {
  try { const resolved = resolveHeroNailMask(reference); events.publish('nail.mask.resolved', { designId, mask: resolved }); return resolved; }
  catch (error) { if (error instanceof HeroMaskValidationError) events.publish('nail.mask.validation.failed', { designId, issues: error.issues }); throw error; }
}
