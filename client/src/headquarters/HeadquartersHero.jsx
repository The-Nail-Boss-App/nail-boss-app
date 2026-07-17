import React from 'react';
import { executiveBrief, officialAssets } from './headquartersData';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HeadquartersHero({ techName, onNavigate }) {
  const name = techName?.trim();
  return (
    <section className="hq-hero" aria-labelledby="headquarters-title">
      <div className="hq-hero__topline">
        <img className="hq-hero__logo" src={officialAssets.primaryLogo} alt="AnitaSet primary logo" />
        <div className="hq-search" role="search" aria-label="Headquarters search"><span>Search AnitaSet...</span><span aria-hidden="true">⌕</span></div>
      </div>
      <div className="hq-hero__stage">
        <div className="hq-hero__copy">
          <p className="hq-script">Welcome to</p>
          <h1 id="headquarters-title"><span className="hq-sr">Welcome to Headquarters.</span>HEADQUARTERS</h1>
          <p className="hq-hero__lede">The ultimate hub for nail professionals<br />to create, run, and grow unstoppable businesses.</p>
          <p className="hq-script hq-boss">Welcome back,<br /><strong>{name || 'Boss'}!</strong></p>
          <button type="button" className="hq-hero__cta" onClick={() => onNavigate('studio')}>Explore Headquarters <span aria-hidden="true">→</span></button>
        </div>
        {/* Official Anita image asset required for this reserved position in the approved visual. */}
        <div className="hq-anita-space" aria-hidden="true" />
        <div className="hq-landmark" aria-label="Headquarters landmark using official AnitaSet favicon">
          <div className="hq-landmark__rings"><img src={officialAssets.favicon} alt="" aria-hidden="true" /></div>
          <div className="hq-landmark__base">ANITASET</div>
        </div>
        <aside className="hq-briefing" aria-label="Executive briefing">
          {executiveBrief.map((item) => <p key={item}>{item}</p>)}
        </aside>
      </div>
    </section>
  );
}
