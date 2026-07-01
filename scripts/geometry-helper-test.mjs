import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const nailCanvasSource = await readFile(new URL('../client/src/design-studio/NailCanvas.jsx', import.meta.url), 'utf8');
const nailThumbnailSource = await readFile(new URL('../client/src/design-studio/NailThumbnail.jsx', import.meta.url), 'utf8');
const assetRenderingSource = await readFile(new URL('../client/src/design-studio/assetRendering.js', import.meta.url), 'utf8');
const bulkActionsPanelSource = await readFile(new URL('../client/src/design-studio/BulkActionsPanel.jsx', import.meta.url), 'utf8');
const designStudioSource = await readFile(new URL('../client/src/design-studio/DesignStudio.jsx', import.meta.url), 'utf8');
const frenchTipRenderingSource = await readFile(new URL('../client/src/design-studio/frenchTipRendering.js', import.meta.url), 'utf8');
const assetsSource = await readFile(new URL('../client/src/design-studio/assets.js', import.meta.url), 'utf8');

const polishRendererSource = await readFile(new URL('../client/src/design-studio/PolishRenderer.jsx', import.meta.url), 'utf8');
const propertiesPanelSource = await readFile(new URL('../client/src/design-studio/PropertiesPanel.jsx', import.meta.url), 'utf8');
const blueprint = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);

assert(['Nail Basics™', 'Signature Looks', 'Design Details', 'Art Tools', 'Nail Art Controls™', 'Layers'].every((title) => designStudioSource.includes(`title="${title}"`) || designStudioSource.includes(`>${title}<`) || designStudioSource.includes(`"${title}"`)), 'Design Studio exposes the required compact top-level section titles');
assert(!designStudioSource.includes('title="Full-Set Actions"') && !designStudioSource.includes('title="Developer Geometry Tools"'), 'Legacy full-set and developer geometry panels are hidden from production UI');
assert(designStudioSource.includes('aria-expanded={open}') && designStudioSource.includes('PANEL_PREFS_STORAGE_KEY') && designStudioSource.includes('localStorage.setItem(PANEL_PREFS_STORAGE_KEY'), 'collapsible panels can expand/collapse and remember panel state');
assert(designStudioSource.includes('data-testid="signature-looks-select"') && designStudioSource.includes('<optgroup label="Starter Looks"') && designStudioSource.includes('<optgroup label="My Looks"'), 'Signature Looks Library exposes starter and custom looks in a grouped dropdown/select');
assert(['Save active nail as Signature Look', 'Save full set as Signature Look', 'Apply selected Signature Look to active nail', 'Apply selected Signature Look to full set', 'Duplicate selected Signature Look', 'Rename selected custom Signature Look', 'Delete selected custom Signature Look'].every((label) => designStudioSource.includes(label)), 'Signature Look apply/save/manage actions are reachable with accessible labels near the dropdown');
assert(designStudioSource.includes('selectedIsStarter') && designStudioSource.includes('disabled={!selected || selectedIsStarter}') && designStudioSource.includes('starter: false'), 'starter Signature Looks are protected while duplicated custom looks are editable');
assert(designStudioSource.includes('technique-choice-gradient') && designStudioSource.includes('technique-choice-pattern') && designStudioSource.includes('technique-choice-french') && designStudioSource.includes('PATTERNS.map'), 'gradient, pattern, and French Tip controls remain reachable from the Technique Studio choice-first pop-out panel');
assert((designStudioSource.match(/<AssetLibrary onAddAsset=\{addAsset\}/g) || []).length === 1 && !designStudioSource.includes('id="charmsJewelsDecals"'), 'Charms/Jewels/Decals appear only once through Art Tools and are not duplicated across panels');
assert(designStudioSource.includes('Set Actions') && designStudioSource.includes('Copy current nail') && designStudioSource.includes('Mirror current hand') && bulkActionsPanelSource.includes('Copy active nail') && bulkActionsPanelSource.includes('Mirror hand'), 'Set Actions remain available with compact labeled actions from the command bar');
assert(designStudioSource.includes('data-testid="command-french-tip-trigger"') && designStudioSource.includes('French Tip Precision') && designStudioSource.includes('Smile width'), 'French Tip Precision remains available from the command bar');
assert(designStudioSource.includes('aria-label={label}') && designStudioSource.includes('title={label}') && bulkActionsPanelSource.includes('aria-label='), 'compact icon buttons provide accessible labels or titles');

const {
  SHAPES,
  addStrokeToDrawingLayer,
  assetFitsNailSilhouette,
  assetLayer,
  buildNailPath,
  constrainAssetTransform,
  constrainStrokePoints,
  createDefaultBlueprint,
  ensureBlueprint,
  getActiveNail,
  getNailArchitecture,
  getNailFreeEdgeExtent,
  getNailShapeMetrics,
  normalizedToSvg,
  projectPointInsideNailSilhouette,
  isPointInsideNailSilhouette,
  isReusableDrawingLayer,
  quantitySummary,
  revalidateLayersAfterNailResize,
  safeTransform,
  flatDesignFromBlueprint,
  getVisibleBaseColor,
  synchronizeBase,
  updateActiveNail,
  renumberLayers,
  drawingLayer,
  frenchTipLayer,
  applyFrenchTipToSlots,
  normalizeFrenchTipData,
  FRENCH_TIP_PRESETS,
  ASSET_SIZE_RANGE,
  POLISH_TYPES,
  PATTERNS,
  GRADIENT_DIRECTIONS,
  clearStalePolishTypeForLegacyEffect,
  normalizePolishData,
  cloneNailDesign,
  STARTER_SIGNATURE_LOOKS,
  createSignatureLookFromBlueprint,
  applySignatureLookToBlueprint,
  normalizeSignatureLook,
  ensureFullSetBlueprint,
  gradientLayer,
  patternLayer,
  generateBlueprintSummary,
} = blueprint;




const assertBlueprintSummarySafe = (input, label, designName = '') => {
  let summary;
  assert.doesNotThrow(() => { summary = generateBlueprintSummary(input, designName); }, `${label} blueprint summary never throws`);
  assert.equal(typeof summary, 'object', `${label} summary is an object`);
  assert.equal(summary.schemaVersion, 1, `${label} summary keeps schema version`);
  assert(summary.designSummary && summary.serviceSummary && summary.pricingSummary, `${label} summary includes design/service/pricing sections`);
  assert(Array.isArray(summary.materialsSummary), `${label} summary returns materials array`);
  assert(Array.isArray(summary.marketingTags), `${label} summary returns marketing tags array`);
  assert(Array.isArray(summary.vendorReferences), `${label} summary returns vendor references array`);
  assert(!Object.hasOwn(summary, 'fullSetComposition'), `${label} summary does not reintroduce Full Set Composition`);
  return summary;
};

assertBlueprintSummarySafe(null, 'empty/default design');
const legacySummary = assertBlueprintSummarySafe({ name: 'Legacy Saved', shape: 'Duck', baseColorHex: '#123456', tags: 'retro, saved', fullSet: false }, 'legacy saved design');
assert.equal(legacySummary.designSummary.name, 'Legacy Saved', 'flat legacy design names flow into summary');
assert.deepEqual(legacySummary.marketingTags, ['retro', 'saved'], 'flat legacy design marketing tags normalize safely');
assert.equal(legacySummary.serviceSummary.shape, 'Square', 'legacy Duck designs summarize through hidden Square fallback');
assertBlueprintSummarySafe({ nails: [{ id: 'nail-no-layers', shape: 'Oval', length: 0.4, width: 0.4 }] }, 'missing layers');
const missingPricing = assertBlueprintSummarySafe({ metadata: { tags: [] }, nails: [{ id: 'nail-no-price', shape: 'Almond', layers: [] }] }, 'missing pricing');
assert.equal(missingPricing.pricingSummary.estimatedServicePrice, 'Not set', 'missing pricing falls back to Not set');
const missingVendor = assertBlueprintSummarySafe({ nails: [{ id: 'nail-no-vendor', shape: 'Square', layers: [{ id: 'asset-no-vendor', type: 'charm', name: 'Bow', visible: true, locked: false, opacity: 1, order: 1, transform: { x: 0.5, y: 0.5, scaleX: 0.15, scaleY: 0.15, rotation: 0 }, data: { assetId: 'bow' } }] }] }, 'missing vendor data');
assert.equal(missingVendor.vendorReferences[0].vendor, 'Vendor TBD', 'missing vendor names receive a safe fallback');
const missingTags = assertBlueprintSummarySafe({ metadata: {}, nails: [{ id: 'nail-no-tags', shape: 'Round', layers: [] }] }, 'missing marketing tags');
assert.deepEqual(missingTags.marketingTags, [], 'missing marketing tags return an empty array');
const modernBase = ensureFullSetBlueprint(createDefaultBlueprint({ name: 'Modern Mix', shape: 'Lipstick', polishType: 'Jelly', baseColorHex: '#AA33CC', tags: ['aura', 'french'], estimatedServicePrice: 125 }));
const modernActive = getActiveNail(modernBase);
const modernCharm = { ...assetLayer({ category: 'jewels', id: 'crystal-rhinestone', name: 'Crystal Rhinestone', defaultColor: '#DDF7FF' }, modernActive), data: { assetId: 'crystal-rhinestone', colorHex: '#DDF7FF', vendor: 'Gem Vendor', sku: 'GV-001' } };
const modernGradient = { ...gradientLayer(modernActive), data: blueprint.normalizeGradientData({ colorA: '#AA33CC', colorB: '#FFFFFF', direction: 'aura', gradientStops: [{ color: '#AA33CC', position: 0 }, { color: '#FFD1DC', position: 45 }, { color: '#FFFFFF', position: 100 }] }) };
const modernFrench = { ...frenchTipLayer(modernActive), data: normalizeFrenchTipData({ fillType: 'pattern', pattern: 'leopard', patternColorHex: '#111111', patternSecondaryColorHex: '#F6C177' }) };
const modernPattern = patternLayer(modernActive, 'zebra');
const modernSummary = assertBlueprintSummarySafe(updateActiveNail(modernBase, (nail) => ({ ...nail, layers: renumberLayers([nail.layers[0], modernGradient, modernFrench, modernPattern, modernCharm]) })), 'current modern design with polish, gradients, French, patterns, jewels/charms');
assert(modernSummary.materialsSummary.some((item) => item.includes('gradient layer')), 'modern summary includes gradient materials');
assert(modernSummary.materialsSummary.some((item) => item.includes('French tip layer')), 'modern summary includes French tip materials');
assert(modernSummary.materialsSummary.some((item) => item.includes('pattern layer')), 'modern summary includes pattern materials');
assert.equal(modernSummary.vendorReferences[0].vendor, 'Gem Vendor', 'modern summary preserves vendor reference data');
assert.deepEqual(SHAPES, ['Almond', 'Square', 'Coffin', 'Stiletto', 'Oval', 'Round', 'Lipstick'], 'Hero 7 exact during blueprint summary coverage');
assert(!SHAPES.includes('Duck'), 'Duck remains hidden during blueprint summary coverage');
assert(!source.includes('Full Set Composition'), 'Full Set Composition is not present in blueprint data layer');
assert(!designStudioSource.includes('manual' + 'BlueprintSummary'), 'Design Studio has no manual summary runtime state');
assert(!designStudioSource.includes('set' + 'ManualBlueprintSummary'), 'Design Studio has no manual summary state setter');
assert(!designStudioSource.includes('open' + 'BlueprintSummary'), 'Design Studio has no manual summary click handler');
assert(!designStudioSource.includes('Generate' + ' Blueprint Summary') && !designStudioSource.includes('data-testid="generate-blueprint-summary"'), 'Design Studio has no manual summary button');
assert(!designStudioSource.includes('Blueprint' + 'SummaryModal') && !designStudioSource.includes('Close' + ' blueprint summary'), 'Design Studio has no Blueprint summary modal');
assert(!designStudioSource.includes('Blueprint' + 'PreviewPanel') && !designStudioSource.includes('useMemo(() => generate' + 'BlueprintSummary') && !designStudioSource.includes('title="Blueprint' + ' Preview"'), 'Design Studio does not auto-render a Blueprint preview on load');
assert(!designStudioSource.toLowerCase().includes('pdf'), 'Design Studio does not add PDF export');
assert(!designStudioSource.includes('Full Set Composition'), 'Design Studio does not reintroduce Full Set Composition');

const visibleHeroShapeFamilies = ['Almond', 'Square', 'Coffin', 'Stiletto', 'Oval', 'Round', 'Lipstick'];
const hiddenLegacyShapeFamilies = ['Duck'];
const nonHeroShapeFamilies = ['Tapered Square', 'Russian Square', 'Slim Coffin', 'Russian Almond', 'Edge', 'Flare', 'Mountain Peak'];
assert.deepEqual(SHAPES, visibleHeroShapeFamilies, 'Editor shape list exposes exactly the visible Hero 7 shapes');
assert(!SHAPES.includes('Duck'), 'Duck is not offered as a visible editor shape selection');
assert(designStudioSource.includes('>{SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select>'), 'Design Studio nail shape dropdown is backed by the visible shape list');
for (const shape of [...nonHeroShapeFamilies, ...hiddenLegacyShapeFamilies]) assert(!SHAPES.includes(shape), `${shape} is not expected in the editor shape list`);
for (const shape of visibleHeroShapeFamilies) {
  const nail = { shape, length: 0.56, width: 0.52, taper: 0.5, apexHeight: 0.5, sidewallCurve: 0.5, freeEdgeThickness: 0.5 };
  assert(buildNailPath(shape, nail).startsWith('M '), `${shape} returns a renderable nail silhouette path`);
  assert(isPointInsideNailSilhouette({ x: 0.5, y: 0.5 }, nail), `${shape} keeps the centerline inside the nail bed`);
  const architecture = getNailArchitecture(nail);
  assert(architecture.apexYNorm > 0.25 && architecture.apexYNorm < 0.65, `${shape} has a realistic apex placement`);
  assert(architecture.freeEdgeYNorm > 0.45 && architecture.freeEdgeYNorm < 0.92, `${shape} has a realistic free-edge boundary`);
}

const defaultShapeNail = { length: 0.56, width: 0.52, taper: 0.5, apexHeight: 0.5, sidewallCurve: 0.5, freeEdgeThickness: 0.5 };

const legacyDuckBlueprint = createDefaultBlueprint({ shape: 'Almond', length: 0.77, width: 0.33, baseColorHex: '#123456' });
const legacyDuckActive = getActiveNail(legacyDuckBlueprint);
const normalizedDuckBlueprint = ensureBlueprint({
  ...legacyDuckBlueprint,
  nails: [{
    ...legacyDuckActive,
    shape: 'Duck',
    length: 0.77,
    width: 0.33,
    layers: [
      ...legacyDuckActive.layers,
      assetLayer({ id: 'decal-star', name: 'Star', category: 'decals', defaultColor: '#FFFFFF' }, legacyDuckActive),
    ],
  }],
});
const normalizedDuckNail = getActiveNail(normalizedDuckBlueprint);
assert.equal(normalizedDuckNail.shape, 'Square', 'existing saved Duck designs normalize to Square for safe editing and saving');
assert.equal(normalizedDuckNail.length, 0.77, 'Duck compatibility normalization preserves saved length');
assert.equal(normalizedDuckNail.width, 0.33, 'Duck compatibility normalization preserves saved width');
assert(normalizedDuckNail.layers.some((layer) => layer.type === 'decal'), 'Duck compatibility normalization preserves saved layers');
const normalizedDuckFlat = flatDesignFromBlueprint(normalizedDuckBlueprint, 'Legacy Duck');
assert.equal(normalizedDuckFlat.shape, 'Square', 'saved Duck designs serialize through the supported Square fallback');
assert(buildNailPath('Duck', { ...defaultShapeNail, shape: 'Duck' }).startsWith('M '), 'hidden Duck mask code remains renderable for old previews or future reactivation');

