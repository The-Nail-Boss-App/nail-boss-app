import React from 'react';
import ArtistDistrictHeader from './ArtistDistrictHeader';
import ArtistDistrictSpotlight from './ArtistDistrictSpotlight';
import ArtistDistrictSection from './ArtistDistrictSection';
import NewsTile from './NewsTile';
import { artistDistrictSections, livingCommunityMetrics } from './artistDistrictData';
import { summerChromeCampaign } from './spotlightCampaigns';
import './artistDistrictStyles.css';
import './artistDistrictSpotlight.css';

function LivingCommunity() {
  return (
    <section className="artist-community" aria-labelledby="artist-community-title">
      <div className="artist-community__heading">
        <p>Living Community</p>
        <h2 id="artist-community-title">Artist District News</h2>
      </div>
      <div className="artist-community__metrics">
        {livingCommunityMetrics.map((metric) => (
          <NewsTile key={metric.id} {...metric} />
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
