import React, { useRef, useState } from 'react';
import { publicTabsMediaStyles, publicTabsStyles as styles } from './publicTabsStyles';

export const DEFAULT_PUBLIC_TABS = ['Home', 'Services', 'Gallery', 'Shop', 'About', 'Reviews'];

const TAB_ICONS = { Home: '⌂', Services: '✦', Gallery: '▧', Shop: '◈', About: '◇', Reviews: '★' };

function tabId(tab) {
  return `public-tab-${String(tab).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

function panelId(tab) {
  return `public-tab-panel-${String(tab).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function PublicTabs({
  tabs = DEFAULT_PUBLIC_TABS,
  activeTab,
  onTabChange,
}) {
  const normalizedTabs = tabs.length > 0 ? tabs : DEFAULT_PUBLIC_TABS;
  const [internalActiveTab, setInternalActiveTab] = useState(normalizedTabs[0]);
  const selectedTab = activeTab && normalizedTabs.includes(activeTab) ? activeTab : internalActiveTab;
  const tabRefs = useRef([]);

  function selectTab(tab) {
    setInternalActiveTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  }

  function focusAndSelect(index) {
    const nextTab = normalizedTabs[index];
    selectTab(nextTab);
    tabRefs.current[index]?.focus();
  }

  function handleKeyDown(event, index) {
    const lastIndex = normalizedTabs.length - 1;

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      focusAndSelect(index === lastIndex ? 0 : index + 1);
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      focusAndSelect(index === 0 ? lastIndex : index - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusAndSelect(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusAndSelect(lastIndex);
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectTab(normalizedTabs[index]);
    }
  }

  return (
    <div style={styles.wrap} className="public-tabs">
      <style>{publicTabsMediaStyles}</style>
      <div style={styles.tablist} className="public-tabs__tablist" role="tablist" aria-label="Public Nail Shop sections">
        {normalizedTabs.map((tab, index) => {
          const isActive = tab === selectedTab;

          return (
            <button
              key={tab}
              ref={(node) => {
                tabRefs.current[index] = node;
              }}
              id={tabId(tab)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={panelId(tab)}
              tabIndex={isActive ? 0 : -1}
              style={isActive ? { ...styles.tab, ...styles.activeTab } : styles.tab}
              className="public-tabs__tab"
              onClick={() => selectTab(tab)}
              onKeyDown={(event) => handleKeyDown(event, index)}
            >
              <span className="public-tabs__icon" aria-hidden="true">{TAB_ICONS[tab] || '•'}</span>{tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PublicTabs;
