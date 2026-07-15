import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import ArtistDistrict from './ArtistDistrict';

const sourceFiles = [
  'ArtistDistrict.jsx',
  'ArtistDistrictHeader.jsx',
  'ArtistDistrictSection.jsx',
  'ArtistDistrictPlaceholderCard.jsx',
  'artistDistrictStyles.js',
].map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container;
let root;

function renderArtistDistrict() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<ArtistDistrict />));
}

function sectionCardCount(sectionId) {
  return container.querySelector(`[data-section-id="${sectionId}"]`).querySelectorAll('[data-artist-district-card="true"]').length;
}

describe('ArtistDistrict', () => {
  beforeEach(renderArtistDistrict);

  afterEach(() => {
    if (root) act(() => root.unmount());
    container.remove();
    container = null;
    root = null;
  });

  it('renders the official title, tagline, and search placeholder', () => {
    expect(container.textContent).toContain('Artist District™');
    expect(container.textContent).toContain('Discover incredible Nail Shops from creators around the world.');
    expect(container.querySelector('input').getAttribute('placeholder')).toBe('Search Nail Shops, artists, styles, or locations');
  });

  it('renders all four section headings', () => {
    ['Featured Nail Shops', 'Trending This Week', 'New Artists', 'Browse All Nail Shops'].forEach((heading) => {
      expect(container.textContent).toContain(heading);
    });
  });

  it('renders exact card counts for each Artist District™ section', () => {
    expect(sectionCardCount('featured-nail-shops')).toBe(3);
    expect(sectionCardCount('trending-this-week')).toBe(3);
    expect(sectionCardCount('new-artists')).toBe(3);
    expect(sectionCardCount('browse-all-nail-shops')).toBe(6);
  });

  it('keeps every Visit Shop button disabled', () => {
    const buttons = Array.from(container.querySelectorAll('button')).filter((button) => button.textContent === 'Visit Shop');
    expect(buttons.length).toBe(15);
    buttons.forEach((button) => expect(button.disabled).toBe(true));
  });

  it('renders Signature Nail™ content and specialty tags', () => {
    expect(container.textContent).toContain('Display Window™');
    expect(container.innerHTML).toContain('Signature Nail™ visual');
    ['Sculpted Gel', 'Black Cherry', 'Soft Gold', 'Pearl Accents'].forEach((tag) => {
      expect(container.textContent).toContain(tag);
    });
  });

  it('keeps forbidden references and integrations absent', () => {
    ['Profile', 'Profile Picture', 'Storefront', 'View Profile', 'localStorage', 'sessionStorage', 'fetch', 'axios', '/api/', 'backend', 'routes', 'App.jsx', 'NailShop.jsx', '../App', '../NailShop', 'production navigation'].forEach((token) => {
      expect(sourceFiles).not.toContain(token);
    });
  });
});