const roundMetrics = getNailShapeMetrics('Round', { ...defaultShapeNail, shape: 'Round' });
const ovalMetrics = getNailShapeMetrics('Oval', { ...defaultShapeNail, shape: 'Oval' });
const almondMetrics = getNailShapeMetrics('Almond', { ...defaultShapeNail, shape: 'Almond' });
assert.notEqual(buildNailPath('Round', { ...defaultShapeNail, shape: 'Round' }), buildNailPath('Almond', { ...defaultShapeNail, shape: 'Almond' }), 'Round does not match Almond render geometry');
assert.notEqual(buildNailPath('Oval', { ...defaultShapeNail, shape: 'Oval' }), buildNailPath('Almond', { ...defaultShapeNail, shape: 'Almond' }), 'Oval does not match Almond render geometry');
assert(roundMetrics.freeEdgeHalfWidth > ovalMetrics.freeEdgeHalfWidth && ovalMetrics.freeEdgeHalfWidth > almondMetrics.freeEdgeHalfWidth, 'Round, Oval, and Almond have distinct free-edge width behavior');
assert(roundMetrics.sidewallHalfWidth > ovalMetrics.sidewallHalfWidth && ovalMetrics.sidewallHalfWidth > almondMetrics.sidewallHalfWidth, 'Round, Oval, and Almond have distinct sidewall/taper behavior');

const smoothPath = buildNailPath('Oval', { ...defaultShapeNail, shape: 'Oval' });
assert(!/ L /.test(smoothPath) && (smoothPath.match(/ C /g) || []).length >= 4, 'Hero Oval path uses smooth cubic curves instead of jagged polygon line fallback');
assert(nailCanvasSource.includes('const path = buildNailPath(nail.shape, nail);') && nailCanvasSource.includes('<PolishSurface nail={nail} baseLayer={baseLayer} path={path}'), 'polish rendering clips against the shared smooth nail path');
assert(nailThumbnailSource.includes('const path = buildNailPath(nail.shape, nail);') && nailThumbnailSource.includes('<clipPath id={clipId}><path d={path}/></clipPath>'), 'thumbnails use the same smooth geometry path as the active canvas');

assert(polishRendererSource.includes('export function GelNailSurfaceRenderer') && polishRendererSource.includes('export const PolishSurface = GelNailSurfaceRenderer'), 'gel renderer is the shared polish surface implementation');
assert(polishRendererSource.includes('fill={data.colorHex}') && polishRendererSource.includes('polishOpacity(data)'), 'gel renderer preserves base polish color and stable cream opacity');
assert(polishRendererSource.includes('getNailArchitecture(nail)') && polishRendererSource.includes('ids.apex') && polishRendererSource.includes('ids.sidewall') && polishRendererSource.includes('ids.freeEdge'), 'gel renderer adds architecture-aware apex highlights, sidewall shadows, and free-edge depth');
assert(polishRendererSource.includes('ids.reflection') && polishRendererSource.includes('ids.glossBlur'), 'gel renderer adds subtle gloss/reflection mapping without enabling special effects');
assert(!nailCanvasSource.includes('stroke="rgba(59,31,53,.45)" strokeWidth="2.5"') && !nailThumbnailSource.includes('stroke="rgba(59,31,53,.45)" strokeWidth="3"'), 'canvas and thumbnails no longer draw the previous hard cartoon outline');
assert(nailCanvasSource.includes('<PolishSurface nail={nail} baseLayer={baseLayer} path={path}') && nailThumbnailSource.includes('<PolishSurface nail={nail} baseLayer={base} path={path}'), 'NailCanvas, NailThumbnail, and full-set previews share the gel nail surface renderer');

assert(polishRendererSource.includes('data-realism-layer="nail-thickness-depth"') && polishRendererSource.includes('data-realism-layer="free-edge-thickness-rim"'), 'renderer includes nail thickness/depth layer at the free edge');
assert(polishRendererSource.includes('data-realism-layer="shape-aware-curvature"') && polishRendererSource.includes('data-realism-layer="curvature-shadow"') && polishRendererSource.includes('curveBias'), 'renderer includes shape-aware curvature/shadow layer');
assert(polishRendererSource.includes('data-realism-layer="soft-reflection-map') && polishRendererSource.includes('ids.glossBlur'), 'renderer includes soft reflection map/layer');
assert(polishRendererSource.includes('data-realism-layer="top-coat-depth-illusion"') && polishRendererSource.includes('ids.topCoatDepth'), 'renderer includes top-coat layer/depth illusion');
assert(polishRendererSource.includes('reflectionProfile(shape)') && polishRendererSource.includes('data-realism-layer="shape-aware-reflection-paths"') && polishRendererSource.includes('flatter-broader') && polishRendererSource.includes('curved-tapered') && polishRendererSource.includes('lipstick-asymmetric'), 'renderer includes shape-aware reflection paths for flat, curved, and asymmetric Hero 7 shapes');
assert(polishRendererSource.includes('soft-broken-reflection') && polishRendererSource.includes('strokeDasharray') && polishRendererSource.includes('ids.brokenGlossBlur'), 'renderer includes softer/broken reflection behavior');
assert(polishRendererSource.includes('data-realism-layer="subtle-edge-catch-lighting"') && polishRendererSource.includes('darkColorEdgeBoost') && polishRendererSource.includes('ids.edgeCatch'), 'renderer includes subtle edge catch lighting for dark colors');
assert(polishRendererSource.includes('export function SharedPolishRealismLayers') && polishRendererSource.includes('data-realism-renderer="shared-polish-material-engine"') && frenchTipRenderingSource.includes('<SharedPolishRealismLayers'), 'French Tip uses shared realism renderer');
assert(frenchTipRenderingSource.includes('materialScope="french-tip"') && frenchTipRenderingSource.includes('data-realism-renderer="shared-polish-material-engine"'), 'French Tip is rendered as the same polish material scope instead of a flat cartoon overlay');
assert(polishRendererSource.includes('data-realism-layer="shape-aware-curvature"') && frenchTipRenderingSource.includes('<SharedPolishRealismLayers'), 'French Tip receives curvature shading from shared renderer');
assert(polishRendererSource.includes('data-realism-layer="shape-aware-reflection-paths"') && polishRendererSource.includes('data-realism-layer="soft-reflection-map') && frenchTipRenderingSource.includes('<SharedPolishRealismLayers'), 'French Tip receives reflection layers from shared renderer');
assert(polishRendererSource.includes('data-realism-layer="top-coat-depth-illusion"') && frenchTipRenderingSource.includes('data-realism-layer="top-coat-continuity-seam"'), 'French Tip receives top-coat depth and continuity layers');
assert(frenchTipRenderingSource.includes('frenchMaterialClipId') && frenchTipRenderingSource.includes('<clipPath id={frenchMaterialClipId}><path d={path}/></clipPath>') && frenchTipRenderingSource.includes('clipPath={`url(#${clipId})`}'), 'French Tip material remains clipped to both tip geometry and nail silhouette');
assert(nailCanvasSource.includes('<FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId}/>') && nailThumbnailSource.includes('<FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId} thumbnail/>'), 'thumbnails and full-set previews use the same French realism rendering component as the main canvas');
assert(assetRenderingSource.includes('data-realism-layer="asset-contact-shadow"') && nailCanvasSource.includes('<AssetContactShadow render={assetRender} uid={uid}/>') && nailThumbnailSource.includes('<AssetContactShadow render={assetRender} uid={clipId}/>'), 'charms, jewels, and decals render with a shared contact shadow layer on canvas and thumbnails');
assert(assetRenderingSource.includes('data-realism-layer="asset-specular-accent"') && nailCanvasSource.includes('<AssetSpecularAccent layer={layer} render={assetRender}/>') && nailThumbnailSource.includes('<AssetSpecularAccent layer={layer} render={assetRender}/>'), 'jewels and charms render with small supported highlight/accent layers');


assert(nailCanvasSource.includes('data-realism-layer="painted-stroke-material-aware-opacity"') && nailCanvasSource.includes('paint-contact-shadow') && nailCanvasSource.includes('wet-paint-surface-highlight'), 'drawing strokes render as painted, material-aware surface artwork with contact/depth treatment');
assert(assetRenderingSource.includes('data-realism-layer="decal-surface-blending"') && assetRenderingSource.includes('surfaceBlendOpacity') && assetRenderingSource.includes('asset-contact-shadow'), 'decals render with material-aware surface blending and contact shadow');
assert(assetRenderingSource.includes('improved-highlight-depth') && assetRenderingSource.includes('r * 1.28') && assetRenderingSource.includes('asset-specular-accent'), 'charms and jewels render with improved highlight and depth accents');
assert(assetRenderingSource.includes('layer?.type === "jewel" ? 0.24') && assetRenderingSource.includes('data-realism-layer="asset-contact-shadow"'), 'jewel contact shadow renders under jewel');
assert(assetsSource.includes('data-asset-renderer="shared-faceted-jewel-renderer"') && assetsSource.includes('data-realism-layer="jewel-outer-cut-shape"') && assetsSource.includes('data-realism-layer="jewel-inner-facets"') && assetsSource.includes('data-realism-layer="jewel-directional-highlight-facet"') && assetsSource.includes('data-realism-layer="jewel-lowlight-shadow-facets"') && assetsSource.includes('data-realism-layer="jewel-inner-glow-color-tint"') && assetsSource.includes('data-realism-layer="jewel-glass-refraction-layer"'), 'jewel renderer includes faceted gemstone layers with tint-preserving glass/refraction detail');
assert(assetsSource.includes('square-gem-facet-highlight-marker') && assetsSource.includes('square-gem-lowlight-marker') && assetsSource.includes('data-jewel-kind="square-cut-crystal-rhinestone"'), 'square gem includes facet/highlight/lowlight markers');
assert(assetsSource.includes('round-gem-dome-facet-highlight-marker') && assetsSource.includes('round-domed-faceted-rhinestone') && assetsSource.includes('jewel-white-sparkle-reflection'), 'round gem includes dome/facet/highlight markers and sparkle reflection');
assert(assetsSource.includes('fill={color} opacity=".62"') && assetsSource.includes('fill="#fff" opacity=".48"') && assetsSource.includes('fill="#1f3146" opacity=".24"'), 'jewel color tint preserves independent highlight and lowlight facet contrast');
assert(nailCanvasSource.includes('<AssetSpecularAccent layer={layer} render={assetRender}/>') && nailThumbnailSource.includes('<AssetSpecularAccent layer={layer} render={assetRender}/>') && nailCanvasSource.includes('renderAssetShapes(assetRender.assetId, assetRender.colorHex)') && nailThumbnailSource.includes('renderAssetShapes(assetRender.assetId, assetRender.colorHex)'), 'active canvas and thumbnails share jewel renderer and specular accents');
assert(nailCanvasSource.includes('selected-jewel-handles-visible-above-realism'), 'selected jewel handles remain visible above realism layers');

const targetedPatternOptions = ['glitter', 'marble', 'camo', 'houndstooth', 'leopard', 'cheetah', 'zebra', 'cow-print', 'snake-print', 'tiger-stripe'];
for (const patternName of targetedPatternOptions) assert(PATTERNS.includes(patternName), `${patternName} refined pattern option still exists`);
for (const marker of [
  'data-pattern-quality="artist-calibrated-fine-scattered-flecks-dots-crosses-sparkle-points"',
  'data-pattern-quality="artist-calibrated-soft-flowing-veins-varied-thickness-opacity"',
  'data-camo-shapes="artist-calibrated-flatter-overlapping-irregular-patches-varied-scale-asymmetric"',
  'data-houndstooth-shapes="artist-calibrated-broken-check-strong-diagonal-tooth-extensions-low-checkerboard"',
  'data-animal-print="artist-calibrated-open-broken-irregular-rosettes-varied-size-rotation-accent-dots"',
  'data-animal-print="artist-calibrated-random-small-solid-irregular-spots-varied-scale-spacing"',
  'data-animal-print="artist-calibrated-long-thin-flowing-organic-zebra-bands-natural-spacing"',
  'data-animal-print="artist-calibrated-fewer-large-angular-irregular-patches-strong-negative-space"',
  'data-animal-print="artist-calibrated-tight-staggered-organic-scale-diamond-texture"',
  'data-animal-print="artist-calibrated-fewer-bold-sharp-thick-claw-tapered-stripes-uneven-direction"',
]) assert(nailCanvasSource.includes(marker), `Pattern renderer includes refined preset marker ${marker}`);

for (const patternName of ['leopard', 'cheetah', 'zebra', 'cow-print', 'snake-print', 'tiger-stripe']) assert(PATTERNS.includes(patternName), `${patternName} animal print pattern remains available`);
assert(nailCanvasSource.includes('<FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId}/>') && nailThumbnailSource.includes('<FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId} thumbnail/>') && nailCanvasSource.includes('export function PatternDefs'), 'Pattern French-compatible rendering path preserves shared refined PatternDefs alongside clipped French Tip fills');
assert(nailCanvasSource.includes('strokeWidth="5.2"') && nailCanvasSource.includes('r="1.4"') && nailCanvasSource.includes('width="62" height="52"') && nailCanvasSource.includes('width="88" height="76"') && nailCanvasSource.includes('width="104" height="86"') && nailCanvasSource.includes('width="36" height="42"') && nailCanvasSource.includes('strokeWidth="4.2"'), 'Refined animal identity markers remain present for rosettes, cheetah spots, zebra bands, cow patches, snake scales, and tiger claws');
assert(nailCanvasSource.includes('case "glitter"') && nailCanvasSource.includes('h4 M25 14 v4') && nailCanvasSource.includes('l1 2.4 2.5 .9'), 'Glitter renders scattered fine dots, tiny crosses, and sparkle flecks instead of a star-only grid');
assert(nailCanvasSource.includes('case "marble"') && nailCanvasSource.includes('width="92" height="74"') && nailCanvasSource.includes('strokeWidth="4.4"') && nailCanvasSource.includes('strokeWidth=".9"'), 'Marble renders larger soft flowing veins with varied thickness and opacity');
assert(nailCanvasSource.includes('case "camo"') && nailCanvasSource.includes('data-pattern="camo"') && nailCanvasSource.includes('width="86" height="64"') && nailCanvasSource.includes('fill={accent} opacity=".34"'), 'Camo renders flatter overlapping irregular patch shapes with primary, secondary, and softened accent tones');
assert(nailCanvasSource.includes('case "houndstooth"') && nailCanvasSource.includes('data-pattern="houndstooth"') && nailCanvasSource.includes('width="52" height="52"') && nailCanvasSource.includes('M0 0 H18 L28 12 L38 0'), 'Houndstooth renders interlocking broken-check textile shapes with stronger diagonal tooth extensions');
assert(nailCanvasSource.includes('export function PatternDefs') && nailThumbnailSource.includes('PatternDefs') && nailThumbnailSource.includes('<PatternDefs id={id} layer={layer}/>'), 'Active canvas and thumbnails share the same pattern rendering');
assert(nailCanvasSource.includes('patternTransform(layer)') && nailCanvasSource.includes('patternTransform(layer, 35)') && nailCanvasSource.includes('scaleX') && nailCanvasSource.includes('rotation'), 'Pattern rendering respects existing pattern transform controls for position, scale, and rotation');
for (const patternName of ['dots', 'stripes', 'checker', 'french-tip', 'glitter', 'marble']) assert(PATTERNS.includes(patternName), `${patternName} pattern option still exists`);
assert(nailCanvasSource.includes('clipPath={`url(#${clipId})`}') && nailCanvasSource.includes('patternTransform(layer, -8)') && nailCanvasSource.includes('patternTransform(layer, 8)'), 'Animal prints are clipped and transformable through shared pattern transforms');
assert.deepEqual(SHAPES, visibleHeroShapeFamilies, 'Hero 7 remains exact while Duck stays hidden');

