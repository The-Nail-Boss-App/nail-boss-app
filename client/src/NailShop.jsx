import { COLORS } from './styles';

const SECTIONS = [
  {
    title: 'Business Profile',
    body: 'Placeholder for shop identity, contact details, hours, and public-facing business information.',
  },
  {
    title: 'Featured Designs',
    body: 'Placeholder for highlighting signature looks and collections that represent the shop brand.',
  },
  {
    title: 'Gallery',
    body: 'Placeholder for a future portfolio grid of completed nail sets and inspiration images.',
  },
  {
    title: 'Services',
    body: 'Placeholder for service categories, appointment types, and future menu organization.',
  },
  {
    title: 'Products',
    body: 'Placeholder for retail items, recommended aftercare, and product showcases.',
  },
  {
    title: 'Booking',
    body: 'Placeholder for future appointment availability, booking rules, and client scheduling links.',
  },
  {
    title: 'Shop Customization',
    body: 'Placeholder for brand styling, layout preferences, and shop-specific display settings.',
  },
];

export default function NailShop() {
  return (
    <main style={styles.page} aria-labelledby="nail-shop-title">
      <section style={styles.hero}>
        <p style={styles.kicker}>Business workspace</p>
        <h1 id="nail-shop-title" style={styles.title}>Nail Shop</h1>
        <p style={styles.subtitle}>
          A top-level workspace shell for organizing the future public shop experience. This milestone is
          structure-only: placeholder cards are ready for later integrations.
        </p>
      </section>

      <section style={styles.grid} aria-label="Nail Shop workspace sections">
        {SECTIONS.map((section) => (
          <article key={section.title} style={styles.card}>
            <div style={styles.cardIcon} aria-hidden="true">✦</div>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{section.title}</h2>
              <span style={styles.badge}>Placeholder</span>
            </div>
            <p style={styles.cardBody}>{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  page: {
    width: '100%',
    padding: '32px',
  },
  hero: {
    maxWidth: 780,
    marginBottom: 28,
  },
  kicker: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.08em',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.plum,
    fontSize: 34,
    lineHeight: 1.1,
    marginBottom: 10,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 680,
  },
  grid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    maxWidth: 1120,
  },
  card: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    minHeight: 178,
    padding: 22,
  },
  cardIcon: {
    alignItems: 'center',
    background: COLORS.roseDim,
    borderRadius: 14,
    color: COLORS.plum,
    display: 'inline-flex',
    height: 34,
    justifyContent: 'center',
    marginBottom: 16,
    width: 34,
  },
  cardHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 1.25,
  },
  badge: {
    background: COLORS.roseDim,
    borderRadius: 999,
    color: COLORS.plum,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: '5px 9px',
  },
  cardBody: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.55,
  },
};
