# Design Studio Luxury Nail Rendering Engine

## Milestone 1 scope

This construction phase changes only the rendering foundation. The existing Studio shell, navigation, tools, blueprint workflow, and save/load contract remain unchanged.

## Architecture decisions

1. **One mask registry.** `FOUNDER_APPROVED_NAIL_MASKS` is the canonical silhouette source for Almond, Coffin, Square, Oval, Round, Stiletto, Lipstick, and Duck. Hero Canvas, hand previews, thumbnails, clipping, and geometry validation continue to resolve through `buildNailPath`, preventing visual drift between surfaces.
2. **Composable optical stack.** The polish renderer exposes named base-polish, curvature, highlight, reflection, gloss, and top-coat groups. Nail art remains above the polish surface, while future finish effects can target a named group without replacing the renderer.
3. **Shape-aware light.** Each silhouette uses a reflection profile. Curvature includes bilateral sidewall shadow, cuticle fade, free-edge depth and rim shadow, plus broad and tight apex highlights.
4. **Material, not effect, presets.** Cream, Jelly, Matte, Glass, and Chrome-ready are optical profiles. Chrome-ready has reflective geometry but intentionally sets metallic response to zero; it does not implement Chrome. Legacy Chrome and Glitter data remain readable to preserve saved designs.
5. **SVG-only hot path.** Length, width, shape, and color updates change path/gradient attributes without bitmap generation, canvas reads, layout measurement, or per-frame effects. Existing memoized Studio state and event flow are unchanged.

## Review evidence

- `screenshots/luxury-renderer-before.svg` records the flat single-fill baseline.
- `screenshots/luxury-renderer-after.svg` records the layered red Cream/almond acceptance target.

Both comparison captures use the same 320 × 480 viewport and silhouette so the lighting change can be reviewed without a UI redesign.

## Legacy geometry test alignment

Duck is now part of the eight-shape, Founder-approved canonical silhouette library and uses the same registry, geometry, clipping, and save/load pipeline as the other supported shapes. The legacy geometry test previously required Duck to remain hidden and normalize to Square; that requirement was superseded by the Milestone 1 approval and the test now protects Duck as a selectable, renderable canonical shape while retaining saved-design coverage. Responsive Hero Canvas checks validate the containment structure and responsive sizing behavior rather than an exact `maxWidth` source string, so safe spacing refinements do not create false regressions.
