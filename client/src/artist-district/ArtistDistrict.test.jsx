import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fs from 'fs';
import path from 'path';
import ArtistDistrict from './ArtistDistrict';
import ArtistDistrictSpotlight from './ArtistDistrictSpotlight';
import { artistDistrictTagline } from './artistDistrictData';
import { summerChromeCampaign } from './spotlightCampaigns';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const source = ['ArtistDistrict.jsx', 'ArtistDistrictHeader.jsx', 'ArtistDistrictSpotlight.jsx', 'ArtistDistrictSection.jsx', 'ArtistDistrictPlaceholderCard.jsx', 'artistDistrictData.js', 'spotlightCampaigns.js']
  .map((file) => fs.readFileSync(path.join(__dirname, file), 'utf8')).join('\n');

let container; let root;
function renderArtistDistrict() { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<ArtistDistrict />)); }
function renderSpotlight(campaign) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<ArtistDistrictSpotlight campaign={campaign} />)); }
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

  it('leaves the official AnitaSet logo to the shared application shell', () => {
    renderArtistDistrict();
    expect(container.querySelector('.artist-logo')).toBeNull();
    expect(source).not.toContain('/anitaset-logo-secondary.png');
  });

  it('renders only the approved hero environment with an accessible description', () => {
    renderArtistDistrict();
    const environment = container.querySelector('.artist-hero__environment');
    expect(environment.getAttribute('src')).toBe('/assets/anitaset/artist-district/hero/artist-district-hero.png');
    expect(environment.getAttribute('alt')).toBe('Sunset view of the Artist District creative neighborhood, nail boutiques, and central fountain');
    expect(container.querySelector('.artist-hero__artwork').querySelectorAll('img')).toHaveLength(1);
    expect(container.querySelector('.artist-hero__fountain')).toBeNull();
    expect(container.querySelector(`.artist-hero img[src="/assets/anitaset/artist-district/landmarks/artist-district-fountain-v1.png"]`)).toBeNull();
    expect(container.querySelectorAll('.artist-hero__environment')).toHaveLength(1);
  });

  it('renders the Summer Chrome Week Spotlight from live campaign content', () => {
    renderArtistDistrict();
    const spotlight = container.querySelector('.artist-spotlight[data-campaign-status="active"]');
    expect(spotlight).not.toBeNull();
    expect(spotlight.textContent).toContain('LIVE NOW');
    ['SUMMER', 'CHROME', 'Week'].forEach((part) => expect(spotlight.textContent).toContain(part));
    expect(spotlight.querySelectorAll('.artist-spotlight__title-part')).toHaveLength(3);
    expect(spotlight.querySelectorAll('.artist-spotlight__metric')).toHaveLength(4);
    expect(spotlight.textContent).toContain('Featured Artists18');
    const action = spotlight.querySelector('.artist-spotlight__cta');
    expect(action.tagName).toBe('SPAN');
    expect(action.getAttribute('href')).toBeNull();
    expect(action.getAttribute('aria-disabled')).toBe('true');
    expect(action.textContent).toContain('Explore Chrome');
    expect(action.textContent).toContain('Coming Soon');
    const artwork = spotlight.querySelector('.artist-spotlight__artwork img');
    expect(artwork.getAttribute('src')).toBe('/assets/anitaset/artist-district/spotlight/summer-chrome-week.png');
    expect(artwork.getAttribute('alt')).toContain('chrome nail designs');
    expect(artwork.getAttribute('loading')).toBe('lazy');
    expect(artwork.getAttribute('decoding')).toBe('async');
    expect(source).not.toContain('summer-chrome-week-reference.png');
  });

  it('renders an enabled campaign CTA as a valid link', () => {
    renderSpotlight({
      ...summerChromeCampaign,
      id: 'future-enabled-campaign',
      cta: {
        label: 'Explore Campaign',
        enabled: true,
        href: '/artist-district/campaigns/future',
        ariaLabel: 'Explore future campaign',
      },
    });
    const action = container.querySelector('a.artist-spotlight__cta');
    expect(action.getAttribute('href')).toBe('/artist-district/campaigns/future');
    expect(action.getAttribute('aria-disabled')).toBeNull();
    expect(action.textContent).toContain('Explore Campaign');
  });

  it('renders Headquarters language and nonfunctional nail shop action', () => {
    renderArtistDistrict();
    expect(container.textContent).toContain('Headquarters');
    const action = buttonsByText('Open Your Nail Shop')[0];
    expect(action).not.toBeUndefined();
    expect(action.disabled).toBe(true);
    expect(container.textContent).not.toContain('Join Artist District');
    expect(container.textContent).toContain('Ready to be seen?');
    expect(container.querySelectorAll('.artist-hero nav')).toHaveLength(1);
    expect(container.querySelector('.artist-hero__taskbar, .artist-hero__dock, .artist-hero__image-controls')).toBeNull();
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
