import { useState } from 'react';
import { COLORS } from './styles';

const DEFAULT_PROFILE = {
  shopName: 'Nail Boss Studio',
  tagline: 'Custom nail artistry for standout sets.',
  about: 'A welcoming nail space for expressive, detail-led looks — from clean classics to statement art.',
  contactEmail: 'hello@nailboss.example',
  phone: '(555) 123-4567',
  location: 'Serving local nail lovers by appointment',
  instagram: '@nailbossstudio',
  tiktok: '@nailbossstudio',
  website: 'nailboss.example',
  bookingLink: 'Booking link coming soon',
  primaryColor: '#7b2d5f',
  accentColor: '#f3a6c8',
};

const PROFILE_FIELDS = [
  { id: 'shopName', label: 'Shop Name', placeholder: 'Your shop name' },
  { id: 'tagline', label: 'Tagline', placeholder: 'A short, memorable tagline' },
  { id: 'about', label: 'About / Bio', placeholder: 'Tell clients what makes your shop special', type: 'textarea' },
  { id: 'contactEmail', label: 'Contact Email', placeholder: 'hello@yourshop.com', inputMode: 'email' },
  { id: 'phone', label: 'Phone', placeholder: '(555) 123-4567', inputMode: 'tel' },
  { id: 'location', label: 'Location / Service Area', placeholder: 'City, neighborhood, or service area' },
  { id: 'instagram', label: 'Instagram', placeholder: '@yourhandle' },
  { id: 'tiktok', label: 'TikTok', placeholder: '@yourhandle' },
  { id: 'website', label: 'Website', placeholder: 'yourshop.com' },
  { id: 'bookingLink', label: 'Booking Link', placeholder: 'Paste or describe your booking destination' },
];

const BRAND_FIELDS = [
  { id: 'primaryColor', label: 'Primary Color' },
  { id: 'accentColor', label: 'Accent Color' },
];

