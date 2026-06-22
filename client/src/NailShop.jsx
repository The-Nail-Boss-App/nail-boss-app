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

const SERVICE_CATEGORIES = [
  'Full Set',
  'Fill-In',
  'Gel Manicure',
  'Press-On Set',
  'Pedicure',
  'Custom Design',
  'Add-On',
];

export const NAIL_SHOP_SERVICES_STORAGE_KEY = 'nailBoss.nailShop.services.v1';

const DEFAULT_SERVICES = [
  {
    id: 'classic-full-set',
    name: 'Classic Full Set',
    description: '',
    category: 'Full Set',
    startingPrice: 55,
    estimatedTime: '120 min',
    active: true,
  },
  {
    id: 'fill-in',
    name: 'Fill-In',
    description: '',
    category: 'Fill-In',
    startingPrice: 35,
    estimatedTime: '75 min',
    active: true,
  },
  {
    id: 'custom-press-on-set',
    name: 'Custom Press-On Set',
    description: '',
    category: 'Press-On Set',
    startingPrice: 45,
    estimatedTime: '3 business days',
    active: true,
  },
];

const EMPTY_SERVICE_FORM = {
  name: '',
  description: '',
  category: SERVICE_CATEGORIES[0],
  startingPrice: '',
  estimatedTime: '',
  active: true,
};

export const NAIL_SHOP_PROFILE_STORAGE_KEY = 'nailBoss.nailShop.profile.v1';

const PROFILE_FIELD_IDS = [...PROFILE_FIELDS, ...BRAND_FIELDS].map((field) => field.id);

const friendly = (value, placeholder) => value.trim() || placeholder;
const safeColor = (value, fallback) => (/^#[0-9A-F]{6}$/i.test(value) ? value : fallback);

const normalizeProfile = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return DEFAULT_PROFILE;

  return PROFILE_FIELD_IDS.reduce((normalized, fieldId) => ({
    ...normalized,
    [fieldId]: typeof candidate[fieldId] === 'string' ? candidate[fieldId] : DEFAULT_PROFILE[fieldId],
  }), { ...DEFAULT_PROFILE });
};

const loadSavedProfile = () => {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_PROFILE_STORAGE_KEY);
    return saved ? normalizeProfile(JSON.parse(saved)) : DEFAULT_PROFILE;
  } catch (error) {
    return DEFAULT_PROFILE;
  }
};

const persistProfile = (profileToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_PROFILE_STORAGE_KEY, JSON.stringify(normalizeProfile(profileToSave)));
  } catch (error) {
    // Keep the editor usable if browser storage is unavailable.
  }
};

const normalizePrice = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizeService = (candidate, index = 0) => {
  const fallback = DEFAULT_SERVICES[index] || DEFAULT_SERVICES[0];
  const service = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : fallback;
  const category = SERVICE_CATEGORIES.includes(service.category) ? service.category : fallback.category;

  return {
    id: typeof service.id === 'string' && service.id.trim() ? service.id : `service-${Date.now()}-${index}`,
    name: typeof service.name === 'string' ? service.name : fallback.name,
    description: typeof service.description === 'string' ? service.description : '',
    category,
    startingPrice: normalizePrice(service.startingPrice),
    estimatedTime: typeof service.estimatedTime === 'string' ? service.estimatedTime : fallback.estimatedTime,
    active: typeof service.active === 'boolean' ? service.active : true,
  };
};

const normalizeServices = (candidate) => {
  if (!Array.isArray(candidate)) return DEFAULT_SERVICES;
  return candidate.map((service, index) => normalizeService(service, index));
};

const loadSavedServices = () => {
  if (typeof window === 'undefined') return DEFAULT_SERVICES;

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_SERVICES_STORAGE_KEY);
    return saved ? normalizeServices(JSON.parse(saved)) : DEFAULT_SERVICES;
  } catch (error) {
    return DEFAULT_SERVICES;
  }
};

const persistServices = (servicesToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_SERVICES_STORAGE_KEY, JSON.stringify(normalizeServices(servicesToSave)));
  } catch (error) {
    // Keep the manager usable if browser storage is unavailable.
  }
};

