import { useEffect, useMemo, useState } from 'react';
import { COLORS, S } from './styles';
import { generateBlueprintSummary } from './design-studio/blueprint';

const unavailable = 'Blueprint summary unavailable for this design.';

function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 'Not set';
  return `${Math.round(number * 100)}%`;
}

function listText(value, fallback = 'None listed') {
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (value && typeof value === 'object') return Object.keys(value).length ? JSON.stringify(value) : fallback;
  return value || fallback;
}

function moneyLike(value) {
  if (value === undefined || value === null || value === '') return 'Not set';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `$${number.toFixed(2)}`;
}

function depositFrom(summary) {
  const preferred = summary?.pricingSummary?.proposalPrice !== 'Not set'
    ? summary?.pricingSummary?.proposalPrice
    : summary?.pricingSummary?.estimatedServicePrice;
  const number = Number(preferred);
  return Number.isFinite(number) ? `$${(number * 0.3).toFixed(2)}` : 'Not set';
}

function serviceTime(summary) {
  const counts = summary?.serviceSummary?.layerCounts || {};
  const nailCount = summary?.designSummary?.nailCount || 1;
  const artLayers = Object.entries(counts).reduce((sum, [type, count]) => type === 'base' ? sum : sum + Number(count || 0), 0);
  return `${Math.max(45, Math.min(240, 35 + nailCount * 5 + artLayers * 12))} minutes`;
}

function difficulty(summary) {
  const counts = summary?.serviceSummary?.layerCounts || {};
  const artLayers = Object.entries(counts).reduce((sum, [type, count]) => type === 'base' ? sum : sum + Number(count || 0), 0);
  if (artLayers >= 8 || counts.drawing || counts.charm || counts.jewel) return 'Advanced';
  if (artLayers >= 3 || counts.gradient || counts.frenchTip || counts.pattern) return 'Intermediate';
  return 'Simple';
}

