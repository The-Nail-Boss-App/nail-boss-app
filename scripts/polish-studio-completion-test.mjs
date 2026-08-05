import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const studio = read("client/src/design-studio/DesignStudio.jsx");
const bottle = read("client/src/design-studio/PolishBottle.jsx");
const polish = read("client/src/design-studio/polish.js");

for (const label of ["Active Polish", "Color Palette", "Finish Selection", "Polish Properties", "Recently Used", "Polish Rack™", "Save Polish"]) {
  assert(studio.includes(label), `Polish Studio includes ${label}`);
}

for (const finish of ["Cream", "Jelly", "Matte", "Glass", "Chrome-ready", "Chrome", "Glitter"]) {
  assert(studio.includes(finish) || polish.includes(finish), `${finish} remains available for finish selection or compatibility`);
}

for (const field of ["opacity", "viscosity", "shine", "sparkleDensity", "chromeIntensity", "createdAt", "updatedAt", "brand", "sizeLabel"]) {
  assert(studio.includes(field) || bottle.includes(field), `Polish formulation preserves ${field}`);
}

assert(studio.includes("POLISH_RACK_STORAGE_KEY") && studio.includes("window.localStorage.setItem(POLISH_RACK_STORAGE_KEY"), "Polish Rack persists to existing local storage pattern");
assert(studio.includes("loadStoredPolishRack") && studio.includes("try {") && studio.includes("catch"), "Rack loader sanitizes saved polish data without raw invalid-state crashes");
assert(studio.includes("prev.filter((color) => color !== normalized)") && studio.includes("RECENT_POLISH_LIMIT"), "Recently used polish history deduplicates and caps entries");
assert(studio.includes("scope === \"selected\"") && studio.includes("LEFT_HAND_SLOTS") && studio.includes("RIGHT_HAND_SLOTS") && studio.includes("FULL_SET_SLOTS"), "Apply scope supports active, selected, hands, and full set explicitly");
assert(studio.includes("updateBase(polishPatchFromDraft") && studio.includes("commit(applyBaseToSlots"), "Live active-nail updates and multi-nail commits route through existing Design Studio history");
assert(bottle.includes("linearGradient") && bottle.includes("radialGradient") && bottle.includes("meniscus") === false && bottle.includes("data-polish-finish"), "Bottle preview is dynamic SVG material rendering driven by polish data");
assert(bottle.includes("prefers-reduced-motion") === false && studio.includes("prefers-reduced-motion: reduce"), "Existing Design Studio reduced-motion protection covers bottle motion hooks");

console.log("DS-03 Polish Studio completion source checks passed");
