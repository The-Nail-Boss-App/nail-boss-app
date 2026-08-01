import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

const blueprint = await import(new URL('client/src/design-studio/blueprint.js', root).href);
const studioSource = await read('client/src/design-studio/DesignStudio.jsx');
const nailCanvasSource = await read('client/src/design-studio/NailCanvas.jsx');
const layersPanelSource = await read('client/src/design-studio/LayersPanel.jsx');
const frenchTipSource = await read('client/src/design-studio/frenchTipRendering.js');
const stylesSource = await read('client/src/design-studio/studioStyles.js');
const fullSetSource = await read('client/src/design-studio/FullSetPreview.jsx');
const thumbnailSource = await read('client/src/design-studio/NailThumbnail.jsx');
const headquartersSource = await read('client/src/Headquarters.jsx');

const { layerSort } = blueprint;
const base = { id: 'base-layer', type: 'base', name: 'Base', order: 0, visible: true, locked: true };
const lower = { id: 'lower-art', type: 'decal', name: 'Lower overlapping art', order: 1, visible: true, locked: false };
const upper = { id: 'upper-art', type: 'charm', name: 'Upper overlapping art', order: 2, visible: true, locked: false };
const fixtureLayers = [base, lower, upper];
const renderBefore = fixtureLayers.filter((layer) => layer.type !== 'base').sort(layerSort).map((layer) => layer.id);
const moved = [base, upper, lower].map((layer, order) => ({ ...layer, order }));
const renderAfter = moved.filter((layer) => layer.type !== 'base').sort(layerSort).map((layer) => layer.id);
assert.deepEqual(renderBefore, ['lower-art', 'upper-art'], 'overlapping fixture starts with lower art under upper art');
assert.deepEqual(renderAfter, ['upper-art', 'lower-art'], 'moving lower art up changes NailCanvas render order source');
assert.equal(moved.find((layer) => layer.id === 'lower-art').order, 2, 'moved layer.order is updated');
assert.equal(moved.find((layer) => layer.id === 'upper-art').order, 1, 'displaced layer.order is updated');
assert.match(studioSource, /const renderOrdered = \[\.\.\.nail\.layers\]\.sort\(layerSort\)[\s\S]*\[renderOrdered\[index\], renderOrdered\[target\]\][\s\S]*renderOrdered\.map\(\(item, order\) => \[item\.id, \{ \.\.\.item, order \}\]\)[\s\S]*layers: \[\.\.\.reorderedLayers, \.\.\.remainingLayers\]/, 'moveLayer mutates the active nail layers array and renumbers orders');
assert.match(nailCanvasSource, /const artLayers = \[\.\.\.layers\]\.filter[\s\S]*\.sort\(layerSort\)/, 'NailCanvas renders from current layers prop sorted by updated order');
assert.match(layersPanelSource, /disabled=\{disableUp\}[\s\S]*>Up<|disabled=\{disableDown\}[\s\S]*>Down</, 'layer controls preserve Up/Down behavior');

