# MAT-F02 — Production Cream Material Calibration

## 1. Reference-board observations

The approved board was inspected before implementation. Across nude, pink, red, white, burgundy, brown, navy, taupe, coral, and black, the polish body is dense and even: hue belongs to the pigment rather than to the light. Form comes from gradual sidewall rolloff and a gentle apex, not a bright center column. The clearest common surface cue is a narrow, soft-edged, vertically elongated, slightly asymmetric white reflection. Small secondary reflections and a fine bright rim make that reflection appear above the color as clear coat. Dark samples preserve black/navy/burgundy around the highlight; white preserves a hierarchy between body, apex, rim, and reflection without becoming gray.

## 2. Current production baseline

The canonical renderer already received the selected color and kept Cream opaque and achromatic. Its prior response nevertheless combined a full-height linear reflection (`.78` profile strength), strong side edges (`.34`), and curvature shading (`.32`). The stage then drew Hero apex, primary, and edge lighting above those layers. On dark pigment, this stacked into a broad bright center between heavily darkened sides.

## 3. Cause of the metallic appearance

The local reflection was a lateral linear gradient with no vertical falloff, so it behaved like a body-wide cylinder highlight rather than a reflection on clear coat. Strong sidewall multiplication reinforced the symmetric dark → bright → dark reading. Hero Lighting legitimately supplied environmental form, but its primary/apex response overlapped the already dominant local band. The problem was therefore overlapping ownership, not pigment.

## 4. MaterialRenderer reflection findings

Cream now uses a narrow elliptical radial reflection centered left of the apex. It fades both laterally and vertically, so it cannot become a full-height chrome beam. A much weaker, offset secondary ellipse supplies environmental asymmetry. These are Cream-only definitions; other finish gradients and Jelly's hybrid route are untouched.

## 5. Hero Lighting findings

The Hero engine already consumes `shine` continuously when calculating specular and reflection profiles. Its stage apex, primary, edge, and depth layers remain responsible for broad achromatic environmental illumination and dimensional form. MAT-F02 leaves the shared Hero engine and non-Cream lighting behavior unchanged; reducing and reshaping Cream's duplicate local band lets the two systems complement instead of imitate one another.

## 6. Final ownership model

- **Pigment:** a uniform, fully opaque selected color.
- **Cream material:** a smooth cured surface with gentle apex and sidewall curvature.
- **MaterialRenderer reflection / clear coat:** narrow local specular reflection, subtle secondary response, and fine rim.
- **Hero Lighting:** larger environmental apex, primary, edge, and depth illumination.
- **Shine:** continuous strength control for both the existing Hero response and the local Cream clear coat.

No texture, grain, color-specific branch, or transmission was introduced.

## 7. Cream profile before / after

| Parameter | Before | After | Visual purpose |
| --- | ---: | ---: | --- |
| opacity | 1 | 1 | Preserve dense coverage. |
| edge | .34 | .18 | Preserve edge pigment and remove the black sidewall tunnel. |
| curvature | .32 | .20 | Retain convex form without a computational body gradient. |
| reflection | .78 | .62 | Record the maximum calibrated local clear-coat range; runtime Shine supplies the actual response. |
| topCoat | .44 | .50 | Record the maximum rim response; runtime Shine keeps it controlled. |
| diffuse | .08 | .02 | Prevent milky desaturation, especially on dark and saturated pigments. |
| grain / transmission | 0 / 0 | 0 / 0 | Keep Cream smooth and fully opaque. |

## 8. Reflection before / after

Before: a symmetric, full-height linear white band peaking at 86% internal stop opacity and `.78` layer opacity. After: a soft elliptical primary reflection with vertical falloff, a weaker offset secondary reflection, and runtime primary intensity from `.28` to `.62`. Pigment remains visible beneath and around both highlights.

## 9. Edge / curvature before / after

The edge layer was reduced from `.34` to `.18`, while its Cream-specific internal stop opacities fell from `.72/.64` to `.34/.30`. Its transparent center is wider, yielding modest sidewall rolloff rather than black vignette. Curvature fell from `.32` to `.20`; the apex is gentler and the terminal shadow stop fell from `.24` to `.10`. Geometry and masks were not changed.

## 10. Shine mapping

`Shine` enters the Hero effect parameters, is exposed by `appliedEffect.shine`, and reaches Hero Lighting's continuous specular/reflection calculation. The stage now also passes that value to canonical `MaterialLayers` (including each stored nail's own formulation). Cream maps clamped Shine `s` as follows:

- local primary reflection: `0.28 + 0.34s`
- local secondary reflection: `0.08 + 0.12s`
- clear-coat rim: `0.24 + 0.26s`

Thus 0, 25, 50, 75, and 100% are strictly monotonic. Zero retains a restrained clear coat and cannot become Matte. Viscosity continues through the effect contract but has no intentional Cream surface behavior; visual viscosity is deferred rather than invented here.

## 11. Color-range verification