function effectList(summary) {
  const counts = summary?.serviceSummary?.layerCounts || {};
  return Object.entries(counts)
    .filter(([type, count]) => type !== 'base' && Number(count) > 0)
    .map(([type, count]) => `${type} (${count})`);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function SummarySection({ title, rows }) {
  return (
    <section style={styles.section}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      <dl style={styles.rows}>
        {rows.map(([label, value]) => (
          <div key={label} style={styles.row}>
            <dt style={styles.label}>{label}</dt>
            <dd style={styles.value}>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function NailBlueprints() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [summaries, setSummaries] = useState({});
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/api/designs')
      .then((res) => res.ok ? res.json() : Promise.reject(new Error('Unable to load saved designs.')))
      .then((items) => {
        if (!alive) return;
        setDesigns(items);
        if (items[0] && !selectedId) setSelectedId(items[0].id);
      })
      .catch((err) => alive && setError(err.message || 'Unable to load saved designs.'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const selected = useMemo(() => designs.find((design) => design.id === selectedId), [designs, selectedId]);
  const current = selectedId ? summaries[selectedId] : null;

  const generate = async (design) => {
    if (!design?.id) return;
    setBusyId(design.id);
    setError('');
    try {
      const res = await fetch(`/api/designs/${design.id}/blueprint`);
      if (!res.ok) throw new Error(unavailable);
      const body = await res.json();
      if (!body?.document) throw new Error(unavailable);
      const summary = generateBlueprintSummary(body.document, design.name || '');
      setSummaries((prev) => ({ ...prev, [design.id]: { ok: true, summary } }));
      setSelectedId(design.id);
    } catch (_err) {
      setSummaries((prev) => ({ ...prev, [design.id]: { ok: false } }));
      setSelectedId(design.id);
    } finally {
      setBusyId('');
    }
  };

  const summary = current?.summary;
  const vendors = summary?.vendorReferences || [];
  const collections = unique(vendors.map((item) => item.vendor));
  const swatches = unique(vendors.map((item) => [item.vendor, item.sku, item.colorHex].filter(Boolean).join(' · ')));

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.kicker}>External blueprint workspace</p>
          <h1 style={styles.title}>Nail Blueprints™</h1>
          <p style={styles.subtitle}>Convert saved designs into structured Blueprint summaries outside Design Studio.</p>
        </div>
      </div>

      {error ? <div style={styles.error}>{error}</div> : null}

      <div style={styles.grid}>
        <section style={styles.library}>
          <h2 style={styles.cardTitle}>Blueprint Library</h2>
          {loading ? <p style={styles.empty}>Loading saved designs…</p> : null}
          {!loading && designs.length === 0 ? <p style={styles.empty}>No saved designs yet.</p> : null}
          {designs.map((design) => (
            <article key={design.id} style={selectedId === design.id ? { ...styles.designCard, ...styles.activeCard } : styles.designCard}>
              <button type="button" style={styles.designButton} onClick={() => setSelectedId(design.id)}>
                <div style={{ ...styles.thumbnail, background: design.baseColorHex || '#f5d5df' }} aria-label="Design thumbnail" />
                <div style={styles.designMeta}>
                  <strong style={styles.designName}>{design.name}</strong>
                  <span>Shape: {design.shape || 'Not set'}</span>
                  <span>Length: {formatPercent(design.length)}</span>
                </div>
              </button>
              <div style={styles.actions}>
                <button type="button" style={S.btnPrimary} disabled={busyId === design.id} onClick={() => generate(design)}>
                  {busyId === design.id ? 'Generating…' : 'Generate Blueprint Summary'}
                </button>
                <button type="button" style={S.btnSecondary} onClick={() => setSelectedId(design.id)}>
                  View Blueprint Summary
                </button>
              </div>
            </article>
          ))}
        </section>

        <section style={styles.summaryCard}>
          <h2 style={styles.cardTitle}>Blueprint Summary View</h2>
          {!selected ? <p style={styles.empty}>Select a saved design to view its Blueprint summary.</p> : null}
          {selected && !current ? <p style={styles.empty}>Generate a Blueprint Summary for {selected.name}.</p> : null}
          {selected && current && !current.ok ? <p style={styles.fallback}>{unavailable}</p> : null}
          {summary ? (
            <div style={styles.sections}>
              <SummarySection title="Design" rows={[
                ['shape', summary.serviceSummary?.shape || 'Not set'],
                ['length', formatPercent(summary.serviceSummary?.length)],
                ['width', formatPercent(summary.serviceSummary?.width)],
                ['colors', listText(summary.designSummary?.palette)],
                ['effects', listText(effectList(summary))],
              ]} />
              <SummarySection title="Service" rows={[
                ['estimated service time', serviceTime(summary)],
                ['difficulty', difficulty(summary)],
                ['category', summary.designSummary?.styleCategory || summary.serviceSummary?.serviceType || 'Not set'],
              ]} />
              <SummarySection title="Pricing" rows={[
                ['estimated cost', moneyLike(summary.pricingSummary?.estimatedServicePrice)],
                ['suggested price', moneyLike(summary.pricingSummary?.proposalPrice)],
                ['suggested deposit', depositFrom(summary)],
              ]} />
              <SummarySection title="Materials" rows={[
                ['finishes', listText(summary.materialsSummary)],
                ['charms', listText(vendors.filter((item) => item.type === 'charm').map((item) => item.name))],
                ['jewels', listText(vendors.filter((item) => item.type === 'jewel').map((item) => item.name))],
                ['patterns', listText((summary.materialsSummary || []).filter((item) => String(item).toLowerCase().includes('pattern')))],
              ]} />
              <SummarySection title="Marketing Tags" rows={[
                ['style tags', listText(summary.marketingTags)],
                ['season tags', listText((summary.marketingTags || []).filter((tag) => /spring|summer|fall|autumn|winter|holiday|bridal/i.test(tag)))],
                ['trend tags', listText((summary.marketingTags || []).filter((tag) => !/spring|summer|fall|autumn|winter|holiday|bridal/i.test(tag)))],
              ]} />
              <SummarySection title="Vendor References" rows={[
                ['vendor swatches', listText(swatches)],
                ['vendor collections', listText(collections)],
              ]} />
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 32, maxWidth: 1180 },
  header: { marginBottom: 24 },
  kicker: { margin: '0 0 6px', color: COLORS.rose, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12 },
  title: { margin: 0, color: COLORS.plum, fontSize: 30, fontWeight: 800 },
  subtitle: { color: COLORS.muted, margin: '8px 0 0', fontSize: 14 },
  grid: { display: 'grid', gridTemplateColumns: 'minmax(340px, 0.9fr) minmax(420px, 1.1fr)', gap: 20, alignItems: 'start' },
  library: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18 },
  summaryCard: { background: '#fff', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 18 },
  cardTitle: { margin: '0 0 16px', color: COLORS.plum, fontSize: 18 },
  designCard: { border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, marginBottom: 12, background: '#fff' },
  activeCard: { borderColor: COLORS.rose, boxShadow: '0 10px 24px rgba(90,44,80,.12)' },
  designButton: { display: 'flex', gap: 12, alignItems: 'center', width: '100%', border: 0, background: 'transparent', padding: 0, cursor: 'pointer', textAlign: 'left' },
  thumbnail: { width: 54, height: 72, borderRadius: '24px 24px 18px 18px', border: `1px solid ${COLORS.border}`, boxShadow: 'inset 0 10px 18px rgba(255,255,255,.45)' },
  designMeta: { display: 'flex', flexDirection: 'column', gap: 3, color: COLORS.muted, fontSize: 13 },
  designName: { color: COLORS.plum, fontSize: 15 },
  actions: { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  empty: { color: COLORS.muted, fontSize: 14, padding: '20px 0' },
  fallback: { color: '#9f1239', background: '#fff1f2', border: '1px solid #fecdd3', padding: 12, borderRadius: 10, fontSize: 14 },
  error: { color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: 12, borderRadius: 10, marginBottom: 16 },
  sections: { display: 'grid', gap: 14 },
  section: { border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: '#fffdfd' },
  sectionTitle: { margin: '0 0 10px', color: COLORS.plum, fontSize: 15 },
  rows: { display: 'grid', gap: 8, margin: 0 },
  row: { display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12 },
  label: { color: COLORS.muted, fontSize: 12, textTransform: 'capitalize' },
  value: { margin: 0, color: COLORS.plum, fontSize: 13, overflowWrap: 'anywhere' },
};
