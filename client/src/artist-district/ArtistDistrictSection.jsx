import React from 'react';
import ArtistDistrictPlaceholderCard from './ArtistDistrictPlaceholderCard';
import StorefrontCard from './StorefrontCard';

export default function ArtistDistrictSection({ section }) {
  return (
    <section className={`artist-section artist-section--${section.accent}`} aria-labelledby={`${section.id}-title`}>
      <div className="artist-section__heading">
        <div><p>{section.eyebrow}</p><h2 id={`${section.id}-title`}>{section.title}</h2></div>
        {section.id === 'featured-nail-shops' && <a className="artist-section__view-all" href="#browse-all-nail-shops-title" aria-label="View all nail shops">View All <span aria-hidden="true">→</span></a>}
      </div>
      <div className={`artist-section__grid${section.id === 'featured-nail-shops' ? ' artist-section__grid--storefronts' : ''}`} data-testid={`${section.id}-cards`}>
        {section.shops.map((shop) => (
          section.id === 'featured-nail-shops'
            ? <StorefrontCard key={shop.id} {...shop} shopName={shop.name} ctaLabel="Explore Studio" />
            : <ArtistDistrictPlaceholderCard key={shop.name} shop={shop} accent={section.accent} />
        ))}
      </div>
    </section>
  );
}
