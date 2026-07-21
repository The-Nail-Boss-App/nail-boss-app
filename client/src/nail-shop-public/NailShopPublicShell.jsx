import React, { useMemo, useState } from 'react';
import ShopHeader from './ShopHeader';
import DisplayWindow from './DisplayWindow';
import PublicTabs from './PublicTabs';
import { mockPublicShop } from './mockPublicShop';
import { nailShopPublicMediaStyles, nailShopPublicStyles as styles } from './nailShopPublicStyles';

const BASE_TABS = ['Overview', 'Gallery', 'Services', 'Shop', 'About'];

export function buildPublicTabs(hasMultipleArtists) {
  return hasMultipleArtists ? [...BASE_TABS, 'Artists'] : BASE_TABS;
}

function TabPanel({ tab, shop }) {
  const panelId = `public-tab-panel-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const labelledBy = `public-tab-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section id={panelId} role="tabpanel" tabIndex={0} aria-labelledby={labelledBy} style={{ ...styles.panel, ...styles.tabContent }} className="nail-shop-public-panel">
      {tab === 'Overview' ? (
        <>
          <p style={styles.eyebrow}>Shop overview</p>
          <h2 style={styles.panelTitle}>A boutique built around {shop.shopName}’s aesthetic.</h2>
          <p style={styles.panelCopy}>{shop.bio}</p>
          <ul style={styles.featureList} aria-label="Shop aesthetic highlights">
            {shop.specialtyTags.map((tag) => <li key={tag} style={styles.featurePill}>{tag}</li>)}
          </ul>
        </>
      ) : null}

      {tab === 'Gallery' ? (
        <>
          <p style={styles.eyebrow}>Gallery</p>
          <h2 style={styles.panelTitle}>Editorial looks ready for the Look Book.</h2>
          <div style={styles.galleryGrid}>
            {shop.gallery.map((look, index) => (
              <article key={look.id} style={styles.galleryCard}>
                <img src={look.image} alt={`${look.title} approved Nail Shop gallery look`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" style={styles.galleryImage} />
                <h3 style={styles.cardTitle}>{look.title}</h3>
                <div style={styles.inlineActions}>
                  <button type="button" style={styles.mockAction}>Book This Look</button>
                  <button type="button" style={styles.mockAction}>Buy This Set</button>
                  <button type="button" style={styles.mockAction}>Save to Look Book</button>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'Services' ? (
        <>
          <p style={styles.eyebrow}>Services</p>
          <h2 style={styles.panelTitle}>Luxury service cards with space to breathe.</h2>
          <div style={styles.serviceGrid}>
            {shop.services.map((service) => (
              <article key={service.title} style={styles.serviceCard}>
                <h3 style={styles.cardTitle}>{service.title}</h3>
                <p style={styles.price}>{service.price}</p>
                <p style={styles.panelCopy}>{service.duration}</p>
                <button type="button" style={styles.primaryButton}>Request Appointment</button>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'Shop' ? (
        <>
          <p style={styles.eyebrow}>Shop</p>
          <h2 style={styles.panelTitle}>Premium merchandise preview.</h2>
          <article style={styles.shopFeature}>
            <img src={shop.merchandiseImage} alt="Approved Nail Shop merchandise preview" loading="lazy" decoding="async" style={styles.shopImage} />
            <div>
              <h3 style={styles.cardTitle}>Curated boutique shelf</h3>
              <p style={styles.panelCopy}>A premium product moment for sets, care items, and artist-approved essentials.</p>
              <button type="button" style={styles.secondaryButton}>View Boutique Shelf</button>
            </div>
          </article>
        </>
      ) : null}

      {tab === 'About' ? (
        <>
          <p style={styles.eyebrow}>About</p>
          <h2 style={styles.panelTitle}>Story, policies, and location.</h2>
          <article style={styles.aboutFeature}>
            <img src={shop.interiorImage} alt="Approved luxury Nail Shop interior preview" loading="lazy" decoding="async" style={styles.shopImage} />
            <div>
              <p style={styles.panelCopy}>{shop.brandStory}</p>
              <p style={styles.location}>Location · {shop.location}</p>
              <p style={styles.panelCopy}>Policies: appointment-first, design deposits, and careful set preparation before every visit.</p>
            </div>
          </article>
        </>
      ) : null}

      {tab === 'Artists' ? (
        <>
          <p style={styles.eyebrow}>Artist Collective</p>
          <h2 style={styles.panelTitle}>Artist identity is their work.</h2>
          <div style={styles.artistGrid}>
            {shop.artists.map((artist) => (
              <article key={artist.id} style={styles.artistCard}>
                <img src={artist.image} alt={`${artist.name} nail design avatar`} loading="lazy" decoding="async" style={styles.artistAvatar} />
                <h3 style={styles.cardTitle}>{artist.name}</h3>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

export function NailShopPublicShell({ shop = mockPublicShop, specialtyTags }) {
  const resolvedShop = { ...mockPublicShop, ...shop, specialtyTags: specialtyTags || shop.specialtyTags || mockPublicShop.specialtyTags };
  const tabs = useMemo(() => buildPublicTabs(Boolean(resolvedShop.hasMultipleArtists)), [resolvedShop.hasMultipleArtists]);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <main style={styles.page} aria-label="Nail Shop public shell">
      <style>{nailShopPublicMediaStyles}</style>
      <div style={styles.shell} className="nail-shop-public-shell">
        <ShopHeader shop={resolvedShop} />
        <DisplayWindow items={resolvedShop.featuredDisplayItems} />
        <PublicTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabPanel tab={activeTab} shop={resolvedShop} />
      </div>
    </main>
  );
}

export default NailShopPublicShell;
