import { HeroDesignDocument, HeroLayer, HeroRenderRequest, HeroRenderResult } from './contracts';
import type { HeroResolvedNailMask } from './mask';
import type { HeroSurfaceRendererState, HeroSurfaceRenderResult } from './surface';
import type { HeroNailMaterialReference } from './contracts';
import type { HeroResolvedNailMaterial } from './material';
import type { HeroEffectReference } from './contracts';
import type { HeroAppliedEffect } from './effect';

export interface HeroDesignEventMap {
  'design:created': { document: HeroDesignDocument };
  'design:loaded': { document: HeroDesignDocument };
  'design:changed': { document: HeroDesignDocument; revision: number };
  'shape:changed': { designId: string; shapeId: string };
  'shape.selected': { designId: string; shapeId: string; shapeVersion: string };
  'shape.updated': { designId: string; shapeId: string; shapeVersion: string; length: number; width: number; orientation: 'tip-down' };
  'shape.length.changed': { designId: string; shapeId: string; length: number };
  'shape.width.changed': { designId: string; shapeId: string; width: number };
  'shape.validation.failed': { designId?: string; issues: import('./contracts').HeroValidationIssue[] };
  'mask:changed': { designId: string; maskId: string };
  'nail.mask.resolved': { designId?: string; mask: HeroResolvedNailMask };
  'nail.mask.changed': { designId: string; previousMaskId: string; maskId: string; shapeId: string };
  'nail.mask.validation.failed': { designId?: string; issues: import('./contracts').HeroValidationIssue[] };
  'nail.material.resolved': { designId?: string; material: HeroResolvedNailMaterial };
  'nail.material.changed': { designId: string; previous: HeroNailMaterialReference; material: HeroNailMaterialReference };
  'nail.material.validation.failed': { designId?: string; issues: import('./contracts').HeroValidationIssue[] };
  'surface.material.applied': { designId: string; materialId: string; materialVersion: string; cacheKey: string };
  'surface.render.started': { designId: string; state: HeroSurfaceRendererState };
  'surface.render.completed': { designId: string; state: HeroSurfaceRendererState; result: HeroSurfaceRenderResult };
  'surface.render.failed': { designId: string; state: HeroSurfaceRendererState; error: Error };
  'surface.render.invalidated': { designId?: string; state: HeroSurfaceRendererState; reason: string };
  'effect.changed': { designId: string; previous: HeroEffectReference; effect: HeroEffectReference };
  'effect.applied': { designId?: string; effect: HeroAppliedEffect };
  'effect.validation.failed': { designId?: string; issues: import('./contracts').HeroValidationIssue[] };
  'layer:added': { designId: string; layer: HeroLayer };
  'layer:updated': { designId: string; layer: HeroLayer };
  'layer:removed': { designId: string; layerId: string };
  'render:requested': { request: HeroRenderRequest };
  'render:completed': { result: HeroRenderResult };
  'design:saved': { document: HeroDesignDocument };
  'export:requested': { designId: string; requestId: string };
  'product:requested': { designId: string; requestId: string };
  'blueprint:requested': { designId: string; requestId: string };
}

export type HeroDesignEventName = keyof HeroDesignEventMap;
export type HeroEventHandler<T extends HeroDesignEventName> = (payload: HeroDesignEventMap[T]) => void;

export class HeroDesignEventBus {
  private readonly listeners = new Map<HeroDesignEventName, Set<(payload: never) => void>>();

  subscribe<T extends HeroDesignEventName>(name: T, handler: HeroEventHandler<T>): () => void {
    const handlers = this.listeners.get(name) ?? new Set();
    handlers.add(handler as (payload: never) => void);
    this.listeners.set(name, handlers);
    return () => {
      handlers.delete(handler as (payload: never) => void);
      if (handlers.size === 0) this.listeners.delete(name);
    };
  }

  publish<T extends HeroDesignEventName>(name: T, payload: HeroDesignEventMap[T]): void {
    this.listeners.get(name)?.forEach((handler) => handler(payload as never));
  }

  clear(): void { this.listeners.clear(); }
}
