import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const studio = await readFile("client/src/design-studio/DesignStudio.jsx", "utf8");
const styles = await readFile("client/src/design-studio/studioStyles.js", "utf8");
const barStart = studio.indexOf('data-testid="artist-command-bar"');
const nailKitStart = studio.indexOf('data-testid="studio-bar"');
const bar = studio.slice(barStart, nailKitStart);

assert(barStart >= 0 && barStart < nailKitStart, "Command Bar precedes Nail Kit in DOM order");
assert.match(bar, /src="\/anitaset-logo-main\.png"[\s\S]*Nail Design Studio/, "approved logo immediately precedes the studio title");
assert(!studio.includes("The World's Most Beautiful Luxury Digital Nail Desk"), "forbidden tagline is absent");
assert(!bar.includes("Artist Toolkit"), "Artist Toolkit wording is absent from the active Command Bar");
for (const command of ["New Design", "Open Saved Design", "Duplicate", "Save", "Undo", "Redo", "Share", "Export", "Add to Collection", "Design Details"])
  assert(bar.includes(command), `${command} is represented in the Command Bar`);
assert.match(bar, /onClick=\{openSavedDesignsBrowser\}/, "Open Saved Design reuses the saved-design browser workflow");
assert.match(bar, /onClick=\{save\}/, "Save reuses the existing save workflow");
for (const label of ["Save Changes", "Saved", "Saving…"])
  assert(bar.includes(label), `${label} smart save state is exposed`);
assert.match(bar, /Current Design[\s\S]*value=\{designName\}[\s\S]*onChange=\{\(e\) => updateDesignName\(e\.target\.value\)\}/, "Current Design control reuses design-name state");
assert.match(bar, /onClick=\{undo\} disabled=\{!canUndo\}/, "Undo preserves its disabled state");
assert.match(bar, /onClick=\{redo\} disabled=\{!canRedo\}/, "Redo preserves its disabled state");
assert.match(styles, /artistCommandBar:[\s\S]*maxWidth: "100%"[\s\S]*overflowX: "clip"[\s\S]*flexWrap: "nowrap"/, "Command Bar is a bounded, non-wrapping desktop row");
assert.match(studio, /@media \(max-width: 1280px\)[\s\S]*command-bar-publishing[\s\S]*display: none/, "publishing controls compress into overflow at narrower desktop widths");
assert.doesNotMatch(studio, /@media \(max-width: 1024px\)[\s\S]{0,300}command-bar-brand-title[\s\S]{0,200}(display:\s*none|clip:\s*rect)/, "studio title stays visibly rendered at supported desktop widths");
console.log("Command Bar v2 checks passed");
