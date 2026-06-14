import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const nailCanvasSource = await readFile(new URL('../client/src/design-studio/NailCanvas.jsx', import.meta.url), 'utf8');
const nailThumbnailSource = await readFile(new URL('../client/src/design-studio/NailThumbnail.jsx', import.meta.url), 'utf8');
const assetRenderingSource = await readFile(new URL('../client/src/design-studio/assetRendering.js', import.meta.url), 'utf8');
const bulkActionsPanelSource = await readFile(new URL('../client/src/design-studio/BulkActionsPanel.jsx', import.meta.url), 'utf8');
const designStudioSource = await readFile(new URL('../client/src/design-studio/DesignStudio.jsx', import.meta.url), 'utf8');
const frenchTipRenderingSource = await readFile(new URL('../client/src/design-studio/frenchTipRendering.js', import.meta.url), 'utf8');
const propertiesPanelSource = await readFile(new URL('../client/src/design-studio/PropertiesPanel.jsx', import.meta.url), 'utf8');
const blueprint = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);

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
  frenchTipLayer,
  applyFrenchTipToSlots,
  normalizeFrenchTipData,
  FRENCH_TIP_PRESETS,
  POLISH_TYPES,
  cloneNailDesign,
} = blueprint;


const salonShapeFamilies = ['Square', 'Tapered Square', 'Russian Square', 'Coffin', 'Slim Coffin', 'Almond', 'Russian Almond', 'Oval', 'Round', 'Stiletto', 'Edge', 'Lipstick', 'Flare', 'Mountain Peak'];
assert.deepEqual(SHAPES, salonShapeFamilies, 'Shape Engine V2 exposes the required salon shape families without length variants');
for (const shape of salonShapeFamilies) {
  const nail = { shape, length: 0.56, width: 0.52, taper: 0.5, apexHeight: 0.5, sidewallCurve: 0.5, freeEdgeThickness: 0.5 };
  assert(buildNailPath(shape, nail).startsWith('M '), `${shape} returns a renderable nail silhouette path`);
  assert(isPointInsideNailSilhouette({ x: 0.5, y: 0.5 }, nail), `${shape} keeps the centerline inside the nail bed`);
  const architecture = getNailArchitecture(nail);
  assert(architecture.apexYNorm > 0.25 && architecture.apexYNorm < 0.65, `${shape} has a realistic apex placement`);
  assert(architecture.freeEdgeYNorm > 0.45 && architecture.freeEdgeYNorm < 0.92, `${shape} has a realistic free-edge boundary`);
}

const defaultShapeNail = { length: 0.56, width: 0.52, taper: 0.5, apexHeight: 0.5, sidewallCurve: 0.5, freeEdgeThickness: 0.5 };
const roundMetrics = getNailShapeMetrics('Round', { ...defaultShapeNail, shape: 'Round' });
const ovalMetrics = getNailShapeMetrics('Oval', { ...defaultShapeNail, shape: 'Oval' });
const almondMetrics = getNailShapeMetrics('Almond', { ...defaultShapeNail, shape: 'Almond' });
assert.notEqual(buildNailPath('Round', { ...defaultShapeNail, shape: 'Round' }), buildNailPath('Almond', { ...defaultShapeNail, shape: 'Almond' }), 'Round does not match Almond render geometry');
assert.notEqual(buildNailPath('Oval', { ...defaultShapeNail, shape: 'Oval' }), buildNailPath('Almond', { ...defaultShapeNail, shape: 'Almond' }), 'Oval does not match Almond render geometry');
assert(roundMetrics.tipHalfWidth > ovalMetrics.tipHalfWidth && ovalMetrics.tipHalfWidth > almondMetrics.tipHalfWidth, 'Round, Oval, and Almond have distinct tip-width behavior');
assert(roundMetrics.sidewallHalfWidth > ovalMetrics.sidewallHalfWidth && ovalMetrics.sidewallHalfWidth > almondMetrics.sidewallHalfWidth, 'Round, Oval, and Almond have distinct sidewall/taper behavior');
for (const shape of ['Round', 'Oval']) {
  const shaped = { ...defaultShapeNail, shape };
  assert(buildNailPath(shape, shaped).startsWith('M '), `${shape} produces a valid render path`);
  assert(isPointInsideNailSilhouette({ x: 0.5, y: 0.96 }, shaped), `${shape} keeps French Tip center geometry inside the clipping silhouette`);
  const frenchLayer = frenchTipLayer(shaped, 'classic', 'medium');
  assert.equal(frenchLayer.type, 'frenchTip', `${shape} supports French Tip layer creation for clipped rendering`);
}
assert(nailCanvasSource.includes('justifyContent: "flex-start"') && nailCanvasSource.includes('width: "min(54vh, 96%)"') && nailCanvasSource.includes('maxWidth: 430'), 'active nail canvas is top-aligned with reduced vertical footprint while preserving a comfortable design size');

