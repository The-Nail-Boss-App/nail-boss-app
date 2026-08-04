import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  applyHeroEffectToSurface, createHeroDesignDocument, createHeroSurfaceInput, HeroDesignEventBus,
  HeroLocalStoragePersistenceAdapter, HeroSurfaceRenderingEngine, initialHeroDesignState,
  heroDesignReducer, updateHeroEffect, updateHeroShape,
} from '../hero-design/index.ts';
import { USER_FACING_NAIL_SHAPES } from '../config/features';
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

const COMPOSITIONS = [
  { id: 'single', label: 'Single Nail', nails: 1 },
  { id: 'left', label: 'Left Hand', nails: 5 },
  { id: 'right', label: 'Right Hand', nails: 5 },
  { id: 'full', label: 'Full Set', nails: 10 },
];

const WORKSPACE_SURFACES = [
  { id: 'signature', label: 'Signature', src: '/assets/anitaset/design-studio/workspace-surfaces/signature-workspace.png' },
  { id: 'cherry', label: 'Cherry Lacquer', src: '/assets/anitaset/design-studio/workspace-surfaces/cherry-lacquer-workspace.png' },
  { id: 'kikis', label: "Kiki's", src: '/assets/anitaset/design-studio/workspace-surfaces/kikis-workspace.png' },
];

const FINISH_DEFAULTS = {
  Solid: { color: '#D94C70' },
  Gradient: { startColor: '#D94C70', endColor: '#7D2E68', angle: 90 },
  Chrome: { color: '#D94C70', intensity: .82 },
  'Cat Eye': { baseColor: '#521A46', stripeColor: '#F3A6D2', angle: 22, position: .5, width: .18 },
  Marble: { baseColor: '#F1CAD8', veinColor: '#8A405D', intensity: .42 },
  Jelly: { color: '#D94C70', opacity: .48 },
};

const baseColorKey = (finish) => finish === 'Gradient' ? 'startColor' : ['Cat Eye', 'Marble'].includes(finish) ? 'baseColor' : 'color';

function initialNailDeskHeroState() {
  const fallback = createHeroDesignDocument({ id: 'nail-desk-hero', name: 'Untitled Design', shapeId: 'Almond', maskId: 'almond-mask' });
  try {
    const stored = window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero');
    return heroDesignReducer(initialHeroDesignState, { type: stored ? 'loadDesign' : 'createDesign', document: stored ? JSON.parse(stored) : fallback });
  } catch {
    return heroDesignReducer(initialHeroDesignState, { type: 'createDesign', document: fallback });
  }
}

function CommandIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={ICON_PATHS[name]} /></svg>;
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
  const [composition, setComposition] = useState('single');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [heroState, setHeroState] = useState(initialNailDeskHeroState);
  const [nailShapeOpen, setNailShapeOpen] = useState(false);
  const [nailSizeOpen, setNailSizeOpen] = useState(false);
  const [surface, setSurface] = useState(WORKSPACE_SURFACES[0].id);
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const cancelingRename = useRef(false);
  const toolRefs = useRef([]);
  const drag = useRef(null);
  const heroEvents = useRef(new HeroDesignEventBus());
  const heroRenderer = useRef(new HeroSurfaceRenderingEngine(heroEvents.current));
  const heroPersistence = useRef(typeof window !== 'undefined' ? new HeroLocalStoragePersistenceAdapter(window.localStorage) : null);

  const activeTool = TOOL_CATEGORIES.find((tool) => tool.id === activeToolId) || TOOL_CATEGORIES[0];
  const activeComposition = COMPOSITIONS.find((item) => item.id === composition) || COMPOSITIONS[0];
  const activeSurface = WORKSPACE_SURFACES.find((item) => item.id === surface) || WORKSPACE_SURFACES[0];
  const heroDocument = heroState.document;
  const nailShape = heroDocument.nail.shape.id;
  const nailLength = Math.round(heroDocument.nail.length * 100);
  const renderedSurface = heroRenderer.current.process(createHeroSurfaceInput(heroDocument, { width: 240, height: 360 }));
  const appliedEffect = applyHeroEffectToSurface(heroDocument, renderedSurface);
  const activePolishColor = heroDocument.nail.effect.parameters[baseColorKey(heroDocument.nail.effect.id)];

  const selectNailShape = (shapeId) => {
    heroRenderer.current.invalidate('shape', heroDocument.metadata.id);
    setHeroState((current) => updateHeroShape(current, { shapeId }, heroEvents.current));
    setNailShapeOpen(false);
  };

  const changeHero = (updater) => {
    setHeroState((current) => updater(current));
    setDirty(true);
    setSaveState('Save Changes');
  };
  const changeFinish = (id) => changeHero((current) => updateHeroEffect(current, { id, version: '1', parameters: { ...FINISH_DEFAULTS[id] } }, heroEvents.current));
  const changeFinishParameter = (key, value) => changeHero((current) => updateHeroEffect(current, {
    ...current.document.nail.effect,
    parameters: { ...current.document.nail.effect.parameters, [key]: value },
  }, heroEvents.current));

  const fitToView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const changeComposition = (nextComposition) => { setComposition(nextComposition); fitToView(); };
  const changeZoom = (amount) => setZoom((current) => Math.min(2.5, Math.max(1, Number((current + amount).toFixed(2)))));
  const startPan = (event) => {
    if (zoom <= 1 || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const movePan = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setPan({ x: drag.current.panX + event.clientX - drag.current.x, y: drag.current.panY + event.clientY - drag.current.y });
  };
  const stopPan = (event) => {
    if (drag.current?.pointerId === event.pointerId) drag.current = null;
  };

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
  };
  const duplicateDesign = () => applyName(`${designName || 'Untitled Design'} Copy`.slice(0, 64));
  const saveDesign = async () => {
    if (!dirty || saveState === 'Saving…') return;
    setSaveState('Saving…');
    await heroPersistence.current?.save({ ...heroDocument, metadata: { ...heroDocument.metadata, name: designName } });
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
      <div className={`nail-design-studio__workspace${leftPanelOpen && !focusMode ? '' : ' nail-design-studio__workspace--left-closed'}${rightPanelOpen && !focusMode ? '' : ' nail-design-studio__workspace--right-closed'}`}>
        {!focusMode && <button type="button" className="nail-design-studio__panel-toggle nail-design-studio__panel-toggle--left" onClick={() => setLeftPanelOpen((open) => !open)} aria-expanded={leftPanelOpen} aria-controls="creative-tools-panel" aria-label={`${leftPanelOpen ? 'Collapse' : 'Expand'} creative tools panel`}>{leftPanelOpen ? '‹' : '›'}</button>}
        {leftPanelOpen && !focusMode && <aside id="creative-tools-panel" className="nail-design-studio__panel nail-design-studio__creative-tools" role="tabpanel" aria-labelledby={`nail-tool-${activeTool.id}`} tabIndex="0">
          <div className="nail-design-studio__panel-heading" style={{ '--tool-accent': activeTool.accent }}><ToolIcon tool={activeTool} /><h2>{activeTool.label}</h2></div>
          {activeTool.id === 'polish' ? <section className="nail-design-studio__polish-studio" aria-label="Polish Studio" data-hero-material-engine="Hero Material Engine" data-hero-effect-engine="Hero Effect Engine">
            <h3>Active Polish</h3>
            <div className="nail-design-studio__polish-bottle" style={{ '--polish-color': activePolishColor }} aria-label={`Active polish bottle ${activePolishColor}`}><i /><span /></div>
            <label>Color palette<span className="nail-design-studio__color-row"><input aria-label="Base Color picker" type="color" value={activePolishColor} onChange={(event) => changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), event.target.value.toUpperCase())} /><input aria-label="Base Color HEX" value={activePolishColor} maxLength="7" onChange={(event) => { const value = event.target.value.toUpperCase(); if (/^#[0-9A-F]{6}$/.test(value)) changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), value); }} /></span></label>
            <label>Finish selection<select aria-label="Finish" value={heroDocument.nail.effect.id} onChange={(event) => changeFinish(event.target.value)}>{Object.keys(FINISH_DEFAULTS).map((finish) => <option key={finish}>{finish}</option>)}</select></label>
            <label>Opacity <output>{Math.round((heroDocument.nail.effect.id === 'Jelly' ? heroDocument.nail.effect.parameters.opacity ?? .48 : appliedEffect.layers[0].opacity) * 100)}%</output><input aria-label="Opacity" type="range" min="0" max="1" step=".01" disabled={heroDocument.nail.effect.id !== 'Jelly'} value={heroDocument.nail.effect.id === 'Jelly' ? heroDocument.nail.effect.parameters.opacity ?? .48 : appliedEffect.layers[0].opacity} onChange={(event) => changeFinishParameter('opacity', Number(event.target.value))} /></label>
            <label>Viscosity <output>{Math.round(renderedSurface.material.density * 100)}%</output><input aria-label="Viscosity" type="range" min="0" max="1" step=".01" value={renderedSurface.material.density} disabled /></label>
            <label>Shine <output>{Math.round((1 - renderedSurface.material.surfaceRoughness) * 100)}%</output><input aria-label="Shine" type="range" min="0" max="1" step=".01" value={1 - renderedSurface.material.surfaceRoughness} disabled /></label>
            {heroDocument.nail.effect.id === 'Gradient' && <><label>Color B<input aria-label="Color B" type="color" value={heroDocument.nail.effect.parameters.endColor} onChange={(event) => changeFinishParameter('endColor', event.target.value.toUpperCase())} /></label><label>Direction <input aria-label="Direction" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.angle ?? 90} onChange={(event) => changeFinishParameter('angle', Number(event.target.value))} /></label></>}
            {heroDocument.nail.effect.id === 'Chrome' && <label>Chrome intensity <input aria-label="Chrome intensity" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.intensity ?? .82} onChange={(event) => changeFinishParameter('intensity', Number(event.target.value))} /></label>}
            {heroDocument.nail.effect.id === 'Cat Eye' && <label>Stripe orientation <input aria-label="Stripe orientation" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.angle ?? 22} onChange={(event) => changeFinishParameter('angle', Number(event.target.value))} /></label>}
            {heroDocument.nail.effect.id === 'Marble' && <label>Vein Color<input aria-label="Vein Color" type="color" value={heroDocument.nail.effect.parameters.veinColor} onChange={(event) => changeFinishParameter('veinColor', event.target.value.toUpperCase())} /></label>}
            <section className="nail-design-studio__polish-rack" aria-label="Polish Rack"><h3>Polish Rack</h3>{['#D94C70', '#7D2E68', '#F1CAD8', '#521A46'].map((color) => <button key={color} type="button" aria-label={`Apply polish ${color}`} style={{ '--rack-color': color }} onClick={() => changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), color)} />)}</section>
          </section> : <p className="nail-design-studio__placeholder-copy">The {activeTool.label} creative tools are scoped for construction in a future studio section.</p>}
        </aside>}
        <main className="nail-design-studio__desk" aria-label="Nail Desk">
          <div className="nail-design-studio__desk-toolbar">
            <h2>Nail Desk</h2>
            <div className="nail-design-studio__view-controls" aria-label="Nail Desk view controls">
              <button type="button" aria-haspopup="listbox" aria-expanded={nailShapeOpen} onClick={() => setNailShapeOpen((open) => !open)}>Nail Shape</button>
              <button type="button" aria-haspopup="dialog" aria-expanded={nailSizeOpen} onClick={() => setNailSizeOpen((open) => !open)}>Nail Size</button>
              <button type="button" onClick={fitToView}>Fit to View</button>
              <button type="button" onClick={() => changeZoom(-.25)} disabled={zoom === 1} aria-label="Zoom out">−</button>
              <output aria-label="Zoom level">{Math.round(zoom * 100)}%</output>
              <button type="button" onClick={() => changeZoom(.25)} disabled={zoom === 2.5} aria-label="Zoom in">+</button>
              <button type="button" aria-pressed={focusMode} onClick={() => setFocusMode((focused) => !focused)}>Focus Mode</button>
            </div>
            {nailShapeOpen && <div className="nail-design-studio__shape-menu" role="listbox" aria-label="Nail Shape options">
              {USER_FACING_NAIL_SHAPES.map((shape) => <button type="button" role="option" aria-selected={nailShape === shape} key={shape} onClick={() => selectNailShape(shape)}>{shape}</button>)}
            </div>}
            {nailSizeOpen && <div className="nail-design-studio__compact-panel nail-design-studio__size-panel" role="dialog" aria-label="Nail Size">
              <label htmlFor="desk-nail-size">Nail size <output>{nailLength}%</output></label>
              <input id="desk-nail-size" type="range" min="50" max="250" value={nailLength} onChange={(event) => { const value = Number(event.target.value); heroRenderer.current.invalidate('length', heroDocument.metadata.id); changeHero((current) => updateHeroShape(current, { length: value / 100 }, heroEvents.current)); }} />
            </div>}
          </div>
          <div className={`nail-design-studio__desk-surface${zoom > 1 ? ' is-pannable' : ''}`} style={{ backgroundImage: `url(${activeSurface.src})` }} onPointerDown={startPan} onPointerMove={movePan} onPointerUp={stopPan} onPointerCancel={stopPan} data-testid="nail-stage-container">
            <div className={`nail-design-studio__nail-stage nail-design-studio__nail-stage--${composition}`} style={{ '--stage-zoom': zoom, '--stage-x': `${pan.x}px`, '--stage-y': `${pan.y}px`, '--nail-length': nailLength / 100 }} aria-label={`${activeComposition.label} nail stage`}>
              {Array.from({ length: activeComposition.nails }, (_, index) => (
                <div className="nail-design-studio__nail-slot" data-testid="nail-slot" key={index}>
                  <svg className="nail-design-studio__hero-nail" data-testid="stage-nail" data-nail-shape={nailShape.toLowerCase()}
                    data-hero-renderer="Hero Surface Rendering Engine" data-hero-mask={renderedSurface.maskId} data-design-layer-parent="true"
                    aria-label={`Hero Nail ${index + 1}`} viewBox={renderedSurface.viewBox} preserveAspectRatio="xMidYMid meet" role="img">
                    <defs><linearGradient id={`hero-finish-${index}`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${appliedEffect.layers[0].angle ?? 90} .5 .5)`}>{(appliedEffect.layers[0].colors || [appliedEffect.layers[0].color, appliedEffect.layers[0].color]).map((color, stop) => <stop key={stop} offset={`${stop / Math.max(1, (appliedEffect.layers[0].colors?.length || 2) - 1) * 100}%`} stopColor={color} />)}</linearGradient></defs>
                    <path className="nail-design-studio__nail-polish" data-design-layer="polish" data-hero-material-layer="true" data-hero-effect={appliedEffect.id} data-material-id={renderedSurface.material.id} d={renderedSurface.path} style={{ fill: `url(#hero-finish-${index})`, fillOpacity: appliedEffect.layers[0].opacity, stroke: renderedSurface.materialStyle.baseTint, strokeOpacity: renderedSurface.materialStyle.edgeOpacity, strokeWidth: renderedSurface.materialStyle.edgeWidth }} />
                    {appliedEffect.layers.slice(1).map((layer, layerIndex) => layer.kind === 'linear-gradient' ? <path key={layerIndex} d={renderedSurface.path} fill={layer.colors?.[1]} opacity={layer.opacity * .45} /> : layer.paths?.map((path, pathIndex) => <path key={`${layerIndex}-${pathIndex}`} d={path} stroke={layer.color} opacity={layer.opacity} fill="none" vectorEffect="non-scaling-stroke" />))}
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </main>
        {rightPanelOpen && !focusMode && <aside id="design-properties-panel" className="nail-design-studio__panel nail-design-studio__properties" aria-label="Design properties panel"><h2>Design Properties</h2>
          <fieldset><legend>Composition</legend>{COMPOSITIONS.map((item) => <label key={item.id}><input type="radio" name="composition" value={item.id} checked={composition === item.id} onChange={() => changeComposition(item.id)} />{item.label}</label>)}</fieldset>
          <label className="nail-design-studio__length-control" htmlFor="nail-length">Nail length <output>{nailLength}%</output></label><input id="nail-length" type="range" min="50" max="250" value={nailLength} onChange={(event) => { const value = Number(event.target.value); heroRenderer.current.invalidate('length', heroDocument.metadata.id); changeHero((current) => updateHeroShape(current, { length: value / 100 }, heroEvents.current)); }} />
          <label className="nail-design-studio__surface-control" htmlFor="workspace-surface">Workspace surface</label><select id="workspace-surface" value={surface} onChange={(event) => setSurface(event.target.value)}>{WORKSPACE_SURFACES.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select>
        </aside>}
        {!focusMode && <button type="button" className="nail-design-studio__panel-toggle nail-design-studio__panel-toggle--right" onClick={() => setRightPanelOpen((open) => !open)} aria-expanded={rightPanelOpen} aria-controls="design-properties-panel" aria-label={`${rightPanelOpen ? 'Collapse' : 'Expand'} design properties panel`}>{rightPanelOpen ? '›' : '‹'}</button>}
      </div>
      <footer className="nail-design-studio__bottom-workspace"><strong>Workspace</strong><p className="nail-design-studio__placeholder-copy">Layers, history, assets, and view controls will be added to this new module in their approved construction order.</p></footer>
    </section>
  );
});

export default NailDesignStudio;
