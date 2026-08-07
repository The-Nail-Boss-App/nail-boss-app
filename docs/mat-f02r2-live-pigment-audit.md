# MAT-F02R2 live pigment state audit

## Source-to-render chain

The Design Studio Polish Color picker and Polish HEX input both call
`patchActivePolish({ colorHex })`. The established behavior is live preview:
`patchActivePolish` updates the visible draft and immediately calls `updateBase`.
`updateBase` passes the patch to `synchronizeBase`, which writes the normalized
color to both the active nail's legacy `baseColorHex` and its authoritative base
layer `data.colorHex`.

`DesignStudio` passes that active nail and its layers to `NailCanvas`.
`NailCanvas` selects the base layer and passes it to `PolishSurface` (the
`GelNailSurfaceRenderer` alias). The renderer calls
`resolvePolishDataForRender` with the base-layer data first and the legacy nail
color only as a fallback. It then sends the resolved color to `resolvePigment`,
whose `baseColor` is used by the `base-pigment` SVG path's `fill`.

## Failure point and correction

The failure occurred in `patchActivePolish`. It updated React draft state with
the new picker value, but built the synchronous base-layer patch using
`draftPolish.colorHex` from the previous render. `polishPatchFromDraft` then made
that stale argument authoritative, overwriting the new color included in the
properties object. Thus the panel could display its new draft while the nail
document and renderer retained the prior/default pink.

The correction constructs one `nextDraft` snapshot and uses its color for both
the control state and active-base update. This preserves the existing live
preview workflow; no new apply step or material behavior is introduced.

## Default and fallback classification

- `POLISH_DEFAULTS.colorHex` and `polishDefaultsForType`'s `#E8A0BF` are
  legitimate initialization defaults for a new formulation.
- Stored-rack parsing uses an item's explicit color before `#E8A0BF`; this is a
  safe missing-data fallback for malformed/legacy rack entries.
- `resolvePolishDataForRender(baseLayer.data, nail.baseColorHex || "#E8A0BF")`
  is safe because `normalizePolishData` accepts a valid explicit layer color
  before consulting its fallback.
- The stale value passed by `patchActivePolish` was the runtime override: it
  replaced an explicit current picker/HEX value before the renderer received
  it. That is the only precedence defect corrected in this sprint.

Saved-design hydration continues through `ensureFullSetBlueprint`, which
preserves valid stored base-layer colors. Legacy documents without an explicit
layer color continue to use the stored nail color and, only if that is absent,
the default polish color.
