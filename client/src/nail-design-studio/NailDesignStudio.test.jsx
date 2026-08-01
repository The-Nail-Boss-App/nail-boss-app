import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NailDesignStudio from './NailDesignStudio';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

const click = async (element) => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));

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
  });

  it('renders the approved brand and accessible commands in the required order', () => {
    const bar = container.querySelector('[data-testid="nail-design-studio-command-bar"]');
    const logo = bar.querySelector('img[alt="AnitaSet"]');
    const heading = bar.querySelector('h1');
    expect(logo.src).toContain('/anitaset-logo-main.png');
    expect(logo.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(heading.textContent).toBe('Nail Design Studio™');
    expect(container.textContent).not.toContain('The World’s Most Beautiful Luxury Digital Nail Desk.');

    const labels = ['New Design', 'Open Saved Design', 'Duplicate', 'Saved', 'Undo', 'Redo', 'Share', 'Export', 'Add to Collection', 'Design Details'];
    labels.forEach((label) => expect(bar.querySelector(`button[aria-label="${label}"][title="${label}"]`)).toBeTruthy());
    expect(container.querySelector('.nail-design-studio__tool-ribbon').compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(container.querySelector('[data-testid="artist-command-bar"]')).toBeNull();
  });

  it('keeps the saved-design selector, smart save state, and edit disabled state', async () => {
    const open = container.querySelector('button[aria-label="Open Saved Design"]');
    const selector = container.querySelector('button[aria-label^="Current Design:"]');
    await click(open);
    expect(container.querySelector('[role="dialog"][aria-label="Saved Designs"]')).toBeTruthy();
    expect(selector.getAttribute('aria-expanded')).toBe('true');

    await click(container.querySelector('button[aria-label="Duplicate"]'));
    expect(container.querySelector('button[aria-label="Save Changes"]')).toBeTruthy();
    await click(container.querySelector('button[aria-label="Save Changes"]'));
    expect(container.querySelector('button[aria-label="Saved"]').disabled).toBe(true);
    expect(container.querySelector('button[aria-label="Undo"]').disabled).toBe(true);
    expect(container.querySelector('button[aria-label="Redo"]').disabled).toBe(true);
  });
});
