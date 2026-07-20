import { useMemo, useState } from 'react';
import './nail-shop-founder-seal.css';

const ASSET_ROOT = '/assets/anitaset/nail-shop';

const DISPLAY_LOOKS = [
  { id: 'window-01', src: `${ASSET_ROOT}/display-window/display-window-01.png`, title: 'Periwinkle After Dark', price: 'From $95', tag: 'Featured look' },
  { id: 'window-02', src: `${ASSET_ROOT}/display-window/display-window-02.png`, title: 'Electric Venom', price: 'From $110', tag: 'New drop' },
  { id: 'window-03', src: `${ASSET_ROOT}/display-window/display-window-03.png`, title: 'Black Rose Chrome', price: 'From $125', tag: 'Artist favorite' },
  { id: 'window-04', src: `${ASSET_ROOT}/display-window/display-window-04.png`, title: 'Luxe Signature Set', price: 'From $135', tag: 'Bookable' },
  { id: 'window-05', src: `${ASSET_ROOT}/display-window/display-window-05.png`, title: 'Purple Reign', price: 'From $120', tag: 'Limited edition' },
];

const ARTISTS = [
  { name: 'Jasmine', specialty: '3D luxury gel', src: `${ASSET_ROOT}/artist-collective/avatar-yellow.png` },
  { name: 'Ashley', specialty: 'Clean press-on architecture', src: `${ASSET_ROOT}/artist-collective/avatar-white.png` },
  { name: 'Bri', specialty: 'Royal-blue statement art', src: `${ASSET_ROOT}/artist-collective/avatar-royal-blue.png` },
  { name: 'Taylor', specialty: 'Hot-pink coffin sets', src: `${ASSET_ROOT}/artist-collective/avatar-hot-pink-coffin.png` },
  { name: 'Kayla', specialty: 'Green editorial art', src: `${ASSET_ROOT}/artist-collective/avatar-green.png` },
];

const SERVICES = [
  { name: 'Luxury Gel Full Set', price: 'From $85', time: '90–120 min', description: 'Sculpted gel extensions finished with editorial nail art and high-gloss detailing.' },
  { name: 'Custom Press-On Collection', price: 'From $75', time: '5–7 business days', description: 'Made-to-order press-ons designed around your sizing, style, and occasion.' },
  { name: '3D Art Appointment', price: 'From $125', time: '120–150 min', description: 'Dimensional chrome, chains, charms, crystals, and sculptural statement work.' },
  { name: 'Signature Freestyle', price: 'From $140', time: '150 min', description: 'Artist-led luxury set for clients who want the complete Luxe Nail Studio experience.' },
];

const SHOP_ITEMS = [
  { name: 'Luxe Press-On Drop', price: '$88', detail: '10-piece handcrafted set' },
  { name: 'Aftercare Ritual', price: '$32', detail: 'Cuticle oil + nail serum' },
  { name: 'Boss Babe Gift Set', price: '$65', detail: 'Press-ons, aftercare, and keepsake packaging' },
];

