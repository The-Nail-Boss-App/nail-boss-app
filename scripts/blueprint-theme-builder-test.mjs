import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const engineSource = await readFile(new URL('../client/src/blueprintEngine.js', import.meta.url), 'utf8');
const shopSource = await readFile(new URL('../client/src/NailShop.jsx', import.meta.url), 'utf8');
const designStudioSource = await readFile(new URL('../client/src/design-studio/DesignStudio.jsx', import.meta.url), 'utf8');
const proposalsSource = await readFile(new URL('../client/src/Proposals.jsx', import.meta.url), 'utf8');
const blueprintSource = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const galleryRendererSource = await readFile(new URL('../client/src/BlueprintGalleryRenderer.jsx', import.meta.url), 'utf8');

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
assert.deepEqual(engine.BLUEPRINT_STATUSES, ['Draft', 'Portfolio Ready', 'Gallery Ready'], 'status system exists');
assert.equal(engine.DEFAULT_BLUEPRINT_STATUS, 'Draft', 'Draft default exists');
assert(engine.FEATURED_BLUEPRINT_COLLECTIONS.includes('Summer Chrome'), 'collection assignment choices include Summer Chrome');
const galleryPrepBlueprint = engine.createBlueprintLibraryRecord(contentBlueprint, {
  creatorSnapshot: { creatorName: 'Anita Artist', shopName: 'AnitaSet Studio' },
  featuredCollection: 'Summer Chrome',
  creatorStory: { inspiration: 'Poolside shine', techniqueNotes: 'Chrome layering', productsUsed: 'Chrome powder, builder gel' },
});
assert.equal(galleryPrepBlueprint.status, 'Draft', 'new Blueprint Library records default to Draft status');
assert.equal(galleryPrepBlueprint.featuredCollection, 'Summer Chrome', 'collection assignment stored locally in Blueprint');
assert.equal(galleryPrepBlueprint.creatorStory.inspiration, 'Poolside shine', 'creator story inspiration stored');
assert.equal(galleryPrepBlueprint.creatorStory.techniqueNotes, 'Chrome layering', 'creator story technique notes stored');
assert.equal(galleryPrepBlueprint.creatorStory.productsUsed, 'Chrome powder, builder gel', 'creator story products used stored');
const readiness = engine.evaluateBlueprintReadiness(galleryPrepBlueprint);
assert.equal(typeof readiness.score, 'number', 'readiness score exists');
assert.equal(readiness.label, 'Gallery Ready', 'complete readiness evaluates Gallery Ready');
assert(readiness.checklist.some((item) => item.id === 'heroPreview'), 'readiness helper checks hero preview');
assert.equal(engine.evaluateBlueprintReadiness(engine.createBlueprintLibraryRecord({ title: '' })).label, 'Not Ready', 'incomplete Blueprint evaluates Not Ready');

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


