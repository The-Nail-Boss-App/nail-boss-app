import React from 'react';

export default function ShopDirectoryCard({
  name,
  category,
  location,
  specialty,
  storefrontImage,
  storefrontAlt,
  ctaDestination,
  accent,
}) {
  const actionContent = <><span>Explore Studio</span><span aria-hidden="true">&#8599;</span></>;

  return (
    <article
      className="shop-directory-card"
      data-testid="shop-directory-card"
      style={{ '--directory-accent': accent }}
      aria-label={`${name}, ${category}, ${location}`}
    >
      <figure className="shop-directory-card__media">
        <img src={storefrontImage} alt={storefrontAlt} loading="lazy" decoding="async" />
      </figure>
      <div className="shop-directory-card__body">
        <div className="shop-directory-card__identity">
          <div>
            <p className="shop-directory-card__category">{category}</p>
            <h3>{name}</h3>
          </div>
          <p className="shop-directory-card__location"><span aria-hidden="true">&#9671;</span> {location}</p>
        </div>
        <div className="shop-directory-card__footer">
          <span className="shop-directory-card__specialty">{specialty}</span>
          {ctaDestination ? (
            <a className="shop-directory-card__cta" href={ctaDestination} aria-label={`Explore ${name}`}>{actionContent}</a>
          ) : (
            <span className="shop-directory-card__cta shop-directory-card__cta--preview" role="link" tabIndex="0" aria-disabled="true" aria-label={`Explore ${name}, preview only`}>
              {actionContent}
              <span className="shop-directory-card__soon">Preview</span>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
