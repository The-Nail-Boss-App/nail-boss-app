# MAT-AUDIT-01 — production render path audit

## Executive finding

The application mounts the ground-up studio in `client/src/nail-design-studio/`.
The large Nail Desk nail is inline SVG in `NailDesignStudio.jsx`, and its polish
pixels are produced by `MaterialLayers` from that directory's
`MaterialRenderer.jsx` (with `HybridMaterialRenderer.jsx` used only for Jelly).
The similarly named `client/src/design-studio/DesignStudio.jsx`, `NailCanvas.jsx`,
and `PolishRenderer.jsx` are not in the mounted studio chain.

The reported split appearance has a separate, concrete state explanation in the
mounted studio. The Active Polish bottle and swatch always consume the current
`activePolishColor`. The large nail prefers the per-nail applied snapshot,
`nailPolishes[index]`, and uses `activePolishColor` only when that slot is empty.
Therefore changing the HEX control to `#030303` can darken the Active Polish UI
while an already-applied pink formulation remains on the nail until **Apply
Polish** copies the active formulation into that nail's slot.

## 1. Production route and mounted component

This application does not use a URL routing library. Its route is an in-memory
page switch:

1. `client/src/index.jsx` creates the React root and renders `<App />`.
2. `client/src/App.jsx` imports `DesignStudio` from `./DesignStudio`.
3. Login sets `page` to `PAGES.STUDIO`; navigation uses the same page value.
4. `renderPage()` handles `PAGES.STUDIO` by mounting `<DesignStudio
   ref={designStudioRef} />` inside `ProtectedAppErrorBoundary`.
5. `client/src/DesignStudio.jsx` is a compatibility export whose default is
   `./nail-design-studio/NailDesignStudio.jsx`.
6. The mounted function is `NailDesignStudio`.

**Answer A:** the deployed Design Studio screen is
`client/src/nail-design-studio/NailDesignStudio.jsx`. It is not the old
`client/src/design-studio/DesignStudio.jsx`. It is a limited combination only in
the dependency sense: the new screen imports the reusable `PolishBottle` from
`design-studio`, and its configured shape list ultimately imports legacy
`blueprint` shape constants. Neither dependency mounts the legacy screen or its
`NailCanvas`/`PolishRenderer` chain.

## 2. Large Single Nail component chain

| Step | Component/function and file | Import source | Relevant state/props forwarded |
| --- | --- | --- | --- |
| Entry | React root, `client/src/index.jsx` | `App` from `./App` | Renders `<App />`. |
| Page switch | `App`, `client/src/App.jsx` | `DesignStudio` from `./DesignStudio` | `page === PAGES.STUDIO`; forwards `designStudioRef`. |
| Compatibility boundary | default re-export, `client/src/DesignStudio.jsx` | `./nail-design-studio/NailDesignStudio.jsx` | No prop transformation. |
| Screen/workspace/desk | `NailDesignStudio`, `client/src/nail-design-studio/NailDesignStudio.jsx` | Mounted through the boundary above | Owns `composition`, `heroState`, `nailPolishes`, active finish/color, selected nail, zoom, and pan. The Single Nail composition produces one `visibleNails` item. |
| Geometry engine | `HeroSurfaceRenderingEngine.process(createHeroSurfaceInput(...))`, called in `NailDesignStudio.jsx` | Hero APIs from `../hero-design/index.ts` | Produces `renderedSurface.path`, `viewBox`, `maskId`, and material metadata from the active Hero document's shape/mask/material/length/width. |
| Nail slot | inline `visibleNails.map(...)` in `NailDesignStudio.jsx` | No child-component import | Produces a button and the `<svg data-testid="stage-nail">`; selection updates `activeNailIndex`. |
| Material surface | `<MaterialLayers ... />` in `NailDesignStudio.jsx` | `{ MaterialLayers }` from `./MaterialRenderer` | Receives geometry path; per-nail finish/color/opacity when present, otherwise active finish/color/effect opacity; receives a unique id and SVG data attributes. |
| Final paths | `MaterialLayers`, `client/src/nail-design-studio/MaterialRenderer.jsx` | Direct call above | Cream/Matte/Glitter emit pigment-gradient and optical SVG paths. Jelly delegates through the enabled feature switch to `HybridJellyMaterial`. |
| Jelly-only paths | `HybridJellyMaterial`, `client/src/nail-design-studio/HybridMaterialRenderer.jsx` | Imported by `MaterialRenderer.jsx` | Receives the same path, selected color, opacity, uid, and base props; emits clipped Jelly SVG paths. |

There is no `NailCanvas` component in this chain. The workspace, Nail Desk, nail
slot, SVG shell, and lighting overlays are all currently inline in
`NailDesignStudio`.

## 3. Final pixel owner and renderer classifications

