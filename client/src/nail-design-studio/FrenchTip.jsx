import { useEffect, useState } from 'react';
import { FRENCH_TIP_STYLES, FRENCH_TIP_TYPES, normalizeFrenchTipData } from '../design-studio/blueprint';
import { MaterialLayers } from './MaterialRenderer';
import { CreativeColor, CreativeSlider, MaterialChoice, NailTipPreview } from './StudioPrimitives';

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
  const tipPath = frenchTipPathForBounds(normalized, bounds);
  return <g data-design-layer="french-tip" data-french-tip-style={normalized.style} data-french-tip-type={normalized.tipType} pointerEvents="none">
    <defs><clipPath id={clipId}><path d={nailPath} /></clipPath></defs>
    <g clipPath={`url(#${clipId})`}><MaterialLayers path={tipPath} surfaceBounds={bounds} finish={normalized.tipType} color={normalized.colorHex} uid={`${uid}-material`} baseProps={{ 'data-french-tip-material': normalized.tipType }} /></g>
  </g>;
}

const STYLE_LABELS = { classic: 'Classic', deep: 'Deep', angled: 'Angled', v: 'V-French', reverse: 'Reverse' };
function MaterialSwatch({ type, color }) {
  return <span className="nail-design-studio__material-nail" data-material={type.toLowerCase()} data-tip-orientation="down" style={{ '--material-color': color }} aria-hidden="true"><i /><b /></span>;
}

export function FrenchTipControls({ value, scope, onScopeChange, onChange, onApply, notice }) {
  const data = normalizeFrenchTipData(value || {});
  const [colorDraft, setColorDraft] = useState(data.colorHex);
  useEffect(() => setColorDraft(data.colorHex), [data.colorHex]);
  const patch = (next) => onChange(normalizeFrenchTipData({ ...data, ...next }));
  return <section className="nail-design-studio__french-tip" aria-label="French Tip controls" data-testid="french-tip-controls">
    <div className="nail-design-studio__french-header"><div><span className="nail-design-studio__feature-kicker">Fashion the free edge</span><strong>French Tip</strong><small>Shape a distinct tip material with runway precision.</small></div><label className="nail-design-studio__french-toggle"><input type="checkbox" aria-label="Enable French Tip" checked={Boolean(value)} onChange={(event) => event.target.checked ? onChange(data) : onChange(null)} /><span aria-hidden="true" />Enable</label></div>
    <fieldset disabled={!value}>
      <section className="nail-design-studio__french-section" aria-labelledby="tip-type-heading"><h3 id="tip-type-heading">Tip Type</h3><div className="nail-design-studio__tip-types" role="group" aria-label="Tip Type">{FRENCH_TIP_TYPES.map((type) => <MaterialChoice key={type} label={type} selected={data.tipType === type} onClick={() => patch({ tipType: type })}><MaterialSwatch type={type} color={data.colorHex} /></MaterialChoice>)}</div></section>
      <section className="nail-design-studio__french-section" aria-labelledby="tip-style-heading"><h3 id="tip-style-heading">Tip Style</h3><div className="nail-design-studio__tip-styles" role="group" aria-label="Tip Style">{FRENCH_TIP_STYLES.map((style) => <button type="button" key={style} aria-pressed={data.style === style} onClick={() => patch({ style })}><NailTipPreview style={style} /><span>{STYLE_LABELS[style]}</span></button>)}</div></section>
      <section className="nail-design-studio__french-section nail-design-studio__tip-color" aria-labelledby="tip-color-heading"><h3 id="tip-color-heading">Tip Color</h3><CreativeColor label="French Tip Color" value={data.colorHex} hexValue={colorDraft} colorAriaLabel="French Tip color" hexAriaLabel="French Tip HEX" onChange={(event) => { const next = event.target.value.toUpperCase(); setColorDraft(next); patch({ colorHex: next }); }} onHexChange={(event) => { const next = event.target.value.toUpperCase(); if (/^#?[0-9A-F]{0,6}$/.test(next)) setColorDraft(next); }} onHexBlur={() => { if (/^#[0-9A-F]{6}$/.test(colorDraft)) patch({ colorHex: colorDraft }); else setColorDraft(data.colorHex); }} /></section>
      <section className="nail-design-studio__french-section nail-design-studio__tip-tuning" aria-labelledby="tip-tuning-heading"><h3 id="tip-tuning-heading">Fine Tuning</h3>{[
        ['Tip height', 'French Tip height', data.tipHeight, 8, 72, 'tipHeight'], ['Smile curve', 'French Tip smile curve', data.smileCurve, 0, 100, 'smileCurve'], ['Smile depth', 'French Tip smile depth', data.smileDepth, 0, 65, 'smileDepth'], ['Smile width', 'French Tip smile width', data.smileWidth, 25, 100, 'smileWidth'],
      ].map(([label, ariaLabel, current, min, max, key]) => <CreativeSlider key={key} label={label} valueLabel={`${Math.round(current * 100)}%`} aria-label={ariaLabel} min={min} max={max} value={Math.round(current * 100)} onChange={(event) => patch({ [key]: Number(event.target.value) / 100 })} />)}</section>
    </fieldset>
    <section className="nail-design-studio__apply-scope" role="radiogroup" aria-labelledby="apply-french-heading"><h3 id="apply-french-heading">Apply French Tip To</h3>{[['current','Current Nail'],['selected','Selected Nails'],['left','Left Hand'],['right','Right Hand'],['full','Full Set']].map(([id, label]) => <label key={id}><input type="radio" name="french-scope" value={id} checked={scope === id} onChange={() => onScopeChange(id)} />{label}</label>)}</section>
    <button type="button" className="nail-design-studio__polish-primary" disabled={!value} onClick={onApply}>Apply French Tip</button>
    <output className="nail-design-studio__polish-notice" aria-live="polite">{notice}</output>
  </section>;
}
