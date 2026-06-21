import { COLORS } from './styles';

const SECTIONS = [
  {
    title: 'Business Profile',
    body: 'Shop identity, contact details, and public-facing business information will live here.',
  },
  {
    title: 'Service Menu',
    body: 'Define service categories and appointment offerings for your nail business.',
  },
  {
    title: 'Pricing Library',
    body: 'Set reusable pricing references for services, add-ons, and future proposal workflows.',
  },
  {
    title: 'Policies',
    body: 'Keep cancellation, deposit, booking, and appointment expectations in one workspace.',
  },
  {
    title: 'Business Defaults',
    body: 'Manage future defaults that help personalize Nail Boss to your shop operations.',
  },
];

export default function NailShop() {
  return (
    <main style={styles.page} aria-labelledby="nail-shop-title">
      <section style={styles.hero}>
        <p style={styles.kicker}>Workspace shell</p>
        <h1 id="nail-shop-title" style={styles.title}>Nail Shop™</h1>
        <p style={styles.subtitle}>Manage your business profile, services, pricing, policies, and defaults.</p>
      </section>

      <section style={styles.grid} aria-label="Nail Shop sections">
        {SECTIONS.map((section) => (
          <article key={section.title} style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>{section.title}</h2>
              <span style={styles.badge}>Coming next</span>
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
    maxWidth: 760,
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
    maxWidth: 620,
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
    minHeight: 154,
    padding: 22,
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
