import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CanonicalNailPreview, FrenchTipControls, frenchTipPathForBounds, frenchTipTargetRegion } from './FrenchTip';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const coffin = { path: 'M 20 10 L 80 10 L 92 180 L 8 180 Z', bounds: { x: 8, y: 10, width: 84, height: 170 }, viewBox: '0 0 100 200', shapeId: 'coffin', maskId: 'coffin-mask' };
const almond = { path: 'M 50 8 C 80 8 90 100 50 190 C 10 100 20 8 50 8 Z', bounds: { x: 10, y: 8, width: 80, height: 182 }, viewBox: '0 0 100 200', shapeId: 'almond', maskId: 'almond-mask' };
const tip = { style: 'classic', tipType: 'Cream', colorHex: '#FF2DA0', tipHeight: .24, smileCurve: .5, smileDepth: .25, smileWidth: .9 };

describe('FT-F06 canonical French Tip controls', () => {
  let host;
  let root;
  beforeEach(() => { host = document.createElement('div'); document.body.appendChild(host); root = createRoot(host); });
  afterEach(() => { act(() => root.unmount()); host.remove(); });

  it('uses the active canonical path, follows shape changes, and remains tip-down', () => {
    act(() => root.render(<CanonicalNailPreview geometry={coffin}>{() => <path d={coffin.path} />}</CanonicalNailPreview>));
    expect(host.querySelector('clipPath path').getAttribute('d')).toBe(coffin.path);
    expect(host.querySelector('svg').dataset.tipOrientation).toBe('down');
    expect(host.querySelector('svg').getAttribute('transform')).toBeNull();
    act(() => root.render(<CanonicalNailPreview geometry={almond}>{() => <path d={almond.path} />}</CanonicalNailPreview>));
    expect(host.querySelector('clipPath path').getAttribute('d')).toBe(almond.path);
    expect(host.querySelector('svg').dataset.canonicalShape).toBe('almond');
  });

  it('renders every material and style with canonical clipping and shared French geometry', () => {
    act(() => root.render(<FrenchTipControls value={tip} geometry={coffin} scope="current" onScopeChange={() => {}} onChange={() => {}} onApply={() => {}} notice="" />));
    expect(host.querySelectorAll('[data-material-preview]')).toHaveLength(4);
    expect(host.querySelector('[data-particle-field="true"] circle')).toBeTruthy();
    expect(host.querySelectorAll('[data-french-preview-style]')).toHaveLength(5);
    expect(host.querySelectorAll('.studio-canonical-nail-preview')).toHaveLength(9);
    expect([...host.querySelectorAll('clipPath path')].every((path) => path.getAttribute('d') === coffin.path)).toBe(true);
    for (const path of host.querySelectorAll('[data-french-preview-style]')) {
      expect(path.getAttribute('d')).toBe(frenchTipPathForBounds({ ...tip, style: path.dataset.frenchPreviewStyle, tipHeight: path.dataset.frenchPreviewStyle === 'deep' ? .34 : .24, smileCurve: .58, smileDepth: path.dataset.frenchPreviewStyle === 'v' ? .42 : .28, smileWidth: .9 }, coffin.bounds));
    }
    expect(host.querySelector('[data-french-preview-style="reverse"]').closest('svg').dataset.tipOrientation).toBe('down');
  });

  it('exposes a frozen target only while French Tip exists', () => {
    expect(frenchTipTargetRegion(null, coffin)).toBeNull();
    const region = frenchTipTargetRegion(tip, coffin);
    expect(region).toMatchObject({ id: 'french-tip', label: 'French Tip', present: true, nailPath: coffin.path, shapeId: 'coffin' });
    expect(region.path).toBe(frenchTipPathForBounds(tip, coffin.bounds));
    expect(Object.isFrozen(region)).toBe(true);
    expect(Object.isFrozen(region.bounds)).toBe(true);
  });
});
