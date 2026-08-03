# Hero Design Integration Shell

The integration shell in `client/src/hero-design` is a renderer-independent foundation for the approved Hero Engines. It adds no UI and does not replace the existing Design Studio or renderer.

## Dependency boundary

```text
Design Studio UI -> Hero Design State -> Integration Shell -> Engine Registry -> Hero Engines
                                      |
                                      +-> Export / Product / Blueprint requests
```

UI code should dispatch state actions and publish lightweight events. It must not depend on an engine implementation. Engines are registered by their approved ID and consumed only through `HeroEngine`.

## Modules

- `contracts.ts` defines the canonical document, nail, layer, render, validation, and engine contracts.
- `validation.ts` validates documents at system boundaries without mutating them.
- `registry.ts` registers and resolves swappable engine implementations.
- `events.ts` provides a synchronous, strongly typed event bus.
- `state.ts` provides the pure reducer, initial state, actions, and selectors.
- `persistence.ts` defines the persistence interface and a browser-storage adapter.
- `adapters.ts` converts supported legacy Design Studio fields, preserves the original input, and explicitly reports unsupported or missing fields.
- `downstream.ts` defines Export, Product, and Blueprint request handoffs.
- `index.ts` is the public module entry point.

## Integration rules

1. Keep `HeroDesignDocument` as the source of truth; never add a flattened image as design state.
2. Keep length and width in `HeroNailConfiguration` only.
3. Validate documents before persistence or engine handoff.
4. Register engines against one of the approved IDs and access them through the registry.
5. Treat legacy conversion failure as explicit: a `null` document is accompanied by `missingFields`; unsupported input is retained in `original` and described by `unsupportedFields`.
6. Pass the canonical document to downstream request contracts so downstream systems do not depend on editor state.

## Verification

Run the focused shell tests with:

```bash
CI=true npm test --prefix client -- --runTestsByPath src/hero-design/heroDesign.test.ts
```

Run the existing Design Studio suite and production build before integrating the shell into callers.
