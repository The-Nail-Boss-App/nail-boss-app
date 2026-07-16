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
      <p className="artist-hero__eyebrow">AnitaSet Creative Directory</p>
      <h1 id="artist-district-title">Artist District™</h1>
      <p className="artist-hero__tagline">{artistDistrictTagline}</p>
      <form className="artist-search" role="search" aria-label="Search Nail Shops">
        <label htmlFor="artist-district-search">Search Artist District</label>
        <input id="artist-district-search" type="search" placeholder="Search Nail Shops, artists, styles, or locations" />
      </form>
      <button className="artist-open-shop" type="button" disabled>Open Your Nail Shop</button>
    </header>
  );
}
