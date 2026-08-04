import { VIEWBOX, buildNailPath, getNailGeometry } from '../design-studio/blueprint';
import { HeroDesignDocument, HeroEngine, HeroValidationIssue, HeroValidationResult } from './contracts';
import { HeroDesignEventBus } from './events';
import { HeroResolvedNailMask, resolveHeroNailMask } from './mask';
import { HeroEngineRegistry } from './registry';
import { HeroShapeDefinition, resolveHeroShape } from './shape';

export type HeroSurfaceRendererState = 'Idle' | 'Rendering' | 'Rendered' | 'Invalid' | 'Failed';
export interface HeroSurfaceViewport { width: number; height: number; pixelRatio?: number }
export interface HeroSurfaceRenderInput { document: HeroDesignDocument; shape: HeroShapeDefinition; mask: HeroResolvedNailMask; viewport: HeroSurfaceViewport }
export interface HeroSurfaceRenderResult { path: string; fill: '#F4E8E4'; bounds: { x: number; y: number; width: number; height: number }; viewBox: string; shapeId: string; maskId: string }
const issue = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });

/** Geometry-only renderer. Materials, effects and lighting deliberately remain outside this engine. */
export class HeroSurfaceRenderingEngine implements HeroEngine<HeroSurfaceRenderInput, HeroSurfaceRenderResult> {
  readonly id = 'Hero Surface Rendering Engine' as const;
  readonly version = '1';
  readonly capabilities = ['surface.render', 'surface.preview', 'surface.invalidate', 'surface.bounds', 'surface.refresh'] as const;
  state: HeroSurfaceRendererState = 'Idle';
  private lastKey?: string;
  private lastResult?: HeroSurfaceRenderResult;
  constructor(private readonly events = new HeroDesignEventBus()) {}
  initialize(): void { this.state = 'Idle'; }
  validate(input: HeroSurfaceRenderInput): HeroValidationResult {
    const issues: HeroValidationIssue[] = [];
    if (!input?.document || input.shape?.id !== input.document?.nail.shape.id) issues.push(issue('shape', 'shape_mismatch', 'Resolved shape does not match the design document.'));
    if (!input?.mask || input.mask?.shapeId !== input.shape?.id) issues.push(issue('mask', 'mask_mismatch', 'Resolved mask does not match the Hero shape.'));
    if (!(input?.viewport?.width > 0) || !(input?.viewport?.height > 0)) issues.push(issue('viewport', 'invalid_viewport', 'Canvas viewport dimensions must be positive.'));
    return { valid: issues.length === 0, issues };
  }
  process(input: HeroSurfaceRenderInput): HeroSurfaceRenderResult {
    const validation = this.validate(input);
    if (!validation.valid) return this.fail(input?.document?.metadata.id, new Error(validation.issues.map(({ message }) => message).join(' ')));
    const key = this.key(input);
    if (this.state === 'Rendered' && key === this.lastKey && this.lastResult) return this.lastResult;
    this.state = 'Rendering';
    this.events.publish('surface.render.started', { designId: input.document.metadata.id, state: this.state });
    try {
      const nail = { shape: input.shape.id, length: input.document.nail.length, width: input.document.nail.width };
      const geometry = getNailGeometry(nail);
      const padding = Math.max(6, geometry.width * 0.04);
      const viewBox = `${geometry.left - padding} ${geometry.topY - padding} ${geometry.width + padding * 2} ${geometry.height + padding * 2}`;
      const result: HeroSurfaceRenderResult = { path: buildNailPath(input.shape.id, nail), fill: '#F4E8E4', shapeId: input.shape.id, maskId: input.mask.maskId, bounds: { x: geometry.left, y: geometry.topY, width: geometry.width, height: geometry.height }, viewBox };
      if (!result.path) throw new Error('Hero surface geometry was empty.');
      this.lastKey = key; this.lastResult = result; this.state = 'Rendered';
      this.events.publish('surface.render.completed', { designId: input.document.metadata.id, state: this.state, result });
      return result;
    } catch (error) { return this.fail(input.document.metadata.id, error instanceof Error ? error : new Error(String(error))); }
  }
  invalidate(reason = 'design', designId?: string): void { this.lastKey = undefined; this.lastResult = undefined; this.state = 'Invalid'; this.events.publish('surface.render.invalidated', { designId, state: this.state, reason }); }
  refresh(input: HeroSurfaceRenderInput): HeroSurfaceRenderResult { this.invalidate('refresh', input.document.metadata.id); return this.process(input); }
  dispose(): void { this.lastKey = undefined; this.lastResult = undefined; this.state = 'Idle'; }
  private key(input: HeroSurfaceRenderInput): string { return [input.document.revision, input.shape.id, input.mask.maskId, input.document.nail.length, input.document.nail.width, input.viewport.width, input.viewport.height, input.viewport.pixelRatio ?? 1].join(':'); }
  private fail(designId: string | undefined, error: Error): never { this.state = 'Failed'; this.events.publish('surface.render.failed', { designId: designId ?? 'unknown', state: this.state, error }); throw error; }
}

export function createHeroSurfaceInput(document: HeroDesignDocument, viewport: HeroSurfaceViewport): HeroSurfaceRenderInput {
  const shape = resolveHeroShape(document.nail.shape.id, document.nail.shape.version);
  if (!shape) throw new Error(`Hero shape is unavailable: ${document.nail.shape.id}`);
  return { document, shape, mask: resolveHeroNailMask(document.nail.mask), viewport };
}
export function registerHeroSurfaceRenderingEngine(registry: HeroEngineRegistry, events?: HeroDesignEventBus): HeroSurfaceRenderingEngine { const engine = new HeroSurfaceRenderingEngine(events); registry.register(engine); return engine; }

/** Connects geometry events to a coalesced redraw request. */
export function connectHeroSurfaceInvalidation(engine: HeroSurfaceRenderingEngine, events: HeroDesignEventBus, redraw: () => void): () => void {
  let queued = false;
  const invalidate = (reason: string, designId?: string) => { engine.invalidate(reason, designId); if (!queued) { queued = true; queueMicrotask(() => { queued = false; redraw(); }); } };
  const subscriptions = [
    events.subscribe('shape.selected', ({ designId }) => invalidate('shape', designId)),
    events.subscribe('nail.mask.changed', ({ designId }) => invalidate('mask', designId)),
    events.subscribe('shape.length.changed', ({ designId }) => invalidate('length', designId)),
    events.subscribe('shape.width.changed', ({ designId }) => invalidate('width', designId)),
  ];
  return () => subscriptions.forEach((unsubscribe) => unsubscribe());
}
export const HERO_SURFACE_VIEWPORT = Object.freeze({ width: VIEWBOX.width, height: VIEWBOX.height, pixelRatio: 1 });
