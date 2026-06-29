import fs from "node:fs";
import assert from "node:assert/strict";

const studio = fs.readFileSync(
  "client/src/design-studio/DesignStudio.jsx",
  "utf8",
);
const studioStyles = fs.readFileSync(
  "client/src/design-studio/studioStyles.js",
  "utf8",
);
const proposals = fs.readFileSync("client/src/Proposals.jsx", "utf8");
const blueprintEngine = fs.readFileSync(
  "client/src/blueprintEngine.js",
  "utf8",
);
const propertiesPanel = fs.readFileSync(
  "client/src/design-studio/PropertiesPanel.jsx",
  "utf8",
);
const assetRendering = fs.readFileSync(
  "client/src/design-studio/assetRendering.js",
  "utf8",
);
const dashboard = fs.readFileSync("client/src/Dashboard.jsx", "utf8");

const creativeWallStart = studio.indexOf('data-testid="creative-wall"');
const mainStart = studio.indexOf(
  'data-testid="hero-canvas"',
  creativeWallStart,
);
const leftSidebar = studio.slice(creativeWallStart, mainStart);
const nailStackStart = studio.indexOf('data-testid="nail-stack-right-panel"');
const nailStackEnd = studio.indexOf(
  'data-testid="studio-dock"',
  nailStackStart,
);
const nailStackPanel = studio.slice(nailStackStart, nailStackEnd);

