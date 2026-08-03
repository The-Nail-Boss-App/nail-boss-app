import { HeroDesignDocument, HeroLayer, HeroRenderRequest, HeroRenderResult } from './contracts';
import type { HeroResolvedNailMask } from './mask';

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
