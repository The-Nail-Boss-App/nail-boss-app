import React from 'react';
import SignatureNail from './SignatureNail';
import PublicTabs from './PublicTabs';
import { nailShopPublicMediaStyles, nailShopPublicStyles as styles } from './nailShopPublicStyles';

const DEFAULT_SHOP_NAME = 'Shop Name Placeholder';
const DEFAULT_TAGLINE = 'Tagline placeholder for an editorial Nail Shop™ presence.';
const DEFAULT_LOCATION = 'Location Placeholder';

const displayCards = ['Velvet Plum Set', 'Black Cherry Gloss', 'Cream Rose Marble', 'Soft Gold Detail'];

export function NailShopPublicShell({
  shopName = DEFAULT_SHOP_NAME,
  tagline = DEFAULT_TAGLINE,
  location = DEFAULT_LOCATION,
}) {
  return (
    <main style={styles.page} aria-label="Nail Shop public shell">
      <style>{nailShopPublicMediaStyles}</style>
      <div style={styles.shell} className="nail-shop-public-shell">
        <section style={styles.hero} className="nail-shop-public-hero" aria-labelledby="nail-shop-public-title">
          <div style={styles.signatureWrap}>
            <SignatureNail />
          </div>

          <div style={styles.heroCopy}>
            <p style={styles.eyebrow}>Nail Shop™</p>
            <h1 id="nail-shop-public-title" style={styles.title}>{shopName}</h1>
            <p style={styles.tagline}>{tagline}</p>
            <p style={styles.location}>{location}</p>
            <div style={styles.actions} aria-label="Public shop placeholder actions">
              <button type="button" style={styles.primaryButton}>Book this Artist</button>
              <button type="button" style={styles.secondaryButton}>Shop Sets</button>
            </div>
          </div>
        </section>

        <section style={styles.panel} className="nail-shop-public-panel" aria-labelledby="display-window-title">
          <h2 id="display-window-title" style={styles.sectionTitle}>Display Window™</h2>
          <div style={styles.displayGrid}>
            {displayCards.map((name) => (
              <article key={name} style={styles.card}>
                <div style={styles.visual} aria-label={`${name} visual placeholder`} />
                <h3 style={styles.cardTitle}>{name}</h3>
                <button type="button" style={styles.disabledAction} disabled>Preview coming soon</button>
              </article>
            ))}
          </div>
        </section>

        <PublicTabs />

        <section style={{ ...styles.panel, ...styles.tabContent }} className="nail-shop-public-panel" aria-label="Selected Nail Shop tab content">
          <p>Polished public tab content placeholder.</p>
        </section>
      </div>
    </main>
  );
}

export default NailShopPublicShell;