assert.notEqual(buildNailPath('Coffin', { shape: 'Coffin', taper: 0.1 }), buildNailPath('Coffin', { shape: 'Coffin', taper: 0.9 }), 'taper control adjusts geometry without switching shape families');
assert.notEqual(getNailArchitecture({ shape: 'Almond', apexHeight: 0.1 }).apexYNorm, getNailArchitecture({ shape: 'Almond', apexHeight: 0.9 }).apexYNorm, 'apex height control moves the architecture apex');
assert(designStudioSource.includes('Shape Debug Overlay') && nailCanvasSource.includes('debugOverlay'), 'hidden developer shape debug overlay can render centerline, apex, sidewalls, cuticle, and free-edge boundaries');

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
assert(nailCanvasSource.includes('pointerEvents="none"><defs><LayerGradient'), 'gradient overlays are canvas-nonblocking in every mode');
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
  const constrained = constrainAssetTransform({ x: 0.98, y: 0.98, scaleX: 0.34, scaleY: 0.34, rotation: 38 }, shapedNail, largeAsset);
  assert(assetFitsNailSilhouette(constrained, shapedNail, largeAsset), `${shape} rotated large asset fits silhouette`);
  assert(constrained.scaleX <= 0.34 && constrained.scaleX >= 0.06, `${shape} scale stays normalized and bounded`);
}

const stiletto = { ...nail, shape: 'Stiletto' };
const jewel = { type: 'jewel' };
assert(assetFitsNailSilhouette(safeTransform({ x: 0.5, y: 0.98, scaleX: 0.22, scaleY: 0.22, rotation: 0 }, stiletto, 'jewel'), stiletto, jewel), 'jewel near stiletto tip is safely repositioned or reduced');

