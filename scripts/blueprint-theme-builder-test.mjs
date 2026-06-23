import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const engineSource = await readFile(new URL('../client/src/blueprintEngine.js', import.meta.url), 'utf8');
const shopSource = await readFile(new URL('../client/src/NailShop.jsx', import.meta.url), 'utf8');
const designStudioSource = await readFile(new URL('../client/src/design-studio/DesignStudio.jsx', import.meta.url), 'utf8');
const proposalsSource = await readFile(new URL('../client/src/Proposals.jsx', import.meta.url), 'utf8');
const blueprintSource = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');

const engine = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(engineSource)}`);
const defaults = engine.getDefaultBlueprintThemes();
assert(defaults.length >= 10, 'default themes remain available');
assert(defaults.some((theme) => theme.themeId === 'classic'), 'Classic default theme remains');
assert(defaults.some((theme) => theme.themeId === 'minimal'), 'Minimal default theme remains');

const design = { id: 'sample-design', name: 'Sample Content', shape: 'Almond', length: 'Medium', colors: ['Blush'] };
const contentTheme = engine.normalizeBlueprintTheme(defaults[0]);
const customTheme = engine.createCustomBlueprintTheme(contentTheme, {
  themeName: 'Custom Cover',
  collectionLabel: 'Custom Collection',
  primaryColor: '#123456',
  accentColor: '#abcdef',
  backgroundColor: '#101010',
  textColor: '#fefefe',
  typographyStyle: 'bold magazine',
  accentStyle: 'graphic blocks',
});
const contentBlueprint = engine.createBlueprintFromDesign(design, { title: 'Content Blueprint', tags: ['content'], theme: contentTheme });
const themedBlueprint = engine.createBlueprintFromDesign(design, { title: 'Content Blueprint', tags: ['content'], theme: customTheme });
assert.equal(engine.getBlueprintContentSignature(contentBlueprint), engine.getBlueprintContentSignature(themedBlueprint), 'content unchanged when theme presentation changes');
assert.notDeepEqual(contentBlueprint.theme, themedBlueprint.theme, 'theme presentation changes are isolated to theme');
assert.equal(themedBlueprint.designSnapshot.designName, 'Sample Content', 'theme changes do not mutate design content');

assert(shopSource.includes('data-testid="blueprint-theme-builder-controls"'), 'Blueprint Engine Preview exposes theme builder controls');
assert(shopSource.includes('data-testid="blueprint-cover-style"'), 'Blueprint cover styles visibly affect preview presentation');
assert(shopSource.includes('type="color"'), 'custom color controls are present');
assert(shopSource.includes('blueprint-typography-style'), 'typography style control is present');
assert(shopSource.includes('blueprint-accent-style'), 'accent style control is present');
assert(shopSource.includes('blueprint-collection-branding'), 'collection branding control is present');
assert(!shopSource.includes('input type="file"'), 'theme builder does not add uploads');
assert(!shopSource.includes("localStorage.setItem('blueprintTheme") && !shopSource.includes('localStorage.setItem("blueprintTheme'), 'theme builder does not add theme storage');
assert(!shopSource.includes('marketplace') || shopSource.includes('does not publish to Gallery or Marketplace'), 'no marketplace integration is added');
assert(!shopSource.includes('/api/proposals'), 'no proposal integration is added');
assert(!designStudioSource.includes('blueprint-theme-builder-controls'), 'Design Studio unchanged by theme builder');
assert(!proposalsSource.includes('blueprint-theme-builder-controls'), 'Proposals unchanged by theme builder');

const hero7 = blueprintSource.match(/export const SHAPES = \[(.*?)\]/s)?.[1]?.replace(/['"\s]/g, '').split(',').filter(Boolean);
assert.deepEqual(hero7, ['Almond', 'Square', 'Coffin', 'Stiletto', 'Oval', 'Round', 'Lipstick'], 'Hero 7 exact');
assert(!hero7.includes('Duck'), 'Duck hidden from visible shape list');
