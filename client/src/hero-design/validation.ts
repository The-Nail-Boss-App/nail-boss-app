import { HERO_ENGINE_IDS, HeroDesignDocument, HeroLayer, HeroValidationIssue, HeroValidationResult } from './contracts';
import { shapeConfigurationFromDocument, validateHeroShapeConfiguration } from './shape';
import { validateHeroNailMask } from './mask';
import { HERO_MATERIAL_LIBRARY, validateHeroNailMaterial } from './material';

const issue = (path: string, code: string, message: string): HeroValidationIssue => ({ path, code, message, severity: 'error' });
const finitePositive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function validateHeroLayer(layer: HeroLayer, path = 'layers'): HeroValidationIssue[] {
  const issues: HeroValidationIssue[] = [];
  if (!layer || typeof layer !== 'object') return [issue(path, 'invalid_layer', 'Layer must be an object.')];
  if (!layer.id) issues.push(issue(`${path}.id`, 'required', 'Layer id is required.'));
  if (!layer.name) issues.push(issue(`${path}.name`, 'required', 'Layer name is required.'));
  if (!['base', 'material', 'effect', 'brush', 'sticker', 'embellishment', 'mask', 'adjustment'].includes(layer.type)) issues.push(issue(`${path}.type`, 'unsupported', 'Layer type is not supported.'));
  if (typeof layer.opacity !== 'number' || layer.opacity < 0 || layer.opacity > 1) issues.push(issue(`${path}.opacity`, 'range', 'Opacity must be between 0 and 1.'));
  return issues;
}

export function validateHeroDesignDocument(document: HeroDesignDocument): HeroValidationResult {
  const issues: HeroValidationIssue[] = [];
  if (!document || typeof document !== 'object') return { valid: false, issues: [issue('', 'invalid_document', 'Hero Design document must be an object.')] };
  if (!document.metadata?.id) issues.push(issue('metadata.id', 'required', 'Design id is required.'));
  if (!document.metadata?.name) issues.push(issue('metadata.name', 'required', 'Design name is required.'));
  if (!document.metadata?.createdAt) issues.push(issue('metadata.createdAt', 'required', 'Creation time is required.'));
  if (!document.metadata?.updatedAt) issues.push(issue('metadata.updatedAt', 'required', 'Update time is required.'));
  if (!document.nail?.shape?.id) issues.push(issue('nail.shape.id', 'required', 'Shape id is required.'));
  else issues.push(...validateHeroShapeConfiguration(shapeConfigurationFromDocument(document)).issues);
  if (!document.nail?.mask?.id) issues.push(issue('nail.mask.id', 'required', 'Mask id is required.'));
  else {
    issues.push(...validateHeroNailMask(document.nail.mask).issues);
    if (document.nail.mask.shapeId !== document.nail.shape.id)
      issues.push(issue('nail.mask.shapeId', 'incompatible_shape', 'The mask must match the selected Hero shape.'));
  }
  if (!document.nail?.material?.id || !document.nail?.material?.version) issues.push(issue('nail.material', 'required', 'A stable material ID and version are required.'));
  else issues.push(...validateHeroNailMaterial(HERO_MATERIAL_LIBRARY.find(({ id, version }) => id === document.nail.material.id && version === document.nail.material.version) as any).issues.map((entry) => ({ ...entry, path: entry.path.replace(/^material/, 'nail.material') })));
  if (typeof document.nail?.length !== 'number' || !Number.isFinite(document.nail.length) || document.nail.length < 0) issues.push(issue('nail.length', 'range', 'Length must be a non-negative finite number.'));
  if (typeof document.nail?.width !== 'number' || !Number.isFinite(document.nail.width) || document.nail.width < 0) issues.push(issue('nail.width', 'range', 'Width must be a non-negative finite number.'));
  if (typeof document.nail?.tipDown !== 'boolean') issues.push(issue('nail.tipDown', 'required', 'Tip-down orientation is required.'));
  if (!document.nail?.view || !['top', 'side', 'perspective'].includes(document.nail.view.view)) issues.push(issue('nail.view', 'unsupported', 'A supported view configuration is required.'));
  if (!document.lighting || typeof document.lighting.intensity !== 'number' || !document.lighting.direction || !document.lighting.color) issues.push(issue('lighting', 'required', 'Lighting configuration is required.'));
  if (!finitePositive(document.canvas?.width) || !finitePositive(document.canvas?.height)) issues.push(issue('canvas', 'range', 'Canvas dimensions must be positive finite numbers.'));
  if (!Number.isInteger(document.revision) || document.revision < 0) issues.push(issue('revision', 'range', 'Revision must be a non-negative integer.'));
  if (!Array.isArray(document.layers)) issues.push(issue('layers', 'required', 'Layers must be an array.'));
  else {
    const ids = new Set<string>();
    document.layers.forEach((layer, index) => {
      issues.push(...validateHeroLayer(layer, `layers[${index}]`));
      if (ids.has(layer.id)) issues.push(issue(`layers[${index}].id`, 'duplicate', 'Layer ids must be unique.'));
      ids.add(layer.id);
    });
  }
  return { valid: issues.length === 0, issues };
}

export function isHeroEngineId(value: string): boolean { return (HERO_ENGINE_IDS as readonly string[]).includes(value); }
