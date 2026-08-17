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

export const HERO_EFFECT_IDS = Object.freeze(['Solid', 'Gradient', 'Chrome', 'Cat Eye', 'Marble', 'Aura', 'ColorBlock', 'NegativeSpace', 'Jelly'] as const);
export const DEFAULT_HERO_EFFECT_REFERENCE: Readonly<HeroEffectReference> = Object.freeze({
  id: 'Solid', version: '1', parameters: Object.freeze({ baseColor: '#D94C70', opacity: 1, viscosity: 0.62, shine: 0.68 }),
});

type ParameterRule = { required: boolean; validate: (value: unknown) => boolean; message: string };
const color = (value: unknown) => typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);
const unit = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
const angle = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 360;
const blockDirection = (value: unknown) => ['vertical', 'horizontal', 'diagonal'].includes(value as string);
const negativeSpaceType = (value: unknown) => ['vertical-band', 'horizontal-band', 'diagonal-band', 'center-cutout'].includes(value as string);
const layoutSeed = (value: unknown) => typeof value === 'string' && value.length > 0 && value.length <= 128;
const marbleTransform = (value: unknown) => {
  const v = value as Record<string, unknown>;
  return Boolean(v && typeof v === 'object' && !Array.isArray(v) && ['panX', 'panY', 'scale', 'rotation'].every((key) => typeof v[key] === 'number' && Number.isFinite(v[key] as number)));
};
const streamOverrides = (value: unknown) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const marbleState = (value: unknown) => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const commonRules: Record<string, ParameterRule> = {
  opacity: { required: false, validate: unit, message: 'opacity must be between 0 and 1.' },
  viscosity: { required: false, validate: unit, message: 'viscosity must be between 0 and 1.' },
  shine: { required: false, validate: unit, message: 'shine must be between 0 and 1.' },
};
const finishRules: Record<HeroEffectId, Record<string, ParameterRule>> = {
  Solid: { baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' } },
  Gradient: {
    colorA: { required: true, validate: color, message: 'colorA must be a six-digit hex color.' },
    colorB: { required: true, validate: color, message: 'colorB must be a six-digit hex color.' },
    direction: { required: true, validate: angle, message: 'direction must be between 0 and 360.' },
  },
  Chrome: {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
  },
  'Cat Eye': {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    stripeDirection: { required: true, validate: angle, message: 'stripeDirection must be between 0 and 360.' },
    stripeWidth: { required: true, validate: unit, message: 'stripeWidth must be between 0 and 1.' },
    stripeStrength: { required: true, validate: unit, message: 'stripeStrength must be between 0 and 1.' },
  },
  Marble: {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    veinColor: { required: true, validate: color, message: 'veinColor must be a six-digit hex color.' },
    veinDensity: { required: true, validate: unit, message: 'veinDensity must be between 0 and 1.' },
    marbleSeed: { required: false, validate: layoutSeed, message: 'marbleSeed must be a non-empty layout identity.' },
    marbleTransform: { required: false, validate: marbleTransform, message: 'marbleTransform must contain finite panX, panY, scale, and rotation values.' },
    streamOverrides: { required: false, validate: streamOverrides, message: 'streamOverrides must be keyed by stream ID.' },
    marbleGeometryVersion: { required: false, validate: (value) => value === 1 || value === 2, message: 'marbleGeometryVersion must be a supported version.' },
    customStreams: { required: false, validate: marbleState, message: 'customStreams must be keyed by stable custom stream ID.' },
    deletedStreamIds: { required: false, validate: (value) => Array.isArray(value), message: 'deletedStreamIds must be an array.' },
  },
  Aura: {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    centerColor: { required: true, validate: color, message: 'centerColor must be a six-digit hex color.' },
    auraColor: { required: true, validate: color, message: 'auraColor must be a six-digit hex color.' },
    softness: { required: true, validate: unit, message: 'softness must be between 0 and 1.' },
    intensity: { required: true, validate: unit, message: 'intensity must be between 0 and 1.' },
  },
  ColorBlock: {
    primaryColor: { required: true, validate: color, message: 'primaryColor must be a six-digit hex color.' },
    secondaryColor: { required: true, validate: color, message: 'secondaryColor must be a six-digit hex color.' },
    direction: { required: true, validate: blockDirection, message: 'direction must be vertical, horizontal, or diagonal.' },
    splitPosition: { required: true, validate: unit, message: 'splitPosition must be between 0 and 1.' },
  },
  NegativeSpace: {
    type: { required: true, validate: negativeSpaceType, message: 'type must be a supported negative-space reveal.' },
    position: { required: true, validate: unit, message: 'position must be between 0 and 1.' },
    size: { required: true, validate: unit, message: 'size must be between 0 and 1.' },
    rotation: { required: true, validate: angle, message: 'rotation must be between 0 and 360.' },
  },
  Jelly: {
    baseColor: { required: true, validate: color, message: 'baseColor must be a six-digit hex color.' },
    translucency: { required: true, validate: unit, message: 'translucency must be between 0 and 1.' },
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
  /** Stable per-nail identity used for coordinated, non-cloned procedural effects. */
  nailIdentity?: string;
}
export type HeroMarbleVeinClass = 'primary' | 'secondary' | 'hairline' | 'diffusion';
export type HeroMarbleVeinFinish = 'Cream' | 'Jelly' | 'Matte' | 'Glitter';
export interface HeroMarblePoint { x: number; y: number }
export interface HeroMarbleWidthProfile { start: number; middle: number; end: number }
export interface HeroMarbleStream { id: string; veinClass: HeroMarbleVeinClass; color: string; finish: HeroMarbleVeinFinish; path: string; generatedPath: string; controlPoints: readonly HeroMarblePoint[]; width: number; widthProfile: HeroMarbleWidthProfile; opacity: number; softness: number; visible: boolean; custom?: boolean; creationBaseline?: readonly HeroMarblePoint[] }
export interface HeroFinishLayer { kind: 'color' | 'linear-gradient' | 'radial-gradient' | 'veins' | 'color-block' | 'reveal-mask'; opacity: number; color?: string; colors?: readonly string[]; angle?: number; position?: number; width?: number; paths?: readonly string[]; streams?: readonly HeroMarbleStream[]; clipToMask?: boolean; seed?: string; centerX?: number; centerY?: number; radius?: number; softness?: number; direction?: 'vertical' | 'horizontal' | 'diagonal'; revealType?: 'vertical-band' | 'horizontal-band' | 'diagonal-band' | 'center-cutout'; size?: number; rotation?: number }
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
const hashSeed = (value: string) => { let hash = 2166136261; for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); } return hash >>> 0; };
const seededRandom = (seed: string) => { let state = hashSeed(seed) || 1; return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ value >>> 15, value | 1); value ^= value + Math.imul(value ^ value >>> 7, value | 61); return ((value ^ value >>> 14) >>> 0) / 4294967296; }; };
const rounded = (value: number) => Number(value.toFixed(2));
export const DEFAULT_MARBLE_LAYOUT_SEED = 'marble-layout-v1';
export const DEFAULT_MARBLE_TRANSFORM = Object.freeze({ panX: 0, panY: 0, scale: 1, rotation: 0 });
export const CURRENT_MARBLE_GEOMETRY_VERSION = 2;
export const MAX_MARBLE_CONTROL_POINTS = 12;
export const CUSTOM_MARBLE_STREAM_LIMITS = Object.freeze({ primary: 4, secondary: 8, hairline: 12 });
interface HeroMarbleGeometryStream { id: string; veinClass: HeroMarbleVeinClass; path: string; width: number; opacity: number; softness: number; densityRank: number }
const marbleGeometryCache = new Map<string, readonly HeroMarbleGeometryStream[]>();

