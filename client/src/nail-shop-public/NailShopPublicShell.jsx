import React from 'react';
import SignatureNail from './SignatureNail';
import DisplayWindow from './DisplayWindow';
import { nailShopPublicMediaStyles, nailShopPublicStyles as styles } from './nailShopPublicStyles';

const DEFAULT_SHOP_NAME = 'Shop Name Placeholder';
const DEFAULT_TAGLINE = 'Tagline placeholder for an editorial Nail Shop™ presence.';
const DEFAULT_LOCATION = 'Location Placeholder';

const tabs = ['Overview', 'Services', 'Shop', 'Gallery', 'About'];

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

        <DisplayWindow />

        <nav style={styles.tabs} aria-label="Public Nail Shop sections">
          {tabs.map((tab) => (
            <button key={tab} type="button" style={styles.tab}>{tab}</button>
          ))}
        </nav>

        <section style={{ ...styles.panel, ...styles.tabContent }} className="nail-shop-public-panel" aria-label="Selected Nail Shop tab content">
          <p>Polished public tab content placeholder.</p>
        </section>
      </div>
    </main>
  );
}

export default NailShopPublicShell;
