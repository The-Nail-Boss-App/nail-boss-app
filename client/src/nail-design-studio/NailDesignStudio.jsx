import { forwardRef, useImperativeHandle, useState } from 'react';
import './NailDesignStudio.css';

const TOOL_CATEGORIES = [
  'Polish',
  'Technique',
  'Brush',
  'Sticker Studio™',
  'Charm Studio™',
  'Gems',
  'Effects',
  '3D Objects',
  'Top Coat',
];

const NailDesignStudio = forwardRef(function NailDesignStudio(_, ref) {
  const [designName, setDesignName] = useState('Untitled Design');
  const [dirty, setDirty] = useState(false);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirty,
    prepareToLeave: async () => {
      if (!dirty) return true;
      return window.confirm('You have unsaved Nail Design Studio work. Leave anyway?');
    },
  }), [dirty]);

  const newDesign = () => {
    if (dirty && !window.confirm('Start a new design and discard unsaved changes?')) return;
    setDesignName('Untitled Design');
    setDirty(false);
  };

  const duplicateDesign = () => {
    setDesignName((name) => `${name || 'Untitled Design'} Copy`);
    setDirty(true);
  };

  const saveDesign = () => {
    setDirty(false);
  };

  const command = (label, icon, onClick, options = {}) => (
    <button
      key={label}
      type="button"
      className={`nail-design-studio__command-button${options.primary ? ' nail-design-studio__command-button--primary' : ''}`}
      onClick={onClick}
      disabled={options.disabled}
      aria-label={label}
      title={label}
    >
      <b aria-hidden="true">{icon}</b>
      <span>{label}</span>
    </button>
  );

  return (
    <section className="nail-design-studio" data-testid="new-nail-design-studio" aria-label="Nail Design Studio">
      <header className="nail-design-studio__command-bar" data-testid="nail-design-studio-command-bar">
        <div className="nail-design-studio__brand">
          <img src="/anitaset-logo-main.png" alt="AnitaSet" />
          <h1>Nail Design Studio</h1>
        </div>

        <div className="nail-design-studio__command-groups">
          <div className="nail-design-studio__command-group" aria-label="Design management">
            {command('New Design', '＋', newDesign)}
            {command('Open Saved Design', '▣', () => setSavedDesignsOpen((open) => !open))}
            <button
              type="button"
              className="nail-design-studio__design-control"
              onClick={() => setSavedDesignsOpen((open) => !open)}
              aria-label={`Current design: ${designName}`}
              aria-expanded={savedDesignsOpen}
            >
              <small>Current Design</small>
              <strong>{designName}</strong>
              <span aria-hidden="true">⌄</span>
            </button>
            {command('Duplicate', '⧉', duplicateDesign)}
            {command(dirty ? 'Save Changes' : 'Saved', '●', saveDesign, { primary: dirty, disabled: !dirty })}
          </div>

          <div className="nail-design-studio__command-group" aria-label="Editing">
            {command('Undo', '↶', () => {}, { disabled: true })}
            {command('Redo', '↷', () => {}, { disabled: true })}
          </div>

          <div className="nail-design-studio__command-group" aria-label="Publishing and organization">
            {command('Share', '↗', () => {})}
            {command('Export', '⇩', () => {})}
            {command('Add to Collection', '♡', () => setCollectionOpen((open) => !open))}
          </div>

          <div className="nail-design-studio__command-group" aria-label="Information">
            {command('Design Details', 'ⓘ', () => setDetailsOpen((open) => !open))}
          </div>
        </div>
      </header>

      {savedDesignsOpen && (
        <div role="dialog" aria-label="Saved Designs" className="nail-design-studio__bottom-workspace">
          <strong>Saved Designs</strong>
          <p className="nail-design-studio__placeholder-copy">The new Saved Designs library will be connected during its dedicated construction section.</p>
        </div>
      )}

      {collectionOpen && (
        <div role="dialog" aria-label="Add to Collection" className="nail-design-studio__bottom-workspace">
          <strong>Add to Collection</strong>
          <p className="nail-design-studio__placeholder-copy">Collection organization will connect to the permanent workspace without reusing the legacy studio layout.</p>
        </div>
      )}

      {detailsOpen && (
        <div role="dialog" aria-label="Design Details" className="nail-design-studio__bottom-workspace">
          <strong>Design Details</strong>
          <label>
            Design name
            <input
              value={designName}
              onChange={(event) => {
                setDesignName(event.target.value);
                setDirty(true);
              }}
            />
          </label>
        </div>
      )}

      <nav className="nail-design-studio__tool-ribbon" aria-label="Nail design tools">
        {TOOL_CATEGORIES.map((tool) => (
          <button key={tool} type="button">{tool}</button>
        ))}
      </nav>

      <div className="nail-design-studio__workspace">
        <aside className="nail-design-studio__panel" aria-label="Creative tools panel">
          <h2>Creative Tools</h2>
          <p className="nail-design-studio__placeholder-copy">This is the new left workspace. It will be built section by section from the Master Blueprint.</p>
        </aside>

        <main className="nail-design-studio__desk" aria-label="Nail Desk">
          <h2>Nail Desk</h2>
          <div className="nail-design-studio__desk-surface">New canvas construction area</div>
        </main>

        <aside className="nail-design-studio__panel" aria-label="Design properties panel">
          <h2>Design Properties</h2>
          <p className="nail-design-studio__placeholder-copy">This is the new right workspace. The legacy panel stack is not mounted here.</p>
        </aside>
      </div>

      <footer className="nail-design-studio__bottom-workspace">
        <strong>Workspace</strong>
        <p className="nail-design-studio__placeholder-copy">Layers, history, assets, and view controls will be added to this new module in their approved construction order.</p>
      </footer>
    </section>
  );
});

export default NailDesignStudio;