export function normalizeMarbleLayoutSeed(value: unknown): string {
  return layoutSeed(value) ? value as string : DEFAULT_MARBLE_LAYOUT_SEED;
}

const clamp = (value: unknown, min: number, max: number, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
export function normalizeMarbleTransform(value: unknown) {
  const transform = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return Object.freeze({ panX: clamp(transform.panX, -120, 120, 0), panY: clamp(transform.panY, -180, 180, 0), scale: clamp(transform.scale, .55, 2.5, 1), rotation: clamp(transform.rotation, -180, 180, 0) });
}

export function normalizeMarbleStreamOverrides(value: unknown): Record<string, Record<string, unknown>> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, Record<string, unknown>> = {};
  Object.entries(value as Record<string, unknown>).forEach(([id, raw]) => {
    if (!/^(?:(primary|secondary|hairline|diffusion)-\d+|custom-(primary|secondary|hairline)-[a-z0-9-]+)$/.test(id) || !raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const override = raw as Record<string, unknown>; const next: Record<string, unknown> = {};
    if (color(override.color)) next.color = (override.color as string).toUpperCase();
    if (typeof override.width === 'number') next.width = clamp(override.width, .1, id.startsWith('hairline') ? 1.5 : id.startsWith('primary') ? 8 : 5, 1);
    if (typeof override.opacity === 'number') next.opacity = clamp(override.opacity, 0, 1, 1);
    if (typeof override.softness === 'number') next.softness = clamp(override.softness, 0, 6, 0);
    if (typeof override.visible === 'boolean') next.visible = override.visible;
    const formulation = override.formulation && typeof override.formulation === 'object' && !Array.isArray(override.formulation) ? override.formulation as Record<string, unknown> : {};
    const finish = formulation.finish ?? override.finish;
    if (['Cream', 'Jelly', 'Matte', 'Glitter'].includes(finish as string)) next.formulation = { finish, ...(color(formulation.color) ? { color: (formulation.color as string).toUpperCase() } : {}) };
    const points = override.geometryOverride && typeof override.geometryOverride === 'object' ? (override.geometryOverride as Record<string, unknown>).points : undefined;
    if (Array.isArray(points) && points.length >= 2 && points.length <= MAX_MARBLE_CONTROL_POINTS && points.every((point) => point && typeof point === 'object' && Number.isFinite(Number((point as Record<string, unknown>).x)) && Number.isFinite(Number((point as Record<string, unknown>).y)))) {
      next.geometryOverride = { points: points.map((point) => ({ x: clamp(Number((point as Record<string, unknown>).x), -1000, 1000, 0), y: clamp(Number((point as Record<string, unknown>).y), -1000, 1200, 0) })) };
    }
    const profile = override.widthProfile && typeof override.widthProfile === 'object' ? override.widthProfile as Record<string, unknown> : undefined;
    if (profile) next.widthProfile = { start: clamp(profile.start, .1, 3, 1), middle: clamp(profile.middle, .1, 3, 1), end: clamp(profile.end, .1, 3, 1) };
    if (Object.keys(next).length) result[id] = next;
  });
  return result;
}

export interface HeroCustomMarbleStream { veinClass: Exclude<HeroMarbleVeinClass, 'diffusion'>; controlPoints: HeroMarblePoint[]; creationBaseline: HeroMarblePoint[]; width: number; widthProfile: HeroMarbleWidthProfile; formulation: { color: string; finish: HeroMarbleVeinFinish }; opacity: number; softness: number; visible: boolean }
export function normalizeCustomMarbleStreams(value: unknown): Record<string, HeroCustomMarbleStream> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, HeroCustomMarbleStream> = {};
  Object.entries(value as Record<string, unknown>).forEach(([id, raw]) => {
    const match = id.match(/^custom-(primary|secondary|hairline)-[a-z0-9-]+$/); if (!match || !raw || typeof raw !== 'object' || Array.isArray(raw)) return;
    const item = raw as Record<string, unknown>; const veinClass = match[1] as HeroCustomMarbleStream['veinClass'];
    const normalizePoints = (points: unknown) => Array.isArray(points) && points.length >= 2 && points.length <= MAX_MARBLE_CONTROL_POINTS && points.every((point) => point && typeof point === 'object' && Number.isFinite(Number((point as Record<string, unknown>).x)) && Number.isFinite(Number((point as Record<string, unknown>).y))) ? points.map((point) => ({ x: clamp(Number((point as Record<string, unknown>).x), -1000, 1000, 0), y: clamp(Number((point as Record<string, unknown>).y), -1000, 1200, 0) })) : null;
    const points = normalizePoints(item.controlPoints); if (!points) return;
    const baseline = normalizePoints(item.creationBaseline) || points.map((point) => ({ ...point })); const formulation = item.formulation && typeof item.formulation === 'object' ? item.formulation as Record<string, unknown> : {};
    const defaultWidth = veinClass === 'primary' ? 2.5 : veinClass === 'secondary' ? 1.15 : .38;
    result[id] = { veinClass, controlPoints: points, creationBaseline: baseline, width: clamp(item.width, .1, veinClass === 'primary' ? 8 : veinClass === 'secondary' ? 5 : 1.5, defaultWidth), widthProfile: { start: clamp((item.widthProfile as Record<string, unknown>)?.start, .1, 3, 1.15), middle: clamp((item.widthProfile as Record<string, unknown>)?.middle, .1, 3, 1), end: clamp((item.widthProfile as Record<string, unknown>)?.end, .1, 3, .35) }, formulation: { color: color(formulation.color) ? (formulation.color as string).toUpperCase() : '#8A405D', finish: ['Cream', 'Jelly', 'Matte', 'Glitter'].includes(formulation.finish as string) ? formulation.finish as HeroMarbleVeinFinish : 'Cream' }, opacity: clamp(item.opacity, 0, 1, .72), softness: clamp(item.softness, 0, 6, 0), visible: item.visible !== false };
  });
  return result;
}

export function normalizeDeletedMarbleStreamIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^(primary|secondary|hairline|diffusion)-\d+$/.test(id)))].slice(0, 64) : [];
}

/** Nearest position on the current cardinal centerline, never merely the nearest handle. */
export function nearestMarbleCenterlinePoint(points: readonly HeroMarblePoint[], pointer: HeroMarblePoint, samples = 96) {
  if (points.length < 2) return { t: 0, point: points[0] || { x: 0, y: 0 }, distance: Infinity };
  let nearest = { t: 0, point: points[0], distance: Infinity };
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples; const scaled = t * (points.length - 1); const i = Math.min(points.length - 2, Math.floor(scaled)); const u = scaled - i;
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const cardinal = (a: number, b: number, c: number, d: number) => .5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u ** 2 + (-a + 3 * b - 3 * c + d) * u ** 3);
    const point = { x: cardinal(p0.x, p1.x, p2.x, p3.x), y: cardinal(p0.y, p1.y, p2.y, p3.y) }; const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
    if (distance < nearest.distance) nearest = { t, point, distance };
  }
  return nearest;
}

/** Inserts one hidden shaping point when useful and applies compact cosine falloff. */
export function deformMarbleControlPoints(points: readonly HeroMarblePoint[], grabT: number, dx: number, dy: number, radius = .28): HeroMarblePoint[] {
  let editable = points.map((point) => ({ ...point })); const position = Math.max(0, Math.min(1, grabT)) * (editable.length - 1); const nearestIndex = Math.round(position);
  if (editable.length < MAX_MARBLE_CONTROL_POINTS && Math.abs(position - nearestIndex) > .18) {
    const after = Math.ceil(position); const u = position - Math.floor(position); const before = editable[after - 1]; const next = editable[after]; editable.splice(after, 0, { x: rounded(before.x + (next.x - before.x) * u), y: rounded(before.y + (next.y - before.y) * u) });
  }
  return editable.map((point, index) => { const t = index / (editable.length - 1); const distance = Math.abs(t - grabT); const influence = distance >= radius ? 0 : .5 + .5 * Math.cos(Math.PI * distance / radius); return { x: rounded(point.x + dx * influence), y: rounded(point.y + dy * influence) }; });
}

