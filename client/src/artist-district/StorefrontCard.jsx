import React from 'react';

export default function StorefrontCard({
  shopName,
  category,
  specialty,
  location,
  rating,
  designCount,
  followerCount,
  storefrontImage,
  storefrontAlt,
  signatureNailImage,
  signatureNailAlt,
  ctaLabel,
  ctaDestination,
  accent,
}) {
  const details = [
    { label: 'Rating', value: `${rating} ★` },
    { label: 'Designs', value: designCount },
    { label: 'Location', value: location },
  ];

  return (
    <article
      className="storefront-card"
      style={{ '--storefront-accent': accent }}
      aria-label={`${shopName} storefront`}
      data-testid="storefront-card"
    >
      <div className="storefront-card__media">
        <img
          className="storefront-card__artwork"
          src={storefrontImage}
          alt={storefrontAlt}
          width="1536"
          height="1024"
          loading="lazy"
          decoding="async"
        />
        <div className="storefront-card__nail-frame">
          <img
            className="storefront-card__nail"
            src={signatureNailImage}
            alt={signatureNailAlt}
            width="1024"
            height="1536"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>

      <div className="storefront-card__body">
        <div className="storefront-card__identity">
          <div>
            <h3>{shopName}</h3>
            <p className="storefront-card__category">{category}</p>
          </div>
          <span className="storefront-card__specialty">{specialty}</span>
        </div>

        <dl className="storefront-card__details">
          {details.map(({ label, value }) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        {ctaDestination ? (
          <a className="storefront-card__cta" href={ctaDestination} aria-label={`${ctaLabel}: ${shopName}`}>
            {ctaLabel} <span aria-hidden="true">→</span>
          </a>
        ) : (
          <span
            className="storefront-card__cta storefront-card__cta--preview"
            role="link"
            tabIndex="0"
            aria-disabled="true"
            aria-label={`${ctaLabel}: ${shopName} (coming soon)`}
          >
            {ctaLabel} <span aria-hidden="true">→</span><span className="storefront-card__soon">Coming Soon</span>
          </span>
        )}
        {followerCount && <span className="storefront-card__followers">{followerCount} followers</span>}
      </div>
    </article>
  );
}
