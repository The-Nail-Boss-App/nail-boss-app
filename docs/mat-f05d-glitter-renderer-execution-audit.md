# MAT-F05D — Glitter Renderer Execution Audit

## 1–4. Audit identity and scope

- **Branch:** `work`
- **Audit basis:** repository state at `fb6b37b` (including MAT-F05C commit
  `7ef544c`).
- **Instrumentation:** none. No renderer or production code was changed.
- **Files modified:** this report only.
- **Primary files inspected:**
  - `client/src/nail-design-studio/NailDesignStudio.jsx` and
    `NailDesignStudio.css`
  - `client/src/nail-design-studio/MaterialRenderer.jsx` and its tests
  - `client/src/nail-design-studio/polishFinish.js`
  - `client/src/hero-design/{contracts,effect,lighting,material,surface}.ts`
  - `client/src/design-studio/blueprint.js`
  - `client/src/DesignStudio.jsx`, `client/src/index.jsx`, and `client/src/App.jsx`
  - the legacy `client/src/design-studio/` renderer/formulation files
  - MAT-F01/F02/F02C/F03 documentation and the MAT-F05A–C Git history

## 5–6. Exact Glitter data flow and stress-case values

### Live control-to-pixel path

1. The Polish Studio controls read `activePolishColor`, `appliedEffect` shared
   controls, and `activeFormulation.fleckColor/glitterDensity`. Base and fleck
   color inputs uppercase valid HTML color values; range inputs convert strings
   with `Number`.
2. Every edit enters `changeFinishParameter`. It merges the edit into
   `activeFormulation`, aliases `baseColor`/`colorA` to `colorHex`, and calls
   `normalizePolishForFinish(..., activeFinish)`.
3. `normalizePolishForFinish` is the sole finish-normalization boundary. It:
   validates/uppercases the base color; defaults shared opacity, viscosity, and
   shine; validates/uppercases fleck color; converts density to a number and
   clamps it to `[0,1]`; and stores both flat Glitter fields and the frozen
   `{baseColor, fleckColor, density}` compatibility object.
4. `heroEffectForPolish` deliberately aliases Glitter to the Hero **Solid**
   effect. Only base color, opacity, viscosity, and shine enter Hero effect
   state. Fleck color and density remain in React `finishFormulation` (and in a
   copied normalized object in `nailPolishes` after Apply Polish).
5. The active nail renders live controls directly. Inactive/per-nail nails read
   their copied `nailPolishes[index]`, falling back to the active formulation.
6. `NailDesignStudio` passes finish, color, fleck color, density, opacity, and
   shine to `MaterialLayers`. Viscosity is not a renderer prop and has no pixel
   effect.
7. The exact dedicated route is `if (finish === 'Glitter') return
   <GlitterLayers ... density={glitterDensity} .../>`. No generic material body
   is rendered alongside it.
8. `GlitterLayers` uses base color in its deterministic seed and Cream-derived
   pigment definitions, fleck color in the seed and ellipse fills, clamped
   density to choose `round(density * 2000)` particles, opacity only on the base
   pigment path, and clamped shine only for its three clear-surface strengths.

### Founder stress case at `GlitterLayers`

| Value | Runtime value | Normalization/replacement |
|---|---:|---|
| `color` / base color | `#000000` | validated and uppercased; not replaced |
| `fleckColor` | `#FFFFFF` | validated and uppercased; not replaced |
| `density` | `1` (`data-glitter-density="1.00"`) | numeric conversion and `[0,1]` clamp |
| `shine` | `0.82` | Glitter default unless explicitly changed; clamped in renderer |
| `opacity` | `1` | Glitter default unless explicitly changed |
| `viscosity` | `0.7` | normalized/stored/persisted, but never reaches `MaterialLayers` |

The deterministic field therefore receives exactly
`glitterParticleField('#000000', '#FFFFFF', 1)` and returns 2,000 records.
One important semantic detail is that polish opacity affects only the pigment
path; it does **not** multiply the particles or later reflections.

## 7. Exact visible Glitter paint order

Definitions do not paint. The following list is the actual SVG paint order for
one stage nail:

