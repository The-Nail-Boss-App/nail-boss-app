import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const studio = read('client/src/design-studio/DesignStudio.jsx');
const bottle = read('client/src/design-studio/PolishBottle.jsx');
const blueprint = read('client/src/design-studio/blueprint.js');
const gallery = read('client/src/BlueprintGalleryRenderer.jsx');

assert(bottle.includes('export default function PolishBottle'), 'PolishBottle component exists');
assert(['colorHex', 'label', 'selected', 'size', 'polishType', 'onClick'].every((prop) => bottle.includes(prop)), 'PolishBottle supports required props');
assert(bottle.includes('accessibleLabel') && bottle.includes('aria-label'), 'PolishBottle includes accessible label handling');
assert(bottle.includes('cap') || bottle.includes('capWidth'), 'PolishBottle renders a cap');
assert(bottle.includes('bodyWidth') && bottle.includes('height: "78%"'), 'PolishBottle renders bottle body and polish fill');
assert(bottle.includes('rgba(255,255,255,.42)'), 'PolishBottle renders a subtle highlight');

assert(studio.includes('data-testid="polish-rack"'), 'Polish Rack section exists');
assert(studio.includes('Polish Rack™'), 'Polish Rack™ wording exists');
assert(studio.includes('Recently Used Polish'), 'Recently Used Polish wording exists');
assert(!studio.includes('Recent Colors'), 'Recent Colors wording is removed from Design Studio UI');
assert(studio.includes('onRackSelect={(value) => updateBase({ baseColorHex: normalizeHex(value'), 'clicking a rack bottle applies a Polish Color through existing base color logic');
assert(studio.includes('prev.filter((color) => color !== normalized)') && studio.includes('RECENT_POLISH_LIMIT'), 'duplicate polish colors are not repeated and recent list is capped');
assert(studio.includes('baseLayer?.data?.colorHex || activeNail.baseColorHex'), 'legacy baseColorHex remains supported in Design Studio color value');
assert(blueprint.includes('baseColorHex') && blueprint.includes('getVisibleBaseColor'), 'legacy baseColorHex remains supported in blueprint helpers');
assert(blueprint.includes('export const SHAPES = ["Almond", "Square", "Coffin", "Stiletto", "Oval", "Round", "Lipstick"]'), 'Hero 7 exact guardrail remains present');
assert(blueprint.includes('HIDDEN_SHAPE_FALLBACKS = { Duck: "Square" }') && !gallery.includes('Full Set Composition') && !studio.includes('Full Set Composition'), 'Duck hidden fallback remains and Full Set Composition chrome is absent');

console.log('Polish Bottle / Polish Rack source tests passed');
