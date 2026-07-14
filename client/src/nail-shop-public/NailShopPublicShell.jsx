import React, { useMemo, useState } from 'react';
import ShopHeader from './ShopHeader';
import DisplayWindow from './DisplayWindow';
import PublicTabs from './PublicTabs';
import { mockPublicShop } from './mockPublicShop';
import { nailShopPublicMediaStyles, nailShopPublicStyles as styles } from './nailShopPublicStyles';

const BASE_TABS = ['Overview', 'Gallery', 'Services', 'Shop', 'About'];

export function buildPublicTabs(hasMultipleArtists) {
  return hasMultipleArtists ? [...BASE_TABS, 'Artists'] : BASE_TABS;
}

function TabPanel({ tab, shop }) {
  const content = {
    Overview: ['Public shop introduction', `${shop.shopName} highlights ${shop.specialtyTags.join(', ')} in a static public preview.`],
    Gallery: ['Portfolio placeholder', 'A future gallery can showcase curated nail looks without connecting to production galleries.'],
    Services: ['Services placeholder', 'Structured space for manicures, press-on styling, repairs, and detail sessions.'],
    Shop: ['Products placeholder', 'Static shelf area for sets, charms, care items, and artist-approved essentials.'],
    About: ['Story, policies, and location placeholder', `${shop.shopName} is presented as a safe isolated concept in ${shop.location}.`],
    Artists: ['Multiple artist placeholder', 'Artist cards can live here when a public shop has multiple artists enabled.'],
  }[tab];

  return (
    <section
      id={`public-tab-panel-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      role="tabpanel"
      tabIndex={0}
      aria-labelledby={`public-tab-${tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
      style={{ ...styles.panel, ...styles.tabContent }}
      className="nail-shop-public-panel"
    >
      <h2 style={styles.panelTitle}>{content[0]}</h2>
      <p style={styles.panelCopy}>{content[1]}</p>
    </section>
  );
}

export function NailShopPublicShell({ shop = mockPublicShop, specialtyTags }) {
  const resolvedShop = { ...mockPublicShop, ...shop, specialtyTags: specialtyTags || shop.specialtyTags || mockPublicShop.specialtyTags };
  const tabs = useMemo(() => buildPublicTabs(Boolean(resolvedShop.hasMultipleArtists)), [resolvedShop.hasMultipleArtists]);
  const [activeTab, setActiveTab] = useState(tabs[0]);

  return (
    <main style={styles.page} aria-label="Nail Shop public shell">
      <style>{nailShopPublicMediaStyles}</style>
      <div style={styles.shell} className="nail-shop-public-shell">
        <ShopHeader shop={resolvedShop} />
        <DisplayWindow items={resolvedShop.featuredDisplayItems} />
        <PublicTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        <TabPanel tab={activeTab} shop={resolvedShop} />
      </div>
    </main>
  );
}

export default NailShopPublicShell;
