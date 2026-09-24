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

export function CreativeDirectionSelector({ label, options, value, onChange, colors = ['#FF2DA0', '#39E6F2'] }) {
  return <div className="studio-creative-direction" role="group" aria-label={label}>{options.map(({ value: optionValue, label: optionLabel }) => <button type="button" key={optionValue} aria-pressed={value === optionValue} onClick={() => onChange(optionValue)}><i data-direction={optionValue} style={{ '--direction-a': colors[0], '--direction-b': colors[1] }} aria-hidden="true" /><span>{optionLabel}</span><b aria-hidden="true">✓</b></button>)}</div>;
}

export function MaterialChoice({ selected, label, children, onClick }) {
  return <button type="button" className="studio-material-choice" aria-pressed={selected} onClick={onClick}>{children}<span>{label}</span><i aria-hidden="true" /></button>;
}

export function CreativeAction({ destructive = false, className = '', ...props }) {
  return <button type="button" className={`studio-creative-action${destructive ? ' studio-creative-action--destructive' : ''} ${className}`.trim()} {...props} />;
}
