import React, { useMemo, useState } from 'react';
import ShopHeader from './ShopHeader';
import DisplayWindow from './DisplayWindow';
import PublicTabs from './PublicTabs';
import { mockPublicShop } from './mockPublicShop';
import { nailShopPublicMediaStyles, nailShopPublicStyles as styles } from './nailShopPublicStyles';

const BASE_TABS = ['Home', 'Services', 'Gallery', 'Shop', 'About', 'Reviews'];

export function buildPublicTabs() {
  return BASE_TABS;
}

function ArtistCollective({ artists = [] }) {
  return (
    <section style={styles.artistPreview} className="nail-shop-public-panel" aria-labelledby="artist-collective-title">
      <div style={styles.sectionHeaderCompact}>
        <div>
          <p style={styles.eyebrow}>Artist Collective</p>
          <h2 id="artist-collective-title" style={styles.panelTitle}>Nail-design avatars only.</h2>
        </div>
        <button type="button" style={styles.secondaryButton}>View All Artists</button>
      </div>
      <div style={styles.artistGrid} className="artist-collective-row">
        {artists.map((artist) => (
          <article key={artist.id} style={styles.artistCard}>
            <img src={artist.image} alt={`${artist.name} nail design avatar`} loading="lazy" decoding="async" style={styles.artistAvatar} />
            <h3 style={styles.artistName}>{artist.name}</h3>
            <p style={styles.artistSpecialty}>{artist.specialty}</p>
            <span style={styles.statusPill}>{artist.status}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function TabPanel({ tab, shop }) {
  const panelId = `public-tab-panel-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const labelledBy = `public-tab-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  return (
    <section id={panelId} role="tabpanel" tabIndex={0} aria-labelledby={labelledBy} style={{ ...styles.panel, ...styles.tabContent }} className="nail-shop-public-panel">
      {tab === 'Home' ? (
        <>
          <p style={styles.eyebrow}>Storefront home</p>
          <h2 style={styles.panelTitle}>{shop.tagline}</h2>
          <p style={styles.panelCopy}>{shop.bio}</p>
          <div style={styles.inlineActions}>
            <button type="button" style={styles.primaryButton}>Book This Shop</button>
            <button type="button" style={styles.secondaryButton}>Message Shop</button>
          </div>
        </>
      ) : null}

      {tab === 'Gallery' ? (
        <>
          <p style={styles.eyebrow}>Gallery</p>
          <h2 style={styles.panelTitle}>Fresh looks from the Luxe window.</h2>
          <div style={styles.galleryGrid}>
            {shop.gallery.map((look, index) => (
              <article key={look.id} style={styles.galleryCard}>
                <img src={look.image} alt={`${look.title} approved Nail Shop gallery look`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" style={styles.galleryImage} />
                <h3 style={styles.cardTitle}>{look.title}</h3>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'Services' ? (
        <>
          <p style={styles.eyebrow}>Services</p>
          <h2 style={styles.panelTitle}>High-gloss services, clearly priced.</h2>
          <div style={styles.serviceGrid}>
            {shop.services.map((service) => (
              <article key={service.title} style={styles.serviceCard}>
                <h3 style={styles.cardTitle}>{service.title}</h3>
                <p style={styles.price}>{service.price}</p>
                <p style={styles.panelCopy}>{service.duration}</p>
                <button type="button" style={styles.primaryButton}>Book This Shop</button>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {tab === 'Shop' ? (
        <>
          <p style={styles.eyebrow}>Shop</p>
          <h2 style={styles.panelTitle}>Press-ons, care, and chrome details.</h2>
          <article style={styles.shopFeature}>
            <img src={shop.merchandiseImage} alt="Approved Nail Shop merchandise preview" loading="lazy" decoding="async" style={styles.shopImage} />
            <div>
              <h3 style={styles.cardTitle}>Curated boutique shelf</h3>
              <p style={styles.panelCopy}>Customer-ready sets and nail-care essentials styled for the Luxe Nail Studio storefront.</p>
              <button type="button" style={styles.secondaryButton}>Save Boutique Shelf</button>
            </div>
          </article>
        </>
      ) : null}

      {tab === 'About' ? (
        <>
          <p style={styles.eyebrow}>About</p>
          <h2 style={styles.panelTitle}>Atlanta polish with black-cherry edge.</h2>
          <article style={styles.aboutFeature}>
            <img src={shop.interiorImage} alt="Approved luxury Nail Shop interior preview" loading="lazy" decoding="async" style={styles.shopImage} />
            <div>
              <p style={styles.panelCopy}>{shop.brandStory}</p>
              <p style={styles.location}>Location · {shop.location}</p>
              <p style={styles.panelCopy}>Policies: appointment-first booking, design deposits, and careful set preparation before every visit.</p>
            </div>
          </article>
        </>
      ) : null}

      {tab === 'Reviews' ? (
        <>
          <p style={styles.eyebrow}>Reviews</p>
          <h2 style={styles.panelTitle}><span style={styles.stars}>★★★★★</span> {shop.rating} · {shop.reviewCount}</h2>
          <div style={styles.reviewGrid}>
            {shop.reviews.map((review) => (
              <article key={review.id} style={styles.reviewCard}>
                <strong>{review.rating} ★ · {review.name}</strong>
                <p style={styles.panelCopy}>{review.copy}</p>
              </article>
            ))}
          </div>
          <div style={styles.inlineActions}>
            <button type="button" style={styles.iconButton} aria-label="Save Luxe Nail Studio from reviews">♡</button>
            <button type="button" style={styles.iconButton} aria-label="Share Luxe Nail Studio from reviews">↗</button>
          </div>
        </>
      ) : null}
    </section>
  );
}

export function NailShopPublicShell({ shop = mockPublicShop, specialtyTags }) {
  const resolvedShop = { ...mockPublicShop, ...shop, specialtyTags: specialtyTags || shop.specialtyTags || mockPublicShop.specialtyTags };
  const tabs = useMemo(() => buildPublicTabs(), []);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <main style={styles.page} aria-label="Nail Shop public shell">
      <style>{nailShopPublicMediaStyles}</style>
      <div style={styles.shell} className="nail-shop-public-shell">
        <ShopHeader shop={resolvedShop} />
        <DisplayWindow items={resolvedShop.featuredDisplayItems} />
        <ArtistCollective artists={resolvedShop.artists} />
        <PublicTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabPanel tab={activeTab} shop={resolvedShop} />
      </div>
    </main>
  );
}

export default NailShopPublicShell;
