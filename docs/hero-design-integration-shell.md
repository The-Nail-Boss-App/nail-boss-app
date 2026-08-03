# Hero Design Integration Shell

The integration shell in `client/src/hero-design` is a renderer-independent foundation for the approved Hero Engines. It adds no UI and does not replace the existing Design Studio or renderer.

## Dependency boundary

```text
Design Studio UI -> Hero Design State -> Integration Shell -> Engine Registry -> Hero Engines
                                      |
                                      +-> Export / Product / Blueprint requests
```

The mask dependency is deliberately one-way: **Hero Shape → Hero Nail Mask → future Surface Rendering**. The mask engine does not import or interpret materials, lighting, effects, exports, products, or blueprints, and future renderers may consume its renderer-neutral clipping result rather than the reverse.

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
- `mask.ts` registers the approved Hero Nail Mask Engine and resolves shape-version pairs to lightweight production mask references, normalized clipping boundaries, and hit testing.

## Nail masks

Each of the eight approved shapes (Almond, Coffin, Square, Oval, Round, Stiletto, Lipstick, and Duck) maps to exactly one versioned entry backed by the Founder-approved production silhouette registry. A design stores only the mask ID, shape/version relationship, normalized coordinate space, safe margin, and production asset ID; it never embeds a bitmap. Missing, malformed, unavailable, or shape-incompatible entries produce validation issues instead of falling back to Almond or inventing geometry.

Mask bounds use normalized coordinates (`0` through `1`) independent of canvas size. The outer clipping boundary remains the unchanged production silhouette. A configurable safe margin (`0` through `0.25`) defines an interior constraint for later placement and painting consumers; it is neither canvas padding nor a permanent crop of the source asset. Basic normalized hit testing is available for outer and safe boundaries, while the clipping source remains renderer-neutral.

Before Surface Rendering integration, masks provide references, bounds, validation, diagnostics, and mask-level hit testing only. They do not rasterize artwork, render polish or lighting, provide brush/sticker tools, or account for physical surface curvature.

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
