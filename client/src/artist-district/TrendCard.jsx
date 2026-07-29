import React from 'react';

export default function TrendCard({
  rank,
  title,
  shopName,
  momentum,
  category,
  collectionImage,
  collectionAlt,
  ctaDestination,
}) {
  const ctaLabel = 'View Trend';

  return (
    <article className="trend-card" data-testid="trend-card" aria-labelledby={`trend-title-${rank}`}>
      <figure className="trend-card__media">
        <img
          src={collectionImage}
          alt={collectionAlt}
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"
        />
        <figcaption className="trend-card__rank" aria-label={`Rank ${rank}`}>#{rank}</figcaption>
      </figure>

      <div className="trend-card__body">
        <div className="trend-card__signals">
          <span className="trend-card__category">{category}</span>
          <span className="trend-card__momentum">{momentum}</span>
        </div>
        <h3 id={`trend-title-${rank}`}>{title}</h3>
        <p className="trend-card__shop">by {shopName}</p>
        {ctaDestination ? (
          <a className="trend-card__cta" href={ctaDestination} aria-label={`${ctaLabel}: ${title} by ${shopName}`}>
            {ctaLabel} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span
            className="trend-card__cta trend-card__cta--preview"
            role="link"
            tabIndex="0"
            aria-disabled="true"
            aria-label={`${ctaLabel}: ${title} by ${shopName} (preview only)`}
          >
            {ctaLabel} <span aria-hidden="true">↗</span><span className="trend-card__preview-label">Preview</span>
          </span>
        )}
      </div>
    </article>
  );
}
