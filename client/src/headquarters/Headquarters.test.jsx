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
    const logo = container.querySelector('img[alt="AnitaSet primary logo"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe(officialAssets.primaryLogo);
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
    ['Vendor Hub', 'Marketplace', 'Education', 'Community'].forEach((label) => expect(container.textContent).toContain(label));
    expect(buttonsContainingText('Coming Soon')).toHaveLength(5);
    buttonsContainingText('Coming Soon').forEach((button) => expect(button.disabled).toBe(true));
  });

  it('renders exactly four Today’s Priorities items', () => {
    renderHeadquarters();
    expect(container.querySelectorAll('[data-testid="headquarters-priority-item"]')).toHaveLength(4);
    ['New Design', 'New Proposal', 'Add Client', 'Create Promotion'].forEach((label) => expect(container.textContent).toContain(label));
  });

  it('renders compact utility access, live updates, and Assistant access', () => {
    renderHeadquarters();
    ['Messages', 'Calendar', 'Tasks', 'What’s Happening', 'AI Shop Manager'].forEach((label) => expect(container.textContent).toContain(label));
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
