import { forwardRef, useImperativeHandle, useState } from 'react';
import './NailDesignStudio.css';

const TOOL_CATEGORIES = [
  'Polish', 'Technique', 'Brush', 'Sticker Studio™', 'Charm Studio™',
  'Gems', 'Effects', '3D Objects', 'Top Coat',
];

const ICON_PATHS = {
  new: 'M12 5v14M5 12h14',
  open: 'M3 7.5h6l2 2H21l-2 9H5l-2-11Z',
  duplicate: 'M8 8h11v11H8zM5 16H4V5h11v1',
  save: 'M5 4h12l2 2v14H5zM8 4v6h8V4M8 20v-7h8v7',
  undo: 'm9 7-5 5 5 5M5 12h8a6 6 0 0 1 6 6',
  redo: 'm15 7 5 5-5 5M19 12h-8a6 6 0 0 0-6 6',
  share: 'M14 5h5v5M19 5l-8 8M19 13v6H5V7h6',
  export: 'M12 4v11m-4-4 4 4 4-4M5 19h14',
  collection: 'M20 9c0 5-8 10-8 10S4 14 4 9a4 4 0 0 1 7-2.6L12 8l1-1.6A4 4 0 0 1 20 9Z',
  info: 'M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

function CommandIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

const NailDesignStudio = forwardRef(function NailDesignStudio(_, ref) {
  const [designName, setDesignName] = useState('Untitled Design');
  const [dirty, setDirty] = useState(false);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftDesignName, setDraftDesignName] = useState(designName);

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirty,
    prepareToLeave: async () => !dirty || window.confirm('You have unsaved Nail Design Studio work. Leave anyway?'),
  }), [dirty]);

  const newDesign = () => {
    if (dirty && !window.confirm('Start a new design and discard unsaved changes?')) return;
    setDesignName('Untitled Design');
    setDirty(false);
  };
  const openSavedDesigns = () => setSavedDesignsOpen((open) => !open);
  const duplicateDesign = () => {
    setDesignName((name) => `${name || 'Untitled Design'} Copy`);
    setDirty(true);
  };
  const saveDesign = () => setDirty(false);
  const beginRename = () => {
    setDraftDesignName(designName);
    setIsRenaming(true);
  };
  const cancelRename = () => {
    setDraftDesignName(designName);
    setIsRenaming(false);
  };
  const commitRename = () => {
    const nextName = draftDesignName.trim();
    if (nextName && nextName !== designName) {
      setDesignName(nextName);
      setDirty(true);
    }
    setIsRenaming(false);
  };

  const command = (label, icon, onClick, options = {}) => (
    <button
      key={label}
      type="button"
      className={`nail-design-studio__command-button${options.primary ? ' nail-design-studio__command-button--primary' : ''}`}
      onClick={onClick}
      disabled={options.disabled}
      aria-label={options.ariaLabel || label}
      title={options.ariaLabel || label}
    >
      <CommandIcon name={icon} />
      <span>{label}</span>
      {options.status && <i className="nail-design-studio__command-status" aria-hidden="true" />}
    </button>
  );

  return (
    <section className="nail-design-studio" data-testid="new-nail-design-studio" aria-label="Nail Design Studio">
      <header className="nail-design-studio__command-bar" data-testid="nail-design-studio-command-bar">
        <div className="nail-design-studio__brand">
          <img src="/anitaset-logo-main.png" alt="AnitaSet" />
          <span className="nail-design-studio__brand-divider" aria-hidden="true" />
          <h1>Nail Design Studio<sup>™</sup></h1>
        </div>

        <div className="nail-design-studio__command-groups">
          <section className="nail-design-studio__command-group nail-design-studio__command-group--design" aria-label="Design">
            <h2>Design</h2>
            <div className="nail-design-studio__command-row">
              {command('New', 'new', newDesign, { ariaLabel: 'New Design' })}
              {command('Open', 'open', openSavedDesigns, { ariaLabel: 'Open Saved Design' })}
              <div className="nail-design-studio__design-control">
                <button type="button" className="nail-design-studio__design-selector" onClick={openSavedDesigns}
                  aria-label={`Current Design: ${designName}`} title={`Current Design: ${designName}`} aria-haspopup="dialog" aria-expanded={savedDesignsOpen}>
                  <small>Current Design</small><span aria-hidden="true">⌄</span>
                </button>
                {isRenaming ? (
                  <input
                    className="nail-design-studio__design-name-input"
                    value={draftDesignName}
                    onChange={(event) => setDraftDesignName(event.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitRename();
                      if (event.key === 'Escape') cancelRename();
                    }}
                    aria-label="Rename design"
                    autoFocus
                  />
                ) : (
                  <button type="button" className="nail-design-studio__design-name" onClick={beginRename} title="Click to rename design">
                    {designName}
                  </button>
                )}
              </div>
              {command('Duplicate', 'duplicate', duplicateDesign)}
              {command(dirty ? 'Save Changes' : 'Saved', 'save', saveDesign, {
                primary: dirty, disabled: !dirty, ariaLabel: dirty ? 'Save Changes' : 'Saved', status: dirty,
              })}
            </div>
          </section>

          <section className="nail-design-studio__command-group" aria-label="Edit">
            <h2>Edit</h2><div className="nail-design-studio__command-row">
              {command('Undo', 'undo', () => {}, { disabled: true })}
              {command('Redo', 'redo', () => {}, { disabled: true })}
            </div>
          </section>

          <section className="nail-design-studio__command-group nail-design-studio__command-group--publish" aria-label="Publish">
            <h2>Publish</h2><div className="nail-design-studio__command-row">
              {command('Share', 'share', () => {})}
              {command('Export', 'export', () => {})}
              {command('Add to Collection', 'collection', () => setCollectionOpen((open) => !open))}
            </div>
          </section>

          <section className="nail-design-studio__command-group" aria-label="Info">
            <h2>Info</h2><div className="nail-design-studio__command-row">
              {command('Design Details', 'info', () => setDetailsOpen((open) => !open))}
            </div>
          </section>
        </div>
      </header>

      {savedDesignsOpen && <div role="dialog" aria-label="Saved Designs" className="nail-design-studio__bottom-workspace"><strong>Saved Designs</strong><p className="nail-design-studio__placeholder-copy">The new Saved Designs library will be connected during its dedicated construction section.</p></div>}
      {collectionOpen && <div role="dialog" aria-label="Add to Collection" className="nail-design-studio__bottom-workspace"><strong>Add to Collection</strong><p className="nail-design-studio__placeholder-copy">Collection organization will connect to the permanent workspace without reusing the legacy studio layout.</p></div>}
      {detailsOpen && <div role="dialog" aria-label="Design Details" className="nail-design-studio__bottom-workspace"><strong>Design Details</strong><label>Design name<input value={designName} onChange={(event) => { setDesignName(event.target.value); setDirty(true); }} /></label></div>}

      <nav className="nail-design-studio__tool-ribbon" aria-label="Nail design tools">
        {TOOL_CATEGORIES.map((tool) => <button key={tool} type="button">{tool}</button>)}
      </nav>
      <div className="nail-design-studio__workspace">
        <aside className="nail-design-studio__panel" aria-label="Creative tools panel"><h2>Creative Tools</h2><p className="nail-design-studio__placeholder-copy">This is the new left workspace. It will be built section by section from the Master Blueprint.</p></aside>
        <main className="nail-design-studio__desk" aria-label="Nail Desk"><h2>Nail Desk</h2><div className="nail-design-studio__desk-surface">New canvas construction area</div></main>
        <aside className="nail-design-studio__panel" aria-label="Design properties panel"><h2>Design Properties</h2><p className="nail-design-studio__placeholder-copy">This is the new right workspace. The legacy panel stack is not mounted here.</p></aside>
      </div>
      <footer className="nail-design-studio__bottom-workspace"><strong>Workspace</strong><p className="nail-design-studio__placeholder-copy">Layers, history, assets, and view controls will be added to this new module in their approved construction order.</p></footer>
    </section>
  );
});

export default NailDesignStudio;
