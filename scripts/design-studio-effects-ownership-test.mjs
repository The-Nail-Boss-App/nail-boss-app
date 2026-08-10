import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const studio = readFileSync(new URL('../client/src/nail-design-studio/NailDesignStudio.jsx', import.meta.url), 'utf8');
const tests = readFileSync(new URL('../client/src/nail-design-studio/NailDesignStudio.test.jsx', import.meta.url), 'utf8');
const effects = readFileSync(new URL('../client/src/hero-design/effect.ts', import.meta.url), 'utf8');

for (const [value, label] of [['Gradient', 'Ombré'], ['Marble', 'Marble'], ['Chrome', 'Chrome'], ['Cat Eye', 'Cat Eye'], ['Aura', 'Aura']]) {
  assert.ok(studio.includes(`value: '${value}', label: '${label}'`), `${label} should map to existing ${value} data`);
  assert.ok(effects.includes(value), `${value} should retain its existing Hero renderer`);
}
assert.match(studio, /aria-label="Effect"[\s\S]*EFFECT_OPTIONS\.map/, 'Effects should expose only its owned choices');
assert.match(studio, /activeTool\.id === 'polish' && <section className="nail-design-studio__polish-workflow"/, 'Project Palette and Recently Used should remain Polish-only');
assert.match(studio, /activeTool\.id === 'polish' && <><section className="nail-design-studio__apply-scope"/, 'Apply Polish should remain Polish-only');
assert.match(studio, /activeTool\.id === 'polish' && \['baseColor', 'colorA'\]\.includes\(key\)\) rememberPolish\(next\)/, 'effect color editing should not enter Polish history');
assert.match(tests, /gives Effects exclusive ownership[\s\S]*paletteCount[\s\S]*recentCount[\s\S]*\['Gradient', 'Direction'\][\s\S]*\['Marble', 'Vein density'\][\s\S]*\['Chrome', 'Metallic Reflection'\][\s\S]*\['Cat Eye', 'Stripe strength'\]/, 'focused ownership and Polish regression coverage should remain present');
assert.match(tests, /loads both mounted metadata and legacy French Tip layer persistence/, 'French Tip regression coverage should remain intact');
assert.match(studio, /createHeroDesignDocument[\s\S]*interfaceFinish\(parsed\?\.metadata\?\.activePolishFormulation\?\.finish \|\| parsed\?\.nail\?\.effect\?\.id/, 'legacy effect identifiers should still hydrate through the shared document');

console.log('Design Studio Effects ownership guardrails passed.');