assert.match(
  studio,
  /const applyCurrentPolish = \(scope\) => \{[\s\S]*rememberPolishColor\(committedColor\)[\s\S]*commit\([\s\S]*applyBaseToSlots[\s\S]*setCommandPopover\(\s*""\s*\)/,
  "Polish Rack should update only from committed polish application and close command quick controls.",
);
assert.doesNotMatch(
  studio,
  /function updateBase\(patch\) \{\s*if \(patch\.baseColorHex/,
  "Browsing polish colors through updateBase must not remember rack history.",
);
assert.doesNotMatch(
  leftSidebar,
  /title="Full-Set Actions"|<BulkActionsPanel/,
  "Legacy Full-Set Actions sidebar panel should be removed.",
);
assert.doesNotMatch(
  leftSidebar,
  /title="French Tip Precision"/,
  "Legacy French Tip sidebar panel should be removed.",
);
assert.doesNotMatch(
  studio,
  /title="Developer Geometry Tools"|Shape Debug Overlay<\/label>/,
  "Developer Geometry Tools must be hidden from production UI.",
);
assert.match(
  studio,
  /PANEL_GROUPS[\s\S]*nailBasics[\s\S]*signatureLooks[\s\S]*designDetails[\s\S]*artTools[\s\S]*properties[\s\S]*layers/,
  "Creative Drawer panel groups should be defined.",
);
assert.match(
  studio,
  /group\.reduce\([\s\S]*\(state, panelId\)[\s\S]*panelId === id \? !prev\[id\] : false/,
  "Opening one Creative Drawer panel should collapse siblings.",
);
assert.match(
  studio,
  /data-testid="current-polish-bottle"[\s\S]*onClick=\{openPolishRack\}/,
  "Current Polish Bottle should open Polish Studio.",
);
assert.match(
  studio,
  /data-testid="creative-library-polish-studio"[\s\S]*<PolishColorControls/,
  "Creative Library should retain a full Polish Studio control path.",
);
assert.equal(
  (studio.match(/const STUDIO_CARDS = \[/g) || []).length,
  1,
  "Studio cards should be defined once.",
);
assert.doesNotMatch(
  studio,
  /STATIC_POLISH_PALETTE|staticPolishPalette|#[A-Fa-f0-9]{6}.*#[A-Fa-f0-9]{6}.*#[A-Fa-f0-9]{6}.*#[A-Fa-f0-9]{6}/,
  "No duplicate static polish palette should be introduced.",
);
assert.match(
  studio,
  /data-canvas-safe-placement="left-creative-library-anchor"[\s\S]*Canvas-safe marker/,
  "Command-bar Polish Studio popover should be designed not to cover the hero canvas.",
);
assert.match(
  studio,
  /<div style=\{UI\.sectionTitle\}>Polish Studio<\/div>[\s\S]*Polish Color[\s\S]*HEX[\s\S]*Polish Type[\s\S]*Active nail[\s\S]*Current hand[\s\S]*Full set/,
  "Polish Studio should contain polish color, HEX, Polish Type, and apply scopes.",
);
assert.match(
  studio,
  /Polish Rack™[\s\S]*Recently Used Polish/,
  "Polish Studio should retain Polish Rack and recently used polish.",
);
assert.match(
  studio,
  /data-testid="artist-command-bar"/,
  "Artist Command Bar should be preserved.",
);
assert.match(
  studio,
  /data-testid="creative-workspace-layout"[\s\S]*data-testid="creative-wall"[\s\S]*data-testid="hero-canvas"[\s\S]*data-testid="nail-stack-right-panel"/,
  "Creative Workspace layout should expose Creative Wall, central Hero Canvas, and Nail Stack zones.",
);
assert.match(studio, /Creative Wall™/, "Creative Wall should be present.");
for (const card of [
  "Polish Studio™",
  "Technique Studio™",
  "Gem Studio™",
  "Charm Studio™",
  "Brush Studio™",
  "Top Coat Studio™",
])
  assert.ok(studio.includes(card), `${card} card should exist.`);
assert.match(
  studioStyles,
  /gridTemplateColumns:[\s\S]*"minmax\(220px, 0\.9fr\) minmax\(320px, 1\.7fr\) minmax\(220px, 0\.85fr\)"[\s\S]*overflowX: "hidden"/,
  "Hero Canvas should remain the dominant responsive workspace column without horizontal overflow.",
);
assert.match(
  studio,
  /data-testid="hero-canvas"[\s\S]*<NailCanvas/,
  "Hero Canvas should contain the nail canvas.",
);
assert.match(
  studio,
  /(?=[\s\S]*data-testid="artist-command-zoom")(?=[\s\S]*\{commandZoom\}%)(?=[\s\S]*zoom=\{commandZoom \/ 100\})/,
  "Zoom controls should drive the Hero Canvas NailCanvas scale."
);
assert.match(
  studio,
  /data-testid="command-nail-basics-trigger"[\s\S]*Nail Basics™[\s\S]*Nail Shape[\s\S]*Nail Length[\s\S]*Nail Width[\s\S]*Active Nail[\s\S]*Current Hand[\s\S]*Full Set/,
  "Nail Basics should live in an Artist Command Bar popover with supported apply scopes."
);
assert.doesNotMatch(
  leftSidebar,
  /title="Nail Basics"/,
  "Legacy Nail Basics sidebar panel should be removed."
);
assert.match(studio, /Nail Art Controls™/, "Nail Art Controls wording should exist.");
assert.doesNotMatch(studio, />Properties<|title="Properties"|Layer Details/, "Legacy Properties and Layer Details wording should be removed from UI copy.");

assert.match(
  studio,
  /Nail Stack™[\s\S]*Nail Art Controls™[\s\S]*<PropertiesPanel[\s\S]*<LayersPanel[\s\S]*data-testid="history-placeholder"/,
  "Nail Stack right panel should contain Nail Art Controls, layers, and history placeholder.",
);
assert.doesNotMatch(
  nailStackPanel,
  /<AssetLibrary|<DrawingToolbar|Add French tip layer|title="French Tip Precision"/,
  "Creative workflow controls should not be restored to the Nail Stack right panel.",
);
assert.ok(
  studio.includes('data-testid="studio-dock"') &&
    [
      "Studio View",
      "Full Set",
      "Left Hand",
      "Right Hand",
      "Press-On Tray",
      "Magazine",
      "Recipe",
      "Blueprint",
    ].every((mode) => studio.includes(mode)),
  "Studio Dock perspectives should be present.",
);
assert.match(
  studio,
  /Studio personalization hooks[\s\S]*work surface[\s\S]*walls[\s\S]*lighting[\s\S]*accent color[\s\S]*layout mode[\s\S]*left-handed mode[\s\S]*panel transparency/,
  "Personalization placeholders should be architecture-only comments.",
);
assert.match(
  studio,
  /data-testid="polish-rack"/,
  "Polish Rack should be preserved.",
);
assert.match(
  studio,
  /data-testid="current-polish-bottle"/,
  "Current Polish Bottle should be preserved.",
);
assert.match(studio, /<NailCanvas/, "Hero Canvas should be preserved.");
assert.match(studio, /<FullSetPreview/, "Nail Stack should be preserved.");
assert.doesNotMatch(
  studio,
  /Hero 7|Duck|Full Set Composition/,
  "Hero 7 exact guardrails remain clean: Duck hidden and Full Set Composition absent from studio UI.",
);

assert.match(
  propertiesPanel,
  /layer\.type === "gradient"[\s\S]*onPatch\(\{ data: normalizeGradientData\(\{ \.\.\.layer\.data, colorA \}\) \}\)[\s\S]*onPatch\(\{ opacity: v \/ 100 \}\)/,
  "Gradient controls should patch the selected gradient layer data/opacity instead of base polish color.",
);
assert.match(
  propertiesPanel,
  /layer\.type === "pattern"[\s\S]*Pattern scale[\s\S]*transform: \{ \.\.\.layer\.transform, scaleX[\s\S]*Pattern rotation[\s\S]*Pattern spacing[\s\S]*data: \{ \.\.\.layer\.data, density/,
  "Pattern controls should bind selected pattern layer transform/data controls only.",
);
assert.doesNotMatch(
  propertiesPanel.slice(propertiesPanel.indexOf('layer.type === "pattern"'), propertiesPanel.indexOf('layer.type === "frenchTip"')),
  /frenchTip|French Tip/,
  "Pattern controls should not move into French Tip controls.",
);
assert.match(
  assetRendering,
  /data-decal-transparent-artwork="no-white-box"/,
  "Decal rendering should mark transparent artwork handling.",
);
assert.doesNotMatch(
  assetRendering.slice(assetRendering.indexOf('export function AssetSurfaceBlend'), assetRendering.indexOf('export function AssetSpecularAccent')),
  /<rect[\s\S]*fill="#fff"/,
  "Decal surface blending must not render a visible white/light box behind transparent artwork.",
);
assert.match(
  dashboard,
  /label: "Saved Designs"[\s\S]*onClick: onStartLook[\s\S]*data-testid=\{c\.testId\}/,
  "Dashboard Saved Designs card should open the existing saved-design workflow instead of dead-ending.",
);

assert.ok(
  proposals.length > 0 && blueprintEngine.length > 0,
  "Proposal and Blueprint files are only read by this test.",
);

assert.ok(
  studio.includes("data: patch.data ? { ...layer.data, ...patch.data } : layer.data") &&
    studio.includes('onPatch({ colorHex: normalizeHex(value, "#FFFFFF") })') &&
    studio.includes('data-testid="french-tip-visible-color-binding"'),
  "French Tip color controls should merge existing layer data and bind to the visible French Tip color layer.",
);
assert.match(
  studio,
  /data-testid="command-french-tip-popover"[\s\S]*data-canvas-safe-placement="left-creative-wall-anchor"[\s\S]*style=\{UI\.commandFrenchTipPopover\}/,
  "French Tip quick access should be anchored to the Creative Wall side instead of over the hero canvas.",
);
assert.match(
  studioStyles,
  /commandFrenchTipPopover:[\s\S]*position: "fixed"[\s\S]*left: 18[\s\S]*maxHeight: "calc\(100vh - 154px\)"/,
  "French Tip command popover should use a canvas-safe fixed left rail style.",
);
assert.match(
  studio,
  /function openFrenchTipQuickAccess\(\)[\s\S]*setCommandPopover[\s\S]*setActiveStudio\("techniqueStudio"\)[\s\S]*setTab\("effects"\)/,
  "Command-bar French Tip should open Technique Studio as quick access, not become the only control path.",
);
assert.ok(
  studio.includes('data-testid="technique-studio-panel"') &&
    studio.includes('data-testid={quickAccess ? "french-tip-quick-access-controls" : "technique-studio-french-tip-controls"}') &&
    studio.includes('data-control-home={quickAccess ? "command-quick-access" : "technique-studio"}'),
  "French Tip controls should remain available inside Technique Studio.",
);
assert.match(
  studio,
  /data-testid="french-tip-height-slider"[\s\S]*data-testid="french-tip-smile-curve-slider"[\s\S]*data-testid="french-tip-smile-depth-slider"[\s\S]*data-testid="french-tip-smile-width-slider"/,
  "French Tip live adjustment sliders should remain present.",
);
assert.match(
  studio,
  /function applyFrenchTip\(scope\)[\s\S]*commit\(applyFrenchTipToSlots[\s\S]*setCommandPopover\(\s*""\s*\)/,
  "Applying a French Tip scope from quick access should close the command popover without closing during slider changes.",
);

console.log("Workspace Decluttering UI guardrails passed.");
