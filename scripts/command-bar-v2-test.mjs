import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const studio = await readFile('client/src/nail-design-studio/NailDesignStudio.jsx', 'utf8');
const styles = await readFile('client/src/nail-design-studio/NailDesignStudio.css', 'utf8');
const barStart = studio.indexOf('data-testid="nail-design-studio-command-bar"');
const ribbonStart = studio.indexOf('className="nail-design-studio__tool-ribbon"');
const bar = studio.slice(barStart, ribbonStart);

assert(barStart >= 0 && barStart < ribbonStart, 'Command Bar precedes the Nail Kit category toolbar');
assert.match(bar, /<h1><span>Nail<\/span><span>Design Studio<sup>™<\/sup><\/span><\/h1>/, 'studio title has two approved stacked lines');
assert(!bar.includes('anitaset-logo'), 'Command Bar has no AnitaSet logo');
for (const heading of ['Design', 'Edit', 'Publish', 'Info']) assert(bar.includes(`<h2>${heading}</h2>`), `${heading} heading is represented`);
for (const command of ['New', 'Open', 'Duplicate', 'Save Changes', 'Saving…', 'Saved', 'Undo', 'Redo', 'Share', 'Export', 'Add to Collection', 'Design Details']) assert(studio.includes(command), `${command} is represented`);
assert.match(studio, /onBlur=\{commitRename\}/, 'blur commits inline rename');
assert.match(studio, /event\.key === 'Enter'[\s\S]*event\.key === 'Escape'/, 'Enter commits and Escape cancels inline rename');
assert.match(studio, /maxLength=\{64\}/, 'inline rename retains an explicit length rule');
assert.match(studio, /disabled: !history\.length[\s\S]*disabled: !future\.length/, 'Undo and Redo use correct disabled state');
assert.match(styles, /command-bar \{[\s\S]*grid-template-columns:[\s\S]*height: 84px;[\s\S]*padding: 10px 24px 8px;/, 'desktop Command Bar uses approved bounded grid and dimensions');
assert.match(styles, /command-button \{[\s\S]*border: 0;[\s\S]*border-radius: 0;[\s\S]*background: transparent;/, 'commands use an unboxed treatment');
assert.match(styles, /design-control \{[\s\S]*height: 48px;[\s\S]*padding: 7px 14px 6px;/, 'Current Design uses the approved nameplate sizing');
assert.match(styles, /@media \(max-width: 1280px\)[\s\S]*@media \(max-width: 1120px\)/, 'tested desktop widths receive responsive protections');
assert(!styles.includes('justify-content: space-between'), 'Command Bar does not distribute dead space with space-between');
assert(!bar.includes('design-studio/DesignStudio'), 'legacy studio is not mounted');
console.log('Final Nail Design Studio command bar checks passed');