const pathNumbers = (path: string) => (path.match(/-?\d*\.?\d+/g) || []).map(Number);
/** Samples the generated cubic path into approachable, composition-space shaping points. */
export function marbleControlPoints(path: string, count = 5): HeroMarblePoint[] {
  const n = pathNumbers(path); if (n.length < 2) return [];
  const segments: Array<[HeroMarblePoint, HeroMarblePoint, HeroMarblePoint, HeroMarblePoint]> = [];
  let p = { x: n[0], y: n[1] };
  for (let i = 2; i + 5 < n.length; i += 6) { const next = { x: n[i + 4], y: n[i + 5] }; segments.push([p, { x: n[i], y: n[i + 1] }, { x: n[i + 2], y: n[i + 3] }, next]); p = next; }
  const at = (t: number) => { const scaled = Math.min(segments.length - .000001, t * segments.length); const s = segments[Math.floor(scaled)]; const u = scaled - Math.floor(scaled); const v = 1 - u; return { x: rounded(v ** 3 * s[0].x + 3 * v ** 2 * u * s[1].x + 3 * v * u ** 2 * s[2].x + u ** 3 * s[3].x), y: rounded(v ** 3 * s[0].y + 3 * v ** 2 * u * s[1].y + 3 * v * u ** 2 * s[2].y + u ** 3 * s[3].y) }; };
  return segments.length ? Array.from({ length: count }, (_, i) => at(i / (count - 1))) : [{ x: n[0], y: n[1] }];
}

