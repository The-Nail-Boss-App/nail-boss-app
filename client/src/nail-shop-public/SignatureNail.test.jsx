import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import SignatureNail, { SUPPORTED_NAIL_SHAPES } from './SignatureNail';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container; let root;
function renderNail(props) { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); act(() => root.render(<SignatureNail {...props} />)); }

describe('SignatureNail', () => {
  afterEach(() => { if (root) act(() => root.unmount()); container?.remove(); container = null; root = null; });

  it('renders from a design prop', () => {
    renderNail({ design: { title: 'Velvet Test Nail', subtitle: 'Custom public signature.', shape: 'square' } });
    expect(container.querySelector('[data-testid="signature-nail"]').getAttribute('data-shape')).toBe('square');
    expect(container.textContent).toContain('Velvet Test Nail');
    expect(container.textContent).toContain('Custom public signature.');
  });

  it('renders all supported shapes safely', () => {
    SUPPORTED_NAIL_SHAPES.forEach((shape) => {
      renderNail({ design: { shape, title: `${shape} nail` } });
      expect(container.querySelector('[data-testid="signature-nail"]').getAttribute('data-shape')).toBe(shape);
      expect(container.querySelector(`[data-testid="signature-nail-shape-${shape}"]`)).not.toBeNull();
      act(() => root.unmount()); container.remove(); container = null; root = null;
    });
  });

  it('accepts a size prop', () => {
    renderNail({ size: 180 });
    expect(container.querySelector('[data-testid="signature-nail"]').getAttribute('data-size')).toBe('180');
  });
});
