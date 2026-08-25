import './StudioPrimitives.css';

export function CreativeSlider({ label, valueLabel, ...inputProps }) {
  const min = Number(inputProps.min ?? 0);
  const max = Number(inputProps.max ?? 100);
  const value = Number(inputProps.value ?? min);
  const fill = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return <label className="studio-creative-slider"><span>{label}</span><output>{valueLabel}</output><input {...inputProps} type="range" style={{ '--slider-fill': `${fill}%` }} /></label>;
}

export function CreativeColor({ label, value, onChange, hexValue = value, onHexChange, onHexBlur, colorAriaLabel = `${label} color`, hexAriaLabel = `${label} HEX` }) {
  return <label className="studio-creative-color"><span className="studio-creative-color__label">{label}</span><span className="studio-creative-color__control"><i style={{ '--creative-color': value }} aria-hidden="true" /><input className="studio-creative-color__picker" aria-label={colorAriaLabel} type="color" value={value} onChange={onChange} /><input className="studio-creative-color__hex" aria-label={hexAriaLabel} value={hexValue} maxLength="7" onChange={onHexChange || onChange} onBlur={onHexBlur} /></span></label>;
}

export function CreativeModeSelector({ label, options, value, onChange }) {
  return <div className="studio-creative-mode" role="group" aria-label={label}>{options.map(({ value: optionValue, label: optionLabel }) => <button type="button" key={optionValue} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}><span>{optionLabel}</span><i aria-hidden="true" /></button>)}</div>;
}

export function MaterialChoice({ selected, label, children, onClick }) {
  return <button type="button" className="studio-material-choice" aria-pressed={selected} onClick={onClick}>{children}<span>{label}</span><i aria-hidden="true" /></button>;
}

export function CreativeAction({ destructive = false, className = '', ...props }) {
  return <button type="button" className={`studio-creative-action${destructive ? ' studio-creative-action--destructive' : ''} ${className}`.trim()} {...props} />;
}

export function NailTipPreview({ style }) {
  // Permanent UI rule: the nail free edge/tip is always at the bottom.
  const paths = {
    classic: 'M7 28 Q20 35 33 28 L33 39 Q20 44 7 39Z',
    deep: 'M7 23 Q20 38 33 23 L33 39 Q20 44 7 39Z',
    angled: 'M7 22 Q20 33 33 30 L33 39 Q20 44 7 39Z',
    v: 'M7 26 L20 37 L33 26 L33 39 Q20 44 7 39Z',
    reverse: 'M7 7 L33 7 L30 17 Q20 8 10 17Z',
  };
  return <svg className="studio-nail-tip-preview" viewBox="0 0 40 48" aria-hidden="true" focusable="false"><path className="studio-nail-tip-preview__nail" d="M8 5 Q20 1 32 5 L35 36 Q34 45 20 47 Q6 45 5 36Z" /><path className="studio-nail-tip-preview__tip" d={paths[style] || paths.classic} /></svg>;
}
