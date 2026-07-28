import React from 'react';
export default function ArtistDistrictSpotlight({ campaign }) {
  const titleId = `artist-district-spotlight-${campaign.id}-title`;

  return (
    <section
      className={`artist-spotlight artist-spotlight--${campaign.theme}`}
      aria-labelledby={titleId}
      data-campaign-status={campaign.status}
    >
      <div className="artist-spotlight__content">
        <div className="artist-spotlight__copy">
          <p className="artist-spotlight__badge">{campaign.badge}</p>
          <h2 className="artist-spotlight__title" id={titleId}>
            {campaign.titleParts.map((part) => (
              <span key={part.role} className={`artist-spotlight__title-part artist-spotlight__title-part--${part.role}`}>
                {part.text}
              </span>
            ))}
          </h2>
          <p className="artist-spotlight__description">{campaign.description}</p>
          <dl className="artist-spotlight__metrics">
            {campaign.metrics.map((metric) => (
              <div className="artist-spotlight__metric" key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>{metric.value}</dd>
              </div>
            ))}
          </dl>
          <a className="artist-spotlight__cta" href={campaign.cta.href} aria-label={campaign.cta.ariaLabel}>
            <span>{campaign.cta.label}</span>
            <span className="artist-spotlight__cta-arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <figure className="artist-spotlight__artwork">
          <img src={campaign.artwork.src} alt={campaign.artwork.alt} width="1536" height="1024" loading="eager" />
        </figure>
      </div>
    </section>
  );
}
