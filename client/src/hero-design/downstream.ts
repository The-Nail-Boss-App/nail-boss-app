import { HeroDesignDocument, HeroRenderQuality } from './contracts';

interface HeroDownstreamRequestBase {
  requestId: string;
  document: HeroDesignDocument;
  requestedAt: string;
}

export interface HeroExportRequest extends HeroDownstreamRequestBase {
  kind: 'export';
  format: 'png' | 'jpeg' | 'webp' | 'svg' | 'pdf';
  quality: HeroRenderQuality;
  options?: { width?: number; height?: number; transparent?: boolean };
}

export interface HeroProductRequest extends HeroDownstreamRequestBase {
  kind: 'product';
  productType: string;
  options?: Record<string, unknown>;
}

export interface HeroBlueprintRequest extends HeroDownstreamRequestBase {
  kind: 'blueprint';
  schemaVersion: string;
  options?: Record<string, unknown>;
}

export const createHeroExportRequest = (input: Omit<HeroExportRequest, 'kind'>): HeroExportRequest => ({ kind: 'export', ...input });
export const createHeroProductRequest = (input: Omit<HeroProductRequest, 'kind'>): HeroProductRequest => ({ kind: 'product', ...input });
export const createHeroBlueprintRequest = (input: Omit<HeroBlueprintRequest, 'kind'>): HeroBlueprintRequest => ({ kind: 'blueprint', ...input });
