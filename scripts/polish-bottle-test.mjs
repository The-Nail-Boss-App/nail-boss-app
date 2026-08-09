import fs from "node:fs";
import path from "node:path";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const studio = read("client/src/design-studio/DesignStudio.jsx");
const bottle = read("client/src/design-studio/PolishBottle.jsx");
const nailStudioStyles = read("client/src/nail-design-studio/NailDesignStudio.css");
const blueprint = read("client/src/design-studio/blueprint.js");
const gallery = read("client/src/BlueprintGalleryRenderer.jsx");

assert(
  bottle.includes("export default function PolishBottle"),
  "PolishBottle component exists",
);
assert(
  ["colorHex", "label", "selected", "size", "polishType", "onClick"].every(
    (prop) => bottle.includes(prop),
  ),
  "PolishBottle supports required props",
);
assert(
  bottle.includes("accessibleLabel") && bottle.includes("aria-label"),
  "PolishBottle includes accessible label handling",
);
assert(
  bottle.includes("cap") || bottle.includes("capWidth"),
  "PolishBottle renders a cap",
);
assert(
  bottle.includes("bodyPath") && bottle.includes('data-bottle-layer="polish-content"'),
  "PolishBottle renders bottle body and polish fill",
);
assert(
  bottle.includes('data-bottle-layer="front-reflection"') && bottle.includes('strokeWidth="2"'),
  "PolishBottle renders a subtle highlight",
);
assert(
  bottle.includes("polish-bottle-button") && bottle.includes("polish-bottle-figure") &&
    bottle.includes("anitasetBottleSelected") === false,
  "PolishBottle exposes lightweight hover, focus, and reflection hooks",
);
assert(
  bottle.includes('data-bottle-renderer="anitaset-signature-v1"') &&
    bottle.includes('viewBox="0 0 100 132"') &&
    bottle.includes('large: { width: 112, height: 148'),
  "PolishBottle uses scalable bounds for the approved Signature Bottle V1 renderer",
);
assert(
  bottle.includes("-glass") &&
    !bottle.includes('data-bottle-layer="outer-casing"') &&
    !bottle.includes('data-bottle-layer="side-panel"'),
  "PolishBottle renders its glass treatment without unrelated casing panels",
);

