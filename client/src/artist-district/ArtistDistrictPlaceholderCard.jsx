import React from 'react';

export default function ArtistDistrictPlaceholderCard({ shop, accent }) {
  return (
    <article className={`artist-shop-card artist-shop-card--${accent}`} aria-label={`${shop.name} nail shop preview`}>
      <div className="artist-shop-card__visual" aria-hidden="true">
        <span className="artist-shop-card__initials">{shop.initials}</span>
        <span className="artist-shop-card__shine" />
      </div>
      <div className="artist-shop-card__body">
        <div>
          <h3>{shop.name}</h3>
          <p className="artist-shop-card__location">{shop.location}</p>
        </div>
        <p className="artist-shop-card__signature">{shop.signature}</p>
        <p>{shop.description}</p>
        <ul className="artist-shop-card__tags" aria-label={`${shop.name} specialty tags`}>
          {shop.tags.map((tag) => <li key={tag}>{tag}</li>)}
        </ul>
        <button type="button" disabled>Visit Shop</button>
      </div>
    </article>
  );
}