Canonical renderer tests exercise `#0D0D0D`, `#FFFFFF`, `#991435`, `#07152F`, and `#E8A0BF`. Cream's pigment gradient uses the selected color at every stop, optical tokens remain only black/white, diffusion is restrained to `.02`, opacity is 1, and transmission is 0. This keeps black near-black, white white but dimensional, burgundy rich, navy deep, and pink recognizable without HEX-specific logic.

## 12. Protected-material verification

Matte and Glitter profile objects remain byte-for-byte unchanged. Jelly still routes exclusively through `HybridJellyMaterial`; its transmission, layer order, and clear top coat are covered by the canonical tests. Non-Cream reflection definitions and configured Hero environmental colors are unchanged. No legacy `client/src/design-studio/` material code was modified.

## 13. Remaining limitations

DOM assertions prove layer ownership, routing, pigment tokens, opacity/transmission, and monotonic Shine behavior, but not photographic parity. Browser screenshots provide only local visual evidence; founder review of the deployed renderer against the approved board remains final acceptance. Viscosity remains a later intentional material-behavior task.

## 14. Post-merge clear-coat correction

The first MAT-F02 pass removed the original full-height MaterialRenderer stripe, but production QA showed that black still read as a broad gray cylinder. A complete compositing audit isolated the remaining cause: MaterialRenderer's white curvature contributed at most `.18 × .20 = .036` before gradient falloff, while its primary reflection was bounded to an ellipse; the Hero stage then added a 58%-radius apex, a full-height 42%–62% primary band, and two screen-blended edge responses above the entire material. At Shine 68%, those three Hero layers overlapped the local reflection. Screen blending made their opacity stacking body-whitening rather than clear-coat sparkle. The Hero primary/apex combination—not a pigment defect—was the dominant remaining gray band.

The correction preserves the selected pigment gradient exactly and changes Cream-only optical composition. MaterialRenderer now owns the obvious clear-coat reflection. Hero Lighting retains a faint environmental apex, primary response, and rim, but the stage attenuates those layers only when the interface finish is Cream. Non-Cream Hero colors, geometry, masks, lighting-engine profiles, and blend modes are unchanged.

### Corrected reflection hierarchy

| Parameter | Merged MAT-F02 | Corrected value | Purpose |
| --- | ---: | ---: | --- |
| Primary width | 42% transform | 18% transform | Concentrate brightness on the top surface rather than across the body. |
| Primary center | 35% | 39% | Stay visibly off-center while following the upper/mid apex. |
| Primary vertical scale | 100% | 92% | Preserve elongation with a natural terminal fade. |
| Primary layer range | `.28–.62` | `.24–.66` | Make low Shine restrained while allowing a crisp salon highlight at high Shine. |
| Secondary width / center | 25% / 72% | 9% / 73% | Break symmetry without introducing a decorative second stripe. |
| Secondary layer range | `.08–.20` | `.04–.14` | Keep the environmental reflection substantially weaker than primary. |
| Clear-coat rim range | `.24–.50` | `.22–.52` | Retain a fine transparent-surface cue without broad fill. |

The primary is an 18%-wide asymmetric elliptical radial gradient at `cx=39%`, strongest in the upper/mid region and fading in both axes. The secondary is a 9%-wide response at `cx=73%`, with lower stop and layer opacity. Placement is deterministic and pigment-independent.

### Body and sidewall correction

Cream curvature changed from `.20` to `.16`; its white apex stop changed from `.18` to `.08`, the low-level body stop from `.035` to `.015`, and the terminal shadow from `.10` to `.08`. Edge strength changed from `.18` to `.14`. Left/right internal edge stops changed from `.34/.30` to `.22/.16`, with transparent pigment extending from 10% through 90%. This modest, intentionally unequal rolloff keeps convex form without equal dark rails or a tubular silhouette. Diffusion changed from `.02` to `.01`. Pigment opacity, color stops, and transmission remain `1`, the selected HEX at every pigment stop, and `0`, respectively.

### Corrected Shine mapping and Hero restraint

For clamped Shine `s`, Cream now uses:

- primary clear-coat reflection: `.24 + .42s`
- secondary clear-coat reflection: `.04 + .10s`
- clear-coat rim: `.22 + .30s`
- Hero apex multiplier: `.08 + .04s`
- Hero primary multiplier: `.04 + .05s`
- Hero edge multiplier: `.10 + .05s`

All responses are monotonic at 0%, 25%, 50%, 68%, 75%, and 100%. Shine changes only the surface-response opacities; it never enters `MaterialDefs` pigment colors. At 0%, Cream retains a restrained primary, secondary, and rim rather than adopting Matte grain/diffusion. At 100%, the highlight strengthens but remains an 18%-wide faded ellipse rather than Chrome's body-wide beam.

### Remaining visual limitations after correction

SVG gradients approximate a photographic studio softbox and cannot model refraction, Fresnel response, or micro-surface scattering. The single deterministic setup also cannot reproduce every reflection shown across the reference board. Automated contracts can lock width, placement, hierarchy, pigment ownership, finish isolation, and Shine progression; final perceptual approval still requires browser/deployed comparison at Cream, `#000000`, opacity 100%, Shine 68%.
