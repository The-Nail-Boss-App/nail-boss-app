import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NailDesignStudio, { canScrollInWheelDirection, creamHeroSurfaceResponse, glitterHeroSurfaceResponse, jellyHeroSurfaceResponse, matteHeroSurfaceResponse, stageLightingOpacity, surfaceMaterialFinish } from './NailDesignStudio';
import { heroEffectForPolish, normalizePersistedAuraEffect, normalizePolishForFinish } from './polishFinish';
import { MATERIAL_PROFILES, materialProfile } from './MaterialRenderer';
import { createHeroDesignDocument } from '../hero-design/index.ts';
import { loadFrenchTips } from './FrenchTip';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const keyDown = async (element, key) => act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
const type = async (input, value) => act(async () => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});
const editHex = async (container, value) => {
  const input = container.querySelector('input[aria-label="Base Color HEX"]');
  await type(input, value);
  await act(async () => input.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
};

describe('DS-03 Polish Studio repair', () => {
  beforeEach(async () => {
    window.localStorage.removeItem('anitaset.designStudio.polishRack.v2');
    window.localStorage.removeItem('anitaset.hero-design.v1:nail-desk-hero');
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.removeItem('anitaset.hero-design.v1:nail-desk-hero'); });

  it('uses Cream terminology, a compact safe HEX editor, and the shared premium bottle renderer', async () => {
    const finish = container.querySelector('select[aria-label="Finish"]');
    expect([...finish.options].map((option) => option.textContent)).toEqual(['Cream', 'Matte', 'Jelly', 'Glitter']);
    expect([...finish.options].map((option) => option.textContent)).not.toContain('Solid');
    const card = container.querySelector('[data-testid="active-polish-card"]');
    expect(card).toBeTruthy();
    expect(card.textContent).toContain('Active Polish');
    const bottleRegion = card.querySelector('.nail-design-studio__active-bottle');
    expect(bottleRegion).toBeTruthy();
    expect(bottleRegion.parentElement).toBe(card);
    expect(card.querySelector('.polish-bottle-figure').dataset.polishFinish).toBe('Cream');
    expect(card.querySelector('input[aria-label="Polish name"]')).toBeNull();
    expect(card.querySelector('input[aria-label="Opacity"]')).toBeNull();
    const details = card.querySelector('.nail-design-studio__active-details');
    expect([...details.querySelectorAll('label')].map((label) => label.firstChild.textContent)).toEqual(['Color / HEX', 'Finish']);
    const hex = container.querySelector('input[aria-label="Base Color HEX"]');
    expect(hex.classList.contains('nail-design-studio__hex-input')).toBe(true);
    await type(hex, '#ABCDEF'); await act(async () => hex.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(container.querySelector('input[type="color"]').value.toUpperCase()).toBe('#ABCDEF');
    expect(card.querySelector('.polish-bottle-figure').dataset.polishColor).toBe('#ABCDEF');
    await type(hex, '#BAD'); await act(async () => hex.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(hex.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps browser presentation from replacing the black Cream material paint servers', async () => {
    await editHex(container, '#000000');

    const nail = container.querySelector('svg[data-testid="stage-nail"]');
    const base = nail.querySelector('[data-material-layer="base-pigment"]');
    const materialLayers = [
      'base-pigment',
      'curvature-shadow',
      'edge-darkening',
      'material-diffusion',
      'reflection',
      'top-coat',
    ];

    expect(nail.dataset.renderColor).toBe('#000000');
    expect(base.getAttribute('fill')).toMatch(/^url\(#hero-material-0-pigment\)$/);
    // jsdom does not resolve SVG presentation attributes or paint servers into
    // computed style. It does expose author CSS overrides, which is the part of
    // the cascade this regression test is intended to catch.
    const computedBase = getComputedStyle(base);
    expect(computedBase.fill).toBe('');
    expect(computedBase.fill).not.toMatch(/#e990b1|#d94c70|#e8a0bf|rgb\(233, 144, 177\)/i);
    expect(base.getAttribute('opacity')).toBe('1');

    for (const layer of materialLayers) {
      const element = nail.querySelector(`[data-material-layer="${layer}"]`);
      const style = getComputedStyle(element);
      expect(style.fill).not.toMatch(/#e990b1|#d94c70|#e8a0bf|rgb\(233, 144, 177\)/i);
      expect(['', 'none']).toContain(style.filter);
      expect(['', 'normal']).toContain(style.mixBlendMode);
    }

    for (const ancestor of [nail, nail.parentElement, nail.parentElement.parentElement, nail.parentElement.parentElement.parentElement]) {
      const style = getComputedStyle(ancestor);
      expect(['', 'none']).toContain(style.filter);
      expect(['', '1']).toContain(style.opacity);
      expect(['', 'normal']).toContain(style.mixBlendMode);
      expect(['', undefined, 'none']).toContain(style.backdropFilter);
    }
  });

  it('restrains Cream-only Hero body whitening beneath the canonical clear coat', () => {
    const low = creamHeroSurfaceResponse(0);
    const salon = creamHeroSurfaceResponse(.68);
    const high = creamHeroSurfaceResponse(1);
    expect(low).toEqual({ apex: .08, primary: .04, edge: .1 });
    for (const role of ['apex', 'primary', 'edge']) {
      expect(salon[role]).toBeGreaterThan(low[role]);
      expect(high[role]).toBeGreaterThan(salon[role]);
      expect(high[role]).toBeLessThan(.16);
    }
    const nail = container.querySelector('svg[data-testid="stage-nail"]');
    expect(Number(nail.querySelector('[id^="hero-light-primary"] stop:nth-child(2)').getAttribute('stop-opacity'))).toBeLessThan(.05);
    expect(Number(nail.querySelector('[id^="hero-light-apex"] stop').getAttribute('stop-opacity'))).toBeLessThan(.05);
  });

  it('keeps Hero lighting subordinate to the Jelly wet-gel surface', () => {
    const low = jellyHeroSurfaceResponse(0);
    const salon = jellyHeroSurfaceResponse(.74);
    const high = jellyHeroSurfaceResponse(1);
    expect(low).toEqual({ apex: .16, primary: .06, edge: .16 });
    for (const role of ['apex', 'primary', 'edge']) {
      expect(salon[role]).toBeGreaterThan(low[role]);
      expect(high[role]).toBeGreaterThan(salon[role]);
      expect(high[role]).toBeLessThan(.3);
    }
  });

  it('gives dedicated Glitter Cream-family, Shine-responsive final Hero lighting', () => {
    expect(glitterHeroSurfaceResponse(0)).toEqual(creamHeroSurfaceResponse(0));
    expect(glitterHeroSurfaceResponse(1)).toEqual(creamHeroSurfaceResponse(1));
    const low = stageLightingOpacity('Glitter', 0, 'primary', .442);
    const high = stageLightingOpacity('Glitter', 1, 'primary', .442);
    expect(low).toBeCloseTo(.01768, 5);
    expect(high).toBeCloseTo(.03978, 5);
    expect(high).toBeGreaterThan(low * 2);
    expect(stageLightingOpacity('Glitter', .68, 'apex', .399)).toBeLessThan(.05);
    expect(stageLightingOpacity('Glitter', .68, 'primary', .442)).toBeLessThan(.05);
    expect(stageLightingOpacity('Solid', .68, 'primary', .442)).toBe(stageLightingOpacity('Cream', .68, 'primary', .442));
  });

  it('isolates Matte from generic Solid Hero lighting while retaining depth', () => {
    expect(['Solid', 'Marble', 'Cream', 'Jelly', 'Matte', 'Glitter'].map(surfaceMaterialFinish)).toEqual(['Cream', 'Cream', 'Cream', 'Jelly', 'Matte', 'Glitter']);
    expect(matteHeroSurfaceResponse).toEqual({ apex: .08, primary: .035, edge: .08 });
    for (const role of ['apex', 'primary', 'edge']) {
      expect(stageLightingOpacity('Matte', .08, role, 1)).toBeLessThan(stageLightingOpacity('Gradient', .08, role, 1) * .1);
    }
    expect(stageLightingOpacity('Solid', .08, 'primary', .42)).toBe(stageLightingOpacity('Cream', .08, 'primary', .42));
    expect(stageLightingOpacity('Cream', .68, 'primary', .42)).toBe(.42 * creamHeroSurfaceResponse(.68).primary);
    expect(stageLightingOpacity('Marble', .68, 'primary', .42)).toBe(stageLightingOpacity('Cream', .68, 'primary', .42));
    expect(stageLightingOpacity('Jelly', .74, 'primary', .42)).toBe(.42 * jellyHeroSurfaceResponse(.74).primary);

    const depth = container.querySelector('[id^="hero-light-depth"] stop:last-child');
    expect(Number(depth.getAttribute('stop-opacity'))).toBeGreaterThan(0);
  });

  it('saves polish to the single lower Polish Rack', async () => {
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain('saved to Polish Rack');
    const lowerNames = [...container.querySelectorAll('.nail-design-studio__lower-polish > span')].map((node) => node.textContent.replace('★ ', ''));
    expect(lowerNames).toContain('#D94C70');
    expect(container.textContent).not.toContain('Blush Royalty');
    expect(container.querySelector('button[aria-label="Remove polish from Polish Rack"]')).toBeTruthy();
    expect(JSON.parse(window.localStorage.getItem('anitaset.designStudio.polishRack.v2'))).toEqual(expect.any(Array));
  });


  it('normalizes incompatible and legacy finish properties before Hero routing', async () => {
    const chrome = normalizePolishForFinish({ colorHex: '#123456', glitterDensity: .9 }, 'Chrome');
    expect(chrome.glitterDensity).toBeUndefined();
    expect(heroEffectForPolish(chrome).parameters.glitterDensity).toBeUndefined();
    const glitter = normalizePolishForFinish({ colorHex: '#123456', glitterDensity: .61, stripeWidth: .4 }, 'Glitter');
    expect(glitter.glitterDensity).toBe(.61);
    expect(glitter.stripeWidth).toBeUndefined();
    expect(heroEffectForPolish(glitter).parameters.glitterDensity).toBeUndefined();
    expect(normalizePolishForFinish({ glitterDensity: .8 }, 'retired-finish').finish).toBe('Cream');
    expect(normalizePolishForFinish({ colorHex: '#F2E9E7', veinColor: 'broken', veinDensity: Number.NaN }, 'Marble')).toMatchObject({ veinColor: '#8A405D', veinDensity: .42, marbleSeed: 'marble-layout-v1' });
    expect(heroEffectForPolish(normalizePolishForFinish({ finish: 'Marble', marbleSeed: 'saved-layout' }, 'Marble')).parameters.marbleSeed).toBe('saved-layout');

    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Jelly', 'Matte', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(select.value).toBe(finish);
      expect(container.querySelector('[data-design-layer="polish"]')).toBeTruthy();
    }
  });

  it('keeps Glitter base, fleck, and density controls independent', async () => {
    const select = container.querySelector('select[aria-label="Finish"]');
    await act(async () => { select.value = 'Glitter'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    const fleck = container.querySelector('input[aria-label="Fleck Color"]');
    const density = container.querySelector('input[aria-label="Glitter Density"]');
    expect(fleck).toBeTruthy(); expect(density).toBeTruthy();
    await type(fleck, '#7B2CBF');
    await type(density, '0.75');
    await editHex(container, '#A40A30');
    expect(fleck.value.toUpperCase()).toBe('#7B2CBF');
    expect(density.value).toBe('0.75');
    expect(container.querySelector('[data-material-profile="GlitterMaterial"]').dataset.materialBaseColor).toBe('#A40A30');
    expect(container.querySelector('[data-material-profile="GlitterMaterial"]').dataset.glitterFleckColor).toBe('#7B2CBF');
    expect(container.querySelector('[data-material-profile="GlitterMaterial"]').dataset.glitterParticleCount).toBe('3750');
  });

  it('hydrates legacy Glitter safely with a deterministic independent fleck fallback', () => {
    const legacy = normalizePolishForFinish({ finish: 'Glitter', colorHex: '#000000', glitterDensity: .25 }, 'Glitter');
    expect(legacy).toMatchObject({ colorHex: '#000000', fleckColor: '#E8D7A8', glitterDensity: .25 });
    expect(legacy.glitter).toEqual({ baseColor: '#000000', fleckColor: '#E8D7A8', density: .25 });
  });

  it('keeps hidden legacy finishes compatible when reopening a saved design', async () => {
    const legacy = normalizePolishForFinish({ colorHex: '#ABCDEF', metallicReflection: .55 }, 'Chrome-ready');
    expect(legacy).toMatchObject({ finish: 'Chrome-ready', colorHex: '#ABCDEF', metallicReflection: .55 });
    expect(heroEffectForPolish(legacy).id).toBe('Chrome');
  });

  it('updates the compact bottle material for every approved finish', async () => {
    const activeBottle = container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure');
    expect(activeBottle.dataset.bottleRenderer).toBe('anitaset-signature-v1');
    expect(activeBottle.getAttribute('viewBox')).toBe('0 0 100 132');
    expect(activeBottle.querySelector('[data-bottle-layer="cap"]')).toBeTruthy();
    expect(activeBottle.querySelector('[data-bottle-layer="polish-content"]')).toBeTruthy();
    expect(activeBottle.querySelector('[data-bottle-layer="front-reflection"]')).toBeTruthy();
    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Matte', 'Jelly', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure').dataset.polishFinish).toBe(finish);
    }
    expect(container.querySelector('[data-bottle-material-layer="suspended-glitter-particles"] circle')).toBeTruthy();
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    const rackBottles = [...container.querySelectorAll('.nail-design-studio__workspace-module--polish .polish-bottle-figure')];
    expect(rackBottles.length).toBeGreaterThan(0);
    expect(rackBottles.every((bottle) => bottle.dataset.bottleRenderer === 'anitaset-signature-v1' && bottle.getAttribute('viewBox') === '0 0 100 132')).toBe(true);
  });

  it('separates Project Palette swatches, Recently Used bottles, and the lower Polish Rack', async () => {
    expect(container.querySelector('[data-testid="project-palette"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="project-palette"] .polish-bottle-figure')).toBeNull();
    expect(container.querySelector('[data-testid="recently-used"]')).toBeTruthy();
    expect(container.querySelector('.nail-design-studio__polish-rack')).toBeNull();
    expect(container.querySelector('.nail-design-studio__workspace-module--polish[aria-label="Polish Rack"]')).toBeTruthy();

    const finish = container.querySelector('select[aria-label="Finish"]');
    await act(async () => { finish.value = 'Jelly'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await editHex(container, '#AA3366');
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(0);
    expect(container.querySelector('[data-testid="recently-used"] .polish-bottle-figure').dataset.polishFinish).toBe('Jelly');
    await act(async () => { finish.value = 'Cream'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => { finish.value = 'Jelly'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(0);
    expect(container.querySelectorAll('[data-testid="recently-used"] .polish-bottle-figure')[0].dataset.polishFinish).toBe('Jelly');
    expect(container.querySelector('.nail-design-studio__workspace-module--polish[aria-label="Polish Rack"]')).toBeTruthy();
  });

  it('adds only applied formulations to Project Palette and rejects duplicates', async () => {
    const finish = container.querySelector('select[aria-label="Finish"]');
    await editHex(container, '#AA3366');
    await act(async () => { finish.value = 'Jelly'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await editHex(container, '#4455AA');
    await act(async () => { finish.value = 'Matte'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(0);

    const apply = [...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish');
    await click(apply);
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="project-palette-swatch"]').dataset.polishFinish).toBe('Matte');
    expect(container.querySelector('[data-testid="project-palette-swatch"]').getAttribute('aria-label')).toBe('Select #4455AA Matte');
    expect(container.querySelector('[data-testid="project-palette-swatch"]').title).toBe('#4455AA · Matte');
    await click(apply);
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(1);

    await editHex(container, '#118855');
    await act(async () => { finish.value = 'Cream'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await editHex(container, '#EE8844');
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(1);
    await click(apply);
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(2);
  });

  it('keeps same-color applied material formulations distinct and restores them from Project Palette', async () => {
    const finish = container.querySelector('select[aria-label="Finish"]');
    const apply = [...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish');
    await editHex(container, '#CC6699');
    await type(container.querySelector('input[aria-label="Opacity"]'), '0.61');
    await click(apply);
    await act(async () => { finish.value = 'Jelly'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await click(apply);

    const swatches = [...container.querySelectorAll('[data-testid="project-palette-swatch"]')];
    expect(swatches).toHaveLength(2);
    expect(swatches.map((swatch) => swatch.dataset.polishFinish)).toEqual(['Cream', 'Jelly']);

    await act(async () => { finish.value = 'Glitter'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    await editHex(container, '#123456');
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(2);
    await click(swatches[0]);
    expect(finish.value).toBe('Cream');
    expect(container.querySelector('input[aria-label="Base Color HEX"]').value).toBe('#CC6699');
    expect(container.querySelector('input[aria-label="Opacity"]').value).toBe('0.61');
    expect(container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure').dataset.polishFinish).toBe('Cream');
  });

  it('relocates opacity to the material properties while keeping the shared Hero polish state', async () => {
    const properties = container.querySelector('[data-testid="polish-material-properties"]');
    expect(properties.getAttribute('aria-label')).toBe('Polish material properties');
    expect([...properties.querySelectorAll(':scope > label')].slice(0, 3).map((label) => label.firstChild.textContent)).toEqual(['Opacity ', 'Shine ', 'Viscosity ']);
    const opacity = properties.querySelector('input[aria-label="Opacity"]');
    await type(opacity, '0.43');
    expect(properties.querySelector('label output').textContent).toBe('43%');
    expect(container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure').dataset.polishOpacity).toBe('0.43');
    expect(container.querySelector('[data-design-layer="polish"]').getAttribute('opacity')).toBe('0.43');
  });

  it('renders all finishes through reusable, ordered material layers', async () => {
    expect(Object.keys(MATERIAL_PROFILES)).toEqual(['Cream', 'Matte', 'Jelly', 'Glitter']);
    expect(materialProfile('Matte').reflection).toBeLessThan(materialProfile('Cream').reflection);
    expect(materialProfile('Jelly').transmission).toBeGreaterThan(0);
    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Matte', 'Jelly', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      const renderer = container.querySelector('[data-testid="stage-nail"] [data-material-renderer]');
      expect(renderer.dataset.materialProfile).toBe(finish === 'Jelly' ? 'HybridJelly' : `${finish}Material`);
      const layers = [...renderer.querySelectorAll('[data-material-layer]')].map((node) => node.dataset.materialLayer);
      expect(layers.slice(0, 3)).toEqual(finish === 'Jelly'
        ? ['shape-mask', 'base-pigment', 'curvature-shadow']
        : ['base-pigment', 'curvature-shadow', 'edge-darkening']);
      expect(layers).toContain('reflection');
      expect(layers).toContain('top-coat');
      const stage = container.querySelector('[data-testid="stage-nail"]');
      expect(stage.dataset.lightingColorModel).toBe(finish === 'Cream' ? 'neutral-achromatic' : 'hero-environment');
      expect([...stage.querySelectorAll('[id^="hero-light-apex"] stop, [id^="hero-light-primary"] stop, [id^="hero-light-edge"] stop')].every((stop) => stop.getAttribute('stop-color') === '#ffffff' || stop.getAttribute('stop-color') === '#FFFFFF')).toBe(true);
    }
    expect(container.querySelector('[data-material-layer="glitter-particle-field"] ellipse')).toBeTruthy();
  });

  it('uses the filled star to unsave the active formulation from both racks', async () => {
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    expect(container.querySelectorAll('button[aria-label="#D94C70 #D94C70 Cream polish bottle preview"]')).toHaveLength(1);
    await click(container.querySelector('button[aria-label="Remove polish from Polish Rack"]'));
    expect(container.querySelector('button[aria-label="Save polish to Polish Rack"]')).toBeTruthy();
    expect(container.textContent).toContain('removed from Polish Rack');
    expect(container.querySelector('button[aria-label="Favorite Blush Royalty"]')).toBeNull();
  });
  it('applies one formulation to each explicit scope as a logical undoable action', async () => {
    await click(container.querySelector('input[name="composition"][value="full"]'));
    for (const scope of ['current', 'left', 'right', 'full']) {
      await click(container.querySelector(`.nail-design-studio__apply-scope input[name="polish-scope"]:nth-of-type(1)`) || container.querySelector(`input[name="polish-scope"]`));
      const radio = [...container.querySelectorAll('input[name="polish-scope"]')].find((item) => item.parentElement.textContent === ({ current: 'Current Nail', left: 'Left Hand', right: 'Right Hand', full: 'Full Set' }[scope]));
      await click(radio); await click([...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish'));
    }
    expect(container.querySelectorAll('.nail-design-studio__nail-polish[data-polish-finish="Cream"]')).toHaveLength(10);
    await click(container.querySelector('button[aria-label="Undo"]'));
    await click(container.querySelector('button[aria-label="Redo"]'));
    expect(container.querySelectorAll('.nail-design-studio__nail-polish[data-polish-finish="Cream"]')).toHaveLength(10);
    await click(container.querySelectorAll('[data-testid="nail-slot"]')[1]);
    await click([...container.querySelectorAll('input[name="polish-scope"]')].find((item) => item.parentElement.textContent === 'Selected Nails'));
    await click([...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain('Select at least one nail');
    await act(async () => container.querySelectorAll('[data-testid="nail-slot"]')[1].dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: true })));
    await click([...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain('to 1 nail');
    await click(container.querySelector('button[aria-label="Save Changes"]'));
    const reopened = JSON.parse(window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero')).metadata;
    expect(reopened.polishFormulations).toHaveLength(10);
    expect(reopened.activePolishFormulation).toMatchObject({ name: 'Blush Royalty', finish: 'Cream' });
  });

  it('live-previews the editing color on the real stage nail before Apply and commits it only on Apply', async () => {
    await editHex(container, '#E8A0BF');
    await click(container.querySelector('.nail-design-studio__apply-polish'));
    let stageNail = container.querySelector('svg[data-testid="stage-nail"]');
    expect(stageNail.dataset.appliedPolishColor).toBe('#E8A0BF');

    await editHex(container, '#030303');
    stageNail = container.querySelector('svg[data-testid="stage-nail"]');
    expect(container.querySelector('.nail-design-studio__active-details input[aria-label="Base Color HEX"]').value).toBe('#030303');
    expect(stageNail.dataset.activePolishColor).toBe('#030303');
    expect(stageNail.dataset.renderColor).toBe('#030303');
    expect(stageNail.dataset.appliedPolishColor).toBe('#E8A0BF');
    expect(stageNail.querySelector('[data-material-renderer] stop').getAttribute('stop-color')).toBe('#030303');
    expect(stageNail.querySelector('[data-material-renderer]').dataset.materialBaseColor).toBe('#030303');
    expect(stageNail.dataset.effectOverlayCount).toBe('0');
    expect(stageNail.dataset.lightingColorModel).toBe('neutral-achromatic');
    expect([...stageNail.querySelectorAll('[id^="hero-light-"] stop')].every((stop) => ['#FFFFFF', '#000000'].includes(stop.getAttribute('stop-color')))).toBe(true);

    await click(container.querySelector('.nail-design-studio__apply-polish'));
    stageNail = container.querySelector('svg[data-testid="stage-nail"]');
    expect(stageNail.dataset.renderColor).toBe('#030303');
    expect(stageNail.dataset.appliedPolishColor).toBe('#030303');
  });

  it('routes continuous Shine changes into the real stage Cream clear coat', async () => {
    const shine = container.querySelector('input[aria-label="Shine"]');
    const samples = [];
    for (const value of ['0', '.25', '.5', '.75', '1']) {
      await type(shine, value);
      const material = container.querySelector('svg[data-testid="stage-nail"] [data-material-profile="CreamMaterial"]');
      samples.push(Number(material.dataset.clearCoatReflection));
      expect(material.dataset.materialShine).toBe(Number(value).toFixed(2));
      expect(Number(material.dataset.clearCoatTopCoat)).toBeGreaterThan(0);
    }
    expect(samples).toEqual([...samples].sort((a, b) => a - b));
    expect(new Set(samples)).toHaveProperty('size', 5);
  });

  it('keeps repeated colors and finish changes live while isolating stored colors across a full set', async () => {
    for (const color of ['#000000', '#FFFFFF', '#991435', '#07152F', '#E8A0BF']) {
      await editHex(container, color);
      expect(container.querySelector('svg[data-testid="stage-nail"]').dataset.renderColor).toBe(color);
    }
    const finish = container.querySelector('select[aria-label="Finish"]');
    await act(async () => { finish.value = 'Jelly'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('svg[data-testid="stage-nail"]').dataset.renderColor).toBe('#E8A0BF');
    await click(container.querySelector('.nail-design-studio__apply-polish'));

    await click(container.querySelector('input[name="composition"][value="full"]'));
    await click(container.querySelectorAll('[data-testid="nail-slot"]')[1]);
    await editHex(container, '#07152F');
    await click(container.querySelector('.nail-design-studio__apply-polish'));
    await editHex(container, '#991435');
    const nails = container.querySelectorAll('svg[data-testid="stage-nail"]');
    expect(nails[0].dataset.renderColor).toBe('#E8A0BF');
    expect(nails[1].dataset.renderColor).toBe('#991435');
    expect(nails[1].dataset.appliedPolishColor).toBe('#07152F');

    await click(container.querySelectorAll('[data-testid="nail-slot"]')[0]);
    expect(container.querySelectorAll('svg[data-testid="stage-nail"]')[0].dataset.renderColor).toBe('#E8A0BF');
    await click(container.querySelectorAll('[data-testid="nail-slot"]')[1]);
    expect(container.querySelectorAll('svg[data-testid="stage-nail"]')[1].dataset.renderColor).toBe('#07152F');
  });
});

describe('MAT-F02C finish-gated stage lighting', () => {
  const LIGHT_COLOR = '#34A6C8';

  const renderLoadedFinish = async (finish) => {
    const formulation = normalizePolishForFinish({ colorHex: '#030303', finish }, finish);
    const heroDocument = createHeroDesignDocument({ id: 'nail-desk-hero', name: 'Lighting test', shapeId: 'Almond', maskId: 'almond-mask' });
    heroDocument.nail.effect = heroEffectForPolish(formulation);
    heroDocument.lighting = { ...heroDocument.lighting, color: LIGHT_COLOR };
    heroDocument.metadata.activePolishFormulation = formulation;
    window.localStorage.setItem('anitaset.hero-design.v1:nail-desk-hero', JSON.stringify(heroDocument));
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
    return container.querySelector('svg[data-testid="stage-nail"]');
  };

  afterEach(() => {
    act(() => root.unmount()); container.remove();
    window.localStorage.removeItem('anitaset.hero-design.v1:nail-desk-hero');
  });

  it('keeps Cream lighting achromatic when a loaded design configures colored light', async () => {
    const nail = await renderLoadedFinish('Cream');
    expect(nail.dataset.renderColor).toBe('#030303');
    expect(nail.dataset.lightingColorModel).toBe('neutral-achromatic');
    for (const id of ['apex', 'primary', 'edge']) {
      expect([...nail.querySelectorAll(`[id^="hero-light-${id}"] stop`)].every((stop) => stop.getAttribute('stop-color') === '#FFFFFF')).toBe(true);
    }
    expect([...nail.querySelectorAll('[id^="hero-light-depth"] stop')].every((stop) => stop.getAttribute('stop-color') === '#000000')).toBe(true);
  });

  it.each(['Matte', 'Glitter', 'Jelly'])('preserves configured Hero Lighting colors for %s', async (finish) => {
    const nail = await renderLoadedFinish(finish);
    expect(nail.dataset.lightingColorModel).toBe('hero-environment');
    for (const id of ['apex', 'primary', 'edge']) {
      expect([...nail.querySelectorAll(`[id^="hero-light-${id}"] stop`)].every((stop) => stop.getAttribute('stop-color') === LIGHT_COLOR)).toBe(true);
    }
    expect([...nail.querySelectorAll('[id^="hero-light-depth"] stop')].every((stop) => stop.getAttribute('stop-color') === '#000000')).toBe(true);
  });
});

describe('new Nail Design Studio command bar', () => {
  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.useRealTimers();
  });

  it('renders the stacked studio title without an AnitaSet logo', () => {
    const bar = container.querySelector('[data-testid="nail-design-studio-command-bar"]');
    const titleLines = [...bar.querySelectorAll('h1 > span')].map((node) => node.textContent);
    expect(titleLines).toEqual(['Nail', 'Design Studio™']);
    expect(bar.querySelector('img[alt="AnitaSet"]')).toBeNull();
    expect(container.querySelector('.nail-design-studio__tool-ribbon').compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('keeps every command in its approved group with accessible controls', () => {
    const expected = {
      Design: ['New Design', 'Open Saved Design', 'Saved', 'Save As'],
      Edit: ['Undo', 'Redo'],
      Publish: ['Preview', 'Export'],
      Info: ['Nail Blueprint', 'Proposal'],
    };
    Object.entries(expected).forEach(([groupName, commands]) => {
      const group = container.querySelector(`section[aria-label="${groupName}"]`);
      expect(group.querySelector('h2').textContent).toBe(groupName);
      expect([...group.querySelectorAll('.nail-design-studio__command-button')].map((button) => button.getAttribute('aria-label'))).toEqual(commands);
      group.querySelectorAll('button').forEach((button) => {
        expect(button.type).toBe('button');
        expect(button.title).toBeTruthy();
      });
    });
  });

  it('opens and closes Saved Designs and exposes the separate inline nameplate', async () => {
    await click(container.querySelector('button[aria-label="Open Saved Design"]'));
    expect(container.querySelector('[role="dialog"][aria-label="Saved Designs"]')).toBeTruthy();
    expect(container.querySelector('button[aria-label="Open current design menu"]').getAttribute('aria-expanded')).toBe('true');
    await click(container.querySelector('button[aria-label="Close Saved Designs"]'));
    expect(container.querySelector('[role="dialog"][aria-label="Saved Designs"]')).toBeNull();
    expect(container.querySelector('.nail-design-studio__design-control')).toBeTruthy();
  });

  it('renames inline with Enter and Escape while retaining save and history behavior', async () => {
    await click(container.querySelector('.nail-design-studio__design-name'));
    let input = container.querySelector('input[aria-label="Rename design"]');
    await type(input, 'Summer Chrome Collection');
    await keyDown(input, 'Enter');
    expect(container.querySelector('.nail-design-studio__design-name').textContent).toBe('Summer Chrome Collection');
    expect(container.querySelector('button[aria-label="Save Changes"]')).toBeTruthy();
    expect(container.querySelector('button[aria-label="Undo"]').disabled).toBe(false);

    await click(container.querySelector('.nail-design-studio__design-name'));
    input = container.querySelector('input[aria-label="Rename design"]');
    await type(input, 'Cancelled name');
    await keyDown(input, 'Escape');
    expect(container.querySelector('.nail-design-studio__design-name').textContent).toBe('Summer Chrome Collection');
  });

  it('represents saving and saved states and correctly disables unavailable history', async () => {
    jest.useFakeTimers();
    expect(container.querySelector('button[aria-label="Undo"]').disabled).toBe(true);
    expect(container.querySelector('button[aria-label="Redo"]').disabled).toBe(true);
    await click(container.querySelector('button[aria-label="Save As"]'));
    await click(container.querySelector('button[aria-label="Save Changes"]'));
    expect(container.querySelector('button[aria-label="Saving…"]').disabled).toBe(true);
    await act(async () => jest.advanceTimersByTime(150));
    expect(container.querySelector('button[aria-label="Saved"]').disabled).toBe(true);
  });

  it('keeps collection and details workflows wired and dismissible', async () => {
    await click(container.querySelector('button[aria-label="Nail Blueprint"]'));
    expect(container.querySelector('[role="dialog"][aria-label="Design Details"]')).toBeTruthy();
    await click(container.querySelector('button[aria-label="Close Design Details"]'));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe('Founder-approved Nail Tool Kit', () => {
  const labels = ['Polish', 'French Tip', 'Brush', 'Sticker Studio™', 'Charm Studio™', 'Gems', 'Effects', '3D Objects', 'Top Coat'];
  const accents = ['#FF2DA0', '#F5C04A', '#FF7A45', '#B96CFF', '#34E5F2', '#68B7FF', '#C8FF4A', '#22F0C7', '#FF6FCF'];

  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const tabs = () => [...container.querySelectorAll('[role="tab"]')];

  it('renders all categories in order with distinct approved accents and compact semantics', () => {
    expect(tabs().map((tab) => tab.textContent)).toEqual(labels);
    expect(tabs().map((tab) => tab.dataset.accent)).toEqual(accents);
    expect(new Set(tabs().map((tab) => tab.dataset.accent)).size).toBe(9);
    expect(container.querySelector('.nail-design-studio__tool-list').getAttribute('role')).toBe('tablist');
    tabs().forEach((tab) => {
      expect(tab.getAttribute('aria-controls')).toBe('creative-tools-panel');
      expect(tab.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('defaults to Polish and updates the Creative Tools tab panel without replacing studio state', async () => {
    expect(tabs()[0].getAttribute('aria-selected')).toBe('true');
    expect(container.querySelector('[role="tabpanel"] h2').textContent).toBe('Polish');
    await click(tabs()[4]);
    expect(tabs()[4].getAttribute('aria-selected')).toBe('true');
    expect(tabs()[0].getAttribute('aria-selected')).toBe('false');
    expect(container.querySelector('[role="tabpanel"] h2').textContent).toBe('Charm Studio™');
    expect(container.querySelector('[aria-label="Nail Desk"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Design properties panel"]')).toBeTruthy();
  });

  it('supports roving focus with arrows, Home, and End, then activation with Enter and Space', async () => {
    tabs()[0].focus();
    await keyDown(tabs()[0], 'ArrowRight');
    expect(document.activeElement.textContent).toBe('French Tip');
    expect(tabs()[1].getAttribute('aria-selected')).toBe('false');
    await keyDown(tabs()[1], 'Enter');
    expect(tabs()[1].getAttribute('aria-selected')).toBe('true');
    await keyDown(tabs()[1], 'End');
    expect(document.activeElement.textContent).toBe('Top Coat');
    await keyDown(tabs()[8], ' ');
    expect(tabs()[8].getAttribute('aria-selected')).toBe('true');
    await keyDown(tabs()[8], 'Home');
    expect(document.activeElement.textContent).toBe('Polish');
    await keyDown(tabs()[0], 'ArrowLeft');
    expect(document.activeElement.textContent).toBe('Top Coat');
  });

  it('keeps the Tool Kit immediately beneath the locked Command Bar', () => {
    const studio = container.querySelector('[data-testid="new-nail-design-studio"]');
    const bar = container.querySelector('[data-testid="nail-design-studio-command-bar"]');
    const ribbon = container.querySelector('.nail-design-studio__tool-ribbon');
    expect([...studio.children].indexOf(ribbon)).toBe([...studio.children].indexOf(bar) + 1);
  });
});

describe('DS-TK01A French Tip integration', () => {
  beforeEach(async () => {
    window.localStorage.removeItem('anitaset.hero-design.v1:nail-desk-hero');
    container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); window.localStorage.removeItem('anitaset.hero-design.v1:nail-desk-hero'); });

  it('replaces Technique navigation with working French Tip controls', async () => {
    expect([...container.querySelectorAll('[role="tab"]')].some((tab) => tab.textContent === 'Technique')).toBe(false);
    const tab = [...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'French Tip');
    await click(tab);
    expect(container.querySelector('[data-testid="french-tip-controls"]')).toBeTruthy();
    expect(container.querySelector('[role="tabpanel"] h2').textContent).toBe('French Tip');
  });

  it('enables, edits, targets, renders, and disables the legacy French Tip region', async () => {
    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'French Tip'));
    const enabled = container.querySelector('input[aria-label="Enable French Tip"]');
    await click(enabled);
    let region = container.querySelector('[data-design-layer="french-tip"]');
    expect(region).toBeTruthy();
    expect(region.dataset.frenchTipStyle).toBe('classic');

    const color = container.querySelector('input[aria-label="French Tip color"]');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(color, '#123456'); color.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-design-layer="french-tip"] [data-material-renderer]').dataset.materialInputColor).toBe('#123456');

    await click(container.querySelector('input[name="french-scope"][value="full"]') || [...container.querySelectorAll('input[name="french-scope"]')].at(-1));
    await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Apply French Tip'));
    await click([...container.querySelectorAll('input[name="composition"]')].find((input) => input.value === 'full'));
    expect(container.querySelectorAll('[data-design-layer="french-tip"]')).toHaveLength(10);

    await click(enabled);
    expect(container.querySelectorAll('[data-design-layer="french-tip"]')).toHaveLength(9);
  });

  it('paints transparent gold Marble beneath an uninterrupted blue Glitter French Tip', async () => {
    await editHex(container, '#000000');
    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'French Tip'));
    await click(container.querySelector('input[aria-label="Enable French Tip"]'));
    const frenchControls = container.querySelector('[data-testid="french-tip-controls"]');
    await click([...frenchControls.querySelectorAll('button')].find((button) => button.textContent === 'Glitter'));
    const tipColor = frenchControls.querySelector('input[aria-label="French Tip color"]');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(tipColor, '#164E9B'); tipColor.dispatchEvent(new Event('change', { bubbles: true })); });
    const creamDepthStop = container.querySelector('[id^="hero-light-depth"] stop:last-child').getAttribute('stop-opacity');
    const creamDepthOpacity = container.querySelector('[data-hero-lighting-layer="full-surface-depth"]').getAttribute('opacity');

    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'Effects'));
    const effect = container.querySelector('select[aria-label="Effect"]');
    await act(async () => { effect.value = 'Marble'; effect.dispatchEvent(new Event('change', { bubbles: true })); });
    const veinColor = container.querySelector('input[aria-label="Selected Vein Color"]');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(veinColor, '#D4AF37'); veinColor.dispatchEvent(new Event('change', { bubbles: true })); });

    const nail = container.querySelector('svg[data-testid="stage-nail"]');
    const material = nail.querySelector('[data-design-layer="polish"]');
    const marble = nail.querySelector('[data-effect-layer="marble"]');
    const french = nail.querySelector('[data-design-layer="french-tip"]');
    const depth = nail.querySelector('[data-hero-lighting-layer="full-surface-depth"]');
    expect(nail.dataset.renderColor).toBe('#000000');
    expect(nail.dataset.lightingColorModel).toBe('neutral-achromatic');
    expect(material.closest('[data-material-renderer]').dataset.materialProfile).toBe('CreamMaterial');
    expect(material.dataset.polishFinish).toBe('Cream');
    expect(material.dataset.heroEffect).toBe('Marble');
    expect(material.getAttribute('fill')).toMatch(/^url\(#hero-material-0-pigment\)$/);
    expect(marble.dataset.marbleAlpha).toBe('localized-stream-geometry-only');
    expect(marble.querySelector('[data-stream-id="primary-0"] [data-vein-component="variable-width-ribbon"]')).toBeTruthy();
    expect(marble.querySelector('[data-stream-id="primary-0"] [data-material-profile="CreamMaterial"]').dataset.materialInputColor).toBe('#D4AF37');
    expect(french.dataset.frenchTipType).toBe('Glitter');
    expect(french.querySelector('[data-material-renderer]').dataset.materialInputColor).toBe('#164E9B');
    expect(marble.compareDocumentPosition(french) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(french.compareDocumentPosition(marble) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(depth.dataset.surfaceFinish).toBe('Solid');
    expect(depth.getAttribute('opacity')).toBe(creamDepthOpacity);
    expect(nail.querySelector('[id^="hero-light-depth"] stop:last-child').getAttribute('stop-opacity')).toBe(creamDepthStop);
    expect(french.compareDocumentPosition(depth) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('keeps every transformed, softened, and metallic Marble component inside the stationary Hero clip', async () => {
    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'Effects'));
    const effect = container.querySelector('select[aria-label="Effect"]');
    await act(async () => { effect.value = 'Marble'; effect.dispatchEvent(new Event('change', { bubbles: true })); });
    const veinColor = container.querySelector('input[aria-label="Selected Vein Color"]');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(veinColor, '#D4AF37'); veinColor.dispatchEvent(new Event('change', { bubbles: true })); });

    const cases = [
      ['Marble Horizontal Position', '120'], ['Marble Horizontal Position', '-120'],
      ['Marble Vertical Position', '180'], ['Marble Vertical Position', '-180'],
      ['Marble Scale', '2.5'], ['Marble Rotation', '47'],
    ];
    for (const [label, value] of cases) {
      await type(container.querySelector(`input[aria-label="${label}"]`), value);
      const marble = container.querySelector('[data-effect-layer="marble"]');
      const transformed = marble.firstElementChild;
      expect(marble.dataset.marbleClipAuthority).toBe('hero-nail-mask');
      expect(marble.getAttribute('clip-path')).toBe('url(#hero-effect-mask-0)');
      expect(marble.hasAttribute('transform')).toBe(false);
      expect(transformed.hasAttribute('transform')).toBe(true);
      expect([...marble.querySelectorAll('path')].every((path) => transformed.contains(path))).toBe(true);
    }

    const softness = container.querySelector('input[aria-label="Selected Vein Softness"]');
    await type(softness, softness.max || '4');
    const marble = container.querySelector('[data-effect-layer="marble"]');
    const localizedBlur = marble.querySelector('[data-vein-component="localized-diffusion"]');
    expect(localizedBlur.getAttribute('style')).toContain('blur');
    expect(marble.contains(localizedBlur)).toBe(true);
    expect(marble.querySelector('[data-vein-component="metallic-highlight"]')).toBeTruthy();
    expect(marble.querySelector('[data-vein-component="mineral-fragments"]')).toBeTruthy();
    expect(marble.querySelectorAll('[data-vein-component="variable-width-ribbon"]').length).toBeGreaterThan(0);
  });

  it('synchronizes direct Marble selection and local formulation/taper controls without painting hit targets', async () => {
    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'Effects'));
    const effect = container.querySelector('select[aria-label="Effect"]');
    await act(async () => { effect.value = 'Marble'; effect.dispatchEvent(new Event('change', { bubbles: true })); });
    const hit = container.querySelector('[data-marble-hit-target="primary-1"]');
    expect(hit.getAttribute('stroke')).toBe('transparent'); expect(hit.getAttribute('fill')).toBe('none');
    await act(async () => hit.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })));
    expect(container.querySelector('[role="option"][aria-selected="true"]').textContent).toContain('Primary 2');
    expect(container.querySelector('[data-marble-selection="primary-1"]')).toBeTruthy();
    const finish = container.querySelector('select[aria-label="Selected Vein Finish"]');
    await act(async () => { finish.value = 'Glitter'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-stream-id="primary-1"] [data-material-profile="GlitterMaterial"]')).toBeTruthy();
    await type(container.querySelector('input[aria-label="Start Width"]'), '2.5'); await type(container.querySelector('input[aria-label="End Width"]'), '.25');
    const ribbon = container.querySelector('[data-stream-id="primary-1"] [data-vein-component="variable-width-ribbon"]');
    expect(ribbon.dataset.widthProfile).toBe('2.5,1,0.25');
    expect(ribbon.getAttribute('d')).toMatch(/Z$/);
    await click([...container.querySelectorAll('button')].find((button) => button.textContent === 'Edit Vein'));
    expect(container.querySelectorAll('[data-stream-id="primary-1"] [data-marble-control-point]').length).toBeGreaterThanOrEqual(4);
  });

  it('loads both mounted metadata and legacy French Tip layer persistence', () => {
    expect(loadFrenchTips({ metadata: { frenchTips: [{ style: 'v', colorHex: '#ABCDEF', tipType: 'Matte' }] } })[0]).toMatchObject({ style: 'v', colorHex: '#ABCDEF', tipType: 'Matte' });
    expect(loadFrenchTips({ nails: [{ layers: [{ type: 'frenchTip', visible: true, data: { preset: 'deep', colorHex: '#FEDCBA' } }] }] })[0]).toMatchObject({ preset: 'deep', colorHex: '#FEDCBA', tipType: 'Cream' });
  });

  it('offers material and geometry separately without changing the base nail material', async () => {
    await click([...container.querySelectorAll('[role="tab"]')].find((item) => item.textContent === 'French Tip'));
    await click(container.querySelector('input[aria-label="Enable French Tip"]'));
    const controls = container.querySelector('[data-testid="french-tip-controls"]');
    expect(controls.textContent).not.toContain('Preset');
    expect(['Cream', 'Jelly', 'Matte', 'Glitter'].every((type) => controls.querySelector(`button[aria-pressed][type="button"]`) && controls.textContent.includes(type))).toBe(true);
    expect(['Classic', 'Deep', 'Angled', 'V-French', 'Reverse'].every((style) => controls.textContent.includes(style))).toBe(true);
    const base = container.querySelector('[data-design-layer="polish"]');
    const baseFinish = base.dataset.polishFinish;
    for (const type of ['Cream', 'Jelly', 'Matte', 'Glitter']) {
      await click([...controls.querySelectorAll('button')].find((button) => button.textContent === type));
      expect(container.querySelector('[data-design-layer="french-tip"]').dataset.frenchTipType).toBe(type);
      expect(container.querySelector('[data-design-layer="polish"]')).toBe(base);
      expect(base.dataset.polishFinish).toBe(baseFinish);
    }
    await click([...controls.querySelectorAll('button')].find((button) => button.textContent === 'V-French'));
    expect(container.querySelector('[data-design-layer="french-tip"]').dataset.frenchTipStyle).toBe('v');
  });
});

describe('adaptive Nail Desk', () => {
  beforeEach(async () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<NailDesignStudio />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const button = (label) => [...container.querySelectorAll('button')].find((item) => item.textContent === label);

  it('places Nail Shape immediately before the existing Nail Desk view controls', async () => {
    const controls = container.querySelector('[aria-label="Nail Desk view controls"]');
    expect([...controls.children].map((control) => control.textContent)).toEqual(['Nail Shape', 'Nail Size', 'Fit to View', '−', '100%', '+', 'Focus Mode']);
    expect(container.querySelector('[data-testid="nail-design-studio-command-bar"] button[aria-haspopup="listbox"]')).toBeNull();

    await click(button('Nail Shape'));
    await click(button('Square'));
    expect(container.querySelector('[data-testid="stage-nail"]').dataset.nailShape).toBe('square');
  });

  it('bridges Polish Studio controls directly to the Hero engines', async () => {
    const studio = container.querySelector('[aria-label="Polish Studio"]');
    expect(studio.dataset.heroMaterialEngine).toBe('Hero Material Engine');
    expect(studio.dataset.heroEffectEngine).toBe('Hero Effect Engine');
    expect(container.querySelector('[aria-label="Polish panel"]')).toBeNull();
    expect(['Active Polish', 'Project Palette', 'Recently Used'].every((label) => studio.textContent.includes(label))).toBe(true);
    const finish = container.querySelector('select[aria-label="Finish"]');
    await act(async () => { finish.value = 'Glitter'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('Solid');

    const color = container.querySelector('input[aria-label="Base Color picker"]');
    await act(async () => { color.value = '#123456'; color.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('Solid');
    expect(container.querySelector('button[aria-label="Save Changes"]')).toBeTruthy();

    const viscosity = container.querySelector('input[aria-label="Viscosity"]');
    expect(viscosity.disabled).toBe(false);
    await type(viscosity, '0.35');
    expect(container.querySelector('input[aria-label="Viscosity"]').value).toBe('0.35');
  });

  it('uses one Hero effect document from both Polish and Effects Studio', async () => {
    const polish = container.querySelector('[aria-label="Polish Studio"]');
    const documentId = polish.dataset.heroDocumentId;
    await click(button('Effects'));
    const effects = container.querySelector('[aria-label="Effects Studio"]');
    const finish = effects.querySelector('select[aria-label="Effect"]');
    await act(async () => { finish.value = 'Gradient'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(effects.dataset.heroDocumentId).toBe(documentId);
    expect(effects.querySelector('select[aria-label="Effect"]').value).toBe('Gradient');
    expect(effects.querySelector('input[aria-label="Direction"]')).toBeTruthy();
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('Gradient');
  });

  it('gives Effects exclusive ownership of existing treatments without changing polish history', async () => {
    const applyPolish = [...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish');
    await click(applyPolish);
    const paletteCount = container.querySelectorAll('[data-testid="project-palette-swatch"]').length;
    const recentCount = container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length;

    await click(button('Effects'));
    const effects = container.querySelector('[aria-label="Effects Studio"]');
    const selector = effects.querySelector('select[aria-label="Effect"]');
    expect([...selector.options].map((option) => option.textContent)).toEqual(['Choose an effect', 'Ombré', 'Marble', 'Chrome', 'Cat Eye', 'Aura', 'Color Block', 'Negative Space']);
    expect(effects.querySelector('[aria-label="Project Palette"]')).toBeNull();
    expect(effects.querySelector('[aria-label="Recently Used"]')).toBeNull();
    expect([...effects.querySelectorAll('button')].some((item) => item.textContent === 'Apply Polish')).toBe(false);

    for (const [index, [value, expectedControl]] of [['Gradient', 'Direction'], ['Marble', 'Vein density'], ['Chrome', 'Metallic Reflection'], ['Cat Eye', 'Stripe strength']].entries()) {
      await act(async () => { selector.value = value; selector.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe(value);
      expect(effects.querySelector(`[aria-label="${expectedControl}"]`)).toBeTruthy();
      if (value === 'Marble') {
        const marble = container.querySelector('[data-effect-layer="marble"]');
        expect(marble.dataset.marbleAlpha).toBe('localized-stream-geometry-only');
        expect(marble.getAttribute('clip-path')).toMatch(/hero-effect-mask/);
        expect(marble.querySelector('[data-vein-component="variable-width-ribbon"]')).toBeTruthy();
        expect(marble.querySelector('[data-vein-component="localized-formulation"]')).toBeTruthy();
        expect(marble.querySelector('[data-vein-component="fracture"]')).toBeTruthy();
        expect(marble.querySelector('[data-vein-component="mineral-fragments"]')).toBeTruthy();
      }
      const effectColor = effects.querySelector('input[aria-label="Base Color picker"]');
      const color = `#${String(index + 1).repeat(6)}`;
      await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(effectColor, color); effectColor.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector('svg[data-testid="stage-nail"]').dataset.activePolishColor).toBe(color);
    }

    await act(async () => { selector.value = 'ColorBlock'; selector.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('ColorBlock');
    expect(effects.querySelector('input[aria-label="Color A"]')).toBeTruthy();
    expect(effects.querySelector('input[aria-label="Color B"]')).toBeTruthy();
    for (const direction of ['vertical', 'horizontal', 'diagonal']) {
      await act(async () => { const control = effects.querySelector('select[aria-label="Block Direction"]'); control.value = direction; control.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector('[data-effect-layer="color-block"]').dataset.blockDirection).toBe(direction);
    }
    await type(effects.querySelector('input[aria-label="Split Position"]'), '0.25');
    expect(container.querySelector('[data-effect-layer="color-block"]').dataset.splitPosition).toBe('0.25');
    expect(container.querySelector('[data-effect-layer="color-block"]').getAttribute('clip-path')).toMatch(/hero-effect-mask/);
    await act(async () => { const color = effects.querySelector('input[aria-label="Color A"]'); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(color, '#123456'); color.dispatchEvent(new Event('change', { bubbles: true })); });
    await act(async () => { const color = effects.querySelector('input[aria-label="Color B"]'); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(color, '#ABCDEF'); color.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-color-block-region="a"]').getAttribute('fill')).toBe('#123456');
    expect(container.querySelector('[data-color-block-region="b"]').getAttribute('fill')).toBe('#ABCDEF');
    expect(container.querySelector('[data-effect-layer="color-block"] ~ path[style*="screen"]')).toBeTruthy();

    await click(button('Polish'));
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]').length).toBe(paletteCount);
    expect(container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length).toBe(recentCount);

    const polishFinish = container.querySelector('select[aria-label="Finish"]');
    await act(async () => { polishFinish.value = 'Cream'; polishFinish.dispatchEvent(new Event('change', { bubbles: true })); });
    const beforePolishColorCount = container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length;
    const polishColor = container.querySelector('input[aria-label="Base Color picker"]');
    await act(async () => { Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(polishColor, '#A1B2C3'); polishColor.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length).toBe(beforePolishColorCount + 1);
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]').length).toBe(paletteCount);
    await click([...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish'));
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]').length).toBe(paletteCount + 1);
  });

  it('reveals the Hero base surface through a clipped Negative Space mask without entering Polish history', async () => {
    await click([...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish'));
    const paletteCount = container.querySelectorAll('[data-testid="project-palette-swatch"]').length;
    const recentCount = container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length;
    await click(button('Effects'));
    const selector = container.querySelector('select[aria-label="Effect"]');
    await act(async () => { selector.value = 'NegativeSpace'; selector.dispatchEvent(new Event('change', { bubbles: true })); });

    const nail = container.querySelector('svg[data-testid="stage-nail"]');
    expect(nail.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('NegativeSpace');
    expect(nail.querySelector('[data-hero-base-surface="true"]')).toBeTruthy();
    expect(nail.querySelector('[data-design-coverage="polish-and-effect"]').getAttribute('mask')).toMatch(/hero-negative-space/);
    expect(nail.querySelector('mask path').getAttribute('fill')).toBe('white');
    expect(nail.querySelector('[data-negative-space-region]').getAttribute('fill')).toBe('black');
    expect(container.querySelector('input[aria-label="Base Color picker"]')).toBeNull();

    const typeControl = container.querySelector('select[aria-label="Negative Space Type"]');
    for (const [type, region] of [['vertical-band', 'vertical-band'], ['horizontal-band', 'horizontal-band'], ['diagonal-band', 'diagonal-band'], ['center-cutout', 'center-cutout']]) {
      await act(async () => { typeControl.value = type; typeControl.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector(`[data-negative-space-region="${region}"]`)).toBeTruthy();
    }
    await type(container.querySelector('input[aria-label="Negative Space Position"]'), '0.3');
    await type(container.querySelector('input[aria-label="Negative Space Size"]'), '0.4');
    expect(container.querySelector('[data-negative-space-region="center-cutout"]').getAttribute('cx')).not.toBeNull();

    await click(button('Polish'));
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(paletteCount);
    expect(container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]')).toHaveLength(recentCount);
  });

  it('ports legacy Aura into a clipped radial Hero effect without touching Polish history', async () => {
    const applyPolish = [...container.querySelectorAll('button')].find((item) => item.textContent === 'Apply Polish');
    await click(applyPolish);
    const paletteCount = container.querySelectorAll('[data-testid="project-palette-swatch"]').length;
    const recentCount = container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]').length;
    await click(button('Effects'));
    const selector = container.querySelector('select[aria-label="Effect"]');
    await act(async () => { selector.value = 'Aura'; selector.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(selector.value).toBe('Aura');
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('Aura');
    const aura = container.querySelector('[data-effect-layer="aura"]');
    expect(aura).toBeTruthy();
    expect(aura.getAttribute('clip-path')).toMatch(/hero-effect-mask/);
    expect(aura.getAttribute('fill')).toMatch(/hero-finish/);
    expect(container.querySelector('[data-gradient-mode="center-glow-aura-blend"]')).toBeTruthy();
    await type(container.querySelector('input[aria-label="Aura softness"]'), '0.42');
    await type(container.querySelector('input[aria-label="Aura intensity"]'), '0.51');
    await act(async () => { const color = container.querySelector('input[aria-label="Aura color"]'); Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(color, '#AA3366'); color.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector('[data-effect-layer="aura"]').getAttribute('opacity')).toBe('0.51');
    await click(button('Polish'));
    expect(container.querySelectorAll('[data-testid="project-palette-swatch"]')).toHaveLength(paletteCount);
    expect(container.querySelectorAll('[data-testid="recently-used"] [role="listitem"]')).toHaveLength(recentCount);
  });

  it('normalizes persisted legacy Aura gradient data into the mounted contract', () => {
    const aura = normalizePersistedAuraEffect({ type: 'gradient', opacity: .68, data: { direction: 'aura', colorA: '#FFEAF2', colorB: '#FF5EA8', softness: .86, gradientStops: [{ color: '#FFEAF2' }, { color: '#FF9BC7' }, { color: '#FF5EA8' }] } });
    expect(aura).toEqual({ id: 'Aura', version: '1', parameters: { baseColor: '#FF5EA8', centerColor: '#FFEAF2', auraColor: '#FF9BC7', softness: .86, intensity: .68, opacity: 1, viscosity: .62, shine: .68 } });
    expect(normalizePersistedAuraEffect(aura)).toEqual(aura);
  });

  it('keeps the legacy Gradient identifier behind the Ombré presentation label', () => {
    const legacyGradient = normalizePolishForFinish({ finish: 'Gradient', colorA: '#123456', colorB: '#ABCDEF', direction: 135 }, 'Gradient');
    expect(legacyGradient.finish).toBe('Gradient');
    expect(heroEffectForPolish(legacyGradient)).toMatchObject({ id: 'Gradient', parameters: { colorA: '#123456', colorB: '#ABCDEF', direction: 135 } });
  });

  it('uses the Hero document as the shared source for both Nail Size controls', async () => {
    await click(container.querySelector('[aria-label="Nail Desk view controls"] button:nth-of-type(2)'));
    const deskSize = container.querySelector('#desk-nail-size');
    await type(deskSize, '175');
    expect(container.querySelector('#nail-length').value).toBe('175');
    expect(container.querySelector('.nail-design-studio__nail-stage').style.getPropertyValue('--nail-length')).toBe('1.75');
  });

  it('renders every enabled selection through its distinct resolved Hero mask and hides Duck', async () => {
    const approved = ['Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto', 'Lipstick'];
    const paths = new Set();

    await click(button('Nail Shape'));
    expect(button('Duck')).toBeUndefined();
    await click(button('Nail Shape'));

    for (const shape of approved) {
      await click(button('Nail Shape'));
      await click(button(shape));
      const nail = container.querySelector('[data-testid="stage-nail"]');
      expect(nail.dataset.nailShape).toBe(shape.toLowerCase());
      expect(nail.dataset.heroMask).toBe(`${shape.toLowerCase()}-mask`);
      expect(nail.dataset.heroRenderer).toBe('Hero Surface Rendering Engine');
      expect(nail.getAttribute('viewBox').split(' ').map(Number)).toHaveLength(4);
      expect(nail.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
      paths.add(nail.querySelector('[data-design-layer="polish"]').getAttribute('d'));
    }

    expect(paths.size).toBe(approved.length);
  });

  it('renders one premium Hero Nail in Single Nail mode without a finger asset', () => {
    expect(container.querySelectorAll('[data-testid="stage-nail"]')).toHaveLength(1);
    expect(container.querySelector('[data-testid="stage-nail"]').getAttribute('aria-label')).toBe('Hero Nail 1');
    expect(container.querySelector('[data-design-layer-parent="true"]')).toBeTruthy();
    expect(container.querySelector('[data-design-layer="polish"]')).toBeTruthy();
    expect(container.querySelector('img')).toBeNull();
  });

  it('renders five Hero Nails in Left Hand mode', async () => {
    await click(container.querySelector('input[value="left"]'));
    expect(container.querySelectorAll('[data-testid="stage-nail"]')).toHaveLength(5);
  });

  it('renders five Hero Nails in Right Hand mode', async () => {
    await click(container.querySelector('input[value="right"]'));
    expect(container.querySelectorAll('[data-testid="stage-nail"]')).toHaveLength(5);
  });

  it('offers every composition and renders exactly ten Hero Nails in Full Set mode', async () => {
    const labels = [...container.querySelectorAll('fieldset label')].map((label) => label.textContent);
    expect(labels).toEqual(['Single Nail', 'Left Hand', 'Right Hand', 'Full Set', 'Spread View']);
    await click(container.querySelector('input[value="full"]'));
    expect(container.querySelector('[aria-label="Full Set nail stage"]')).toBeTruthy();
    expect(container.querySelectorAll('[data-testid="stage-nail"]')).toHaveLength(10);
    expect(container.querySelectorAll('[data-testid="nail-slot"]')).toHaveLength(10);
    expect([...container.querySelectorAll('.nail-design-studio__finger-label')].map((label) => label.textContent)).toEqual([
      'Thumb', 'Index', 'Middle', 'Ring', 'Pinky', 'Thumb', 'Index', 'Middle', 'Ring', 'Pinky',
    ]);
    expect(container.querySelector('.nail-design-studio__nail-stage--full')).toBeTruthy();
  });

  it('uses the shared upper-middle composition region in every Nail Desk view', async () => {
    for (const view of ['single', 'left', 'right', 'full', 'spread']) {
      await click(container.querySelector(`input[value="${view}"]`));
      const stage = container.querySelector('.nail-design-studio__nail-stage');
      expect(stage.classList.contains(`nail-design-studio__nail-stage--${view}`)).toBe(true);
      expect(stage.parentElement).toBe(container.querySelector('[data-testid="nail-stage-container"]'));
      expect(container.querySelectorAll('.nail-design-studio__finger-label')).toHaveLength(view === 'single' ? 1 : view === 'left' || view === 'right' ? 5 : 10);
    }
  });

  it('keeps the Hero Nail composition in safe centered stage bounds', () => {
    const stage = container.querySelector('.nail-design-studio__nail-stage--single');
    const slot = container.querySelector('[data-testid="nail-slot"]');
    const heroNail = container.querySelector('[data-testid="stage-nail"]');
    expect(stage).toBeTruthy();
    expect(slot).toBeTruthy();
    expect(heroNail).toBeTruthy();
    expect(stage.style.getPropertyValue('--stage-x')).toBe('0px');
    expect(stage.style.getPropertyValue('--stage-y')).toBe('0px');
    expect(slot.contains(heroNail)).toBe(true);
  });

  it('shares zoom, fit, and pointer pan while composition changes reset the camera', async () => {
    await click(container.querySelector('button[aria-label="Zoom in"]'));
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('125%');
    const surface = container.querySelector('[data-testid="nail-stage-container"]');
    await act(async () => {
      surface.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 20, clientY: 20 }));
      surface.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 50, clientY: 45 }));
    });
    expect(container.querySelector('.nail-design-studio__nail-stage').style.getPropertyValue('--stage-x')).toBe('30px');
    await click(container.querySelector('input[value="left"]'));
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
    expect(container.querySelector('.nail-design-studio__nail-stage').style.getPropertyValue('--stage-x')).toBe('0px');
    expect(container.querySelectorAll('[data-testid="stage-nail"]')).toHaveLength(5);
  });

  it('Fit to View resets zoom and translation for the complete composition', async () => {
    await click(container.querySelector('button[aria-label="Zoom in"]'));
    const surface = container.querySelector('[data-testid="nail-stage-container"]');
    await act(async () => {
      surface.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, button: 0, clientX: 10, clientY: 10 }));
      surface.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 42, clientY: 31 }));
    });
    await click(button('Fit to View'));
    const stage = container.querySelector('.nail-design-studio__nail-stage');
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
    expect(stage.style.getPropertyValue('--stage-x')).toBe('0px');
    expect(stage.style.getPropertyValue('--stage-y')).toBe('0px');
    expect(stage.style.getPropertyValue('--stage-zoom')).toBe('1');
  });

  it('keeps the explicit Zoom In, Zoom Out, and Fit to View controls working', async () => {
    await click(container.querySelector('button[aria-label="Zoom in"]'));
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('125%');
    await click(container.querySelector('button[aria-label="Zoom out"]'));
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
    await click(container.querySelector('button[aria-label="Zoom in"]'));
    await click(button('Fit to View'));
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
  });

  it('keeps wheel events owned by the creative-tools panel while it can scroll', async () => {
    const panel = container.querySelector('#creative-tools-panel');
    Object.defineProperties(panel, { clientHeight: { configurable: true, value: 200 }, scrollHeight: { configurable: true, value: 600 } });
    panel.scrollTop = 100;
    const workspace = container.querySelector('.nail-design-studio__workspace');
    const workspaceWheel = jest.fn();
    workspace.addEventListener('wheel', workspaceWheel);
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 180 });

    await act(async () => panel.querySelector('[aria-label="Polish Studio"]').dispatchEvent(wheel));

    expect(workspaceWheel).not.toHaveBeenCalled();
    expect(wheel.defaultPrevented).toBe(false);
    expect(panel.classList.contains('nail-design-studio__creative-tools')).toBe(true);
    expect(container.querySelector('[aria-label="Project Palette"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Recently Used"]')).toBeTruthy();
  });

  it('releases creative-tools wheel input to the page at either scroll boundary', async () => {
    const panel = container.querySelector('#creative-tools-panel');
    Object.defineProperties(panel, { clientHeight: { configurable: true, value: 200 }, scrollHeight: { configurable: true, value: 600 } });
    const workspaceWheel = jest.fn();
    panel.parentElement.addEventListener('wheel', workspaceWheel);

    panel.scrollTop = 400;
    expect(canScrollInWheelDirection(panel, 120)).toBe(false);
    await act(async () => panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 })));
    panel.scrollTop = 0;
    expect(canScrollInWheelDirection(panel, -120)).toBe(false);
    await act(async () => panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -120 })));

    expect(workspaceWheel).toHaveBeenCalledTimes(2);
  });

  it('keeps the Nail Desk camera and composition stable through repeated panel scrolling', async () => {
    await click(container.querySelector('button[aria-label="Zoom in"]'));
    const panel = container.querySelector('#creative-tools-panel');
    const stage = container.querySelector('.nail-design-studio__nail-stage');
    const readVisualState = () => ({
      zoom: stage.style.getPropertyValue('--stage-zoom'),
      x: stage.style.getPropertyValue('--stage-x'),
      y: stage.style.getPropertyValue('--stage-y'),
      length: stage.style.getPropertyValue('--nail-length'),
      composition: stage.getAttribute('aria-label'),
      background: container.querySelector('[data-testid="nail-stage-container"]').style.backgroundImage,
    });
    const before = readVisualState();

    await act(async () => {
      for (let index = 0; index < 8; index += 1) {
        panel.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: index % 2 ? -120 : 120 }));
      }
    });

    expect(readVisualState()).toEqual(before);
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('125%');
  });

  it('shares scroll ownership behavior with the Effects panel', async () => {
    await click(container.querySelector('#nail-tool-effects'));
    const panel = container.querySelector('#creative-tools-panel');
    Object.defineProperties(panel, { clientHeight: { configurable: true, value: 200 }, scrollHeight: { configurable: true, value: 600 } });
    panel.scrollTop = 100;
    const workspaceWheel = jest.fn();
    panel.parentElement.addEventListener('wheel', workspaceWheel);
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });

    await act(async () => panel.querySelector('[aria-label="Effects Studio"]').dispatchEvent(wheel));

    expect(workspaceWheel).not.toHaveBeenCalled();
    expect(wheel.defaultPrevented).toBe(false);
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
  });

  it('releases wheel input from the Nail Desk root, background surface, and visible nail to the page', async () => {
    const studio = container.querySelector('.nail-design-studio');
    const pageWheel = jest.fn();
    studio.addEventListener('wheel', pageWheel);
    const stage = container.querySelector('.nail-design-studio__nail-stage');
    const visualState = () => [stage.style.getPropertyValue('--stage-zoom'), stage.style.getPropertyValue('--stage-x'), stage.style.getPropertyValue('--stage-y'), stage.style.getPropertyValue('--nail-length'), stage.getAttribute('aria-label')];
    const before = visualState();
    const targets = [
      container.querySelector('[aria-label="Nail Desk"]'),
      container.querySelector('[data-testid="nail-stage-container"]'),
      container.querySelector('[data-testid="stage-nail"]'),
    ];

    for (let repetition = 0; repetition < 4; repetition += 1) {
      for (const target of targets) {
        const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: repetition % 2 ? -120 : 120 });
        await act(async () => target.dispatchEvent(wheel));
        expect(wheel.defaultPrevented).toBe(false);
      }
    }

    expect(pageWheel).toHaveBeenCalledTimes(targets.length * 4);
    expect(visualState()).toEqual(before);
    expect(container.querySelector('output[aria-label="Zoom level"]').textContent).toBe('100%');
  });

  it('leaves properties-panel wheel propagation unchanged', async () => {
    const studio = container.querySelector('.nail-design-studio');
    const pageWheel = jest.fn();
    studio.addEventListener('wheel', pageWheel);
    const wheel = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 120 });

    await act(async () => container.querySelector('.nail-design-studio__properties').dispatchEvent(wheel));

    expect(pageWheel).toHaveBeenCalledTimes(1);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it('expands into independently released panels and supports Focus Mode', async () => {
    const workspace = container.querySelector('.nail-design-studio__workspace');
    await click(container.querySelector('button[aria-label="Collapse creative tools panel"]'));
    expect(workspace.classList.contains('nail-design-studio__workspace--left-closed')).toBe(true);
    expect(container.querySelector('#creative-tools-panel')).toBeNull();
    await click(container.querySelector('button[aria-label="Collapse design properties panel"]'));
    expect(workspace.classList.contains('nail-design-studio__workspace--right-closed')).toBe(true);
    await click(button('Focus Mode'));
    expect(button('Focus Mode').getAttribute('aria-pressed')).toBe('true');
    expect(container.querySelectorAll('.nail-design-studio__panel')).toHaveLength(0);
  });

  it('provides the full nail-length range and approved workspace surfaces', async () => {
    const length = container.querySelector('#nail-length');
    expect([length.min, length.max, length.value]).toEqual(['50', '250', '100']);
    await type(length, '250');
    expect(container.querySelector('.nail-design-studio__nail-stage').style.getPropertyValue('--nail-length')).toBe('2.5');
    const longNailViewBox = container.querySelector('[data-testid="stage-nail"]').getAttribute('viewBox').split(' ').map(Number);
    expect(longNailViewBox[1]).toBeLessThan(0);
    expect(longNailViewBox[3]).toBeGreaterThan(455);
    expect(container.querySelector('[data-testid="stage-nail"]').closest('[data-testid="nail-slot"]')).toBeTruthy();
    const surface = container.querySelector('#workspace-surface');
    expect([...surface.options].map((option) => option.textContent)).toEqual(['Signature', 'Cherry Lacquer', "Kiki's"]);
    expect(container.querySelector('[data-testid="nail-stage-container"]').style.backgroundImage).toContain('/assets/anitaset/design-studio/workspace-surfaces/signature-workspace.png');
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set.call(surface, 'kikis');
      surface.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.querySelector('[data-testid="nail-stage-container"]').style.backgroundImage).toContain('/assets/anitaset/design-studio/workspace-surfaces/kikis-workspace.png');
  });
});
