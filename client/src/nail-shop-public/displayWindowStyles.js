const palette = {
  ink: '#050306',
  blackCherry: '#270515',
  cream: '#fff3df',
  pink: '#ff2f92',
  violet: '#9b5cff',
  silver: '#d9dde7',
  mutedCream: 'rgba(255, 243, 223, 0.72)',
};

export const displayWindowStyles = {
  panel: {
    position: 'relative',
    overflow: 'hidden',
    padding: 18,
    borderRadius: 26,
    border: '1px solid rgba(255, 47, 146, 0.28)',
    background: 'radial-gradient(circle at 8% 0%, rgba(255, 47, 146, 0.18), transparent 28%), linear-gradient(145deg, rgba(39, 5, 21, 0.94), rgba(5, 3, 6, 0.92))',
    boxShadow: '0 20px 54px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(217, 221, 231, 0.12)',
  },
  header: { display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  controls: { display: 'flex', gap: 8 },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    border: '1px solid rgba(217, 221, 231, 0.32)',
    color: palette.cream,
    background: 'rgba(255, 255, 255, 0.08)',
    fontWeight: 900,
  },
  sectionTitle: { margin: 0, color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1, letterSpacing: '-0.035em' },
  eyebrow: { margin: 0, color: palette.pink, fontSize: 11, fontWeight: 900, letterSpacing: '0.18em', textTransform: 'uppercase' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 },
  card: {
    minWidth: 0,
    position: 'relative',
    display: 'grid',
    gap: 7,
    padding: 9,
    borderRadius: 18,
    border: '1px solid rgba(217, 221, 231, 0.16)',
    background: 'linear-gradient(160deg, rgba(255, 47, 146, 0.13), rgba(15, 3, 9, 0.88))',
    boxShadow: '0 14px 30px rgba(0, 0, 0, 0.28)',
  },
  imageVisual: { width: '100%', aspectRatio: '16 / 10', display: 'block', objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(255, 47, 146, 0.24)', boxShadow: '0 0 24px rgba(255, 47, 146, 0.14)', background: palette.ink },
  visualByType: () => ({ height: 98, borderRadius: 14, background: `linear-gradient(135deg, ${palette.pink}, ${palette.blackCherry})` }),
  badge: { position: 'absolute', top: 15, left: 15, border: '1px solid rgba(217, 221, 231, 0.36)', borderRadius: 999, padding: '3px 7px', color: palette.silver, background: 'rgba(5, 3, 6, 0.72)', fontSize: 10, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' },
  cardTitle: { margin: 0, color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 15, lineHeight: 1.05 },
  category: { margin: 0, color: 'rgba(255, 47, 146, 0.9)', fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase' },
  subtitle: { margin: 0, color: palette.mutedCream, fontSize: 12, lineHeight: 1.25 },
  footer: { display: 'none' },
  emptyState: { margin: 0, padding: 14, borderRadius: 18, border: '1px solid rgba(255, 47, 146, 0.18)', color: palette.mutedCream, background: 'rgba(5, 3, 6, 0.5)' },
};

export const displayWindowMediaStyles = `
  .display-window-grid { scrollbar-width: thin; scrollbar-color: rgba(255,47,146,.7) rgba(255,255,255,.08); }
  .display-window-arrow:focus-visible { outline: 3px solid rgba(255,47,146,.95); outline-offset: 3px; }
  @media (max-width: 960px) { .display-window-grid { display: flex !important; overflow-x: auto !important; scroll-snap-type: x mandatory; padding-bottom: 6px; } .display-window-card { flex: 0 0 min(32%, 230px); scroll-snap-align: start; } }
  @media (max-width: 700px) { .display-window-card { flex-basis: 58%; } }
  @media (max-width: 480px) { .display-window-section { padding: 14px !important; } .display-window-header { align-items: start !important; } .display-window-card { flex-basis: 78%; } }
`;
