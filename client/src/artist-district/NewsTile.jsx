import React from 'react';

const icons = {
  sparkles: <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m5 13 .8 2.2L8 16l-2.2.8L5 19l-.8-2.2L2 16l2.2-.8L5 13Zm13-1 .9 2.1L21 15l-2.1.9L18 18l-.9-2.1L15 15l2.1-.9L18 12Z" /></>,
  trending: <><path d="m3 17 6-6 4 4 7-8" /><path d="M15 7h5v5" /></>,
  storefront: <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5" /></>,
  brush: <><path d="m14 4 6 6-8.5 8.5a4.2 4.2 0 0 1-6 0 4.2 4.2 0 0 1 0-6L14 4Z" /><path d="m12 6 6 6M4 21c1.8.2 3-.2 3.8-1.2" /></>,
};

export default function NewsTile({ icon, title, value, subtitle, accentColor, liveStatus, trendText }) {
  return (
    <article className="news-tile" style={{ '--news-accent': accentColor }} aria-label={`${title}: ${value}, ${subtitle}`}>
      <div className="news-tile__topline">
        <span className="news-tile__icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg></span>
        {liveStatus && <span className="news-tile__live"><span aria-hidden="true" />Live</span>}
      </div>
      <div className="news-tile__content">
        <h3>{title}</h3>
        <p className="news-tile__value">{value}</p>
        <p className="news-tile__subtitle">{subtitle}</p>
      </div>
      {trendText && <p className="news-tile__trend">{trendText}</p>}
    </article>
  );
}
