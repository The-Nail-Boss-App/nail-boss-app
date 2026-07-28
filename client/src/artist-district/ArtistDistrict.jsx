import React from 'react';
import ArtistDistrictHeader from './ArtistDistrictHeader';
import ArtistDistrictSpotlight from './ArtistDistrictSpotlight';
import ArtistDistrictSection from './ArtistDistrictSection';
import { artistDistrictSections, livingCommunityMetrics } from './artistDistrictData';
import { summerChromeCampaign } from './spotlightCampaigns';
import './artistDistrictStyles.css';
import './artistDistrictSpotlight.css';

function LivingCommunity() {
  return (
    <section className="artist-community" aria-labelledby="artist-community-title">
      <div className="artist-community__heading">
        <p>Living Community</p>
        <h2 id="artist-community-title">The district is moving right now</h2>
      </div>
      <div className="artist-community__metrics">
        {livingCommunityMetrics.map((metric) => (
          <article key={metric.id} className={`artist-metric artist-metric--${metric.icon}`} aria-label={metric.label}>
            <span className="artist-metric__icon" aria-hidden="true" />
            <strong>{metric.label}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function ArtistDistrict() {
  return (
    <main className="artist-district" aria-labelledby="artist-district-title">
      <ArtistDistrictHeader />
      <ArtistDistrictSpotlight campaign={summerChromeCampaign} />
      <LivingCommunity />
      {artistDistrictSections.map((section) => <ArtistDistrictSection key={section.id} section={section} />)}
    </main>
  );
}
