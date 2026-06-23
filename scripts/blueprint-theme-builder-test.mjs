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

const design = { id: 'sample-design', name: 'Sample Content', shape: 'Almond', length: 'Medium', colors: ['Blush'], nails: { left: [{ shape: 'Almond', length: 0.7, width: 0.5, layers: [{ type: 'base', data: { colorHex: '#f7c7d9', polishType: 'Jelly' } }, { type: 'jewel', data: { assetId: 'crystal' } }] }] } };
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
assert.equal(themedBlueprint.designSnapshot.designId, 'sample-design', 'createBlueprintFromDesign uses the selected design id');
assert.equal(themedBlueprint.designSnapshot.jewels[0], 'crystal', 'createBlueprintFromDesign extracts real selected design jewels');
assert.equal(themedBlueprint.designSnapshot.fullSetData.nails.left[0].shape, 'Almond', 'selected design full-set data is stored in blueprint snapshot');
const metadataDesign = {
  id: 'metadata-design',
  name: 'Metadata Set',
  nails: [
    { shape: 'Coffin', length: 0.82, width: 0.44, baseColorHex: '#112233', layers: [
      { type: 'base', data: { colorHex: '#112233', polishType: 'Jelly', effect: 'Chrome' } },
      { type: 'gradient', data: { colorA: '#112233', colorB: '#445566', direction: 'aura', gradientStops: [{ color: '#112233' }, { color: '#445566' }] } },
      { type: 'pattern', data: { pattern: 'marble', patternColorHex: '#778899' } },
      { type: 'frenchTip', data: { style: 'deep', tipColorHex: '#ffffff' } },
      { type: 'charm', data: { assetId: 'bow-gold' } },
      { type: 'jewel', data: { assetId: 'crystal' } },
      { type: 'decal', data: { assetId: 'star-decal' } },
    ] },
  ],
};
const metadataBlueprint = engine.createBlueprintFromDesign(metadataDesign);
assert.equal(metadataBlueprint.designSnapshot.shape, 'Coffin', 'createBlueprintFromDesign extracts shape from saved design nails');
assert.equal(metadataBlueprint.designSnapshot.baseColor, '#112233', 'createBlueprintFromDesign extracts base color');
assert(metadataBlueprint.designSnapshot.palette.includes('#445566'), 'createBlueprintFromDesign extracts gradient colors into palette');
assert(metadataBlueprint.designSnapshot.effects.some((effect) => /Gradient aura/.test(effect)), 'createBlueprintFromDesign extracts gradient effects');
assert(metadataBlueprint.designSnapshot.chrome, 'createBlueprintFromDesign flags chrome effects');
assert(metadataBlueprint.designSnapshot.marble, 'createBlueprintFromDesign flags marble pattern effects');
assert.equal(metadataBlueprint.designSnapshot.charmCount, 1, 'createBlueprintFromDesign counts charms');
assert.equal(metadataBlueprint.designSnapshot.jewelCount, 1, 'createBlueprintFromDesign counts jewels');
assert.equal(metadataBlueprint.designSnapshot.decalCount, 1, 'createBlueprintFromDesign counts decals');
assert.equal(metadataBlueprint.designSnapshot.layerCount, 7, 'createBlueprintFromDesign extracts layer count');
assert.equal(metadataBlueprint.designSnapshot.artLevel, 'Detailed', 'createBlueprintFromDesign extracts art level');

const malformedBlueprint = engine.createBlueprintFromDesign(null, { title: 'Malformed Safe Blueprint' });
assert.equal(malformedBlueprint.title, 'Malformed Safe Blueprint', 'malformed design data falls back safely');
assert.equal(malformedBlueprint.designSnapshot.shape, 'Unknown Shape', 'malformed design shape fallback is explicit');
assert.equal(malformedBlueprint.designSnapshot.length, 'Unknown Length', 'malformed design length fallback is explicit');
assert.deepEqual(malformedBlueprint.designSnapshot.effects, ['No Effects'], 'malformed design effect fallback is explicit');
assert(!engineSource.includes('Not specified'), 'no Not specified placeholders remain in blueprint metadata helpers');

assert(shopSource.includes('data-testid="blueprint-theme-builder-controls"'), 'Blueprint Engine Preview exposes theme builder controls');
assert(shopSource.includes('data-testid="saved-design-selector"'), 'saved design selector exists');
assert(shopSource.includes('No saved designs available yet. Create a design in Design Studio first.'), 'no saved design fallback message exists');
assert(shopSource.includes("fetch('/api/designs')"), 'Blueprint Engine uses /api/designs as saved design data source');
assert(shopSource.includes('selected-design-blueprint-hero-preview'), 'FullSetRenderer hero preview renders for selected design Blueprint');
assert(shopSource.includes('sample/demo Blueprint fallback'), 'sample/demo fallback is clearly labeled');
assert(shopSource.includes('<strong>Design:</strong> {blueprint.designSnapshot.designName}'), 'library card shows design-derived Blueprint info');
assert(shopSource.includes('<strong>Design Name:</strong> {selectedLibraryBlueprint.designSnapshot.designName}'), 'detail view shows design-derived Blueprint info');
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

assert(!shopSource.includes('Full Set Composition'), 'Full Set Composition remains absent');