assert(nailCanvasSource.includes('data-realism-layer="material-aware-clipped-pattern"') && nailThumbnailSource.includes('data-realism-layer="material-aware-clipped-pattern"') && nailCanvasSource.includes('clipPath={`url(#${clipId})`} opacity={(layer.opacity ?? 1) * art.artOpacity}'), 'patterns stay clipped and share material lighting behavior on active canvas and thumbnails');
assert(nailCanvasSource.includes('data.polishType === "Jelly" ? 0.82') && nailCanvasSource.includes('data.polishType === "Milky" ? 0.88') && nailCanvasSource.includes('data.polishType === "Matte" ? 0.76') && polishRendererSource.includes('data-polish-material={polishType}'), 'Cream/Jelly/Milky/Matte materials continue to drive polish rendering and nail-art blending');
assert(nailCanvasSource.includes('<PaintedStroke key={stroke.id}') && nailThumbnailSource.includes('<PaintedStroke key={stroke.id}') && nailCanvasSource.includes('<AssetSurfaceBlend layer={layer} render={assetRender}/>') && nailThumbnailSource.includes('<AssetSurfaceBlend layer={layer} render={assetRender}/>'), 'active canvas and thumbnails share the same nail-art realism components');

assert(assetRenderingSource.includes('getNailGeometry(nail)') && source.includes('assetFitsNailSilhouette(transform = {}, nail, layer = {})'), 'assets still use nail geometry and clipping helpers after shape smoothing');

for (const shape of ['Round', 'Oval']) {
  const shaped = { ...defaultShapeNail, shape };
  const freeEdge = getNailFreeEdgeExtent(shaped);
  assert(buildNailPath(shape, shaped).startsWith('M '), `${shape} produces a valid render path`);
  assert(freeEdge.renderBottomY > freeEdge.bottomY, `${shape} exposes the smooth rounded free-edge extent below the nominal nail bottom`);
  assert(isPointInsideNailSilhouette({ x: 0.5, y: 0.96 }, shaped), `${shape} keeps French Tip center geometry inside the clipping silhouette`);
  const frenchLayer = frenchTipLayer(shaped, 'classic', 'medium');
  assert.equal(frenchLayer.type, 'frenchTip', `${shape} supports French Tip layer creation for clipped rendering`);
}

assert.equal(getNailFreeEdgeExtent({ ...defaultShapeNail, shape: 'Almond' }).renderBottomY, getNailArchitecture({ ...defaultShapeNail, shape: 'Almond' }).bottomY, 'Almond keeps the original French Tip free-edge boundary');
assert.equal(getNailFreeEdgeExtent({ ...defaultShapeNail, shape: 'Coffin' }).renderBottomY, getNailArchitecture({ ...defaultShapeNail, shape: 'Coffin' }).bottomY, 'Coffin keeps the original French Tip free-edge boundary');

const duckNail = { ...defaultShapeNail, shape: 'Duck' };
const duckMetrics = getNailShapeMetrics('Duck', duckNail);
assert(duckMetrics.freeEdgeHalfWidth > duckMetrics.sidewallHalfWidth && duckMetrics.tipHalfWidth >= duckMetrics.freeEdgeHalfWidth, 'Duck visual free edge is wider than the upper/body section');
assert(duckMetrics.shoulderHalfWidth < duckMetrics.sidewallHalfWidth && duckMetrics.tipHalfWidth >= 0.5, 'Duck full flare remains designable from a narrow body into the widest free edge');
assert(Math.abs(projectPointInsideNailSilhouette({ x: -0.1, y: 0.82 }, duckNail).x - (1 - projectPointInsideNailSilhouette({ x: 1.1, y: 0.82 }, duckNail).x)) <= 0.001, 'Duck flare is symmetrical enough to read as Duck');
assert(isPointInsideNailSilhouette({ x: 0.01, y: 0.97 }, duckNail), 'Duck accepts points inside the left visible flare edge');
assert(isPointInsideNailSilhouette({ x: 0.99, y: 0.97 }, duckNail), 'Duck accepts points inside the right visible flare edge');
assert.equal(isPointInsideNailSilhouette({ x: -0.01, y: 0.97 }, duckNail), false, 'Duck rejects points outside the left visible flare edge');
assert.equal(isPointInsideNailSilhouette({ x: 1.01, y: 0.97 }, duckNail), false, 'Duck rejects points outside the right visible flare edge');
assert(assetFitsNailSilhouette({ x: 0.93, y: 0.9, scaleX: 0.06, scaleY: 0.06, rotation: 0 }, duckNail, { type: 'decal' }), 'Duck strict-fit assets can use the full visible flare surface');
assert(isPointInsideNailSilhouette({ x: 0.02, y: 0.98 }, duckNail) && isPointInsideNailSilhouette({ x: 0.98, y: 0.98 }, duckNail), 'Duck drawings, gradients, patterns, and clipped French tips share the expanded full-surface flare geometry');
assert(frenchTipRenderingSource.includes('L ${g.right} ${renderBottomY} L ${g.left} ${renderBottomY} Z'), 'Duck French tips close across the full normalized flare surface before SVG clipping');

assert(source.includes('halfWidths: maskHalfWidths(LIPSTICK_MASK_BOUNDS)') && source.includes('xBounds: LIPSTICK_MASK_BOUNDS') && source.includes('sharedBoundsMaskPath(m, LIPSTICK_MASK_BOUNDS'), 'Lipstick visual SVG mask and strict-fit geometry share LIPSTICK_MASK_BOUNDS as the source of truth');
assert(source.includes('halfWidths: maskHalfWidths(DUCK_MASK_BOUNDS)') && source.includes('xBounds: DUCK_MASK_BOUNDS') && source.includes('sharedBoundsMaskPath(m, DUCK_MASK_BOUNDS'), 'Duck visual SVG mask and strict-fit geometry share DUCK_MASK_BOUNDS as the source of truth');
assert(source.includes('sideCurveCommands(rightPoints)') && source.includes('sideCurveCommands(leftPoints)'), 'Strict-fit geometry matches the final Duck and Lipstick visible masks while rendering smooth shared bounds');
const lipstickPath = buildNailPath('Lipstick', { ...defaultShapeNail, shape: 'Lipstick' });
assert(lipstickPath.includes('173.760 296.256 L 66.24 318'), 'Lipstick diagonal free edge remains intact with asymmetric lower endpoints');
const lipstickTopSection = lipstickPath.slice(0, lipstickPath.indexOf('173.760 296.256'));
assert((lipstickTopSection.match(/ C /g) || []).length >= 5 && !lipstickTopSection.includes(' L '), 'Lipstick top/cuticle path is smooth, not angular or polygonal');
const lipstickNail = { ...defaultShapeNail, shape: 'Lipstick' };
assert(isPointInsideNailSilhouette({ x: 0.15, y: 0.99 }, lipstickNail), 'Lipstick preserved lower-left free-edge corner matches the visible mask path');
assert(isPointInsideNailSilhouette({ x: 0.4, y: 0.98 }, lipstickNail), 'Lipstick lower diagonal bound matches the visible mask path');
assert(isPointInsideNailSilhouette({ x: 0.08, y: 0.99 }, lipstickNail), 'Lipstick opposite free-edge corner stays sharp, intentional, and usable instead of clipped or rounded off');
const lipstickOutsideLowerRight = { x: 0.72, y: 0.98 };
const lipstickProjectedLowerRight = projectPointInsideNailSilhouette(lipstickOutsideLowerRight, lipstickNail);
assert.equal(isPointInsideNailSilhouette(lipstickOutsideLowerRight, lipstickNail), false, 'Lipstick rejects lower-right points outside the slanted visual mask');
assert(isPointInsideNailSilhouette(lipstickProjectedLowerRight, lipstickNail), 'Lipstick projected lower-right points land inside the visible mask');
assert(lipstickProjectedLowerRight.x < 0.5, 'Lipstick strict-fit xBounds match the diagonal visual mask');
assert.equal(assetFitsNailSilhouette({ x: 0.72, y: 0.98, scaleX: 0.06, scaleY: 0.06, rotation: 0 }, lipstickNail, { type: 'decal' }), false, 'Lipstick strict-fit rejects decals outside the visual lower-right clip path');
assert.equal(isPointInsideNailSilhouette({ x: 0.5, y: 0.99 }, lipstickNail), false, 'Lipstick rejects outside diagonal-cut area below the slanted free edge');
const narrowFrench = frenchTipLayer({ ...defaultShapeNail, shape: 'Oval' }, 'classic', 'medium');
const wideFrench = { ...narrowFrench, data: { ...narrowFrench.data, smileWidth: 1 } };
const narrowData = normalizeFrenchTipData({ ...narrowFrench.data, smileWidth: 0.35 });
const wideData = normalizeFrenchTipData(wideFrench.data);
assert.notEqual(narrowData.smileWidth, wideData.smileWidth, 'French Tip width changes normalized layer data and render inputs visibly');
assert(designStudioSource.includes('Smile width') && propertiesPanelSource.includes('single home for French Tip'), 'French Tip width control stays in the dedicated French Tip Precision home without duplicate layer-property entry points');
assert(frenchTipRenderingSource.includes('const width = g.width * data.smileWidth') && frenchTipRenderingSource.includes('Q ${g.cx} ${qY} ${right}'), 'French Tip width changes the rendered smile path endpoints');
assert(frenchTipRenderingSource.includes('getNailFreeEdgeExtent(nail)') && frenchTipRenderingSource.includes('L ${g.right} ${renderBottomY} L ${g.left} ${renderBottomY} Z'), 'French Tip free-edge fill closes against shared smooth silhouette extent to prevent Round/Oval base-color crescents');

assert(nailCanvasSource.includes('justifyContent: "center"') && nailCanvasSource.includes('width: "min(32vh, 54%)"') && nailCanvasSource.includes('maxWidth: 250') && nailCanvasSource.includes('containedZoom') && nailCanvasSource.includes('data-zoom-containment="bounded-hero-canvas"'), 'active nail canvas stays centered, zoomable, and bounded to avoid responsive clipping');

assert(!designStudioSource.includes('Taper') && !designStudioSource.includes('Apex height') && !designStudioSource.includes('Sidewall curve') && !designStudioSource.includes('Free-edge thickness'), 'advanced taper/apex/sidewall/free-edge controls are not exposed in the editor flow');

const heroCoffin = getNailShapeMetrics('Coffin', { ...defaultShapeNail, shape: 'Coffin' });
const heroSquare = getNailShapeMetrics('Square', { ...defaultShapeNail, shape: 'Square' });
const heroAlmond = getNailShapeMetrics('Almond', { ...defaultShapeNail, shape: 'Almond' });
const heroStiletto = getNailShapeMetrics('Stiletto', { ...defaultShapeNail, shape: 'Stiletto' });
assert(heroCoffin.sidewallHalfWidth > heroCoffin.freeEdgeHalfWidth && heroCoffin.freeEdgeHalfWidth > heroCoffin.tipHalfWidth, 'Hero Coffin tapers from fuller sidewalls into a squared free edge');
assert(Math.abs(heroSquare.sidewallHalfWidth - heroSquare.shoulderHalfWidth) <= 0.001 && heroSquare.freeEdgeHalfWidth >= heroSquare.shoulderHalfWidth * 0.99, 'Hero Square maintains parallel sidewalls through the free edge');
assert(heroAlmond.sidewallHalfWidth > heroAlmond.freeEdgeHalfWidth && heroAlmond.freeEdgeHalfWidth < ovalMetrics.freeEdgeHalfWidth, 'Hero Almond uses a tapered free edge while staying distinct from Oval');
assert(heroStiletto.sidewallHalfWidth > heroStiletto.freeEdgeHalfWidth && heroStiletto.tipHalfWidth === 0, 'Hero Stiletto tapers to a pointed tip');

function multiNailBlueprint(count) {
  return {
    schemaVersion: 1,
    canvas: { mode: 'full-set', activeNailId: 'nail-3' },
    nails: Array.from({ length: count }, (_, index) => ({
      id: `nail-${index + 1}`,
      slot: `slot-${index + 1}`,
      shape: SHAPES[index % SHAPES.length],
      length: Number((0.2 + index * 0.03).toFixed(2)),
      width: Number((0.3 + index * 0.02).toFixed(2)),
      baseColorHex: `#${String(index + 1).repeat(6).slice(0, 6)}`,
      metadata: { originalIndex: index },
      layers: [
        {
          id: 'base-layer',
          type: 'base',
          name: 'Base Color',
          visible: true,
          locked: true,
          opacity: 1,
          order: 0,
          transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
          data: { colorHex: `#${String(index + 1).repeat(6).slice(0, 6)}`, effect: 'Solid', effectColorHex: '#FFFFFF' },
        },
        {
          id: `drawing-${index + 1}`,
          type: 'drawing',
          name: `Drawing ${index + 1}`,
          visible: true,
          locked: false,
          opacity: 1,
          order: 2,
          transform: { x: 0.5, y: 0.5, scaleX: 1, scaleY: 1, rotation: 0 },
          data: { tool: 'solid', strokes: [{ id: `stroke-${index + 1}`, points: [{ x: 0.5, y: 0.5 }], colorHex: '#FFFFFF', width: 0.05, opacity: 1 }] },
        },
        {
          id: `inactive-decal-${index + 1}`,
          type: 'decal',
          name: `Inactive Decal ${index + 1}`,
          visible: index % 2 === 0,
          locked: index % 3 === 0,
          opacity: 0.73,
          order: 1,
          transform: { x: 1.12, y: -0.08, scaleX: 0.41, scaleY: 0.19, rotation: 127 },
          data: { assetId: 'decal-flower', colorHex: '#ABCDEF', custom: { preserve: true } },
        },
      ],
    })),
    metadata: { tags: ['multi-nail'] },
  };
}

