import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import NailShopPublicShell from './NailShopPublicShell';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sourcePath = path.join(__dirname, 'NailShopPublicShell.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

let container;
let root;

function renderShell(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(<NailShopPublicShell {...props} />);
  });
}

function textContent() {
  return container.textContent;
}

function buttons() {
  return Array.from(container.querySelectorAll('button')).map((button) => button.textContent);
}

describe('NailShopPublicShell', () => {
  afterEach(() => {
    if (root) {
      act(() => {
        root.unmount();
      });
    }
    if (container) {
      container.remove();
    }
    container = null;
    root = null;
  });

  it('renders the public shell', () => {
    renderShell();

    expect(container.querySelector('main[aria-label="Nail Shop public shell"]')).not.toBeNull();
  });

  it('renders the required public shell landmarks and actions', () => {
    renderShell();

    expect(textContent()).toContain('Nail Shop™');
    expect(textContent()).toContain('Display Window™');
    expect(buttons()).toContain('Book this Artist');
    expect(buttons()).toContain('Shop Sets');
  });

  it('renders all public navigation tabs', () => {
    renderShell();

    ['Overview', 'Services', 'Shop', 'Gallery', 'About'].forEach((tab) => {
      expect(buttons()).toContain(tab);
    });
  });

  it('renders the existing SignatureNail component', () => {
    renderShell();

    expect(container.querySelector('[data-testid="signature-nail"]')).not.toBeNull();
  });

  it('does not reference forbidden production imports, storage, or network APIs', () => {
    const forbiddenTokens = [
      ['..', 'App'].join('/'),
      ['..', 'NailShop'].join('/'),
      ['FullSet', 'Renderer'].join(''),
      ['BlueprintGallery', 'Renderer'].join(''),
      ['local', 'Storage'].join(''),
      ['session', 'Storage'].join(''),
      ['fet', 'ch('].join(''),
      ['XML', 'HttpRequest'].join(''),
      ['ax', 'ios'].join(''),
      ['use', 'Effect'].join(''),
    ];

    forbiddenTokens.forEach((token) => {
      expect(source).not.toContain(token);
    });
  });
});
