import React from 'react';
import SignatureNail from './SignatureNail';
import { nailShopPublicStyles as styles } from './nailShopPublicStyles';

export function ShopHeader({ shop }) {
  const tags = Array.isArray(shop?.specialtyTags) ? shop.specialtyTags : [];

  return (
    <section style={styles.hero} className="nail-shop-public-hero" aria-labelledby="nail-shop-public-title">
      {shop?.bannerImage ? <img src={shop.bannerImage} alt="Approved Luxe Nail Studio storefront banner" loading="eager" decoding="async" style={styles.heroBanner} /> : null}
      <div style={styles.heroOverlay} aria-hidden="true" />
      <div style={styles.signatureWrap}>
        <SignatureNail design={shop?.signatureNail} size={170} />
      </div>

      <div style={styles.heroCopy}>
        <p style={styles.eyebrow}>Public Nail Shop</p>
        <h1 id="nail-shop-public-title" style={styles.title}>{shop?.shopName}</h1>
        <p style={styles.location}>{shop?.location}</p>
        <div style={styles.ratingRow} aria-label={`${shop?.rating} out of 5 stars from ${shop?.reviewCount}`}>
          <span style={styles.stars} aria-hidden="true">★★★★★</span>
          <strong>{shop?.rating}</strong>
          <span>{shop?.reviewCount}</span>
        </div>
        <p style={styles.tagline}>{shop?.tagline}</p>
        <ul style={styles.tagList} aria-label="Nail Shop specialties">
          {tags.map((tag) => <li key={tag} style={styles.tag}>{tag}</li>)}
        </ul>
        <div style={styles.actions} aria-label="Public shop actions">
          <button type="button" style={styles.primaryButton}>Book This Shop</button>
          <button type="button" style={styles.secondaryButton}>Message Shop</button>
          <button type="button" style={styles.iconButton} aria-label="Save Luxe Nail Studio">♡</button>
          <button type="button" style={styles.iconButton} aria-label="Share Luxe Nail Studio">↗</button>
        </div>
      </div>
    </section>
  );
}

export default ShopHeader;