assert(
  studio.includes('data-testid="polish-rack"'),
  "Polish Rack section exists",
);
assert(
  studio.includes('data-testid="polish-color-controls"'),
  "Polish Color controls exist",
);
assert(
  studio.includes('data-testid="creative-library-polish-studio"') &&
    studio.includes('title="Polish Studio"'),
  "Polish Studio exists in the Creative Library as a primary tool",
);
assert(
  studio.includes('data-testid="command-polish-color-popover"') &&
    studio.includes("Polish Studio"),
  "Current Polish Bottle still opens quick Polish Studio controls from the Nail Kit",
);
assert(
  studio.includes("creative-library-polish-studio") &&
    studio.includes("current-polish-bottle"),
  "Current Polish Bottle is not the only polish control path",
);
assert(
  studio.includes('label === "Set Actions" ? "command-set-actions-trigger"') &&
    studio.includes('data-testid="command-set-actions-popover"'),
  "Set Actions are available from the command bar",
);
assert(
  studio.includes("Apply current design to all nails") &&
    studio.includes("Copy current nail") &&
    studio.includes("Paste to selected nails") &&
    studio.includes("Mirror current hand"),
  "Command bar exposes existing full-set workflow actions",
);
assert(
  studio.includes('data-testid="command-french-tip-trigger"') &&
    studio.includes('onClick={openFrenchTipQuickAccess}'),
  "French Tip controls are available from the command bar",
);
assert(studio.includes("Polish Rack™"), "Polish Rack™ wording exists");
assert(
  studio.includes("Polish Color") &&
    studio.includes("Polish HEX") &&
    studio.includes("Polish Type"),
  "Polish Studio includes Polish Color, HEX, and Polish Type controls",
);
assert(
  studio.includes("Active nail") &&
    studio.includes("Current hand") &&
    studio.includes("Full set"),
  "Polish Studio includes active nail, current hand, and full set apply controls",
);
assert(
  studio.includes("Recently Used Polish"),
  "Recently Used Polish wording exists",
);
assert(
  studio.includes('gridTemplateColumns: "repeat(auto-fit, minmax(34px, 1fr))"'),
  "Polish Rack uses responsive grid columns for containment",
);
assert(
  studio.includes('justifyItems: "center"') &&
    studio.includes("minWidth: 0") &&
    studio.includes('maxWidth: "100%"'),
  "Polish Rack centers bottles without allowing layout spill",
);
assert(
  studio.includes('overflow: "hidden"'),
  "Polish Rack clips accidental overflow within the card",
);
assert(
  studio.includes('className="polish-rack-bottle"') &&
    studio.includes("@keyframes anitasetRackInsert"),
  "Polish Rack insertion animation exists",
);
assert(
  studio.includes("@keyframes anitasetHeroFade") &&
    studio.includes('className="studio-hero-fade"'),
  "Hero Canvas transition exists",
);
assert(
  studio.includes("@keyframes anitasetDrawerSettle") &&
    studio.includes("studio-popover-motion") &&
    read("client/src/design-studio/studioStyles.js").includes("anitasetDrawerSettle"),
  "Drawer transitions exist",
);
assert(
  studio.includes("studio-motion-button:hover") &&
    studio.includes("studio-motion-button:active") &&
    studio.includes("studio-motion-button:focus-visible") &&
    studio.includes("studio-motion-button:disabled") &&
    studio.includes('[aria-pressed="true"]'),
  "Buttons have hover, press, focus, disabled, and selected states",
);
assert(
  studio.includes("studio-card-button:hover") &&
    read("client/src/design-studio/studioStyles.js").includes("scale(1.01)"),
  "Studio cards are animated with luxury scale and glow",
);
assert(
  studio.includes("studio-status-loading") &&
    studio.includes("@keyframes anitasetStatusSheen"),
  "Existing loading status uses a subtle skeleton fade treatment",
);
assert(
  nailStudioStyles.includes(".polish-bottle-button") &&
    nailStudioStyles.includes("max-width: 100%") &&
    nailStudioStyles.includes("box-sizing: border-box"),
  "PolishBottle respects the width of narrow rack cells",
);
assert(
  !studio.includes("Recent Colors"),
  "Recent Colors wording is removed from Design Studio UI",
);
assert(
  !studio.includes("NAIL_COLOR_SWATCHES"),
  "legacy static bottle swatch palette is removed",
);
assert(
  !studio.includes("Set Polish Color ${color}"),
  "duplicate static polish bottle rows are removed",
);
assert(
  studio.includes("const applyRackPolish = (value) => {") &&
    studio.includes("rememberPolishColor(colorHex);") &&
    /updateBase\(\{[\s\S]*baseColorHex: colorHex/.test(studio),
  "clicking a committed rack bottle applies a Polish Color through existing base color logic",
);
assert(
  studio.includes("prev.filter((color) => color !== normalized)") &&
    studio.includes("RECENT_POLISH_LIMIT"),
  "duplicate polish colors are not repeated and recent list is capped",
);
assert(
  !studio.includes(
    "if (patch.baseColorHex || patch.colorHex) rememberPolishColor",
  ),
  "browsing polish colors does not create rack history",
);
assert(
  studio.includes("baseLayer?.data?.colorHex || activeNail.baseColorHex"),
  "legacy baseColorHex remains supported in Design Studio color value",
);
assert(
  studio.includes('data-testid="artist-command-bar"'),
  "Artist Command Bar exists",
);
assert(
  studio.includes('data-testid="artist-command-design-name"') &&
    studio.includes('placeholder="Untitled Design"') &&
    studio.includes("updateDesignName(e.target.value)"),
  "Artist Command Bar design name is editable with placeholder",
);
assert(
  studio.includes('data-testid="artist-command-collection"') &&
    studio.includes("COLLECTION_OPTIONS.map"),
  "Artist Command Bar collection subtitle exists",
);
assert(
  studio.includes('dirty ? "Save Changes" : "Saved"') && studio.includes("Saving…"),
  "Command Bar exposes the smart save state",
);
assert(studio.includes("Save Changes"), "smart Save Changes wording exists");
assert(
  studio.includes('data-testid="current-polish-bottle"') &&
    studio.includes("Current Polish Bottle™"),
  "Current Polish Bottle exists in the Nail Kit",
);
assert(
  studio.includes(
    'data-canvas-safe-placement="left-creative-library-anchor"',
  ) &&
    studio.includes("Canvas-safe marker") &&
    read("client/src/design-studio/studioStyles.js").includes(
      'commandPolishPopover: { position: "fixed", top: 132, left: 18',
    ),
  "Command-bar polish quick controls are marked and positioned away from the hero canvas",
);
assert(
  studio.includes('setCommandPopover("");'),
  "Command-bar polish quick controls close after apply/commit",
);
assert(
  ["Set Actions", "French Tip", "Undo", "Redo"].every((label) =>
    studio.includes(label),
  ),
  "Artist Command Bar grouped workflow buttons exist",
);
assert(
  studio.includes("Canvas Mode") && studio.includes("canvasModeButton"),
  "Canvas Mode button exists with special styling",
);
assert(
  studio.includes("studio-canvas-mode-button") &&
    read("client/src/design-studio/studioStyles.js").includes("transition: LUXURY_TRANSITION"),
  "Command Bar transitions exist and Canvas Mode keeps premium tactile feedback",
);
assert(
  studio.includes('data-testid="artist-command-zoom"') &&
    studio.includes("commandZoom") &&
    studio.includes("adjustZoom"),
  "Zoom controls exist",
);
assert(
  studio.includes("Workspace Memory placeholders") &&
    [
      "zoom",
      "selected polish",
      "drawer state",
      "canvas mode",
      "selected nail",
    ].every((text) => studio.includes(text)),
  "workspace memory placeholders are documented without persistence",
);
assert(
  blueprint.includes("baseColorHex") &&
    blueprint.includes("getVisibleBaseColor"),
  "legacy baseColorHex remains supported in blueprint helpers",
);
assert(
  blueprint.includes(
    'export const SHAPES = ["Almond", "Coffin", "Square", "Oval", "Round", "Stiletto", "Lipstick", "Duck"]',
  ),
  "all eight Founder-approved nail shapes remain present",
);
assert(
  blueprint.includes('HIDDEN_SHAPE_FALLBACKS = {}') &&
    !gallery.includes("Full Set Composition") &&
    !studio.includes("Full Set Composition"),
  "Duck hidden fallback remains and Full Set Composition chrome is absent",
);
assert(
  !read("client/src/Proposals.jsx").includes("command-set-actions-trigger"),
  "Proposal surface is unchanged by command bar workflow cleanup",
);

console.log("Polish Bottle / Polish Rack source tests passed");
