import React from 'react';
import { liveUpdates } from './headquartersData';

export default function HeadquartersLive() {
  return (
    <aside className="hq-live" aria-labelledby="live-title">
      <h2 id="live-title">What’s Happening</h2>
      {liveUpdates.map((update) => (
        <article key={update.title}>
          <div className="hq-live__thumb" aria-hidden="true" />
          <div><h3>{update.title}</h3><p>{update.meta}</p></div>
          <span>{update.badge}</span>
        </article>
      ))}
      <button type="button" disabled>See All Updates →</button>
    </aside>
  );
}
