import React from 'react';
import { nailShopPublicStyles } from './nailShopPublicStyles';

const approvedTabs = ['Overview', 'Services', 'Shop', 'Gallery', 'About'];
const displayCards = ['Signature shape', 'Seasonal story', 'Luxury detail', 'Artist favorite'];

export default function NailShopPublicShell() {
  return (
    <main className="nail-shop-public-shell" aria-label="Nail Shop public shell preview">
      <style>{nailShopPublicStyles}</style>
      <div className="nail-shop-public-shell__frame">
        <section className="nail-shop-public-shell__hero" aria-labelledby="nail-shop-public-title">
          <div>
            <p className="nail-shop-public-shell__eyebrow">Nail Shop™ hero shell</p>
            <h1 id="nail-shop-public-title" className="nail-shop-public-shell__title">Shop Name placeholder</h1>
            <p className="nail-shop-public-shell__tagline">Tagline placeholder for a warm luxury nail artist storefront with editorial polish and a premium booking pathway.</p>
            <p className="nail-shop-public-shell__location">Location placeholder</p>
            <div className="nail-shop-public-shell__actions" aria-label="Placeholder shop actions">
              <button className="nail-shop-public-shell__button nail-shop-public-shell__button--primary" type="button">Book this Artist</button>
              <button className="nail-shop-public-shell__button nail-shop-public-shell__button--secondary" type="button">Shop Sets</button>
            </div>
          </div>
          <aside className="nail-shop-public-shell__signature" aria-label="Signature Nail placeholder area">
            <span className="nail-shop-public-shell__placeholder">Signature Nail™ area</span>
            <div className="nail-shop-public-shell__nail" aria-hidden="true" />
            <strong>Placeholder hero artwork</strong>
          </aside>
        </section>

        <section className="nail-shop-public-shell__display" aria-labelledby="display-window-title">
          <h2 id="display-window-title" className="nail-shop-public-shell__section-title">Display Window™</h2>
          <div className="nail-shop-public-shell__cards">
            {displayCards.map((card) => (
              <article className="nail-shop-public-shell__card" key={card}>
                <div className="nail-shop-public-shell__card-orb" aria-hidden="true" />
                <h3>{card}</h3>
                <p>Placeholder display card</p>
              </article>
            ))}
          </div>
        </section>

        <nav className="nail-shop-public-shell__tabs" aria-label="Approved Nail Shop tabs">
          {approvedTabs.map((tab) => <button className="nail-shop-public-shell__tab" type="button" key={tab}>{tab}</button>)}
        </nav>

        <section className="nail-shop-public-shell__panel" aria-label="Empty tab content shell">
          <p className="nail-shop-public-shell__eyebrow">Polished empty tab-content shell</p>
          <div className="nail-shop-public-shell__panel-grid">
            <div>
              <div className="nail-shop-public-shell__line" />
              <div className="nail-shop-public-shell__line" />
              <div className="nail-shop-public-shell__line nail-shop-public-shell__line--short" />
            </div>
            <div className="nail-shop-public-shell__card">
              <div className="nail-shop-public-shell__line" />
              <div className="nail-shop-public-shell__line nail-shop-public-shell__line--short" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export { approvedTabs, displayCards };