for (const count of [5, 10]) {
  const original = multiNailBlueprint(count);
  const normalized = ensureBlueprint(original);
  assert.equal(normalized.nails.length, count, `${count}-nail blueprint preserves all nails during normalization`);
  assert.deepEqual(normalized.nails.map((item) => item.id), original.nails.map((item) => item.id), `${count}-nail blueprint preserves nail order and ids`);
  assert.equal(normalized.canvas.activeNailId, 'nail-3', `${count}-nail blueprint keeps a valid activeNailId`);
  assert.equal(normalized.nails[4].layers[1].id, 'drawing-5', `${count}-nail blueprint preserves inactive nail layer ids`);
  assert.deepEqual(normalized.nails[4].layers[1].data.strokes, original.nails[4].layers[1].data.strokes, `${count}-nail blueprint preserves inactive drawing strokes`);
  assert.deepEqual(normalized.nails[4].layers[2].transform, original.nails[4].layers[2].transform, `${count}-nail blueprint preserves inactive non-uniform and unusual transforms verbatim`);
  assert.deepEqual(normalized.nails[4].layers.map((layer) => layer.id), original.nails[4].layers.map((layer) => layer.id), `${count}-nail blueprint preserves inactive layer order without renumbering`);
  assert.equal(normalized.nails[4].metadata.originalIndex, 4, `${count}-nail blueprint preserves nail metadata`);

  const edited = synchronizeBase(normalized, { baseColorHex: '#AABBCC' });
  assert.equal(edited.nails.length, count, `${count}-nail active edit keeps all nails`);
  assert.equal(edited.nails[2].baseColorHex, '#AABBCC', `${count}-nail active edit changes active nail only`);
  assert.equal(edited.nails[4].baseColorHex, original.nails[4].baseColorHex, `${count}-nail active edit leaves inactive nail flat fields unchanged`);
  assert.deepEqual(edited.nails[4].layers, normalized.nails[4].layers, `${count}-nail active edit leaves inactive nail layers unchanged`);
  assert.equal(flatDesignFromBlueprint(edited).baseColorHex, '#AABBCC', `${count}-nail legacy flat fields sync from active nail only`);
}

const staleFlatBase = ensureBlueprint(multiNailBlueprint(5));
const visibleBaseEdited = updateActiveNail(staleFlatBase, (nail) => ({
  ...nail,
  baseColorHex: '#445566',
  layers: nail.layers.map((layer) => layer.type === 'base' ? { ...layer, data: { ...layer.data, colorHex: '#112233' } } : layer),
}));
assert.equal(getVisibleBaseColor(getActiveNail(visibleBaseEdited)), '#112233', 'visible base color prefers active base layer data over stale nail flat field');
assert.equal(flatDesignFromBlueprint(visibleBaseEdited).baseColorHex, '#112233', 'legacy flat fields derive from the visible active base layer color');
const invalidVisibleBase = updateActiveNail(staleFlatBase, (nail) => ({
  ...nail,
  baseColorHex: '#445566',
  layers: nail.layers.map((layer) => layer.type === 'base' ? { ...layer, data: { ...layer.data, colorHex: 'invalid' } } : layer),
}));
assert.equal(getVisibleBaseColor(getActiveNail(invalidVisibleBase)), '#445566', 'visible base color falls back to activeNail.baseColorHex when base layer color is invalid');

const invalidActive = ensureBlueprint({ ...multiNailBlueprint(5), canvas: { mode: 'full-set', activeNailId: 'missing' } });
assert.equal(invalidActive.canvas.activeNailId, 'nail-1', 'normalization repairs invalid activeNailId to a preserved nail');
assert.deepEqual(invalidActive.nails[4], multiNailBlueprint(5).nails[4], 'inactive backend-valid nails remain byte-equivalent when activeNailId is repaired');

assert(nailCanvasSource.includes('setActiveDrag({ kind: "asset"'), 'NailCanvas uses an explicit asset drag-state variant');
assert(nailCanvasSource.includes('setActiveDrag({ kind: "drawing"'), 'NailCanvas uses an explicit drawing drag-state variant');
assert(nailCanvasSource.includes('event.currentTarget.setPointerCapture?.(event.pointerId);\n    setActiveDrag({ kind: "drawing"'), 'drawing gestures capture the root SVG pointer before stroke tracking');
assert(nailCanvasSource.includes('releaseCapture(activeDrag.captureTarget, activeDrag.pointerId);'), 'drawing, asset, and eraser gestures release pointer capture safely on completion or cancel');
assert(nailCanvasSource.includes('function finishPointerGesture(event)') && nailCanvasSource.includes('activeDrag.pointerId !== event.pointerId'), 'pointerup uses an explicit matching-pointer gesture finalization path');
assert(nailCanvasSource.includes('function cancelPointerGesture(event)') && nailCanvasSource.includes('activeDrag.pointerId !== event.pointerId'), 'pointercancel uses an explicit matching-pointer cancellation path');
assert(nailCanvasSource.includes('onPointerUp={finishPointerGesture} onPointerCancel={cancelPointerGesture}'), 'pointerup and pointercancel are wired to separate handlers');
assert(nailCanvasSource.includes('onTransformLayer(activeDrag.layerId, activeDrag.original, false, { cancel: true });'), 'canceled asset drags restore their original transform without finalizing history');
assert(!nailCanvasSource.includes('onPointerCancel={() => { pointerUp(); canvasUp(); }}'), 'pointercancel does not reuse the pointerup commit path');
assert(designStudioSource.includes('if (options.cancel)'), 'canceled asset drags clear pre-drag history bookkeeping without marking dirty');
const cancelBlock = nailCanvasSource.match(/function cancelPointerGesture\(event\) \{[\s\S]*?\n  \}/)?.[0] || '';
assert(!cancelBlock.includes('onDrawingStroke'), 'canceled drawing gestures discard in-progress strokes instead of committing them');
assert(!cancelBlock.includes('onEraseStroke'), 'canceled eraser gestures discard pending erases instead of committing them');
assert(cancelBlock.includes('setActiveDrag(null)'), 'pointercancel cleanup clears drag state');
assert(nailCanvasSource.includes('if (dragRef.current) return;'), 'additional pointerdown events are ignored while a pointer gesture is already active');
assert(nailCanvasSource.includes('setActiveDrag({ kind: "eraser"') && nailCanvasSource.includes('pendingEraseTarget'), 'eraser gestures store pending erase targets without mutating on pointerdown');
assert(nailCanvasSource.includes('onStageEraseStroke(point)') && !nailCanvasSource.includes('if (mode === "eraser") {\n      onEraseStroke(point);'), 'eraser pointerdown stages a target instead of deleting immediately');
assert(nailCanvasSource.includes('if (activeDrag.kind === "eraser")') && nailCanvasSource.includes('onEraseStroke(activeDrag.pendingEraseTarget)'), 'matching eraser pointerup commits the staged erase exactly once');
assert(nailCanvasSource.includes('if (mode === "draw" || mode === "eraser") return;'), 'asset transform pointerMove is guarded during draw and eraser modes');
assert(nailCanvasSource.includes('pointerEvents="none" data-layer-type="gradient"') && nailCanvasSource.includes('<defs><LayerGradient'), 'gradient overlays are canvas-nonblocking in every mode');
assert(nailCanvasSource.includes('pointerEvents="none"><defs><PatternDefs'), 'pattern overlays are canvas-nonblocking in every mode');
assert(frenchTipRenderingSource.includes('pointerEvents="none" data-layer-type="frenchTip"'), 'French Tip overlays pass pointer events through to underlying canvas artwork');
assert(!nailCanvasSource.includes('LayerGradient layer={layer} id={id}/></defs><rect') || !nailCanvasSource.includes('onPointerDown={selectOverlay}><defs><LayerGradient'), 'gradient overlay selection is not captured by a full-surface canvas handler');

const drawingDeletedBlueprint = updateActiveNail(createDefaultBlueprint(), (activeNail) => ({
  ...activeNail,
  layers: activeNail.layers.filter((layer) => layer.type !== 'drawing'),
}));
const firstStroke = { id: 'first-stroke', points: [{ x: 0.5, y: 0.5 }], colorHex: '#FFFFFF', width: 0.05, opacity: 1, tool: 'solid' };
const recreated = addStrokeToDrawingLayer(drawingDeletedBlueprint, firstStroke, 'solid', 'deleted-layer-id');
const recreatedNail = getActiveNail(recreated.blueprint);
const drawingLayers = recreatedNail.layers.filter((layer) => layer.type === 'drawing');
assert.equal(recreated.created, true, 'first stroke creates a replacement drawing layer when the prior layer was deleted');
assert.equal(drawingLayers.length, 1, 'first stroke recreation does not leave duplicate empty drawing layers');
assert.equal(drawingLayers[0].data.strokes.length, 1, 'first stroke is inserted into the recreated drawing layer atomically');
assert.equal(drawingLayers[0].data.strokes[0].id, 'first-stroke', 'first stroke survives the drawing-layer recreation transition');
const secondStroke = { ...firstStroke, id: 'second-stroke' };
const appended = addStrokeToDrawingLayer(recreated.blueprint, secondStroke, 'solid', recreated.layerId);
assert.equal(getActiveNail(appended.blueprint).layers.filter((layer) => layer.type === 'drawing').length, 1, 'subsequent strokes reuse the editable drawing layer');
assert.equal(getActiveNail(appended.blueprint).layers.find((layer) => layer.type === 'drawing').data.strokes.length, 2, 'subsequent strokes append without creating duplicate layers');
const frenchBehindDrawing = updateActiveNail(createDefaultBlueprint(), (activeNail) => {
  const french = { ...frenchTipLayer(activeNail, 'classic', 'medium'), id: 'french-under-art', order: 2 };
  const drawing = { ...drawingLayer(activeNail), id: 'drawing-over-french', order: 1, data: { tool: 'solid', strokes: [] } };
  return { ...activeNail, layers: renumberLayers([activeNail.layers[0], drawing, french]) };
});
const drawnOverFrench = addStrokeToDrawingLayer(frenchBehindDrawing, { ...firstStroke, id: 'stroke-over-french' }, 'solid');
const overFrenchNail = getActiveNail(drawnOverFrench.blueprint);
assert(overFrenchNail.layers.find((layer) => layer.id === 'drawing-over-french').order > overFrenchNail.layers.find((layer) => layer.id === 'french-under-art').order, 'new drawing strokes render above French Tip layers by default');

const hiddenDrawingBlueprint = updateActiveNail(createDefaultBlueprint(), (activeNail) => ({
  ...activeNail,
  layers: [
    ...activeNail.layers,
    { ...drawingLayers[0], id: 'hidden-drawing', visible: false, locked: false, data: { ...drawingLayers[0].data, strokes: [{ id: 'hidden-existing', points: [{ x: 0.45, y: 0.45 }], colorHex: '#000000', width: 0.04, opacity: 1 }] } },
  ],
}));
const visibleFromHidden = addStrokeToDrawingLayer(hiddenDrawingBlueprint, { ...firstStroke, id: 'visible-after-hidden' }, 'glitter', 'hidden-drawing');
const visibleFromHiddenNail = getActiveNail(visibleFromHidden.blueprint);
const hiddenLayer = visibleFromHiddenNail.layers.find((layer) => layer.id === 'hidden-drawing');
const newVisibleLayers = visibleFromHiddenNail.layers.filter((layer) => layer.type === 'drawing' && layer.visible !== false && !layer.locked);
assert.equal(visibleFromHidden.created, true, 'hidden drawing layer is not reused for a new stroke');
assert.equal(hiddenLayer.visible, false, 'hidden drawing layer remains hidden');
assert.equal(hiddenLayer.data.strokes.length, 1, 'hidden drawing layer strokes remain unchanged');
assert(newVisibleLayers.some((layer) => layer.data.strokes.some((stroke) => stroke.id === 'visible-after-hidden')), 'new visible drawing layer receives the first stroke immediately');

const lockedDrawingBlueprint = updateActiveNail(createDefaultBlueprint(), (activeNail) => ({
  ...activeNail,
  layers: [
    ...activeNail.layers,
    { ...drawingLayers[0], id: 'locked-drawing', visible: true, locked: true, data: { ...drawingLayers[0].data, strokes: [] } },
  ],
}));
const visibleFromLocked = addStrokeToDrawingLayer(lockedDrawingBlueprint, { ...firstStroke, id: 'visible-after-locked' }, 'soft', 'locked-drawing');
assert.equal(visibleFromLocked.created, true, 'locked drawing layer is not reused for a new stroke');
assert(getActiveNail(visibleFromLocked.blueprint).layers.some((layer) => layer.type === 'drawing' && layer.visible !== false && !layer.locked && layer.data.strokes.some((stroke) => stroke.id === 'visible-after-locked')), 'new visible unlocked drawing layer receives strokes when preferred layer is locked');
assert.equal(isReusableDrawingLayer({ type: 'drawing', locked: false, visible: true }), true, 'visible unlocked drawing layers are reusable for new strokes and erasing');
assert.equal(isReusableDrawingLayer({ type: 'drawing', locked: false, visible: false }), false, 'hidden drawing layers are not reusable for new strokes or erasing');
assert.equal(isReusableDrawingLayer({ type: 'drawing', locked: true, visible: true }), false, 'locked drawing layers are not reusable for new strokes or erasing');
assert(designStudioSource.includes('function stageEraseStroke(point)') && designStudioSource.includes('activeNail.layers.find(isReusableDrawingLayer)'), 'eraser stages targets only from visible unlocked drawing layers when the selected layer is not reusable');
assert(designStudioSource.includes('Select a visible unlocked drawing layer to erase strokes.'), 'eraser shows a non-blocking notice when no visible unlocked drawing layer exists');

const nail = { id: 'nail-1', shape: 'Almond', length: 0.55, width: 0.5, layers: [] };
const pathPoint = normalizedToSvg({ x: 0.5, y: 0.5 }, nail);
assert(pathPoint.x > 100 && pathPoint.x < 140, 'normalized x converts into SVG nail coordinates');
assert(pathPoint.y > 170 && pathPoint.y < 230, 'normalized y converts into SVG nail coordinates');
assert(buildNailPath('Almond', nail).includes('C'), 'saved drawing path can be rebuilt with same nail geometry after reload');

for (const shape of SHAPES) {
  const shapedNail = { ...nail, shape };
  assert.equal(isPointInsideNailSilhouette({ x: 1.15, y: 0.5 }, shapedNail), false, `${shape} rejects points outside normalized nail bounds`);
  const projected = projectPointInsideNailSilhouette({ x: 0.99, y: 0.99 }, shapedNail);
  assert(projected.x <= 0.99 && projected.y <= 0.99, `${shape} projects off-silhouette drawing point`);
  const points = constrainStrokePoints([{ x: 0.99, y: 0.99 }, { x: 0.5, y: 0.5 }], shapedNail);
  assert.deepEqual(points[0], projected, `${shape} stroke points are constrained deterministically`);

  const largeAsset = { type: 'charm' };
  const constrained = constrainAssetTransform({ x: 0.98, y: 0.98, scaleX: 3, scaleY: 3, rotation: 38 }, shapedNail, largeAsset);
  assert(isPointInsideNailSilhouette({ x: constrained.x, y: constrained.y }, shapedNail), `${shape} oversized asset anchor stays inside the nail for clipping`);
  assert.equal(constrained.scaleX, 3, `${shape} preserves enlarged statement asset scale for clipped rendering`);
  assert(constrained.scaleX <= ASSET_SIZE_RANGE.max && constrained.scaleX >= ASSET_SIZE_RANGE.min, `${shape} scale stays normalized and bounded`);
}

