import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  applyHeroEffectToSurface, applyHeroLightingToEffect, createHeroDesignDocument, createHeroSurfaceInput, HeroDesignEventBus,
  HeroEngineRegistry, HeroLocalStoragePersistenceAdapter, HeroSurfaceRenderingEngine, initialHeroDesignState,
  heroDesignReducer, registerHeroEffectEngine, registerHeroLightingEngine, updateHeroEffect, updateHeroShape,
} from '../hero-design/index.ts';
import { USER_FACING_NAIL_SHAPES } from '../config/features';
import PolishBottle from '../design-studio/PolishBottle';
import { MaterialLayers } from './MaterialRenderer';
import { FINISH_DEFAULTS, VISIBLE_POLISH_FINISHES, heroEffectForPolish, normalizePolishForFinish, polishSignature } from './polishFinish';
import { addProjectPolish, touchRecentPolish } from '../design-studio/polishWorkflow';
import { FrenchTipControls, FrenchTipRegion, loadFrenchTips } from './FrenchTip';
import './NailDesignStudio.css';

export const canScrollInWheelDirection = (element, deltaY) => {
  if (!element || deltaY === 0) return false;
  const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight);
  return deltaY > 0 ? element.scrollTop < maxScrollTop : element.scrollTop > 0;
};

const TOOL_CATEGORIES = [
  { id: 'polish', label: 'Polish', accent: '#FF2DA0', icon: 'M8 3h8v4l2 3v11H6V10l2-3V3Zm0 8h10M10 3v4h4V3' },
  { id: 'technique', label: 'French Tip', accent: '#F5C04A', icon: 'm4 20 3.5-1 10-10-2.5-2.5-10 10L4 20Zm12-15 1.5-1.5 3 3L19 8' },
  { id: 'brush', label: 'Brush', accent: '#FF7A45', icon: 'M14 4 20 2l-2 6-8 8M10 16c0 3-2 5-6 5 1-1 0-4 2-6 1-1 3-1 4 1Z' },
  { id: 'sticker-studio', label: 'Sticker Studio™', accent: '#B96CFF', icon: 'M5 4h11l3 3v11a2 2 0 0 1-2 2H5V4Zm11 0v4h4M8 12h8M8 16h5' },
  { id: 'charm-studio', label: 'Charm Studio™', accent: '#34E5F2', icon: 'M12 3v4m-4-2h8m-4 2 6 5-6 9-6-9 6-5Zm0 4v6m-3-3h6' },
  { id: 'gems', label: 'Gems', accent: '#68B7FF', icon: 'm4 9 4-5h8l4 5-8 11L4 9Zm0 0h16M8 4l4 5 4-5m-4 5v11' },
  { id: 'effects', label: 'Effects', accent: '#C8FF4A', icon: 'm12 3 1.3 4.2L17 9l-3.7 1.8L12 15l-1.3-4.2L7 9l3.7-1.8L12 3ZM19 15l.7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3Z' },
  { id: '3d-objects', label: '3D Objects', accent: '#22F0C7', icon: 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9' },
  { id: 'top-coat', label: 'Top Coat', accent: '#FF6FCF', icon: 'M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12Zm-3 12a3 3 0 0 0 3 3' },
];

// Effects owns presentation only; values remain the established Hero effect ids
// so legacy designs and the existing render engines need no data migration.
export const EFFECT_OPTIONS = Object.freeze([
  Object.freeze({ value: 'Gradient', label: 'Ombré' }),
  Object.freeze({ value: 'Marble', label: 'Marble' }),
  Object.freeze({ value: 'Chrome', label: 'Chrome' }),
  Object.freeze({ value: 'Cat Eye', label: 'Cat Eye' }),
]);

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
  { id: 'spread', label: 'Spread View', nails: 10 },
];

const WORKSPACE_VIEWS = COMPOSITIONS.map(({ id, label }) => ({ id, label }));
const FINGER_NAMES = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];


const INSPIRATION_CARDS = [
  { id: 'velvet-orbit', title: 'Velvet Orbit', tone: 'Cat eye noir', src: '/assets/founding-shops/cherry-lacquer/cherry-lacquer-signature-nail.png' },
  { id: 'golden-aura', title: 'Golden Aura', tone: 'Molten French', src: '/assets/founding-shops/golden-hour/golden-hour-signature-nail.png' },
  { id: 'kiki-gloss', title: "Kiki's Gloss", tone: 'Hot pink glass', src: '/assets/founding-shops/kikis-nail-shop/kikis-signature-nail.png' },
  { id: 'azure-chrome', title: 'Azure Chrome', tone: 'Liquid coastal', src: '/assets/founding-shops/azure-tide/azure-tide-signature-nail.png' },
];

const POLISH_RACK_KEY = 'anitaset.designStudio.polishRack.v2';
const RECENT_POLISH_LIMIT = 8;
const polishDisplayHex = (polish) => /^#[0-9A-F]{6}$/i.test(polish?.colorHex || '') ? polish.colorHex.toUpperCase() : '#D94C70';
const STARTER_POLISHES = [
  { id: 'obsidian-rose', name: 'Obsidian Rose', colorHex: '#31101F', finish: 'Cream', opacity: 1, viscosity: .62, shine: .68, brand: 'AnitaSet Atelier', collection: 'Core', size: '15 ml', favorite: true },
  { id: 'oxblood-jelly', name: 'Oxblood Jelly', colorHex: '#7B1028', finish: 'Jelly', opacity: .72, viscosity: .46, shine: .74, brand: 'AnitaSet Atelier', collection: 'Glass House', size: '15 ml' },
];

