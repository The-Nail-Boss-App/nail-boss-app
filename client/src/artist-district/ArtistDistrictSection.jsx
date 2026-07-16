import React from 'react';
import ArtistDistrictPlaceholderCard from './ArtistDistrictPlaceholderCard';

export default function ArtistDistrictSection({ section }) {
  return (
    <section className={`artist-section artist-section--${section.accent}`} aria-labelledby={`${section.id}-title`}>
      <div className="artist-section__heading">
        <p>{section.eyebrow}</p>
        <h2 id={`${section.id}-title`}>{section.title}</h2>
      </div>
      <div className="artist-section__grid" data-testid={`${section.id}-cards`}>
        {section.shops.map((shop) => <ArtistDistrictPlaceholderCard key={shop.name} shop={shop} accent={section.accent} />)}
      </div>
    </section>
  );
}
