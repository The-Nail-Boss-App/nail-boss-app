# MAT-AUDIT-02 — SVG CSS presentation audit

## Conclusion

**Yes. The browser styling layer was overriding the correctly rendered Cream pigment.** The canonical base-pigment path carried `fill="url(#hero-material-0-pigment)"`, but the same path also received the `nail-design-studio__nail-polish` class. `NailDesignStudio.css` declared `fill: #e990b1` on that class. An author CSS property wins over the equivalent SVG presentation attribute, so the browser painted a fixed pale pink instead of the selected pigment paint server. The rule also added a plum stroke to the pigment path.

The correction removes that obsolete paint rule. No branding colors, renderer calculations, material profiles, Hero effects, lighting, state handoff, geometry, layout, or legacy studio files were changed.

## 1. Stylesheets audited

- `client/src/nail-design-studio/NailDesignStudio.css`, directly imported by the mounted canonical `NailDesignStudio.jsx`.
- The application entry and shell (`client/src/index.jsx`, `client/src/App.jsx`, `client/src/styles.js`) were checked for global stylesheet imports and inline ancestor styling. They do not load a global CSS rule that targets the canonical stage SVG or its paths.
- Shared modules imported by the canonical studio were searched. `PolishBottle` renders separate controls and does not wrap the stage. No stylesheet from `client/src/design-studio/` is imported into the canonical stage path.
- A repository-wide CSS selector search found no other stylesheet targeting the canonical stage class names or its material/design data attributes.

## 2. Relevant selectors

| Selector | Relevant presentation behavior |
| --- | --- |
| `.nail-design-studio` | Supplies interface colors/background and `color`; no `fill`, `stroke`, filter, blend mode, mask, or clip path. |
| `.nail-design-studio__desk-surface` | Workspace background image, border, radius, and overflow only. |
| `.nail-design-studio__nail-stage` | Layout transform for pan/zoom only. |
| `.nail-design-studio__nail-slot` | Button layout; selected/active variants paint an outline/border outside the SVG. |
| `.nail-design-studio__hero-nail` | SVG sizing/aspect ratio/overflow only. |
| `.nail-design-studio__nail-polish` (before correction) | **Set fixed `fill: #e990b1`, `stroke: rgba(85,35,64,.55)`, and `stroke-width: 1.5` on the base-pigment path.** |
| `.nail-design-studio__command-button svg` and tool/panel SVG rules | Scoped to interface icons and cannot select the stage nail. |
| `svg`, `path`, `[data-material-layer]`, `[data-design-layer]`, `[data-hero-material-layer]` | No unscoped or data-attribute CSS rule reaches these elements. |

No relevant selector uses `currentColor`, `color-mix()`, a CSS paint variable, `mask`, `clip-path`, `box-shadow`, `drop-shadow`, `filter`, `mix-blend-mode`, or `isolation` on the nail. The SVG markup intentionally uses paint-server fills, clipping/material structure, and `screen` blend modes on Hero lighting overlays; those are markup styles rather than external CSS overrides.

## 3. Nail-affecting properties found

The defect was localized to the former `.nail-design-studio__nail-polish` rule. The class is passed through `baseProps`, so it is attached specifically to `[data-material-layer="base-pigment"]`. Its CSS `fill` replaced the paint-server presentation attribute. Its CSS stroke additionally put a plum contour on a path for which the material renderer specifies no stroke.

The stage transform is intentional pan/zoom geometry and does not change pixels by hue. The workspace background remains behind the SVG. Selected/active slot borders remain outside the SVG and are intentional branding.

## 4. Pink/plum tokens found

- `#e990b1` and `rgba(85,35,64,.55)` were the defect: both directly reached the base-pigment path through `.nail-design-studio__nail-polish`.
- `#D94C70` remains a formulation/default and invalid-input fallback in JavaScript. It is data, not CSS inheritance; valid `#000000` bypasses it.
- `#f5edf2` remains the non-Cream material-diffusion color. Cream explicitly selects achromatic `#FFFFFF`, so it cannot tint Cream.
- `#4a203b`, `#ff2da0`, and related pink/plum values remain on interface text, controls, focus rings, selected-slot outlines, borders, backgrounds, and shadows. Their selectors do not match or overlay the stage SVG.
- `#E8A0BF` occurs in tests and legacy/default data, but no canonical CSS rule propagates it to a stage path.

