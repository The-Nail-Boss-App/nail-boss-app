import { act } from 'react';
import { createRoot } from 'react-dom/client';

global.IS_REACT_ACT_ENVIRONMENT = true;
import { CreativeColor, CreativeModeSelector, CreativeSlider, NailTipPreview } from './StudioPrimitives';

describe('AnitaSet Studio creative primitives', () => {
  let container;
  let root;
  beforeEach(() => { container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  it('keeps mode selection semantic and keyboard-native', () => {
    const onChange = jest.fn();
    act(() => root.render(<CreativeModeSelector label="Workspace mode" value="one" onChange={onChange} options={[{ value: 'one', label: 'One' }, { value: 'set', label: 'Set' }]} />));
    expect(container.querySelector('[role="group"]').getAttribute('aria-label')).toBe('Workspace mode');
    expect(container.querySelector('button').getAttribute('aria-pressed')).toBe('true');
    act(() => container.querySelectorAll('button')[1].click());
    expect(onChange).toHaveBeenCalledWith('set');
  });

  it('exposes the original range and color inputs', () => {
    act(() => root.render(<><CreativeSlider label="Direction" valueLabel="90°" aria-label="Direction" min="0" max="360" value="90" onChange={() => {}} /><CreativeColor label="Color" value="#FF2DA0" onChange={() => {}} /></>));
    expect(container.querySelector('input[type="range"]').getAttribute('max')).toBe('360');
    expect(container.querySelector('output').textContent).toBe('90°');
    expect(container.querySelector('input[type="color"]').value).toBe('#ff2da0');
  });

  it('documents previews with the free edge at the bottom', () => {
    act(() => root.render(<NailTipPreview style="v" />));
    expect(container.querySelector('.studio-nail-tip-preview__tip').getAttribute('d')).toContain('L20 37');
  });
});
