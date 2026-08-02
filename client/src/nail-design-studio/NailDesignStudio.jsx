import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import './NailDesignStudio.css';

const TOOL_CATEGORIES = [
  { id: 'polish', label: 'Polish', accent: '#FF2DA0', icon: 'M8 3h8v4l2 3v11H6V10l2-3V3Zm0 8h10M10 3v4h4V3' },
  { id: 'technique', label: 'Technique', accent: '#F5C04A', icon: 'm4 20 3.5-1 10-10-2.5-2.5-10 10L4 20Zm12-15 1.5-1.5 3 3L19 8' },
  { id: 'brush', label: 'Brush', accent: '#FF7A45', icon: 'M14 4 20 2l-2 6-8 8M10 16c0 3-2 5-6 5 1-1 0-4 2-6 1-1 3-1 4 1Z' },
  { id: 'sticker-studio', label: 'Sticker Studio™', accent: '#B96CFF', icon: 'M5 4h11l3 3v11a2 2 0 0 1-2 2H5V4Zm11 0v4h4M8 12h8M8 16h5' },
  { id: 'charm-studio', label: 'Charm Studio™', accent: '#34E5F2', icon: 'M12 3v4m-4-2h8m-4 2 6 5-6 9-6-9 6-5Zm0 4v6m-3-3h6' },
  { id: 'gems', label: 'Gems', accent: '#68B7FF', icon: 'm4 9 4-5h8l4 5-8 11L4 9Zm0 0h16M8 4l4 5 4-5m-4 5v11' },
  { id: 'effects', label: 'Effects', accent: '#C8FF4A', icon: 'm12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3Z' },
  { id: '3d-objects', label: '3D Objects', accent: '#22F0C7', icon: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9' },
  { id: 'top-coat', label: 'Top Coat', accent: '#FF6FCF', icon: 'M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Zm-3 12a3 3 0 0 0 3 3' },
];

function ToolIcon({ tool }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={tool.icon} /></svg>;
}

const ICON_PATHS = {
  new: 'M12 5v14M5 12h14',
  open: 'M3 7.5h6l2 2H21l-2 9H5l-2-11Z',
  duplicate: 'M8 8h11v11H8zM5 16H4V5h11v1',
  save: 'M5 4h12l2 2v14H5zM8 4v6h8V4M8 20v-7h8v7',
  undo: 'm9 7-5 5 5 5M5 12h8a6 6 0 0 1 6 6',
  redo: 'm15 7 5 5-5 5M19 12h-8a6 6 0 0 0-6 6',
  share: 'M18 8a3 3 0 1 0-2.8-4M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm12-2a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM8.7 16.4l6.6-3.8M8.7 7.6l6.6 3.8',
  export: 'M12 4v11m-4-4 4 4 4-4M5 19h14',
  collection: 'M20 9c0 5-8 10-8 10S4 14 4 9a4 4 0 0 1 7-2.6L12 8l1-1.6A4 4 0 0 1 20 9Z',
  info: 'M12 11v6M12 7h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
};

function CommandIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS[name]} /></svg>;
}

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
    <button type="button" className={`nail-stage__nail${selected ? ' nail-stage__nail--selected' : ''}`}
      aria-label={`${name} nail`} aria-pressed={selected} onClick={onSelect} onDoubleClick={onSelect}
      style={{ '--nail-length-scale': lengthScale }}>
      <span className="nail-stage__finger-tip" aria-hidden="true"><span className="nail-stage__editable-nail" /></span>
      <small>{name}</small>
    </button>
  );
}