/** Cardinal spline keeps direct edits smooth without exposing tangent handles. */
export function marblePathFromPoints(points: readonly HeroMarblePoint[]): string {
  if (points.length < 2) return '';
  let path = `M ${rounded(points[0].x)} ${rounded(points[0].y)}`;
  for (let i = 0; i < points.length - 1; i += 1) { const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)]; path += ` C ${rounded(p1.x + (p2.x - p0.x) / 6)} ${rounded(p1.y + (p2.y - p0.y) / 6)} ${rounded(p2.x - (p3.x - p1.x) / 6)} ${rounded(p2.y - (p3.y - p1.y) / 6)} ${rounded(p2.x)} ${rounded(p2.y)}`; }
  return path;
}

const profileAt = (profile: HeroMarbleWidthProfile, t: number) => t <= .5
  ? profile.start + (profile.middle - profile.start) * t * 2
  : profile.middle + (profile.end - profile.middle) * (t - .5) * 2;

/**
 * Produces a continuous filled ribbon from the same artist-friendly shaping
 * points used by direct editing. Material rendering consumes this outline, so
 * taper is real localized geometry rather than a sequence of stroke widths.
 */
export function marbleRibbonPath(points: readonly HeroMarblePoint[], width: number, profile: HeroMarbleWidthProfile, samples = 48): string {
  if (points.length < 2 || !Number.isFinite(width) || width <= 0) return '';
  const sampled = Array.from({ length: Math.max(12, Math.min(96, samples)) }, (_, index) => {
    const t = index / (Math.max(12, Math.min(96, samples)) - 1);
    const scaled = t * (points.length - 1);
    const i = Math.min(points.length - 2, Math.floor(scaled)); const u = scaled - i;
    const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
    const cardinal = (a: number, b: number, c: number, d: number) => .5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u ** 2 + (-a + 3 * b - 3 * c + d) * u ** 3);
    return { x: cardinal(p0.x, p1.x, p2.x, p3.x), y: cardinal(p0.y, p1.y, p2.y, p3.y), t };
  });
  const edge = (side: number) => sampled.map((point, index) => {
    const before = sampled[Math.max(0, index - 1)], after = sampled[Math.min(sampled.length - 1, index + 1)];
    const length = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    const radius = width * profileAt(profile, point.t) / 2;
    return { x: rounded(point.x - (after.y - before.y) / length * radius * side), y: rounded(point.y + (after.x - before.x) / length * radius * side) };
  });
  const outline = [...edge(1), ...edge(-1).reverse()];
  return `${outline.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')} Z`;
}

/** Bounds a completed ribbon, including room for the largest Glitter flecks and local surface detail. */
export function marbleRibbonBounds(path: string, padding = 2.5) {
  const coordinates = pathNumbers(path);
  if (coordinates.length < 4 || coordinates.length % 2 !== 0) return Object.freeze({ x: 0, y: 0, width: 1, height: 1 });
  const xs = coordinates.filter((_, index) => index % 2 === 0); const ys = coordinates.filter((_, index) => index % 2 === 1);
  const safePadding = clamp(padding, 0, 12, 2.5);
  const minX = Math.min(...xs) - safePadding; const minY = Math.min(...ys) - safePadding;
  return Object.freeze({ x: rounded(minX), y: rounded(minY), width: rounded(Math.max(1, Math.max(...xs) - Math.min(...xs) + safePadding * 2)), height: rounded(Math.max(1, Math.max(...ys) - Math.min(...ys) + safePadding * 2)) });
}

/** Narrow generation regions follow the ribbon instead of its potentially large diagonal AABB. */
export function marbleRibbonParticleBounds(path: string, padding = 2.5, pointsPerRegion = 8) {
  const coordinates = pathNumbers(path); const outline = [] as HeroMarblePoint[];
  for (let index = 0; index + 1 < coordinates.length; index += 2) outline.push({ x: coordinates[index], y: coordinates[index + 1] });
  if (outline.length < 4 || outline.length % 2 !== 0) return [marbleRibbonBounds(path, padding)];
  const sideLength = outline.length / 2; const regions = [];
  for (let start = 0; start < sideLength; start += pointsPerRegion) {
    const end = Math.min(sideLength, start + pointsPerRegion);
    const paired = [...outline.slice(start, end), ...outline.slice(sideLength + (sideLength - end), sideLength + (sideLength - start))];
    const localPath = paired.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
    regions.push(marbleRibbonBounds(`${localPath} Z`, padding));
  }
  return Object.freeze(regions);
}