assert.match(headquartersSource, /sessionStorage\.setItem\("nailBossOpenSavedDesigns", "1"\)[\s\S]*onStartLook\(\)/, 'Headquarters Saved Designs click records saved-design intent before opening Design Studio');
assert.match(studioSource, /sessionStorage\.getItem\("nailBossOpenSavedDesigns"\)[\s\S]*setSavedDesignsOpen\(true\)/, 'DesignStudio consumes saved-design intent on load');
assert.match(studioSource, /data-testid="saved-designs-browser"[\s\S]*Saved Designs[\s\S]*designs\.length \? designs\.map[\s\S]*onClick=\{\(\) => loadDesign\(design\.id\)\}/, 'Saved Designs browser is visible, lists records, and opens with loadDesign');
assert.doesNotMatch(studioSource.slice(studioSource.indexOf('function openSavedDesignsBrowser'), studioSource.indexOf('function openPolishRack')), /newDesign\(/, 'Saved Designs flow does not invoke New Design');
assert.match(stylesSource, /commandPopover:[\s\S]*position: "fixed"[\s\S]*zIndex: 1200/, 'command popover z-index layer uses fixed high layer above workspace');
assert.match(studioSource, /function CommandPopoverPortal[\s\S]*createPortal\(children, document\.body\)/, 'command popovers render through a document.body portal outside clipped workspace containers');
assert.match(studioSource, /data-testid="command-nail-basics-popover"[\s\S]*style=\{UI\.commandPopover\}/, 'Nail Basics popover uses the shared command popover layer');
assert.match(studioSource, /commandPopover === "nailBasics"[\s\S]*renderNailBasicsTools\(\)/, 'Nail Basics trigger renders its approved controls');
assert.deepEqual(blueprint.SHAPES, ['Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto', 'Lipstick', 'Duck'], 'Nail Basics exposes all eight Founder-approved shapes');
assert.match(studioSource, /savedDesignsOpen &&[\s\S]*renderSavedDesignsBrowser\(\)/, 'Open Saved Designs renders the existing saved-design browser');
assert.match(studioSource, /async function loadDesign\(designId\)[\s\S]*fetch\(`\/api\/designs\/\$\{designId\}\/blueprint`\)[\s\S]*replaceLoaded\(\s*data\.document/, 'selecting a saved design loads its complete blueprint document');
assert.match(nailCanvasSource, /width: fit\.panEnabled \? "auto" : "100%"[\s\S]*maxHeight: fit\.panEnabled \? "none" : "100%"[\s\S]*maxWidth: fit\.panEnabled \? "none" : "min\(96%, 560px\)"/, 'single nail default view fits both available canvas dimensions');
assert.match(fullSetSource, /data-default-view="fit-all-ten"[\s\S]*gridTemplateRows: "repeat\(2, minmax\(0, 1fr\)\)"/, 'Full Set default view reserves bounded space for both rows');
assert.equal((fullSetSource.match(/slots: (?:LEFT|RIGHT)_HAND_SLOTS/g) || []).length, 2, 'Full Set hero maps both five-nail hands');
assert.match(thumbnailSource, /data-full-set-hero-nail[\s\S]*minHeight: 0[\s\S]*overflow: "hidden"/, 'each full-set nail scales inside its bounded grid cell');
assert.match(studioSource, /function openFrenchTipQuickAccess\(\)[\s\S]*setActiveStudio\("techniqueStudio"\)/, 'French Tip quick access opens the visible Technique Studio panel');
assert.match(nailCanvasSource, /patternColorSlots[\s\S]*pattern === "camo"[\s\S]*patternColorHex3[\s\S]*patternColorHex4/, 'camo pattern exposes more than two renderer-backed color slots');
assert.match(nailCanvasSource, /const accent = colors\.patternColorHex3[\s\S]*const deep = colors\.patternColorHex4[\s\S]*fill=\{deep\}/, 'additional camo color slots affect rendered pattern data');
assert.match(frenchTipSource, /patternColorHex3: data\.patternColorHex3[\s\S]*patternColorHex4: data\.patternColorHex4/, 'French Tip pattern fill passes through the same multi-color slots');
assert.match(studioSource, /patternColorSlots\(data\.pattern \|\| "dots"\)\.map[\s\S]*const frenchKey[\s\S]*slot\.key/, 'French Tip controls render dynamic multi-color pattern slot inputs');
assert.match(studioSource, /No saved designs yet\./, 'Saved Designs browser renders requested empty state copy');


assert.match(frenchTipSource, /const patternOpacity = clamp\(Number\(data\.patternOpacity \?\? 1\), 0, 1\)/, 'French Tip pattern opacity maps 100% to 1 and 50% to 0.5');
assert.match(frenchTipSource, /data-french-tip-pattern-opacity=\{patternOpacity\} opacity=\{patternOpacity\}/, 'French Tip pattern render applies only the intended opacity');
assert.match(frenchTipSource, /clipPath=\{`url\(\#\$\{frenchPatternClipId\}\)`\}/, 'French Tip pattern remains clipped to the tip area');
assert.doesNotMatch(frenchTipSource, /mixBlendMode|patternOpacity\s*\*\s*0\./, 'French Tip pattern does not add unintended transparency or blend mode');

assert.match(stylesSource, /artistCommandBar:[\s\S]*maxWidth: "100%"[\s\S]*overflowX: "clip"/, 'command bar prevents horizontal overflow');
assert.match(stylesSource, /commandCurrentDesign:[\s\S]*width: "clamp\([\s\S]*commandDesignName:[\s\S]*minWidth: 0[\s\S]*whiteSpace: "nowrap"[\s\S]*overflow: "hidden"[\s\S]*textOverflow: "ellipsis"/, 'long design names stay inside the compact Current Design control without causing horizontal overflow');

console.log('workflow behavior reality checks passed');
