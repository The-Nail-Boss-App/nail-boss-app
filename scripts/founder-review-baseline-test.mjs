import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [studio, assetLibrary, app, proposals, renderer] = await Promise.all([
  read("client/src/design-studio/DesignStudio.jsx"),
  read("client/src/design-studio/AssetLibrary.jsx"),
  read("client/src/App.jsx"),
  read("client/src/Proposals.jsx"),
  read("client/src/design-studio/NailCanvas.jsx"),
]);

const requiredStudioContracts = [
  "Single Nail",
  "Left Hand",
  "Right Hand",
  "Full Set",
  "Focus Perspective",
  "Polish Studio™",
  "Technique Studio™",
  "Brush Studio™",
  "Sticker Studio™",
  "Charm Studio™",
  "Top Coat Studio™",
  "Polish HEX",
  "Save Changes",
  "Open Saved Design",
];

for (const contract of requiredStudioContracts) {
  assert(studio.includes(contract), `Founder Review baseline is missing ${contract}`);
}

assert.match(studio, /SHAPES\.map/, "shape controls remain connected to the supported shape list");
assert(studio.includes("Nail Length") && studio.includes("Nail Width"), "length and width controls remain available");
assert.match(studio, /data-testid="sticker-studio-panel"[\s\S]*initialCategory="decals"/, "Sticker Studio uses the working decal library");
assert.match(studio, /data-testid="charm-studio-panel"[\s\S]*<AssetLibrary onAddAsset=\{addAsset\}/, "Charm Studio uses the working asset library");
assert.match(studio, /<LayersPanel[\s\S]*onMove=\{moveLayer\}/, "layer ordering remains wired to the editor");
assert.match(renderer, /NailCanvas/, "the synchronized studio retains the nail canvas renderer");
assert(assetLibrary.includes("onAddAsset(asset)"), "asset workflows still add selected art to the active nail");
assert(app.includes("<DesignStudio ref={designStudioRef}"), "the application shell still mounts the synchronized Design Studio");
assert(proposals.includes("designId: selectedDesignId"), "proposal creation remains linked to a saved Design Studio design");

assert(!studio.includes("Vendor polish collections placeholder."), "obsolete vendor placeholder is absent");
assert(!studio.includes("Sticker Studio foundation shelf."), "obsolete Sticker Studio shelves are absent");
assert(!studio.includes("Sugar Effect placeholder"), "unimplemented top-coat placeholder is absent");
assert(!studio.includes("Glass Finish placeholder"), "unimplemented top-coat placeholder is absent");

console.log("Founder Review Design Studio baseline checks passed");