/** Stable maximum stream geometry, cached independently from Marble styling. */
function createMarbleGeometry(nailIdentity: string, marbleSeed: string, version = CURRENT_MARBLE_GEOMETRY_VERSION): readonly HeroMarbleGeometryStream[] {
  const cacheKey = `${version}|${nailIdentity}|${marbleSeed}`;
  const cached = marbleGeometryCache.get(cacheKey);
  if (cached) return cached;
  const random = seededRandom(cacheKey); const streams: HeroMarbleGeometryStream[] = [];
  const path = (startX: number, startY: number, length: number, direction: number, bends: number, curvature = .35) => {
    let x = startX; let y = startY; let d = direction; let result = `M ${rounded(x)} ${rounded(y)}`;
    for (let bend = 0; bend < bends; bend += 1) {
      const segment = length / bends * (.82 + random() * .36); d += (random() - .5) * curvature;
      const nx = x + Math.cos(d) * segment; const ny = y + Math.sin(d) * segment; const normal = (random() - .5) * segment * .75;
      result += ` C ${rounded(x + Math.cos(d) * segment * .34 + Math.cos(d + Math.PI / 2) * normal * .18)} ${rounded(y + Math.sin(d) * segment * .34 + Math.sin(d + Math.PI / 2) * normal * .18)} ${rounded(x + Math.cos(d) * segment * .72 - Math.cos(d + Math.PI / 2) * normal * .1)} ${rounded(y + Math.sin(d) * segment * .72 - Math.sin(d + Math.PI / 2) * normal * .1)} ${rounded(nx)} ${rounded(ny)}`;
      x = nx; y = ny;
    }
    return result;
  };
  if (version === 1) {
    const legacyPath = (startX: number, startY: number, length: number, direction: number, bends: number) => { let x = startX; let y = startY; let d = direction; let result = `M ${rounded(x)} ${rounded(y)}`; for (let bend = 0; bend < bends; bend += 1) { const segment = length / bends * (.7 + random() * .65); d += (random() - .5) * 1.18; const nx = x + Math.cos(d) * segment; const ny = y + Math.sin(d) * segment; const normal = (random() - .5) * segment * .75; result += ` C ${rounded(x + Math.cos(d - .35) * segment * .34 + Math.cos(d + Math.PI / 2) * normal)} ${rounded(y + Math.sin(d - .35) * segment * .34 + Math.sin(d + Math.PI / 2) * normal)} ${rounded(x + Math.cos(d + .28) * segment * .72 - Math.cos(d + Math.PI / 2) * normal * .45)} ${rounded(y + Math.sin(d + .28) * segment * .72 - Math.sin(d + Math.PI / 2) * normal * .45)} ${rounded(nx)} ${rounded(ny)}`; x = nx; y = ny; } return result; };
    const legacyAdd = (veinClass: HeroMarbleVeinClass, count: number, width: [number, number], opacityRange: [number, number], softness: [number, number], short = false) => { for (let index = 0; index < count; index += 1) { const startX = -45 + random() * 310; const startY = -20 + random() * 350; const direction = -.95 + random() * 2.5; streams.push(Object.freeze({ id: `${veinClass}-${index}`, veinClass, path: legacyPath(startX, startY, short ? 65 + random() * 90 : 250 + random() * 145, direction, short ? 2 + Math.floor(random() * 2) : 4 + Math.floor(random() * 3)), width: rounded(width[0] + random() * (width[1] - width[0])), opacity: rounded(opacityRange[0] + random() * (opacityRange[1] - opacityRange[0])), softness: rounded(softness[0] + random() * (softness[1] - softness[0])), densityRank: rounded((index + 1) / count) })); } };
    legacyAdd('diffusion', 2, [10, 19], [.055, .12], [2.4, 5.2]); legacyAdd('primary', 3, [1.5, 3.8], [.5, .88], [0, .65]); legacyAdd('secondary', 4, [.65, 1.55], [.28, .62], [0, .9], true); legacyAdd('hairline', 5, [.22, .55], [.18, .48], [0, .3], true);
    const geometry = Object.freeze(streams); marbleGeometryCache.set(cacheKey, geometry); return geometry;
  }
  // Every refined stream shares one broad geological flow. Subordinates either
  // parallel it or start near a primary anchor, yielding sparse visual branches.
  const dominant = -.92 + random() * .42; const broadCurve = (random() - .5) * .32;
  const add = (veinClass: HeroMarbleVeinClass, count: number, width: [number, number], opacityRange: [number, number], softness: [number, number], short = false) => {
    for (let index = 0; index < count; index += 1) {
      const clustered = veinClass === 'secondary' || veinClass === 'hairline'; const band = (index + .35 + random() * .3) / count;
      const startX = clustered ? -35 + band * 235 + (random() - .5) * 38 : -55 + band * 300; const startY = 350 - band * 235 + (random() - .5) * 58;
      const direction = dominant + broadCurve * band + (random() - .5) * (veinClass === 'hairline' ? .42 : .24);
      streams.push(Object.freeze({ id: `${veinClass}-${index}`, veinClass,
        path: path(startX, startY, short ? (veinClass === 'hairline' ? 64 : 105) + random() * 70 : 285 + random() * 110, direction, short ? 2 + Math.floor(random() * 2) : 4 + Math.floor(random() * 2), veinClass === 'primary' || veinClass === 'diffusion' ? .3 : .48),
        width: rounded(width[0] + random() * (width[1] - width[0])), opacity: rounded(opacityRange[0] + random() * (opacityRange[1] - opacityRange[0])), softness: rounded(softness[0] + random() * (softness[1] - softness[0])), densityRank: rounded((index + 1) / count) }));
    }
  };
  add('diffusion', 2, [11, 18], [.055, .1], [2.8, 5]);
  add('primary', 2, [2, 3.8], [.55, .88], [0, .55]);
  add('secondary', 4, [.65, 1.55], [.28, .62], [0, .9], true);
  add('hairline', 5, [.22, .55], [.18, .48], [0, .3], true);
  const geometry = Object.freeze(streams);
  marbleGeometryCache.set(cacheKey, geometry);
  return geometry;
}

