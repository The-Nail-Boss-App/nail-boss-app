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
          <p style={styles.eyebrow}>Boutique preview</p>
          <h2 id={headingId} style={styles.sectionTitle}>{title}</h2>
        </div>
      </div>

      {displayItems.length === 0 ? (
        <p style={styles.emptyState}>Display Window™ pieces are being polished for preview.</p>
      ) : (
        <div style={styles.grid} className="display-window-grid">
          {displayItems.map((item, index) => {
            const key = item.id || `${item.title || 'display-window-item'}-${index}`;
            const itemType = ['design', 'product', 'service'].includes(item.type) ? item.type : 'design';
            const titleText = item.title || item.name || 'Untitled Look';
            const subtitle = item.subtitle || item.category || 'Editorial nail look';
            const visualLabel = item.visualLabel || `${titleText} safe ${itemType} visual placeholder`;

            return (
              <article key={key} style={styles.card} aria-label={`${titleText} ${itemType} display card`}>
                <div style={styles.visualByType(itemType)} role="img" aria-label={visualLabel} />
                {item.badge ? <span style={styles.badge}>{item.badge}</span> : null}
                <div>
                  <p style={styles.category}>{itemType}</p>
                  <h3 style={styles.cardTitle}>{titleText}</h3>
                  <p style={styles.subtitle}>{subtitle}</p>
                </div>
                <div style={styles.footer}>
                  <button type="button" style={styles.disabledAction} disabled aria-label={`View ${titleText} placeholder disabled`}>View Look</button>
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
