import { FRENCH_TIP_PRESETS, FRENCH_TIP_STYLES, normalizeFrenchTipData } from '../design-studio/blueprint';

export const EMPTY_FRENCH_TIPS = () => Array(10).fill(null);

export function loadFrenchTips(document) {
  const stored = document?.metadata?.frenchTips;
  if (Array.isArray(stored)) {
    return EMPTY_FRENCH_TIPS().map((_, index) => stored[index] ? normalizeFrenchTipData(stored[index]) : null);
  }

  // Legacy Studio designs keep French Tip as a distinct layer on each nail.
  const legacyNails = document?.blueprint?.nails || document?.nails;
  if (!Array.isArray(legacyNails)) return EMPTY_FRENCH_TIPS();
  return EMPTY_FRENCH_TIPS().map((_, index) => {
    const layer = legacyNails[index]?.layers?.find((candidate) => candidate?.type === 'frenchTip' && candidate.visible !== false);
    return layer ? normalizeFrenchTipData(layer.data) : null;
  });
}

export function frenchTipPathForBounds(data, bounds) {
  const tip = normalizeFrenchTipData(data);
  const width = bounds.width * tip.smileWidth;
  const left = bounds.x + (bounds.width - width) / 2;
  const right = left + width;
  const bottom = bounds.y + bounds.height;
  const tipY = bottom - bounds.height * tip.tipHeight;
  const depth = bounds.height * tip.smileDepth;
  const curveLift = bounds.height * tip.smileCurve * .12;
  const center = bounds.x + bounds.width / 2;

  if (tip.style === 'reverse') {
    const cutY = bounds.y + bounds.height * tip.tipHeight;
    return `M ${bounds.x} ${bounds.y} L ${bounds.x + bounds.width} ${bounds.y} L ${right} ${cutY} Q ${center} ${cutY - depth - curveLift} ${left} ${cutY} Z`;
  }
  if (tip.style === 'v') {
    return `M ${left} ${tipY} L ${center} ${tipY + depth + bounds.height * .08} L ${right} ${tipY} L ${bounds.x + bounds.width} ${bottom} L ${bounds.x} ${bottom} Z`;
  }
  const angle = tip.style === 'angled' ? bounds.height * .18 : 0;
  const deep = tip.style === 'deep' ? bounds.height * .12 : 0;
  return `M ${left} ${tipY - angle} Q ${center} ${tipY + depth + curveLift + deep} ${right} ${tipY + angle} L ${bounds.x + bounds.width} ${bottom} L ${bounds.x} ${bottom} Z`;
}

export function FrenchTipRegion({ data, nailPath, bounds, uid }) {
  if (!data) return null;
  const normalized = normalizeFrenchTipData(data);
  const clipId = `${uid}-french-tip-clip`;
  return <g data-design-layer="french-tip" data-french-tip-style={normalized.style} pointerEvents="none">
    <defs><clipPath id={clipId}><path d={nailPath} /></clipPath></defs>
    <path d={frenchTipPathForBounds(normalized, bounds)} fill={normalized.colorHex} clipPath={`url(#${clipId})`} />
  </g>;
}

export function FrenchTipControls({ value, scope, onScopeChange, onChange, onApply, notice }) {
  const data = normalizeFrenchTipData(value || {});
  const patch = (next) => onChange(normalizeFrenchTipData({ ...data, ...next }));
  return <section className="nail-design-studio__french-tip" aria-label="French Tip controls" data-testid="french-tip-controls">
    <label><input type="checkbox" aria-label="Enable French Tip" checked={Boolean(value)} onChange={(event) => event.target.checked ? onChange(data) : onChange(null)} /> Enable French Tip</label>
    <fieldset disabled={!value}>
      <label>Preset<select aria-label="French Tip preset" value={data.preset} onChange={(event) => patch({ ...FRENCH_TIP_PRESETS[event.target.value], preset: event.target.value })}>{Object.keys(FRENCH_TIP_PRESETS).map((preset) => <option key={preset}>{preset}</option>)}</select></label>
      <label>Style<select aria-label="French Tip style" value={data.style} onChange={(event) => patch({ style: event.target.value })}>{FRENCH_TIP_STYLES.map((style) => <option key={style}>{style}</option>)}</select></label>
      <label>Tip color<input aria-label="French Tip color" type="color" value={data.colorHex} onChange={(event) => patch({ colorHex: event.target.value.toUpperCase() })} /></label>
      <label>Tip height <output>{Math.round(data.tipHeight * 100)}%</output><input aria-label="French Tip height" type="range" min="8" max="72" value={Math.round(data.tipHeight * 100)} onChange={(event) => patch({ tipHeight: Number(event.target.value) / 100 })} /></label>
      <label>Smile curve <output>{Math.round(data.smileCurve * 100)}%</output><input aria-label="French Tip smile curve" type="range" min="0" max="100" value={Math.round(data.smileCurve * 100)} onChange={(event) => patch({ smileCurve: Number(event.target.value) / 100 })} /></label>
      <label>Smile depth <output>{Math.round(data.smileDepth * 100)}%</output><input aria-label="French Tip smile depth" type="range" min="0" max="65" value={Math.round(data.smileDepth * 100)} onChange={(event) => patch({ smileDepth: Number(event.target.value) / 100 })} /></label>
      <label>Smile width <output>{Math.round(data.smileWidth * 100)}%</output><input aria-label="French Tip smile width" type="range" min="25" max="100" value={Math.round(data.smileWidth * 100)} onChange={(event) => patch({ smileWidth: Number(event.target.value) / 100 })} /></label>
    </fieldset>
    <section className="nail-design-studio__apply-scope" role="radiogroup" aria-labelledby="apply-french-heading"><h3 id="apply-french-heading">Apply French Tip To</h3>{[['current','Current Nail'],['selected','Selected Nails'],['left','Left Hand'],['right','Right Hand'],['full','Full Set']].map(([id, label]) => <label key={id}><input type="radio" name="french-scope" value={id} checked={scope === id} onChange={() => onScopeChange(id)} />{label}</label>)}</section>
    <button type="button" className="nail-design-studio__polish-primary" disabled={!value} onClick={onApply}>Apply French Tip</button>
    <output className="nail-design-studio__polish-notice" aria-live="polite">{notice}</output>
  </section>;
}