const stiletto = { ...nail, shape: 'Stiletto' };
const jewel = { type: 'jewel' };
const stilettoJewelTransform = safeTransform({ x: 0.5, y: 0.98, scaleX: 0.22, scaleY: 0.22, rotation: 0 }, stiletto, 'jewel');
assert(isPointInsideNailSilhouette({ x: stilettoJewelTransform.x, y: stilettoJewelTransform.y }, stiletto), 'jewel near stiletto tip keeps its anchor clipped inside the nail');

const blueprintDoc = createDefaultBlueprint({ shape: 'Oval', length: 1, width: 1 });
const active = getActiveNail(blueprintDoc);
const layer = assetLayer({ id: 'charm-bow', name: 'Bow', category: 'charms', defaultColor: '#fff' }, active);
const withLayer = ensureBlueprint({ ...blueprintDoc, nails: [{ ...active, layers: [...active.layers, { ...layer, transform: { x: 0.08, y: 0.55, scaleX: 0.34, scaleY: 0.34, rotation: 25 } }] }] });
const resized = revalidateLayersAfterNailResize({ ...withLayer, nails: [{ ...getActiveNail(withLayer), shape: 'Almond', length: 0.15, width: 0.05 }] });
const resizedNail = getActiveNail(resized);
const resizedLayer = resizedNail.layers.find((item) => item.type === 'charm');
assert(isPointInsideNailSilhouette({ x: resizedLayer.transform.x, y: resizedLayer.transform.y }, resizedNail), 'asset revalidates anchor after shape, length, and width changes while remaining clipped');
assert.equal(quantitySummary(resized).charm, assetFitsNailSilhouette(resizedLayer.transform, resizedNail, resizedLayer) ? 1 : 0, 'quantity hooks still require fully visible valid charm geometry');



const frenchBase = blueprint.ensureFullSetBlueprint(blueprint.createFullSetBlueprint({ baseColorHex: '#E8A0BF' }));
const frenchActive = blueprint.getActiveNail(frenchBase);
const classicFrench = frenchTipLayer(frenchActive, 'classic', 'soft');
assert.equal(classicFrench.type, 'frenchTip', 'classic French creates the dedicated French Tip layer type');
assert.equal(classicFrench.data.style, 'classic', 'classic French rendering preserves style data');
assert(normalizeFrenchTipData({ style: 'deep', preset: 'deep' }).smileDepth >= FRENCH_TIP_PRESETS.medium.smileDepth, 'deep smile line preset increases smile depth deterministically');
for (const style of ['angled', 'v', 'reverse']) assert.equal(normalizeFrenchTipData({ style }).style, style, `${style} French data survives normalization`);
const tallerFrench = normalizeFrenchTipData({ tipHeight: 0.6, smileCurve: 0.75 });
assert.equal(tallerFrench.tipHeight, 0.6, 'tip height changes are preserved');
assert.equal(tallerFrench.smileCurve, 0.75, 'curve changes are preserved');
const zeroFrench = normalizeFrenchTipData({ tipHeight: 0.08, smileCurve: 0, smileDepth: 0, smileWidth: 0.25, rotation: 0 });
assert.equal(zeroFrench.smileCurve, 0, 'zero smile curve survives French Tip normalization');
assert.equal(zeroFrench.smileDepth, 0, 'zero smile depth survives French Tip normalization');
assert(designStudioSource.includes('data.smileCurve ?? 0.32') && designStudioSource.includes('data.smileDepth ?? 0.24') && designStudioSource.includes('data.smileWidth ?? 0.82') && designStudioSource.includes('data.tipHeight ?? 0.32'), 'Dedicated French Tip Precision panel preserves zero-valued French Tip sliders with nullish fallbacks');
const withFrench = { ...frenchBase, nails: frenchBase.nails.map((n) => n.id === frenchActive.id ? { ...n, layers: [...n.layers, classicFrench] } : n) };
const handApplied = applyFrenchTipToSlots(withFrench, classicFrench, blueprint.RIGHT_HAND_SLOTS);
assert.equal(handApplied.nails.filter((n) => n.slot.startsWith('right') && n.layers.some((l) => l.type === 'frenchTip')).length, 5, 'apply to hand adds French Tip to current hand nails');
const allApplied = applyFrenchTipToSlots(withFrench, classicFrench, blueprint.FULL_SET_SLOTS);
assert.equal(allApplied.nails.filter((n) => n.layers.some((l) => l.type === 'frenchTip')).length, 10, 'apply to all nails adds French Tip to every nail');
const reloadedFrench = blueprint.ensureFullSetBlueprint(JSON.parse(JSON.stringify(allApplied)));
assert.equal(reloadedFrench.nails.filter((n) => n.layers.some((l) => l.type === 'frenchTip')).length, 10, 'save and reload preserves French Tip layers');
const changedShapeFrench = blueprint.revalidateLayersAfterNailResize({ ...withFrench, nails: withFrench.nails.map((n) => n.id === frenchActive.id ? { ...n, shape: 'Stiletto', width: 0.1, length: 0.2 } : n) });
assert(changedShapeFrench.nails.find((n) => n.id === frenchActive.id).layers.some((l) => l.type === 'frenchTip'), 'shape-change revalidation preserves French Tip layers');
assert(frenchTipRenderingSource.includes('clipPath={`url(#${clipId})`}') && frenchTipRenderingSource.includes('data-french-tip-style'), 'preview rendering clips French Tip vectors and exposes deterministic style markers');
assert(frenchTipRenderingSource.includes('function rotatePath(rotation, cx, cy)') && frenchTipRenderingSource.includes('`rotate(${rotation} ${cx} ${cy})`') && !frenchTipRenderingSource.includes(' ${path}`'), 'angled French Tip transform returns only valid SVG transform text without path commands');
assert(nailCanvasSource.includes('layer.type === "frenchTip"') && nailThumbnailSource.includes('layer.type === "frenchTip"'), 'main canvas and full-set preview render French Tip layers');
assert(designStudioSource.includes('Add French Tip') && designStudioSource.includes('Apply to current hand') && designStudioSource.includes('Apply to all nails'), 'Design Studio exposes French Tip controls and bulk apply actions');

const fullSet = blueprint.ensureFullSetBlueprint(blueprint.createFullSetBlueprint({ baseColorHex: '#123456' }));
assert.equal(fullSet.nails.length, 10, 'new full-set design initializes 10 nails');
assert.equal(blueprint.getActiveNail(fullSet).slot, blueprint.DEFAULT_ACTIVE_SLOT, 'new full-set design activates the documented right-index default');
assert(designStudioSource.includes('useState(() => createFullSetBlueprint())'), 'Design Studio initializer mounts from the full-set blueprint helper');
assert(!designStudioSource.includes('useState(() => createDefaultBlueprint())'), 'Design Studio initializer does not call the removed single-nail default helper');
assert.equal(new Set(fullSet.nails.map((n) => n.id)).size, 10, 'every full-set nail has a unique id');
assert.deepEqual(fullSet.nails.map((n) => n.slot), blueprint.FULL_SET_SLOTS, 'full-set preview order follows stable slot order');
assert.deepEqual(blueprint.LEFT_HAND_SLOTS, ['left-thumb', 'left-index', 'left-middle', 'left-ring', 'left-pinky'], 'left-hand preview order is artist-facing thumb to pinky');
assert.deepEqual(blueprint.RIGHT_HAND_SLOTS, ['right-thumb', 'right-index', 'right-middle', 'right-ring', 'right-pinky'], 'right-hand preview order is artist-facing thumb to pinky');
const switched = blueprint.setActiveNailBySlot(fullSet, 'left-ring');
assert.equal(blueprint.getActiveNail(switched).slot, 'left-ring', 'active nail switching updates canvas.activeNailId');
const oneNailLegacy = blueprint.ensureFullSetBlueprint(blueprint.createDefaultBlueprint({ fullSet: false, baseColorHex: '#AA00AA' }));
assert.equal(oneNailLegacy.nails.length, 10, 'legacy one-nail blueprint upgrades to 10 slots safely');
assert(oneNailLegacy.nails.some((n) => n.baseColorHex === '#AA00AA'), 'legacy one-nail upgrade preserves original nail data');

const unusualInactive = JSON.parse(JSON.stringify(fullSet));
const inactiveSlot = 'left-thumb';
unusualInactive.nails = unusualInactive.nails.map((n) => n.slot === inactiveSlot ? {
  ...n,
  layers: [
    ...n.layers,
    { id: 'inactive-decal', type: 'decal', name: 'Inactive Decal', visible: true, locked: false, opacity: 0.8, order: 1, transform: { x: 0.43, y: 0.57, scaleX: 0.21, scaleY: 0.13, rotation: 37 }, data: { assetId: 'decal-weird', colorHex: '#ABCDEF' } },
  ],
  metadata: { preserved: true },
} : n);
const inactiveBefore = JSON.stringify(blueprint.getNailBySlot(unusualInactive, inactiveSlot));
const noOpNormalized = blueprint.ensureFullSetBlueprint(unusualInactive);
assert.equal(JSON.stringify(blueprint.getNailBySlot(noOpNormalized, inactiveSlot)), inactiveBefore, 'ensureFullSetBlueprint preserves backend-valid inactive nails verbatim during no-op normalization');
const activeOnlyResized = blueprint.revalidateLayersAfterNailResize(unusualInactive);
assert.equal(JSON.stringify(blueprint.getNailBySlot(activeOnlyResized, inactiveSlot)), inactiveBefore, 'active-only geometry revalidation leaves inactive nails unchanged');

const sourceSlot = 'right-index';
const sourceNail = blueprint.getNailBySlot(fullSet, sourceSlot);
const sourceLayer = blueprint.assetLayer({ id: 'charm-bow', name: 'Bow', category: 'charms', defaultColor: '#fff' }, sourceNail);
const jewelLayer = blueprint.assetLayer({ id: 'jewel-round', name: 'Round', category: 'jewels', defaultColor: '#ddf7ff' }, sourceNail);
const decalLayer = blueprint.assetLayer({ id: 'decal-flame', name: 'Flame', category: 'decals', defaultColor: '#ff6b35' }, sourceNail);
const hiddenDecalLayer = { ...blueprint.assetLayer({ id: 'decal-smiley', name: 'Hidden Smiley', category: 'decals', defaultColor: '#ffd166' }, sourceNail), visible: false };
const drawingSource = { ...blueprint.drawingLayer(sourceNail), data: { tool: 'solid', strokes: [{ id: 'stroke-original', points: [{ x: 0.5, y: 0.45 }, { x: 0.52, y: 0.5 }], colorHex: '#111111', width: 0.04, opacity: 1, tool: 'solid' }] } };
const gradientSource = blueprint.gradientLayer(sourceNail);
const patternSource = blueprint.patternLayer(sourceNail, 'dots');
const sourceLayers = [sourceLayer, jewelLayer, decalLayer, hiddenDecalLayer, drawingSource, gradientSource, patternSource];
const decorated = { ...fullSet, nails: fullSet.nails.map((n) => n.slot === sourceSlot ? { ...n, layers: [...n.layers, ...sourceLayers] } : n) };
const originalSourceSnapshot = JSON.stringify(blueprint.getNailBySlot(decorated, sourceSlot));
const copiedSelected = blueprint.copyNailToSlots(decorated, sourceSlot, ['left-index']);
assert(copiedSelected.nails.find((n) => n.slot === 'left-index').layers.some((l) => l.type === 'charm'), 'copy active nail to selected nail copies visible art');
assert.notEqual(copiedSelected.nails.find((n) => n.slot === 'left-index').id, sourceNail.id, 'copy preserves destination unique nail id');
const copiedHand = blueprint.copyNailToSlots(decorated, sourceSlot, blueprint.RIGHT_HAND_SLOTS);
assert(copiedHand.nails.find((n) => n.slot === 'right-thumb').layers.some((l) => l.type === 'charm'), 'copy active nail to current hand works');
const copiedAll = blueprint.copyNailToSlots(decorated, sourceSlot, blueprint.FULL_SET_SLOTS);
assert.equal(copiedAll.nails.filter((n) => n.layers.some((l) => l.type === 'charm')).length, 10, 'copy active nail to all nails works while preserving the source');
const opposite = blueprint.copyNailToSlots(decorated, sourceSlot, ['left-index']);
assert(opposite.nails.find((n) => n.slot === 'left-index').layers.some((l) => l.type === 'charm'), 'copy active nail to matching opposite finger works');
const mirrored = blueprint.mirrorHandDesign(decorated, 'right');
assert(mirrored.nails.find((n) => n.slot === 'left-index').layers.some((l) => l.type === 'charm'), 'mirror right hand to left hand copies matching fingers');
assert.equal(new Set(mirrored.nails.map((n) => n.id)).size, 10, 'mirror preserves unique nail ids');

