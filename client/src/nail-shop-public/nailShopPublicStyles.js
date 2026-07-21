const palette = {
  ink: '#050306',
  blackCherry: '#270515',
  cherry: '#4b0828',
  cream: '#fff3df',
  pink: '#ff2f92',
  violet: '#9b5cff',
  silver: '#d9dde7',
  mutedCream: 'rgba(255, 243, 223, 0.74)',
};

const surface = 'linear-gradient(145deg, rgba(39, 5, 21, 0.92), rgba(5, 3, 6, 0.9))';

export const nailShopPublicStyles = {
  page: {
    width: '100%', minHeight: '100vh', overflowX: 'hidden', boxSizing: 'border-box', color: palette.cream,
    background: 'radial-gradient(circle at 12% 10%, rgba(255,47,146,.22), transparent 24rem), radial-gradient(circle at 86% 4%, rgba(155,92,255,.18), transparent 22rem), linear-gradient(135deg, #050306 0%, #16040d 44%, #050306 100%)',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  shell: { width: 'min(1180px, calc(100% - 28px))', margin: '0 auto', padding: '20px 0 34px', display: 'grid', gap: 14 },
  hero: { position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr)', gap: 22, alignItems: 'center', minHeight: 300, padding: 20, border: '1px solid rgba(255,47,146,.34)', borderRadius: 28, background: surface, boxShadow: '0 24px 70px rgba(0,0,0,.46), inset 0 1px 0 rgba(217,221,231,.12)' },
  heroBanner: { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: .72, filter: 'saturate(1.18) contrast(1.08)' },
  heroOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(5,3,6,.9), rgba(39,5,21,.62) 48%, rgba(5,3,6,.76)), radial-gradient(circle at 25% 50%, rgba(255,47,146,.18), transparent 22%)' },
  signatureWrap: { position: 'relative', zIndex: 1, display: 'grid', justifyItems: 'center', minWidth: 0, filter: 'drop-shadow(0 0 28px rgba(255,47,146,.34))' },
  heroCopy: { position: 'relative', zIndex: 1, minWidth: 0, display: 'grid', gap: 8 },
  eyebrow: { margin: 0, color: palette.pink, fontSize: 11, fontWeight: 950, letterSpacing: '0.2em', textTransform: 'uppercase' },
  title: { margin: 0, color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(34px, 5vw, 62px)', lineHeight: .94, letterSpacing: '-0.045em', textShadow: '0 0 30px rgba(255,47,146,.24)' },
  tagline: { margin: 0, maxWidth: 620, color: palette.silver, fontSize: 'clamp(16px, 1.7vw, 20px)', fontWeight: 800, lineHeight: 1.25 },
  location: { margin: 0, color: 'rgba(217,221,231,.86)', fontSize: 13, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase' },
  ratingRow: { display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, color: palette.silver, fontSize: 14, fontWeight: 800 },
  stars: { color: palette.pink, letterSpacing: '0.04em', textShadow: '0 0 14px rgba(255,47,146,.55)' },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 9, marginTop: 4 },
  tagList: { display: 'flex', flexWrap: 'wrap', gap: 7, margin: 0, padding: 0, listStyle: 'none' },
  tag: { border: '1px solid rgba(255,47,146,.42)', borderRadius: 999, padding: '6px 9px', color: palette.cream, background: 'rgba(255,47,146,.14)', fontSize: 12, fontWeight: 900 },
  primaryButton: { border: '1px solid rgba(255,47,146,.8)', borderRadius: 999, padding: '10px 16px', color: '#fff', background: 'linear-gradient(135deg, #ff2f92, #9b5cff)', fontWeight: 950, boxShadow: '0 0 24px rgba(255,47,146,.28)', cursor: 'pointer' },
  secondaryButton: { border: '1px solid rgba(217,221,231,.28)', borderRadius: 999, padding: '10px 16px', color: palette.cream, background: 'rgba(255,255,255,.075)', fontWeight: 900, cursor: 'pointer' },
  iconButton: { width: 40, height: 40, border: '1px solid rgba(217,221,231,.3)', borderRadius: 999, color: palette.cream, background: 'rgba(5,3,6,.52)', fontSize: 18, fontWeight: 900, cursor: 'pointer' },
  panel: { padding: 18, borderRadius: 24, border: '1px solid rgba(217,221,231,.14)', background: surface, boxShadow: '0 18px 48px rgba(0,0,0,.34)' },
  tabContent: { minHeight: 120, display: 'grid', gap: 10, color: palette.mutedCream },
  panelTitle: { margin: 0, color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 'clamp(24px, 3vw, 34px)', lineHeight: 1.05 },
  panelCopy: { margin: 0, maxWidth: 720, color: palette.mutedCream, lineHeight: 1.45 },
  sectionHeaderCompact: { display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  artistPreview: { padding: 16, borderRadius: 24, border: '1px solid rgba(155,92,255,.26)', background: 'linear-gradient(135deg, rgba(5,3,6,.92), rgba(39,5,21,.82))' },
  artistGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 },
  artistCard: { minWidth: 0, display: 'grid', justifyItems: 'center', gap: 5, padding: 10, borderRadius: 18, border: '1px solid rgba(217,221,231,.14)', background: 'rgba(255,255,255,.055)', textAlign: 'center' },
  artistAvatar: { width: 74, height: 96, objectFit: 'cover', borderRadius: '50% 50% 44% 44% / 10% 10% 62% 62%', boxShadow: '0 0 22px rgba(255,47,146,.24)' },
  artistName: { margin: '4px 0 0', color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 16 },
  artistSpecialty: { margin: 0, color: palette.mutedCream, fontSize: 12, fontWeight: 800 },
  statusPill: { border: '1px solid rgba(255,47,146,.28)', borderRadius: 999, padding: '3px 7px', color: palette.pink, fontSize: 10, fontWeight: 900 },
  galleryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  galleryCard: { display: 'grid', gap: 8, padding: 10, borderRadius: 18, border: '1px solid rgba(217,221,231,.14)', background: 'rgba(255,255,255,.055)' },
  galleryImage: { width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 14 },
  inlineActions: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  serviceGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 12 },
  serviceCard: { display: 'grid', gap: 8, padding: 14, borderRadius: 20, border: '1px solid rgba(255,47,146,.2)', background: 'rgba(255,47,146,.07)' },
  cardTitle: { margin: 0, color: palette.cream, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 20 },
  price: { margin: 0, color: palette.pink, fontSize: 17, fontWeight: 950 },
  shopFeature: { display: 'grid', gridTemplateColumns: 'minmax(200px, .8fr) minmax(0, 1.2fr)', gap: 18, alignItems: 'center' },
  aboutFeature: { display: 'grid', gridTemplateColumns: 'minmax(200px, .8fr) minmax(0, 1.2fr)', gap: 18, alignItems: 'center' },
  shopImage: { width: '100%', maxHeight: 240, borderRadius: 22, objectFit: 'cover', boxShadow: '0 18px 44px rgba(0,0,0,.35)' },
  reviewGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  reviewCard: { padding: 14, borderRadius: 18, border: '1px solid rgba(217,221,231,.14)', background: 'rgba(255,255,255,.055)' },
};

export const nailShopPublicMediaStyles = `
  .nail-shop-public-panel, .nail-shop-public-hero { position: relative; }
  .nail-shop-public-panel:before, .nail-shop-public-hero:before { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .08; background-image: linear-gradient(135deg, transparent 0 48%, rgba(255,255,255,.9) 49% 50%, transparent 51%), radial-gradient(circle, rgba(255,255,255,.55) 0 1px, transparent 1px); background-size: 90px 90px, 18px 18px; }
  @media (max-width: 900px) { .artist-collective-row { display: flex !important; overflow-x: auto !important; padding-bottom: 6px; } .artist-collective-row article { flex: 0 0 150px; } }
  @media (max-width: 760px) { .nail-shop-public-hero { grid-template-columns: 1fr !important; min-height: 0 !important; padding: 16px !important; } .nail-shop-public-shell { width: min(100% - 20px, 1180px) !important; padding-top: 12px !important; } .nail-shop-public-panel { padding: 14px !important; } .nail-shop-public-panel [style*='grid-template-columns'] { grid-template-columns: 1fr !important; } }
`;