const loadPolishRack = () => {
  try { const value = JSON.parse(window.localStorage.getItem(POLISH_RACK_KEY)); return Array.isArray(value) ? value : STARTER_POLISHES; } catch { return STARTER_POLISHES; }
};
const loadPerNailPolish = () => {
  try { const stored = JSON.parse(window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero')); return Array.isArray(stored?.metadata?.polishFormulations) ? stored.metadata.polishFormulations.slice(0, 10) : Array(10).fill(null); } catch { return Array(10).fill(null); }
};
const loadActivePolish = () => {
  try { return JSON.parse(window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero'))?.metadata?.activePolishFormulation || null; } catch { return null; }
};

const ASSET_SHORTCUTS = [
  { id: 'textures', label: 'Textures', gradient: 'linear-gradient(135deg, #2d2232, #9f6dd8)' },
  { id: 'foils', label: 'Foils', gradient: 'radial-gradient(circle at 35% 30%, #fff2a8, #d8a642 42%, #4d3210)' },
  { id: 'brushes', label: 'Brush Sets', gradient: 'linear-gradient(145deg, #ff2da0, #32101f)' },
  { id: 'decals', label: 'Decals', gradient: 'linear-gradient(135deg, #111, #39e6f2 55%, #ff2da0)' },
  { id: 'charms', label: 'Charms', gradient: 'radial-gradient(circle, #f9f2d2, #d8a642 45%, #120b04)' },
  { id: 'objects', label: '3D Objects', gradient: 'linear-gradient(135deg, #22f0c7, #101416 58%, #ff2da0)' },
];

const WORKSPACE_SURFACES = [
  { id: 'signature', label: 'Signature', src: '/assets/anitaset/design-studio/workspace-surfaces/signature-workspace.png' },
  { id: 'cherry', label: 'Cherry Lacquer', src: '/assets/anitaset/design-studio/workspace-surfaces/cherry-lacquer-workspace.png' },
  { id: 'kikis', label: "Kiki's", src: '/assets/anitaset/design-studio/workspace-surfaces/kikis-workspace.png' },
];

const interfaceFinish = (finish) => finish === 'Solid' ? 'Cream' : finish;
const baseColorKey = (finish) => finish === 'Gradient' ? 'colorA' : 'baseColor';
const stageLightingColor = (finish, configuredColor) => finish === 'Cream' ? '#FFFFFF' : configuredColor;

/** Cream owns gloss in MaterialRenderer; Hero contributes only faint ambient form. */
export const creamHeroSurfaceResponse = (shine = .68) => {
  const control = Math.min(1, Math.max(0, shine));
  return Object.freeze({
    apex: .08 + control * .04,
    primary: .04 + control * .05,
    edge: .1 + control * .05,
  });
};

/** Glitter keeps its dedicated particulate renderer and borrows only Cream's
 * subdued opaque-polish Hero response so post-material light cannot gray it. */
export const glitterHeroSurfaceResponse = (shine = .68) => creamHeroSurfaceResponse(shine);

/** Jelly owns its wet-gel reflection; Hero lighting supplies only soft form. */
export const jellyHeroSurfaceResponse = (shine = .74) => {
  const control = Math.min(1, Math.max(0, shine));
  return Object.freeze({
    apex: .16 + control * .07,
    primary: .06 + control * .05,
    edge: .16 + control * .07,
  });
};

/** Matte keeps Hero form lighting, but suppresses the specular-looking light rig. */
export const matteHeroSurfaceResponse = Object.freeze({
  apex: .08,
  primary: .035,
  edge: .08,
});

export const stageLightingOpacity = (finish, shine, role, opacity) => {
  if (finish === 'Cream') return opacity * creamHeroSurfaceResponse(shine)[role];
  if (finish === 'Glitter') return opacity * glitterHeroSurfaceResponse(shine)[role];
  if (finish === 'Jelly') return opacity * jellyHeroSurfaceResponse(shine)[role];
  if (finish === 'Matte') return opacity * matteHeroSurfaceResponse[role];
  return opacity;
};

function initialNailDeskHeroState() {
  const fallback = createHeroDesignDocument({ id: 'nail-desk-hero', name: 'Untitled Design', shapeId: 'Almond', maskId: 'almond-mask' });
  try {
    const stored = window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero');
    if (!stored) return heroDesignReducer(initialHeroDesignState, { type: 'createDesign', document: fallback });
    const parsed = JSON.parse(stored);
    const finish = interfaceFinish(parsed?.metadata?.activePolishFormulation?.finish || parsed?.nail?.effect?.id || 'Cream');
    const normalized = normalizePolishForFinish({ ...parsed?.nail?.effect?.parameters, ...parsed?.metadata?.activePolishFormulation }, finish);
    const document = { ...parsed, nail: { ...parsed.nail, effect: heroEffectForPolish(normalized) } };
    return heroDesignReducer(initialHeroDesignState, { type: 'loadDesign', document });
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
  const [savedPolishes, setSavedPolishes] = useState(loadPolishRack);
  const [projectPalette, setProjectPalette] = useState([]);
  const [recentPolishes, setRecentPolishes] = useState([]);
  const [polishName, setPolishName] = useState(() => loadActivePolish()?.name || 'Blush Royalty');
  const [selectedFinish, setSelectedFinish] = useState(() => normalizePolishForFinish(loadActivePolish() || {}, loadActivePolish()?.finish || interfaceFinish(initialNailDeskHeroState().document.nail.effect.id)).finish);
  const [finishFormulation, setFinishFormulation] = useState(() => normalizePolishForFinish(loadActivePolish() || {}, loadActivePolish()?.finish || 'Cream'));
  const [applicationScope, setApplicationScope] = useState('current');
  const [selectedNails, setSelectedNails] = useState([]);
  const [nailPolishes, setNailPolishes] = useState(loadPerNailPolish);
  const [polishPast, setPolishPast] = useState([]);
  const [polishFuture, setPolishFuture] = useState([]);
  const [polishNotice, setPolishNotice] = useState('');
  const [frenchTips, setFrenchTips] = useState(() => loadFrenchTips(initialNailDeskHeroState().document));
  const [frenchTipNotice, setFrenchTipNotice] = useState('');
  const [hexDraft, setHexDraft] = useState('#D94C70');
  const [hexInvalid, setHexInvalid] = useState(false);
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftDesignName, setDraftDesignName] = useState(designName);
  const [activeToolId, setActiveToolId] = useState(TOOL_CATEGORIES[0].id);
  const [focusedToolIndex, setFocusedToolIndex] = useState(0);
  const [composition, setComposition] = useState('single');
  const [activeNailIndex, setActiveNailIndex] = useState(0);
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
  const heroEffectRegistry = useRef(null);
  if (!heroEffectRegistry.current) {
    const registry = new HeroEngineRegistry();
    registerHeroEffectEngine(registry, heroEvents.current);
    registerHeroLightingEngine(registry, heroEvents.current);
    heroEffectRegistry.current = registry;
  }
  const heroPersistence = useRef(typeof window !== 'undefined' ? new HeroLocalStoragePersistenceAdapter(window.localStorage) : null);

  const activeTool = TOOL_CATEGORIES.find((tool) => tool.id === activeToolId) || TOOL_CATEGORIES[0];
  const activeComposition = COMPOSITIONS.find((item) => item.id === composition) || COMPOSITIONS[0];
  const visibleNails = Array.from({ length: activeComposition.nails }, (_, position) => ({
    index: composition === 'right' ? position + 5 : position,
    handClass: composition === 'right' || position >= 5 ? 'right' : 'left',
    label: composition === 'single' ? 'Single Nail' : FINGER_NAMES[position % FINGER_NAMES.length],
  }));
  const activeSurface = WORKSPACE_SURFACES.find((item) => item.id === surface) || WORKSPACE_SURFACES[0];
  const heroDocument = heroState.document;
  const nailShape = heroDocument.nail.shape.id;
  const nailLength = Math.round(heroDocument.nail.length * 100);
  const renderedSurface = useMemo(() => heroRenderer.current.process(createHeroSurfaceInput(heroDocument, { width: 240, height: 360 })), [heroDocument.nail.shape, heroDocument.nail.mask, heroDocument.nail.material, heroDocument.nail.length, heroDocument.nail.width]);
  const heroEffectEngine = heroEffectRegistry.current.resolve('Hero Effect Engine');
  const appliedEffect = useMemo(() => applyHeroEffectToSurface(heroDocument, renderedSurface, heroEffectEngine), [heroDocument.nail.effect, renderedSurface, heroEffectEngine]);
  const heroLightingEngine = heroEffectRegistry.current.resolve('Hero Lighting Engine');
  const appliedLighting = useMemo(() => applyHeroLightingToEffect(heroDocument, appliedEffect, heroLightingEngine), [heroDocument, appliedEffect, heroLightingEngine]);
  const activePolishColor = heroDocument.nail.effect.parameters[baseColorKey(heroDocument.nail.effect.id)];
  const activeFinish = selectedFinish;
  const activeFormulation = normalizePolishForFinish({ ...finishFormulation, ...heroDocument.nail.effect.parameters, name: polishName, colorHex: activePolishColor }, activeFinish);
  const activePolishSaved = savedPolishes.some((item) => (item.signature || polishSignature(item)) === polishSignature(activeFormulation));
  const nailStageFinish = (index) => activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish);
  const nailStageShine = (index) => activeNailIndex === index ? appliedEffect.shine : (nailPolishes[index]?.shine ?? appliedEffect.shine);
  const nailStageLightingOpacity = (index, role, opacity) => stageLightingOpacity(nailStageFinish(index), nailStageShine(index), role, opacity);

  const selectNailShape = (shapeId) => {
    heroRenderer.current.invalidate('shape', heroDocument.metadata.id);
    setHeroState((current) => updateHeroShape(current, { shapeId }, heroEvents.current));
    setNailShapeOpen(false);
  };

  const changeHero = (updater) => {
    heroEffectEngine.invalidate();
    setHeroState((current) => updater(current));
    setDirty(true);
    setSaveState('Save Changes');
  };
  const rememberPolish = (polish, usedInProject = false) => {
    const snapshot = { ...polish, signature: polishSignature(polish) };
    setRecentPolishes((recent) => touchRecentPolish(recent, snapshot, RECENT_POLISH_LIMIT));
    if (usedInProject) setProjectPalette((palette) => addProjectPolish(palette, snapshot));
  };
  const changeFinish = (finish, nextColor, rememberSelection = true) => {
    const normalized = normalizePolishForFinish({ ...activeFormulation, colorHex: nextColor || activePolishColor }, finish);
    setSelectedFinish(normalized.finish);
    setFinishFormulation(normalized);
    if (rememberSelection) rememberPolish(normalized);
    changeHero((current) => updateHeroEffect(current, heroEffectForPolish(normalized), heroEvents.current));
  };
  const changeFinishParameter = (key, value) => {
    const next = normalizePolishForFinish({ ...activeFormulation, [key]: value, ...(['baseColor', 'colorA'].includes(key) ? { colorHex: value } : {}) }, activeFinish);
    setFinishFormulation(next);
    if (activeTool.id === 'polish' && ['baseColor', 'colorA'].includes(key)) rememberPolish(next);
    const hero = heroEffectForPolish(next);
    changeHero((current) => updateHeroEffect(current, hero, heroEvents.current));
  };

  useEffect(() => { window.localStorage.setItem(POLISH_RACK_KEY, JSON.stringify(savedPolishes)); }, [savedPolishes]);
  useEffect(() => { setHexDraft(activePolishColor); setHexInvalid(false); }, [activePolishColor]);

  const selectSavedPolish = (polish) => {
    setPolishName(polish.name);
    changeFinish(polish.finish, polish.colorHex);
  };
  const selectWorkflowPolish = (polish) => {
    setPolishName(polish.name);
    const normalized = normalizePolishForFinish(polish, polish.finish);
    setSelectedFinish(normalized.finish);
    setFinishFormulation(normalized);
    rememberPolish(normalized);
    changeHero((current) => updateHeroEffect(current, heroEffectForPolish(normalized), heroEvents.current));
  };
  const togglePolishSaved = () => {
    const now = new Date().toISOString();
    const signature = polishSignature(activeFormulation);
    const existing = savedPolishes.find((item) => (item.signature || polishSignature(item)) === signature);
    if (existing) {
      setSavedPolishes((rack) => rack.filter((item) => item.id !== existing.id));
      setPolishNotice(`${polishDisplayHex(activeFormulation)} removed from Polish Rack.`);
    } else {
      setSavedPolishes((rack) => [{ ...activeFormulation, id: `polish-${Date.now()}`, signature, favorite: true, createdAt: now, modifiedAt: now }, ...rack]);
      setPolishNotice(`${polishDisplayHex(activeFormulation)} saved to Polish Rack.`);
    }
  };
  const applyPolish = () => {
    const targets = applicationScope === 'current' ? [activeNailIndex] : applicationScope === 'selected' ? selectedNails : applicationScope === 'left' ? [0,1,2,3,4] : applicationScope === 'right' ? [5,6,7,8,9] : [0,1,2,3,4,5,6,7,8,9];
    if (!targets.length) { setPolishNotice('Select at least one nail before applying.'); return; }
    rememberPolish(activeFormulation, true);
    setPolishPast((items) => [...items, nailPolishes]); setPolishFuture([]);
    setNailPolishes((current) => current.map((value, index) => targets.includes(index) ? { ...activeFormulation } : value));
    setDirty(true); setSaveState('Save Changes'); setPolishNotice(`Applied ${polishDisplayHex(activeFormulation)} to ${targets.length} nail${targets.length === 1 ? '' : 's'}.`);
  };

  const changeActiveFrenchTip = (tip) => {
    setFrenchTips((current) => current.map((value, index) => index === activeNailIndex ? tip : value));
    setDirty(true); setSaveState('Save Changes');
  };
  const applyFrenchTip = () => {
    const source = frenchTips[activeNailIndex];
    const targets = applicationScope === 'current' ? [activeNailIndex] : applicationScope === 'selected' ? selectedNails : applicationScope === 'left' ? [0,1,2,3,4] : applicationScope === 'right' ? [5,6,7,8,9] : [0,1,2,3,4,5,6,7,8,9];
    if (!targets.length) { setFrenchTipNotice('Select at least one nail before applying.'); return; }
    setFrenchTips((current) => current.map((value, index) => targets.includes(index) ? source : value));
    setDirty(true); setSaveState('Save Changes'); setFrenchTipNotice(`Applied French Tip to ${targets.length} nail${targets.length === 1 ? '' : 's'}.`);
  };

  const selectActiveNail = (index) => {
    setActiveNailIndex(index);
    const storedFormulation = nailPolishes[index];
    if (!storedFormulation) return;
    const normalized = normalizePolishForFinish(storedFormulation, storedFormulation.finish);
    setPolishName(normalized.name || polishName);
    setSelectedFinish(normalized.finish);
    setFinishFormulation(normalized);
    heroEffectEngine.invalidate();
    setHeroState((current) => updateHeroEffect(current, heroEffectForPolish(normalized), heroEvents.current));
  };

  const fitToView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const changeComposition = (nextComposition) => {
    const firstIndex = nextComposition === 'right' ? 5 : 0;
    const lastIndex = firstIndex + (COMPOSITIONS.find((item) => item.id === nextComposition)?.nails || 1) - 1;
    setComposition(nextComposition);
    if (activeNailIndex < firstIndex || activeNailIndex > lastIndex) selectActiveNail(firstIndex);
    fitToView();
  };
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
    await heroPersistence.current?.save({ ...heroDocument, metadata: { ...heroDocument.metadata, name: designName, polishFormulations: nailPolishes, activePolishFormulation: activeFormulation, frenchTips } });
    window.setTimeout(() => { setDirty(false); setSaveState('Saved'); }, 150);
  };
  const undo = () => {
    if (polishPast.length) {
      const previous = polishPast[polishPast.length - 1];
      setPolishPast((items) => items.slice(0, -1)); setPolishFuture((items) => [nailPolishes, ...items]); setNailPolishes(previous); setDirty(true); return;
    }
    if (!history.length) return;
    const previous = history[history.length - 1];
    setHistory((items) => items.slice(0, -1)); setFuture((items) => [designName, ...items]);
    setDesignName(previous); setDirty(true); setSaveState('Save Changes');
  };
  const redo = () => {
    if (polishFuture.length) {
      const next = polishFuture[0];
      setPolishFuture((items) => items.slice(1)); setPolishPast((items) => [...items, nailPolishes]); setNailPolishes(next); setDirty(true); return;
    }
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
      <CommandIcon name={icon} /><span>{options.visibleLabel || label}</span>
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
            {command('New Design', 'new', newDesign, { ariaLabel: 'New Design' })}
            {command('Open Saved Design', 'open', () => setSavedDesignsOpen(true), { ariaLabel: 'Open Saved Design' })}
            {command(saveState, 'save', saveDesign, { disabled: !dirty || saveState === 'Saving…', status: dirty, ariaLabel: saveState, visibleLabel: 'Save' })}
            {command('Save As', 'duplicate', duplicateDesign, { ariaLabel: 'Save As' })}
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
            {command('Undo', 'undo', undo, { disabled: !history.length && !polishPast.length })}{command('Redo', 'redo', redo, { disabled: !future.length && !polishFuture.length })}
          </div>
        </section>
        <section className="nail-design-studio__command-group nail-design-studio__command-group--publish" aria-label="Publish">
          <h2>Publish</h2><div className="nail-design-studio__command-row">
            {command('Preview', 'share', () => changeComposition('spread'))}{command('Export', 'export', exportDesign)}
          </div>
        </section>
        <section className="nail-design-studio__command-group nail-design-studio__command-group--info" aria-label="Info">
          <h2>Info</h2><div className="nail-design-studio__command-row">
            {command('Nail Blueprint', 'info', () => setDetailsOpen(true))}
            {command('Proposal', 'collection', () => setDetailsOpen(true))}
            <label className="nail-design-studio__workspace-view">Workspace View selector<select aria-label="Workspace View selector" value={composition} onChange={(event) => changeComposition(event.target.value)}>{WORKSPACE_VIEWS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
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
        {leftPanelOpen && !focusMode && <aside id="creative-tools-panel" className="nail-design-studio__panel nail-design-studio__creative-tools" role="tabpanel" aria-labelledby={`nail-tool-${activeTool.id}`} tabIndex="0" onWheelCapture={(event) => {
          if (canScrollInWheelDirection(event.currentTarget, event.deltaY)) event.stopPropagation();
        }}>
          <div className="nail-design-studio__panel-heading" style={{ '--tool-accent': activeTool.accent }}><ToolIcon tool={activeTool} /><h2>{activeTool.label}</h2></div>
          {activeTool.id === 'technique' ? <FrenchTipControls value={frenchTips[activeNailIndex]} scope={applicationScope} onScopeChange={setApplicationScope} onChange={changeActiveFrenchTip} onApply={applyFrenchTip} notice={frenchTipNotice} /> : ['polish', 'effects'].includes(activeTool.id) ? <section className="nail-design-studio__polish-studio" aria-label={activeTool.id === 'polish' ? 'Polish Studio' : 'Effects Studio'} data-hero-material-engine="Hero Material Engine" data-hero-effect-engine="Hero Effect Engine" data-hero-lighting-engine="Hero Lighting Engine" data-hero-document-id={heroDocument.metadata.id}>
            <div className="nail-design-studio__active-polish" data-testid="active-polish-card">
              <div className="nail-design-studio__active-polish-heading"><span>{activeTool.id === 'effects' ? 'Active Effect' : 'Active Polish'}</span>{activeTool.id === 'polish' && <button type="button" className="nail-design-studio__polish-star" aria-label={activePolishSaved ? "Remove polish from Polish Rack" : "Save polish to Polish Rack"} aria-pressed={activePolishSaved} onClick={togglePolishSaved}>{activePolishSaved ? "★" : "☆"}</button>}</div>
              <div className="nail-design-studio__active-bottle"><PolishBottle size="medium" selected colorHex={activePolishColor} polishType={activeFinish} name={activePolishColor} opacity={appliedEffect.opacity} viscosity={appliedEffect.viscosity} shine={appliedEffect.shine} glitterDensity={activeFormulation.glitterDensity} shimmerIntensity={activeFormulation.shimmerIntensity} /></div>
              <div className="nail-design-studio__active-details">
                <label>Color / HEX<span className="nail-design-studio__color-row"><input aria-label="Base Color picker" type="color" value={activePolishColor} onChange={(event) => changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), event.target.value.toUpperCase())} /><input className="nail-design-studio__hex-input" aria-label="Base Color HEX" aria-invalid={hexInvalid} value={hexDraft} maxLength="7" onChange={(event) => { const value = event.target.value.toUpperCase(); if (/^#?[0-9A-F]{0,6}$/.test(value)) { setHexDraft(value); setHexInvalid(false); } }} onBlur={() => { if (/^#[0-9A-F]{6}$/.test(hexDraft)) changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), hexDraft); else { setHexInvalid(true); setHexDraft(activePolishColor); } }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></span></label>
                {activeTool.id === 'polish'
                  ? <label>Finish<select aria-label="Finish" value={activeFinish} onChange={(event) => changeFinish(event.target.value)}>{!VISIBLE_POLISH_FINISHES.includes(activeFinish) && <option hidden>{activeFinish}</option>}{VISIBLE_POLISH_FINISHES.map((finish) => <option key={finish}>{finish}</option>)}</select></label>
                  : <label>Effect<select aria-label="Effect" value={EFFECT_OPTIONS.some((option) => option.value === activeFinish) ? activeFinish : ''} onChange={(event) => changeFinish(event.target.value, undefined, false)}><option value="" disabled>Choose an effect</option>{EFFECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
              </div>
            </div>
            <section className="nail-design-studio__material-properties" aria-label="Polish material properties" data-testid="polish-material-properties">
            <label>Opacity <output>{Math.round(appliedEffect.opacity * 100)}%</output><input aria-label="Opacity" type="range" min="0" max="1" step=".01" value={appliedEffect.opacity} onChange={(event) => changeFinishParameter('opacity', Number(event.target.value))} /></label>
            <label>Shine <output>{Math.round(appliedEffect.shine * 100)}%</output><input aria-label="Shine" type="range" min="0" max="1" step=".01" value={appliedEffect.shine} onChange={(event) => changeFinishParameter('shine', Number(event.target.value))} /></label>
            <label>Viscosity <output>{Math.round(appliedEffect.viscosity * 100)}%</output><input aria-label="Viscosity" type="range" min="0" max="1" step=".01" value={appliedEffect.viscosity} onChange={(event) => changeFinishParameter('viscosity', Number(event.target.value))} /></label>
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Gradient' && <><label>Color B<input aria-label="Color B" type="color" value={heroDocument.nail.effect.parameters.colorB} onChange={(event) => changeFinishParameter('colorB', event.target.value.toUpperCase())} /></label><label>Direction <input aria-label="Direction" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.direction} onChange={(event) => changeFinishParameter('direction', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Cat Eye' && <><label>Stripe direction <input aria-label="Stripe direction" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.stripeDirection} onChange={(event) => changeFinishParameter('stripeDirection', Number(event.target.value))} /></label><label>Stripe width <input aria-label="Stripe width" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.stripeWidth} onChange={(event) => changeFinishParameter('stripeWidth', Number(event.target.value))} /></label><label>Stripe strength <input aria-label="Stripe strength" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.stripeStrength} onChange={(event) => changeFinishParameter('stripeStrength', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Marble' && <><label>Vein Color<input aria-label="Vein Color" type="color" value={heroDocument.nail.effect.parameters.veinColor} onChange={(event) => changeFinishParameter('veinColor', event.target.value.toUpperCase())} /></label><label>Vein density <input aria-label="Vein density" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.veinDensity} onChange={(event) => changeFinishParameter('veinDensity', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Jelly' && <label>Translucency <input aria-label="Translucency" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.translucency} onChange={(event) => changeFinishParameter('translucency', Number(event.target.value))} /></label>}
            {activeFinish === 'Jelly' && <label>Jelly Transparency <input aria-label="Jelly Transparency" type="range" min="0" max="1" step=".01" value={activeFormulation.translucency ?? .52} onChange={(event) => changeFinishParameter('translucency', Number(event.target.value))} /></label>}
            {activeFinish === 'Matte' && <label>Matte Softness <input aria-label="Matte Softness" type="range" min="0" max="1" step=".01" value={activeFormulation.matteSoftness ?? .72} onChange={(event) => changeFinishParameter('matteSoftness', Number(event.target.value))} /></label>}
            {activeFinish === 'Glass' && <label>Glass Clarity <input aria-label="Glass Clarity" type="range" min="0" max="1" step=".01" value={activeFormulation.glassClarity ?? .78} onChange={(event) => changeFinishParameter('glassClarity', Number(event.target.value))} /></label>}
            {activeFinish === 'Shimmer' && <label>Shimmer Intensity <input aria-label="Shimmer Intensity" type="range" min="0" max="1" step=".01" value={activeFormulation.shimmerIntensity ?? .42} onChange={(event) => changeFinishParameter('shimmerIntensity', Number(event.target.value))} /></label>}
            {activeFinish === 'Glitter' && <><label>Fleck Color<input aria-label="Fleck Color" type="color" value={activeFormulation.fleckColor} onChange={(event) => changeFinishParameter('fleckColor', event.target.value.toUpperCase())} /></label><label>Glitter Density <output>{Math.round((activeFormulation.glitterDensity ?? .46) * 100)}%</output><input aria-label="Glitter Density" type="range" min="0" max="1" step=".01" value={activeFormulation.glitterDensity ?? .46} onChange={(event) => changeFinishParameter('glitterDensity', Number(event.target.value))} /></label></>}
            {['Metallic', 'Chrome'].includes(activeFinish) && <label>Metallic Reflection <input aria-label="Metallic Reflection" type="range" min="0" max="1" step=".01" value={activeFormulation.metallicReflection ?? .76} onChange={(event) => changeFinishParameter('metallicReflection', Number(event.target.value))} /></label>}
            </section>
            {activeTool.id === 'polish' && <section className="nail-design-studio__polish-workflow" aria-label="Project polish workflow">
              <section className="nail-design-studio__project-palette" aria-label="Project Palette" data-testid="project-palette"><div><h3>Project Palette</h3><small>Polishes in this design</small></div>{projectPalette.length ? <div className="nail-design-studio__palette-swatches" role="list">{projectPalette.map((polish) => <button type="button" role="listitem" className="nail-design-studio__palette-swatch" data-testid="project-palette-swatch" data-polish-finish={polish.finish} aria-label={`Select ${polishDisplayHex(polish)} ${polish.finish}`} aria-pressed={polish.colorHex === activePolishColor && polish.finish === activeFinish} title={`${polishDisplayHex(polish)} · ${polish.finish}`} key={polish.signature || polishSignature(polish)} onClick={() => selectWorkflowPolish(polish)}><i style={{ '--swatch-color': polish.colorHex }} aria-hidden="true" /></button>)}</div> : <p>Your project colors will appear here as you design.</p>}</section>
              <section className="nail-design-studio__recent-polishes" aria-label="Recently Used" data-testid="recently-used"><div><h3>Recently Used</h3><small>Latest polish selections</small></div>{recentPolishes.length ? <div className="nail-design-studio__mini-bottles" role="list">{recentPolishes.map((polish) => <div role="listitem" key={polish.signature || polishSignature(polish)}><PolishBottle size="small" colorHex={polish.colorHex} polishType={polish.finish} name={polishDisplayHex(polish)} selected={polish.colorHex === activePolishColor && polish.finish === activeFinish} onClick={() => selectWorkflowPolish(polish)} /><span>{polishDisplayHex(polish)}</span></div>)}</div> : <p>No recent polish selections yet.</p>}</section>
            </section>}
            {activeTool.id === 'polish' && <><section className="nail-design-studio__apply-scope" role="radiogroup" aria-labelledby="apply-polish-heading"><h3 id="apply-polish-heading">Apply Polish To</h3>{[['current','Current Nail'],['selected','Selected Nails'],['left','Left Hand'],['right','Right Hand'],['full','Full Set']].map(([value,label]) => <label key={value}><input type="radio" name="polish-scope" checked={applicationScope === value} onChange={() => setApplicationScope(value)} />{label}</label>)}</section>
            <button type="button" className="nail-design-studio__polish-primary nail-design-studio__apply-polish" onClick={applyPolish}>Apply Polish</button><output className="nail-design-studio__polish-notice" aria-live="polite">{polishNotice}</output></>}
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
              {visibleNails.map(({ index, handClass, label }) => (
                <button type="button" className={`nail-design-studio__nail-slot nail-design-studio__nail-slot--${handClass}`} data-testid="nail-slot" data-active={activeNailIndex === index} data-selected={selectedNails.includes(index)} key={index} onClick={(event) => { selectActiveNail(index); if (event.shiftKey || event.ctrlKey || event.metaKey) setSelectedNails((items) => items.includes(index) ? items.filter((item) => item !== index) : [...items, index]); }} aria-pressed={selectedNails.includes(index)} aria-label={`Select ${label}`}>
                  <span className="nail-design-studio__finger-label">{label}</span>
                  <svg className="nail-design-studio__hero-nail" data-testid="stage-nail" data-nail-shape={nailShape.toLowerCase()}
                    data-active-polish-color={activePolishColor} data-applied-polish-color={nailPolishes[index]?.colorHex || ''} data-render-color={activeNailIndex === index ? activePolishColor : (nailPolishes[index]?.colorHex || activePolishColor)}
                    data-lighting-color-model={(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish)) === 'Cream' ? 'neutral-achromatic' : 'hero-environment'} data-effect-overlay-count={appliedEffect.id === 'Solid' ? '0' : Math.max(0, appliedEffect.layers.length - 1)}
                    data-hero-renderer="Hero Surface Rendering Engine" data-hero-mask={renderedSurface.maskId} data-design-layer-parent="true"
                    aria-label={`Hero Nail ${index + 1}`} viewBox={renderedSurface.viewBox} preserveAspectRatio="xMidYMid meet" role="img">
                    <defs>{appliedEffect.layers.map((layer, layerIndex) => layer.kind === 'linear-gradient' && <linearGradient key={layerIndex} id={`hero-finish-${index}-${layerIndex}`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${layer.angle ?? 90} .5 .5)`}>{layer.colors.map((color, stop) => <stop key={stop} offset={`${stop / Math.max(1, layer.colors.length - 1) * 100}%`} stopColor={color} />)}</linearGradient>)}<radialGradient id={`hero-light-apex-${index}`} cx="50%" cy="28%" r="58%"><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity={nailStageLightingOpacity(index, 'apex', appliedLighting.reflections[3].opacity)} /><stop offset="56%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity={nailStageLightingOpacity(index, 'apex', appliedLighting.reflections[3].opacity * .22)} /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity="0" /></radialGradient><linearGradient id={`hero-light-primary-${index}`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${appliedLighting.reflections[0].angle} .5 .5)`}><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity="0" /><stop offset="42%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity={nailStageLightingOpacity(index, 'primary', appliedLighting.reflections[0].opacity)} /><stop offset="62%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity={nailStageLightingOpacity(index, 'primary', appliedLighting.reflections[0].opacity * .36)} /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity="0" /></linearGradient><linearGradient id={`hero-light-edge-${index}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity={nailStageLightingOpacity(index, 'edge', appliedLighting.reflections[2].opacity)} /><stop offset="22%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity="0" /><stop offset="78%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity="0" /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity={nailStageLightingOpacity(index, 'edge', appliedLighting.reflections[2].opacity * .72)} /></linearGradient><linearGradient id={`hero-light-depth-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000000" stopOpacity="0" /><stop offset="100%" stopColor="#000000" stopOpacity={appliedLighting.reflections[4].opacity} /></linearGradient></defs>
                    <MaterialLayers path={renderedSurface.path} surfaceBounds={renderedSurface.bounds} finish={activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish)} color={activeNailIndex === index ? activePolishColor : (nailPolishes[index]?.colorHex || activePolishColor)} fleckColor={activeNailIndex === index ? activeFormulation.fleckColor : (nailPolishes[index]?.fleckColor || activeFormulation.fleckColor)} glitterDensity={activeNailIndex === index ? activeFormulation.glitterDensity : (nailPolishes[index]?.glitterDensity ?? activeFormulation.glitterDensity)} opacity={activeNailIndex === index ? appliedEffect.layers[0].opacity : (nailPolishes[index]?.opacity ?? appliedEffect.layers[0].opacity)} shine={activeNailIndex === index ? appliedEffect.shine : (nailPolishes[index]?.shine ?? appliedEffect.shine)} uid={`hero-material-${index}`} baseProps={{ className: 'nail-design-studio__nail-polish', 'data-design-layer': 'polish', 'data-hero-material-layer': 'true', 'data-polish-finish': activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), 'data-hero-effect': appliedEffect.id, 'data-hero-lighting': 'Hero Lighting Engine', 'data-hero-reflection': appliedLighting.profile.reflection, 'data-material-id': renderedSurface.material.id }}/>
                    <FrenchTipRegion data={frenchTips[index]} nailPath={renderedSurface.path} bounds={renderedSurface.bounds} uid={`hero-french-${index}`} />
                    {appliedEffect.layers.slice(1).map((layer, layerIndex) => layer.kind === 'linear-gradient' ? <path key={layerIndex} d={renderedSurface.path} fill={`url(#hero-finish-${index}-${layerIndex + 1})`} opacity={layer.opacity} /> : layer.paths?.map((path, pathIndex) => <path key={`${layerIndex}-${pathIndex}`} d={path} stroke={layer.color} opacity={layer.opacity} fill="none" vectorEffect="non-scaling-stroke" />))}
                    <path d={renderedSurface.path} fill={`url(#hero-light-depth-${index})`} opacity={appliedLighting.profile.veinPreservation} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-apex-${index})`} style={{ mixBlendMode: 'screen' }} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-primary-${index})`} style={{ mixBlendMode: 'screen' }} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-edge-${index})`} style={{ mixBlendMode: 'screen' }} />
                  </svg>
                </button>
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
      <footer className="nail-design-studio__bottom-workspace nail-design-studio__bottom-workspace--complete" data-testid="design-studio-bottom-workspace" aria-label="Design Studio bottom workspace">
        <section className="nail-design-studio__workspace-module nail-design-studio__workspace-module--inspiration" aria-label="Design Inspiration">
          <div className="nail-design-studio__module-heading"><div><span>Design Inspiration</span><strong>Editorial looks</strong></div><button type="button" onClick={() => window.alert('Opening full Design Inspiration library')}>See All</button></div>
          <div className="nail-design-studio__inspiration-strip" role="list">
            {INSPIRATION_CARDS.map((card) => <button type="button" role="listitem" className="nail-design-studio__inspiration-card" key={card.id} onClick={() => window.alert(`Previewing ${card.title}`)}>
              <i className="nail-design-studio__inspiration-art" style={{ backgroundImage: `url(${card.src})` }} aria-hidden="true" /><span>{card.title}</span><small>{card.tone}</small>
            </button>)}
          </div>
        </section>
        <section className="nail-design-studio__workspace-module nail-design-studio__workspace-module--polish" aria-label="Polish Rack">
          <div className="nail-design-studio__module-heading"><div><span>Polish Rack™</span><strong>Saved collection</strong></div><button type="button" onClick={() => setCollectionOpen(true)}>See All</button></div>
          <div className="nail-design-studio__shelf" role="list">
            {savedPolishes.map((polish) => <div role="listitem" className="nail-design-studio__lower-polish" key={polish.id}><PolishBottle size="small" colorHex={polish.colorHex} polishType={polish.finish} name={polishDisplayHex(polish)} selected={polish.colorHex === activePolishColor && polish.finish === activeFinish} onClick={() => selectSavedPolish(polish)} /><span>{polish.favorite ? '★ ' : ''}{polishDisplayHex(polish)}</span></div>)}
          </div>
        </section>
        <section className="nail-design-studio__workspace-module nail-design-studio__workspace-module--assets" aria-label="Asset Library shortcuts">
          <div className="nail-design-studio__module-heading"><div><span>Asset Library</span><strong>Quick launch</strong></div><button type="button" onClick={() => window.alert('Opening full Asset Library')}>See All</button></div>
          <div className="nail-design-studio__asset-grid">{ASSET_SHORTCUTS.map((asset) => <button type="button" key={asset.id} className="nail-design-studio__asset-shortcut" onClick={() => window.alert(`Opening ${asset.label}`)}><i style={{ background: asset.gradient }} /><span>{asset.label}</span></button>)}</div>
        </section>
        <section className="nail-design-studio__workspace-module nail-design-studio__workspace-module--details" aria-label="Design Details summary">
          <div className="nail-design-studio__module-heading"><div><span>Design Details</span><strong>{designName}</strong></div></div>
          <dl className="nail-design-studio__details-list"><div><dt>Created</dt><dd>Today</dd></div><div><dt>Last Modified</dt><dd>{dirty ? 'Unsaved edits' : 'Saved'}</dd></div><div><dt>Dimensions</dt><dd>{activeComposition.nails} nail workspace</dd></div><div><dt>Nail Shape</dt><dd>{nailShape}</dd></div><div><dt>Collection</dt><dd>AnitaSet Atelier</dd></div></dl>
          <button type="button" className="nail-design-studio__save-large" onClick={saveDesign} disabled={!dirty || saveState === 'Saving…'}>{saveState === 'Saved' ? 'Saved' : 'Save Changes'}</button>
        </section>
        <nav className="nail-design-studio__workspace-nav" aria-label="Workspace Navigation">
          {COMPOSITIONS.filter((item) => ['single', 'left', 'right', 'full'].includes(item.id)).map((item) => <button type="button" key={item.id} aria-pressed={composition === item.id} onClick={() => changeComposition(item.id)}>{item.label}</button>)}
          <button type="button" aria-pressed={focusMode} onClick={() => setFocusMode((focused) => !focused)}>Focus Perspective</button><button type="button" onClick={() => window.alert('3D preview launching soon')}>3D</button>
        </nav>
      </footer>
    </section>
  );
});

export default NailDesignStudio;