function ApprovedAsset({ src, alt, className = '', loading = 'lazy' }) {
  const [missing, setMissing] = useState(false);

  if (missing) {
    return (
      <div className={`lns-approved-asset-missing ${className}`} role="status">
        <span>Founder-approved asset pending upload</span>
        <small>{src.split('/').pop()}</small>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} loading={loading} onError={() => setMissing(true)} />;
}

function WindowCard({ look, onSelect }) {
  return (
    <article className="lns-window-card">
      <button type="button" className="lns-window-image-button" onClick={() => onSelect(look)} aria-label={`View ${look.title}`}>
        <ApprovedAsset src={look.src} alt={`${look.title} nail design`} className="lns-window-image" />
        <span className="lns-window-badge">{look.tag}</span>
      </button>
      <div className="lns-window-card-copy">
        <div>
          <h3>{look.title}</h3>
          <p>{look.price}</p>
        </div>
        <button type="button" onClick={() => onSelect(look)}>View look</button>
      </div>
    </article>
  );
}

function ArtistCard({ artist }) {
  return (
    <article className="lns-artist-card">
      <div className="lns-artist-avatar-shell">
        <ApprovedAsset src={artist.src} alt={`${artist.name} signature nail`} className="lns-artist-avatar" />
      </div>
      <h3>{artist.name}</h3>
      <p>{artist.specialty}</p>
      <button type="button">View artist</button>
    </article>
  );
}

export default function NailShopFounderSeal() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLook, setSelectedLook] = useState(null);
  const [notice, setNotice] = useState('');

  const tabs = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'services', label: 'Services' },
    { id: 'shop', label: 'Shop' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'about', label: 'About' },
  ], []);

  const announce = (message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };

  return (
    <main className="lns-room" data-testid="nail-shop-founder-seal">
      {notice ? <div className="lns-toast" role="status">{notice}</div> : null}

      <section className="lns-hero" aria-labelledby="lns-shop-name">
        <ApprovedAsset
          src={`${ASSET_ROOT}/banner/luxe-shop-banner.png`}
          alt="Luxe Nail Studio black, hot-pink, and chrome storefront banner"
          className="lns-hero-background"
          loading="eager"
        />
        <div className="lns-hero-scrim" />
        <div className="lns-hero-content">
          <div className="lns-signature-wrap" aria-label="Luxe Nail Studio Signature Nail">
            <ApprovedAsset
              src={`${ASSET_ROOT}/signature/luxe-signature-nail.png`}
              alt="Luxe Nail Studio Signature Nail"
              className="lns-signature-nail"
              loading="eager"
            />
          </div>
          <div className="lns-hero-copy">
            <span className="lns-eyebrow">AnitaSet Nail Shop™</span>
            <h1 id="lns-shop-name">Luxe Nail Studio</h1>
            <p className="lns-tagline">Art. Attitude. Perfection.</p>
            <p className="lns-location">Greensboro, North Carolina · Appointment + custom press-ons</p>
            <div className="lns-hero-actions">
              <button type="button" className="lns-button-primary" onClick={() => announce('Booking request shell opened.')}>Book this artist</button>
              <button type="button" className="lns-button-secondary" onClick={() => setActiveTab('shop')}>Shop sets</button>
              <button type="button" className="lns-button-quiet" onClick={() => announce('Luxe Nail Studio saved to your favorites.')}>♡ Follow</button>
            </div>
          </div>
        </div>
        <div className="lns-hero-facts" aria-label="Shop highlights">
          <span><strong>248</strong> looks created</span>
          <span><strong>4.9</strong> client rating</span>
          <span><strong>5</strong> artists</span>
          <span><strong>Custom</strong> nail art</span>
        </div>
      </section>

      <nav className="lns-tabs" aria-label="Nail Shop sections">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.id}
            className={activeTab === tab.id ? 'is-active' : ''}
            onClick={() => setActiveTab(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'overview' ? (
        <div className="lns-page-flow">
          <section className="lns-section lns-display-window" aria-labelledby="display-window-title">
            <div className="lns-section-heading">
              <div>
                <span className="lns-kicker">Now showing</span>
                <h2 id="display-window-title">Display Window™</h2>
                <p>Featured work selected from the Luxe Nail Studio collection.</p>
              </div>
              <button type="button" onClick={() => setActiveTab('gallery')}>See full gallery</button>
            </div>
            <div className="lns-window-grid">
              {DISPLAY_LOOKS.map((look) => <WindowCard key={look.id} look={look} onSelect={setSelectedLook} />)}
            </div>
          </section>

          <section className="lns-section lns-artist-collective" aria-labelledby="artist-collective-title">
            <div className="lns-section-heading">
              <div>
                <span className="lns-kicker">Meet the artists</span>
                <h2 id="artist-collective-title">Artist Collective</h2>
                <p>Each artist is represented by her Signature Nail, because the work is the identity.</p>
              </div>
            </div>
            <div className="lns-artist-grid">
              {ARTISTS.map((artist) => <ArtistCard key={artist.name} artist={artist} />)}
            </div>
          </section>

          <section className="lns-split-feature">
            <article className="lns-feature-card lns-feature-merch">
              <ApprovedAsset src={`${ASSET_ROOT}/merchandise/luxe-merchandise-preview.png`} alt="Luxe Nail Studio branded merchandise and aftercare" />
              <div>
                <span className="lns-kicker">The shop</span>
                <h2>Take Luxe home</h2>
                <p>Press-ons, aftercare, and branded essentials created to extend the studio experience.</p>
                <button type="button" onClick={() => setActiveTab('shop')}>Enter shop</button>
              </div>
            </article>
            <article className="lns-feature-card lns-feature-interior">
              <ApprovedAsset src={`${ASSET_ROOT}/interior/luxe-interior-preview.png`} alt="Dark luxury Luxe Nail Studio interior" />
              <div>
                <span className="lns-kicker">Inside the studio</span>
                <h2>Built different</h2>
                <p>A high-contrast boutique made for clients who treat nail art like fashion.</p>
                <button type="button" onClick={() => setActiveTab('about')}>Our story</button>
              </div>
            </article>
          </section>
        </div>
      ) : null}

      {activeTab === 'services' ? (
        <section className="lns-section lns-tab-panel" aria-labelledby="services-title">
          <div className="lns-section-heading">
            <div><span className="lns-kicker">Book your look</span><h2 id="services-title">Services</h2><p>Luxury service shells ready for future booking integration.</p></div>
          </div>
          <div className="lns-service-grid">
            {SERVICES.map((service) => (
              <article key={service.name} className="lns-service-card">
                <span>{service.time}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <div><strong>{service.price}</strong><button type="button" onClick={() => announce(`${service.name} request started.`)}>Request service</button></div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'shop' ? (
        <section className="lns-section lns-tab-panel" aria-labelledby="shop-title">
          <div className="lns-section-heading">
            <div><span className="lns-kicker">Luxe goods</span><h2 id="shop-title">Shop</h2><p>Curated press-ons, aftercare, and branded studio pieces.</p></div>
          </div>
          <div className="lns-shop-layout">
            <ApprovedAsset src={`${ASSET_ROOT}/merchandise/luxe-merchandise-preview.png`} alt="Luxe Nail Studio merchandise collection" className="lns-shop-hero-image" />
            <div className="lns-shop-items">
              {SHOP_ITEMS.map((item) => (
                <article key={item.name}>
                  <div><h3>{item.name}</h3><p>{item.detail}</p></div>
                  <strong>{item.price}</strong>
                  <button type="button" onClick={() => announce(`${item.name} added to demo cart.`)}>Add to bag</button>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'gallery' ? (
        <section className="lns-section lns-tab-panel" aria-labelledby="gallery-title">
          <div className="lns-section-heading">
            <div><span className="lns-kicker">The portfolio</span><h2 id="gallery-title">Gallery</h2><p>Every look can become a booking, product, proposal, or saved inspiration.</p></div>
          </div>
          <div className="lns-gallery-grid">
            {[...DISPLAY_LOOKS, ...DISPLAY_LOOKS.slice(0, 3)].map((look, index) => (
              <button type="button" key={`${look.id}-${index}`} onClick={() => setSelectedLook(look)}>
                <ApprovedAsset src={look.src} alt={look.title} />
                <span>{look.title}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {activeTab === 'about' ? (
        <section className="lns-section lns-tab-panel" aria-labelledby="about-title">
          <div className="lns-about-grid">
            <ApprovedAsset src={`${ASSET_ROOT}/interior/luxe-interior-preview.png`} alt="Luxe Nail Studio boutique interior" className="lns-about-image" />
            <div>
              <span className="lns-kicker">About Luxe</span>
              <h2 id="about-title">Nails speak louder than words.</h2>
              <p>Luxe Nail Studio is an edgy luxury nail boutique built around expressive design, technical precision, and the belief that a set should feel as considered as an editorial fashion look.</p>
              <p>Our artists specialize in sculptural gel, custom press-ons, chrome, dimensional embellishment, and dramatic statement work. Every appointment begins with the look, then turns that creative direction into a service clients can confidently book.</p>
              <dl>
                <div><dt>Location</dt><dd>Greensboro, North Carolina</dd></div>
                <div><dt>Appointments</dt><dd>Private booking requests</dd></div>
                <div><dt>Press-ons</dt><dd>Ships throughout the United States</dd></div>
              </dl>
            </div>
          </div>
        </section>
      ) : null}

      {selectedLook ? (
        <div className="lns-modal-backdrop" role="presentation" onMouseDown={() => setSelectedLook(null)}>
          <section className="lns-look-modal" role="dialog" aria-modal="true" aria-labelledby="selected-look-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="lns-modal-close" onClick={() => setSelectedLook(null)} aria-label="Close look details">×</button>
            <ApprovedAsset src={selectedLook.src} alt={selectedLook.title} className="lns-modal-image" loading="eager" />
            <div className="lns-modal-copy">
              <span className="lns-kicker">{selectedLook.tag}</span>
              <h2 id="selected-look-title">{selectedLook.title}</h2>
              <p>{selectedLook.price} · Custom colors and sizing available.</p>
              <div>
                <button type="button" className="lns-button-primary" onClick={() => announce('Look added to booking request.')}>Book this look</button>
                <button type="button" className="lns-button-secondary" onClick={() => announce('Look saved to your Look Book.')}>Save to Look Book</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
