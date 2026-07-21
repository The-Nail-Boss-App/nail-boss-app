import React from 'react';
import SignatureNail from './SignatureNail';
import { nailShopPublicStyles as styles } from './nailShopPublicStyles';

export function ShopHeader({ shop }) {
  const tags = Array.isArray(shop?.specialtyTags) ? shop.specialtyTags : [];

  return (
    <section style={styles.hero} className="nail-shop-public-hero" aria-labelledby="nail-shop-public-title">
      {shop?.bannerImage ? <img src={shop.bannerImage} alt="Approved Nail Shop luxury storefront banner" loading="eager" decoding="async" style={styles.heroBanner} /> : null}
      <div style={styles.heroOverlay} aria-hidden="true" />
      <div style={styles.signatureWrap}>
        <SignatureNail design={shop?.signatureNail} />
      </div>

      <div style={styles.heroCopy}>
        <p style={styles.eyebrow}>Nail Shop™</p>
        <h1 id="nail-shop-public-title" style={styles.title}>{shop?.shopName}</h1>
        <p style={styles.tagline}>{shop?.tagline}</p>
        <p style={styles.location}>{shop?.location}</p>
        <ul style={styles.tagList} aria-label="Nail Shop specialties">
          {tags.map((tag) => <li key={tag} style={styles.tag}>{tag}</li>)}
        </ul>
        <div style={styles.actions} aria-label="Public shop actions">
          <button type="button" style={styles.primaryButton} disabled aria-label="Book This Artist preview action">Book This Artist</button>
          <button type="button" style={styles.secondaryButton} disabled aria-label="Shop Sets preview action">Shop Sets</button>
        </div>
      </div>
    </section>
  );
}

export default ShopHeader;
