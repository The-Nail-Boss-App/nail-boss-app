import fs from 'node:fs';
import assert from 'node:assert/strict';

const studio = fs.readFileSync('client/src/design-studio/DesignStudio.jsx', 'utf8');
const proposals = fs.readFileSync('client/src/Proposals.jsx', 'utf8');
const blueprintEngine = fs.readFileSync('client/src/blueprintEngine.js', 'utf8');

const sidebarStart = studio.indexOf('<aside style={UI.panel}><div style={UI.panelPad}>');
const mainStart = studio.indexOf('<main style=', sidebarStart);
const leftSidebar = studio.slice(sidebarStart, mainStart);

assert.match(studio, /const applyCurrentPolish = \(scope\) => \{[\s\S]*rememberPolishColor\(committedColor\)[\s\S]*commit\(applyBaseToSlots[\s\S]*setCommandPopover\(""\)/, 'Polish Rack should update only from committed polish application and close command quick controls.');
assert.doesNotMatch(studio, /function updateBase\(patch\) \{\s*if \(patch\.baseColorHex/, 'Browsing polish colors through updateBase must not remember rack history.');
assert.doesNotMatch(leftSidebar, /title="Full-Set Actions"|<BulkActionsPanel/, 'Legacy Full-Set Actions sidebar panel should be removed.');
assert.doesNotMatch(leftSidebar, /title="French Tip Precision"/, 'Legacy French Tip sidebar panel should be removed.');
assert.doesNotMatch(studio, /title="Developer Geometry Tools"|Shape Debug Overlay<\/label>/, 'Developer Geometry Tools must be hidden from production UI.');
assert.match(studio, /PANEL_GROUPS[\s\S]*nailBasics[\s\S]*signatureLooks[\s\S]*designDetails[\s\S]*artTools[\s\S]*properties[\s\S]*layers/, 'Creative Drawer panel groups should be defined.');
assert.match(studio, /group\.reduce\(\(state, panelId\)[\s\S]*panelId === id \? !prev\[id\] : false/, 'Opening one Creative Drawer panel should collapse siblings.');
assert.match(studio, /data-testid="current-polish-bottle"[\s\S]*onClick=\{openPolishRack\}/, 'Current Polish Bottle should open Polish Studio.');
assert.match(studio, /data-testid="creative-library-polish-studio"[\s\S]*<PolishColorControls/, 'Creative Library should retain a full Polish Studio control path.');
assert.match(studio, /data-canvas-safe-placement="left-creative-library-anchor"[\s\S]*Canvas-safe marker/, 'Command-bar Polish Studio popover should be designed not to cover the hero canvas.');
assert.match(studio, /<div style=\{UI\.sectionTitle\}>Polish Studio<\/div>[\s\S]*Polish Color[\s\S]*HEX[\s\S]*Polish Type[\s\S]*Active nail[\s\S]*Current hand[\s\S]*Full set/, 'Polish Studio should contain polish color, HEX, Polish Type, and apply scopes.');
assert.match(studio, /Polish Rack™[\s\S]*Recently Used Polish/, 'Polish Studio should retain Polish Rack and recently used polish.');
assert.match(studio, /data-testid="artist-command-bar"/, 'Artist Command Bar should be preserved.');
assert.match(studio, /data-testid="polish-rack"/, 'Polish Rack should be preserved.');
assert.match(studio, /data-testid="current-polish-bottle"/, 'Current Polish Bottle should be preserved.');
assert.match(studio, /<NailCanvas/, 'Hero Canvas should be preserved.');
assert.match(studio, /<FullSetPreview/, 'Nail Stack should be preserved.');
assert.doesNotMatch(studio, /Hero 7|Duck|Full Set Composition/, 'Hero 7 exact guardrails remain clean: Duck hidden and Full Set Composition absent from studio UI.');
assert.ok(proposals.length > 0 && blueprintEngine.length > 0, 'Proposal and Blueprint files are only read by this test.');

console.log('Workspace Decluttering UI guardrails passed.');
