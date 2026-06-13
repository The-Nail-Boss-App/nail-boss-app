import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const nailCanvasSource = await readFile(new URL('../client/src/design-studio/NailCanvas.jsx', import.meta.url), 'utf8');
const designStudioSource = await readFile(new URL('../client/src/design-studio/DesignStudio.jsx', import.meta.url), 'utf8');
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
  normalizedToSvg,
  projectPointInsideNailSilhouette,
  isPointInsideNailSilhouette,
  isReusableDrawingLayer,
  quantitySummary,
  revalidateLayersAfterNailResize,
  safeTransform,
  flatDesignFromBlueprint,
  synchronizeBase,
  updateActiveNail,
} = blueprint;


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

const invalidActive = ensureBlueprint({ ...multiNailBlueprint(5), canvas: { mode: 'full-set', activeNailId: 'missing' } });
assert.equal(invalidActive.canvas.activeNailId, 'nail-1', 'normalization repairs invalid activeNailId to a preserved nail');
assert.deepEqual(invalidActive.nails[4], multiNailBlueprint(5).nails[4], 'inactive backend-valid nails remain byte-equivalent when activeNailId is repaired');

assert(nailCanvasSource.includes('setDrag({ kind: "asset"'), 'NailCanvas uses an explicit asset drag-state variant');
assert(nailCanvasSource.includes('setDrag({ kind: "drawing"'), 'NailCanvas uses an explicit drawing drag-state variant');
assert(nailCanvasSource.includes('event.currentTarget.setPointerCapture?.(event.pointerId);\n    setDrag({ kind: "drawing"'), 'drawing gestures capture the root SVG pointer before stroke tracking');
assert(nailCanvasSource.includes('releaseCapture(drag.captureTarget, drag.pointerId);'), 'drawing and asset gestures release pointer capture safely on completion or cancel');
assert(nailCanvasSource.includes('if (mode === "draw" || mode === "eraser") return;'), 'asset transform pointerMove is guarded during draw and eraser modes');
assert(nailCanvasSource.includes('pointerEvents="none"><defs><LayerGradient'), 'gradient overlays are canvas-nonblocking in every mode');
assert(nailCanvasSource.includes('pointerEvents="none"><defs><PatternDefs'), 'pattern overlays are canvas-nonblocking in every mode');
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
assert(designStudioSource.includes('activeNail.layers.find(isReusableDrawingLayer)'), 'eraser searches only visible unlocked drawing layers when the selected layer is not reusable');
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

console.log('geometry-helper-test passed');
