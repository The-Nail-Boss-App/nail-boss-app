import React from 'react';
import { businessMetrics } from './headquartersData';

export default function HeadquartersMetrics() {
  return (
    <section className="hq-stats" aria-labelledby="business-snapshot-title">
      <h2 id="business-snapshot-title" className="hq-sr">Business Snapshot</h2>
      {businessMetrics.map((metric) => (
        <article className={`hq-stat hq-stat--${metric.tone}`} data-testid="headquarters-metric-card" key={metric.label}>
          <p>{metric.label}</p>
          <strong>{metric.value}</strong>
          <span>↑ {metric.note}</span>
          <svg viewBox="0 0 120 28" aria-hidden="true"><polyline points="0,24 12,18 24,22 36,10 48,16 60,8 72,15 84,7 96,12 108,4 120,10" /></svg>
        </article>
      ))}
    </section>
  );
}
