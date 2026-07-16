import React from 'react';
import ArtistDistrictHeader from './ArtistDistrictHeader';
import ArtistDistrictSection from './ArtistDistrictSection';
import { artistDistrictSections, livingCommunityMetrics } from './artistDistrictData';
import './artistDistrictStyles.css';

function Spotlight() {
  return (
    <section className="artist-spotlight" aria-labelledby="artist-spotlight-title">
      <div className="artist-spotlight__copy">
        <p className="artist-spotlight__eyebrow">SPOTLIGHT</p>
        <h2 id="artist-spotlight-title">Summer Chrome Week</h2>
        <p>Chrome is having its moment. Explore this week’s featured artists, looks, and collections.</p>
        <button type="button" disabled>Meet the Artists</button>
      </div>
      <div className="artist-spotlight__chrome" aria-hidden="true"><span /><span /><span /></div>
    </section>
  );
}

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
      <Spotlight />
      <LivingCommunity />
      {artistDistrictSections.map((section) => <ArtistDistrictSection key={section.id} section={section} />)}
    </main>
  );
}
