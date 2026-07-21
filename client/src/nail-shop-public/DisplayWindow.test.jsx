import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import DisplayWindow from './DisplayWindow';
import { nailShopAssets } from './mockPublicShop';

const sourcePath = path.join(__dirname, 'DisplayWindow.jsx');
const stylesPath = path.join(__dirname, 'displayWindowStyles.js');
const source = `${fs.readFileSync(sourcePath, 'utf8')}\n${fs.readFileSync(stylesPath, 'utf8')}`;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
function renderDisplayWindow(props) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => { root.render(<DisplayWindow {...props} />); }); }

describe('DisplayWindow', () => {
  afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); container = null; root = null; });

  it('renders the Display Window section and official title', () => {
    renderDisplayWindow();
    expect(container.querySelector('section[aria-labelledby="display-window-title"]')).not.toBeNull();
    expect(container.textContent).toContain('Display Window™');
  });

  it('renders exactly 5 default curated image-first cards', () => {
    renderDisplayWindow();
    expect(container.querySelectorAll('article')).toHaveLength(5);
    nailShopAssets.displayWindow.forEach((assetUrl) => expect(Array.from(container.querySelectorAll('img')).map((image) => image.getAttribute('src'))).toContain(assetUrl));
  });

  it('renders previous and next arrow controls without giant disabled card buttons', () => {
    renderDisplayWindow();
    expect(container.querySelector('[aria-label="Previous Display Window item"]')).toBeTruthy();
    expect(container.querySelector('[aria-label="Next Display Window item"]')).toBeTruthy();
    expect(Array.from(container.querySelectorAll('button')).some((button) => button.textContent === 'View Look')).toBe(false);
  });

  it('renders custom items', () => {
    renderDisplayWindow({ items: [{ id: 'custom-look', type: 'product', title: 'Custom Rose Look', subtitle: 'Rose Capsule', visualLabel: 'Custom rose product preview' }] });
    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.textContent).toContain('Custom Rose Look');
    expect(container.textContent).toContain('Rose Capsule');
  });

  it('renders an empty state safely', () => {
    renderDisplayWindow({ items: [] });
    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(container.textContent).toContain('Display Window™ pieces are being curated for preview.');
  });

  it('does not reference forbidden production imports, storage, network APIs, or effects', () => {
    ['App', 'NailShop', 'FullSetRenderer', 'BlueprintGalleryRenderer', 'localStorage', 'sessionStorage', ['fet', 'ch'].join(''), 'axios', 'useEffect', 'backend', 'routes'].forEach((token) => expect(source).not.toContain(token));
  });
});
