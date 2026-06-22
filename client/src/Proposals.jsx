import { useState, useEffect } from 'react';
import { COLORS, S, StatusBadge } from './styles';

const VALID_STATUSES = ['Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined'];

const NAIL_SHOP_PROFILE_STORAGE_KEY = 'nailBoss.nailShop.profile.v1';
const NAIL_SHOP_SERVICES_STORAGE_KEY = 'nailBoss.nailShop.services.v1';
const NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY = 'nailBoss.nailShop.pricingLibrary.v1';
const NAIL_SHOP_POLICIES_STORAGE_KEY = 'nailBoss.nailShop.policies.v1';

const FALLBACKS = {
  client: 'Client not set',
  service: 'Service not selected',
  price: 'Pricing unavailable',
  policy: 'Policy not set',
};

const readStoredObject = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = window.localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
};

const readStoredArray = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(key);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const textOrFallback = (value, fallback) => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const numberOrNull = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const describeDepositPolicy = (policies) => {
  const rules = policies?.depositRules && typeof policies.depositRules === 'object' ? policies.depositRules : null;
  if (!rules) return FALLBACKS.policy;
  if (rules.fullPaymentRequired) return 'Full payment is required to book.';
  const percent = numberOrNull(rules.depositPercent);
  const minimum = numberOrNull(rules.minimumDepositAmount);
  if (percent === null && minimum === null) return FALLBACKS.policy;
  return `${percent ?? 0}% deposit required; minimum deposit $${minimum ?? 0}.`;
};

const describeCancellationPolicy = (policies) => {
  const cancellation = policies?.cancellationPolicy && typeof policies.cancellationPolicy === 'object' ? policies.cancellationPolicy : null;
  if (!cancellation) return FALLBACKS.policy;
  if (cancellation.window === 'Custom Policy Text') return textOrFallback(cancellation.customText, FALLBACKS.policy);
  return textOrFallback(cancellation.window, FALLBACKS.policy);
};

const getNailShopSnapshotSource = () => {
  const profile = readStoredObject(NAIL_SHOP_PROFILE_STORAGE_KEY, {});
  const services = readStoredArray(NAIL_SHOP_SERVICES_STORAGE_KEY);
  const pricingLibrary = readStoredObject(NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY, {});
  const policies = readStoredObject(NAIL_SHOP_POLICIES_STORAGE_KEY, {});
  const service = services.find((candidate) => candidate?.active !== false) || services[0] || {};
  return { profile, service, pricingLibrary, policies };
};

const buildProposalV2Snapshots = ({ clientName, price, notes, design }) => {
  const { profile, service, pricingLibrary, policies } = getNailShopSnapshotSource();
  const parsedPrice = numberOrNull(price);
  const servicePrice = numberOrNull(service.startingPrice);
  const depositPercent = numberOrNull(pricingLibrary.depositPercent);
  const deposit = parsedPrice !== null && depositPercent !== null ? parsedPrice * (depositPercent / 100) : null;
  const serviceName = textOrFallback(service.name, FALLBACKS.service);
  const displayPrice = parsedPrice !== null ? parsedPrice : servicePrice;
  const estimatedTime = textOrFallback(service.estimatedTime, FALLBACKS.service);
  const designName = textOrFallback(design?.name, 'Untitled design');

  return {
    proposalVersion: 2,
    clientSnapshot: {
      name: textOrFallback(clientName, FALLBACKS.client),
      contact: '',
      email: '',
      phone: '',
    },
    shopSnapshot: {
      shopName: textOrFallback(profile.shopName, FALLBACKS.policy),
      tagline: textOrFallback(profile.tagline, ''),
      contactEmail: textOrFallback(profile.contactEmail, ''),
      phone: textOrFallback(profile.phone, ''),
      location: textOrFallback(profile.location, ''),
      website: textOrFallback(profile.website, ''),
      bookingLink: textOrFallback(profile.bookingLink, ''),
    },
    serviceSnapshot: {
      serviceName,
      category: textOrFallback(service.category, ''),
      description: textOrFallback(service.description, ''),
      startingPrice: servicePrice,
      estimatedTime,
      serviceType: textOrFallback(service.category, FALLBACKS.service),
    },
    priceSnapshot: {
      suggestedPrice: displayPrice,
      suggestedDeposit: deposit,
      depositPercent,
      estimatedTime,
      breakdown: displayPrice === null ? [] : [{ label: serviceName, amount: displayPrice }],
    },
    policySnapshot: {
      depositPolicy: describeDepositPolicy(policies),
      cancellationPolicy: describeCancellationPolicy(policies),
      bookingRequirements: policies.bookingRequirements && typeof policies.bookingRequirements === 'object' ? policies.bookingRequirements : null,
      appointmentRules: policies.appointmentRules && typeof policies.appointmentRules === 'object' ? policies.appointmentRules : null,
      pressOnRules: policies.pressOnRules && typeof policies.pressOnRules === 'object' ? policies.pressOnRules : null,
    },
    visualSnapshot: {
      mode: 'legacy-design',
      designName,
      heroLabel: designName,
      fullSetData: null,
      createdFromRenderer: false,
    },
    draftSnapshot: {
      title: `Proposal for ${textOrFallback(clientName, FALLBACKS.client)}`,
      notes: typeof notes === 'string' ? notes.trim() : '',
      customMessage: '',
      draftText: typeof notes === 'string' ? notes.trim() : '',
    },
  };
};