/** A deterministic geological model whose stable paths receive current styling. */
export function createMarbleVeinModel(effect: HeroEffectReference, nailIdentity = 'nail-0'): readonly HeroMarbleStream[] {
  if (effect.id !== 'Marble') return [];
  const color = effect.parameters.veinColor as string;
  const density = numberParameter(effect.parameters, 'veinDensity', .42);
  const marbleSeed = normalizeMarbleLayoutSeed(effect.parameters.marbleSeed);
  const overrides = normalizeMarbleStreamOverrides(effect.parameters.streamOverrides);
  const version = effect.parameters.marbleGeometryVersion === 1 ? 1 : CURRENT_MARBLE_GEOMETRY_VERSION;
  const deleted = new Set(normalizeDeletedMarbleStreamIds(effect.parameters.deletedStreamIds));
  const generated = createMarbleGeometry(nailIdentity, marbleSeed, version).map((stream) => Object.freeze({
    id: stream.id, veinClass: stream.veinClass, color: (overrides[stream.id]?.formulation as Record<string, unknown>)?.color as string || overrides[stream.id]?.color as string || color,
    finish: ((overrides[stream.id]?.formulation as Record<string, unknown>)?.finish || 'Cream') as HeroMarbleVeinFinish,
    path: overrides[stream.id]?.geometryOverride ? marblePathFromPoints((overrides[stream.id].geometryOverride as { points: HeroMarblePoint[] }).points) : stream.path, generatedPath: stream.path,
    controlPoints: overrides[stream.id]?.geometryOverride ? (overrides[stream.id].geometryOverride as { points: HeroMarblePoint[] }).points : marbleControlPoints(stream.path, stream.veinClass === 'hairline' ? 4 : 5),
    width: overrides[stream.id]?.width as number ?? stream.width, widthProfile: (overrides[stream.id]?.widthProfile as HeroMarbleWidthProfile) || { start: 1, middle: 1, end: 1 },
    opacity: overrides[stream.id]?.opacity as number ?? rounded(stream.opacity * (.55 + density * .75)), softness: overrides[stream.id]?.softness as number ?? stream.softness,
    // Primary veins anchor the composition. Density progressively reveals only
    // deterministic subordinate streams, so already-visible paths never move.
    visible: !deleted.has(stream.id) && (stream.veinClass === 'primary' || stream.densityRank <= density) && overrides[stream.id]?.visible !== false,
  }));
  const custom = Object.entries(normalizeCustomMarbleStreams(effect.parameters.customStreams)).map(([id, stream]) => {
    const override = overrides[id] || {}; const points = (override.geometryOverride as { points?: HeroMarblePoint[] })?.points || stream.controlPoints; const formulation = override.formulation as Record<string, unknown> || stream.formulation;
    return Object.freeze({ id, veinClass: stream.veinClass, custom: true, creationBaseline: stream.creationBaseline, color: formulation.color as string || stream.formulation.color, finish: formulation.finish as HeroMarbleVeinFinish || stream.formulation.finish, path: marblePathFromPoints(points), generatedPath: marblePathFromPoints(stream.creationBaseline), controlPoints: points, width: override.width as number ?? stream.width, widthProfile: override.widthProfile as HeroMarbleWidthProfile || stream.widthProfile, opacity: override.opacity as number ?? stream.opacity, softness: override.softness as number ?? stream.softness, visible: (override.visible as boolean | undefined) ?? stream.visible });
  });
  return Object.freeze([...generated, ...custom]);
}

