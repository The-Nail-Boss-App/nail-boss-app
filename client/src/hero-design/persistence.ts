import { HeroDesignDocument } from './contracts';
import { validateHeroDesignDocument } from './validation';

export interface HeroPersistenceAdapter {
  create(document: HeroDesignDocument): Promise<HeroDesignDocument>;
  load(id: string): Promise<HeroDesignDocument | null>;
  save(document: HeroDesignDocument): Promise<HeroDesignDocument>;
  duplicate(id: string, newId: string, newName?: string): Promise<HeroDesignDocument>;
  delete(id: string): Promise<boolean>;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Browser-storage implementation behind the stable persistence boundary. */
export class HeroLocalStoragePersistenceAdapter implements HeroPersistenceAdapter {
  constructor(private readonly storage: KeyValueStorage, private readonly prefix = 'anitaset.hero-design.v1:') {}

  private key(id: string): string { return `${this.prefix}${id}`; }

  async create(document: HeroDesignDocument): Promise<HeroDesignDocument> {
    if (await this.load(document.metadata.id)) throw new Error(`Hero design already exists: ${document.metadata.id}`);
    return this.save(document);
  }

  async load(id: string): Promise<HeroDesignDocument | null> {
    const serialized = this.storage.getItem(this.key(id));
    if (serialized === null) return null;
    const document = JSON.parse(serialized) as HeroDesignDocument;
    const result = validateHeroDesignDocument(document);
    if (!result.valid) throw new Error(`Stored Hero design is invalid: ${result.issues.map(({ path }) => path).join(', ')}`);
    return copy(document);
  }

  async save(document: HeroDesignDocument): Promise<HeroDesignDocument> {
    const result = validateHeroDesignDocument(document);
    if (!result.valid) throw new Error(`Cannot save invalid Hero design: ${result.issues.map(({ path }) => path).join(', ')}`);
    this.storage.setItem(this.key(document.metadata.id), JSON.stringify(document));
    return copy(document);
  }

  async duplicate(id: string, newId: string, newName?: string): Promise<HeroDesignDocument> {
    const source = await this.load(id);
    if (!source) throw new Error(`Hero design not found: ${id}`);
    if (await this.load(newId)) throw new Error(`Hero design already exists: ${newId}`);
    const now = new Date().toISOString();
    return this.create({ ...source, metadata: { ...source.metadata, id: newId, name: newName ?? source.metadata.name, createdAt: now, updatedAt: now }, revision: 0 });
  }

  async delete(id: string): Promise<boolean> {
    if (!(await this.load(id))) return false;
    this.storage.removeItem(this.key(id));
    return true;
  }
}
