#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(repoRoot, 'client/src/designPricingBridge.js');
const tempPath = path.join(os.tmpdir(), `designPricingBridge-${Date.now()}.mjs`);
await fs.copyFile(sourcePath, tempPath);
const { buildDesignPricingInputs, calculateDesignSuggestion } = await import(`file://${tempPath}`);

assert.equal(typeof buildDesignPricingInputs, 'function', 'helper exists');
assert.equal(typeof calculateDesignSuggestion, 'function', 'pricing bridge exists');

const design = {
  blueprint: {
    canvas: { activeNailId: 'nail-1' },
    nails: [{
      id: 'nail-1',
      shape: 'almond',
      length: 0.74,
      width: 0.52,
      layers: [
        { id: 'base', type: 'base', visible: true, data: { polishType: 'Chrome' } },
        { id: 'gradient', type: 'gradient', visible: true, data: {} },
        { id: 'french', type: 'frenchTip', visible: true, data: {} },
        { id: 'pattern', type: 'pattern', visible: true, data: {} },
        { id: 'charm', type: 'charm', visible: true, data: {} },
        { id: 'hidden-jewel', type: 'jewel', visible: false, data: {} },
        { id: 'jewel', type: 'jewel', visible: true, data: {} },
        { id: 'decal', type: 'decal', visible: true, data: {} },
      ],
    }],
  },
};

const normalized = buildDesignPricingInputs(design);
assert.equal(normalized.serviceCategory, 'Custom Design', 'normalizes service category');
assert.equal(normalized.lengthTier, 'XL', 'normalizes length tier');
assert.deepEqual(normalized.embellishments, { charmCount: 1, jewelCount: 1, decalCount: 1 }, 'counts visible embellishments');
assert.equal(normalized.artLevel, 'Basic Art', 'infers art level from design content');
assert.equal(normalized.estimatedComplexity, 'medium', 'infers complexity');
assert.ok(normalized.finishTypes.includes('Chrome'), 'extracts polish type');
assert.ok(normalized.finishTypes.includes('Gradient'), 'extracts gradient finish');
assert.ok(normalized.finishTypes.includes('French Tip'), 'extracts french tip finish');
assert.equal(normalized.designSignals.shape, 'Almond', 'extracts shape');
assert.equal(normalized.designSignals.width, 0.52, 'extracts width');
assert.equal(normalized.designSignals.artIndicators.pattern, true, 'extracts pattern indicator');

const pricingLibrary = {
  basePrice: 40,
  baseMinutes: 90,
  depositPercent: 25,
  categories: {
    lengthPricing: { rows: [{ name: 'XL', amount: 15 }] },
    finishPricing: { rows: [{ name: 'Chrome', amount: 10 }, { name: 'Gradient', amount: 7 }, { name: 'French Tip', amount: 5 }] },
    nailArtPricing: { rows: [{ name: 'Basic Art', amount: 12 }] },
    embellishmentPricing: { rows: [{ name: 'Charm', amount: 5 }, { name: 'Jewel', amount: 3 }, { name: 'Decal / Sticker', amount: 2 }] },
    timeAddOns: { rows: [{ name: 'Chrome', amount: 15 }, { name: 'French Tip', amount: 10 }, { name: 'Basic Art', amount: 20 }, { name: 'Charm Placement', amount: 10 }] },
  },
};

const suggestion = calculateDesignSuggestion(design, pricingLibrary);
assert.equal(suggestion.suggestedPrice, 99, 'calculates pricing suggestion from design content');
assert.equal(suggestion.suggestedDeposit, 24.75, 'calculates suggested deposit');
assert.equal(suggestion.estimatedTime, 145, 'calculates estimated time');
assert.ok(suggestion.breakdown.some((item) => item.label === 'Basic Art'), 'returns breakdown');

const missing = calculateDesignSuggestion(null, null);
assert.deepEqual(missing.inputs.embellishments, { charmCount: 0, jewelCount: 0, decalCount: 0 }, 'missing data fallback counts zero embellishments');
assert.equal(missing.suggestedPrice, 0, 'missing data fallback price is safe');
assert.equal(missing.estimatedTime, 0, 'missing data fallback time is safe');

const untouchedFiles = [
  'client/src/DesignStudio.jsx',
  'client/src/design-studio/DesignStudio.jsx',
  'client/src/design-studio/NailCanvas.jsx',
  'client/src/design-studio/FullSetPreview.jsx',
  'client/src/Proposals.jsx',
  'client/src/NailShop.jsx',
];
const { stdout: statusOutput } = await execFileAsync('git', ['status', '--short', '--', ...untouchedFiles], { cwd: repoRoot });
assert.equal(statusOutput.trim(), '', 'protected UI files unchanged');

const appSource = await fs.readFile(path.join(repoRoot, 'client/src/App.jsx'), 'utf8');
assert.ok(appSource.includes('setPage(PAGES.STUDIO)'), 'login still lands on Design Studio');

const rendererSource = await fs.readFile(path.join(repoRoot, 'client/src/FullSetRenderer.jsx'), 'utf8');
assert.ok(rendererSource.includes('nails: [...normalized.left, ...normalized.right]'), 'Hero 7 exact regression stays fixed');
assert.ok(!rendererSource.includes('slice(0, 7)') && !rendererSource.includes('.slice(1)'), 'Hero 7 exact forbidden slices absent');

const headquartersSource = await fs.readFile(path.join(repoRoot, 'client/src/Headquarters.jsx'), 'utf8');
assert.ok(!headquartersSource.toLowerCase().includes('duck'), 'Duck hidden regression stays fixed');

await fs.rm(tempPath, { force: true });
console.log('Design pricing bridge tests passed');
