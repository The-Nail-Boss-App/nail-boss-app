import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const blueprint = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(source)}`);

const {
  SHAPES,
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
  quantitySummary,
  revalidateLayersAfterNailResize,
  safeTransform,
} = blueprint;

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
