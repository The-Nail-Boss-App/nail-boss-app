import { HeroEngine, HeroEngineId } from './contracts';

export class HeroEngineRegistry {
  private readonly engines = new Map<HeroEngineId, HeroEngine>();

  register(engine: HeroEngine): void {
    if (this.engines.has(engine.id)) throw new Error(`Hero engine already registered: ${engine.id}`);
    this.engines.set(engine.id, engine);
  }

  unregister(id: HeroEngineId): HeroEngine | undefined {
    const engine = this.engines.get(id);
    this.engines.delete(id);
    return engine;
  }

  resolve<T extends HeroEngine = HeroEngine>(id: HeroEngineId): T {
    const engine = this.engines.get(id);
    if (!engine) throw new Error(`Hero engine is not registered: ${id}`);
    return engine as T;
  }

  has(id: HeroEngineId): boolean { return this.engines.has(id); }

  supports(id: HeroEngineId, capability: string): boolean {
    return this.engines.get(id)?.capabilities.includes(capability) ?? false;
  }
}
