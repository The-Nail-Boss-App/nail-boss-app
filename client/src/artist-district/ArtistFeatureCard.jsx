import React from 'react';

export default function ArtistFeatureCard({
  artistId,
  artistName,
  shopName,
  location,
  specialty,
  shortBio,
  portraitImage,
  portraitAlt,
  accent,
  statusLabel,
  ctaLabel,
  ctaDestination,
}) {
  const actionContent = (
    <>
      <span>{ctaLabel}</span>
      <span aria-hidden="true">→</span>
      {!ctaDestination && <span className="artist-feature-card__preview-label">Coming Soon</span>}
    </>
  );

  return (
    <article
      className="artist-feature-card"
      data-testid="artist-feature-card"
      data-artist-id={artistId}
      style={{ '--artist-accent': accent }}
      aria-labelledby={`${artistId}-artist-name`}
    >
      <figure className="artist-feature-card__portrait">
        <img src={portraitImage} alt={portraitAlt} loading="lazy" decoding="async" />
        <figcaption className="artist-feature-card__status">{statusLabel}</figcaption>
      </figure>
      <div className="artist-feature-card__body">
        <div className="artist-feature-card__identity">
          <h3 id={`${artistId}-artist-name`}>{artistName}</h3>
          <p className="artist-feature-card__shop">{shopName}</p>
          <p className="artist-feature-card__location">{location}</p>
        </div>
        <p className="artist-feature-card__specialty">{specialty}</p>
        <p className="artist-feature-card__bio">{shortBio}</p>
        {ctaDestination ? (
          <a className="artist-feature-card__cta" href={ctaDestination} aria-label={`${ctaLabel}: ${artistName}`}>{actionContent}</a>
        ) : (
          <span className="artist-feature-card__cta artist-feature-card__cta--preview" role="link" tabIndex="0" aria-disabled="true" aria-label={`${ctaLabel}: ${artistName} (coming soon)`}>{actionContent}</span>
        )}
      </div>
    </article>
  );
}
