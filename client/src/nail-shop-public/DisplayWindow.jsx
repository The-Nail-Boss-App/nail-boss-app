import React from 'react';
import { displayWindowMediaStyles, displayWindowStyles as styles } from './displayWindowStyles';
import { mockPublicShop } from './mockPublicShop';

export const defaultDisplayWindowItems = mockPublicShop.featuredDisplayItems;

export function DisplayWindow({ items = defaultDisplayWindowItems, title = 'Display Window™' }) {
  const displayItems = Array.isArray(items) ? items : [];
  const headingId = 'display-window-title';

  return (
    <section style={styles.panel} className="display-window-section nail-shop-public-panel" aria-labelledby={headingId}>
      <style>{displayWindowMediaStyles}</style>
      <div style={styles.header} className="display-window-header">
        <div>
          <p style={styles.eyebrow}>Storefront showcase</p>
          <h2 id={headingId} style={styles.sectionTitle}>{title}</h2>
        </div>
        <div style={styles.controls} aria-label="Display Window controls">
          <button type="button" style={styles.arrowButton} className="display-window-arrow" aria-label="Previous Display Window item">‹</button>
          <button type="button" style={styles.arrowButton} className="display-window-arrow" aria-label="Next Display Window item">›</button>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <p style={styles.emptyState}>Display Window™ pieces are being curated for preview.</p>
      ) : (
        <div style={styles.grid} className="display-window-grid">
          {displayItems.map((item, index) => {
            const key = item.id || `${item.title || 'display-window-item'}-${index}`;
            const itemType = ['design', 'product', 'service'].includes(item.type) ? item.type : 'design';
            const titleText = item.title || item.name || 'Untitled Look';
            const subtitle = item.subtitle || item.category || 'Editorial nail look';
            const visualLabel = item.visualLabel || `${titleText} approved ${itemType} visual`;

            return (
              <article key={key} style={styles.card} className="display-window-card" aria-label={`${titleText} ${itemType} display card`}>
                {item.image ? (
                  <img src={item.image} alt={visualLabel} loading={index === 0 ? 'eager' : 'lazy'} decoding="async" style={styles.imageVisual} />
                ) : (
                  <div style={styles.visualByType(itemType)} role="img" aria-label={visualLabel} />
                )}
                {item.badge ? <span style={styles.badge}>{item.badge}</span> : null}
                <div>
                  <p style={styles.category}>{itemType}</p>
                  <h3 style={styles.cardTitle}>{titleText}</h3>
                  <p style={styles.subtitle}>{subtitle}</p>
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
