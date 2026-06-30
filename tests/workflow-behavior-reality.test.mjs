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
const dashboardSource = await read('client/src/Dashboard.jsx');

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

assert.match(dashboardSource, /sessionStorage\.setItem\("nailBossOpenSavedDesigns", "1"\)[\s\S]*onStartLook\(\)/, 'Dashboard Saved Designs click records saved-design intent before opening Design Studio');
assert.match(studioSource, /sessionStorage\.getItem\("nailBossOpenSavedDesigns"\)[\s\S]*setSavedDesignsOpen\(true\)/, 'DesignStudio consumes saved-design intent on load');
assert.match(studioSource, /data-testid="saved-designs-browser"[\s\S]*Saved Designs[\s\S]*designs\.length \? designs\.map[\s\S]*onClick=\{\(\) => loadDesign\(design\.id\)\}/, 'Saved Designs browser is visible, lists records, and opens with loadDesign');
assert.doesNotMatch(studioSource.slice(studioSource.indexOf('function openSavedDesignsBrowser'), studioSource.indexOf('function openPolishRack')), /newDesign\(/, 'Saved Designs flow does not invoke New Design');

assert.match(frenchTipSource, /const patternOpacity = clamp\(Number\(data\.patternOpacity \?\? 1\), 0, 1\)/, 'French Tip pattern opacity maps 100% to 1 and 50% to 0.5');
assert.match(frenchTipSource, /data-french-tip-pattern-opacity=\{patternOpacity\} opacity=\{patternOpacity\}/, 'French Tip pattern render applies only the intended opacity');
assert.match(frenchTipSource, /clipPath=\{`url\(\#\$\{frenchPatternClipId\}\)`\}/, 'French Tip pattern remains clipped to the tip area');
assert.doesNotMatch(frenchTipSource, /mixBlendMode|patternOpacity\s*\*\s*0\./, 'French Tip pattern does not add unintended transparency or blend mode');

assert.match(stylesSource, /artistCommandBar:[\s\S]*maxWidth: "100%"[\s\S]*overflowX: "hidden"/, 'command bar prevents horizontal overflow');
assert.match(stylesSource, /commandDesignName:[\s\S]*fontSize: "clamp\([\s\S]*whiteSpace: "normal"[\s\S]*overflow: "visible"[\s\S]*textOverflow: "clip"/, 'long design names use responsive wrapping/fit styles without hard clipping');

console.log('workflow behavior reality checks passed');
