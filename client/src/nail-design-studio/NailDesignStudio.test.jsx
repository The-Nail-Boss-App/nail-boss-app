import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import NailDesignStudio from './NailDesignStudio';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('adaptive Nail Desk', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => root.render(<NailDesignStudio />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const click = (label) => act(() => container.querySelector(`[aria-label="${label}"]`).click());

  it('uses one stage and camera across every composition, including a ten-nail full set', () => {
    const stage = container.querySelector('[aria-label="Nail Stage Container"]');
    const camera = stage.querySelector('.nail-stage__camera');

    act(() => Array.from(container.querySelectorAll('.nail-design-studio__composition-tabs button')).find((button) => button.textContent === 'Full Set').click());

    expect(container.querySelector('[aria-label="Nail Stage Container"]')).toBe(stage);
    expect(stage.querySelector('.nail-stage__camera')).toBe(camera);
    expect(stage.querySelectorAll('.nail-stage__nail')).toHaveLength(10);
  });

  it('fits long nails and exposes focus and panel expansion controls', () => {
    const length = container.querySelector('input[type="range"]');
    act(() => {
      length.value = '100';
      length.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(container.textContent).toContain('100%');

    click('Focus Mode');
    expect(container.querySelector('.nail-design-studio__workspace').dataset.focusMode).toBe('true');
    click('Fit to View');
    expect(container.querySelector('.nail-stage__zoom-readout').textContent).toBe('100%');
    click('Exit Focus Mode');
    expect(container.querySelector('.nail-design-studio__workspace').dataset.focusMode).toBe('false');

    const panelToggle = container.querySelector('[aria-label="Creative tools panel"] .nail-design-studio__panel-toggle');
    act(() => panelToggle.click());
    expect(panelToggle.getAttribute('aria-expanded')).toBe('false');
  });
});
