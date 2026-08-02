import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './NailDesignStudio.css';

const TOOL_CATEGORIES = [
  'Polish', 'Technique', 'Brush', 'Sticker Studio™', 'Charm Studio™',
  'Gems', 'Effects', '3D Objects', 'Top Coat',
];

const COMPOSITIONS = [
  ['single', 'Single Nail'],
  ['left', 'Left Hand'],
  ['right', 'Right Hand'],
  ['full', 'Full Set'],
];

const WORKSPACES = [
  ['signature', 'Signature'],
  ['cherry-lacquer', 'Cherry Lacquer'],
  ['kikis', "Ki Ki's"],
];

const NAILS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

function NailModel({ name, selected, length, onSelect }) {
  const lengthScale = 0.72 + length / 100;
  return (
    <button
      type="button"
      className={`nail-stage__nail${selected ? ' nail-stage__nail--selected' : ''}`}
      aria-label={`${name} nail`}
      aria-pressed={selected}
      onClick={onSelect}
      onDoubleClick={onSelect}
      style={{ '--nail-length-scale': lengthScale }}
    >
      <span className="nail-stage__finger-tip" aria-hidden="true">
        <span className="nail-stage__editable-nail" />
      </span>
      <small>{name}</small>
    </button>
  );
}

const NailDesignStudio = forwardRef(function NailDesignStudio(_, ref) {
  const [designName, setDesignName] = useState('Untitled Design');
  const [dirty, setDirty] = useState(false);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [composition, setComposition] = useState('single');
  const [workspace, setWorkspace] = useState('signature');
  const [selectedNail, setSelectedNail] = useState('single');
  const [nailLength, setNailLength] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirty,
    prepareToLeave: async () => !dirty || window.confirm('You have unsaved Nail Design Studio work. Leave anyway?'),
  }), [dirty]);

  const resetCamera = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    resetCamera();
    setSelectedNail(composition === 'single' ? 'single' : `${composition}-index`);
  }, [composition]);

  const newDesign = () => {
    if (dirty && !window.confirm('Start a new design and discard unsaved changes?')) return;
    setDesignName('Untitled Design');
    setDirty(false);
    setComposition('single');
    setNailLength(50);
  };

  const duplicateDesign = () => {
    setDesignName((name) => `${name || 'Untitled Design'} Copy`);
    setDirty(true);
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
      <b aria-hidden="true">{icon}</b><span>{label}</span>
    </button>
  );

  const stageGroups = useMemo(() => {
    if (composition === 'single') return [{ id: 'single', label: '', nails: ['Nail'] }];
    if (composition === 'left' || composition === 'right') {
      return [{ id: composition, label: composition === 'left' ? 'Left Hand' : 'Right Hand', nails: NAILS }];
    }
    return [
      { id: 'left', label: 'Left Hand', nails: NAILS },
      { id: 'right', label: 'Right Hand', nails: NAILS },
    ];
  }, [composition]);

  const zoomBy = (delta) => setZoom((current) => Math.min(4, Math.max(0.35, Number((current + delta).toFixed(2)))));

  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    zoomBy(event.deltaY > 0 ? -0.1 : 0.1);
  };

  const handlePointerDown = (event) => {
    if (zoom <= 1) return;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX - pan.x, y: event.clientY - pan.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    setPan({ x: event.clientX - dragRef.current.x, y: event.clientY - dragRef.current.y });
  };

  const handlePointerUp = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };

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
            <button type="button" className="nail-design-studio__design-control" onClick={() => setSavedDesignsOpen((open) => !open)} aria-label={`Current design: ${designName}`} aria-expanded={savedDesignsOpen}>
              <small>Current Design</small><strong>{designName}</strong><span aria-hidden="true">⌄</span>
            </button>
            {command('Duplicate', '⧉', duplicateDesign)}
            {command(dirty ? 'Save Changes' : 'Saved', '●', () => setDirty(false), { primary: dirty, disabled: !dirty })}
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

      {(savedDesignsOpen || collectionOpen || detailsOpen) && (
        <div role="dialog" aria-label={savedDesignsOpen ? 'Saved Designs' : collectionOpen ? 'Add to Collection' : 'Design Details'} className="nail-design-studio__bottom-workspace nail-design-studio__dialog-strip">
          <strong>{savedDesignsOpen ? 'Saved Designs' : collectionOpen ? 'Add to Collection' : 'Design Details'}</strong>
          {detailsOpen && !savedDesignsOpen && !collectionOpen ? (
            <label>Design name<input value={designName} onChange={(event) => { setDesignName(event.target.value); setDirty(true); }} /></label>
          ) : <p className="nail-design-studio__placeholder-copy">This workspace will connect to its permanent library during the dedicated construction section.</p>}
        </div>
      )}

      <nav className="nail-design-studio__tool-ribbon" aria-label="Nail design tools">
        {TOOL_CATEGORIES.map((tool) => <button key={tool} type="button">{tool}</button>)}
      </nav>

      <div className={`nail-design-studio__workspace${leftPanelOpen ? '' : ' nail-design-studio__workspace--left-closed'}${rightPanelOpen ? '' : ' nail-design-studio__workspace--right-closed'}`}>
        <aside className={`nail-design-studio__panel nail-design-studio__panel--left${leftPanelOpen ? '' : ' nail-design-studio__panel--collapsed'}`} aria-label="Creative tools panel">
          <button className="nail-design-studio__panel-toggle" type="button" onClick={() => setLeftPanelOpen((open) => !open)} aria-expanded={leftPanelOpen}>{leftPanelOpen ? '‹' : '›'}</button>
          {leftPanelOpen && <><h2>Creative Tools</h2><p className="nail-design-studio__placeholder-copy">Tool settings will open here without replacing the Nail Desk.</p></>}
        </aside>

        <main className="nail-design-studio__desk" aria-label="Nail Desk">
          <div className="nail-design-studio__desk-header">
            <div><h2>Nail Desk</h2><p>{composition === 'full' ? 'Full Set' : COMPOSITIONS.find(([id]) => id === composition)?.[1]}</p></div>
            <div className="nail-design-studio__composition-tabs" aria-label="Composition view">
              {COMPOSITIONS.map(([id, label]) => <button key={id} type="button" className={composition === id ? 'is-active' : ''} onClick={() => setComposition(id)}>{label}</button>)}
            </div>
          </div>

          <section
            className={`nail-stage nail-stage--${workspace}`}
            aria-label="Nail Stage Container"
            onWheel={handleWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="nail-stage__camera" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}>
              <div className={`nail-stage__composition nail-stage__composition--${composition}`}>
                {stageGroups.map((group) => (
                  <div className="nail-stage__hand" key={group.id}>
                    {group.label && <strong>{group.label}</strong>}
                    <div className="nail-stage__nail-row">
                      {group.nails.map((name, index) => {
                        const id = composition === 'single' ? 'single' : `${group.id}-${name.toLowerCase()}`;
                        return <NailModel key={id} name={composition === 'single' ? 'Single Nail' : name} selected={selectedNail === id} length={nailLength + (index === 2 ? 8 : 0)} onSelect={() => setSelectedNail(id)} />;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="nail-stage__controls" aria-label="Canvas zoom controls">
              <button type="button" onClick={() => zoomBy(-0.1)} aria-label="Zoom out">−</button>
              <button type="button" onClick={resetCamera} className="nail-stage__zoom-readout">{Math.round(zoom * 100)}%</button>
              <button type="button" onClick={() => zoomBy(0.1)} aria-label="Zoom in">＋</button>
              <button type="button" onClick={resetCamera}>Fit</button>
            </div>
          </section>
        </main>

        <aside className={`nail-design-studio__panel nail-design-studio__panel--right${rightPanelOpen ? '' : ' nail-design-studio__panel--collapsed'}`} aria-label="Design properties panel">
          <button className="nail-design-studio__panel-toggle" type="button" onClick={() => setRightPanelOpen((open) => !open)} aria-expanded={rightPanelOpen}>{rightPanelOpen ? '›' : '‹'}</button>
          {rightPanelOpen && <>
            <h2>Design Properties</h2>
            <label className="nail-design-studio__field">Nail length <output>{nailLength}%</output><input type="range" min="10" max="100" value={nailLength} onChange={(event) => { setNailLength(Number(event.target.value)); setDirty(true); }} /></label>
            <label className="nail-design-studio__field">Workspace Surface<select value={workspace} onChange={(event) => setWorkspace(event.target.value)}>{WORKSPACES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <p className="nail-design-studio__placeholder-copy">Long nails scale within Fit to View. Zoom beyond the viewport to pan inside the same full-size stage.</p>
          </>}
        </aside>
      </div>

      <footer className="nail-design-studio__bottom-workspace">
        <strong>Workspace</strong>
        <p className="nail-design-studio__placeholder-copy">One full-size Nail Stage Container now supports Single Nail, Left Hand, Right Hand, and Full Set compositions with a shared camera.</p>
      </footer>
    </section>
  );
});

export default NailDesignStudio;