import React from 'react';
import ArtistDistrictPlaceholderCard from './ArtistDistrictPlaceholderCard';
import StorefrontCard from './StorefrontCard';
import TrendCard from './TrendCard';
import ArtistFeatureCard from './ArtistFeatureCard';
import ShopDirectoryCard from './ShopDirectoryCard';

const directoryFilters = ['Luxury', 'Chrome', 'Gel-X', 'Hand Painted', 'Press-Ons', 'Bridal', 'Acrylic'];

export default function ArtistDistrictSection({ section }) {
  return (
    <section className={`artist-section artist-section--${section.accent}`} aria-labelledby={`${section.id}-title`}>
      <div className="artist-section__heading">
        <div><p>{section.eyebrow}</p><h2 id={`${section.id}-title`}>{section.title}</h2>{section.description && <p className="artist-section__description">{section.description}</p>}</div>
        {section.id === 'featured-nail-shops' && <a className="artist-section__view-all" href="#browse-all-nail-shops-title" aria-label="View all nail shops">View All <span aria-hidden="true">→</span></a>}
      </div>
      {section.id === 'browse-all-nail-shops' && (
        <div className="shop-directory__tools" aria-label="Nail shop directory tools">
          <label className="shop-directory__search">
            <span className="sr-only">Search nail shops</span>
            <span className="shop-directory__search-icon" aria-hidden="true" />
            <input type="search" placeholder="Search Nail Shops..." autoComplete="off" />
            <span className="shop-directory__search-note" aria-hidden="true">Explore the district</span>
          </label>
          <div className="shop-directory__filters" aria-label="Shop filters">
            {directoryFilters.map((filter) => <button key={filter} type="button" aria-disabled="true">{filter}</button>)}
          </div>
        </div>
      )}
      <div className={`artist-section__grid${section.id === 'featured-nail-shops' ? ' artist-section__grid--storefronts' : ''}${section.id === 'trending-this-week' ? ' artist-section__grid--trends' : ''}${section.id === 'new-artists' ? ' artist-section__grid--artists' : ''}${section.id === 'browse-all-nail-shops' ? ' artist-section__grid--directory' : ''}`} data-testid={`${section.id}-cards`}>
        {section.shops.map((shop) => (
          section.id === 'featured-nail-shops'
            ? <StorefrontCard key={shop.id} {...shop} shopName={shop.name} ctaLabel="Explore Studio" />
            : section.id === 'trending-this-week'
              ? <TrendCard key={shop.id} {...shop} />
              : section.id === 'new-artists'
                ? <ArtistFeatureCard key={shop.artistId} {...shop} />
                : section.id === 'browse-all-nail-shops'
                  ? <ShopDirectoryCard key={shop.id} {...shop} />
                  : <ArtistDistrictPlaceholderCard key={shop.name} shop={shop} accent={section.accent} />
        ))}
      </div>
    </section>
  );
}
