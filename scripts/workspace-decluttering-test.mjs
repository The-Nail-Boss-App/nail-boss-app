import fs from "node:fs";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

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
const headquarters = fs.readFileSync("client/src/Headquarters.jsx", "utf8");
const appShell = fs.readFileSync("client/src/App.jsx", "utf8");
const sharedStyles = fs.readFileSync("client/src/styles.js", "utf8");
const assetLibrary = fs.readFileSync("client/src/design-studio/AssetLibrary.jsx", "utf8");
const nailCanvas = fs.readFileSync(
  "client/src/design-studio/NailCanvas.jsx",
  "utf8",
);

const studioBarStart = studio.indexOf('data-testid="studio-bar"');
const activePanelStart = studio.indexOf('data-testid="studio-working-panel"');
const mainStart = studio.indexOf(
  'data-testid="hero-canvas"',
  activePanelStart,
);
const studioBarMarkup = studio.slice(studioBarStart, activePanelStart);
const activePanelMarkup = studio.slice(activePanelStart, mainStart);
const preHeroWorkspace = studio.slice(studio.indexOf('data-testid="creative-workspace-layout"'), mainStart);
const leftSidebar = activePanelMarkup;
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
  "Panel groups should be defined.",
);
assert.match(
  studio,
  /group\.reduce\([\s\S]*\(state, panelId\)[\s\S]*panelId === id \? !prev\[id\] : false/,
  "Opening one panel should collapse siblings.",
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
  /data-testid="artist-command-bar"[\s\S]*data-testid="studio-bar"[\s\S]*data-testid="creative-workspace-layout"/,
  "Studio Bar should render directly under the Artist Command Bar before the workspace.",
);
assert.match(
  studio,
  /data-testid="creative-workspace-layout"[\s\S]*data-testid="studio-working-panel"[\s\S]*data-testid="hero-canvas"[\s\S]*data-testid="nail-stack-right-panel"/,
  "Creative Workspace layout should expose Active Studio Panel, expanded central Hero Canvas, and Nail Stack zones.",
);
assert.equal(
  studio.match(/data-testid="creative-wall"/g)?.length || 0,
  0,
  "Old vertical Creative Wall should no longer be rendered as the primary studio selector.",
);
assert.doesNotMatch(studio, /Creative Wall™/, "Creative Wall label should not be present.");
for (const card of [
  "Polish Studio™",
  "Technique Studio™",
  "Sticker Studio™",
  "Charm Studio™",
  "Brush Studio™",
  "Top Coat Studio™",
])
  assert.ok(studio.includes(card), `${card} Studio Bar button should exist.`);
assert.match(
  studio,
  /function StudioCard[\s\S]*aria-pressed=\{active\}[\s\S]*active=\{activeStudio === studio\.id\}/,
  "Studio Bar buttons should preserve selected Studio state.",
);
assert.match(
  studioStyles,
  /studioBar:[\s\S]*gridTemplateColumns: "repeat\(6, minmax\(104px, 1fr\)\)"[\s\S]*padding: "6px clamp\(10px, 1\.3vw, 14px\)"[\s\S]*overflowY: "hidden"/,
  "Studio Bar should keep all Studio choices in a slimmer compact horizontal row without vertical drawer scrolling.",
);
assert.match(
  studioStyles,
  /height: "min\(100%, calc\(100vh - 154px\)\)"[\s\S]*gridTemplateColumns: "minmax\(220px, 22fr\) minmax\(0, 58fr\) minmax\(210px, 20fr\)"[\s\S]*gap: 8[\s\S]*overflowX: "hidden"/,
  "Workspace should implement the approved 22/58/20 Active Studio, Hero Canvas, and Nail Stack geometry without horizontal overflow.",
);

assert.match(
  studioStyles,
  /studioCard: \(active = false\) => \(\{[\s\S]*gridTemplateColumns: "26px 1fr"[\s\S]*minHeight: 40[\s\S]*padding: "5px 8px"/,
  "Studio cards should be shorter while preserving a touch-friendly minimum hit target.",
);
assert.match(
  studioStyles,
  /studioCardIcon:[\s\S]*width: 26[\s\S]*height: 26[\s\S]*fontSize: 14/,
  "Studio card icons should be slightly reduced so the Studio Bar is less visually dominant.",
);
assert.match(
  studioStyles,
  /studioCardCopy:[\s\S]*display: "none"[\s\S]*fontSize: 10[\s\S]*lineHeight: 1\.18/,
  "Studio card descriptions should be reduced while keeping readable titles.",
);
assert.match(
  studioStyles,
  /stickyPreview:[\s\S]*minHeight: "clamp\(500px, calc\(100vh - 286px\), 860px\)"[\s\S]*display: "grid"/,
  "Hero Canvas should receive increased clamp-based vertical room for the dominant Nail Design Template.",
);

assert.match(
  studioStyles,
  /commandButton: \(active = false, disabled = false\) => \(\{[\s\S]*minHeight: 40[\s\S]*padding: "7px 10px"[\s\S]*fontSize: 11/,
  "Command buttons should be compact while retaining a touch-friendly height.",
);
assert.match(
  studioStyles,
  /zoomPill:[\s\S]*minHeight: 40[\s\S]*padding: "4px 6px"[\s\S]*zoomButton:[\s\S]*width: 32[\s\S]*height: 30/,
  "Zoom controls should be compact.",
);
assert.match(
  studioStyles,
  /canvasModeButton:[\s\S]*minHeight: 42[\s\S]*background: "linear-gradient\(135deg, #3B1F35, #7B2F59\)"/,
  "Canvas Mode should stay visually distinct without oversized sizing.",
);
assert.match(
  appShell,
  /data-testid="app-sidebar"[\s\S]*data-sidebar-mode=\{page === PAGES\.STUDIO \? \(isDesignStudioSidebarCollapsed \? "collapsed" : "expanded"\) : "expanded"\}/,
  "Design Studio app sidebar should default to collapsed mode with an expanded state.",
);
assert.match(
  appShell,
  /onMouseEnter=\{\(\) => setSidebarExpanded\(true\)\}[\s\S]*onFocus=\{\(\) => setSidebarExpanded\(true\)\}[\s\S]*onBlur=\{\(event\) => \{ if \(!event\.currentTarget\.contains\(event\.relatedTarget\)\) setSidebarExpanded\(false\); \}\}/,
  "Sidebar should expand on hover and keyboard focus, then collapse when focus leaves.",
);
assert.match(
  sharedStyles,
  /sidebarCollapsed:[\s\S]*width: 72[\s\S]*overflow: "hidden"[\s\S]*export function NavItem\([\s\S]*collapsed = false[\s\S]*aria-hidden="true"[\s\S]*whiteSpace: "nowrap"/,
  "Collapsed sidebar should keep icons visible while labels are visually collapsed.",
);
for (const routeLabel of ["Headquarters", "Design Studio", "Proposals", "Nail Shop"]) assert.ok(appShell.includes(`label: '${routeLabel}'`), `${routeLabel} navigation should remain available.`);
assert.match(
  assetLibrary,
  /aria-label=\{`Add \${asset\.name}`\}[\s\S]*title=\{asset\.name\}[\s\S]*data-asset-label-visibility="tooltip-only"/,
  "Visual asset grid labels should move to accessible names/tooltips instead of repeated visible captions.",
);
assert.doesNotMatch(
  assetLibrary,
  /<div[^>]*>\{asset\.name\}<\/div>/,
  "Visual asset buttons should not repeat obvious labels under every icon.",
);

assert.match(
  studioStyles,
  /studioDock:[\s\S]*padding: "8px 14px 10px"[\s\S]*overflowX: "auto"[\s\S]*dockButton: \(active = false\) => \(\{[\s\S]*minHeight: 44/,
  "Studio Dock should stay visible and compact below the expanded Hero Canvas.",
);
assert.match(
  studio,
  /function adjustZoom\(delta\) \{[\s\S]*setCommandZoom\(\(value\) => clamp\(value \+ delta, 25, 240\)\)/,
  "Zoom plus and minus should update a real zoom state up to a useful high-zoom range.",
);
assert.match(
  studio,
  /<span>\{commandZoom\}%<\/span>[\s\S]*onClick=\{\(\) => adjustZoom\(10\)\}/,
  "Zoom percentage label should be bound to the same commandZoom state used by the zoom-in control.",
);
assert.match(
  studio,
  /onClick=\{\(\) => adjustZoom\(-10\)\}[\s\S]*<span>\{commandZoom\}%<\/span>/,
  "Zoom-out control should reduce the same visible zoom state shown in the percentage label.",
);
assert.match(
  nailCanvas,
  /const HERO_CANVAS_SAFE_PADDING = "clamp\(8px, 1\.2vh, 14px\) clamp\(10px, 1\.2vw, 16px\)"/,
  "Hero Canvas should use balanced safe padding so the full nail can center without tip crop.",
);
assert.match(
  nailCanvas,
  /justifyContent: "center"[\s\S]*marginTop: "0"[\s\S]*marginBottom: "0"/,
  "Default nail placement should be vertically centered while preserving bounded breathing room.",
);
assert.match(
  nailCanvas,
  /overflow: fit\.panEnabled \? "auto" : "hidden"[\s\S]*data-zoom-containment=\{fit\.panEnabled \? "internal-pan-at-high-zoom" : "bounded-fit-to-container"\}/,
  "High zoom should use internal Hero Canvas pan while default view stays clipped to its safe area.",
);
assert.match(
  nailCanvas,
  /const HERO_MAX_ZOOM = 2\.4[\s\S]*visualZoom = Math\.min\(requestedZoom, HERO_MAX_ZOOM\)/,
  "High zoom should have a safe cap only after a visibly useful zoom range.",
);


assert.ok(
  activePanelStart < mainStart,
  "Active Studio panel should be left of the Hero Canvas.",
);
assert.match(
  studioStyles,
  /activeStudioScroll:[\s\S]*overflowY: "auto"[\s\S]*overflowX: "hidden"/,
  "Active Studio panel should use internal vertical scrolling without horizontal overflow.",
);
assert.equal(
  studio.match(/data-testid="studio-working-panel"/g)?.length || 0,
  1,
  "There should be no duplicate Active Studio panels.",
);

assert.match(
  studio,
  /data-testid="command-saved-designs-trigger"[\s\S]*Saved Designs[\s\S]*data-testid="command-saved-designs-popover"[\s\S]*renderSavedDesignsBrowser\(\)/,
  "Saved Designs should be available from the Artist Command Bar document tools.",
);
assert.match(
  studio,
  /data-testid="command-signature-looks-trigger"[\s\S]*Signature Looks[\s\S]*data-testid="command-signature-looks-popover"[\s\S]*renderSignatureLooksTools\(\)/,
  "Signature Looks should be available from the Artist Command Bar document tools.",
);
assert.match(
  studio,
  /data-testid="command-design-details-trigger"[\s\S]*Design Details[\s\S]*data-testid="command-design-details-popover"[\s\S]*renderDesignDetailsTools\(\)/,
  "Design Details should be available from the Artist Command Bar document tools.",
);
assert.doesNotMatch(
  activePanelMarkup,
  /id="savedDesigns"|title="Saved Designs"|id="signatureLooks"|title="Signature Looks"|id="designDetails"|title="Design Details"/,
  "Document-management sections should be removed from the Active Studio panel.",
);
assert.match(
  studio,
  /const \[commandZoom, setCommandZoom\] = useState\(100\)[\s\S]*<span>\{commandZoom\}%<\/span>/,
  "Default zoom label should remain 100%.",
);
assert.match(
  nailCanvas,
  /const NAIL_BASELINE_SCALE = 1\.65[\s\S]*export function heroZoomFit[\s\S]*baselineScale: NAIL_BASELINE_SCALE[\s\S]*data-baseline-scale="165-as-100"/,
  "NailCanvas should preserve the larger baseline while using a bounded zoom fit helper.",
);
assert.match(
  studio,
  /function adjustZoom\(delta\)[\s\S]*setCommandZoom\(\(value\) => clamp\(value \+ delta, 25, 240\)\)/,
  "Zoom controls should still scale from the new larger baseline.",
);
assert.match(
  nailCanvas,
  /data-testid="bounded-hero-canvas-area"[\s\S]*data-zoom-containment-padding="dock-safe-expanded"[\s\S]*justifyContent: "center"[\s\S]*overflow: fit\.panEnabled \? "auto" : "hidden"[\s\S]*padding: HERO_CANVAS_SAFE_PADDING/,
  "Nail should remain centered and bounded in balanced containment.",
);
assert.match(
  studioStyles,
  /nailStackPanel:[\s\S]*overflow: "hidden"[\s\S]*nailStackPad:[\s\S]*padding: "10px 10px 8px"[\s\S]*gap: 8[\s\S]*panelBody: \{ padding: 8/,
  "Right drawer compact styling should reduce padding and gaps.",
);
assert.doesNotMatch(
  studioStyles.slice(studioStyles.indexOf('nailStackPanel:'), studioStyles.indexOf('sectionTitle:')),
  /overflow: "auto"|overflowY: "auto"/,
  "Right drawer should not force internal scrolling by default.",
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
  /const DESIGN_NAME_MAX_LENGTH = 32/,
  "Design names should have a clear 32 character editing limit.",
);
assert.match(
  studio,
  /data-testid="artist-command-design-name"[\s\S]*maxLength=\{DESIGN_NAME_MAX_LENGTH\}/,
  "Command-bar design name input should enforce the shared maxLength.",
);
assert.match(
  studio,
  /value\.slice\(0, DESIGN_NAME_MAX_LENGTH\)[\s\S]*setDesignName\(limitedName\)/,
  "Design name edits should be limited without mutating existing over-limit saved names on load.",
);
assert.match(
  studioStyles,
  /commandDesignName:[\s\S]*maxWidth: "100%"[\s\S]*overflowWrap: "anywhere"[\s\S]*wordBreak: "break-word"/,
  "Command title should wrap safely without horizontal overflow.",
);
assert.match(
  studio,
  /function HexInput[\s\S]*useState\(value \|\| "#FFFFFF"\)[\s\S]*onBlur=\{commitDraft\}[\s\S]*e\.key === "Enter"[\s\S]*commitDraft\(\)/,
  "HEX inputs should be editable drafts committed on blur or Enter.",
);
assert.match(
  studio,
  /function normalizeHexDraft[\s\S]*replace\(\/\^#\/, ""\)[\s\S]*return `#\$\{cleaned\}`/,
  "HEX input should normalize values to #-prefixed uppercase format.",
);
assert.match(
  studio,
  /\^#\?\[0-9A-F\]\{0,6\}\$[\s\S]*setDraft\(next\)/,
  "HEX input typing should accept #FFFFFF and FFFFFF-style drafts.",
);
assert.doesNotMatch(
  studio,
  /onChange=\{\(e\) =>[\s\S]{0,160}rememberPolishColor/,
  "Typing in HEX inputs should not immediately add Polish Rack history.",
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
  headquarters,
  /label: "Saved Designs"[\s\S]*onClick: onStartLook[\s\S]*data-testid=\{c\.testId\}/,
  "Headquarters Saved Designs card should open the existing saved-design workflow instead of dead-ending.",
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
  "French Tip quick access should be anchored to the Studio Bar side instead of over the hero canvas.",
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


for (const protectedPath of [
  "client/src/Proposals.jsx",
  "client/src/blueprintEngine.js",
  "server.js",
  "scripts/migrate.js",
]) {
  assert.doesNotThrow(
    () => execFileSync("git", ["diff", "--", protectedPath, "--exit-code"], { stdio: "pipe" }),
    `${protectedPath} should remain unchanged by Design Studio proportion work.`,
  );
}

console.log("Workspace Decluttering UI guardrails passed.");

assert.match(
  studio,
  /data-testid="creative-workspace-layout"[\s\S]*data-testid="studio-working-panel"[\s\S]*data-panel-behavior="left-column-beside-hero-canvas"[\s\S]*data-testid="hero-canvas"[\s\S]*data-testid="nail-stack-right-panel"/,
  "Studio controls should render once in a stable left column beside the Hero Canvas.",
);
assert.equal(
  (studio.match(/data-testid="studio-working-panel"/g) || []).length,
  1,
  "Only one active Studio panel container should render.",
);
assert.equal(
  (studio.match(/data-testid="creative-library-polish-studio"/g) || []).length,
  1,
  "Polish Studio should not have duplicate panel render paths.",
);
assert.doesNotMatch(
  studio,
  /style=\{UI\.studioPopoutPanel\}|data-panel-behavior="pop-out-beside-creative-wall"/,
  "Active Studio panel should not render as a floating pop-out copy.",
);
assert.match(
  studioStyles,
  /activeStudioPanel:[\s\S]*overflow: "hidden"[\s\S]*maxHeight: "calc\(100vh - 168px\)"[\s\S]*position: "relative"/,
  "Active Studio panel should be bounded in the workspace column instead of floating over other zones.",
);
assert.match(
  studioStyles,
  /activeStudioScroll:[\s\S]*flex: "1 1 auto"[\s\S]*overflowY: "auto"[\s\S]*overscrollBehavior: "contain"/,
  "Tall Studio controls should scroll inside the active Studio panel only.",
);
assert.match(
  studioStyles,
  /stickyPreview:[\s\S]*overflow: "hidden"/,
  "Hero Canvas preview should bound zoomed nail content away from the Studio Dock.",
);
assert.match(
  nailCanvas,
  /data-testid="bounded-hero-canvas-area"[\s\S]*overflow: fit\.panEnabled \? "auto" : "hidden"[\s\S]*data-zoom-containment=\{fit\.panEnabled \? "internal-pan-at-high-zoom" : "bounded-fit-to-container"\}[\s\S]*data-zoom-fit-helper="heroZoomFit"/,
  "Zoomable nail canvas should be contained inside the Hero Canvas area.",
);
assert.doesNotMatch(
  nailCanvas,
  /background: "linear-gradient\(180deg,#fff,#fbf1f8\)"|boxShadow: "inset 0 0 0 12px/,
  "The extra inner white nail card should be removed so the nail stands on the Hero Canvas background.",
);
assert.match(
  studio,
  /data-testid="technique-choice-grid"[\s\S]*technique-choice-french[\s\S]*technique-choice-gradient[\s\S]*technique-choice-pattern[\s\S]*technique-choice-aura/,
  "Technique Studio should open with equal technique choices including French, Gradient, Pattern, and Aura.",
);
assert.match(
  studio,
  /!selectedTechnique[\s\S]*data-testid="technique-studio-choice-prompt"/,
  "Technique controls should not appear before a technique is selected.",
);
assert.match(
  studio,
  /selectedTechnique === "french"[\s\S]*<FrenchTipControls/,
  "French Tip controls should render only after selecting French Tip.",
);
assert.match(
  studio,
  /selectedTechnique === "gradient"[\s\S]*<GradientWorkflowControls/,
  "Gradient controls should render only after selecting Gradient.",
);
assert.match(
  studio,
  /selectedTechnique === "pattern"[\s\S]*<PatternWorkflowControls/,
  "Pattern controls should render only after selecting Pattern.",
);
assert.match(
  studio,
  /defaultGradientData[\s\S]*colorA: baseColor[\s\S]*colorB: accent[\s\S]*opacity: 0\.45[\s\S]*mode: "overlayBlend"/,
  "Gradient should blend current polish with one accent stop at partial opacity by default.",
);
assert.match(
  studio,
  /<option value="gradient">Gradient Polish Color<\/option>/,
  "Gradient Polish Color option should exist.",
);