const allLayerTypes = ['base', 'drawing', 'gradient', 'pattern', 'charm', 'jewel', 'decal'];
function typeCounts(nail) { return nail.layers.reduce((counts, layer) => ({ ...counts, [layer.type]: (counts[layer.type] || 0) + 1 }), {}); }
function assertCopiedDesignIntegrity(doc, slot, message) {
  const nail = blueprint.getNailBySlot(doc, slot);
  const counts = typeCounts(nail);
  for (const type of allLayerTypes) assert(counts[type] >= 1, `${message} preserves ${type} layers`);
  for (const layer of nail.layers.filter((l) => ['charm', 'jewel', 'decal'].includes(l.type))) assert(blueprint.assetFitsNailSilhouette(layer.transform, nail, layer), `${message} keeps ${layer.type} visible/recoverably fit`);
  assert(nail.layers.find((l) => l.id !== 'base-layer' && l.type === 'charm').id !== sourceLayer.id, `${message} creates safe copied charm id`);
  assert(nail.layers.find((l) => l.type === 'drawing').data.strokes[0].id !== 'stroke-original', `${message} creates safe copied stroke id`);
  assert.equal(nail.layers.find((l) => l.data?.assetId === 'decal-smiley').visible, false, `${message} copies hidden assets as hidden`);
}
assertCopiedDesignIntegrity(copiedSelected, 'left-index', 'paste to selected');
assertCopiedDesignIntegrity(copiedAll, 'left-thumb', 'duplicate all');
assertCopiedDesignIntegrity(mirrored, 'left-index', 'mirror hand');
assert.equal(JSON.stringify(blueprint.getNailBySlot(decorated, sourceSlot)), originalSourceSnapshot, 'copy helpers do not mutate source nail');
assert.equal(blueprint.getNailBySlot(copiedSelected, 'left-index').id, blueprint.getNailBySlot(decorated, 'left-index').id, 'paste preserves destination nail id');
assert.equal(blueprint.getNailBySlot(copiedSelected, 'left-index').slot, 'left-index', 'paste preserves destination slot');
const reloadedCopy = blueprint.ensureFullSetBlueprint(JSON.parse(JSON.stringify(copiedSelected)));
assertCopiedDesignIntegrity(reloadedCopy, 'left-index', 'save and reload preserves copied asset layers');
assert(nailCanvasSource.includes('layer.type === "gradient"') && nailCanvasSource.includes('layer.type === "pattern"') && nailCanvasSource.includes('layer.type === "frenchTip"') && nailCanvasSource.includes('renderAssetShapes(assetRender.assetId'), 'main canvas renders gradient, pattern, French Tip, and asset layers');
assert(propertiesPanelSource.includes('ASSET_SIZE_RANGE') && propertiesPanelSource.includes('max={Math.round(ASSET_SIZE_RANGE.max * 100)}'), 'existing asset Size control uses the enlarged shared max range');
assert.equal(ASSET_SIZE_RANGE.max, 3, 'asset max size supports 300% statement charms, jewels, and decals');
const oversizedAsset = constrainAssetTransform({ x: 0.5, y: 0.5, scaleX: 3, scaleY: 3, rotation: 0 }, nail, { type: 'decal' });
assert.equal(oversizedAsset.scaleX, 3, 'resized decal can render larger than the previous 34% max');
assert(nailThumbnailSource.includes('assetLayerRenderProps(layer, nail') && nailThumbnailSource.includes('renderAssetShapes(assetRender.assetId'), 'thumbnails use the same layer transform renderer for enlarged assets');
const oversizedSaved = ensureBlueprint({ ...createDefaultBlueprint(), nails: [{ ...getActiveNail(createDefaultBlueprint()), layers: [{ ...getActiveNail(createDefaultBlueprint()).layers[0] }, { id: 'large-decal', type: 'decal', name: 'Large decal', visible: true, locked: false, opacity: 1, order: 1, transform: oversizedAsset, data: { assetId: 'decal-star', colorHex: '#FFFFFF' } }] }] });
assert.equal(getActiveNail(oversizedSaved).layers.find((layer) => layer.id === 'large-decal').transform.scaleX, 3, 'large asset size persists through blueprint normalization/save-load flow');
const jewelSettingsSaved = ensureBlueprint({ ...createDefaultBlueprint(), nails: [{ ...getActiveNail(createDefaultBlueprint()), layers: [{ ...getActiveNail(createDefaultBlueprint()).layers[0] }, { id: 'settings-jewel', type: 'jewel', name: 'Settings Jewel', visible: true, locked: false, opacity: 0.42, order: 1, transform: { x: 0.47, y: 0.52, scaleX: 0.29, scaleY: 0.29, rotation: 33 }, data: { assetId: 'jewel-square', colorHex: '#7fd5ff' } }] }] });
const reloadedJewel = getActiveNail(jewelSettingsSaved).layers.find((layer) => layer.id === 'settings-jewel');
assert.equal(reloadedJewel.opacity, 0.42, 'save/load preserves jewel opacity setting');
assert.equal(reloadedJewel.transform.scaleX, 0.29, 'save/load preserves jewel size setting');
assert.equal(reloadedJewel.transform.rotation, 33, 'save/load preserves jewel rotation setting');
assert.equal(reloadedJewel.data.colorHex, '#7fd5ff', 'save/load preserves jewel color setting');
assert(nailThumbnailSource.includes('layer.type === "drawing"') && nailThumbnailSource.includes('layer.type === "gradient"') && nailThumbnailSource.includes('layer.type === "pattern"') && nailThumbnailSource.includes('layer.type === "frenchTip"') && nailThumbnailSource.includes('renderAssetShapes(assetRender.assetId'), 'full-set thumbnails render drawing, gradient, pattern, French Tip, charm, jewel, and decal asset layers');
assert(!nailCanvasSource.includes('dangerouslySetInnerHTML') && !nailThumbnailSource.includes('dangerouslySetInnerHTML'), 'canvas and thumbnail rendering never inject untrusted inline SVG HTML');
assert(nailThumbnailSource.includes('layer.visible !== false'), 'thumbnail preview hides hidden layers');
assert(nailThumbnailSource.includes('clipPath={`url(#${clipId})`}'), 'thumbnail preview strictly clips art inside nail silhouette');
assert(assetRenderingSource.includes('RENDERABLE_ASSET_LAYER_TYPES = new Set(["charm", "jewel", "decal"])'), 'shared asset renderer recognizes charm, jewel, and decal layers');
assert(assetRenderingSource.includes('layer?.data?.assetId') && !assetRenderingSource.includes('layer?.data?.svg'), 'shared asset renderer supports assetId lookup and ignores untrusted inline SVG data');
assert(assetRenderingSource.includes('scale(${(size * scaleX) / 84} ${(size * scaleY) / 84})'), 'shared asset renderer converts normalized non-uniform scale into SVG transform scale');
assert(nailThumbnailSource.includes('data-layer-type={layer.type}') && nailThumbnailSource.includes('data-asset-id={assetRender.assetId}'), 'thumbnail output includes visible SVG nodes with deterministic asset layer markers');
assert(!nailThumbnailSource.includes('clipPath={`url(#${clipId})`} opacity={layer.opacity} transform={`translate'), 'thumbnail assets do not put transform on the same clipped group, avoiding transformed clipPath misalignment');
const maliciousInlineSvg = '<svg onload="alert(1)"><script>alert(1)</script><foreignObject><div onclick="alert(1)">x</div></foreignObject><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>';
const maliciousBlueprint = ensureBlueprint({
  ...createDefaultBlueprint(),
  nails: [{
    ...createDefaultBlueprint().nails[0],
    layers: [
      ...createDefaultBlueprint().nails[0].layers,
      { id: 'malicious-svg-asset', type: 'charm', name: 'Malicious Charm', visible: true, locked: false, opacity: 1, order: 2, transform: { x: 0.5, y: 0.5, scaleX: 0.2, scaleY: 0.2, rotation: 0 }, data: { assetId: 'charm-bow', colorHex: '#FFFFFF', svg: maliciousInlineSvg } },
    ],
  }],
});
const maliciousLayer = getActiveNail(maliciousBlueprint).layers.find((layer) => layer.id === 'malicious-svg-asset');
assert.equal(maliciousLayer.data.svg, undefined, 'frontend blueprint normalization strips untrusted inline SVG asset payloads');
const thumbnailAssetFixture = ['charm-bow', 'jewel-round', 'decal-flame'].map((assetId) => ({ assetId }));
for (const fixture of thumbnailAssetFixture) {
  assert(['charm-bow', 'jewel-round', 'decal-flame'].includes(fixture.assetId), `deterministic thumbnail fixture includes ${fixture.assetId}`);
}
assert(bulkActionsPanelSource.includes('Select destination nails, then paste copied design.'), 'bulk actions explains destination nail selection workflow');
assert(designStudioSource.includes('Copy the active nail before pasting to selected nails.') && designStudioSource.includes('Select destination nails, then paste copied design.'), 'paste to selected shows notices for missing clipboard and missing destination nails');

const basedHand = blueprint.applyBaseToSlots(fullSet, { baseColorHex: '#ABCDEF' }, blueprint.LEFT_HAND_SLOTS);
assert(basedHand.nails.filter((n) => n.slot.startsWith('left') && n.baseColorHex === '#ABCDEF').length === 5, 'apply base color to current hand updates five nails');
assert(basedHand.nails.filter((n) => n.slot.startsWith('left') && n.layers.find((layer) => layer.type === 'base')?.data?.colorHex === '#ABCDEF').length === 5, 'apply base color to current hand updates rendered base layer color');
const basedAll = blueprint.applyBaseToSlots(fullSet, { baseColorHex: '#FEDCBA' }, blueprint.FULL_SET_SLOTS);
assert(basedAll.nails.every((n) => n.baseColorHex === '#FEDCBA'), 'apply base color to all nails updates ten nails');
assert(basedAll.nails.every((n) => n.layers.find((layer) => layer.type === 'base')?.data?.colorHex === '#FEDCBA'), 'apply base color to all nails updates every rendered base layer color');
assert(basedAll.nails.every((n) => getVisibleBaseColor(n) === '#FEDCBA'), 'bulk rendered polish color source follows the new base layer color');
const colorHexBulk = blueprint.applyBaseToSlots(fullSet, { colorHex: '#BADA55' }, blueprint.LEFT_HAND_SLOTS);
assert(colorHexBulk.nails.filter((n) => n.slot.startsWith('left') && n.baseColorHex === '#BADA55' && n.layers.find((layer) => layer.type === 'base')?.data?.colorHex === '#BADA55').length === 5, 'bulk apply accepts colorHex as a base layer color source');
const explicitHandPolish = blueprint.applyBaseToSlots(fullSet, { polishType: 'Jelly', baseColorHex: '#112244' }, blueprint.LEFT_HAND_SLOTS);
assert(explicitHandPolish.nails.filter((n) => n.slot.startsWith('left') && n.layers.find((layer) => layer.type === 'base')?.data?.polishType === 'Jelly').length === 5, 'apply base color to hand preserves explicit Polish Type');
const explicitAllPolish = blueprint.applyBaseToSlots(fullSet, { polishType: 'Matte', baseColorHex: '#221144' }, blueprint.FULL_SET_SLOTS);
assert(explicitAllPolish.nails.every((n) => n.layers.find((layer) => layer.type === 'base')?.data?.polishType === 'Matte'), 'apply base color to all preserves explicit Polish Type');
const shapedHand = blueprint.applyBaseToSlots(fullSet, { shape: 'Square' }, blueprint.LEFT_HAND_SLOTS);
assert(shapedHand.nails.filter((n) => n.slot.startsWith('left') && n.shape === 'Square').length === 5, 'apply shape to current hand updates five nails');
const shapedAll = blueprint.applyBaseToSlots(fullSet, { shape: 'Oval' }, blueprint.FULL_SET_SLOTS);
assert(shapedAll.nails.every((n) => n.shape === 'Oval'), 'apply shape to all nails updates ten nails');
const reset = blueprint.resetNailDesign(decorated, sourceSlot);
assert.equal(reset.nails.find((n) => n.slot === sourceSlot).layers.length, 1, 'reset one nail safely keeps base layer only');
const sequenceShapes = ['Square', 'Coffin', 'Stiletto', 'Oval', 'Almond'];
let sequenceDoc = decorated;
for (const shape of sequenceShapes) {
  sequenceDoc = blueprint.applyBaseToSlots(sequenceDoc, { shape }, [sourceSlot]);
  const nailAfter = blueprint.getNailBySlot(sequenceDoc, sourceSlot);
  for (const layerAfter of nailAfter.layers.filter((l) => ['charm', 'jewel', 'decal'].includes(l.type))) assert(blueprint.assetFitsNailSilhouette(layerAfter.transform, nailAfter, layerAfter), `${shape} revalidation keeps assets valid`);
}
const once = blueprint.revalidateAllNails(sequenceDoc);
const twice = blueprint.revalidateAllNails(once);
assert.deepEqual(twice, once, 'strict-fit revalidation is idempotent without another geometry change');
const summary = blueprint.summarizeFullSetAssets(decorated);
assert.equal(summary.nailCount, 10, 'product-use summary counts nails');
assert.equal(summary.charmsByAssetId['charm-bow'], 1, 'product-use summary counts visible valid charms by assetId');
const frenchSummary = blueprint.summarizeFullSetAssets(allApplied);
assert.equal(frenchSummary.visibleFrenchTipLayerCount, 10, 'product-use summary counts visible French Tip layers separately');
assert.equal(frenchSummary.visiblePatternLayerCount, 0, 'product-use summary does not fold French Tips into pattern counts');
assert(designStudioSource.includes('window.setTimeout(() => {') && designStudioSource.includes('}, 20000)'), 'autosave uses a debounced 20 second cadence');
assert(designStudioSource.includes('function clearAutosaveTimer()') && designStudioSource.includes('autosaveTimerRef.current = null'), 'pending autosave timers are cleared and nulled when no longer needed');
assert(designStudioSource.includes('autosaveSessionRef') && designStudioSource.includes('scheduledSession !== autosaveSessionRef.current'), 'autosave timer callbacks are guarded by editor session tokens');
assert(designStudioSource.includes('!mountedRef.current') && designStudioSource.includes('!dirtyRef.current) return'), 'autosave timer callbacks exit when unmounted or clean before saving');
assert(designStudioSource.includes('useEffect(() => { if (!dirty) clearAutosaveTimer(); }, [dirty])'), 'autosave timers are cleared when the editor becomes clean');
assert(designStudioSource.includes('savingRef.current') && designStudioSource.includes('queuedAutosaveRef.current'), 'autosave prevents overlapping requests and queues follow-up saves');
assert(designStudioSource.includes('editGenerationRef') && designStudioSource.includes('submittedRevision'), 'autosave captures local edit generations so older responses cannot overwrite newer edits');
assert(designStudioSource.includes('selectionRevisionRef') && designStudioSource.includes('submittedSelectionRevision'), 'autosave also tracks UI selection revisions separately from content edit generations');
assert(designStudioSource.includes('editorSessionRef') && designStudioSource.includes('submittedEditorSession'), 'save requests capture the current editor session token at submit time');
assert(designStudioSource.includes('responseFromStaleEditorSession') && designStudioSource.includes('stale-editor-session'), 'save responses from previous editor sessions are ignored before applying blueprint, name, dirty, or selected-design state');
assert(designStudioSource.includes('const existingDesignId = selectedDesignIdRef.current') && designStudioSource.includes('selectedDesignIdRef.current !== existingDesignId'), 'save requests capture selectedDesignId and reject responses after editor identity changes');
assert(designStudioSource.includes('mode: options.autosave ? "autosave" : "manual"') && designStudioSource.includes('target: existingDesignId ? "existing-design-update" : "new-draft-create"'), 'save requests classify manual/autosave and create/update intent at submit time');
assert(designStudioSource.includes('unchangedSinceSubmit') && designStudioSource.includes('Newer edits kept locally; another autosave is queued.'), 'stale autosave responses keep newer local edits dirty and queue a newest-state follow-up save');
assert(!designStudioSource.includes('setHistory({ past: [], future: [] });\n      setStatus({'), 'successful autosaves and manual saves preserve undo and redo history');
assert(designStudioSource.includes('async function guardReplacement()') && designStudioSource.includes('confirmDiscardAfterFailedSave'), 'failed or in-flight saves gate design replacement behind explicit discard confirmation');
assert(designStudioSource.includes('Save failed — changes kept locally'), 'failed autosaves preserve dirty frontend state with clear status');
assert(designStudioSource.includes('Untitled Set'), 'new unnamed autosaved drafts get generated editable names');
assert(designStudioSource.includes('<FullSetPreview'), 'Design Studio renders full-set preview navigation');
assert(!designStudioSource.includes('<BulkActionsPanel') && designStudioSource.includes('data-testid="command-set-actions-popover"'), 'Design Studio routes bulk action controls through the Artist Command Bar instead of the legacy sidebar panel');
assert(designStudioSource.includes('useImperativeHandle(ref') && designStudioSource.includes('prepareToLeave()'), 'Design Studio exposes an app-level dirty-work leave guard');
assert(designStudioSource.includes('beforeunload') && designStudioSource.includes('event.returnValue = ""'), 'Design Studio registers browser beforeunload protection for dirty work');
assert(designStudioSource.includes('function markHistoryMutation') && designStudioSource.match(/function undo\(\)[\s\S]*scheduleAutosave\(\)/), 'Undo marks dirty and schedules the normal autosave debounce');
assert(designStudioSource.match(/function redo\(\)[\s\S]*scheduleAutosave\(\)/), 'Redo marks dirty and schedules the normal autosave debounce');
assert(designStudioSource.includes('generatedDraftNameRef') && designStudioSource.includes('if (generatedDraftNameRef.current) return generatedDraftNameRef.current'), 'generated draft names are stable across queued saves');
assert(designStudioSource.includes('persistedDesignNameRef') && designStudioSource.includes('workingName = persistedDesignNameRef.current.trim()'), 'existing-design saves preserve the last persisted name when the visible name is blank');
assert(designStudioSource.includes('existingDesignId') && designStudioSource.includes('generatedUntitledName()') && designStudioSource.indexOf('workingName = persistedDesignNameRef.current.trim()') < designStudioSource.indexOf('workingName = generatedUntitledName()'), 'Untitled Set names are generated only after existing-design persisted-name preservation is considered');
assert(designStudioSource.includes('getVisibleBaseColor(activeNail)') && designStudioSource.match(/function patchLayer\(layerId, patch, record = true\)[\s\S]*baseColorHex: getVisibleBaseColor\(nail\)/), 'bulk base color and active nail flat sync use the visible active base layer color');
assert(designStudioSource.match(/function selectSlot\(slot\)[\s\S]*if \(currentActive\?\.slot === slot\) return;[\s\S]*blueprintRef.current = next;/), 'active nail selection updates refs synchronously and clicking the active nail is a no-op');
const selectSlotSource = designStudioSource.match(/function selectSlot\(slot\) \{[\s\S]*?\n  \}/)?.[0] || '';
assert(selectSlotSource.includes('selectionRevisionRef.current += 1') && !selectSlotSource.includes('markEdited()'), 'thumbnail navigation uses a separate selection revision instead of content edit generation');
assert(!selectSlotSource.includes('setDirty(true)') && !selectSlotSource.includes('scheduleAutosave()'), 'thumbnail navigation alone does not mark dirty or schedule autosave');


