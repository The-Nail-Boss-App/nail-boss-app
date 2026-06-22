import NailThumbnail from './design-studio/NailThumbnail';
import { COLORS } from './styles';
import { FULL_SET_RENDER_MODES, getFullSetRenderHands, normalizeFullSetDesign } from './fullSetRenderer';

const MODE_LABELS = {
  left: 'Left Hand View',
  right: 'Right Hand View',
  full: 'Full Set View',
  hero: 'Hero View',
};

function RenderedNail({ nail, hero = false }) {
  return (
    <div style={hero ? styles.heroNail : styles.nailSlot} data-testid="full-set-renderer-nail">
      <NailThumbnail nail={nail} />
    </div>
  );
}

function HandRenderer({ hand, hero = false }) {
  return (
    <section style={hero ? styles.heroHand : styles.hand} aria-label={hand.label} data-testid={`full-set-renderer-${hand.id}-hand`}>
      {!hero && <h4 style={styles.handTitle}>{hand.label}</h4>}
      <div style={hero ? styles.heroNailRow : styles.nailRow}>
        {hand.nails.map((nail) => <RenderedNail key={nail.id} nail={nail} hero={hero} />)}
      </div>
    </section>
  );
}

export default function FullSetRenderer({ designData, mode = 'full', title, compact = false }) {
  const renderMode = FULL_SET_RENDER_MODES.includes(mode) ? mode : 'full';
  const normalized = normalizeFullSetDesign(designData);
  const hands = getFullSetRenderHands(normalized, renderMode === 'hero' ? 'full' : renderMode);
  const heroHand = { id: 'hero', label: 'Hero full set', nails: [...normalized.left.slice(1), ...normalized.right.slice(1)].slice(0, 7) };

  return (
    <section style={{ ...styles.shell, ...(compact ? styles.compactShell : {}) }} aria-label={MODE_LABELS[renderMode]} data-testid={`full-set-renderer-${renderMode}`}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>Full Set Render Engine™</p>
          <h3 style={styles.title}>{title || MODE_LABELS[renderMode]}</h3>
        </div>
        <span style={styles.badge}>{normalized.name}</span>
      </div>

      {renderMode === 'hero' ? (
        <div style={styles.heroStage} data-testid="full-set-renderer-hero-stage">
          <HandRenderer hand={heroHand} hero />
        </div>
      ) : (
        <div style={styles.handsGrid}>
          {hands.map((hand) => <HandRenderer key={hand.id} hand={hand} />)}
        </div>
      )}
    </section>
  );
}

const styles = {
  shell: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 22, boxShadow: '0 18px 42px rgba(90,44,80,.08)', padding: 18 },
  compactShell: { boxShadow: 'none' },
  header: { alignItems: 'start', display: 'flex', gap: 12, justifyContent: 'space-between', marginBottom: 14 },
  kicker: { color: COLORS.textMuted, fontSize: 11, fontWeight: 800, letterSpacing: '.08em', margin: '0 0 5px', textTransform: 'uppercase' },
  title: { color: COLORS.plum, fontSize: 18, margin: 0 },
  badge: { background: COLORS.roseDim, borderRadius: 999, color: COLORS.plum, fontSize: 11, fontWeight: 800, padding: '7px 10px', whiteSpace: 'nowrap' },
  handsGrid: { display: 'grid', gap: 16 },
  hand: { background: '#fff8fb', border: `1px solid ${COLORS.border}`, borderRadius: 18, padding: 12 },
  handTitle: { color: COLORS.text, fontSize: 13, margin: '0 0 10px' },
  nailRow: { alignItems: 'end', display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  nailSlot: { transform: 'scale(.9)', transformOrigin: 'center bottom' },
  heroStage: { background: 'radial-gradient(circle at center, #fff 0%, #fff2f8 62%, #f7d9e8 100%)', borderRadius: 24, padding: '24px 12px' },
  heroHand: { margin: '0 auto', maxWidth: 760 },
  heroNailRow: { alignItems: 'end', display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' },
  heroNail: { filter: 'drop-shadow(0 14px 18px rgba(90,44,80,.16))', transform: 'scale(1.05)', transformOrigin: 'center bottom' },
};
