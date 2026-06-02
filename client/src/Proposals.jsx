import { useState, useEffect } from 'react';
import { COLORS, S, StatusBadge } from './styles';

const VALID_STATUSES = ['Sent', 'Viewed', 'Accepted', 'ChangesRequested', 'Declined'];

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

  const clientUrl = (id) => `${window.location.protocol}//${window.location.hostname}:4000/proposal/${id}`;

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
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Proposals</h1>
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
          No proposals yet. Create one above to share a design with a client.
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
