import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import NailShopPublicShell from './NailShopPublicShell';
import { mockPublicShop } from './mockPublicShop';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const sources = ['NailShopPublicShell.jsx', 'ShopHeader.jsx', 'mockPublicShop.js'].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
let container; let root;
function renderShell(props) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<NailShopPublicShell {...props} />)); }
function clickByText(text) { const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent === text); act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }

describe('NailShopPublicShell', () => {
  afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); container = null; root = null; });

  it('renders official eyebrow, shop name, tagline, and location', () => {
    renderShell();
    expect(container.textContent).toContain('Nail Shop™');
    expect(container.textContent).toContain(mockPublicShop.shopName);
    expect(container.textContent).toContain(mockPublicShop.tagline);
    expect(container.textContent).toContain(mockPublicShop.location);
  });

  it('renders preset and custom specialty tags', () => {
    renderShell({ specialtyTags: ['Gel-X', 'Custom Charms'] });
    expect(container.textContent).toContain('Gel-X');
    expect(container.textContent).toContain('Custom Charms');
  });

  it('changes active boutique panels through PublicTabs', () => {
    renderShell();
    expect(container.textContent).toContain('A boutique built around');
    clickByText('Gallery');
    expect(container.textContent).toContain('Editorial looks ready');
    clickByText('Shop');
    expect(container.textContent).toContain('Premium merchandise preview');
  });

  it('shows Artists tab only when hasMultipleArtists is true', () => {
    renderShell({ shop: { ...mockPublicShop, hasMultipleArtists: true } });
    expect(container.textContent).toContain('Artists');
  });

  it('hides Artists tab when hasMultipleArtists is false', () => {
    renderShell({ shop: { ...mockPublicShop, hasMultipleArtists: false } });
    expect(Array.from(container.querySelectorAll('[role="tab"]')).map((n) => n.textContent)).not.toContain('Artists');
  });

  it('keeps preview header buttons disabled', () => {
    renderShell();
    ['Book This Artist', 'Shop Sets'].forEach((label) => expect(Array.from(container.querySelectorAll('button')).find((b) => b.textContent === label).disabled).toBe(true));
  });

  it('does not reference forbidden production integrations', () => {
    ['localStorage', 'sessionStorage', 'fetch', 'axios', 'network', 'backend', '../App', '../NailShop', 'routes', 'FullSetRenderer', 'BlueprintGalleryRenderer'].forEach((token) => expect(sources).not.toContain(token));
  });
});