### `client/src/design-studio/PolishRenderer.jsx` — **legacy/compatibility; active elsewhere only**

**Not active for the large Nail Desk nail.** It exports
`GelNailSurfaceRenderer`/`PolishSurface`. Its studio call site is the legacy
`design-studio/NailCanvas.jsx`, which is called by the unmounted
`design-studio/DesignStudio.jsx`. Other live-capable consumers exist outside the
Nail Desk (`NailThumbnail.jsx` and `BlueprintGalleryRenderer.jsx`), so the module
is not globally dead; it is simply absent from the deployed Nail Desk chain.
Repository scripts and direct-render tests also import it, but tests do not make
it a production call site.

### `client/src/nail-design-studio/MaterialRenderer.jsx` — **active production renderer**

**Active for the large Nail Desk nail and the Active Polish swatch.**
`NailDesignStudio.jsx` imports `MaterialLayers` and `MaterialSwatch` from it.
Every stage nail invokes `MaterialLayers`. For Cream, Matte, and Glitter,
`MaterialLayers` itself emits the final base pigment, curvature, edges,
diffusion/detail, reflection, and top-coat paths. For Jelly it is the production
routing owner but delegates the successful pixel composition to the hybrid
renderer.

### `client/src/nail-design-studio/HybridMaterialRenderer.jsx` — **partially active**

**Active only for Jelly surfaces, including both the large nail and swatch.**
`MaterialRenderer.jsx` imports `HybridJellyMaterial`; `MaterialLayers` calls it
only when `finish === 'Jelly'` and the `hybridJellyRenderer` feature is enabled.
The feature is currently enabled in `client/src/config/features.js`. It does not
paint Cream, Matte, or Glitter. If hybrid construction fails,
`MaterialRenderer.jsx` returns its local legacy Jelly layer composition.

## 4. Active Polish preview versus large nail

### Active Polish chain

1. The Base Color picker/HEX field reads `activePolishColor` and commits through
   `changeFinishParameter`.
2. That function normalizes a new formulation, builds a Hero effect, and updates
   `heroState.document.nail.effect` through `updateHeroEffect`.
3. `activePolishColor` is read back from the Hero effect parameter (`baseColor`,
   or `colorA` for Gradient).
4. `PolishBottle` receives that value as `colorHex`. Its bottle fill is the small
   bottle preview path.
5. `MaterialSwatch` receives the same value as `color`; it invokes
   `MaterialLayers` in `nail-design-studio/MaterialRenderer.jsx`.

### Large nail chain and comparison

The large nail uses the same **active pigment and material renderer only as
fallbacks**. Its actual expressions are:

- finish: `nailPolishes[index]?.finish || activeFinish`;
- color: `nailPolishes[index]?.colorHex || activePolishColor`;
- opacity: `nailPolishes[index]?.opacity ?? appliedEffect.layers[0].opacity`.

`nailPolishes` is a separate array of applied per-nail formulation snapshots,
hydrated from `metadata.polishFormulations`. Clicking **Apply Polish** copies
`activeFormulation` to the selected target slots. Thus the preview and nail use
the same `MaterialLayers` renderer for the swatch/surface, but not necessarily the
same input state. The bottle has its own reusable SVG rendering in
`design-studio/PolishBottle.jsx`.

The fallback color families also differ across architectures: the mounted new
studio defaults to `#D94C70`; its material component also defaults to `#D94C70`.
The legacy polish path defaults to `#E8A0BF`. That legacy fallback cannot explain
pixels on the mounted large nail because that renderer is not called there. A
pink/mauve large nail alongside a `#030303` Active Polish UI is explained by a
truthy pink `nailPolishes[index].colorHex` taking precedence at the stage render.

## 5. `#030303` trace through the deployed tree

| Stage | File | Variable/prop | Expected value / disposition |
| --- | --- | --- | --- |
| Polish control | `client/src/nail-design-studio/NailDesignStudio.jsx` | `hexDraft`, then `changeFinishParameter(baseColorKey(...), hexDraft)` on blur/Enter | `#030303` |
| Active polish state | same | `heroState.document.nail.effect.parameters.baseColor` (Cream), exposed as `activePolishColor` | `#030303` |
| Active formulation | same | `activeFormulation.colorHex` | `#030303` |
| Active nail document | same / Hero reducer | `heroDocument.nail.effect.parameters.baseColor` | `#030303`; this is an active formulation/effect document, not the per-nail applied array. |
| Active Polish bottle | same → `client/src/design-studio/PolishBottle.jsx` | `colorHex={activePolishColor}` | `#030303` immediately |
| Active Polish swatch | same → `client/src/nail-design-studio/MaterialRenderer.jsx` | `color={activePolishColor}` | `#030303` immediately |
| Apply boundary | `client/src/nail-design-studio/NailDesignStudio.jsx` | `applyPolish`; target `nailPolishes[index].colorHex` | Becomes `#030303` only after Apply Polish targets that nail. |
| Nail Desk stage | same | `color={nailPolishes[index]?.colorHex || activePolishColor}` | `#030303` if slot is empty or was just applied; otherwise the older truthy slot color wins. **This is the exact divergence point.** |
| Large nail renderer | `client/src/nail-design-studio/MaterialRenderer.jsx` | `MaterialLayers.color` | Whatever the preceding precedence expression selected. |
| Final Cream SVG input | same | `MaterialDefs.color`; gradient stops used by the `base-pigment` path | `#030303` when delivered; otherwise the prior per-nail color. The base path fills `url(#...-pigment)`, whose first two stops use `color`. |