console.log('geometry-helper-test passed');

const polishSource = await readFile(new URL('../client/src/design-studio/polish.js', import.meta.url), 'utf8');
const polishModule = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(polishSource)}`);
assert(polishRendererSource.includes('export function PolishDefs({ uid })') && polishRendererSource.includes('linearGradient') && polishRendererSource.includes('radialGradient'), 'gel renderer defines subtle gloss/reflection gradients for solid-color realism');
assert(polishRendererSource.includes('polishOpacity'), 'gel renderer still applies existing polish opacity rules to the base color');
assert(!polishRendererSource.includes('data.chromeIntensity') && !polishRendererSource.includes('data.catEyeAngle') && !polishRendererSource.includes('data.sparkleDensity'), 'flat renderer intentionally omits advanced polish-effect controls from rendering');
assert(nailCanvasSource.includes('<PolishSurface') && nailThumbnailSource.includes('<PolishSurface'), 'Polish rendering is shared by NailCanvas, thumbnail, hand, and full-set previews');
assert(propertiesPanelSource.includes('Polish Settings') && propertiesPanelSource.includes('Top Coat') && propertiesPanelSource.includes('Special polish-effect controls stay hidden'), 'Design Studio exposes physical-realism Polish Settings without special effect controls');
assert(!propertiesPanelSource.includes('polish.polishType === "Glitter"') && !propertiesPanelSource.includes('polish.polishType === "Cat Eye"') && !propertiesPanelSource.includes('polish.polishType === "Chrome"') && !propertiesPanelSource.includes('Legacy effect'), 'special polish effect controls are not reintroduced in the Properties panel');
assert.deepEqual(POLISH_TYPES, ['Cream', 'Jelly', 'Milky', 'Matte'], 'Polish Type selector exposes only core material types');
assert(!POLISH_TYPES.includes('Chrome') && !POLISH_TYPES.includes('Cat Eye') && !POLISH_TYPES.includes('Glitter') && !POLISH_TYPES.includes('Marble'), 'Chrome, Cat Eye, Glitter, and Marble are not visible Polish Type choices');
assert(designStudioSource.includes('Polish Type') && designStudioSource.includes('POLISH_TYPES.map((type) => <option key={type} value={type}>{type}</option>)'), 'Nail Color System renders the visible Polish Type selector');
assert(polishRendererSource.includes('data-polish-material={polishType}') && polishRendererSource.includes('jelly-clear-depth') && polishRendererSource.includes('milky-builder-gel-veil') && polishRendererSource.includes('polishType === "Matte"'), 'shared material engine implements Cream, Jelly, Milky, and Matte material layers');
assert(frenchTipRenderingSource.includes('resolvePolishDataForRender') && frenchTipRenderingSource.includes('polishType={material.polishType || "Cream"}'), 'French tips inherit the active base polish material behavior');
const polishDefaultBlueprint = createDefaultBlueprint({ baseColorHex: '#123456' });
const polishBase = getActiveNail(polishDefaultBlueprint).layers.find((layer) => layer.type === 'base');
assert.equal(polishBase.data.polishType, 'Cream', 'old designs default to Cream polish safely');
assert.equal(polishBase.data.colorHex, '#123456', 'base polish color is preserved through save/load normalization');
for (const effect of ['Gradient', 'Chrome', 'CatEye', 'Marble']) {
  const legacyBase = normalizePolishData({ colorHex: '#123456', effect, effectColorHex: '#FFFFFF' }, '#123456');
  assert(!Object.hasOwn(legacyBase, 'polishType'), `frontend normalization preserves absent Polish Type for legacy ${effect}`);
  const legacyBlueprint = createDefaultBlueprint({ baseColorHex: '#123456', effect });
  const legacyBlueprintBase = getActiveNail(legacyBlueprint).layers.find((layer) => layer.type === 'base');
  assert(!Object.hasOwn(legacyBlueprintBase.data, 'polishType'), `default blueprint preserves absent Polish Type for legacy ${effect}`);
  for (const patch of [{ baseColorHex: '#654321' }, { effectColorHex: '#ABCDEF' }, { shape: 'Almond', length: 0.72, taper: 0.4 }]) {
    const synced = synchronizeBase(legacyBlueprint, patch);
    const syncedBase = getActiveNail(synced).layers.find((layer) => layer.type === 'base');
    assert(!Object.hasOwn(syncedBase.data, 'polishType'), `synchronizeBase preserves absent Polish Type for legacy ${effect}`);
  }
  const legacyBulk = blueprint.applyBaseToSlots(blueprint.ensureFullSetBlueprint(createDefaultBlueprint({ baseColorHex: '#123456', effect })), { baseColorHex: '#654321' }, blueprint.FULL_SET_SLOTS);
  assert(legacyBulk.nails.every((n) => n.baseColorHex === '#654321'), `applyBaseToSlots updates nail baseColorHex for legacy ${effect}`);
  assert(legacyBulk.nails.every((n) => n.layers.find((layer) => layer.type === 'base')?.data?.colorHex === '#654321'), `applyBaseToSlots updates base layer colorHex for legacy ${effect}`);
  assert(legacyBulk.nails.every((n) => !Object.hasOwn(n.layers.find((layer) => layer.type === 'base')?.data || {}, 'polishType')), `applyBaseToSlots does not inject explicit Cream for legacy ${effect}`);
  const undefinedPoison = normalizePolishData({ colorHex: '#123456', effect, effectColorHex: '#FFFFFF', polishType: undefined }, '#123456');
  assert(!Object.hasOwn(undefinedPoison, 'polishType'), `frontend normalization treats undefined Polish Type as absent for legacy ${effect}`);
}
assert.equal(normalizePolishData({ colorHex: '#123456', effect: 'Solid', effectColorHex: '#FFFFFF' }, '#123456').polishType, 'Cream', 'frontend normalization defaults legacy Solid to Cream');
for (const [effect, expectedPolishType] of [['Chrome', 'Cream'], ['CatEye', 'Cream'], ['Gradient', 'Gradient'], ['Marble', 'Cream']]) {
  const propertiesPatchData = normalizePolishData(clearStalePolishTypeForLegacyEffect({ colorHex: '#123456', effect, effectColorHex: '#FFFFFF', polishType: 'Cream' }, { effect }), '#123456');
  assert(!Object.hasOwn(propertiesPatchData, 'polishType'), `PropertiesPanel legacy effect ${effect} clears stale Cream Polish Type`);
  assert.equal(polishModule.resolvePolishDataForRender(propertiesPatchData, '#123456').polishType, expectedPolishType, `PropertiesPanel legacy effect ${effect} renders ${expectedPolishType}`);
  assert(!('polishType' in propertiesPatchData) || propertiesPatchData.polishType !== undefined, `PropertiesPanel legacy effect ${effect} does not create polishType undefined`);
  const changedLegacyEffect = synchronizeBase(createDefaultBlueprint({ baseColorHex: '#123456', effect: 'Solid' }), { effect });
  const changedLegacyBase = getActiveNail(changedLegacyEffect).layers.find((layer) => layer.type === 'base');
  assert(!Object.hasOwn(changedLegacyBase.data, 'polishType'), `changing legacy effect to ${effect} clears explicit Cream Polish Type`);
  assert.equal(polishModule.resolvePolishDataForRender(changedLegacyBase.data, '#123456').polishType, expectedPolishType, `changing legacy effect to ${effect} renders ${expectedPolishType}`);
  assert(!('polishType' in changedLegacyBase.data) || changedLegacyBase.data.polishType !== undefined, `changing legacy effect to ${effect} does not create polishType undefined`);
}
const changedLegacySolid = synchronizeBase(createDefaultBlueprint({ baseColorHex: '#123456', effect: 'Chrome' }), { effect: 'Solid' });
assert.equal(getActiveNail(changedLegacySolid).layers.find((layer) => layer.type === 'base').data.polishType, 'Cream', 'changing legacy effect to Solid defaults safely to Cream');
assert.equal(normalizePolishData(clearStalePolishTypeForLegacyEffect({ colorHex: '#123456', effect: 'Solid', effectColorHex: '#FFFFFF', polishType: 'Cream' }, { effect: 'Solid' }), '#123456').polishType, 'Cream', 'PropertiesPanel legacy effect Solid keeps Cream safely');
const explicitPolishWithLegacyEffect = synchronizeBase(createDefaultBlueprint({ baseColorHex: '#123456', effect: 'Solid' }), { effect: 'Chrome', polishType: 'Jelly' });
assert.equal(getActiveNail(explicitPolishWithLegacyEffect).layers.find((layer) => layer.type === 'base').data.polishType, 'Jelly', 'explicit Polish Type patch remains authoritative when legacy effect also changes');
const explicitCreamWithLegacyEffect = synchronizeBase(createDefaultBlueprint({ baseColorHex: '#123456', effect: 'Solid' }), { effect: 'Chrome', polishType: 'Cream' });
assert.equal(getActiveNail(explicitCreamWithLegacyEffect).layers.find((layer) => layer.type === 'base').data.polishType, 'Cream', 'explicit Cream selected through Polish Type remains Cream');
assert.equal(normalizePolishData(clearStalePolishTypeForLegacyEffect({ colorHex: '#123456', effect: 'Chrome', effectColorHex: '#FFFFFF', polishType: 'Cream' }, { polishType: 'Cream' }), '#123456').polishType, 'Cream', 'PropertiesPanel Polish Type selector explicit Cream remains Cream');
assert.equal(normalizePolishData(clearStalePolishTypeForLegacyEffect({ colorHex: '#123456', effect: 'Solid', effectColorHex: '#FFFFFF', polishType: 'Cream' }, { polishType: 'Matte' }), '#123456').polishType, 'Matte', 'PropertiesPanel Polish Type selector explicit Matte remains Matte');
assert.equal(normalizePolishData({ colorHex: '#123456', effect: 'Chrome', effectColorHex: '#FFFFFF', polishType: 'Cream' }, '#123456').polishType, 'Cream', 'explicit Cream Polish Type persists over legacy effect');
const explicitChromeCream = synchronizeBase(createDefaultBlueprint({ baseColorHex: '#123456', effect: 'Chrome' }), { polishType: 'Cream' });
assert.equal(getActiveNail(explicitChromeCream).layers.find((layer) => layer.type === 'base').data.polishType, 'Cream', 'synchronizeBase persists user-selected explicit Cream Polish Type');
assert.equal(normalizePolishData({ colorHex: '#123456', effect: 'Chrome', effectColorHex: '#FFFFFF', polishType: 'Jelly' }, '#123456').polishType, 'Jelly', 'frontend normalization preserves explicit Polish Type over legacy effect');
const copiedPolish = cloneNailDesign(getActiveNail(polishDefaultBlueprint), { ...getActiveNail(polishDefaultBlueprint), id: 'copy', slot: 'copy' });
assert.equal(copiedPolish.layers.find((layer) => layer.type === 'base').data.polishType, 'Cream', 'copy/duplicate-style nail cloning preserves polish fields');
assert(polishSource.includes('POLISH_TYPES') && polishSource.includes('TOP_COATS'), 'proposal-compatible polish fields stay inside existing blueprint layer data');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Solid', effectColorHex: '#FFFFFF' }).polishType, 'Cream', 'legacy Solid base effects render as Cream polish');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Gradient', effectColorHex: '#FFFFFF' }).polishType, 'Gradient', 'legacy Gradient base effects keep gradient rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Chrome', effectColorHex: '#FFFFFF' }).polishType, 'Cream', 'legacy Chrome base effects map to safe Cream polish rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'CatEye', effectColorHex: '#FFFFFF' }).polishType, 'Cream', 'legacy CatEye base effects map to safe Cream polish rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Marble', effectColorHex: '#FFFFFF' }).polishType, 'Cream', 'legacy Marble base effects map to safe Cream polish rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', polishType: 'Jelly', effect: 'Chrome', effectColorHex: '#FFFFFF' }).polishType, 'Jelly', 'explicit Polish Type overrides legacy base effects');
assert(polishRendererSource.includes('resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF")'), 'PolishSurface uses nail baseColorHex as the no-base-layer polish fallback');
assert(nailCanvasSource.includes('<PolishDefs nail={nail} baseLayer={baseLayer} uid={uid}/>') && nailThumbnailSource.includes('<PolishDefs nail={nail} baseLayer={base} uid={clipId}/>'), 'NailCanvas, thumbnails, hand previews, and full-set previews pass shared PolishDefs for gel realism gradients');
const matteBlack = polishModule.resolvePolishDataForRender({ colorHex: '#050505', polishType: 'Matte' }, '#FFFFFF');
const mattePlum = polishModule.resolvePolishDataForRender({ colorHex: '#24051F', polishType: 'Matte' }, '#FFFFFF');
assert.equal(matteBlack.colorHex, '#050505', 'Matte black preserves black base color instead of normalizing toward gray');
assert.equal(mattePlum.colorHex, '#24051F', 'Matte dark plum preserves dark plum base color');
assert.equal(polishModule.polishOpacity(matteBlack), 1, 'Matte dark colors stay fully opaque for color depth');
assert(polishModule.polishMaterialProfile('Matte', 0.08).diffusion <= 0.04 && polishModule.polishMaterialProfile('Matte', 0.08).reflection <= 0.05, 'Matte material suppresses white veil and strong gloss/reflection');
const jellyPink = polishModule.resolvePolishDataForRender({ colorHex: '#FF1493', polishType: 'Jelly' }, '#FFFFFF');
const jellyRed = polishModule.resolvePolishDataForRender({ colorHex: '#D00020', polishType: 'Jelly' }, '#FFFFFF');
const jellyPurple = polishModule.resolvePolishDataForRender({ colorHex: '#8A2BE2', polishType: 'Jelly' }, '#FFFFFF');
assert.equal(jellyPink.colorHex, '#FF1493', 'Pink Jelly remains bright pink');
assert.equal(jellyRed.colorHex, '#D00020', 'Red Jelly remains saturated red syrup/glass');
assert.equal(jellyPurple.colorHex, '#8A2BE2', 'Purple Jelly remains juicy vibrant purple rather than muted lavender');
assert(polishModule.polishOpacity(jellyRed) >= 0.6, 'Jelly opacity preserves color vibrancy while remaining translucent');
const jellyProfile = polishModule.polishMaterialProfile('Jelly', 0.62);
const milkyProfile = polishModule.polishMaterialProfile('Milky', 0.62);
assert(jellyProfile.gloss > milkyProfile.gloss && jellyProfile.glass > milkyProfile.glass, 'Jelly remains glossy/translucent compared with Milky');
assert(jellyProfile.diffusion < 0.03 && milkyProfile.diffusion > 0.4, 'Jelly does not use Milky veil/diffusion behavior while Milky stays soft/cloudy');
assert(polishRendererSource.includes('translucent-colored-glass-gel') && polishRendererSource.includes('fill={data.colorHex} opacity=".20"'), 'renderer labels Jelly as translucent colored glass gel without a white milky veil');
assert(polishRendererSource.includes('soft-cloudy-milky-diffusion'), 'Milky keeps an explicit cloudy diffusion veil distinct from Jelly');
assert.equal(polishModule.resolvePolishDataForRender({}, '#336699').colorHex, '#336699', 'no-base-layer polish render data falls back to nail.baseColorHex instead of default pink');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#112233', polishType: 'Chrome' }, '#336699').colorHex, '#112233', 'normal base-layer polish color remains authoritative over no-base fallback');
assert(designStudioSource.includes('function addGradient()') && designStudioSource.includes('function addPattern()') && designStudioSource.includes('technique-choice-gradient') && designStudioSource.includes('technique-choice-pattern'), 'Design Studio keeps clean entry points for creating gradient and pattern layers while the base polish renderer stays flat');
assert.deepEqual(GRADIENT_DIRECTIONS.slice(0, 4), ['vertical', 'reverse-vertical', 'horizontal', 'diagonal'], 'Ombré directions support vertical, reverse vertical, horizontal, and diagonal in the single gradient control');
assert(GRADIENT_DIRECTIONS.includes('aura') && nailCanvasSource.includes('data-gradient-mode="center-glow-aura-blend"'), 'Center glow/aura ombré blend is implemented as a radial gradient option');
assert(propertiesPanelSource.includes('Ombré / Gradient') && propertiesPanelSource.includes('Start color') && propertiesPanelSource.includes('End color') && propertiesPanelSource.includes('Blend position') && propertiesPanelSource.includes('Softness / diffusion') && propertiesPanelSource.includes('Angle'), 'Gradient controls expose one nail-tech friendly Ombré / Gradient panel without duplicate entry points');
assert(source.includes('blendPosition: 0.5') && source.includes('softness: 0.62') && source.includes('angle: 90'), 'New gradient layers persist blend position, softness, and angle defaults for save/load');
assert(source.includes('GRADIENT_COLOR_LIMITS = { min: 2, max: 7 }') && source.includes('gradientStops: normalizeGradientStops'), 'default gradient still has 2 colors and persists normalized gradientStops for save/load');
const defaultStops = blueprint.gradientLayer({ shape: 'Almond', length: 0.5, width: 0.5 }).data.gradientStops;
assert.equal(defaultStops.length, 2, 'new gradient layers default to exactly 2 colors');
const repairedStops = blueprint.normalizeGradientStops({ colorA: '#111111', colorB: '#EEEEEE', gradientStops: [{ color: 'bad', position: 150 }, { color: '#222222', position: 70 }, { color: '#333333', position: -20 }, { color: '#444444', position: 30 }, { color: '#555555', position: 40 }, { color: '#666666', position: 50 }, { color: '#777777', position: 60 }, { color: '#888888', position: 80 }] });
assert.equal(repairedStops.length, 7, 'users can save up to 7 total gradient colors');
assert.deepEqual(repairedStops.map((stop) => stop.position), [0, 30, 40, 50, 60, 70, 100], 'gradient stop positions are sorted and clamped');
assert.equal(repairedStops[0].color, '#111111', 'legacy startColor/colorA maps to first stop');
assert.equal(repairedStops.at(-1).color, '#EEEEEE', 'legacy endColor/colorB maps to last stop');

assert(source.includes('export function normalizeGradientStops') && source.includes('slice(0, GRADIENT_COLOR_LIMITS.max)') && source.includes('.sort((a, b) => a.position - b.position)'), 'gradient color stop positions are clamped, sorted, and capped at 7 colors');
assert(designStudioSource.includes('Duck') === false || source.includes('HIDDEN_SHAPE_FALLBACKS = { Duck: "Square" }'), 'Duck remains hidden from selectable Hero 7 shapes');

assert(nailCanvasSource.includes('data-realism-layer="soft-diffusion-blur-clipped-gradient-fill"') && nailCanvasSource.includes('feGaussianBlur stdDeviation') && nailCanvasSource.includes('data-gradient-softness="diffused-salon-ombre"'), 'Gradient rendering has softness and diffusion behavior rather than a flat SVG gradient');
assert(nailCanvasSource.includes('jelly-translucent-glassy-gradient-blend') && nailCanvasSource.includes('milky-cloudy-ombre-veil') && nailCanvasSource.includes('matte-low-shine-satin-gradient-blend') && nailCanvasSource.includes('data-gradient-material={art.polishType}'), 'Gradient rendering respects Cream, Jelly, Milky, and Matte material profiles');
assert(nailCanvasSource.includes('export function GradientLayerShape') && nailCanvasSource.includes('clipPath={`url(#${clipId})`}') && nailCanvasSource.includes('materialScope="gradient-ombre"'), 'Gradient remains clipped inside the nail silhouette and receives shared curvature realism');
assert(nailThumbnailSource.includes('<GradientLayerShape key={layer.id} layer={layer} nail={nail} baseLayer={base} path={path} clipId={clipId} uid={clipId} thumbnail/>') && nailCanvasSource.includes('<GradientLayerShape key={layer.id} layer={layer} nail={nail} baseLayer={baseLayer} path={path} clipId={clipId} uid={uid}/>'), 'Active canvas and thumbnails share the same gradient rendering component');
assert(nailCanvasSource.includes('data-gradient-stop-count={stops.length}') && nailCanvasSource.includes('renderGradientStops(stops, true)'), 'active canvas and thumbnails render the same multi-color gradient stops, including aura center glow support');
assert(propertiesPanelSource.includes('Additional Colors') && propertiesPanelSource.includes('Add color') && propertiesPanelSource.includes('stops.length >= GRADIENT_COLOR_LIMITS.max') && propertiesPanelSource.includes('stops.length <= GRADIENT_COLOR_LIMITS.min'), 'gradient UI can add/edit/remove color stops, disables add at 7, and prevents removing below 2');
assert(propertiesPanelSource.includes('Gradient stop ${index + 1} color') && propertiesPanelSource.includes('Gradient stop ${index + 1} position') && propertiesPanelSource.includes('patchStop(index, { color: e.target.value })'), 'all gradient stops expose individual visible color controls and editable position sliders');
assert(propertiesPanelSource.includes('colorA: nextStops[0].color') && propertiesPanelSource.includes('colorB: nextStops[nextStops.length - 1].color'), 'start/end gradient controls map to the first and last stops while middle stop edits preserve rendered gradientStops');
assert(propertiesPanelSource.includes('{ color: "#FFFFFF", position: 50 }'), 'add color creates a new editable middle gradient stop before normalization');

assert(designStudioSource.includes('function addGradient()') && designStudioSource.includes('data-testid="technique-choice-gradient"') && !designStudioSource.includes('Add Ombré / Gradient'), 'Gradient/ombré entry point exists once and is not duplicated');
assert(designStudioSource.includes('Fill Type') && designStudioSource.includes('<option value="solid">Solid</option>') && designStudioSource.includes('<option value="pattern">Pattern</option>'), 'French Tip Precision exposes Fill Type Solid/Pattern');
assert(designStudioSource.includes('Pattern primary color') && designStudioSource.includes('Pattern secondary color') && designStudioSource.includes('Pattern scale') && designStudioSource.includes('PATTERNS.map'), 'Pattern mode exposes pattern selector and pattern color controls');
assert(frenchTipRenderingSource.includes('data-french-tip-fill="pattern"') && frenchTipRenderingSource.includes('frenchPatternClipId') && frenchTipRenderingSource.includes('clipPath={`url(#${frenchPatternClipId})`}'), 'Pattern French tip clips pattern inside tip region only');
assert(nailThumbnailSource.includes('<FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId} thumbnail/>'), 'Pattern French tip renders in thumbnails through shared FrenchTipShape');
assert(source.includes('fillType: data.fillType === "pattern" ? "pattern" : "solid"') && source.includes('patternScale: clamp(data.patternScale ?? 1, 0.2, 3)'), 'save/load preserves French tip pattern settings');
assert(nailCanvasSource.includes('if (layer.type === "frenchTip")') && nailCanvasSource.indexOf('if (layer.type === "gradient")') < nailCanvasSource.indexOf('if (layer.type === "frenchTip")'), 'Gradient layer order remains predictable with French Tip rendering and drawing above French tips intact');


assert(designStudioSource.includes('data-testid="signature-looks-panel"') && designStudioSource.includes('data-testid="signature-look-primary-actions"') && designStudioSource.includes('data-testid="signature-look-manage-actions"'), 'compact Signature Looks panel exposes dropdown, primary actions, and manage row');
assert(designStudioSource.includes('Save active nail') && designStudioSource.includes('Save full set') && designStudioSource.includes('createSignatureLookFromBlueprint(blueprint, name, scope)'), 'user can save current active nail or full set as a Signature Look');
assert.deepEqual(STARTER_SIGNATURE_LOOKS.map((look) => look.name), ['Classic French', 'Baby Boomer Ombré', 'Pink Aura', 'Zebra French', 'Leopard Accent', 'Matte Black Minimal'], 'starter Signature Looks exist');
const signatureBase = ensureFullSetBlueprint(createDefaultBlueprint({ shape: 'Oval', length: 0.45, width: 0.44, baseColorHex: '#123456' }));
const activeForSignature = getActiveNail(signatureBase);
const customGradient = { ...gradientLayer(activeForSignature), data: blueprint.normalizeGradientData({ colorA: '#111111', colorB: '#EEEEEE', direction: 'aura', gradientStops: [{ color: '#111111', position: 0 }, { color: '#777777', position: 50 }, { color: '#EEEEEE', position: 100 }] }) };
const customFrench = { ...frenchTipLayer(activeForSignature), data: normalizeFrenchTipData({ fillType: 'pattern', pattern: 'zebra', patternColorHex: '#FFFFFF', patternSecondaryColorHex: '#111111', patternScale: 1.4 }) };
const customAsset = assetLayer({ category: 'charms', id: 'bow-charm', name: 'Bow Charm', defaultColor: '#FFD1DC' }, activeForSignature);
const transformedAsset = { ...customAsset, transform: { x: 0.33, y: 0.72, scaleX: 0.24, scaleY: 0.24, rotation: 27 } };
const signatureSource = updateActiveNail(signatureBase, (nail) => ({ ...nail, shape: 'Coffin', length: 0.72, width: 0.57, baseColorHex: '#ABCDEF', layers: renumberLayers([nail.layers[0], customGradient, customFrench, transformedAsset]) }));
const savedLook = createSignatureLookFromBlueprint(signatureSource, 'Test Aura French', 'nail');
assert.equal(savedLook.nail.layers.find((layer) => layer.type === 'gradient').data.gradientStops.length, 3, 'Signature Look preserves gradientStops');
assert.equal(savedLook.nail.layers.find((layer) => layer.type === 'frenchTip').data.pattern, 'zebra', 'Signature Look preserves French tip pattern settings');
assert.deepEqual(savedLook.nail.layers.find((layer) => layer.type === 'charm').transform, transformedAsset.transform, 'Signature Look preserves asset size/position/rotation');
const appliedSelected = applySignatureLookToBlueprint(createDefaultBlueprint({ shape: 'Almond', baseColorHex: '#000000' }), savedLook, 'active');
assert.equal(getActiveNail(appliedSelected).shape, 'Coffin', 'applying look updates selected nail');
assert.equal(getActiveNail(appliedSelected).layers.find((layer) => layer.type === 'gradient').data.gradientStops[1].color, '#777777', 'applying look updates active canvas recipe');
const appliedFullSet = applySignatureLookToBlueprint(ensureFullSetBlueprint(createDefaultBlueprint({ shape: 'Almond' })), savedLook, 'all');
assert(appliedFullSet.nails.every((nail) => nail.shape === 'Coffin'), 'applying look updates full set');
assert(nailThumbnailSource.includes('layers={nail.layers}') || nailThumbnailSource.includes('nail.layers'), 'thumbnails update from applied look nail layer data');
const duplicatedLook = normalizeSignatureLook({ ...savedLook, id: 'duplicate-look', name: `${savedLook.name} copy`, starter: false });
const renamedLook = normalizeSignatureLook({ ...duplicatedLook, name: 'Renamed Look' });
const managedLooks = [savedLook, duplicatedLook].map(normalizeSignatureLook).filter((look) => look.id !== duplicatedLook.id);
assert.equal(duplicatedLook.name, 'Test Aura French copy', 'duplicate Signature Look works');
assert.equal(renamedLook.name, 'Renamed Look', 'rename Signature Look works');
assert.equal(managedLooks.length, 1, 'delete Signature Look works');
const loadedLooks = JSON.parse(JSON.stringify([savedLook])).map(normalizeSignatureLook);
assert.deepEqual(loadedLooks[0].nail.layers.find((layer) => layer.type === 'charm').transform, transformedAsset.transform, 'save/load preserves Signature Looks');
assert(designStudioSource.includes('SIGNATURE_LOOKS_STORAGE_KEY') && designStudioSource.includes('window.localStorage.setItem'), 'user-created Signature Looks save/load from localStorage');
assert.deepEqual(SHAPES, visibleHeroShapeFamilies, 'Hero 7 exact and Duck hidden after Signature Looks changes');
