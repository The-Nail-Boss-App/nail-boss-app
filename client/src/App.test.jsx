import React, { act } from 'react';
import { createRoot } from 'react-dom/client';

jest.mock('./Login', () => ({ onLogin }) => <button type="button" onClick={() => onLogin('Anita Artist')}>Enter AnitaSet</button>);
jest.mock('./DesignStudio', () => {
  const React = require('react');
  return React.forwardRef((props, ref) => {
    React.useImperativeHandle(ref, () => ({ hasDirtyWork: () => false, prepareToLeave: () => true }));
    return <header data-testid="artist-command-bar">Nail Design Studio mock</header>;
  });
});
jest.mock('./headquarters/Headquarters', () => () => <div>Headquarters mock</div>);
jest.mock('./Proposals', () => () => <div>Proposals mock</div>);
jest.mock('./artist-district/ArtistDistrict', () => () => <div>Artist District mock</div>);

import App from './App';
import { mockPublicShop, nailShopAssets } from './nail-shop-public/mockPublicShop';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

async function clickByText(text) {
  const button = Array.from(container.querySelectorAll('button')).find((node) => node.textContent.includes(text));
  expect(button).toBeTruthy();
  await act(async () => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
}

describe('App Nail Shop route', () => {
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) act(() => root.unmount());
    container.remove();
    container = null;
    root = null;
  });

  it('renders the Founder-approved public Nail Shop after authenticated sidebar navigation', async () => {
    await act(async () => root.render(<App />));

    await clickByText('Enter AnitaSet');
    await clickByText('Nail Shop');

    expect(container.querySelector('[aria-label="Nail Shop public shell"]')).toBeTruthy();
    expect(container.querySelector('[data-testid="app-sidebar"]')).toBeTruthy();
    expect(container.textContent).toContain(mockPublicShop.shopName);
    expect(container.textContent).toContain('Home');
    expect(container.textContent).toContain('Gallery');
    expect(container.textContent).toContain('Services');
    expect(container.textContent).toContain('Shop');
    expect(container.textContent).toContain('About');
    expect(container.textContent).toContain('Reviews');
    expect(container.textContent).toContain('Artist Collective');

    const renderedImageUrls = Array.from(container.querySelectorAll('img')).map((image) => image.getAttribute('src'));
    [
      nailShopAssets.banner,
      nailShopAssets.signature,
      ...nailShopAssets.displayWindow,
    ].forEach((assetUrl) => expect(renderedImageUrls).toContain(assetUrl));

    ['Start shaping a public-facing Nail Shop', 'Ki Ki’s Nail Shop', 'Business Workspace', 'AnitaSet Atelier'].forEach((oldPlaceholderText) => {
      expect(container.textContent).not.toContain(oldPlaceholderText);
    });
  });

  it('uses dedicated Studio Mode and restores the shared room header after leaving', async () => {
    await act(async () => root.render(<App />));

    await clickByText('Enter AnitaSet');

    const studioCommandBar = container.querySelector('[data-testid="artist-command-bar"]');
    expect(studioCommandBar).toBeTruthy();
    expect(studioCommandBar.parentElement.firstElementChild).toBe(studioCommandBar);
    expect(container.textContent).not.toContain('Hey, Anita Artist');

    await clickByText('Proposals');
    expect(container.querySelector('[data-testid="artist-command-bar"]')).toBeFalsy();
    expect(container.textContent).toContain('Hey, Anita Artist');
    expect(container.textContent).toContain('Proposals');
  });
});