const fullSetArtworkDesign = {
  id: 'artwork-design',
  name: 'Artwork Extraction Set',
  baseColorHex: '#FFA21F',
  blueprint: {
    schemaVersion: 1,
    document: {
      schemaVersion: 1,
      nails: [
        { slot: 'left-thumb', shape: 'Almond', length: 0.74, width: 0.48, layers: [
          { type: 'base', visible: true, data: { colorHex: '#FFA21F', polishType: 'Cream' } },
          { kind: 'french-tip', visible: true, name: 'White French Tip', data: { tipColorHex: '#FFFFFF' } },
          { category: 'charm', assetType: 'charm', assetId: 'heart-charm', visible: true, name: 'Heart Charm' },
          { type: 'jewel', visible: true, data: { assetId: 'cuticle-crystal' } },
          { kind: 'gem', visible: true, name: 'Cuticle Gem Dot' },
          { type: 'pattern', visible: true, data: { pattern: 'sparkle star', patternColorHex: '#FFFFFF' } },
        ] },
      ],
    },
  },
};
const artworkBlueprint = engine.createBlueprintFromDesign(fullSetArtworkDesign);
assert.equal(artworkBlueprint.designSnapshot.baseColor, '#FFA21F', 'saved full-set artwork extraction keeps orange base color');
assert(artworkBlueprint.designSnapshot.effects.some((effect) => /French Tip/i.test(effect)) || artworkBlueprint.designSnapshot.frenchTips.some((tip) => /French Tip/i.test(tip)), 'saved full-set artwork extraction detects French Tip');
assert(artworkBlueprint.designSnapshot.effects.some((effect) => /sparkle|star|pattern/i.test(effect)) || artworkBlueprint.designSnapshot.patterns.some((pattern) => /sparkle|star/i.test(pattern)), 'saved full-set artwork extraction detects sparkle/star pattern');
assert(artworkBlueprint.designSnapshot.charmCount >= 1, 'saved full-set artwork extraction counts heart charm');
assert(artworkBlueprint.designSnapshot.jewelCount >= 2, 'saved full-set artwork extraction counts jewel/gem dots');
assert(artworkBlueprint.designSnapshot.layerCount > 0, 'saved full-set artwork extraction counts visible art layers');
assert.notEqual(artworkBlueprint.designSnapshot.artSummary, 'No Effects', 'saved full-set artwork extraction writes an art summary');
assert(!JSON.stringify(artworkBlueprint.designSnapshot).includes('Not specified'), 'saved full-set artwork extraction avoids Not specified placeholders');
assert(engine.collectDesignLayers(fullSetArtworkDesign).some((layer) => layer._sourcePath.includes('design.blueprint.nails')), 'collector discovers artwork under /api/designs/:id/blueprint document nails');

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
assert(shopSource.includes("fetch(`/api/designs/${selectedSavedDesignId}/blueprint`)"), 'Blueprint Engine loads selected saved design blueprint artwork document');
assert(shopSource.includes('selected-design-blueprint-hero-preview'), 'FullSetRenderer hero preview renders for selected design Blueprint');
assert(shopSource.includes('sample/demo Blueprint fallback'), 'sample/demo fallback is clearly labeled');
assert(shopSource.includes('data-testid="blueprint-library-card-name"') && shopSource.includes('{blueprint.title}</h3>'), 'library cover card shows Blueprint name without a field label');
assert(!shopSource.includes('<strong>Title:</strong> {blueprint.title}') && !shopSource.includes('<strong>Status:</strong> {blueprint.status}'), 'library cover card removes admin-style field labels');
assert(shopSource.includes("import BlueprintGalleryRenderer from './BlueprintGalleryRenderer'"), 'library card imports the dedicated Blueprint Gallery Renderer');
assert(shopSource.includes('<BlueprintGalleryRenderer designData={blueprint.designSnapshot.fullSetData} renderMode="gallery" />'), 'library card renders artwork-only gallery renderer in gallery mode');
assert(galleryRendererSource.includes('export function createBlueprintCompositionProfile'), 'composition helper exists');
assert(galleryRendererSource.includes('maxNailLength') && galleryRendererSource.includes('maxNailWidth'), 'composition helper extracts max length and max width');
assert(galleryRendererSource.includes('safeDimension(value, fallback)') && galleryRendererSource.includes('Number.isFinite(number)') && galleryRendererSource.includes(': fallback'), 'malformed length/width values use safe fallbacks');
assert(galleryRendererSource.includes('estimatedNailFootprint') && galleryRendererSource.includes('shapeFamilies') && galleryRendererSource.includes('shapeFootprintPadding'), 'composition profile includes shape-aware footprint, families, and padding');
assert(galleryRendererSource.includes('buildGalleryGrid') && galleryRendererSource.includes('profile.maxNailLength - 0.5'), 'long nails influence grid gaps instead of artwork scale');
assert(galleryRendererSource.includes('profile.maxNailWidth - 0.5') && galleryRendererSource.includes('--gallery-cell-aspect'), 'wide nails reserve horizontal room through cell-aware sizing');
assert(galleryRendererSource.includes("rows: 2") && galleryRendererSource.includes("columns: 5") && galleryRendererSource.includes("visibleNailCount: 10"), 'composition profile preserves two rows of five and all 10 nails visible');
assert(galleryRendererSource.includes("'--gallery-cell-width': grid.cellWidth") && galleryRendererSource.includes("'--gallery-cell-height': grid.cellHeight"), 'primary gallery sizing uses grid cell width/height values');
assert(!galleryRendererSource.includes('transform: scale(') && !galleryRendererSource.includes('scaleDependency'), 'gallery primary sizing does not depend on transform scale');
assert(galleryRendererSource.includes('data-testid="blueprint-gallery-renderer"'), 'BlueprintGalleryRenderer exists');
assert(galleryRendererSource.includes("renderMode = 'gallery'") && galleryRendererSource.includes('data-render-mode={renderMode}'), 'BlueprintGalleryRenderer exposes renderMode="gallery"');
assert(galleryRendererSource.includes('getBlueprintGalleryGridStyle') && galleryRendererSource.includes("--gallery-tray-area") && galleryRendererSource.includes('buildGalleryGrid'), 'BlueprintGalleryRenderer sizes tray cells instead of scaling artwork');
assert(galleryRendererSource.includes('getGalleryArtworkViewBox') && galleryRendererSource.includes('GALLERY_DYNAMIC_VIEWBOX_LIMITS') && galleryRendererSource.includes('artworkMagnification: [1.15, 1.2]'), 'gallery renderer uses dynamic safe SVG bounds for 15-20% larger artwork without changing grid or composition logic');
assert(galleryRendererSource.includes('data-testid="blueprint-gallery-artwork-tray"') && galleryRendererSource.includes("gridTemplateRows: 'repeat(2, var(--gallery-cell-height))'") && galleryRendererSource.includes("gridTemplateColumns: 'repeat(5, var(--gallery-cell-width))'"), 'gallery renderer uses two rows of five cells');
assert(galleryRendererSource.includes('data-testid="blueprint-gallery-nail"') && galleryRendererSource.includes('NAIL_ORDER'), 'gallery renderer renders individual nails in press-on order without visible labels');
assert(galleryRendererSource.includes("contain: 'layout paint size'") && galleryRendererSource.includes("overflow: 'hidden'") && galleryRendererSource.includes("maxHeight: '100%'") && galleryRendererSource.includes("maxWidth: '100%'"), 'gallery renderer provides overflow containment and no clipping');
assert(!galleryRendererSource.includes('Full Set Composition') && !galleryRendererSource.includes('<label') && !galleryRendererSource.includes('Hero labels') && !galleryRendererSource.includes('renderer labels'), 'gallery renderer omits renderer chrome and labels');
assert(galleryRendererSource.includes('BLUEPRINT_GALLERY_PRESENTATION_THEMES') && ['luxury-tray', 'minimal-white', 'velvet-display', 'boutique', 'magazine'].every((theme) => galleryRendererSource.includes(theme)), 'gallery renderer supports future presentation theme architecture');
assert(shopSource.includes("aspectRatio: '1.08 / 1'") && shopSource.includes('minHeight: 285'), 'library cover card preview window is enlarged for cover-first artwork');
assert(shopSource.includes("overflow: 'hidden'"), 'library card preview uses overflow containment');
assert(shopSource.includes('blueprintLibraryPreviewTitle') && shopSource.includes('WebkitLineClamp: 2'), 'library card title is safely limited to two lines');
assert(shopSource.includes("overflow: 'hidden'"), 'library card preview uses overflow containment');
assert(!shopSource.includes('import NailThumbnail'), 'library card preview has no thumbnail card chrome import');
assert(!shopSource.includes('<NailThumbnail nail={nail}'), 'library card preview has no thumbnail card chrome');
assert(!shopSource.includes('slotLabel(nail.slot)'), 'library card preview has no visible finger label renderer');
assert(!shopSource.includes('<FullSetRenderer designData={blueprint.designSnapshot.fullSetData} mode="hero" compact />'), 'library cards do not show renderer chrome');
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

