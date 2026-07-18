import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import Headquarters from './Headquarters';
import { officialAssets } from './headquartersData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const sourceFiles = [
  'Headquarters.jsx',
  'HeadquartersHero.jsx',
  'HeadquartersMetrics.jsx',
  'HeadquartersDoors.jsx',
  'HeadquartersDirectory.jsx',
  'HeadquartersPriorities.jsx',
  'headquartersData.js',
  'headquartersStyles.css',
];
const source = sourceFiles.map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

let container;
let root;
let navigations;

function renderHeadquarters() {
  navigations = [];
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Headquarters techName="Anita" onNavigate={(destination) => navigations.push(destination)} />));
}

const buttonsByText = (text) => Array.from(container.querySelectorAll('button')).filter((button) => button.textContent === text);
const buttonsContainingText = (text) => Array.from(container.querySelectorAll('button')).filter((button) => button.textContent.includes(text));

describe('Headquarters', () => {
  afterEach(() => {
    if (root) act(() => root.unmount());
    container?.remove();
    container = null;
    root = null;
    navigations = [];
  });

  it('renders the Headquarters arrival hero with official logo and favicon assets', () => {
    renderHeadquarters();
    expect(container.textContent).toContain('Welcome to Headquarters.');
    const logo = container.querySelector('img[alt="AnitaSet secondary logo for dark backgrounds"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe(officialAssets.darkBackgroundLogo);
    expect(container.querySelector(`img[src="${officialAssets.favicon}"]`)).not.toBeNull();
  });

  it('renders the approved six business snapshot cards', () => {
    renderHeadquarters();
    expect(container.querySelectorAll('[data-testid="headquarters-metric-card"]')).toHaveLength(6);
    ['Revenue Today', 'New Nail Shops', 'Active Clients', 'Designs Created', 'Bookings', 'Profit Today'].forEach((label) => {
      expect(container.textContent).toContain(label);
    });
  });

  it('renders exactly four primary Headquarters rooms with Create, Price, Sell, and Grow labels', () => {
    renderHeadquarters();
    expect(container.querySelectorAll('[data-testid="headquarters-primary-door"]')).toHaveLength(4);
    ['CREATE', 'PRICE', 'SELL', 'GROW'].forEach((label) => expect(container.textContent).toContain(label));
  });

  it('keeps existing Artist District navigation available', () => {
    renderHeadquarters();
    const action = buttonsContainingText('Enter District')[3];
    expect(action).not.toBeUndefined();
    expect(action.disabled).toBe(false);
    act(() => action.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(navigations).toContain('artist-district');
  });

  it('renders unfinished district actions as disabled', () => {
    renderHeadquarters();
    ['VENDOR HUB', 'MARKETPLACE', 'EDUCATION', 'COMMUNITY', 'EVENTS'].forEach((label) => expect(container.textContent).toContain(label));
    expect(buttonsContainingText('Opening Soon')).toHaveLength(6);
    buttonsContainingText('Opening Soon').forEach((button) => expect(button.disabled).toBe(true));
    ['commerce infrastructure is future scope', 'future scope', 'requires future'].forEach((copy) => {
      expect(container.textContent).not.toContain(copy);
    });
  });

  it('renders the approved seven Quick Actions items', () => {
    renderHeadquarters();
    expect(container.querySelectorAll('[data-testid="headquarters-priority-item"]')).toHaveLength(7);
    ['New Design', 'New Proposal', 'Add Client', 'Post to Community', 'Add New Product', 'Create Promotion', 'AI Shop Manager'].forEach((label) => expect(container.textContent).toContain(label));
  });

  it('renders Anita presence, environment, compact utility access, live updates, and Assistant access', () => {
    renderHeadquarters();
    expect(container.querySelector('[data-testid="headquarters-environment-layer"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="headquarters-anita-presence"]')).not.toBeNull();
    ['What’s Happening', 'Summer Chrome Week', 'New Nail Shop', 'Featured Artist', 'Vendor Spotlight', 'Trending Shape', 'AI Shop Manager'].forEach((label) => expect(container.textContent).toContain(label));
  });

  it('does not render legacy Dashboard language', () => {
    renderHeadquarters();
    expect(container.textContent).not.toContain('Dashboard');
  });

  it('does not introduce forbidden integrations or production-system changes', () => {
    ['fetch', 'axios', 'localStorage', 'sessionStorage', '/api/', 'backend', 'payment', 'booking'].forEach((token) => {
      expect(source).not.toContain(token);
    });
    ['client/src/design-studio/', 'client/src/artist-district/', 'client/src/nail-shop-public/', 'server.js', 'backend/', 'routes/'].forEach((restrictedPath) => {
      expect(source).not.toContain(restrictedPath);
    });
  });
});