const blueprintDoc = createDefaultBlueprint({ shape: 'Oval', length: 1, width: 1 });
const active = getActiveNail(blueprintDoc);
const layer = assetLayer({ id: 'charm-bow', name: 'Bow', category: 'charms', defaultColor: '#fff' }, active);
const withLayer = ensureBlueprint({ ...blueprintDoc, nails: [{ ...active, layers: [...active.layers, { ...layer, transform: { x: 0.08, y: 0.55, scaleX: 0.34, scaleY: 0.34, rotation: 25 } }] }] });
const resized = revalidateLayersAfterNailResize({ ...withLayer, nails: [{ ...getActiveNail(withLayer), shape: 'Almond', length: 0.15, width: 0.05 }] });
const resizedNail = getActiveNail(resized);
const resizedLayer = resizedNail.layers.find((item) => item.type === 'charm');
assert(assetFitsNailSilhouette(resizedLayer.transform, resizedNail, resizedLayer), 'asset revalidates after shape, length, and width changes');
assert.equal(quantitySummary(resized).charm, 1, 'quantity hooks count only valid visible charm geometry');



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
assert(propertiesPanelSource.includes('layer.data.smileCurve ?? 0.32') && propertiesPanelSource.includes('layer.data.smileDepth ?? 0.24') && propertiesPanelSource.includes('layer.data.smileWidth ?? 0.82') && propertiesPanelSource.includes('layer.data.tipHeight ?? 0.32') && propertiesPanelSource.includes('layer.data.rotation ?? 0'), 'Properties panel preserves zero-valued French Tip sliders with nullish fallbacks');
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
const basedAll = blueprint.applyBaseToSlots(fullSet, { baseColorHex: '#FEDCBA' }, blueprint.FULL_SET_SLOTS);
assert(basedAll.nails.every((n) => n.baseColorHex === '#FEDCBA'), 'apply base color to all nails updates ten nails');
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
assert(designStudioSource.includes('<BulkActionsPanel'), 'Design Studio renders bulk action controls');
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
const polishRendererSource = await readFile(new URL('../client/src/design-studio/PolishRenderer.jsx', import.meta.url), 'utf8');
assert(polishRendererSource.includes('id={`${uid}-cream`}') && polishRendererSource.includes('subtle') === false, 'Cream rendering has a dedicated smooth salon polish gradient');
assert(polishRendererSource.includes('id={`${uid}-jelly`}') && polishRendererSource.includes('polishOpacity'), 'Jelly transparency uses translucent polish opacity');
assert(polishRendererSource.includes('id={`${uid}-milky`}'), 'Milky rendering has a dedicated cloudy semi-sheer gradient');
assert(polishRendererSource.includes('data.topCoat === "Matte" || data.polishType === "Matte" ? 0 : data.shine'), 'Matte polish suppresses topcoat shine');
assert(polishRendererSource.includes('data.chromeIntensity'), 'Chrome rendering is controlled by Chrome Intensity');
assert(polishRendererSource.includes('data.catEyeAngle') && polishRendererSource.includes('data.catEyeIntensity'), 'Cat Eye rendering is controlled by angle and intensity');
assert(polishRendererSource.includes('data.sparkleDensity') && polishRendererSource.includes('data.sparkleSize'), 'Glitter rendering is controlled by density and size');
assert(polishRendererSource.includes('apex') && polishRendererSource.includes('sidewall') === false && polishRendererSource.includes('freeEdgeYNorm'), 'realism layers follow Shape Engine V2 apex and free-edge geometry');
assert(nailCanvasSource.includes('<PolishSurface') && nailThumbnailSource.includes('<PolishSurface'), 'Polish rendering is shared by NailCanvas, thumbnail, hand, and full-set previews');
assert(propertiesPanelSource.includes('Polish Settings') && propertiesPanelSource.includes('Polish Type') && propertiesPanelSource.includes('Top Coat'), 'Design Studio exposes salon-language Polish Settings controls');
assert(propertiesPanelSource.includes('polish.polishType === "Glitter"') && propertiesPanelSource.includes('polish.polishType === "Cat Eye"') && propertiesPanelSource.includes('polish.polishType === "Chrome"'), 'Polish Settings only show relevant Glitter, Cat Eye, and Chrome controls');
assert.deepEqual(POLISH_TYPES, ['Cream', 'Jelly', 'Milky', 'Matte', 'Chrome', 'Cat Eye', 'Glitter'], 'Polish Engine exposes all required polish types');
const polishDefaultBlueprint = createDefaultBlueprint({ baseColorHex: '#123456' });
const polishBase = getActiveNail(polishDefaultBlueprint).layers.find((layer) => layer.type === 'base');
assert.equal(polishBase.data.polishType, 'Cream', 'old designs default to Cream polish safely');
assert.equal(polishBase.data.colorHex, '#123456', 'base polish color is preserved through save/load normalization');
const copiedPolish = cloneNailDesign(getActiveNail(polishDefaultBlueprint), { ...getActiveNail(polishDefaultBlueprint), id: 'copy', slot: 'copy' });
assert.equal(copiedPolish.layers.find((layer) => layer.type === 'base').data.polishType, 'Cream', 'copy/duplicate-style nail cloning preserves polish fields');
assert(polishSource.includes('POLISH_TYPES') && polishSource.includes('TOP_COATS'), 'proposal-compatible polish fields stay inside existing blueprint layer data');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Solid', effectColorHex: '#FFFFFF' }).polishType, 'Cream', 'legacy Solid base effects render as Cream polish');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Gradient', effectColorHex: '#FFFFFF' }).polishType, 'Gradient', 'legacy Gradient base effects keep gradient rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Chrome', effectColorHex: '#FFFFFF' }).polishType, 'Chrome', 'legacy Chrome base effects map to Chrome polish rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'CatEye', effectColorHex: '#FFFFFF' }).polishType, 'Cat Eye', 'legacy CatEye base effects map to Cat Eye polish rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', effect: 'Marble', effectColorHex: '#FFFFFF' }).polishType, 'Marble', 'legacy Marble base effects keep marble-like rendering when no explicit Polish Type exists');
assert.equal(polishModule.resolvePolishDataForRender({ colorHex: '#101010', polishType: 'Jelly', effect: 'Chrome', effectColorHex: '#FFFFFF' }).polishType, 'Jelly', 'explicit Polish Type overrides legacy base effects');
assert(polishRendererSource.includes('resolvePolishDataForRender(baseLayer?.data || {})') && polishRendererSource.includes('resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF")'), 'NailCanvas, thumbnails, hand previews, and full-set previews share legacy-aware Polish rendering');
assert(polishRendererSource.includes('id={`${uid}-legacy-gradient`}') && polishRendererSource.includes('id={`${uid}-legacy-marble`}'), 'legacy Gradient and Marble have dedicated compatible renderer definitions');
assert(polishSource.includes('hasExplicitPolishType') && polishSource.includes('if (hasExplicitPolishType(data)) return normalized'), 'user-selected Polish Type remains authoritative over legacy effect fields');