assert(shopSource.includes('data-testid="blueprint-featured-collection"'), 'featured collection assignment control exists');
assert(shopSource.includes('data-testid="blueprint-creator-inspiration"'), 'creator story inspiration field exists');
assert(shopSource.includes('data-testid="blueprint-creator-technique-notes"'), 'creator story technique notes field exists');
assert(shopSource.includes('data-testid="blueprint-creator-products-used"'), 'creator story products used field exists');
assert(shopSource.includes('data-testid="blueprint-prepare-gallery-button"'), 'Prepare For Gallery button exists');
assert(shopSource.includes('data-testid="blueprint-readiness-checklist"'), 'Blueprint Detail View shows readiness');
assert(shopSource.includes('data-testid="blueprint-library-card-status"') && shopSource.includes('{blueprint.status}</span>'), 'Blueprint Library shows status badge without a field label');
assert(shopSource.includes('Preparing a Blueprint for Gallery does not publish it.'), 'Gallery prep guardrail copy exists');
assert(shopSource.includes('No publishing occurred.'), 'Prepare For Gallery action confirms no publishing occurs');
assert(!shopSource.includes('/api/gallery'), 'no public Gallery publishing API is added');
assert(!shopSource.includes('/api/marketplace'), 'no Marketplace publishing API is added');

assert(!designStudioSource.includes('blueprint-theme-builder-controls'), 'Design Studio unchanged by theme builder');
assert(!proposalsSource.includes('blueprint-theme-builder-controls'), 'Proposals unchanged by theme builder');

const hero7 = blueprintSource.match(/export const SHAPES = \[(.*?)\]/s)?.[1]?.replace(/['"\s]/g, '').split(',').filter(Boolean);
assert.deepEqual(hero7, ['Almond', 'Square', 'Coffin', 'Stiletto', 'Oval', 'Round', 'Lipstick'], 'Hero 7 exact');
assert(!hero7.includes('Duck'), 'Duck hidden from visible shape list');

assert(!shopSource.includes('Full Set Composition'), 'Full Set Composition remains absent');
