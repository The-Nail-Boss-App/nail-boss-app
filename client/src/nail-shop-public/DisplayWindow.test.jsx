import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import DisplayWindow from './DisplayWindow';

const sourcePath = path.join(__dirname, 'DisplayWindow.jsx');
const stylesPath = path.join(__dirname, 'displayWindowStyles.js');
const source = `${fs.readFileSync(sourcePath, 'utf8')}\n${fs.readFileSync(stylesPath, 'utf8')}`;

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container;
let root;

function renderDisplayWindow(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(<DisplayWindow {...props} />);
  });
}

describe('DisplayWindow', () => {
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

  it('renders the Display Window section', () => {
    renderDisplayWindow();

    expect(container.querySelector('section[aria-labelledby="display-window-title"]')).not.toBeNull();
  });

  it('renders the official title', () => {
    renderDisplayWindow();

    expect(container.textContent).toContain('Display Window™');
  });

  it('renders exactly 4 default cards', () => {
    renderDisplayWindow();

    expect(container.querySelectorAll('article')).toHaveLength(4);
  });

  it('renders custom items', () => {
    renderDisplayWindow({
      items: [
        {
          id: 'custom-look',
          name: 'Custom Rose Look',
          category: 'Rose Capsule',
          priceLabel: 'From $88',
          description: 'A custom display item.',
        },
      ],
    });

    expect(container.querySelectorAll('article')).toHaveLength(1);
    expect(container.textContent).toContain('Custom Rose Look');
    expect(container.textContent).toContain('Rose Capsule');
    expect(container.textContent).toContain('From $88');
  });

  it('renders an empty state safely', () => {
    renderDisplayWindow({ items: [] });

    expect(container.querySelectorAll('article')).toHaveLength(0);
    expect(container.textContent).toContain('Display Window™ pieces are being polished for preview.');
  });

  it('renders disabled View Look buttons', () => {
    renderDisplayWindow();

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons).toHaveLength(4);
    buttons.forEach((button) => {
      expect(button.textContent).toBe('View Look');
      expect(button.disabled).toBe(true);
    });
  });

  it('does not reference forbidden production imports, storage, network APIs, or effects', () => {
    const forbiddenTokens = [
      'App',
      'NailShop',
      'FullSetRenderer',
      'BlueprintGalleryRenderer',
      'localStorage',
      'sessionStorage',
      'fetch',
      'axios',
      'useEffect',
    ];

    forbiddenTokens.forEach((token) => {
      expect(source).not.toContain(token);
    });
  });
});
