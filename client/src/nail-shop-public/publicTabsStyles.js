const palette = { ink: '#050306', cream: '#fff3df', pink: '#ff2f92', violet: '#9b5cff', silver: '#d9dde7' };

export const publicTabsStyles = {
  wrap: { width: '100%', maxWidth: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,47,146,.55) rgba(255,255,255,.08)', padding: '2px 0' },
  tablist: { display: 'flex', flexWrap: 'nowrap', gap: 8, width: '100%', minWidth: 0, padding: 6, borderRadius: 22, border: '1px solid rgba(217,221,231,.14)', background: 'linear-gradient(90deg, rgba(5,3,6,.9), rgba(39,5,21,.86))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08)' },
  tab: { appearance: 'none', flex: '1 0 auto', border: '1px solid rgba(217,221,231,.16)', borderRadius: 16, padding: '10px 13px', color: palette.cream, background: 'rgba(255,255,255,.055)', fontWeight: 900, letterSpacing: '0.01em', whiteSpace: 'nowrap', cursor: 'pointer', transition: 'border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, background 160ms ease, transform 160ms ease' },
  activeTab: { border: '1px solid rgba(255,47,146,.86)', color: '#fff', background: 'linear-gradient(135deg, rgba(255,47,146,.92), rgba(155,92,255,.56))', boxShadow: '0 0 22px rgba(255,47,146,.22), inset 0 1px 0 rgba(255,255,255,.24)' },
};

export const publicTabsMediaStyles = `
  .public-tabs__tab:hover { border-color: rgba(255,47,146,.76) !important; transform: translateY(-1px); }
  .public-tabs__tab:focus-visible { outline: 3px solid rgba(255,47,146,.95); outline-offset: 3px; }
  .public-tabs__icon { margin-right: 7px; color: ${palette.silver}; }
  @media (max-width: 720px) { .public-tabs__tablist { width: max-content !important; max-width: none !important; } .public-tabs__tab { flex: 0 0 auto !important; } }
`;
