import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import NailShopPublicShell, { approvedTabs, displayCards } from './NailShopPublicShell';

describe('NailShopPublicShell', () => {
  const markup = renderToStaticMarkup(<NailShopPublicShell />);

  it('renders the required isolated hero placeholders', () => {
    expect(markup).toContain('Nail Shop™ hero shell');
    expect(markup).toContain('Signature Nail™ area');
    expect(markup).toContain('Shop Name placeholder');
    expect(markup).toContain('Tagline placeholder');
    expect(markup).toContain('Location placeholder');
    expect(markup).toContain('Book this Artist');
    expect(markup).toContain('Shop Sets');
  });

  it('renders the display window with four placeholder cards', () => {
    expect(markup).toContain('Display Window™');
    expect(displayCards).toHaveLength(4);
    expect((markup.match(/Placeholder display card/g) || [])).toHaveLength(4);
  });

  it('renders only the approved tabs and polished empty content shell', () => {
    expect(approvedTabs).toEqual(['Overview', 'Services', 'Shop', 'Gallery', 'About']);
    approvedTabs.forEach((tab) => expect(markup).toContain(`>${tab}</button>`));
    expect(markup).toContain('Polished empty tab-content shell');
  });
});
