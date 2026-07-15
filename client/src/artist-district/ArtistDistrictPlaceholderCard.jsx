import React from 'react';
import { artistDistrictStyles as styles } from './artistDistrictStyles';

export default function ArtistDistrictPlaceholderCard({ shop }) {
  return (
    <article style={styles.card} data-artist-district-card="true">
      <div style={styles.banner} aria-label={`${shop.name} banner-style visual`} role="img" />
      <div style={styles.signature} aria-label={`${shop.name} Signature Nail™ visual`} role="img" />
      <div style={styles.body}>
        <h3 style={styles.name}>{shop.name}</h3>
        <p style={styles.location}>{shop.location}</p>
        <div style={styles.tags} aria-label={`${shop.name} specialties`}>
          {shop.tags.map((tag) => <span key={tag} style={styles.tag}>{tag}</span>)}
        </div>
        <div style={styles.window} aria-label={`${shop.name} mini Display Window™ area`}>
          <strong>Display Window™</strong>
          <p>{shop.window}</p>
        </div>
        <button type="button" style={styles.button} disabled>Visit Shop</button>
      </div>
    </article>
  );
}