No conversion in `MaterialRenderer` silently changes valid `#030303` to pink.
For Cream, a small pale diffusion overlay exists, but it is not the pigment source
and does not replace the two selected-color pigment stops. The value disappears
from the large nail path before `MaterialLayers`, at the per-nail precedence
expression, when an older applied formulation exists.

## 6. Directory responsibility audit

### `client/src/design-studio/`

- **Legacy screen shell/workspace:** `DesignStudio.jsx` owns the former complete
  screen and panel/workflow orchestration, but production no longer mounts it.
- **Legacy nail canvas/geometry/rendering:** `NailCanvas.jsx`, `blueprint.js`,
  `NailThumbnail.jsx`, hand/full-set previews, asset and French-tip render helpers.
  Some geometry constants/helpers remain imported elsewhere in the application.
- **Polish UI:** `PolishBottle.jsx` is reused by the mounted new studio. The old
  studio's polish controls remain in the unmounted shell.
- **Material/effects:** `PolishRenderer.jsx`, `materialFoundation.js`, and
  `polish.js` power the legacy canvas and some thumbnails/gallery renderers, not
  the deployed Nail Desk large nail.
- **Tests/scripts:** `LivePigmentState.test.jsx`, renderer/foundation tests, and
  numerous source-inspection scripts exercise the old implementation.
- **Classification:** not wholly dead and not wholly canonical. Its screen and
  large-canvas chain are legacy/unmounted; selected reusable bottle, geometry,
  thumbnail, gallery, and configuration dependencies remain active.

### `client/src/nail-design-studio/`

- **Canonical screen shell/workspace/Nail Desk:** `NailDesignStudio.jsx`.
- **Nail canvas:** no separate canvas component; stage SVG and nail map are inline
  in the screen.
- **Geometry:** obtains the final path/viewBox from the Hero Design surface engine;
  the user-facing shape list arrives through config backed by legacy shape names.
- **Polish UI/state:** controls, active formulation, per-nail Apply state, rack,
  persistence, bottle composition, and swatch are orchestrated in the screen.
- **Material renderer/effects:** `MaterialRenderer.jsx`, Jelly-only
  `HybridMaterialRenderer.jsx`, and `polishFinish.js`; Hero effect/lighting APIs
  provide additional overlays.
- **Tests:** `NailDesignStudio.test.jsx` and `MaterialRenderer.test.jsx` exercise
  this production implementation.
- **Classification:** canonical mounted studio with a few deliberate imports from
  the older directory.

### Architecture determination

The closest supplied category is **Architecture C: one studio importing selected
engines/components from the other**, with an important qualification. The
canonical mounted studio is `nail-design-studio`; it reuses the old PolishBottle
and indirectly the old shape catalog. Separately, old rendering modules remain
active in non-Desk previews/galleries. This is not Architecture A because the old
directory is not fully dead, and not Architecture B in the sense of two mounted
Design Studio screens. The duplication is nevertheless hazardous because both
directories contain independently testable material renderers.

## 7. Recent material work: effective production impact

The classifications below follow the changed files in the corresponding commit
series and actual current imports, not their test names or audit prose.

| Work | Classification | Evidence |
| --- | --- | --- |
| MAT-F01 | **ACTIVE ON LARGE NAIL (Jelly only)** | The hybrid Jelly foundation changed `nail-design-studio/HybridMaterialRenderer.jsx` and its routing in `MaterialRenderer.jsx`. The mounted stage calls `MaterialLayers`, and the enabled switch delegates Jelly to the hybrid component. It has no effect on the reported Cream surface. |
| MAT-F02 | **NOT IN ACTIVE PRODUCTION PATH (large Nail Desk)** | “Route Design Studio finishes through layered materials” changed only `design-studio/PolishRenderer.jsx`, `materialFoundation.js`, `polish.js`, and their tests. Those feed the unmounted legacy `NailCanvas`, not the inline production stage. They can affect legacy thumbnails/gallery consumers elsewhere. |
| MAT-F02R | **NOT IN ACTIVE PRODUCTION PATH (large Nail Desk)** | Cream calibration, neutral optics, and Shine-range corrections were all made in the same `design-studio/PolishRenderer.jsx`/foundation/polish chain. The production Cream stage uses `nail-design-studio/MaterialRenderer.jsx`, whose independent Cream profile and gradients were untouched. Thus it is **ACTIVE ELSEWHERE ONLY** at application scope. |
| MAT-F02R2 | **NOT IN ACTIVE PRODUCTION PATH (large Nail Desk)** | The propagation fixes changed the unmounted `design-studio/DesignStudio.jsx` state workflow and its `PolishRenderer`. The deployed screen has different Hero effect state plus explicit per-nail Apply snapshots. The fix and its test do not traverse the production screen. |

