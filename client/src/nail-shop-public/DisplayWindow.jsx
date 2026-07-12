import React from 'react';
import { displayWindowMediaStyles, displayWindowStyles as styles } from './displayWindowStyles';

export const defaultDisplayWindowItems = [
  {
    id: 'velvet-plum-set',
    name: 'Velvet Plum Set',
    category: 'Deep Plum Editorial',
    priceLabel: 'From $68',
    badge: 'Featured',
    accent: '#6e123f',
    description: 'A rich plum showcase with soft gold glints and boutique evening drama.',
  },
  {
    id: 'black-cherry-gloss',
    name: 'Black Cherry Gloss',
    category: 'Black Cherry Shine',
    priceLabel: 'From $72',
    badge: 'Signature',
    accent: '#8f1b4b',
    description: 'High-gloss cherry depth styled for a polished luxury window moment.',
  },
  {
    id: 'cream-rose-marble',
    name: 'Cream Rose Marble',
    category: 'Warm Marble',
    priceLabel: 'From $76',
    badge: 'Soft Rose',
    accent: '#c88a96',
    description: 'Cream and rose veining create a calm marble-inspired display set.',
  },
  {
    id: 'soft-gold-detail',
    name: 'Soft Gold Detail',
    category: 'Gold Accent',
    priceLabel: 'From $64',
    badge: 'New Look',
    accent: '#f7d392',
    description: 'Restrained gold accents catch the light across a warm boutique finish.',
  },
];

export function DisplayWindow({ items = defaultDisplayWindowItems, title = 'Display Window™' }) {
  const displayItems = Array.isArray(items) ? items : [];
  const headingId = 'display-window-title';

  return (
    <section style={styles.panel} className="display-window-section nail-shop-public-panel" aria-labelledby={headingId}>
      <style>{displayWindowMediaStyles}</style>
      <div style={styles.header} className="display-window-header">
        <div>
          <p style={styles.eyebrow}>Boutique preview</p>
          <h2 id={headingId} style={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <p style={styles.emptyState}>Display Window™ pieces are being polished for preview.</p>
      ) : (
        <div style={styles.grid} className="display-window-grid">
          {displayItems.map((item, index) => {
            const key = item.id || `${item.name || 'display-window-item'}-${index}`;
            const name = item.name || 'Untitled Look';
            const category = item.category || 'Editorial nail look';
            const description = item.description || 'A polished placeholder look prepared for the public display window.';
            const priceLabel = item.priceLabel || 'Price coming soon';

            return (
              <article key={key} style={styles.card} aria-label={`${name} display card`}>
                <div style={styles.visual(item.accent)} aria-label={`${name} premium visual placeholder`} />
                {item.badge ? <span style={styles.badge}>{item.badge}</span> : null}
                <div>
                  <h3 style={styles.cardTitle}>{name}</h3>
                  <p style={styles.category}>{category}</p>
                </div>
                <p style={styles.description}>{description}</p>
                <div style={styles.footer}>
                  <p style={styles.price}>{priceLabel}</p>
                  <button type="button" style={styles.disabledAction} disabled>View Look</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DisplayWindow;
