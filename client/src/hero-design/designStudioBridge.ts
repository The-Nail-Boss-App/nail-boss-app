import { createHeroDesignDocument, HeroDesignDocument } from './contracts';
import { HeroPersistenceAdapter } from './persistence';
import { HERO_SHAPE_IDS, HERO_SHAPE_VERSION, HeroShapeId } from './shape';

export interface LegacyNailBasics {
  shape?: string;
  length?: number;
  width?: number;
}

const supportedShape = (shape?: string): shape is HeroShapeId =>
  HERO_SHAPE_IDS.includes(shape as HeroShapeId);

/** The narrow compatibility adapter used while Design Studio's blueprint remains legacy-owned. */
export function heroDocumentFromLegacyNail(
  legacy: LegacyNailBasics,
  metadata: { id: string; name: string; revision?: number },
): HeroDesignDocument {
  const shape = supportedShape(legacy.shape) ? legacy.shape : 'Almond';
  const document = createHeroDesignDocument({
    id: metadata.id,
    name: metadata.name || 'Untitled design',
    shapeId: shape,
    shapeVersion: HERO_SHAPE_VERSION,
    maskId: `${shape.toLowerCase()}-mask`,
  });
  return {
    ...document,
    nail: {
      ...document.nail,
      length: typeof legacy.length === 'number' ? legacy.length : 0.5,
      width: typeof legacy.width === 'number' ? legacy.width : 0.5,
    },
    revision: metadata.revision ?? 0,
  };
}

/** Hero storage wins when present; old blueprints are adapted without discarding them. */
export async function loadHeroDocumentWithLegacyFallback(
  persistence: HeroPersistenceAdapter,
  id: string,
  name: string,
  legacy: LegacyNailBasics,
): Promise<HeroDesignDocument> {
  try {
    const stored = await persistence.load(id);
    return stored ?? heroDocumentFromLegacyNail(legacy, { id, name });
  } catch {
    // A malformed/older Hero payload must never prevent the intact legacy blueprint opening.
    return heroDocumentFromLegacyNail(legacy, { id, name });
  }
}

export function nailBasicsFromHero(document: HeroDesignDocument): Required<LegacyNailBasics> {
  return {
    shape: document.nail.shape.id,
    length: document.nail.length,
    width: document.nail.width,
  };
}
