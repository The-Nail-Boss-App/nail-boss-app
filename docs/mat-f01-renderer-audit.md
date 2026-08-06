# MAT-F01 renderer audit

## Protected baseline

Before MAT-F01, `MaterialLayers` rendered Cream, Matte, and Glitter through the
same legacy profile pipeline. Cream uses an opaque pigment and glossy top coat;
Matte uses the legacy diffuse/grain treatment; Glitter adds the existing fixed
particle field. MAT-F01 does not change those profiles or their branch.

The Design Studio supplies the artist-approved path from the existing surface
engine. Shape geometry, length, width, placement, color selection, HEX editing,
Apply Polish, undo/redo state, and saved-design hydration remain outside the
material renderer and are unchanged.

## Hybrid Jelly boundary

Only the `Jelly` finish is eligible for the `materials.hybridJellyRenderer`
release switch. The hybrid component receives the existing path, color,
opacity/transmission control, unique nail id, and existing base SVG props. It
creates normalized, per-instance SVG definitions and clips all layers to the
provided shape mask.

The ordered layers are shape mask, selected-color base pigment, hue-derived
curvature shadow, tinted apex highlight, same-family edge depth, colored light
transmission, narrow tinted reflection, and pigment-free clear top coat. Jelly
has no texture layer. Definitions are static and declarative: there is no
animation, per-frame work, WebGL, or unique raster asset generation.

The legacy Jelly component remains in `MaterialRenderer`. If hybrid composition
throws, the routing boundary logs an observable development warning and returns
the legacy Jelly output; other finishes never enter this boundary.
