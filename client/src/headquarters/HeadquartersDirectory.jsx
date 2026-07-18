import React from 'react';
import { directoryItems } from './headquartersData';

export default function HeadquartersDirectory({ onNavigate }) {
  return (
    <section className="hq-section hq-directory-section" aria-labelledby="directory-title">
      <h2 id="directory-title">Headquarters Directory</h2>
      <div className="hq-directory">
        {directoryItems.map((item) => (
          <article className={`hq-room-card hq-room-card--directory hq-room-card--${item.key}`} key={item.title}>
            <div className="hq-room-card__icon" aria-hidden="true">{item.icon}</div>
            <h3>{item.title}</h3>
            <p>{item.purpose}</p>
            <button type="button" disabled={!item.enabled} onClick={() => item.enabled && onNavigate(item.destination)}>{item.actionLabel} <span aria-hidden="true">→</span></button>{item.status ? <small>{item.status}</small> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
