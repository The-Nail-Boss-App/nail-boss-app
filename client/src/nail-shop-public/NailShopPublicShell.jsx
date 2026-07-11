import React from "react";
import { nailShopPublicCss } from "./nailShopPublicStyles";

const PUBLIC_TABS = ["Overview", "Services", "Shop", "Gallery", "About"];
const DISPLAY_CARDS = ["Signature Set Placeholder", "Rose Marble Placeholder", "Soft Gold Placeholder", "Black Cherry Placeholder"];

export function NailShopPublicShell({
  shopName = "Shop Name Placeholder",
  tagline = "Tagline placeholder for an editorial public Nail Shop™ experience.",
  location = "Location Placeholder",
}) {
  return (
    <section className="nail-shop-public-shell" aria-label="Nail Shop public page shell">
      <style>{nailShopPublicCss}</style>
      <div className="nsp-frame">
        <header className="nsp-hero">
          <div className="nsp-signature-placeholder" aria-label="Future Signature Nail placeholder">
            <span>Future Signature Nail™</span>
          </div>
          <div className="nsp-hero-copy">
            <p className="nsp-kicker">Nail Shop™ public-page container</p>
            <h1 className="nsp-title">{shopName}</h1>
            <p className="nsp-tagline">{tagline}</p>
            <p className="nsp-location">{location}</p>
            <div className="nsp-actions" aria-label="Hero placeholder actions">
              <button className="nsp-button" type="button">Book this Artist</button>
              <button className="nsp-button secondary" type="button">Shop Sets</button>
            </div>
          </div>
        </header>

        <section className="nsp-card" aria-labelledby="display-window-title">
          <p className="nsp-kicker">Curated public showcase</p>
          <h2 className="nsp-section-title" id="display-window-title">Display Window™</h2>
          <div className="nsp-display-grid">
            {DISPLAY_CARDS.map((name) => (
              <article className="nsp-display-card" key={name}>
                <div className="nsp-visual-placeholder" aria-hidden="true" />
                <p className="nsp-design-name">{name}</p>
                <div className="nsp-disabled-actions" aria-label="Disabled placeholder actions">
                  <button type="button" disabled>View</button>
                  <button type="button" disabled>Save</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <nav className="nsp-tabs" aria-label="Public Nail Shop navigation placeholders">
          {PUBLIC_TABS.map((tab) => (
            <button className="nsp-tab" type="button" key={tab}>{tab}</button>
          ))}
        </nav>

        <section className="nsp-card" aria-label="Empty public tab content shell">
          <p className="nsp-empty">Polished public tab content shell. Future overview, services, shop, gallery, and about content will appear here without connecting to live business data.</p>
        </section>
      </div>
    </section>
  );
}

export default NailShopPublicShell;