| # | Element/layer | Strength | Blend/filter | Coverage/ownership | Relative to particles |
|---:|---|---|---|---|---|
| 1 | `base-pigment` path | `opacity * 1` (stress: `1`) | normal, no filter | full nail path; Glitter-specific composition using Cream pigment foundation | before |
| 2 | `curvature-shadow` path | `.16`; gradient stops white `.08/.015`, black `.08` | normal | full nail; Cream-derived | before |
| 3 | `edge-darkening` path | `.14`; edge stop maxima `.22/.16` | normal | full nail; Cream-derived | before |
| 4 | `material-diffusion` path | `.025` white | normal | full nail; Glitter composition | before |
| 5 | embedded ellipse group | per particle `.24–.54` | Gaussian blur `stdDeviation=.24` | Glitter clip path | particle layer |
| 6 | surface-near ellipse group | per particle `.46–.82` | normal | Glitter clip path | particle layer |
| 7 | specular ellipse group | per particle `.82–.98` | radial white/fleck hit fill | Glitter clip path | particle layer |
| 8 | material `reflection` path | stress `.339`; restrained 12% gradient with stop maxima `.58/.34/.07` | normal | full nail; Glitter-specific multiplier | after |
| 9 | material `secondary-reflection` path | stress `.0756`; restrained 7% gradient with stop maxima `.18/.06` | normal | full nail; Glitter-specific multiplier | after |
| 10 | material `top-coat` path | stress stroke opacity `.391`; width `1.2` | normal | nail outline; Glitter-specific multiplier | after |
| 11 | Hero effect overlays | **none** for Glitter | n/a | Glitter maps to one-layer Solid, and `slice(1)` is empty | after |
| 12 | Hero depth path | outer opacity `1`, bottom gradient stop about `.332` | normal black | full nail; shared | after |
| 13 | Hero apex path | center stop about `.399`, 58% radial radius | `screen` | full nail; shared and unattenuated for Glitter | after |
| 14 | Hero primary path | peak stop about `.442`, full height and 42%–62% band | `screen` | full nail; shared and unattenuated for Glitter | after |
| 15 | Hero edge path | edge peak about `.283` (far edge `.204`) | `screen` | full nail; shared and unattenuated for Glitter | after |

The approximate Hero values use default soft-gel material, white unit-intensity
lighting, Glitter shine `.82`, and the Hero Solid profile. **Yes: layers rendered
after Glitter reintroduce the broad gray central highlight.** The apex and
primary screen layers are the decisive sources.

## 8. Dedicated route verification

The deployed Studio uses `client/src/DesignStudio.jsx`, which re-exports
`nail-design-studio/NailDesignStudio.jsx`; that component imports `MaterialLayers`
from the same directory. `MaterialLayers` selects `GlitterLayers` only on the
case-sensitive `finish === 'Glitter'` branch. The returned root is marked
`data-material-profile="GlitterMaterial"` and contains the entire pigment,
particle, reflection, and top-coat stack. The early return prevents the generic
Cream/default branch from also rendering. There is no material fallback for
Glitter and no simultaneous Solid/Cream material body.

“Solid” exists only at the downstream Hero-effect level because Glitter is
aliased to Solid for schema compatibility. Its first color layer is already
owned by `MaterialLayers`, so `appliedEffect.layers.slice(1)` paints no duplicate
body. Shared Hero Lighting still paints afterward.

## 9. Expected versus actual stage DOM/SVG particle counts

The particle function allocates the final count directly; there is no later
slice, conditional hiding, memoized stale field, group opacity, or duplicate
React key. Each record becomes exactly one `<ellipse>` in exactly one depth
group.

| Density | Expected per stage nail | Actual `<ellipse>` count per stage nail |
|---:|---:|---:|
| 0% | 0 | 0 |
| 25% | 500 | 500 |
| 50% | 1,000 | 1,000 |
| 75% | 1,500 | 1,500 |
| 100% | 2,000 | 2,000 |

At 100%, the deterministic stress field divides into 1,349 embedded, 611
surface, and 40 specular records. The complete Single Nail Studio DOM also has
an active polish swatch with its own field, so an indiscriminate document-wide
ellipse query sees 4,000 at 100%; the stage nail itself has 2,000. In Full Set,
there can be up to ten independent 2,000-element stage fields plus the swatch.
This is a DOM/performance concern, not evidence that the live nail missed the
new reservoir.

