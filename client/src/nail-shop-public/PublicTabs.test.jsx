import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import PublicTabs from './PublicTabs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sourcePath = path.join(__dirname, 'PublicTabs.jsx');
const source = fs.readFileSync(sourcePath, 'utf8');

let container;
let root;

function renderTabs(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);

  act(() => {
    root.render(<PublicTabs {...props} />);
  });
}

function getTab(name) {
  return Array.from(container.querySelectorAll('[role="tab"]')).find((tab) => tab.textContent.includes(name));
}

function keyDown(node, key) {
  act(() => {
    node.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  });
}

function click(node) {
  act(() => {
    node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
}

function tabNames() {
  return ['Home', 'Services', 'Gallery', 'Shop', 'About', 'Reviews'];
}

describe('PublicTabs', () => {
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

  it('renders all six blueprint default tabs', () => {
    renderTabs();

    tabNames().forEach((tab) => {
      expect(getTab(tab)).not.toBeUndefined();
    });
  });

  it('changes the active tab when clicked', () => {
    renderTabs();

    click(getTab('Services'));

    expect(getTab('Services').getAttribute('aria-selected')).toBe('true');
    expect(getTab('Home').getAttribute('aria-selected')).toBe('false');
  });

  it('supports keyboard navigation and activation', () => {
    const onTabChange = jest.fn();
    renderTabs({ onTabChange });

    getTab('Home').focus();
    keyDown(getTab('Home'), 'ArrowRight');

    expect(getTab('Services')).toBe(document.activeElement);
    expect(getTab('Services').getAttribute('aria-selected')).toBe('true');

    keyDown(getTab('Services'), 'End');
    expect(getTab('Reviews')).toBe(document.activeElement);

    keyDown(getTab('Reviews'), 'Home');
    expect(getTab('Home')).toBe(document.activeElement);

    keyDown(getTab('Home'), 'ArrowLeft');
    expect(getTab('Reviews')).toBe(document.activeElement);

    keyDown(getTab('Reviews'), 'Enter');
    expect(onTabChange).toHaveBeenCalledWith('Reviews');

    keyDown(getTab('Reviews'), ' ');
    expect(onTabChange).toHaveBeenCalledWith('Reviews');
  });

  it('uses the correct ARIA roles and tab state attributes', () => {
    renderTabs();

    expect(container.querySelector('[role="tablist"][aria-label="Public Nail Shop sections"]')).not.toBeNull();
    const tabs = Array.from(container.querySelectorAll('[role="tab"]'));
    expect(tabs).toHaveLength(6);
    tabs.forEach((tab) => {
      expect(tab.hasAttribute('aria-selected')).toBe(true);
      expect(tab.hasAttribute('aria-controls')).toBe(true);
      expect(tab.hasAttribute('tabindex')).toBe(true);
    });
  });

  it('does not reference forbidden imports, storage, effects, or production integrations', () => {
    const forbiddenTokens = [
      ['..', 'App'].join('/'),
      ['..', 'NailShop'].join('/'),
      ['FullSet', 'Renderer'].join(''),
      ['BlueprintGallery', 'Renderer'].join(''),
      ['local', 'Storage'].join(''),
      ['session', 'Storage'].join(''),
      ['use', 'Effect'].join(''),
    ];

    forbiddenTokens.forEach((token) => {
      expect(source).not.toContain(token);
    });
  });
});
