import React from 'react';
import ArtistDistrictPlaceholderCard from './ArtistDistrictPlaceholderCard';
import { artistDistrictStyles as styles } from './artistDistrictStyles';

export default function ArtistDistrictSection({ id, title, shops }) {
  const headingId = `${id}-heading`;
  return (
    <section style={styles.section} aria-labelledby={headingId} data-section-id={id}>
      <h2 id={headingId} style={styles.sectionTitle}>{title}</h2>
      <div style={styles.grid}>
        {shops.map((shop) => <ArtistDistrictPlaceholderCard key={shop.name} shop={shop} />)}
      </div>
    </section>
  );
}
