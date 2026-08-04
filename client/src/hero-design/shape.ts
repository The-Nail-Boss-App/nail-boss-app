import { FOUNDER_APPROVED_NAIL_MASKS, SHAPES } from '../design-studio/blueprint';
import {
  HeroDesignDocument, HeroEngine, HeroValidationIssue, HeroValidationResult,
} from './contracts';
import { HeroDesignEventBus } from './events';
import { HeroEngineRegistry } from './registry';
import { HeroDesignState, heroDesignReducer } from './state';

export const HERO_SHAPE_VERSION = '1' as const;
// Keep legacy sub-50% saves loadable while exposing 50–250% in the current UI.
export const HERO_SHAPE_LENGTH_RANGE = { min: 0, max: 2.5 } as const;
export const HERO_SHAPE_WIDTH_RANGE = { min: 0, max: 1 } as const;
export const HERO_SHAPE_IDS = SHAPES as unknown as readonly ['Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto', 'Lipstick', 'Duck'];
export type HeroShapeId = typeof HERO_SHAPE_IDS[number];

export interface HeroShapeDefinition { id: HeroShapeId; version: typeof HERO_SHAPE_VERSION }
export interface HeroShapeConfiguration {
  shapeId: string;
  shapeVersion: string;
  length: number;
  width: number;
  orientation: 'tip-down';
}

const error = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
const inRange = (value: unknown, range: { min: number; max: number }) =>
  typeof value === 'number' && Number.isFinite(value) && value >= range.min && value <= range.max;

/** Metadata-only facade over the production library; silhouettes remain owned by Design Studio. */
export const HERO_SHAPE_LIBRARY: readonly HeroShapeDefinition[] = Object.freeze(HERO_SHAPE_IDS.map((id) => {
  if (!FOUNDER_APPROVED_NAIL_MASKS[id]) throw new Error(`Approved Hero shape is missing from production library: ${id}`);
  return Object.freeze({ id, version: HERO_SHAPE_VERSION });
}));

export function resolveHeroShape(shapeId: string, shapeVersion: string = HERO_SHAPE_VERSION): HeroShapeDefinition | undefined {
  return HERO_SHAPE_LIBRARY.find(({ id, version }) => id === shapeId && version === shapeVersion);
}

export function validateHeroShapeConfiguration(configuration: HeroShapeConfiguration): HeroValidationResult {
  const issues: HeroValidationIssue[] = [];
  if (!HERO_SHAPE_IDS.includes(configuration?.shapeId as HeroShapeId))
    issues.push(error('nail.shape.id', 'unsupported_shape', `Unsupported Hero shape: ${String(configuration?.shapeId)}`));
  else if (!resolveHeroShape(configuration.shapeId, configuration.shapeVersion))
    issues.push(error('nail.shape.version', 'unsupported_version', `Unsupported version for ${configuration.shapeId}: ${String(configuration.shapeVersion)}`));
  if (!inRange(configuration?.length, HERO_SHAPE_LENGTH_RANGE))
    issues.push(error('nail.length', 'range', 'Length must be between 0 and 2.5.'));
  if (!inRange(configuration?.width, HERO_SHAPE_WIDTH_RANGE))
    issues.push(error('nail.width', 'range', 'Width must be between 0 and 1.'));
  if (configuration?.orientation !== 'tip-down')
    issues.push(error('nail.orientation', 'unsupported_orientation', 'Only tip-down orientation is supported.'));
  return { valid: issues.length === 0, issues };
}

export class HeroShapeEngine implements HeroEngine<HeroShapeConfiguration, HeroShapeConfiguration> {
  readonly id = 'Hero Shape Engine' as const;
  readonly version = HERO_SHAPE_VERSION;
  readonly capabilities = ['shape.selection', 'shape.validation', 'shape.configuration'] as const;
  initialize(): void {}
  process(input: HeroShapeConfiguration): HeroShapeConfiguration {
    const result = this.validate(input);
    if (!result.valid) throw new HeroShapeValidationError(result.issues);
    return { ...input };
  }
  validate(input: HeroShapeConfiguration): HeroValidationResult { return validateHeroShapeConfiguration(input); }
  dispose(): void {}
}

export class HeroShapeValidationError extends Error {
  constructor(readonly issues: HeroValidationIssue[]) {
    super('Hero shape configuration is invalid.');
    this.name = 'HeroShapeValidationError';
  }
}

export function registerHeroShapeEngine(registry: HeroEngineRegistry): HeroShapeEngine {
  const engine = new HeroShapeEngine();
  registry.register(engine);
  return engine;
}

export function shapeConfigurationFromDocument(document: HeroDesignDocument): HeroShapeConfiguration {
  return {
    shapeId: document.nail.shape.id,
    shapeVersion: document.nail.shape.version ?? HERO_SHAPE_VERSION,
    length: document.nail.length,
    width: document.nail.width,
    orientation: document.nail.tipDown ? 'tip-down' : (undefined as never),
  };
}

/** Applies one atomic shape update while leaving every unrelated document field intact. */
export function updateHeroShape(
  state: HeroDesignState,
  patch: Partial<HeroShapeConfiguration>,
  events: HeroDesignEventBus,
  engine: HeroShapeEngine = new HeroShapeEngine(),
): HeroDesignState {
  if (!state.document) throw new Error('A Hero Design document is required to update shape.');
  const previous = shapeConfigurationFromDocument(state.document);
  const next = { ...previous, ...patch };
  const validation = engine.validate(next);
  if (!validation.valid) {
    events.publish('shape.validation.failed', { designId: state.document.metadata.id, issues: validation.issues });
    throw new HeroShapeValidationError(validation.issues);
  }
  engine.process(next);
  const nextMask = {
    id: `${(next.shapeId as HeroShapeId).toLowerCase()}-mask`, version: next.shapeVersion, shapeId: next.shapeId,
    coordinateSpace: 'normalized' as const, safeMargin: state.document.nail.mask.safeMargin ?? 0,
    source: { type: 'path' as const, assetId: `founder-approved-nail-mask:${next.shapeId}:${next.shapeVersion}` },
  };
  const updated = heroDesignReducer(state, { type: 'updateNail', patch: {
    shape: { id: next.shapeId, version: next.shapeVersion }, mask: nextMask, length: next.length, width: next.width, tipDown: true,
  } });
  const payload = { designId: state.document.metadata.id, ...next };
  if (next.shapeId !== previous.shapeId || next.shapeVersion !== previous.shapeVersion)
    events.publish('shape:changed', { designId: payload.designId, shapeId: next.shapeId });
  if (next.shapeId !== previous.shapeId || next.shapeVersion !== previous.shapeVersion)
    events.publish('shape.selected', { designId: payload.designId, shapeId: next.shapeId, shapeVersion: next.shapeVersion });
  if (nextMask.id !== state.document.nail.mask.id || nextMask.version !== state.document.nail.mask.version)
    events.publish('nail.mask.changed', { designId: payload.designId, previousMaskId: state.document.nail.mask.id, maskId: nextMask.id, shapeId: next.shapeId });
  if (next.length !== previous.length)
    events.publish('shape.length.changed', { designId: payload.designId, shapeId: next.shapeId, length: next.length });
  if (next.width !== previous.width)
    events.publish('shape.width.changed', { designId: payload.designId, shapeId: next.shapeId, width: next.width });
  events.publish('shape.updated', payload);
  events.publish('design:changed', { document: updated.document!, revision: updated.document!.revision });
  return updated;
}