## 10. Renderer units to visible pixels

The default Almond geometry is 176 × 290 renderer units. Its padded viewBox is
approximately `24.96 20.96 190.08 304.08`. The Single Nail CSS allows a 240 ×
360 CSS-pixel SVG. With `preserveAspectRatio="xMidYMid meet"`, the limiting scale
at that maximum is approximately **1.184 CSS px per renderer unit** (and less in
a constrained window).

The micro radii `.10–.32` therefore produce major-axis diameters of only
**`.237–.758 CSS px`** at the maximum normal Single Nail size. Squash `.42–1.10`
makes many minor-axis diameters smaller still (`.099–.834 px`, depending on both
radius and squash). At Full Set's 126 × 189 maximum footprint, the approximate
scale is `.622 px/unit`, giving micro major diameters of **`.124–.398 px`**.

Thus most (90%) records are subpixel even in the Founder-reviewed Single Nail
view. Their aggregate can create texture, but individual flecks are generally
not resolvable at normal zoom; increasing their number principally changes
antialiased coverage.

## 11. Effective particle opacity

There is no material-group, nail-group, particle-group, or CSS opacity. The base
polish opacity is a sibling-path opacity rather than an ancestor opacity.
Consequently nominal alpha is also pre-filter effective alpha:

- embedded: `.24–.54 × 1 × 1 = .24–.54`, then spatially diluted by the `.24`
  Gaussian blur and subpixel rasterization;
- surface-near: `.46–.82`;
- specular: `.82–.98`, additionally shaped by the radial fleck/white fill.

The embedded majority is not suppressed by ancestor alpha, but its very small
area plus blur distributes its coverage across pixels. That makes much of it
perceptually weak despite a nontrivial nominal opacity.

## 12. Mask/clip survival estimate

The generator samples the fixed rectangle `x=48–192`, `y=20–346`, while the
default nail occupies approximately `x=32–208`, `y=28–318` and narrows strongly
at cuticle and tip. The clip path is the exact same nail path used by the body;
there is no additional safe-margin mask or aggressive nested clip.

Sampling the deterministic black/white 100% field against the Almond width
profile estimates **about 1,434 of 2,000 (71.7%)** centers survive: approximately
971 embedded, 431 surface, and 32 specular. About 566 are discarded, primarily
above/below the nail and beside the tapered tip/cuticle. This estimate uses the
approved profile interpolation rather than browser pixel coverage at ellipse
edges, so it should be treated as approximately ±a few percent. The nominal
reservoir overstates visible population by about 28% for the default Almond.

## 13–14. Highlight inventory and dominant source

Highlight-producing Glitter layers are: the weak white part of curvature;
`.025` white material diffusion; flecks (especially the 1.5% specular depth);
the restrained primary and secondary material reflections; the white top-coat
rim; and the shared Hero apex, primary, and edge screen overlays.

The dominant broad gray-center source is the **shared Hero primary plus Hero
apex overlap**, not the MAT-F05C material reflection. Glitter maps to Hero Solid,
but `stageLightingOpacity` special-cases Cream, Jelly, and Matte only. Glitter
falls through to the raw Hero values (about `.442` primary and `.399` apex),
roughly an order of magnitude above the Cream-attenuated equivalents (about
`.036` and `.045` at the same `.82` shine). Screen compositing those broad white
fields over black necessarily lifts the center toward gray.

MAT-F05C reduced a **secondary/local material highlight**. It did not reduce the
dominant post-material Hero overlay. This reproduces the same ownership failure
previously documented and corrected for Cream in MAT-F02.

## 15. Cream versus Glitter final stack

Both use the same approved neutral Cream pigment/curvature/edge foundation and
both have no extra Hero effect layers because each maps to a one-layer Solid
effect. Differences are:

- Glitter inserts embedded, surface, and specular particle groups after
  diffusion.
- Glitter applies its own `.58/.62/.84` multipliers and narrower gradients to
  material primary reflection, secondary reflection, and top coat.
- Cream uses the full Cream gloss response and no particles.
- Critically, Cream receives finish-specific Hero attenuation and achromatic
  color coercion; Glitter receives configured Hero colors and **unattenuated**
  raw Solid Hero lighting.

