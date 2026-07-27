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
      <img className="artist-logo" src="/anitaset-logo-secondary.png" alt="AnitaSet secondary logo with Design, Price, Sell, Grow tagline" />
      <div className="artist-hero__scene">
        <div className="artist-hero__artwork">
          <img className="artist-hero__environment" src="/assets/anitaset/artist-district/hero/artist-district-hero.png" alt="Artist District creative neighborhood entrance" />
          <img className="artist-hero__fountain" src="/assets/anitaset/artist-district/landmarks/artist-district-fountain-v1.png" alt="Artist District fountain landmark" />
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
      </div>
      <button className="artist-open-shop" type="button" disabled>Open Your Nail Shop</button>
    </header>
  );
}
