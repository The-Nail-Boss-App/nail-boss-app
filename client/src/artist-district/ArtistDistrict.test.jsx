import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import ArtistDistrict from './ArtistDistrict';
import { artistDistrictTagline } from './artistDistrictData';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const source = ['ArtistDistrict.jsx', 'ArtistDistrictHeader.jsx', 'ArtistDistrictSection.jsx', 'ArtistDistrictPlaceholderCard.jsx', 'artistDistrictData.js']
  .map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

let container; let root;
function renderArtistDistrict() { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<ArtistDistrict />)); }
const buttonsByText = (text) => Array.from(container.querySelectorAll('button')).filter((button) => button.textContent === text);

describe('ArtistDistrict', () => {
  afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); container = null; root = null; });

  it('renders the Artist District title, existing tagline, and search placeholder', () => {
    renderArtistDistrict();
    expect(container.querySelector('main[aria-labelledby="artist-district-title"]')).not.toBeNull();
    expect(container.textContent).toContain('Artist District™');
    expect(container.textContent).toContain(artistDistrictTagline);
    expect(container.querySelector('input[type="search"]').getAttribute('placeholder')).toBe('Search Nail Shops, artists, styles, or locations');
  });

  it('renders the official secondary logo with meaningful alt text', () => {
    renderArtistDistrict();
    const logo = container.querySelector('img[alt="AnitaSet secondary logo with Design, Price, Sell, Grow tagline"]');
    expect(logo).not.toBeNull();
    expect(logo.getAttribute('src')).toBe('/anitaset-logo-secondary.png');
  });

  it('renders only the approved hero environment with an accessible description', () => {
    renderArtistDistrict();
    const environment = container.querySelector('.artist-hero__environment');
    expect(environment.getAttribute('src')).toBe('/assets/anitaset/artist-district/hero/artist-district-hero.png');
    expect(environment.getAttribute('alt')).toBe('Sunset view of the Artist District creative neighborhood, nail boutiques, and central fountain');
    expect(container.querySelector('.artist-hero__artwork').querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('.artist-hero__fountain')).toBeNull();
    expect(container.querySelector(`.artist-hero img[src="/assets/anitaset/artist-district/landmarks/artist-district-fountain-v1.png"]`)).toBeNull();
  });

  it('renders the Spotlight editorial cover story with disabled action', () => {
    renderArtistDistrict();
    expect(container.querySelector('section[aria-labelledby="artist-spotlight-title"]')).not.toBeNull();
    expect(container.textContent).toContain('SPOTLIGHT');
    expect(container.textContent).toContain('Summer Chrome Week');
    expect(container.textContent).toContain('Chrome is having its moment. Explore this week’s featured artists, looks, and collections.');
    const action = buttonsByText('Meet the Artists')[0];
    expect(action).not.toBeUndefined();
    expect(action.disabled).toBe(true);
  });

  it('renders Headquarters language and nonfunctional nail shop action', () => {
    renderArtistDistrict();
    expect(container.textContent).toContain('Headquarters');
    const action = buttonsByText('Open Your Nail Shop')[0];
    expect(action).not.toBeUndefined();
    expect(action.disabled).toBe(true);
    expect(container.textContent).not.toContain('Join Artist District');
  });

  it('renders all living community metrics exactly', () => {
    renderArtistDistrict();
    ['318 Looks Shared Today', 'Chrome Trending', '24 New Nail Shops This Week', '1,126 Designs Created Today'].forEach((metric) => {
      expect(container.textContent).toContain(metric);
    });
  });

  it('renders all section headings and preserves card counts', () => {
    renderArtistDistrict();
    [
      ['Featured Nail Shops', 'featured-nail-shops-cards', 3],
      ['Trending This Week', 'trending-this-week-cards', 3],
      ['New Artists', 'new-artists-cards', 3],
      ['Browse All Nail Shops', 'browse-all-nail-shops-cards', 6],
    ].forEach(([heading, testId, count]) => {
      expect(container.textContent).toContain(heading);
      expect(container.querySelector(`[data-testid="${testId}"]`).querySelectorAll('article')).toHaveLength(count);
    });
  });

  it('keeps Visit Shop buttons disabled and preserves Signature Nail and specialty tags', () => {
    renderArtistDistrict();
    buttonsByText('Visit Shop').forEach((button) => expect(button.disabled).toBe(true));
    expect(buttonsByText('Visit Shop')).toHaveLength(15);
    expect(container.textContent).toContain('Signature Nail™: Rose Quartz Veil');
    ['Sculpted Gel', 'Chrome Florals', 'Soft Glam'].forEach((tag) => expect(container.textContent).toContain(tag));
  });

  it('does not reference forbidden production or integration surfaces', () => {
    ['localStorage', 'sessionStorage', 'fetch', 'axios', '/api/', 'backend', 'server routes', '../App', '../NailShop', 'production navigation', 'booking', 'checkout', 'payments'].forEach((token) => expect(source).not.toContain(token));
  });
});
