import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NailDesignStudio from './NailDesignStudio';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;
const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const keyDown = async (element, key) => act(async () => element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })));
const type = async (input, value) => act(async () => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
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
      Design: ['New Design', 'Open Saved Designs', 'Duplicate', 'Saved'],
      Edit: ['Undo', 'Redo'],
      Publish: ['Share', 'Export', 'Add to Collection'],
      Info: ['Design Details'],
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
    await click(container.querySelector('button[aria-label="Open Saved Designs"]'));
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
    await click(container.querySelector('button[aria-label="Duplicate"]'));
    await click(container.querySelector('button[aria-label="Save Changes"]'));
    expect(container.querySelector('button[aria-label="Saving…"]').disabled).toBe(true);
    await act(async () => jest.advanceTimersByTime(150));
    expect(container.querySelector('button[aria-label="Saved"]').disabled).toBe(true);
  });

  it('keeps collection and details workflows wired and dismissible', async () => {
    await click(container.querySelector('button[aria-label="Add to Collection"]'));
    expect(container.querySelector('[role="dialog"][aria-label="Add to Collection"]')).toBeTruthy();
    await click(container.querySelector('button[aria-label="Close Add to Collection"]'));
    await click(container.querySelector('button[aria-label="Design Details"]'));
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