## 5. Presentation attribute versus computed style

For Cream `#000000`, the mounted production SVG reports `data-render-color="#000000"`, and the base path reports `fill="url(#hero-material-0-pigment)"`. Before correction, browser cascade rules dictate that the author CSS `fill: #e990b1` wins over that presentation attribute. After correction, no matching author CSS declares `fill`, so a real browser resolves the base path to its paint server.

The focused regression test mounts the real `NailDesignStudio`, edits the real control to Cream `#000000` at its default 100% opacity, and calls `getComputedStyle` for base pigment, curvature shadow, edge darkening, material diffusion, reflection, top coat, and every stage ancestor. It also verifies the base fill attribute and checks that no computed layer contains the known fixed pink/plum paints.

### jsdom limitation

Jest's jsdom does **not** resolve SVG presentation attributes or `url(#paint-server)` values into computed CSS: after the external override is removed, `getComputedStyle(base).fill` is an empty string rather than the path's `url(...)` attribute. It similarly omits several SVG defaults. The test does not invent a computed paint-server value; it explicitly records that limitation while still using the real CSS cascade to detect an author override. The narrow runtime verification in browser DevTools is:

```js
const base = document.querySelector('svg[data-testid="stage-nail"] [data-material-layer="base-pigment"]');
({
  attributeFill: base.getAttribute('fill'),
  computedFill: getComputedStyle(base).fill,
  opacity: getComputedStyle(base).opacity,
  filter: getComputedStyle(base).filter,
  mixBlendMode: getComputedStyle(base).mixBlendMode,
});
```

Expected in a real browser: the attribute and computed fill reference `hero-material-0-pigment`, opacity is `1`, filter is `none`, and blend mode is `normal`.

## 6. Parent filter findings

The audited ancestor chain is stage SVG → `.nail-design-studio__nail-slot` → `.nail-design-studio__nail-stage` → `.nail-design-studio__desk-surface`. None declares `filter`, `opacity`, `mix-blend-mode`, or `backdrop-filter`. The root supplies an inherited text `color`, but the stage material does not use `currentColor`. No ancestor tinting filter exists. `isolation: isolate` occurs on the command bar, which is a sibling outside the stage ancestor chain.

## 7. Pseudo-element findings

Mandatory `::before`/`::after` review found no pseudo-element rule for `.nail-design-studio__hero-nail`, `.nail-design-studio__nail-slot`, or `.nail-design-studio__nail-stage`. Therefore no translucent overlay is painted above the nail. Existing pseudo-elements belong to command/interface controls outside the stage chain.

## 8. Root cause

The base path class was a remnant of a flat-color implementation. The modern material renderer correctly supplies a gradient paint server as an SVG presentation attribute, but the old class selector had higher cascade precedence and forced pale pink on every base pigment, independent of selected HEX.

## 9. Exact correction

Removed only the `.nail-design-studio__nail-polish` CSS block containing the fixed fill, plum stroke, stroke width, and vector effect. The renderer's own SVG attributes now own pigment and outline presentation.

## 10. Why the correction is safe

- The selector is only attached to the canonical material base path.
- Material paint remains fully defined by `MaterialRenderer` (`fill`, opacity, gradients, reflection, and top coat).
- No interface selector or branding token changed.
- No protected renderer, Hero, state, geometry, layout, or legacy studio implementation changed.
- The regression test exercises the production component rather than a synthetic SVG fixture.

## 11. Remaining uncertainty

jsdom cannot rasterize SVG or return a trustworthy computed paint-server value, so automated Jest coverage proves the React/SVG attributes and absence of a CSS replacement but not final GPU pixels. A real Chromium/Firefox/Safari computed-style inspection using the diagnostic above remains the definitive paint-server check. With the only matching fixed-paint CSS removed, the next pixel owners are the SVG material gradient and the subsequent achromatic material/Hero-lighting layers; no remaining browser presentation layer can introduce the audited fixed pink/plum color.