This explains why those changes could pass while MAT-F02 through MAT-F02R2
produce no large-nail change. MAT-F01 is the exception because it was placed in
the mounted renderer, but it is intentionally Jelly-only and therefore irrelevant
to a Cream report.

## 8. Test audit: what each family proves

### Tests that bypass the actual production nail renderer

- `client/src/design-studio/LivePigmentState.test.jsx` imports the unmounted old
  `DesignStudio`, explicitly mocks `./NailCanvas.jsx`, and substitutes a small SVG
  that directly calls old `PolishSurface`. It proves legacy draft-to-blueprint
  synchronization and old renderer pigment resolution. It does **not** prove the
  mounted screen's Hero-effect/per-nail-Apply path or the new material renderer.
  Its own comment incorrectly calls that old path “real DesignStudio state” for
  production purposes. This is the clearest false-confidence test for MAT-F02R2.
- `client/src/design-studio/PolishRendererFoundation.test.jsx` directly renders
  `PolishSurface`/`GelNailSurfaceRenderer`. It accurately proves the old
  renderer's presets, pigment SVG, optical neutrality, and Shine mapping, but not
  any deployed Nail Desk pixel.
- `client/src/design-studio/materialFoundation.test.js` directly tests old
  foundation functions. It proves preset/pigment normalization in isolation, not
  production reachability.
- Static scripts including `scripts/luxury-nail-renderer-test.mjs`,
  `scripts/geometry-helper-test.mjs`, and several workspace/founder scripts inspect
  the old renderer/canvas/screen source. They prove source invariants in the
  legacy architecture, not which component the app mounts.

### Tests that do exercise the production implementation

- `client/src/nail-design-studio/MaterialRenderer.test.jsx` directly instantiates
  the production `MaterialLayers`. It proves output structure, material profiles,
  and Jelly routing, but not screen state precedence.
- `client/src/nail-design-studio/NailDesignStudio.test.jsx` mounts the canonical
  screen. Its material test queries `stage-nail` and confirms each finish's actual
  renderer/layers, so it does not bypass the production renderer. Its Apply test
  proves formulation copying and persistence. However, the recent suite has no
  assertion for “edit HEX after a prior per-nail formulation is present,” the
  exact state split behind the observation.
- `client/src/App.test.jsx` mounts `App` and verifies access to the new studio, but
  does not assert pigment-to-large-nail pixels.

**Answer:** yes, recent legacy material and live-pigment tests bypassed the actual
production Nail Desk renderer. Not all material tests do: the tests under
`nail-design-studio` target the correct implementation.

## 9. Duplicate/legacy findings and recommendation

The top-level compatibility export makes the intended ownership unusually clear:
it says the legacy studio is preserved but no longer mounted. Nevertheless, old
screen/canvas/material tests and scripts still use “Design Studio” language, and
the new studio imports a bottle and shape catalog from the old directory. This
creates two credible-looking material systems and allows changes to be validated
without production reachability.

The canonical architecture going forward should be the approved ground-up
`client/src/nail-design-studio/` screen, state model, and material renderer,
integrated with the existing `hero-design` engines. Reusable cross-screen assets
such as `PolishBottle` and genuinely shared geometry should eventually have
explicit shared ownership, but this audit does not recommend or perform that
migration. The old complete studio should remain clearly classified as legacy
until a separate removal/migration decision accounts for its non-studio gallery
and thumbnail consumers.

## 10. Recommended next corrective task

Create one narrowly scoped production task: **make the mounted
`nail-design-studio/NailDesignStudio.jsx` HEX/picker behavior and per-nail Apply
semantics explicit and tested by mounting `NailDesignStudio`, seeding an applied
pink formulation, entering `#030303`, and asserting the intended large-stage
result before and after Apply.** Decide the product contract first (live-preview
the active nail versus Apply-only); then change only the mounted state handoff and
its production integration test. Do not modify `design-studio/PolishRenderer.jsx`
as part of that correction.