const friendly = (value, placeholder) => value.trim() || placeholder;
const safeColor = (value, fallback) => (/^#[0-9A-F]{6}$/i.test(value) ? value : fallback);

export default function NailShop() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);

  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
  };

  const primaryColor = safeColor(profile.primaryColor, DEFAULT_PROFILE.primaryColor);
  const accentColor = safeColor(profile.accentColor, DEFAULT_PROFILE.accentColor);

  const preview = {
    shopName: friendly(profile.shopName, 'Your nail shop name'),
    tagline: friendly(profile.tagline, 'Add a tagline to welcome clients.'),
    about: friendly(profile.about, 'Add a short bio so clients know your style, vibe, and specialties.'),
    contactEmail: friendly(profile.contactEmail, 'Email not added yet'),
    phone: friendly(profile.phone, 'Phone not added yet'),
    location: friendly(profile.location, 'Service area not added yet'),
    instagram: friendly(profile.instagram, 'Instagram not added yet'),
    tiktok: friendly(profile.tiktok, 'TikTok not added yet'),
    website: friendly(profile.website, 'Website not added yet'),
    bookingLink: friendly(profile.bookingLink, 'Booking link placeholder'),
  };

  return (
    <main style={styles.page} aria-labelledby="nail-shop-title">
      <section style={styles.hero}>
        <p style={styles.kicker}>Business workspace</p>
        <h1 id="nail-shop-title" style={styles.title}>Nail Shop</h1>
        <p style={styles.subtitle}>
          Start shaping a public-facing storefront profile for your nail business. This is frontend-only
          customization using local page state, so it is safe to experiment without saving changes to a backend.
        </p>
      </section>

      <section style={styles.workspace} aria-label="Nail Shop profile customization">
        <form style={styles.editor} aria-label="Edit storefront profile">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Profile details</p>
              <h2 style={styles.sectionTitle}>Customize your storefront</h2>
            </div>
            <button type="button" onClick={resetProfile} style={styles.resetButton} data-testid="nail-shop-reset">
              Reset to default
            </button>
          </div>

          <div style={styles.fieldGrid}>
            {PROFILE_FIELDS.map((field) => (
              <label key={field.id} style={field.type === 'textarea' ? styles.fullField : styles.field}>
                <span style={styles.label}>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    style={{ ...styles.input, ...styles.textarea }}
                    data-testid={`nail-shop-${field.id}`}
                  />
                ) : (
                  <input
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    inputMode={field.inputMode}
                    style={styles.input}
                    data-testid={`nail-shop-${field.id}`}
                  />
                )}
              </label>
            ))}
          </div>

          <div style={styles.brandGrid} aria-label="Brand colors">
            {BRAND_FIELDS.map((field) => (
              <label key={field.id} style={styles.colorField}>
                <span style={styles.label}>{field.label}</span>
                <span style={styles.colorControl}>
                  <input
                    type="color"
                    value={safeColor(profile[field.id], DEFAULT_PROFILE[field.id])}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    style={styles.colorInput}
                    data-testid={`nail-shop-${field.id}`}
                  />
                  <input
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    style={styles.input}
                    aria-label={`${field.label} hex value`}
                  />
                </span>
              </label>
            ))}
          </div>
        </form>

        <aside style={styles.previewPanel} aria-label="Live storefront preview" data-testid="nail-shop-preview">
          <div style={{ ...styles.previewHero, background: primaryColor }}>
            <div style={{ ...styles.previewBadge, color: primaryColor, background: accentColor }}>
              Live Preview
            </div>
            <h2 style={styles.previewTitle}>{preview.shopName}</h2>
            <p style={styles.previewTagline}>{preview.tagline}</p>
          </div>

          <div style={styles.previewBody}>
            <section>
              <h3 style={styles.previewHeading}>About</h3>
              <p style={styles.previewText}>{preview.about}</p>
            </section>

            <section style={styles.previewCard}>
              <h3 style={styles.previewHeading}>Contact</h3>
              <p style={styles.previewLine}>Email: {preview.contactEmail}</p>
              <p style={styles.previewLine}>Phone: {preview.phone}</p>
              <p style={styles.previewLine}>Area: {preview.location}</p>
            </section>

            <section style={styles.previewCard}>
              <h3 style={styles.previewHeading}>Social links</h3>
              <p style={styles.previewLine}>Instagram: {preview.instagram}</p>
              <p style={styles.previewLine}>TikTok: {preview.tiktok}</p>
              <p style={styles.previewLine}>Website: {preview.website}</p>
            </section>

            <button type="button" style={{ ...styles.bookingButton, background: accentColor, color: primaryColor }}>
              {preview.bookingLink}
            </button>
          </div>
        </aside>
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
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.plum,
    fontSize: 34,
    lineHeight: 1.1,
    margin: '0 0 10px',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 680,
    margin: 0,
  },
  workspace: {
    alignItems: 'start',
    display: 'grid',
    gap: 22,
    gridTemplateColumns: 'minmax(320px, 1.2fr) minmax(300px, .8fr)',
    maxWidth: 1180,
  },
  editor: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    padding: 22,
  },
  panelHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    margin: 0,
  },
  resetButton: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    cursor: 'pointer',
    fontWeight: 700,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
  },
  fieldGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  field: {
    display: 'grid',
    gap: 7,
  },
  fullField: {
    display: 'grid',
    gap: 7,
    gridColumn: '1 / -1',
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 700,
  },
  input: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    color: COLORS.text,
    font: 'inherit',
    minHeight: 42,
    padding: '10px 12px',
    width: '100%',
  },
  textarea: {
    lineHeight: 1.5,
    minHeight: 104,
    resize: 'vertical',
  },
  brandGrid: {
    borderTop: `1px solid ${COLORS.border}`,
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    marginTop: 20,
    paddingTop: 20,
  },
  colorField: {
    display: 'grid',
    gap: 7,
  },
  colorControl: {
    alignItems: 'center',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '52px 1fr',
  },
  colorInput: {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    cursor: 'pointer',
    height: 42,
    padding: 4,
    width: 52,
  },
  previewPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    boxShadow: '0 18px 42px rgba(60,20,50,.1)',
    overflow: 'hidden',
  },
  previewHero: {
    color: '#fff',
    padding: 24,
  },
  previewBadge: {
    borderRadius: 999,
    display: 'inline-flex',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '.08em',
    marginBottom: 42,
    padding: '6px 10px',
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 32,
    lineHeight: 1.05,
    margin: '0 0 8px',
  },
  previewTagline: {
    fontSize: 15,
    lineHeight: 1.5,
    margin: 0,
    opacity: 0.9,
  },
  previewBody: {
    display: 'grid',
    gap: 16,
    padding: 22,
  },
  previewHeading: {
    color: COLORS.text,
    fontSize: 14,
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  previewText: {
    color: COLORS.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
  previewCard: {
    background: COLORS.roseDim,
    borderRadius: 16,
    padding: 16,
  },
  previewLine: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    margin: '0 0 5px',
    overflowWrap: 'anywhere',
  },
  bookingButton: {
    border: 'none',
    borderRadius: 999,
    cursor: 'default',
    fontWeight: 800,
    padding: '13px 18px',
    width: '100%',
  },
};
