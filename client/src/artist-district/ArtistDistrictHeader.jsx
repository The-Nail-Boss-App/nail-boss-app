import React from 'react';
import { artistDistrictTagline } from './artistDistrictData';

export default function ArtistDistrictHeader() {
  return (
    <header className="artist-hero">
      <nav className="artist-crumb" aria-label="Artist District location">
        <span aria-hidden="true">⌂</span>
        <span>Headquarters</span>
        <span aria-hidden="true">/</span>
        <span>Artist District™</span>
      </nav>
      <div className="artist-hero__scene">
        <div className="artist-hero__artwork">
          <img className="artist-hero__environment" src="/assets/anitaset/artist-district/hero/artist-district-hero.png" alt="Sunset view of the Artist District creative neighborhood, nail boutiques, and central fountain" />
        </div>
        <div className="artist-hero__copy">
          <p className="artist-hero__eyebrow">AnitaSet Creative Directory</p>
          <h1 id="artist-district-title">Artist District™</h1>
          <p className="artist-hero__tagline">{artistDistrictTagline}</p>
          <form className="artist-search" role="search" aria-label="Search Nail Shops">
            <label htmlFor="artist-district-search">Search Artist District</label>
            <input id="artist-district-search" type="search" placeholder="Search Nail Shops, artists, styles, or locations" />
          </form>
        </div>
        <div className="artist-hero__shop-prompt">
          <p>Ready to be seen?</p>
          <button className="artist-open-shop" type="button" disabled>Open Your Nail Shop</button>
        </div>
      </div>
    </header>
  );
}