Glitter therefore truly uses Cream's material foundation, but it also receives
an unrelated generic post-material light rig that Cream no longer receives at
full strength.

## 16. Single Nail versus Full Set

Both contexts are generated by the same `visibleNails.map` in
`NailDesignStudio`, with the same SVG, viewBox, `MaterialLayers` call, Glitter
branch, effect overlay loop, and Hero lighting paths. There is no Single-only or
Full-Set-only overlay. The active nail reads live formulation state; inactive
nails prefer applied per-nail copies, which is an intentional state-source
difference rather than a renderer difference.

The wrappers differ only through composition CSS/grid density. Single Nail can
reach 240 × 360 CSS px; Full Set caps nails around 126 × 189 CSS px. Accordingly,
the same renderer output is substantially smaller—and its micro particles less
perceptible—in Full Set. Founder Single Nail review does use the largest live
render path.

## 17. Duplicate and legacy renderer/build search

- There is one live `MaterialLayers`/GlitterMaterial implementation:
  `client/src/nail-design-studio/MaterialRenderer.jsx`.
- `client/src/DesignStudio.jsx` is only a re-export of the live
  `NailDesignStudio`; the app route reaches it through the normal client entry.
- `client/src/design-studio/PolishRenderer.jsx` is a separate legacy/shared
  renderer with `GlitterParticleField`, and that directory also uses
  `sparkleDensity` rather than `glitterDensity`. It is used by older design
  canvas/thumbnail/full-set components, but not by the Nail Desk Studio route
  audited here.
- `client/src/design-studio/DesignStudio.jsx` is another older Studio component,
  but it is not the exported `client/src/DesignStudio.jsx` entry used by the
  current route.
- `GlitterMaterial` is a profile marker/name for the private `GlitterLayers`
  function, not a second component definition. No alternate import shadows it.
- MAT-F05C commit `7ef544c` modified the sole live Nail Desk
  `MaterialRenderer.jsx` and its tests. The normal client build therefore
  includes those changes; this is not dead implementation or an old bundle
  entry-point issue.

## 18. Ranked root causes

1. **Very high confidence — dominant post-material light is untouched.** Glitter
   misses the Cream/Jelly/Matte `stageLightingOpacity` branches, so broad raw
   Solid apex/primary screen layers cover the calibrated material afterward.
2. **High confidence — 90% micro population is subpixel.** At normal Single Nail
   size, micro diameters are only `.237–.758 px` before squash; count increases
   mostly alter antialiased texture rather than resolved flecks.
3. **High confidence — reservoir count overstates visible count.** Roughly 28%
   of generated centers fall outside the default Almond path.
4. **Medium confidence — blur and subpixel coverage weaken the embedded 68%.**
   Their alpha is not ancestor-suppressed, but `.24` blur spreads already tiny
   ellipses.
5. **Low confidence — deployment staleness.** Source/import/history checks show
   MAT-F05C is on the sole live Nail Desk route; only an external cache/CDN or a
   deployment built before `fb6b37b` could explain stale pixels.

## 19. Recommended MAT-F05E correction plan

1. Establish explicit final-stack ownership for Glitter: add a Glitter-specific
   Hero surface response (or intentionally reuse the approved Cream ambient
   response) so the shared apex/primary/edge rig cannot overwhelm
   `GlitterLayers`. Lock exact post-material opacities in a Studio integration
   test, not only a MaterialRenderer test.
2. Add permanent nonvisual stage diagnostics (`data-render-finish`, particle
   counts by depth, and final lighting opacities) or test helpers so future
   calibration proves both local material and downstream values.
3. Add browser-level visual/structural checks at actual Single Nail dimensions:
   assert the Glitter route, 2,000 stage ellipses, computed SVG bounds, and final
   overlay ordering in one test.
4. Decide particle perceptibility only in MAT-F05E visual calibration. Measure
   raster coverage at 240 × 360 and representative responsive widths before
   changing size distribution, blur, alpha, count, or generator bounds.
5. If calibration then warrants it, generate within the nail silhouette (or use
   rejection sampling) so density describes surviving particles. Treat that as
   a deliberate density semantics change with snapshots/performance budgets.
6. Verify the built artifact/deployment commit SHA and invalidate external cache
   before Founder review.

## 20. Audit constraint

**No visual calibration was performed during this audit.**
