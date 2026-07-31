import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const blueprintSource = await readFile(new URL('../client/src/design-studio/blueprint.js', import.meta.url), 'utf8');
const polishSource = await readFile(new URL('../client/src/design-studio/polish.js', import.meta.url), 'utf8');
const rendererSource = await readFile(new URL('../client/src/design-studio/PolishRenderer.jsx', import.meta.url), 'utf8');
const blueprint = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(blueprintSource)}`);
const polish = await import(`data:text/javascript;charset=utf-8,${encodeURIComponent(polishSource)}`);

assert.deepEqual(blueprint.SHAPES, ['Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto', 'Lipstick', 'Duck']);
for (const shape of blueprint.SHAPES) {
  assert.match(blueprint.buildNailPath(shape, { shape, length: 0.64, width: 0.5 }), /^M /, `${shape} has a reusable SVG mask`);
  assert(blueprint.FOUNDER_APPROVED_NAIL_MASKS[shape], `${shape} is registered as Founder-approved`);
}

for (const preset of ['Cream', 'Jelly', 'Matte', 'Glass', 'Chrome-ready']) {
  assert(polish.SURFACE_MATERIAL_PRESETS.includes(preset), `${preset} material foundation is available`);
  assert.equal(typeof polish.polishMaterialProfile(preset).reflection, 'number');
}
assert.equal(polish.polishMaterialProfile('Chrome-ready').metallic, 0, 'Chrome-ready does not implement Chrome');

for (const layer of ['base-polish', 'curvature', 'highlight', 'reflection', 'gloss', 'top-coat']) {
  assert(rendererSource.includes(`data-render-layer="${layer}"`), `${layer} is a reusable render layer`);
}
for (const realismLayer of ['cuticle-fade', 'subtle-sidewall-shading', 'free-edge-thickness-rim', 'apex-highlight']) {
  assert(rendererSource.includes(realismLayer), `${realismLayer} is present`);
}

console.log('Luxury nail renderer architecture checks passed.');
