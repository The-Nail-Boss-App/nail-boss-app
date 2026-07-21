import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import NailShopPublicShell from './NailShopPublicShell';
import { mockPublicShop, nailShopAssets } from './mockPublicShop';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const sources = ['NailShopPublicShell.jsx', 'ShopHeader.jsx', 'mockPublicShop.js'].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');
let container; let root;
function renderShell(props) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<NailShopPublicShell {...props} />)); }
function clickByText(text) { const btn = Array.from(container.querySelectorAll('button')).find((b) => b.textContent.includes(text)); expect(btn).toBeTruthy(); act(() => btn.dispatchEvent(new MouseEvent('click', { bubbles: true }))); }

describe('NailShopPublicShell', () => {
  afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); container = null; root = null; });

  it('renders Luxe Nail Studio identity without AnitaSet Atelier as the shop title', () => {
    renderShell();
    expect(container.textContent).toContain('Luxe Nail Studio');
    expect(container.textContent).toContain('Atlanta, Georgia');
    expect(container.textContent).toContain('Art. Attitude. Perfection.');
    expect(container.textContent).not.toContain('AnitaSet Atelier');
  });

  it('renders storefront actions, rating, and review count', () => {
    renderShell();
    expect(container.textContent).toContain('★★★★★');
    expect(container.textContent).toContain(mockPublicShop.rating);
    expect(container.textContent).toContain(mockPublicShop.reviewCount);
    expect(container.textContent).toContain('Book This Shop');
    expect(container.textContent).toContain('Message Shop');
  });

  it('renders five Display Window images and five Artist Collective avatars', () => {
    renderShell();
    const renderedImageUrls = Array.from(container.querySelectorAll('img')).map((image) => image.getAttribute('src'));
    nailShopAssets.displayWindow.forEach((assetUrl) => expect(renderedImageUrls).toContain(assetUrl));
    nailShopAssets.artistAvatars.forEach((assetUrl) => expect(renderedImageUrls).toContain(assetUrl));
  });

  it('renders the blueprint storefront navigation items', () => {
    renderShell();
    ['Home', 'Services', 'Gallery', 'Shop', 'About', 'Reviews'].forEach((label) => {
      expect(Array.from(container.querySelectorAll('[role="tab"]')).some((node) => node.textContent.includes(label))).toBe(true);
    });
  });

  it('changes active boutique panels through PublicTabs including reviews', () => {
    renderShell();
    expect(container.textContent).toContain('Storefront home');
    clickByText('Gallery');
    expect(container.textContent).toContain('Fresh looks from the Luxe window');
    clickByText('Reviews');
    expect(container.textContent).toContain('Maya R.');
  });

  it('does not render old placeholder or platform-centered copy', () => {
    renderShell();
    ['Ki Ki', 'A boutique built around', 'Start shaping a public-facing Nail Shop', 'Book This Artist', 'Shop Sets'].forEach((oldText) => {
      expect(container.textContent).not.toContain(oldText);
    });
  });

  it('does not reference forbidden production integrations', () => {
    ['localStorage', 'sessionStorage', 'fetch', 'axios', 'network', 'backend', '../App', '../NailShop', 'routes', 'FullSetRenderer', 'BlueprintGalleryRenderer'].forEach((token) => expect(sources).not.toContain(token));
  });
});
