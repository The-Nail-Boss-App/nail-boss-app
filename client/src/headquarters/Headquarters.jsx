import React from 'react';
import HeadquartersHero from './HeadquartersHero';
import HeadquartersMetrics from './HeadquartersMetrics';
import HeadquartersDoors from './HeadquartersDoors';
import HeadquartersDirectory from './HeadquartersDirectory';
import HeadquartersPriorities from './HeadquartersPriorities';
import HeadquartersLive from './HeadquartersLive';
import HeadquartersAssistant from './HeadquartersAssistant';
import './headquartersStyles.css';

export default function Headquarters({ techName, onNavigate }) {
  return (
    <main className="hq-room" aria-labelledby="headquarters-title">
      <HeadquartersHero techName={techName} onNavigate={onNavigate} />
      <HeadquartersMetrics />
      <div className="hq-lower-grid">
        <div>
          <HeadquartersDoors onNavigate={onNavigate} />
          <HeadquartersDirectory onNavigate={onNavigate} />
        </div>
        <HeadquartersLive />
      </div>
      <HeadquartersPriorities onNavigate={onNavigate} />
      <HeadquartersAssistant />
    </main>
  );
}
