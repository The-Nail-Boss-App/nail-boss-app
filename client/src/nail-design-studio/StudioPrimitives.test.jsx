import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StudioAction, StudioChip, StudioContextPanel, StudioControlGroup, StudioIconButton, StudioSection, StudioTile } from './StudioPrimitives';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('DS-UI01A Studio primitives', () => {
  let container;
  let root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  it('exposes feature-agnostic structure while preserving native semantics', async () => {
    await act(async () => root.render(
      <StudioSection title="Finish" help="Choose a surface response" aria-label="Finish controls">
        <StudioControlGroup>
          <StudioTile selected>Gloss</StudioTile>
          <StudioTile editing>Edit color</StudioTile>
          <StudioTile unavailable>Coming soon</StudioTile>
        </StudioControlGroup>
      </StudioSection>,
    ));

    expect(container.querySelector('section').getAttribute('aria-label')).toBe('Finish controls');
    expect(container.querySelector('.studio-section__title').textContent).toBe('Finish');
    expect(container.querySelector('[aria-selected="true"]').textContent).toBe('Gloss');
    expect(container.querySelector('[data-editing="true"]').textContent).toBe('Edit color');
    expect(container.querySelector('[data-unavailable="true"]').disabled).toBe(false);
  });

  it('provides actions, chips, icon labels, and contextual surfaces', async () => {
    await act(async () => root.render(<StudioContextPanel aria-label="Layer editor">
      <StudioAction variant="primary">Apply</StudioAction>
      <StudioAction variant="destructive">Delete</StudioAction>
      <StudioIconButton label="Close editor">×</StudioIconButton>
      <StudioChip pressed>All nails</StudioChip>
    </StudioContextPanel>));

    expect(container.querySelector('.studio-context-panel').getAttribute('aria-label')).toBe('Layer editor');
    expect(container.querySelector('.studio-action--primary').type).toBe('button');
    expect(container.querySelector('.studio-action--destructive').textContent).toBe('Delete');
    expect(container.querySelector('.studio-icon-button').getAttribute('aria-label')).toBe('Close editor');
    expect(container.querySelector('.studio-chip').getAttribute('aria-pressed')).toBe('true');
  });
});
