import React from 'react';
import { executiveBrief, officialAssets } from './headquartersData';

export default function HeadquartersHero({ techName, onNavigate }) {
  const name = techName?.trim();
  return (
    <section className="hq-hero" aria-labelledby="headquarters-title" data-testid="headquarters-environment-layer">
      <div className="hq-hero__topline">
        <img className="hq-hero__logo" src={officialAssets.darkBackgroundLogo} alt="AnitaSet secondary logo for dark backgrounds" />
        <div className="hq-hero__right"><div className="hq-search" role="search" aria-label="Headquarters search"><span>Search AnitaSet...</span><span aria-hidden="true">⌕</span></div><div className="hq-alert" aria-hidden="true">♧<b>4</b></div><div className="hq-alert" aria-hidden="true">☏<b>3</b></div><div className="hq-founder-chip"><span></span><strong>{name || 'Keata'}</strong><small>Founder</small></div></div>
      </div>
      <div className="hq-hero__stage">
        <div className="hq-architecture" aria-hidden="true"><span /><span /><span /></div>
        <div className="hq-cityline" aria-hidden="true" />
        <div className="hq-hero__copy">
          <p className="hq-script hq-script--small">Welcome to</p>
          <h1 id="headquarters-title"><span className="hq-sr">Welcome to Headquarters.</span>HEADQUARTERS</h1>
          <p className="hq-hero__lede">The ultimate hub for nail professionals to create, run, and grow unstoppable businesses.</p>
          <p className="hq-boss">Welcome back, <strong>{name || 'Boss'}!</strong></p>
          <button type="button" className="hq-hero__cta" onClick={() => onNavigate('studio')}>Explore Headquarters <span aria-hidden="true">→</span></button>
        </div>
        <figure className="hq-anita" data-testid="headquarters-anita-presence" aria-label="Anita, the Headquarters concierge and shop manager, standing inside AnitaSet Headquarters">
          {officialAssets.anitaPortrait ? <img src={officialAssets.anitaPortrait} alt="Anita, AnitaSet Headquarters concierge" /> : <div className="hq-anita__illustration" role="img" aria-label="Illustrated Anita concierge placeholder awaiting approved production portrait"><span className="hq-anita__hair" /><span className="hq-anita__face" /><span className="hq-anita__body" /><span className="hq-anita__tablet" /></div>}
        </figure>
        <div className="hq-landmark" aria-label="Headquarters architectural nail monument using official AnitaSet favicon">
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
