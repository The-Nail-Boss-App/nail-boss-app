const palette = {
  deepPlum: '#190716',
  blackCherry: '#3d0924',
  cream: '#fff7ed',
  softGold: '#f7d392',
  rose: '#c88a96',
};

export const publicTabsStyles = {
  wrap: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'thin',
    scrollbarColor: 'rgba(247, 211, 146, 0.42) rgba(255, 247, 237, 0.08)',
  },
  tablist: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
    minWidth: 0,
  },
  tab: {
    appearance: 'none',
    border: '1px solid rgba(247, 211, 146, 0.22)',
    borderRadius: 999,
    padding: '11px 16px',
    color: palette.cream,
    background: 'linear-gradient(135deg, rgba(61, 9, 36, 0.78), rgba(25, 7, 22, 0.86))',
    fontWeight: 800,
    letterSpacing: '0.01em',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    transition: 'border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, background 160ms ease, transform 160ms ease',
  },
  activeTab: {
    border: '1px solid rgba(247, 211, 146, 0.82)',
    color: '#230719',
    background: 'linear-gradient(135deg, #fff1d0, #f7d392 58%, #c88a96)',
    fontWeight: 900,
    boxShadow: '0 16px 34px rgba(247, 211, 146, 0.2), inset 0 1px 0 rgba(255, 247, 237, 0.45)',
  },
};

export const publicTabsMediaStyles = `
  .public-tabs__tab:hover {
    border-color: rgba(247, 211, 146, 0.72) !important;
    box-shadow: 0 0 0 1px rgba(247, 211, 146, 0.12), 0 14px 30px rgba(247, 211, 146, 0.14) !important;
    transform: translateY(-1px);
  }

  .public-tabs__tab:focus-visible {
    outline: 3px solid rgba(247, 211, 146, 0.95);
    outline-offset: 3px;
  }

  @media (max-width: 900px) {
    .public-tabs__tablist { flex-wrap: wrap !important; }
  }

  @media (max-width: 560px) {
    .public-tabs { margin-right: -10px; padding: 3px 10px 8px 0; }
    .public-tabs__tablist { flex-wrap: nowrap !important; width: max-content !important; max-width: none !important; }
  }
`;