const formatMoney = (value, fallback = FALLBACKS.price) => {
  const parsed = numberOrNull(value);
  return parsed === null ? fallback : `$${parsed.toFixed(2)}`;
};


export default function Proposals() {
  const [proposals, setProposals] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form state
  const [selectedDesignId, setSelectedDesignId] = useState('');
  const [clientName, setClientName] = useState('');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [showForm, setShowForm] = useState(false);

  const selectedDesign = designs.find((design) => design.id === selectedDesignId) || null;
  const proposalSnapshotPreview = buildProposalV2Snapshots({ clientName, price, notes, design: selectedDesign });

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, dRes] = await Promise.all([
        fetch('/api/proposals'),
        fetch('/api/designs'),
      ]);
      if (!pRes.ok || !dRes.ok) throw new Error('Failed to load data');
      const [p, d] = await Promise.all([pRes.json(), dRes.json()]);
      setProposals(p);
      setDesigns(d);
      if (d.length > 0 && !selectedDesignId) setSelectedDesignId(d[0].id);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!selectedDesignId) return setFormError('Please select a design.');
    if (!clientName.trim()) return setFormError('Client name is required.');
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) return setFormError('Enter a valid price.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designId: selectedDesignId,
          clientName: clientName.trim(),
          price: priceNum,
          notes: notes.trim(),
          ...buildProposalV2Snapshots({
            clientName: clientName.trim(),
            price: priceNum,
            notes: notes.trim(),
            design: selectedDesign,
          }),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to create proposal');
      }
      setSuccessMsg('Proposal created! Client link is live.');
      setClientName('');
      setPrice('');
      setNotes('');
      setShowForm(false);
      await fetchAll();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const clientUrl = (id) => {
    const isLocalReactDev = ["3000", "5173"].includes(window.location.port);
    const origin = isLocalReactDev
      ? `${window.location.protocol}//${window.location.hostname}:4000`
      : window.location.origin;
    return `${origin}/proposal/${id}`;
  };

  // ── Styles ──────────────────────────────────────────────
  const styles = {
    page: {
      padding: '32px',
      maxWidth: 860,
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 700,
      color: COLORS.plum,
      margin: 0,
    },
    card: {
      background: '#fff',
      border: `1px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: 20,
      marginBottom: 12,
    },
    formCard: {
      background: '#fff',
      border: `1px solid ${COLORS.rose}`,
      borderRadius: 12,
      padding: 24,
      marginBottom: 24,
    },
    formTitle: {
      fontSize: 16,
      fontWeight: 600,
      color: COLORS.plum,
      marginBottom: 16,
    },
    row: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 16,
      marginBottom: 14,
    },
    field: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    },
    fullField: {
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      marginBottom: 14,
    },
    textarea: {
      ...S.input,
      minHeight: 64,
      resize: 'vertical',
      fontFamily: 'inherit',
    },
    formActions: {
      display: 'flex',
      gap: 10,
      marginTop: 8,
    },
    proposalRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    proposalLeft: {
      flex: 1,
      minWidth: 180,
    },
    designName: {
      fontWeight: 600,
      color: COLORS.plum,
      fontSize: 15,
      marginBottom: 2,
    },
    meta: {
      fontSize: 13,
      color: COLORS.muted,
    },
    proposalRight: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    price: {
      fontWeight: 700,
      fontSize: 17,
      color: COLORS.plum,
    },
    link: {
      fontSize: 12,
      color: COLORS.rose,
      textDecoration: 'none',
      border: `1px solid ${COLORS.rose}`,
      borderRadius: 6,
      padding: '3px 10px',
      whiteSpace: 'nowrap',
    },
    empty: {
      textAlign: 'center',
      color: COLORS.muted,
      padding: '40px 0',
      fontSize: 14,
    },
    errorMsg: {
      background: '#fef2f2',
      border: '1px solid #fca5a5',
      borderRadius: 8,
      color: '#b91c1c',
      padding: '10px 14px',
      fontSize: 13,
      marginBottom: 12,
    },
    successMsg: {
      background: '#f0fdf4',
      border: '1px solid #86efac',
      borderRadius: 8,
      color: '#15803d',
      padding: '10px 14px',
      fontSize: 13,
      marginBottom: 12,
    },
    select: {
      ...S.input,
      cursor: 'pointer',
    },
    previewBox: {
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      padding: 12,
      marginBottom: 14,
      background: '#faf8f7',
      fontSize: 12,
      color: COLORS.muted,
      lineHeight: 1.6,
    },
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Client Proposals</h1>
        <button
          style={showForm ? S.btnSecondary : S.btnPrimary}
          onClick={() => { setShowForm(!showForm); setFormError(''); setSuccessMsg(''); }}
        >
          {showForm ? '✕ Cancel' : '+ New Proposal'}
        </button>
      </div>

      {/* Success banner */}
      {successMsg && <div style={styles.successMsg}>{successMsg}</div>}

      {/* Create Form */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formTitle}>Create Proposal</div>
          {formError && <div style={styles.errorMsg}>{formError}</div>}
          <form onSubmit={handleSubmit}>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={S.label}>Design</label>
                {designs.length === 0 ? (
                  <div style={{ fontSize: 13, color: COLORS.muted, padding: '8px 0' }}>
                    No designs yet — go to Design Studio first.
                  </div>
                ) : (
                  <select
                    style={styles.select}
                    value={selectedDesignId}
                    onChange={(e) => setSelectedDesignId(e.target.value)}
                  >
                    {designs.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.shape}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={styles.field}>
                <label style={S.label}>Client Name</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="e.g. Maya Johnson"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </div>
            </div>


            <div style={styles.row}>
              <div style={styles.field}>
                <label style={S.label}>Price ($)</label>
                <input
                  style={S.input}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 85.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              <div style={styles.field}>
                <label style={S.label}>Notes (optional)</label>
                <input
                  style={S.input}
                  type="text"
                  placeholder="Any special instructions…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={styles.previewBox} data-testid="proposal-create-snapshot-preview">
              <strong>Internal preview</strong><br />
              Shop: {proposalSnapshotPreview.shopSnapshot.shopName}<br />
              Service: {proposalSnapshotPreview.serviceSnapshot.serviceName}<br />
              Price: {formatMoney(proposalSnapshotPreview.priceSnapshot.suggestedPrice)}<br />
              Deposit: {formatMoney(proposalSnapshotPreview.priceSnapshot.suggestedDeposit, FALLBACKS.policy)}<br />
              Time: {proposalSnapshotPreview.priceSnapshot.estimatedTime}
            </div>

            <div style={styles.formActions}>
              <button
                type="submit"
                style={submitting || designs.length === 0 ? { ...S.btnPrimary, opacity: 0.6 } : S.btnPrimary}
                disabled={submitting || designs.length === 0}
              >
                {submitting ? 'Sending…' : 'Send Proposal'}
              </button>
              <button
                type="button"
                style={S.btnGhost}
                onClick={() => { setShowForm(false); setFormError(''); }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Proposals List */}
      {loading ? (
        <div style={styles.empty}>Loading proposals…</div>
      ) : error ? (
        <div style={styles.errorMsg}>{error}</div>
      ) : proposals.length === 0 ? (
        <div style={styles.empty}>
          No proposals yet. Create one above to price and share a design with a client.
        </div>
      ) : (
        proposals.map((p) => {
          const designName = p.design?.name || p.designId;
          const shape = p.design?.shape || '';
          return (
            <div key={p.id} style={styles.card}>
              <div style={styles.proposalRow}>
                <div style={styles.proposalLeft}>
                  <div style={styles.designName}>{designName}</div>
                  <div style={styles.meta}>
                    {shape && <span>{shape} · </span>}
                    <span>Client: <strong>{p.clientName}</strong></span>
                    {p.notes && <span> · {p.notes}</span>}
                    {p.blueprintSummary?.marketingTags?.length ? <span> · Tags: {p.blueprintSummary.marketingTags.join(', ')}</span> : null}
                  </div>
                </div>
                <div style={styles.proposalRight}>
                  <span style={styles.price}>${Number(p.price).toFixed(2)}</span>
                  <StatusBadge status={p.status} />
                  <a
                    href={clientUrl(p.id)}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.link}
                  >
                    Open client view →
                  </a>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
