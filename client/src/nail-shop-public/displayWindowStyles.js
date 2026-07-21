const palette = {
  deepPlum: '#190716',
  blackCherry: '#3d0924',
  cream: '#fff7ed',
  rose: '#c88a96',
  softGold: '#f7d392',
  mutedCream: 'rgba(255, 247, 237, 0.76)',
};

export const displayWindowStyles = {
  panel: {
    position: 'relative',
    overflow: 'hidden',
    padding: 24,
    borderRadius: 30,
    border: '1px solid rgba(255, 247, 237, 0.14)',
    background:
      'radial-gradient(circle at 12% 0%, rgba(247, 211, 146, 0.13), transparent 30%), linear-gradient(145deg, rgba(255, 247, 237, 0.1), rgba(25, 7, 22, 0.58))',
    boxShadow: '0 24px 70px rgba(8, 2, 7, 0.32)',
  },
  header: {
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    margin: 0,
    color: palette.cream,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 'clamp(30px, 4vw, 48px)',
    lineHeight: 1,
    letterSpacing: '-0.035em',
  },
  eyebrow: {
    margin: 0,
    color: palette.softGold,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: 16,
  },
  card: {
    minWidth: 0,
    display: 'grid',
    gap: 12,
    padding: 16,
    borderRadius: 26,
    border: '1px solid rgba(247, 211, 146, 0.18)',
    background:
      'linear-gradient(160deg, rgba(255, 247, 237, 0.14), rgba(61, 9, 36, 0.52)), radial-gradient(circle at 18% 12%, rgba(247, 211, 146, 0.16), transparent 28%)',
    boxShadow: '0 18px 44px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 247, 237, 0.1)',
  },
  imageVisual: {
    width: '100%',
    height: 178,
    display: 'block',
    objectFit: 'cover',
    borderRadius: 22,
    border: '1px solid rgba(247, 211, 146, 0.22)',
    boxShadow: 'inset 0 1px 0 rgba(255, 247, 237, 0.25), 0 14px 32px rgba(8, 2, 7, 0.24)',
    background: 'rgba(25, 7, 22, 0.34)',
  },
  visualByType: (type = 'design') => ({
    position: 'relative',
    height: 152,
    borderRadius: 22,
    overflow: 'hidden',
    border: '1px solid rgba(247, 211, 146, 0.22)',
    background:
      `radial-gradient(circle at 28% 20%, rgba(255, 247, 237, 0.55), transparent 15%), radial-gradient(circle at 72% 28%, ${type === 'product' ? '#f7d392' : type === 'service' ? '#fff7ed' : palette.rose}88, transparent 24%), linear-gradient(135deg, rgba(247, 211, 146, 0.72), rgba(200, 138, 150, 0.42) 38%, rgba(61, 9, 36, 0.94))`,
    boxShadow: 'inset 0 1px 0 rgba(255, 247, 237, 0.25), 0 14px 32px rgba(8, 2, 7, 0.24)',
  }),
  badge: {
    justifySelf: 'start',
    marginTop: -2,
    border: '1px solid rgba(247, 211, 146, 0.32)',
    borderRadius: 999,
    padding: '5px 9px',
    color: palette.softGold,
    background: 'rgba(25, 7, 22, 0.52)',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  cardTitle: {
    margin: 0,
    color: palette.cream,
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: 22,
    lineHeight: 1.08,
  },
  category: {
    margin: 0,
    color: 'rgba(247, 211, 146, 0.82)',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  },
  subtitle: {
    margin: 0,
    minHeight: 42,
    color: palette.mutedCream,
    fontSize: 14,
    lineHeight: 1.5,
  },
  footer: {
    display: 'grid',
    gap: 10,
    alignSelf: 'end',
  },
  price: {
    margin: 0,
    color: palette.cream,
    fontSize: 15,
    fontWeight: 800,
  },
  disabledAction: {
    width: '100%',
    border: '1px solid rgba(255, 247, 237, 0.14)',
    borderRadius: 999,
    padding: '10px 14px',
    color: 'rgba(255, 247, 237, 0.48)',
    background: 'rgba(255, 247, 237, 0.06)',
    fontWeight: 800,
    cursor: 'not-allowed',
  },
  emptyState: {
    margin: 0,
    padding: 18,
    borderRadius: 20,
    border: '1px solid rgba(247, 211, 146, 0.16)',
    color: palette.mutedCream,
    background: 'rgba(25, 7, 22, 0.34)',
  },
};

export const displayWindowMediaStyles = `
  @media (max-width: 960px) {
    .display-window-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  }

  @media (max-width: 620px) {
    .display-window-section { padding: 18px !important; }
    .display-window-header { display: grid !important; align-items: start !important; }
    .display-window-grid { grid-template-columns: 1fr !important; }
  }
`;
