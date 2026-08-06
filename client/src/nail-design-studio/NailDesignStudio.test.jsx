import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NailDesignStudio from './NailDesignStudio';
import { heroEffectForPolish, normalizePolishForFinish } from './polishFinish';
import { MATERIAL_PROFILES, materialProfile } from './MaterialRenderer';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const keyDown = async (element, key) => act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
const type = async (input, value) => act(async () => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
});

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
    expect(container.querySelector('[data-testid="active-polish-card"]')).toBeNull();
    expect(container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure').dataset.polishFinish).toBe('Cream');
    const hex = container.querySelector('input[aria-label="Base Color HEX"]');
    expect(hex.classList.contains('nail-design-studio__hex-input')).toBe(true);
    await type(hex, '#ABCDEF'); await act(async () => hex.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(container.querySelector('input[type="color"]').value.toUpperCase()).toBe('#ABCDEF');
    await type(hex, '#BAD'); await act(async () => hex.dispatchEvent(new FocusEvent('focusout', { bubbles: true })));
    expect(hex.getAttribute('aria-invalid')).toBe('true');
  });

  it('saves, selects, favorites, renames, deletes, and synchronizes both Polish Racks', async () => {
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    expect(container.querySelector('[aria-live="polite"]').textContent).toContain('saved to Polish Rack');
    const leftNames = [...container.querySelectorAll('.nail-design-studio__mini-bottles > div > span')].map((node) => node.textContent.replace(/^★/, ''));
    const lowerNames = [...container.querySelectorAll('.nail-design-studio__lower-polish > span')].map((node) => node.textContent.replace('★ ', ''));
    expect(leftNames).toContain('Blush Royalty'); expect(lowerNames).toContain('Blush Royalty');
    expect(container.querySelector('button[aria-label="Remove polish from Polish Rack"]')).toBeTruthy();
    const favorite = container.querySelector('button[aria-label="Favorite Blush Royalty"]'); await click(favorite); expect(favorite.getAttribute('aria-pressed')).toBe('false');
    window.prompt = jest.fn(() => 'Royal Repair'); await click(container.querySelector('button[aria-label="Rename Blush Royalty"]'));
    expect(container.textContent).toContain('Royal Repair');
    window.confirm = jest.fn(() => true); await click(container.querySelector('button[aria-label="Delete Royal Repair"]'));
    expect(container.querySelector('button[aria-label="Delete Royal Repair"]')).toBeNull();
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

    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Jelly', 'Matte', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(select.value).toBe(finish);
      expect(container.querySelector('[data-design-layer="polish"]')).toBeTruthy();
    }
  });

  it('keeps hidden legacy finishes compatible when reopening a saved design', async () => {
    const legacy = normalizePolishForFinish({ colorHex: '#ABCDEF', metallicReflection: .55 }, 'Chrome-ready');
    expect(legacy).toMatchObject({ finish: 'Chrome-ready', colorHex: '#ABCDEF', metallicReflection: .55 });
    expect(heroEffectForPolish(legacy).id).toBe('Chrome');
  });

  it('updates the compact bottle material for every approved finish', async () => {
    const activeBottle = container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure');
    expect(activeBottle.dataset.bottleRenderer).toBe('simplified');
    expect(activeBottle.getAttribute('viewBox')).toBe('0 0 52 76');
    expect(activeBottle.querySelector('[data-bottle-layer="outer-casing"]')).toBeNull();
    expect(activeBottle.querySelector('[data-bottle-layer="front-reflection"]')).toBeTruthy();
    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Matte', 'Jelly', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      expect(container.querySelector('.nail-design-studio__active-polish .polish-bottle-figure').dataset.polishFinish).toBe(finish);
    }
    expect(container.querySelector('[data-bottle-material-layer="suspended-glitter-particles"] circle')).toBeTruthy();
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    const rackBottles = [...container.querySelectorAll('.nail-design-studio__polish-rack .polish-bottle-figure')];
    expect(rackBottles.length).toBeGreaterThan(0);
    expect(rackBottles.every((bottle) => bottle.dataset.bottleRenderer === 'simplified' && bottle.getAttribute('viewBox') === '0 0 38 58')).toBe(true);
  });

  it('renders all finishes through reusable, ordered material layers', async () => {
    expect(Object.keys(MATERIAL_PROFILES)).toEqual(['Cream', 'Matte', 'Jelly', 'Glitter']);
    expect(materialProfile('Matte').reflection).toBeLessThan(materialProfile('Cream').reflection);
    expect(materialProfile('Jelly').transmission).toBeGreaterThan(0);
    const select = container.querySelector('select[aria-label="Finish"]');
    for (const finish of ['Cream', 'Matte', 'Jelly', 'Glitter']) {
      await act(async () => { select.value = finish; select.dispatchEvent(new Event('change', { bubbles: true })); });
      const renderer = container.querySelector('[data-testid="stage-nail"] [data-material-renderer="MaterialRenderer"]');
      expect(renderer.dataset.materialProfile).toBe(`${finish}Material`);
      const layers = [...renderer.querySelectorAll('[data-material-layer]')].map((node) => node.dataset.materialLayer);
      expect(layers.slice(0, 3)).toEqual(finish === 'Jelly'
        ? ['base-jelly-pigment', 'colored-light-transmission', 'internal-color-depth']
        : ['base-pigment', 'curvature-shadow', 'edge-darkening']);
      expect(layers).toContain('reflection');
      expect(layers).toContain('top-coat');
    }
    expect(container.querySelector('[data-material-layer="submerged-glitter"] circle')).toBeTruthy();
    expect(container.querySelector('.nail-design-studio__active-swatch [data-material-profile="GlitterMaterial"]')).toBeTruthy();
  });

  it('uses the filled star to unsave the active formulation from both racks', async () => {
    await click(container.querySelector('button[aria-label="Save polish to Polish Rack"]'));
    expect(container.querySelectorAll('button[aria-label="Blush Royalty #D94C70 Cream polish bottle preview"]')).toHaveLength(2);
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
  const labels = ['Polish', 'Technique', 'Brush', 'Sticker Studio™', 'Charm Studio™', 'Gems', 'Effects', '3D Objects', 'Top Coat'];
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
    expect(document.activeElement.textContent).toBe('Technique');
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
    expect(['Active Polish', 'Polish Rack'].every((label) => studio.textContent.includes(label))).toBe(true);
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
    const finish = effects.querySelector('select[aria-label="Finish"]');
    await act(async () => { finish.value = 'Gradient'; finish.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(effects.dataset.heroDocumentId).toBe(documentId);
    expect(effects.querySelector('select[aria-label="Finish"]').value).toBe('Gradient');
    expect(effects.querySelector('input[aria-label="Direction"]')).toBeTruthy();
    expect(container.querySelector('[data-design-layer="polish"]').dataset.heroEffect).toBe('Gradient');
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