function finishLayers(effect: HeroEffectReference, nailIdentity?: string): readonly HeroFinishLayer[] {
  const p = effect.parameters;
  const opacity = numberParameter(p, 'opacity', effect.id === 'Jelly' ? 0.48 : 1);
  switch (effect.id) {
    case 'Solid': return [{ kind: 'color', color: p.baseColor as string, opacity }];
    case 'Gradient': return [{ kind: 'linear-gradient', colors: [p.colorA as string, p.colorB as string], angle: p.direction as number, opacity }];
    case 'Chrome': {
      return [{ kind: 'linear-gradient', colors: [p.baseColor as string, '#FFFFFF', p.baseColor as string, '#64646B', p.baseColor as string], angle: 90, opacity }];
    }
    case 'Cat Eye': return [
      { kind: 'color', color: p.baseColor as string, opacity },
      { kind: 'linear-gradient', colors: ['transparent', '#FFFFFF', 'transparent'], angle: p.stripeDirection as number, position: 0.5, width: p.stripeWidth as number, opacity: p.stripeStrength as number },
    ];
    // Marble is decoration, not a material.  In particular, do not emit a
    // nail-shaped color layer here: transparent negative space is part of the
    // effect contract and the already-resolved material remains authoritative.
    case 'Marble': return [
      { kind: 'veins', color: p.veinColor as string, opacity, streams: createMarbleVeinModel(effect, nailIdentity), clipToMask: true, seed: `${nailIdentity ?? 'nail-0'}|${normalizeMarbleLayoutSeed(p.marbleSeed)}` },
    ];
    case 'Aura': return [
      { kind: 'color', color: p.baseColor as string, opacity: 1 },
      { kind: 'radial-gradient', colors: [p.centerColor as string, p.auraColor as string, p.baseColor as string], centerX: .5, centerY: .42, radius: .64, softness: p.softness as number, opacity: p.intensity as number },
    ];
    case 'ColorBlock': return [
      { kind: 'color', color: p.primaryColor as string, opacity },
      { kind: 'color-block', colors: [p.primaryColor as string, p.secondaryColor as string], direction: p.direction as 'vertical' | 'horizontal' | 'diagonal', position: p.splitPosition as number, opacity },
    ];
    case 'NegativeSpace': return [{ kind: 'reveal-mask', revealType: p.type as HeroFinishLayer['revealType'], position: p.position as number, size: p.size as number, rotation: p.rotation as number, opacity: 1 }];
    case 'Jelly': return [{ kind: 'color', color: p.baseColor as string, opacity: opacity * (1 - (p.translucency as number)) }];
  }
}

export class HeroEffectEngine implements HeroEngine<HeroEffectInput, HeroAppliedEffect> {
  readonly id = 'Hero Effect Engine' as const;
  readonly version = '1';
  readonly capabilities = ['effect.resolve', 'effect.validate', 'effect.apply', 'effect.invalidate', 'effect.preview'] as const;
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
    const key = [input.effect.id, input.effect.version, JSON.stringify(input.effect.parameters), input.nailIdentity ?? input.designId ?? 'nail-0', input.material.cacheKey, input.shape.id, input.mask.maskId, input.surface?.path ?? ''].join(':');
    let applied = this.cache.get(key);
    if (!applied) {
      applied = Object.freeze({ id: input.effect.id, version: input.effect.version, parameters: Object.freeze({ ...input.effect.parameters }), material: input.material, layers: Object.freeze(finishLayers(input.effect, input.nailIdentity ?? input.designId)), opacity: numberParameter(input.effect.parameters, 'opacity', input.effect.id === 'Jelly' ? 0.48 : 1), viscosity: numberParameter(input.effect.parameters, 'viscosity', 0.62), shine: numberParameter(input.effect.parameters, 'shine', 0.68), shapeId: input.shape.id, maskId: input.mask.maskId, geometry: input.surface ? { path: input.surface.path, bounds: input.surface.bounds, viewBox: input.surface.viewBox } : undefined, cacheKey: key });
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
