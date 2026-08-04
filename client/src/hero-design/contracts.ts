/** Canonical, renderer-independent contracts for the Hero Design integration shell. */
export const HERO_ENGINE_IDS = [
  'Hero Shape Library', 'Hero Shape Engine', 'Hero Nail Mask Engine',
  'Hero Surface Rendering Engine', 'Hero Material Engine', 'Hero Effect Engine',
  'Hero Lighting Engine', 'Hero Asset Library', 'Hero Layer Engine',
  'Hero Material Library', 'Hero Export Engine', 'Hero Product Engine',
  'Hero Blueprint Engine',
] as const;

export type HeroEngineId = typeof HERO_ENGINE_IDS[number];
export type HeroLayerType = 'base' | 'material' | 'effect' | 'brush' | 'sticker' | 'embellishment' | 'mask' | 'adjustment';
export type HeroBlendMode = 'normal' | 'multiply' | 'screen' | 'overlay' | 'darken' | 'lighten';
export type HeroRenderQuality = 'interactive' | 'preview' | 'export';

export interface HeroTransform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
}

export interface HeroLayer<TPayload = unknown> {
  id: string;
  name: string;
  type: HeroLayerType;
  opacity: number;
  visible: boolean;
  locked: boolean;
  blendMode: HeroBlendMode;
  transform: HeroTransform;
  payload: TPayload;
}

export interface HeroViewConfiguration {
  view: 'top' | 'side' | 'perspective';
  rotation: number;
  zoom: number;
}

export interface HeroNailConfiguration {
  shape: { id: string; version?: string };
  mask: HeroNailMaskReference;
  /** Stable material selection; resolved renderer data is never persisted. */
  material: HeroNailMaterialReference;
  length: number;
  width: number;
  tipDown: boolean;
  view: HeroViewConfiguration;
}

export type HeroNailMaterialCategory = 'natural-nail' | 'clear-tip' | 'soft-gel' | 'acrylic' | 'builder-gel';
export interface HeroNailMaterialReference { id: string; version: string }
/** Renderer-independent physical surface values. All numeric properties are normalized to 0–1. */
export interface HeroNailMaterial {
  id: string;
  version: string;
  category: HeroNailMaterialCategory;
  opacity: number;
  translucency: number;
  density: number;
  edgeSoftness: number;
  surfaceRoughness: number;
  curvatureDepth: number;
  baseTint?: string;
}

export type HeroMaskSource = { type: 'svg' | 'path' | 'alpha'; assetId: string };

/** Lightweight reference to a production mask; production geometry stays in its owning asset registry. */
export interface HeroNailMaskReference {
  id: string;
  version?: string;
  shapeId?: string;
  coordinateSpace?: 'normalized';
  safeMargin?: number;
  source?: HeroMaskSource;
}

export interface HeroLightingConfiguration {
  environment?: string;
  intensity: number;
  direction: { x: number; y: number; z: number };
  color: string;
}

export interface HeroCanvasConfiguration {
  width: number;
  height: number;
  background?: string;
  pixelRatio?: number;
}

export interface HeroDesignMetadata {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  authorId?: string;
  description?: string;
  tags?: string[];
}

export interface HeroProductMetadata { productId?: string; sku?: string; attributes?: Record<string, unknown> }
export interface HeroBlueprintMetadata { blueprintId?: string; schemaVersion?: string; attributes?: Record<string, unknown> }

/** The single source of truth. It intentionally contains no flattened image. */
export interface HeroDesignDocument {
  metadata: HeroDesignMetadata;
  nail: HeroNailConfiguration;
  layers: HeroLayer[];
  lighting: HeroLightingConfiguration;
  canvas: HeroCanvasConfiguration;
  product?: HeroProductMetadata;
  blueprint?: HeroBlueprintMetadata;
  revision: number;
}

export interface HeroEngineContext { signal?: AbortSignal; services?: Record<string, unknown> }
export interface HeroEngineProcessContext { signal?: AbortSignal; quality?: HeroRenderQuality }
export interface HeroValidationIssue { path: string; code: string; message: string; severity: 'error' | 'warning' }
export interface HeroValidationResult { valid: boolean; issues: HeroValidationIssue[] }

export interface HeroEngine<TInput = unknown, TOutput = unknown> {
  readonly id: HeroEngineId;
  readonly version: string;
  readonly capabilities: readonly string[];
  initialize(context?: HeroEngineContext): void | Promise<void>;
  process(input: TInput, context?: HeroEngineProcessContext): TOutput | Promise<TOutput>;
  validate(input: TInput): HeroValidationResult | Promise<HeroValidationResult>;
  dispose(): void | Promise<void>;
}

export interface HeroRenderRequest {
  requestId: string;
  document: HeroDesignDocument;
  quality: HeroRenderQuality;
  requestedAt: string;
}

export interface HeroRenderResult<TOutput = unknown> {
  requestId: string;
  quality: HeroRenderQuality;
  completedAt: string;
  output?: TOutput;
  warnings?: HeroValidationIssue[];
  error?: { code: string; message: string };
}

export const createHeroDesignDocument = (
  input: { id: string; name: string; now?: string; shapeId: string; shapeVersion?: string; maskId: string; maskVersion?: string; safeMargin?: number },
): HeroDesignDocument => {
  const now = input.now ?? new Date().toISOString();
  return {
    metadata: { id: input.id, name: input.name, createdAt: now, updatedAt: now },
    nail: {
      shape: { id: input.shapeId, version: input.shapeVersion ?? '1' },
      mask: { id: input.maskId, version: input.maskVersion ?? '1', shapeId: input.shapeId, coordinateSpace: 'normalized', safeMargin: input.safeMargin ?? 0, source: { type: 'path', assetId: `founder-approved-nail-mask:${input.shapeId}:1` } },
      material: { id: 'soft-gel-neutral', version: '1' },
      length: 1, width: 1, tipDown: true, view: { view: 'top', rotation: 0, zoom: 1 },
    },
    layers: [],
    lighting: { intensity: 1, direction: { x: 0, y: 0, z: 1 }, color: '#ffffff' },
    canvas: { width: 1024, height: 1024, pixelRatio: 1 },
    revision: 0,
  };
};