const serviceToForm = (service) => ({
  name: service.name,
  description: service.description,
  category: service.category,
  startingPrice: String(service.startingPrice),
  estimatedTime: service.estimatedTime,
  active: service.active,
});

const formToService = (form, existingId) => normalizeService({
  ...form,
  id: existingId || `service-${Date.now()}`,
  startingPrice: normalizePrice(form.startingPrice),
});

export default function NailShop() {
  const [profile, setProfile] = useState(loadSavedProfile);
  const [saveMessage, setSaveMessage] = useState('');
  const [services, setServices] = useState(loadSavedServices);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceMessage, setServiceMessage] = useState('');

  const updateProfile = (field, value) => {
    setSaveMessage('');
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = () => {
    persistProfile(profile);
    setProfile((current) => normalizeProfile(current));
    setSaveMessage('Shop saved.');
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    persistProfile(DEFAULT_PROFILE);
    setSaveMessage('Shop reset to defaults.');
  };

  const updateServiceForm = (field, value) => {
    setServiceMessage('');
    setServiceForm((current) => ({ ...current, [field]: value }));
  };

  const saveService = () => {
    const nextService = formToService(serviceForm, editingServiceId);
    const nextServices = editingServiceId
      ? services.map((service) => (service.id === editingServiceId ? nextService : service))
      : [...services, nextService];
    const normalized = normalizeServices(nextServices);
    setServices(normalized);
    persistServices(normalized);
    setServiceForm(EMPTY_SERVICE_FORM);
    setEditingServiceId(null);
    setServiceMessage(editingServiceId ? 'Service updated.' : 'Service added.');
  };

  const editService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm(serviceToForm(service));
    setServiceMessage('Editing service.');
  };

  const cancelServiceEditing = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceMessage('Service editing canceled.');
  };

  const deleteService = (serviceId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this service?')) return;
    const nextServices = services.filter((service) => service.id !== serviceId);
    setServices(nextServices);
    persistServices(nextServices);
    if (editingServiceId === serviceId) cancelServiceEditing();
    setServiceMessage('Service deleted.');
  };

  const toggleServiceActive = (serviceId) => {
    const nextServices = services.map((service) => (
      service.id === serviceId ? { ...service, active: !service.active } : service
    ));
    setServices(nextServices);
    persistServices(nextServices);
    setServiceMessage('Service status updated.');
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
          customization saved to this browser with localStorage, so it is safe to experiment without saving changes to a backend.
        </p>
      </section>

      <section style={styles.workspace} aria-label="Nail Shop profile customization">
        <form style={styles.editor} aria-label="Edit storefront profile">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Profile details</p>
              <h2 style={styles.sectionTitle}>Customize your storefront</h2>
            </div>
            <div style={styles.headerActions}>
              <button type="button" onClick={saveProfile} style={styles.saveButton} data-testid="nail-shop-save">
                Save Shop
              </button>
              <button type="button" onClick={resetProfile} style={styles.resetButton} data-testid="nail-shop-reset">
                Reset to Default
              </button>
            </div>
          </div>

          {saveMessage && (
            <div style={styles.saveMessage} role="status" data-testid="nail-shop-save-message">
              {saveMessage}
            </div>
          )}

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

        <section style={styles.servicePanel} aria-label="Service Menu Manager" data-testid="service-menu-manager">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Service Menu</p>
              <h2 style={styles.sectionTitle}>Manage shop services</h2>
            </div>
            <span style={styles.serviceCount}>{services.length} services</span>
          </div>

          {serviceMessage && (
            <div style={styles.saveMessage} role="status" data-testid="service-menu-message">
              {serviceMessage}
            </div>
          )}

          <div style={styles.serviceForm} data-testid="service-form">
            <label style={styles.fullField}>
              <span style={styles.label}>Service Name</span>
              <input value={serviceForm.name} onChange={(event) => updateServiceForm('name', event.target.value)} style={styles.input} data-testid="service-name-input" />
            </label>
            <label style={styles.fullField}>
              <span style={styles.label}>Description</span>
              <textarea value={serviceForm.description} onChange={(event) => updateServiceForm('description', event.target.value)} rows={3} style={{ ...styles.input, ...styles.serviceTextarea }} data-testid="service-description-input" />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Category</span>
              <select value={serviceForm.category} onChange={(event) => updateServiceForm('category', event.target.value)} style={styles.input} data-testid="service-category-select">
                {SERVICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Starting Price</span>
              <input value={serviceForm.startingPrice} onChange={(event) => updateServiceForm('startingPrice', event.target.value)} inputMode="decimal" style={styles.input} data-testid="service-price-input" />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Estimated Time</span>
              <input value={serviceForm.estimatedTime} onChange={(event) => updateServiceForm('estimatedTime', event.target.value)} placeholder="90 min" style={styles.input} data-testid="service-time-input" />
            </label>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={serviceForm.active} onChange={(event) => updateServiceForm('active', event.target.checked)} data-testid="service-active-input" />
              Active service
            </label>
            <div style={styles.serviceActions}>
              <button type="button" onClick={saveService} style={styles.saveButton} data-testid="service-save-button">Save Service</button>
              <button type="button" onClick={cancelServiceEditing} style={styles.resetButton} data-testid="service-cancel-button">Cancel editing</button>
            </div>
          </div>

          <div style={styles.serviceList} data-testid="service-list">
            {services.map((service) => (
              <article key={service.id} style={styles.serviceCard} data-testid="service-card">
                <div style={styles.serviceCardHeader}>
                  <div>
                    <h3 style={styles.serviceName}>{service.name.trim() || 'Untitled Service'}</h3>
                    <p style={styles.serviceMeta}>{service.category} · ${normalizePrice(service.startingPrice)}+ · {service.estimatedTime.trim() || 'Time TBD'}</p>
                  </div>
                  <span style={service.active ? styles.activeBadge : styles.inactiveBadge} data-testid="service-status-badge">
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {service.description.trim() && <p style={styles.serviceDescription}>{service.description}</p>}
                <div style={styles.serviceActions}>
                  <button type="button" onClick={() => editService(service)} style={styles.smallButton} data-testid="service-edit-button">Edit Service</button>
                  <button type="button" onClick={() => toggleServiceActive(service.id)} style={styles.smallButton} data-testid="service-toggle-button">{service.active ? 'Set Inactive' : 'Set Active'}</button>
                  <button type="button" onClick={() => deleteService(service.id)} style={styles.deleteButton} data-testid="service-delete-button">Delete Service</button>
                </div>
              </article>
            ))}
          </div>
        </section>

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
  headerActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  saveButton: {
    background: COLORS.plum,
    border: `1px solid ${COLORS.plum}`,
    borderRadius: 999,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
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
  saveMessage: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: 12,
    color: '#166534',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
    padding: '10px 12px',
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
  servicePanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / 2',
    padding: 22,
  },
  serviceCount: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    fontSize: 12,
    fontWeight: 800,
    padding: '7px 10px',
    whiteSpace: 'nowrap',
  },
  serviceForm: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    padding: 16,
  },
  serviceTextarea: {
    lineHeight: 1.5,
    minHeight: 78,
    resize: 'vertical',
  },
  toggleLabel: {
    alignItems: 'center',
    color: COLORS.text,
    display: 'flex',
    fontSize: 13,
    fontWeight: 700,
    gap: 8,
  },
  serviceActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceList: {
    display: 'grid',
    gap: 12,
  },
  serviceCard: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
  },
  serviceCardHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 17,
    margin: '0 0 5px',
  },
  serviceMeta: {
    color: COLORS.textMuted,
    fontSize: 13,
    margin: 0,
  },
  serviceDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    margin: '10px 0 0',
  },
  activeBadge: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: 999,
    color: '#166534',
    fontSize: 11,
    fontWeight: 800,
    padding: '5px 9px',
  },
  inactiveBadge: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 999,
    color: '#475569',
    fontSize: 11,
    fontWeight: 800,
    padding: '5px 9px',
  },
  smallButton: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    padding: '8px 10px',
  },
  deleteButton: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 999,
    color: '#be123c',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    padding: '8px 10px',
  },
};
