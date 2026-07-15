import React from 'react';
import { artistDistrictStyles as styles } from './artistDistrictStyles';

export default function ArtistDistrictHeader() {
  return (
    <header style={styles.header}>
      <p style={styles.eyebrow}>AnitaSet Creative Directory</p>
      <h1 id="artist-district-title" style={styles.title}>Artist District™</h1>
      <p style={styles.tagline}>Discover incredible Nail Shops from creators around the world.</p>
      <div style={styles.searchWrap}>
        <label htmlFor="artist-district-search" style={styles.label}>Search Artist District™</label>
        <input id="artist-district-search" style={styles.search} placeholder="Search Nail Shops, artists, styles, or locations" aria-label="Search Nail Shops, artists, styles, or locations" />
      </div>
    </header>
  );
}
