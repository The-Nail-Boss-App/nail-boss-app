import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const studio = await readFile('client/src/nail-design-studio/NailDesignStudio.jsx', 'utf8');
const styles = await readFile('client/src/nail-design-studio/NailDesignStudio.css', 'utf8');
const barStart = studio.indexOf('data-testid="nail-design-studio-command-bar"');
const ribbonStart = studio.indexOf('className="nail-design-studio__tool-ribbon"');
const bar = studio.slice(barStart, ribbonStart);

assert(barStart >= 0 && barStart < ribbonStart, 'Command Bar precedes the category toolbar');
assert.match(bar, /src="\/anitaset-logo-main\.png"[\s\S]*<h1>Nail Design Studio<sup>™<\/sup><\/h1>/, 'official logo precedes the exact studio heading');
assert(!studio.includes('The World’s Most Beautiful Luxury Digital Nail Desk.'), 'banned tagline is absent');
for (const command of ['New', 'Open', 'Current Design', 'Duplicate', 'Save Changes', 'Saved', 'Undo', 'Redo', 'Share', 'Export', 'Add to Collection', 'Design Details'])
  assert(bar.includes(command), `${command} is represented in the Command Bar`);
assert.match(bar, /command\('Open', 'open', openSavedDesigns/, 'Open reuses the saved-design workflow');
assert.match(bar, /onClick=\{openSavedDesigns\}[\s\S]*aria-label=\{`Current Design: \$\{designName\}`\}/, 'Current Design reuses the saved-design state and workflow');
assert.match(bar, /dirty \? 'Save Changes' : 'Saved'[\s\S]*saveDesign/, 'Save retains smart state');
assert.match(bar, /command\('Undo'[\s\S]*disabled: true[\s\S]*command\('Redo'[\s\S]*disabled: true/, 'Undo and Redo preserve disabled logic');
assert.match(styles, /command-bar[\s\S]*max-width: 100%[\s\S]*overflow: hidden/, 'Command Bar bounds horizontal overflow');
assert.match(styles, /command-row[\s\S]*flex-wrap: nowrap/, 'Command controls cannot wrap');
assert.match(styles, /@media \(max-width: 1160px\)[\s\S]*command-button span[\s\S]*clip-path: inset\(50%\)/, 'narrow desktops use compact icon-only commands');
assert(!bar.includes('design-studio/DesignStudio'), 'legacy studio is not mounted');
console.log('New Nail Design Studio command bar checks passed');
