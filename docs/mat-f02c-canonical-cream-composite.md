# MAT-F02C — Canonical Cream composite

## Reference-board calibration

The approved board demonstrates that Cream is a dense, evenly opaque polish whose pigment remains recognizable from jet black through navy, burgundy, pink, and white. Curvature is carried by restrained darkening and clear white reflections: the surface is dimensional and high-gloss, but the illumination does not supply the pigment hue. The board is a calibration reference only and is not loaded at runtime.

## Previous production composite audit

Inside `svg[data-testid="stage-nail"]`, the old ordered stack was:

| Order | Layer and source | Paint / opacity / blend | Audit finding |
| --- | --- | --- | --- |
| 1 | `MaterialLayers` base pigment, `MaterialRenderer.jsx` | selected color to 66%, then fixed `#170812`; profile opacity | The fixed plum edge changed hue, especially for black, navy, and white. |
| 2 | Material curvature | white-to-black gradient; Cream opacity `.32`; normal | Achromatic and dimensional, but can brighten/darken. |
| 3 | Material edges | fixed `#130710`; Cream opacity `.34`; normal | Plum-black contamination duplicated depth shading. |
| 4 | Material diffusion | fixed pink-white `#f5edf2`; opacity `.08`; normal | Washed dark pigment toward pink-gray. |
| 5 | Material reflection and top coat | white; `.78` reflection and `.44` stroke; normal | Achromatic gloss; retained. |
| 6 | Hero Effect layers after material, `NailDesignStudio.jsx` / `hero-design/effect.ts` | `appliedEffect.layers.slice(1)` | Solid (canonical Cream) has one color layer, already owned by `MaterialRenderer`, so the slice paints zero duplicate overlays. Other finishes keep their extra effect layers. |
| 7 | Hero depth | black vertical gradient; lighting-derived opacity; normal | Achromatic depth; retained. |
| 8 | Hero apex | lighting color; screen | Could wash out dark pigment and could recolor it if a chromatic environment were supplied. |
| 9 | Hero primary reflection | lighting color; screen | Same risk; duplicates gloss illumination, but adds the richer stage environment. |
| 10 | Hero edge reflection | lighting color; screen | Same risk; supplies sidewall/environment response. |

Unused shared definitions also contained `#200914` transmission and `#190a14` grain. Cream did not paint transmission or grain, but its generic definition still carried those chromatic tokens. Cream now resolves those definitions to pigment-derived or achromatic values so its SVG contract contains no hidden plum/pink optical colors.

## Final ownership and layer order

`MaterialRenderer` owns the selected, opaque Cream pigment. Its pigment gradient repeats the selected color at every stop. Neutral black edge depth, achromatic white/black curvature, a restrained 2.5% maximum white diffusion, white material reflection, and a white clear-coat stroke then describe the cured surface. This is followed by zero Solid/Cream Hero Effect overlays.

Hero Lighting remains in place in the order depth, apex, primary reflection, and edge reflection. Depth is black; the three screen-blended illuminants are explicitly neutral white on the production stage. Thus lighting can change brightness and reveal form but cannot move the pigment into a pink/mauve family. Test-visible metadata records the input/base pigment, optical model, stage lighting model, and overlay count.

The resulting ownership is: pigment owns hue and saturation; `MaterialRenderer` owns material curvature and clear-coat gloss; Hero Effect owns only non-duplicative design effects; Hero Lighting owns achromatic environmental illumination and depth. Jelly continues through its isolated hybrid renderer, while Matte and Glitter retain their existing profiles and routing.

Shine already reaches the Hero Lighting profile. No separate Shine architecture or state-management change was introduced.
