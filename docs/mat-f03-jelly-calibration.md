# MAT-F03 Jelly material calibration

## Reference used

Founder-approved Jelly Material Reference Board:
`docs/references/materials/jelly/jelly-material-reference-board.png`

Added to main separately through PR #273.

Treated as a read-only visual reference and not modified by MAT-F03.

## Rendering path recorded before calibration

The Nail Desk normalizes persisted and edited formulations in `polishFinish.js`.
`NailDesignStudio` passes the active finish, selected color, opacity, shine, and
the canonical shape path to `MaterialLayers`. The centralized material router in
`MaterialRenderer.jsx` sends only `Jelly` through the MAT-F01 feature boundary to
`HybridJellyMaterial`; a failed hybrid render retains the legacy Jelly fallback.
The hybrid renderer reuses the supplied shape as its clip mask and composites,
in order, pigment, curvature, apex transmission, edge depth, internal colored
transmission, surface reflection, and pigment-free top coat. Hero lighting is
then applied by the existing stage composition. No geometry or saved-design
contract participates in the material calibration.

Before modification, Cream, Matte, Glass, and Chrome-ready defaults and their
rendered routing markers were recorded in the material test. Cream and Matte use
the shared non-Jelly renderer, while Glass and Chrome-ready remain distinct
persisted contracts and never enter the hybrid Jelly boundary.

## Root cause

The prior hybrid layers compounded a 74–92% pigment body with a 46–64% colored
transmission overlay. In practice that composite approached opaque coverage even
though its controls were named for transmission. At the same time, very dark
side gradients and a narrow linear tinted reflection created an outlined,
occasionally metallic read. A uniform white perimeter stroke further described
the SVG boundary rather than a clear gel surface.

## Calibration

Jelly now uses a 48–62% hue-locked pigment body and a separate 18–28% colored
transmission contribution. The lighter central tone remains in the selected hue
family, so transmitted light does not bleach the polish toward white. Sidewall
and free-edge absorption are softer and begin farther out, retaining curvature
without a vignette. The old linear band and perimeter stroke are replaced by two
low-energy, elliptical achromatic clear-coat reflections that follow the curved
surface without tinting the pigment or suggesting metal.

All changes are confined to the existing Jelly hybrid renderer and its focused
contract/regression tests. Shared renderer constants, protected finish presets,
shape paths, masks, nail sizing, controls, persistence, and application systems
are unchanged.

MAT-F03 creates no screenshots, visual-regression images, or other binary assets.
