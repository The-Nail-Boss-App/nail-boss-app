import React from 'react';
import ArtistDistrictPlaceholderCard from './ArtistDistrictPlaceholderCard';
import StorefrontCard from './StorefrontCard';
import TrendCard from './TrendCard';
import ArtistFeatureCard from './ArtistFeatureCard';

export default function ArtistDistrictSection({ section }) {
  return (
    <section className={`artist-section artist-section--${section.accent}`} aria-labelledby={`${section.id}-title`}>
      <div className="artist-section__heading">
        <div><p>{section.eyebrow}</p><h2 id={`${section.id}-title`}>{section.title}</h2>{section.description && <p className="artist-section__description">{section.description}</p>}</div>
        {section.id === 'featured-nail-shops' && <a className="artist-section__view-all" href="#browse-all-nail-shops-title" aria-label="View all nail shops">View All <span aria-hidden="true">→</span></a>}
      </div>
      <div className={`artist-section__grid${section.id === 'featured-nail-shops' ? ' artist-section__grid--storefronts' : ''}${section.id === 'trending-this-week' ? ' artist-section__grid--trends' : ''}${section.id === 'new-artists' ? ' artist-section__grid--artists' : ''}`} data-testid={`${section.id}-cards`}>
        {section.shops.map((shop) => (
          section.id === 'featured-nail-shops'
            ? <StorefrontCard key={shop.id} {...shop} shopName={shop.name} ctaLabel="Explore Studio" />
            : section.id === 'trending-this-week'
              ? <TrendCard key={shop.id} {...shop} />
              : section.id === 'new-artists'
                ? <ArtistFeatureCard key={shop.artistId} {...shop} />
            : <ArtistDistrictPlaceholderCard key={shop.name} shop={shop} accent={section.accent} />
        ))}
      </div>
    </section>
  );
}