const NailDesignStudio = forwardRef(function NailDesignStudio(_, ref) {
  const [designName, setDesignName] = useState('Untitled Design');
  const [dirty, setDirty] = useState(false);
  const [saveState, setSaveState] = useState('Saved');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftDesignName, setDraftDesignName] = useState(designName);
  const [activeToolId, setActiveToolId] = useState(TOOL_CATEGORIES[0].id);
  const [focusedToolIndex, setFocusedToolIndex] = useState(0);
  const cancelingRename = useRef(false);
  const toolRefs = useRef([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [composition, setComposition] = useState('single');
  const [workspace, setWorkspace] = useState('signature');
  const [selectedNail, setSelectedNail] = useState('single');
  const [nailLength, setNailLength] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const activeTool = TOOL_CATEGORIES.find((tool) => tool.id === activeToolId) || TOOL_CATEGORIES[0];

  useEffect(() => {
    toolRefs.current[focusedToolIndex]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [focusedToolIndex, activeToolId]);

  const focusTool = (index) => {
    setFocusedToolIndex(index);
    toolRefs.current[index]?.focus();
  };

  const handleToolKeyDown = (event, index) => {
    let nextIndex;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TOOL_CATEGORIES.length) % TOOL_CATEGORIES.length;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TOOL_CATEGORIES.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TOOL_CATEGORIES.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      focusTool(nextIndex);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveToolId(TOOL_CATEGORIES[index].id);
    }
  };

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirty,
    prepareToLeave: async () => !dirty || window.confirm('You have unsaved Nail Design Studio work. Leave anyway?'),
  }), [dirty]);

  const applyName = (nextName) => {
    if (nextName === designName) return;
    setHistory((items) => [...items, designName]);
    setFuture([]);
    setDesignName(nextName);
    setDirty(true);
    setSaveState('Save Changes');
  };
  const newDesign = () => {
    if (dirty && !window.confirm('Start a new design and discard unsaved changes?')) return;
    setDesignName('Untitled Design'); setHistory([]); setFuture([]); setDirty(false); setSaveState('Save');
    setComposition('single'); setNailLength(50);
  };
  const duplicateDesign = () => applyName(`${designName || 'Untitled Design'} Copy`.slice(0, 64));
  const saveDesign = () => {
    if (!dirty || saveState === 'Saving…') return;
    setSaveState('Saving…');
    window.setTimeout(() => { setDirty(false); setSaveState('Saved'); }, 150);
  };
  const undo = () => {
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1)); setFuture((items) => [designName, ...items]);
    setDesignName(previous); setDirty(true); setSaveState('Save Changes');
  };
  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((items) => items.slice(1)); setHistory((items) => [...items, designName]);
    setDesignName(next); setDirty(true); setSaveState('Save Changes');
  };
  const beginRename = () => { setDraftDesignName(designName); setIsRenaming(true); };
  const cancelRename = () => { cancelingRename.current = true; setDraftDesignName(designName); setIsRenaming(false); };
  const commitRename = () => {
    if (cancelingRename.current) { cancelingRename.current = false; return; }
    const nextName = draftDesignName.trim();
    if (nextName) applyName(nextName.slice(0, 64));
    setIsRenaming(false);
  };
  const shareDesign = async () => {
    const data = { title: designName, text: `Nail Design Studio design: ${designName}`, url: window.location.href };
    if (navigator.share) await navigator.share(data);
    else if (navigator.clipboard) await navigator.clipboard.writeText(window.location.href);
  };
  const exportDesign = () => {
    const blob = new Blob([JSON.stringify({ name: designName }, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = `${designName.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'nail-design'}.json`;
    link.click(); URL.revokeObjectURL(link.href);
  };

  const command = (label, icon, onClick, options = {}) => (
    <button key={options.ariaLabel || label} type="button" className="nail-design-studio__command-button"
      onClick={onClick} disabled={options.disabled} aria-label={options.ariaLabel || label} title={options.ariaLabel || label}>
      <CommandIcon name={icon} /><span>{label}</span>
      {options.status && <i className="nail-design-studio__command-status" aria-hidden="true" />}
    </button>
  );

  const resetCamera = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  useEffect(() => {
    resetCamera();
    setSelectedNail(composition === 'single' ? 'single' : `${composition === 'full' ? 'left' : composition}-index`);
  }, [composition]);

  const stageGroups = useMemo(() => {
    if (composition === 'single') return [{ id: 'single', label: '', nails: ['Nail'] }];
    if (composition === 'left' || composition === 'right') {
      return [{ id: composition, label: composition === 'left' ? 'Left Hand' : 'Right Hand', nails: NAILS }];
    }
    return [{ id: 'left', label: 'Left Hand', nails: NAILS }, { id: 'right', label: 'Right Hand', nails: NAILS }];
  }, [composition]);

  const zoomBy = (delta) => setZoom((current) => Math.min(4, Math.max(0.35, Number((current + delta).toFixed(2)))));
  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault(); zoomBy(event.deltaY > 0 ? -0.1 : 0.1);
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
        <div className="nail-design-studio__brand" aria-label="Nail Design Studio">
          <h1><span>Nail</span><span>Design Studio<sup>™</sup></span></h1>
        </div>

        <section className="nail-design-studio__command-group nail-design-studio__command-group--design" aria-label="Design">
          <h2>Design</h2><div className="nail-design-studio__command-row">
            {command('New', 'new', newDesign, { ariaLabel: 'New Design' })}
            {command('Open', 'open', () => setSavedDesignsOpen(true), { ariaLabel: 'Open Saved Designs' })}
            {command('Duplicate', 'duplicate', duplicateDesign)}
            {command(saveState, 'save', saveDesign, { disabled: !dirty || saveState === 'Saving…', status: dirty, ariaLabel: saveState })}
          </div>
        </section>

        <section className="nail-design-studio__design-control" aria-label="Current Design">
          <small>Current Design</small>
          <div className="nail-design-studio__design-name-row">
            {isRenaming ? <input className="nail-design-studio__design-name-input" value={draftDesignName} maxLength={64}
              onChange={(event) => setDraftDesignName(event.target.value)} onBlur={commitRename}
              onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); if (event.key === 'Escape') cancelRename(); }}
              aria-label="Rename design" autoFocus />
              : <button type="button" className="nail-design-studio__design-name" onClick={beginRename}
                aria-label={`Rename current design: ${designName}`} title="Click to rename design">{designName}</button>}
            <button type="button" className="nail-design-studio__design-menu" onClick={() => setSavedDesignsOpen(true)}
              aria-label="Open current design menu" title="Open current design menu" aria-haspopup="dialog" aria-expanded={savedDesignsOpen}>⌄</button>
          </div>
        </section>

        <section className="nail-design-studio__command-group nail-design-studio__command-group--edit" aria-label="Edit">
          <h2>Edit</h2><div className="nail-design-studio__command-row">
            {command('Undo', 'undo', undo, { disabled: !history.length })}{command('Redo', 'redo', redo, { disabled: !future.length })}
          </div>
        </section>
        <section className="nail-design-studio__command-group nail-design-studio__command-group--publish" aria-label="Publish">
          <h2>Publish</h2><div className="nail-design-studio__command-row">
            {command('Share', 'share', shareDesign)}{command('Export', 'export', exportDesign)}
            {command('Add to Collection', 'collection', () => setCollectionOpen(true))}
          </div>
        </section>
        <section className="nail-design-studio__command-group nail-design-studio__command-group--info" aria-label="Info">
          <h2>Info</h2><div className="nail-design-studio__command-row">
            {command('Design Details', 'info', () => setDetailsOpen(true))}
          </div>
        </section>
      </header>

      {savedDesignsOpen && <div role="dialog" aria-label="Saved Designs" className="nail-design-studio__bottom-workspace"><strong>Saved Designs</strong><button type="button" onClick={() => setSavedDesignsOpen(false)} aria-label="Close Saved Designs">Close</button><p className="nail-design-studio__placeholder-copy">The new Saved Designs library will be connected during its dedicated construction section.</p></div>}
      {collectionOpen && <div role="dialog" aria-label="Add to Collection" className="nail-design-studio__bottom-workspace"><strong>Add to Collection</strong><button type="button" onClick={() => setCollectionOpen(false)} aria-label="Close Add to Collection">Close</button><p className="nail-design-studio__placeholder-copy">Collection organization will connect to the permanent workspace without reusing the legacy studio layout.</p></div>}
      {detailsOpen && <div role="dialog" aria-label="Design Details" className="nail-design-studio__bottom-workspace"><strong>Design Details</strong><button type="button" onClick={() => setDetailsOpen(false)} aria-label="Close Design Details">Close</button><label>Design name<input value={designName} maxLength={64} onChange={(event) => applyName(event.target.value)} /></label></div>}

      <nav className="nail-design-studio__tool-ribbon" aria-label="Nail Tool Kit">
        <div className="nail-design-studio__tool-list" role="tablist" aria-label="Creative tool categories">
          {TOOL_CATEGORIES.map((tool, index) => {
            const isActive = activeTool.id === tool.id;
            return <button
              key={tool.id}
              ref={(node) => { toolRefs.current[index] = node; }}
              id={`nail-tool-${tool.id}`}
              type="button"
              role="tab"
              className="nail-design-studio__tool"
              style={{ '--tool-accent': tool.accent }}
              data-accent={tool.accent}
              aria-selected={isActive}
              aria-controls="creative-tools-panel"
              tabIndex={focusedToolIndex === index ? 0 : -1}
              onFocus={() => setFocusedToolIndex(index)}
              onClick={() => setActiveToolId(tool.id)}
              onKeyDown={(event) => handleToolKeyDown(event, index)}
            ><ToolIcon tool={tool} /><span>{tool.label}</span><i aria-hidden="true" /></button>;
          })}
        </div>
      </nav>
      <div
        className={`nail-design-studio__workspace${leftPanelOpen ? '' : ' nail-design-studio__workspace--left-closed'}${rightPanelOpen ? '' : ' nail-design-studio__workspace--right-closed'}${focusMode ? ' nail-design-studio__workspace--focus' : ''}`}
        data-focus-mode={focusMode ? 'true' : 'false'}
      >
        <aside id="creative-tools-panel" className={`nail-design-studio__panel nail-design-studio__creative-tools nail-design-studio__panel--left${leftPanelOpen ? '' : ' nail-design-studio__panel--collapsed'}`} role="tabpanel" aria-label="Creative tools panel" tabIndex="0">
          <button className="nail-design-studio__panel-toggle" type="button" onClick={() => setLeftPanelOpen((open) => !open)} aria-expanded={leftPanelOpen}>{leftPanelOpen ? '‹' : '›'}</button>
          {leftPanelOpen && <><div className="nail-design-studio__panel-heading" style={{ '--tool-accent': activeTool.accent }}><ToolIcon tool={activeTool} /><h2>{activeTool.label}</h2></div><p className="nail-design-studio__placeholder-copy">The {activeTool.label} creative tools are scoped for construction in a future studio section.</p></>}
        </aside>

        <main className="nail-design-studio__desk" aria-label="Nail Desk">
          <div className="nail-design-studio__desk-header">
            <div><h2>Nail Desk</h2><p>{composition === 'full' ? 'Full Set' : COMPOSITIONS.find(([id]) => id === composition)?.[1]}</p></div>
            <div className="nail-design-studio__view-actions">
              <div className="nail-design-studio__composition-tabs" aria-label="Composition view">
                {COMPOSITIONS.map(([id, label]) => <button key={id} type="button" className={composition === id ? 'is-active' : ''} aria-pressed={composition === id} onClick={() => setComposition(id)}>{label}</button>)}
              </div>
              <button type="button" className="nail-design-studio__focus-button" aria-label={focusMode ? 'Exit Focus Mode' : 'Focus Mode'} aria-pressed={focusMode} onClick={() => setFocusMode((focused) => !focused)}>{focusMode ? 'Exit Focus' : 'Focus Mode'}</button>
            </div>
          </div>

          <section className={`nail-stage nail-stage--${workspace}`} aria-label="Nail Stage Container"
            onWheel={handleWheel} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <div className="nail-stage__camera" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}>
              <div className={`nail-stage__composition nail-stage__composition--${composition}`}>
                {stageGroups.map((group) => <div className="nail-stage__hand" key={group.id}>
                  {group.label && <strong>{group.label}</strong>}
                  <div className="nail-stage__nail-row">{group.nails.map((name, index) => {
                    const id = composition === 'single' ? 'single' : `${group.id}-${name.toLowerCase()}`;
                    return <NailModel key={id} name={composition === 'single' ? 'Single Nail' : name} selected={selectedNail === id}
                      length={nailLength + (index === 2 ? 8 : 0)} onSelect={() => setSelectedNail(id)} />;
                  })}</div>
                </div>)}
              </div>
            </div>
            <div className="nail-stage__controls" aria-label="Canvas zoom controls">
              <button type="button" onClick={() => zoomBy(-0.1)} aria-label="Zoom out">−</button>
              <button type="button" onClick={resetCamera} className="nail-stage__zoom-readout">{Math.round(zoom * 100)}%</button>
              <button type="button" onClick={() => zoomBy(0.1)} aria-label="Zoom in">＋</button>
              <button type="button" onClick={resetCamera} aria-label="Fit to View">Fit</button>
              {focusMode && <button type="button" onClick={() => setFocusMode(false)} aria-label="Exit Focus Mode">Exit Focus</button>}
            </div>
          </section>
        </main>

        <aside className={`nail-design-studio__panel nail-design-studio__panel--right${rightPanelOpen ? '' : ' nail-design-studio__panel--collapsed'}`} aria-label="Design properties panel">
          <button className="nail-design-studio__panel-toggle" type="button" onClick={() => setRightPanelOpen((open) => !open)} aria-expanded={rightPanelOpen}>{rightPanelOpen ? '›' : '‹'}</button>
          {rightPanelOpen && <><h2>Design Properties</h2>
            <label className="nail-design-studio__field">Nail length <output>{nailLength}%</output><input type="range" min="10" max="100" value={nailLength} onChange={(event) => { setNailLength(Number(event.target.value)); setDirty(true); setSaveState('Save Changes'); }} /></label>
            <label className="nail-design-studio__field">Workspace Surface<select value={workspace} onChange={(event) => setWorkspace(event.target.value)}>{WORKSPACES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
            <p className="nail-design-studio__placeholder-copy">Long nails scale within Fit to View. Zoom beyond the viewport to pan inside the same full-size stage.</p></>}
        </aside>
      </div>
      <footer className="nail-design-studio__bottom-workspace"><strong>Workspace</strong><p className="nail-design-studio__placeholder-copy">One full-size Nail Stage Container supports Single Nail, Left Hand, Right Hand, and Full Set compositions with a shared camera.</p></footer>
    </section>
  );
});

export default NailDesignStudio;
