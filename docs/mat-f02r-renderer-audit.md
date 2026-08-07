# MAT-F02R renderer audit

## Reference-board observations

The Cream calibration board shows opaque, even pigment from white through red,
navy, burgundy, and black. Form comes from restrained neutral edge falloff and
bright, narrow environment reflections. Dark pigments retain deep chroma or true
black between highlights; light pigments retain their hue while soft gray edge
depth keeps the nail curved. The clear coat reads as a distinct glossy surface,
not a colored veil.

## Active rendering path

`resolvePolishDataForRender` normalizes the selected color and finish.
`resolvePigment` preserves that color as the base pigment. `GelNailSurfaceRenderer`
then composites the material preset's optional transmission, the shared curvature,
illumination, reflection, and top-coat layers, followed by neutral outline catches.
For Cream, the preset remains fully opaque and non-transmissive, so only the
layers above the base pigment can change its perceived color.

The hue-contaminating generic values were `#2b1024`, `#160812`, `#120712`,
`#321028`, `#3b1f35`, `#1a0815`, and `#0f0610`. They occurred in body,
sidewall, curvature, cuticle, top-coat depth, free-edge depth/rim, bottom depth,
thickness, and sidewall-shadow layers. The final generic outline also used
`rgba(59,31,53,.26)`.

## Correction strategy

Generic direct light and reflections use white; generic occlusion and depth use
black. Existing gradient geometry, stop opacity, blur, and material-strength
modulation remain responsible for three-dimensional form, rather than replacing
all shading with one flat gray. Chrome's iridescent sweep, warm glitter particles,
and Milky's explicit diffusion veil remain material-specific and are not generic
lighting.

Cream's previous optical response was `.55 + shine * .45`, while `gloss` was
floored by `.90` smoothness. It is now `.30 + shine * .70` for reflection,
specular/apex, and clear-coat intensity, with `gloss` following Shine directly.
Cream's `.90` physical smoothness and low roughness are unchanged, preserving a
smooth sharp-highlight surface even at low visible Shine. No material preset was
retuned.
