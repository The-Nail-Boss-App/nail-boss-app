import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import {
  applyHeroEffectToSurface, applyHeroLightingToEffect, createHeroDesignDocument, createHeroSurfaceInput, HeroDesignEventBus,
  HeroEngineRegistry, HeroLocalStoragePersistenceAdapter, HeroSurfaceRenderingEngine, createMarbleVeinModel, deformMarbleControlPoints, nearestMarbleCenterlinePoint, marbleWidthBoundsForClass, CUSTOM_MARBLE_STREAM_LIMITS, marbleRibbonBounds, marbleRibbonParticleBounds, marbleRibbonPath, initialHeroDesignState,
  heroDesignReducer, registerHeroEffectEngine, registerHeroLightingEngine, updateHeroEffect, updateHeroShape,
} from '../hero-design/index.ts';
import { USER_FACING_NAIL_SHAPES } from '../config/features';
import PolishBottle from '../design-studio/PolishBottle';
import { MaterialLayers } from './MaterialRenderer';
import { FINISH_DEFAULTS, VISIBLE_POLISH_FINISHES, colorBlockEffect, heroEffectForPolish, negativeSpaceEffect, normalizePersistedAuraEffect, normalizePolishForFinish, polishSignature } from './polishFinish';
import { addProjectPolish, touchRecentPolish } from '../design-studio/polishWorkflow';
import { FrenchTipControls, FrenchTipRegion, loadFrenchTips } from './FrenchTip';
import { createMarbleSetSeed, deriveCoordinationFromNail, detachMarbleParameters, normalizeMarbleSetCoordination, resolveMarbleRenderState } from './marbleSetCoordination';
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
  Object.freeze({ value: 'Aura', label: 'Aura' }),
  Object.freeze({ value: 'ColorBlock', label: 'Color Block' }),
  Object.freeze({ value: 'NegativeSpace', label: 'Negative Space' }),
]);

function ToolIcon({ tool }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d={tool.icon} /></svg>;
}

const marbleColor = (hex, amount) => {
  const value = parseInt(hex.slice(1), 16);
  const channel = (shift) => Math.max(0, Math.min(255, ((value >> shift) & 255) + amount)).toString(16).padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
};

const metallicMarbleColor = (hex) => {
  const value = parseInt(hex.slice(1), 16); const r = value >> 16; const g = value >> 8 & 255; const b = value & 255;
  const range = Math.max(r, g, b) - Math.min(r, g, b);
  return (r > 110 && g > 70 && r > b * 1.15) || (range < 32 && r > 80 && r < 235);
};

const marbleSplineSegments = (points, fallback) => points.length < 2 ? [fallback] : points.slice(0, -1).map((p1, index) => {
  const p0 = points[Math.max(0, index - 1)], p2 = points[index + 1], p3 = points[Math.min(points.length - 1, index + 2)];
  return `M ${p1.x} ${p1.y} C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6} ${p2.x} ${p2.y}`;
});
const profileWidth = (profile, position) => position <= .5 ? profile.start + (profile.middle - profile.start) * position * 2 : profile.middle + (profile.end - profile.middle) * (position - .5) * 2;

function MarbleVeins({ effect, nailIdentity, clipId, selectedId, interactionOnly = false, onSelect, onBodyDown, onPointDown, onWidthDown }) {
  const streams = createMarbleVeinModel(effect, nailIdentity);
  const stableNailId = nailIdentity.match(/nail-\d+$/)?.[0] || nailIdentity;
  const transform = resolveMarbleRenderState(effect, effect.parameters.marbleSetCoordination, stableNailId).parameters.marbleTransform || { panX: 0, panY: 0, scale: 1, rotation: 0 };
  const groupTransform = `translate(${transform.panX || 0} ${transform.panY || 0}) translate(120 180) rotate(${transform.rotation || 0}) scale(${transform.scale || 1}) translate(-120 -180)`;
  return <g data-effect-layer="marble" data-marble-alpha="localized-stream-geometry-only" data-marble-model="primary-secondary-hairline-diffusion" data-marble-clip-authority="hero-nail-mask" clipPath={`url(#${clipId})`}>
    <g data-marble-transform={groupTransform} transform={groupTransform}>
    {streams.filter((stream) => stream.visible).map((stream) => {
      const primary = stream.veinClass === 'primary'; const secondary = stream.veinClass === 'secondary'; const diffusion = stream.veinClass === 'diffusion';
      const metallic = stream.finish === 'Glitter' || (!diffusion && metallicMarbleColor(stream.color)); const bodyWidth = stream.width * (primary ? 2.15 : secondary ? 1.72 : diffusion ? 1 : 1.18);
      const dash = primary ? '38 7 18 3 52 9' : secondary ? '20 4 9 3 27 6' : '11 3 18 5';
      const segments = marbleSplineSegments(stream.controlPoints, stream.path); const finishOpacity = stream.finish === 'Jelly' ? .52 : 1;
      const ribbon = !diffusion && marbleRibbonPath(stream.controlPoints, stream.width, stream.widthProfile);
      const ribbonBounds = !diffusion && marbleRibbonBounds(ribbon);
      const particleBounds = !diffusion && marbleRibbonParticleBounds(ribbon);
      return <g key={stream.id} data-marble-stream={stream.veinClass} data-stream-id={stream.id} data-metallic={metallic || undefined}>
        {!interactionOnly && <>
        {stream.softness > 0 && <path data-vein-component="localized-diffusion" d={stream.path} stroke={stream.color} strokeWidth={bodyWidth + stream.softness * 1.4} strokeOpacity={stream.opacity * (diffusion ? .62 : .14)} fill="none" strokeLinecap="round" strokeDasharray={diffusion ? '46 18 25 12' : '64 22 31 15'} vectorEffect="non-scaling-stroke" style={{ filter: `blur(${stream.softness}px)` }} />}
        {diffusion ? segments.map((path, segment) => <path key={`core-${segment}`} data-vein-component="variable-width-core" data-width-position={segment} d={path} stroke={stream.color} strokeWidth={stream.width * profileWidth(stream.widthProfile, (segment + .5) / segments.length)} strokeOpacity={stream.opacity * finishOpacity} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />) : <g data-vein-component="localized-formulation" data-local-bounds={`${ribbonBounds.x},${ribbonBounds.y},${ribbonBounds.width},${ribbonBounds.height}`} data-particle-region-count={particleBounds.length} opacity={stream.opacity} style={stream.softness ? { filter: `blur(${stream.softness}px)` } : undefined}><MaterialLayers path={ribbon} surfaceBounds={ribbonBounds} particleBounds={particleBounds} finish={stream.finish} color={stream.color} fleckColor={marbleColor(stream.color, 72)} glitterDensity={.46} opacity={1} shine={effect.parameters.shine || .68} uid={`marble-${nailIdentity.replace(/[^a-z0-9]/gi, '-')}-${stream.id}`} baseProps={{ 'data-vein-component': 'variable-width-ribbon', 'data-width-profile': `${stream.widthProfile.start},${stream.widthProfile.middle},${stream.widthProfile.end}` }}/></g>}
        {!diffusion && stream.finish !== 'Matte' && <path data-vein-component="fracture" d={stream.path} stroke={marbleColor(stream.color, metallic ? 42 : 16)} strokeWidth={Math.max(.16, stream.width * (primary ? .27 : .2))} strokeOpacity={stream.opacity * .72 * finishOpacity} fill="none" strokeLinecap="round" strokeDasharray={primary ? '3 11 1 17 6 23' : '2 13 5 19'} strokeDashoffset={stream.id.length * 3} vectorEffect="non-scaling-stroke" />}
        {metallic && stream.finish !== 'Matte' && <path data-vein-component="metallic-highlight" d={stream.path} stroke={marbleColor(stream.color, 78)} strokeWidth={Math.max(.18, stream.width * .22)} strokeOpacity={stream.opacity * .78 * finishOpacity} fill="none" strokeLinecap="round" strokeDasharray="8 21 2 13 14 30" strokeDashoffset={stream.id.charCodeAt(0)} vectorEffect="non-scaling-stroke" />}
        {(primary || secondary) && <path data-vein-component="mineral-fragments" d={stream.path} stroke={marbleColor(stream.color, metallic ? 58 : 20)} strokeWidth={Math.max(.22, stream.width * .42)} strokeOpacity={stream.opacity * .48} fill="none" strokeLinecap="round" strokeDasharray=".4 24 .7 17 1.2 31" strokeDashoffset={stream.id.length * 7} vectorEffect="non-scaling-stroke" />}
        </>}
        {interactionOnly && onSelect && <path data-marble-hit-target={stream.id} d={stream.path} stroke="transparent" strokeWidth={Math.max(14, bodyWidth + 10)} fill="none" pointerEvents="stroke" strokeLinecap="round" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { event.stopPropagation(); onSelect(stream.id, stream.color); onBodyDown?.(event, stream); }} />}
        {selectedId === stream.id && onSelect && <path data-marble-selection={stream.id} d={stream.path} stroke="#C8FF4A" strokeWidth={bodyWidth + 2.2} strokeOpacity=".34" fill="none" pointerEvents="none" strokeLinecap="round" />}
        {interactionOnly && selectedId === stream.id && stream.controlPoints.map((point, pointIndex) => <circle key={`shape-${pointIndex}`} data-marble-control-point={pointIndex} data-handle-kind={pointIndex === 0 ? 'start' : pointIndex === stream.controlPoints.length - 1 ? 'end' : 'shape'} aria-label={pointIndex === 0 ? 'Vein start handle' : pointIndex === stream.controlPoints.length - 1 ? 'Vein end handle' : `Vein shape handle ${pointIndex}`} cx={point.x} cy={point.y} r="4.6" fill="#111318" stroke="#C8FF4A" strokeWidth="1.5" onPointerDown={(event) => { event.stopPropagation(); onPointDown(event, stream, pointIndex); }} />)}
        {interactionOnly && selectedId === stream.id && ['start', 'middle', 'end'].map((position, profileIndex) => {
          const pointIndex = profileIndex === 0 ? 0 : profileIndex === 1 ? Math.floor((stream.controlPoints.length - 1) / 2) : stream.controlPoints.length - 1;
          const point = stream.controlPoints[pointIndex]; const neighbor = stream.controlPoints[pointIndex === 0 ? 1 : pointIndex - 1];
          const length = Math.hypot(point.x - neighbor.x, point.y - neighbor.y) || 1; const nx = -(point.y - neighbor.y) / length; const ny = (point.x - neighbor.x) / length;
          const distance = Math.max(8, stream.width * stream.widthProfile[position] * .75 + 7); const hx = point.x + nx * distance; const hy = point.y + ny * distance;
          return <g key={`width-${position}`} data-marble-width-handle={position}><line x1={point.x} y1={point.y} x2={hx} y2={hy} stroke="#7DEBFF" strokeWidth="1" pointerEvents="none"/><rect aria-label={`${position} width handle`} x={hx - 3.8} y={hy - 3.8} width="7.6" height="7.6" rx="1" fill="#111318" stroke="#7DEBFF" strokeWidth="1.5" transform={`rotate(45 ${hx} ${hy})`} onPointerDown={(event) => { event.stopPropagation(); onWidthDown(event, stream, position, point, { x: nx, y: ny }); }}/></g>;
        })}
      </g>;
    })}
    </g>
  </g>;
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
const loadMarbleSetCoordination = () => {
  try { return normalizeMarbleSetCoordination(JSON.parse(window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero'))?.metadata?.marbleSetCoordination); } catch { return normalizeMarbleSetCoordination(); }
};
const loadMarbleNailStates = () => {
  try { const value = JSON.parse(window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero'))?.metadata?.marbleNailStates; return value && typeof value === 'object' ? value : {}; } catch { return {}; }
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
// Marble is a transparent decoration over the selected Cream material. It must
// not opt the full Hero surface into an effect-specific reflective response.
export const surfaceMaterialFinish = (finish) => ['Solid', 'Marble'].includes(finish) ? 'Cream' : finish;
const baseColorKey = (finish) => finish === 'Gradient' ? 'colorA' : finish === 'ColorBlock' ? 'primaryColor' : 'baseColor';
const stageLightingColor = (finish, configuredColor) => surfaceMaterialFinish(finish) === 'Cream' ? '#FFFFFF' : configuredColor;

export function ColorBlockRegions({ layer, bounds, clipId }) {
  const { x, y, width, height } = bounds;
  const position = Math.min(1, Math.max(0, Number(layer.position)));
  let first; let second;
  if (layer.direction === 'horizontal') {
    const split = y + height * position;
    first = `${x},${y} ${x + width},${y} ${x + width},${split} ${x},${split}`;
    second = `${x},${split} ${x + width},${split} ${x + width},${y + height} ${x},${y + height}`;
  } else if (layer.direction === 'diagonal') {
    const top = x + width * Math.min(1, position * 2);
    const bottom = x + width * Math.max(0, position * 2 - 1);
    first = `${x},${y} ${top},${y} ${bottom},${y + height} ${x},${y + height}`;
    second = `${top},${y} ${x + width},${y} ${x + width},${y + height} ${bottom},${y + height}`;
  } else {
    const split = x + width * position;
    first = `${x},${y} ${split},${y} ${split},${y + height} ${x},${y + height}`;
    second = `${split},${y} ${x + width},${y} ${x + width},${y + height} ${split},${y + height}`;
  }
  return <g data-effect-layer="color-block" data-block-direction={layer.direction} data-split-position={position} clipPath={`url(#${clipId})`} opacity={layer.opacity}>
    <polygon data-color-block-region="a" points={first} fill={layer.colors[0]} />
    <polygon data-color-block-region="b" points={second} fill={layer.colors[1]} />
  </g>;
}

export function NegativeSpaceReveal({ layer, bounds }) {
  const { x, y, width, height } = bounds;
  const position = Math.min(1, Math.max(0, Number(layer.position)));
  const size = Math.min(1, Math.max(.08, Number(layer.size)));
  if (layer.revealType === 'horizontal-band') {
    const revealHeight = height * size;
    return <rect data-negative-space-region="horizontal-band" x={x - width * .1} y={y + height * position - revealHeight / 2} width={width * 1.2} height={revealHeight} fill="black" />;
  }
  if (layer.revealType === 'diagonal-band') {
    const revealWidth = width * size;
    const centerX = x + width * position;
    const centerY = y + height / 2;
    return <rect data-negative-space-region="diagonal-band" x={centerX - revealWidth / 2} y={y - height * .25} width={revealWidth} height={height * 1.5} fill="black" transform={`rotate(${Number(layer.rotation)} ${centerX} ${centerY})`} />;
  }
  if (layer.revealType === 'center-cutout') {
    return <ellipse data-negative-space-region="center-cutout" cx={x + width * position} cy={y + height / 2} rx={width * size / 2} ry={height * size / 2} fill="black" />;
  }
  const revealWidth = width * size;
  return <rect data-negative-space-region="vertical-band" x={x + width * position - revealWidth / 2} y={y - height * .1} width={revealWidth} height={height * 1.2} fill="black" />;
}

function DesignCoverage({ active, maskId, children }) {
  return active ? <g data-design-coverage="polish-and-effect" mask={`url(#${maskId})`}>{children}</g> : children;
}

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
  if (surfaceMaterialFinish(finish) === 'Cream') return opacity * creamHeroSurfaceResponse(shine)[role];
  if (finish === 'Glitter') return opacity * glitterHeroSurfaceResponse(shine)[role];
  if (finish === 'Jelly') return opacity * jellyHeroSurfaceResponse(shine)[role];
  if (finish === 'Matte') return opacity * matteHeroSurfaceResponse[role];
  return opacity;
};

export function initialNailDeskHeroState() {
  const fallback = createHeroDesignDocument({ id: 'nail-desk-hero', name: 'Untitled Design', shapeId: 'Almond', maskId: 'almond-mask' });
  try {
    const stored = window.localStorage.getItem('anitaset.hero-design.v1:nail-desk-hero');
    if (!stored) return heroDesignReducer(initialHeroDesignState, { type: 'createDesign', document: fallback });
    const parsed = JSON.parse(stored);
    const finish = interfaceFinish(parsed?.metadata?.activePolishFormulation?.finish || parsed?.nail?.effect?.id || 'Cream');
    const persistedParameters = parsed?.nail?.effect?.parameters || {};
    const normalized = normalizePolishForFinish({ ...persistedParameters, ...parsed?.metadata?.activePolishFormulation, ...(parsed?.nail?.effect?.id === 'Marble' ? { marbleGeometryVersion: persistedParameters.marbleGeometryVersion } : {}) }, finish, { marbleGeometryFallback: 1 });
    const persistedEffect = parsed?.nail?.effect;
    const mountedEffect = persistedEffect?.id === 'ColorBlock' ? colorBlockEffect(persistedEffect.parameters) : persistedEffect?.id === 'NegativeSpace' ? negativeSpaceEffect(persistedEffect.parameters) : normalizePersistedAuraEffect(persistedEffect);
    const document = { ...parsed, nail: { ...parsed.nail, effect: mountedEffect || heroEffectForPolish(normalized) } };
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
  const [selectedFinish, setSelectedFinish] = useState(() => ['ColorBlock', 'NegativeSpace'].includes(initialNailDeskHeroState().document.nail.effect.id) ? initialNailDeskHeroState().document.nail.effect.id : normalizePolishForFinish(loadActivePolish() || {}, loadActivePolish()?.finish || interfaceFinish(initialNailDeskHeroState().document.nail.effect.id)).finish);
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
  const [moveMarble, setMoveMarble] = useState(false);
  const [selectedMarbleStream, setSelectedMarbleStream] = useState('primary-0');
  const [marbleHexDraft, setMarbleHexDraft] = useState('#8A405D');
  const [marbleSetCoordination, setMarbleSetCoordination] = useState(loadMarbleSetCoordination);
  const [marbleNailStates, setMarbleNailStates] = useState(loadMarbleNailStates);
  const [marbleSetMode, setMarbleSetMode] = useState(() => loadMarbleSetCoordination().mode);
  const [marbleSetVariation, setMarbleSetVariation] = useState('medium');
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
  const appliedLighting = useMemo(() => {
    if (heroDocument.nail.effect.id !== 'Marble') return applyHeroLightingToEffect(heroDocument, appliedEffect, heroLightingEngine);
    const surfaceDocument = { ...heroDocument, nail: { ...heroDocument.nail, effect: { id: 'Solid', version: '1', parameters: { baseColor: heroDocument.nail.effect.parameters.baseColor, shine: heroDocument.nail.effect.parameters.shine } } } };
    const surfaceEffect = applyHeroEffectToSurface(surfaceDocument, renderedSurface, heroEffectEngine);
    return applyHeroLightingToEffect(surfaceDocument, surfaceEffect, heroLightingEngine);
  }, [heroDocument, appliedEffect, renderedSurface, heroEffectEngine, heroLightingEngine]);
  const activePolishColor = heroDocument.nail.effect.id === 'NegativeSpace' ? finishFormulation.colorHex : heroDocument.nail.effect.parameters[baseColorKey(heroDocument.nail.effect.id)];
  const activeFinish = selectedFinish;
  const activeFormulation = ['ColorBlock', 'NegativeSpace'].includes(activeFinish) ? finishFormulation : normalizePolishForFinish({ ...finishFormulation, ...heroDocument.nail.effect.parameters, name: polishName, colorHex: activePolishColor }, activeFinish);
  const activePolishSaved = savedPolishes.some((item) => (item.signature || polishSignature(item)) === polishSignature(activeFormulation));
  const nailStageFinish = (index) => surfaceMaterialFinish(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish));
  const nailStageShine = (index) => activeNailIndex === index ? appliedEffect.shine : (nailPolishes[index]?.shine ?? appliedEffect.shine);
  const nailStageLightingOpacity = (index, role, opacity) => stageLightingOpacity(nailStageFinish(index), nailStageShine(index), role, opacity);
  const marbleEffectForNail = (index) => heroDocument.nail.effect.id !== 'Marble' ? heroDocument.nail.effect : { ...heroDocument.nail.effect, parameters: { ...(index === activeNailIndex ? heroDocument.nail.effect.parameters : marbleNailStates[`nail-${index}`] || heroDocument.nail.effect.parameters), marbleSetCoordination } };
  const marbleStreams = heroDocument.nail.effect.id === 'Marble' ? createMarbleVeinModel(marbleEffectForNail(activeNailIndex), `${heroDocument.metadata.id}:nail-${activeNailIndex}`) : [];
  // The generator keeps a stable maximum inventory so density can reveal veins
  // without reshuffling geometry. That reserve is renderer state, not an artist
  // selection list. Keep only rendered streams, plus explicitly hidden/custom
  // streams that the artist can intentionally show again.
  const artistMarbleStreams = marbleStreams.filter((stream) => stream.visible || stream.custom || heroDocument.nail.effect.parameters.streamOverrides?.[stream.id]?.visible === false);
  const selectedStream = artistMarbleStreams.find(({ id }) => id === selectedMarbleStream) || artistMarbleStreams[0];
  useEffect(() => {
    if (drag.current?.vein && (moveMarble || !selectedStream?.visible || drag.current.streamId !== selectedStream.id)) {
      const activeDrag = drag.current;
      if (activeDrag.captureTarget?.hasPointerCapture?.(activeDrag.pointerId)) activeDrag.captureTarget.releasePointerCapture?.(activeDrag.pointerId);
      drag.current = null;
    }
  }, [moveMarble, selectedStream?.id, selectedStream?.visible]);

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
    if (finish === 'ColorBlock') {
      setSelectedFinish('ColorBlock');
      changeHero((current) => updateHeroEffect(current, colorBlockEffect({ primaryColor: nextColor || activePolishColor }), heroEvents.current));
      return;
    }
    if (finish === 'NegativeSpace') {
      setSelectedFinish('NegativeSpace');
      changeHero((current) => updateHeroEffect(current, negativeSpaceEffect(), heroEvents.current));
      return;
    }
    const normalized = normalizePolishForFinish({ ...activeFormulation, colorHex: nextColor || activePolishColor }, finish);
    setSelectedFinish(normalized.finish);
    setFinishFormulation(normalized);
    if (rememberSelection) rememberPolish(normalized);
    changeHero((current) => updateHeroEffect(current, heroEffectForPolish(normalized), heroEvents.current));
  };
  const changeFinishParameter = (key, value) => {
    if (activeFinish === 'ColorBlock') {
      changeHero((current) => updateHeroEffect(current, colorBlockEffect({ ...current.document.nail.effect.parameters, [key]: value }), heroEvents.current));
      return;
    }
    if (activeFinish === 'NegativeSpace') {
      changeHero((current) => updateHeroEffect(current, negativeSpaceEffect({ ...current.document.nail.effect.parameters, [key]: value }), heroEvents.current));
      return;
    }
    // Marble geometry is authored document state. Do not round-trip a pointer
    // frame through the render-derived formulation snapshot: rapid pointer
    // events can otherwise rebuild from an older streamOverrides object after
    // the final live frame. Merge against the reducer's current document so the
    // last geometryOverride remains authoritative through pointer-up/rerender.
    if (activeFinish === 'Marble' && heroDocument.nail.effect.id === 'Marble') {
      const preview = normalizePolishForFinish({ ...activeFormulation, ...heroDocument.nail.effect.parameters, [key]: value }, activeFinish);
      setFinishFormulation(preview);
      changeHero((current) => updateHeroEffect(current, { ...current.document.nail.effect, parameters: { ...current.document.nail.effect.parameters, [key]: value } }, heroEvents.current));
      return;
    }
    const next = normalizePolishForFinish({ ...activeFormulation, [key]: value, ...(['baseColor', 'colorA'].includes(key) ? { colorHex: value } : {}) }, activeFinish);
    setFinishFormulation(next);
    if (activeTool.id === 'polish' && ['baseColor', 'colorA'].includes(key)) rememberPolish(next);
    const hero = heroEffectForPolish(next);
    changeHero((current) => updateHeroEffect(current, hero, heroEvents.current));
  };
  const changeMarbleTransform = (key, value) => changeFinishParameter('marbleTransform', { ...heroDocument.nail.effect.parameters.marbleTransform, [key]: value });
  const changeStreamOverride = (key, value) => {
    if (!selectedStream) return;
    const overrides = heroDocument.nail.effect.parameters.streamOverrides || {};
    changeFinishParameter('streamOverrides', { ...overrides, [selectedStream.id]: { ...overrides[selectedStream.id], [key]: value } });
  };
  const randomizeMarble = () => {
    const overrides = Object.fromEntries(Object.entries(heroDocument.nail.effect.parameters.streamOverrides || {}).map(([id, override]) => [id, id.startsWith('custom-') ? override : Object.fromEntries(Object.entries(override).filter(([key]) => !['geometryOverride', 'widthProfile'].includes(key))) ]));
    const parameters = { ...heroDocument.nail.effect.parameters, marbleSeed: `marble-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`, streamOverrides: overrides };
    changeHero((current) => updateHeroEffect(current, { ...current.document.nail.effect, parameters }, heroEvents.current));
  };
  const selectMarbleStream = (id, streamColor) => { setSelectedMarbleStream(id); setMarbleHexDraft(streamColor); };
  const resetSelectedVein = () => {
    if (!selectedStream) return; const overrides = { ...(heroDocument.nail.effect.parameters.streamOverrides || {}) };
    delete overrides[selectedStream.id];
    changeFinishParameter('streamOverrides', overrides); setMarbleHexDraft(heroDocument.nail.effect.parameters.veinColor);
  };
  const addMarbleVein = (veinClass) => {
    const customStreams = heroDocument.nail.effect.parameters.customStreams || {}; const count = Object.values(customStreams).filter((stream) => stream.veinClass === veinClass).length;
    if (count >= CUSTOM_MARBLE_STREAM_LIMITS[veinClass]) return;
    const id = `custom-${veinClass}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; const offset = count * 14;
    const width = marbleWidthBoundsForClass(veinClass).default; const points = [{ x: 38 + offset, y: 292 }, { x: 76 + offset, y: 248 }, { x: 105 + offset, y: 194 }, { x: 139 + offset, y: 142 }];
    const stream = { veinClass, controlPoints: points, creationBaseline: points, width, widthProfile: { start: 1.2, middle: 1, end: .3 }, formulation: { color: heroDocument.nail.effect.parameters.veinColor, finish: 'Cream' }, opacity: veinClass === 'hairline' ? .42 : .72, softness: 0, visible: true };
    changeFinishParameter('customStreams', { ...customStreams, [id]: stream }); setSelectedMarbleStream(id); setMarbleHexDraft(stream.formulation.color);
  };
  const duplicateMarbleVein = () => {
    if (!selectedStream || selectedStream.veinClass === 'diffusion') return; const veinClass = selectedStream.veinClass; const customStreams = heroDocument.nail.effect.parameters.customStreams || {};
    if (Object.values(customStreams).filter((stream) => stream.veinClass === veinClass).length >= CUSTOM_MARBLE_STREAM_LIMITS[veinClass]) return;
    const id = `custom-${veinClass}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`; const points = selectedStream.controlPoints.map(({ x, y }) => ({ x: x + 9, y: y + 7 }));
    const stream = { veinClass, controlPoints: points, creationBaseline: points, width: selectedStream.width, widthProfile: { ...selectedStream.widthProfile }, formulation: { color: selectedStream.color, finish: selectedStream.finish }, opacity: selectedStream.opacity, softness: selectedStream.softness, visible: selectedStream.visible };
    changeFinishParameter('customStreams', { ...customStreams, [id]: stream }); setSelectedMarbleStream(id); setMarbleHexDraft(stream.formulation.color);
  };
  const deleteMarbleVein = () => {
    if (!selectedStream || !window.confirm('Delete this vein?')) return;
    const deletedId = selectedStream.id; const fallback = marbleStreams.find((stream) => stream.id !== deletedId);
    if (selectedStream.custom) { const customStreams = { ...(heroDocument.nail.effect.parameters.customStreams || {}) }; delete customStreams[selectedStream.id]; const overrides = { ...(heroDocument.nail.effect.parameters.streamOverrides || {}) }; delete overrides[selectedStream.id]; const parameters = { ...heroDocument.nail.effect.parameters, customStreams, streamOverrides: overrides }; changeHero((current) => updateHeroEffect(current, { ...current.document.nail.effect, parameters }, heroEvents.current)); }
    else changeFinishParameter('deletedStreamIds', [...new Set([...(heroDocument.nail.effect.parameters.deletedStreamIds || []), selectedStream.id])]);
    setSelectedMarbleStream(fallback?.id || null); if (fallback) setMarbleHexDraft(fallback.color);
  };
  const resetMarble = () => {
    const next = { ...heroDocument.nail.effect.parameters, marbleTransform: { panX: 0, panY: 0, scale: 1, rotation: 0 }, streamOverrides: {}, customStreams: {}, deletedStreamIds: [] };
    changeHero((current) => updateHeroEffect(current, { ...current.document.nail.effect, parameters: next }, heroEvents.current));
  };
  // Multi-selection is an explicit targeting gesture. Otherwise coordination
  // safely uses the eligible Marble nails in the full-set workspace.
  const marbleTargetIds = () => (selectedNails.length > 1 ? selectedNails : Array.from({ length: 10 }, (_, index) => index)).map((index) => `nail-${index}`);
  const updateMarbleSet = (coordination) => {
    const normalized = normalizeMarbleSetCoordination(coordination);
    setMarbleSetCoordination(normalized);
    changeFinishParameter('marbleSetCoordination', normalized);
  };
  const applyMarbleSet = () => updateMarbleSet({ ...normalizeMarbleSetCoordination(heroDocument.nail.effect.parameters.marbleSetCoordination), mode: marbleSetMode, variation: marbleSetVariation, setSeed: heroDocument.nail.effect.parameters.marbleSetCoordination?.setSeed || createMarbleSetSeed(heroDocument.metadata.id), participatingNailIds: marbleTargetIds(), density: heroDocument.nail.effect.parameters.veinDensity });
  const coordinateFromThisNail = () => updateMarbleSet({ ...deriveCoordinationFromNail(heroDocument.nail.effect, heroDocument.nail.effect.parameters.marbleSetCoordination), mode: marbleSetMode === 'independent' ? 'coordinated' : marbleSetMode, variation: marbleSetVariation, participatingNailIds: marbleTargetIds() });
  const randomizeMarbleSet = () => updateMarbleSet({ ...normalizeMarbleSetCoordination(heroDocument.nail.effect.parameters.marbleSetCoordination), setSeed: createMarbleSetSeed(Date.now()) });
  const changeMarbleWorkspaceMode = (mode) => {
    if (mode === 'independent') {
      setMarbleSetMode('independent');
      updateMarbleSet({ ...marbleSetCoordination, mode: 'independent' });
      return;
    }
    setRightPanelOpen(true);
    setMarbleSetMode(marbleSetMode === 'independent' ? 'coordinated' : marbleSetMode);
  };
  const changeMarbleSetStyle = (mode) => {
    setMarbleSetMode(mode);
    // Once a set exists, a style choice is a committed, visible change rather
    // than a pending control that silently leaves the artwork untouched.
    if (marbleSetCoordination.participatingNailIds.length) updateMarbleSet({ ...marbleSetCoordination, mode });
  };
  const detachMarbleNail = () => {
    const nailId = `nail-${activeNailIndex}`;
    const localEffect = marbleEffectForNail(activeNailIndex);
    const detached = detachMarbleParameters({ ...localEffect, parameters: { ...localEffect.parameters, marbleSetCoordination } }, nailId);
    const nextSet = normalizeMarbleSetCoordination({ ...marbleSetCoordination, participatingNailIds: marbleSetCoordination.participatingNailIds.filter((id) => id !== nailId) });
    setMarbleNailStates((states) => ({ ...states, [nailId]: detached.parameters }));
    setMarbleSetCoordination(nextSet);
    changeHero((current) => updateHeroEffect(current, { ...detached, parameters: { ...detached.parameters, marbleSetCoordination: nextSet } }, heroEvents.current));
  };
  const resetMarbleSet = () => {
    const frozen = { ...marbleNailStates };
    marbleSetCoordination.participatingNailIds.forEach((nailId) => {
      const index = Number(nailId.split('-')[1]);
      frozen[nailId] = detachMarbleParameters({ ...marbleEffectForNail(index), parameters: { ...marbleEffectForNail(index).parameters, marbleSetCoordination } }, nailId).parameters;
    });
    const independent = normalizeMarbleSetCoordination();
    setMarbleNailStates(frozen); setMarbleSetCoordination(independent); setMarbleSetMode('independent');
    changeFinishParameter('marbleSetCoordination', independent);
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
    if (heroDocument.nail.effect.id === 'Marble') setMarbleNailStates((states) => ({ ...states, [`nail-${activeNailIndex}`]: { ...heroDocument.nail.effect.parameters, marbleSetCoordination: undefined } }));
    setActiveNailIndex(index);
    const storedFormulation = nailPolishes[index];
    const storedMarble = marbleNailStates[`nail-${index}`];
    if (!storedFormulation && !storedMarble) return;
    const source = storedMarble ? { ...(storedFormulation || activeFormulation), ...storedMarble, finish: 'Marble', marbleSetCoordination } : storedFormulation;
    const normalized = normalizePolishForFinish(source, source.finish);
    setPolishName(normalized.name || polishName);
    setSelectedFinish(normalized.finish);
    setFinishFormulation(normalized);
    heroEffectEngine.invalidate();
    setHeroState((current) => updateHeroEffect(current, heroEffectForPolish({ ...normalized, ...(normalized.finish === 'Marble' ? { marbleSetCoordination } : {}) }), heroEvents.current));
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
    if (moveMarble && heroDocument.nail.effect.id === 'Marble' && event.button === 0 && event.target.closest?.('[data-testid="stage-nail"]')) {
      const transform = heroDocument.nail.effect.parameters.marbleTransform || { panX: 0, panY: 0 };
      drag.current = { marble: true, pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: transform.panX || 0, panY: transform.panY || 0 };
      event.currentTarget.setPointerCapture?.(event.pointerId); event.preventDefault(); return;
    }
    if (zoom <= 1 || event.button !== 0) return;
    drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const marblePointerContext = (event, coordinateTarget = event.currentTarget) => {
    const svg = event.currentTarget.ownerSVGElement; const matrix = coordinateTarget?.getScreenCTM?.();
    if (!svg || !matrix) return null;
    const inverse = matrix.inverse(); const cursor = svg.createSVGPoint(); cursor.x = event.clientX; cursor.y = event.clientY;
    return { svg, inverse, point: cursor.matrixTransform(inverse) };
  };
  const captureVeinPointer = (event, data) => {
    drag.current = { vein: true, pointerId: event.pointerId, captureTarget: event.currentTarget, ...data };
    event.currentTarget.setPointerCapture?.(event.pointerId); event.preventDefault();
  };
  const startVeinBodyDrag = (event, stream) => {
    const context = marblePointerContext(event); if (!context || event.button !== 0) return;
    setMoveMarble(false);
    const nearest = nearestMarbleCenterlinePoint(stream.controlPoints, context.point);
    captureVeinPointer(event, { kind: event.shiftKey ? 'body' : 'local', streamId: stream.id, grabT: nearest.t, points: stream.controlPoints.map((point) => ({ ...point })), start: context.point, inverse: context.inverse, svg: context.svg });
  };
  const startVeinPointDrag = (event, stream, pointIndex) => {
    const context = marblePointerContext(event); if (!context || event.button !== 0) return;
    setMoveMarble(false);
    captureVeinPointer(event, { kind: 'point', streamId: stream.id, pointIndex, points: stream.controlPoints.map((point) => ({ ...point })), inverse: context.inverse, svg: context.svg });
  };
  const startVeinWidthDrag = (event, stream, position, center, normal) => {
    const context = marblePointerContext(event, event.currentTarget.parentElement); if (!context || event.button !== 0) return;
    setMoveMarble(false);
    captureVeinPointer(event, { kind: 'width', streamId: stream.id, position, center, normal, start: context.point, width: stream.width, widthProfile: { ...stream.widthProfile }, inverse: context.inverse, svg: context.svg });
  };
  const movePan = (event) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (drag.current.vein) {
      const cursor = drag.current.svg.createSVGPoint(); cursor.x = event.clientX; cursor.y = event.clientY; const point = cursor.matrixTransform(drag.current.inverse);
      const overrides = heroDocument.nail.effect.parameters.streamOverrides || {}; const current = overrides[drag.current.streamId] || {}; let next;
      if (drag.current.kind === 'width') {
        const delta = (point.x - drag.current.start.x) * drag.current.normal.x + (point.y - drag.current.start.y) * drag.current.normal.y;
        const value = Math.max(.1, Math.min(3, drag.current.widthProfile[drag.current.position] + delta / Math.max(4, drag.current.width * 2)));
        next = { ...current, widthProfile: { ...drag.current.widthProfile, [drag.current.position]: Number(value.toFixed(2)) } };
      } else {
        const dx = ['body', 'local'].includes(drag.current.kind) ? point.x - drag.current.start.x : 0; const dy = ['body', 'local'].includes(drag.current.kind) ? point.y - drag.current.start.y : 0;
        const points = drag.current.kind === 'local' ? deformMarbleControlPoints(drag.current.points, drag.current.grabT, dx, dy) : drag.current.points.map((item, index) => drag.current.kind === 'body' || index === drag.current.pointIndex ? { x: Number((drag.current.kind === 'body' ? item.x + dx : point.x).toFixed(2)), y: Number((drag.current.kind === 'body' ? item.y + dy : point.y).toFixed(2)) } : item);
        next = { ...current, geometryOverride: { points } };
      }
      changeFinishParameter('streamOverrides', { ...overrides, [drag.current.streamId]: next }); return;
    }
    if (drag.current.marble) {
      changeFinishParameter('marbleTransform', { ...heroDocument.nail.effect.parameters.marbleTransform, panX: Math.max(-120, Math.min(120, drag.current.panX + (event.clientX - drag.current.x) / zoom)), panY: Math.max(-180, Math.min(180, drag.current.panY + (event.clientY - drag.current.y) / zoom)) });
      return;
    }
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
    const savedMarbleStates = heroDocument.nail.effect.id === 'Marble' ? { ...marbleNailStates, [`nail-${activeNailIndex}`]: { ...heroDocument.nail.effect.parameters, marbleSetCoordination: undefined } } : marbleNailStates;
    const documentEffect = heroDocument.nail.effect.id === 'Marble' ? { ...heroDocument.nail.effect, parameters: { ...heroDocument.nail.effect.parameters, marbleSetCoordination } } : heroDocument.nail.effect;
    await heroPersistence.current?.save({ ...heroDocument, nail: { ...heroDocument.nail, effect: documentEffect }, metadata: { ...heroDocument.metadata, name: designName, polishFormulations: nailPolishes, activePolishFormulation: activeFormulation, frenchTips, marbleSetCoordination, marbleNailStates: savedMarbleStates } });
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
            <div className="nail-design-studio__active-polish" data-testid="active-polish-card" data-marble-simplified={activeTool.id === 'effects' && activeFinish === 'Marble' || undefined}>
              <div className="nail-design-studio__active-polish-heading"><span>{activeTool.id === 'effects' ? 'Active Effect' : 'Active Polish'}</span>{activeTool.id === 'polish' && <button type="button" className="nail-design-studio__polish-star" aria-label={activePolishSaved ? "Remove polish from Polish Rack" : "Save polish to Polish Rack"} aria-pressed={activePolishSaved} onClick={togglePolishSaved}>{activePolishSaved ? "★" : "☆"}</button>}</div>
              {!(activeTool.id === 'effects' && activeFinish === 'Marble') && <div className="nail-design-studio__active-bottle"><PolishBottle size="medium" selected colorHex={activePolishColor} polishType={activeFinish} name={activePolishColor} opacity={appliedEffect.opacity} viscosity={appliedEffect.viscosity} shine={appliedEffect.shine} glitterDensity={activeFormulation.glitterDensity} shimmerIntensity={activeFormulation.shimmerIntensity} /></div>}
              <div className="nail-design-studio__active-details">
                {!(activeTool.id === 'effects' && activeFinish === 'Marble') && !['ColorBlock', 'NegativeSpace'].includes(activeFinish) && <label>Color / HEX<span className="nail-design-studio__color-row"><input aria-label="Base Color picker" type="color" value={activePolishColor} onChange={(event) => changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), event.target.value.toUpperCase())} /><input className="nail-design-studio__hex-input" aria-label="Base Color HEX" aria-invalid={hexInvalid} value={hexDraft} maxLength="7" onChange={(event) => { const value = event.target.value.toUpperCase(); if (/^#?[0-9A-F]{0,6}$/.test(value)) { setHexDraft(value); setHexInvalid(false); } }} onBlur={() => { if (/^#[0-9A-F]{6}$/.test(hexDraft)) changeFinishParameter(baseColorKey(heroDocument.nail.effect.id), hexDraft); else { setHexInvalid(true); setHexDraft(activePolishColor); } }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></span></label>}
                {activeTool.id === 'polish'
                  ? <label>Finish<select aria-label="Finish" value={activeFinish} onChange={(event) => changeFinish(event.target.value)}>{!VISIBLE_POLISH_FINISHES.includes(activeFinish) && <option hidden>{activeFinish}</option>}{VISIBLE_POLISH_FINISHES.map((finish) => <option key={finish}>{finish}</option>)}</select></label>
                  : <label>Effect<select aria-label="Effect" value={EFFECT_OPTIONS.some((option) => option.value === activeFinish) ? activeFinish : ''} onChange={(event) => changeFinish(event.target.value, undefined, false)}><option value="" disabled>Choose an effect</option>{EFFECT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>}
              </div>
            </div>
            <section className="nail-design-studio__material-properties" aria-label="Polish material properties" data-testid="polish-material-properties">
            {activeFinish !== 'NegativeSpace' && <><label>Opacity <output>{Math.round(appliedEffect.opacity * 100)}%</output><input aria-label="Opacity" type="range" min="0" max="1" step=".01" value={appliedEffect.opacity} onChange={(event) => changeFinishParameter('opacity', Number(event.target.value))} /></label>
            {activeFinish !== 'Marble' && <><label>Shine <output>{Math.round(appliedEffect.shine * 100)}%</output><input aria-label="Shine" type="range" min="0" max="1" step=".01" value={appliedEffect.shine} onChange={(event) => changeFinishParameter('shine', Number(event.target.value))} /></label>
            <label>Viscosity <output>{Math.round(appliedEffect.viscosity * 100)}%</output><input aria-label="Viscosity" type="range" min="0" max="1" step=".01" value={appliedEffect.viscosity} onChange={(event) => changeFinishParameter('viscosity', Number(event.target.value))} /></label></>}</>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Gradient' && <><label>Color B<input aria-label="Color B" type="color" value={heroDocument.nail.effect.parameters.colorB} onChange={(event) => changeFinishParameter('colorB', event.target.value.toUpperCase())} /></label><label>Direction <input aria-label="Direction" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.direction} onChange={(event) => changeFinishParameter('direction', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Cat Eye' && <><label>Stripe direction <input aria-label="Stripe direction" type="range" min="0" max="360" value={heroDocument.nail.effect.parameters.stripeDirection} onChange={(event) => changeFinishParameter('stripeDirection', Number(event.target.value))} /></label><label>Stripe width <input aria-label="Stripe width" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.stripeWidth} onChange={(event) => changeFinishParameter('stripeWidth', Number(event.target.value))} /></label><label>Stripe strength <input aria-label="Stripe strength" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.stripeStrength} onChange={(event) => changeFinishParameter('stripeStrength', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Marble' && <section className="nail-design-studio__marble-controls" aria-label="Marble controls">
              <div className="nail-design-studio__marble-workspace-mode" role="group" aria-label="Marble workspace mode">
                <button type="button" aria-pressed={marbleSetMode === 'independent'} onClick={() => changeMarbleWorkspaceMode('independent')}>Independent</button>
                <button type="button" aria-pressed={marbleSetMode !== 'independent'} onClick={() => changeMarbleWorkspaceMode('set')}>Set</button>
              </div>
              <p className="nail-design-studio__marble-direct-hint">Select a vein on the Nail Desk, then drag anywhere to sculpt it. Shift-drag moves the whole vein; handles stretch and taper.</p>
              <details className="nail-design-studio__marble-advanced"><summary>Transform</summary>
                <button type="button" aria-pressed={moveMarble} onClick={() => setMoveMarble((active) => !active)}>Move Marble</button>
                <label>Scale <output>{Math.round((heroDocument.nail.effect.parameters.marbleTransform?.scale || 1) * 100)}%</output><input aria-label="Marble Scale" type="range" min=".55" max="2.5" step=".01" value={heroDocument.nail.effect.parameters.marbleTransform?.scale || 1} onChange={(event) => changeMarbleTransform('scale', Number(event.target.value))} /></label>
                <label>Rotation <output>{heroDocument.nail.effect.parameters.marbleTransform?.rotation || 0}°</output><input aria-label="Marble Rotation" type="range" min="-180" max="180" value={heroDocument.nail.effect.parameters.marbleTransform?.rotation || 0} onChange={(event) => changeMarbleTransform('rotation', Number(event.target.value))} /></label>
              </details>
              <div className="nail-design-studio__marble-section-heading"><h3>Veins</h3><details className="nail-design-studio__marble-add"><summary>+ Add Vein</summary><div>{['primary', 'secondary', 'hairline'].map((veinClass) => { const count = Object.values(heroDocument.nail.effect.parameters.customStreams || {}).filter((stream) => stream.veinClass === veinClass).length; return <button key={veinClass} type="button" disabled={count >= CUSTOM_MARBLE_STREAM_LIMITS[veinClass]} title={count >= CUSTOM_MARBLE_STREAM_LIMITS[veinClass] ? `${veinClass} vein limit reached` : undefined} onClick={() => addMarbleVein(veinClass)}>{veinClass.charAt(0).toUpperCase() + veinClass.slice(1)}</button>; })}</div></details></div>
              <div className="nail-design-studio__marble-streams" role="listbox" aria-label="Marble Veins">{artistMarbleStreams.map((stream) => <button type="button" role="option" aria-selected={selectedStream?.id === stream.id} data-visible={stream.visible} key={stream.id} onClick={() => selectMarbleStream(stream.id, stream.color)}><i style={{ backgroundColor: stream.color }} />{stream.custom ? 'Custom ' : ''}{stream.veinClass.charAt(0).toUpperCase() + stream.veinClass.slice(1)} {stream.custom ? artistMarbleStreams.filter((item) => item.custom && item.veinClass === stream.veinClass).findIndex((item) => item.id === stream.id) + 1 : Number(stream.id.split('-')[1]) + 1}<span>{stream.visible ? 'On' : 'Off'}</span></button>)}</div>
              {selectedStream && <fieldset><legend>Selected Vein — {selectedStream.custom ? 'Custom ' : ''}{selectedStream.veinClass.charAt(0).toUpperCase() + selectedStream.veinClass.slice(1)}</legend><label>Color / HEX<span className="nail-design-studio__color-row"><input aria-label="Selected Vein Color" type="color" value={selectedStream.color} onChange={(event) => { const value = event.target.value.toUpperCase(); setMarbleHexDraft(value); changeStreamOverride('formulation', { ...(heroDocument.nail.effect.parameters.streamOverrides?.[selectedStream.id]?.formulation || {}), color: value, finish: selectedStream.finish }); }} /><input aria-label="Selected Vein HEX" value={marbleHexDraft} maxLength="7" onChange={(event) => setMarbleHexDraft(event.target.value.toUpperCase())} onBlur={() => /^#[0-9A-F]{6}$/.test(marbleHexDraft) ? changeStreamOverride('formulation', { ...(heroDocument.nail.effect.parameters.streamOverrides?.[selectedStream.id]?.formulation || {}), color: marbleHexDraft, finish: selectedStream.finish }) : setMarbleHexDraft(selectedStream.color)} /></span></label>
                {selectedStream.veinClass === 'diffusion' ? <p>Diffusion keeps its translucent geological finish.</p> : <label>Finish<select aria-label="Selected Vein Finish" value={selectedStream.finish} onChange={(event) => changeStreamOverride('formulation', { ...(heroDocument.nail.effect.parameters.streamOverrides?.[selectedStream.id]?.formulation || {}), color: selectedStream.color, finish: event.target.value })}><option>Cream</option><option>Jelly</option><option>Matte</option><option>Glitter</option></select></label>}
                <label>Opacity <output>{Math.round(selectedStream.opacity * 100)}%</output><input aria-label="Selected Vein Opacity" type="range" min="0" max="1" step=".01" value={selectedStream.opacity} onChange={(event) => changeStreamOverride('opacity', Number(event.target.value))} /></label>
                <label>Softness <output>{selectedStream.softness.toFixed(1)}</output><input aria-label="Selected Vein Softness" type="range" min="0" max="6" step=".1" value={selectedStream.softness} onChange={(event) => changeStreamOverride('softness', Number(event.target.value))} /></label>
                {selectedStream.finish === 'Glitter' && <p className="nail-design-studio__marble-direct-hint">Glitter formulation uses the selected vein color and localized particle field.</p>}
                <div className="nail-design-studio__marble-actions"><button type="button" onClick={() => changeStreamOverride('visible', !selectedStream.visible)}>{selectedStream.visible ? 'Hide Vein' : 'Show Vein'}</button><button type="button" disabled={selectedStream.veinClass === 'diffusion'} onClick={duplicateMarbleVein}>Duplicate</button><button type="button" onClick={deleteMarbleVein}>Delete</button></div>
                <details className="nail-design-studio__marble-advanced"><summary>Accessible geometry</summary>
                  <label>Overall Width <output>{selectedStream.width.toFixed(1)}</output><input aria-label="Selected Vein Overall Width" type="range" min={marbleWidthBoundsForClass(selectedStream.veinClass).min} max={marbleWidthBoundsForClass(selectedStream.veinClass).max} step=".1" value={selectedStream.width} onChange={(event) => changeStreamOverride('width', Number(event.target.value))} /></label>
                  {['start', 'middle', 'end'].map((position) => <label key={position}>{position.charAt(0).toUpperCase() + position.slice(1)} Width <output>{Math.round(selectedStream.widthProfile[position] * 100)}%</output><input aria-label={`${position.charAt(0).toUpperCase() + position.slice(1)} Width`} type="range" min=".1" max="3" step=".05" value={selectedStream.widthProfile[position]} onChange={(event) => changeStreamOverride('widthProfile', { ...selectedStream.widthProfile, [position]: Number(event.target.value) })} /></label>)}
                </details>
                <details className="nail-design-studio__marble-advanced"><summary>Vein options</summary><button type="button" onClick={resetSelectedVein}>Reset Selected Vein</button></details>
              </fieldset>}
            </section>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Aura' && <><label>Aura center color<input aria-label="Aura center color" type="color" value={heroDocument.nail.effect.parameters.centerColor} onChange={(event) => changeFinishParameter('centerColor', event.target.value.toUpperCase())} /></label><label>Aura color<input aria-label="Aura color" type="color" value={heroDocument.nail.effect.parameters.auraColor} onChange={(event) => changeFinishParameter('auraColor', event.target.value.toUpperCase())} /></label><label>Aura softness <output>{Math.round(heroDocument.nail.effect.parameters.softness * 100)}%</output><input aria-label="Aura softness" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.softness} onChange={(event) => changeFinishParameter('softness', Number(event.target.value))} /></label><label>Aura intensity <output>{Math.round(heroDocument.nail.effect.parameters.intensity * 100)}%</output><input aria-label="Aura intensity" type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.intensity} onChange={(event) => changeFinishParameter('intensity', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'ColorBlock' && <><label>Color A<input aria-label="Color A" type="color" value={heroDocument.nail.effect.parameters.primaryColor} onChange={(event) => changeFinishParameter('primaryColor', event.target.value.toUpperCase())} /></label><label>Color B<input aria-label="Color B" type="color" value={heroDocument.nail.effect.parameters.secondaryColor} onChange={(event) => changeFinishParameter('secondaryColor', event.target.value.toUpperCase())} /></label><label>Block Direction<select aria-label="Block Direction" value={heroDocument.nail.effect.parameters.direction} onChange={(event) => changeFinishParameter('direction', event.target.value)}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option><option value="diagonal">Diagonal</option></select></label><label>Split Position <output>{Math.round(heroDocument.nail.effect.parameters.splitPosition * 100)}%</output><input aria-label="Split Position" aria-valuetext={`${Math.round(heroDocument.nail.effect.parameters.splitPosition * 100)}%`} type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.splitPosition} onChange={(event) => changeFinishParameter('splitPosition', Number(event.target.value))} /></label></>}
            {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'NegativeSpace' && <><label>Negative Space Type<select aria-label="Negative Space Type" value={heroDocument.nail.effect.parameters.type} onChange={(event) => changeFinishParameter('type', event.target.value)}><option value="vertical-band">Vertical Band</option><option value="horizontal-band">Horizontal Band</option><option value="diagonal-band">Diagonal Band</option><option value="center-cutout">Center Cutout</option></select></label><label>Position <output>{Math.round(heroDocument.nail.effect.parameters.position * 100)}%</output><input aria-label="Negative Space Position" aria-valuetext={`${Math.round(heroDocument.nail.effect.parameters.position * 100)}%`} type="range" min="0" max="1" step=".01" value={heroDocument.nail.effect.parameters.position} onChange={(event) => changeFinishParameter('position', Number(event.target.value))} /></label><label>Size <output>{Math.round(heroDocument.nail.effect.parameters.size * 100)}%</output><input aria-label="Negative Space Size" aria-valuetext={`${Math.round(heroDocument.nail.effect.parameters.size * 100)}%`} type="range" min=".08" max=".65" step=".01" value={heroDocument.nail.effect.parameters.size} onChange={(event) => changeFinishParameter('size', Number(event.target.value))} /></label>{heroDocument.nail.effect.parameters.type === 'diagonal-band' && <label>Rotation <output>{heroDocument.nail.effect.parameters.rotation}°</output><input aria-label="Negative Space Rotation" aria-valuetext={`${heroDocument.nail.effect.parameters.rotation} degrees`} type="range" min="0" max="180" step="5" value={heroDocument.nail.effect.parameters.rotation} onChange={(event) => changeFinishParameter('rotation', Number(event.target.value))} /></label>}</>}
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
                    data-lighting-color-model={surfaceMaterialFinish(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish)) === 'Cream' ? 'neutral-achromatic' : 'hero-environment'} data-effect-overlay-count={appliedEffect.id === 'Solid' ? '0' : Math.max(0, appliedEffect.layers.length - 1)}
                    data-hero-renderer="Hero Surface Rendering Engine" data-hero-mask={renderedSurface.maskId} data-design-layer-parent="true"
                    aria-label={`Hero Nail ${index + 1}`} viewBox={renderedSurface.viewBox} preserveAspectRatio="xMidYMid meet" role="img">
                    <defs><clipPath id={`hero-effect-mask-${index}`}><path d={renderedSurface.path}/></clipPath>{appliedEffect.id === 'NegativeSpace' && <mask id={`hero-negative-space-${index}`} maskUnits="userSpaceOnUse" x={renderedSurface.bounds.x} y={renderedSurface.bounds.y} width={renderedSurface.bounds.width} height={renderedSurface.bounds.height}><path d={renderedSurface.path} fill="white" /> <NegativeSpaceReveal layer={appliedEffect.layers[0]} bounds={renderedSurface.bounds} /></mask>}{appliedEffect.layers.map((layer, layerIndex) => layer.kind === 'linear-gradient' ? <linearGradient key={layerIndex} id={`hero-finish-${index}-${layerIndex}`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${layer.angle ?? 90} .5 .5)`}>{layer.colors.map((color, stop) => <stop key={stop} offset={`${stop / Math.max(1, layer.colors.length - 1) * 100}%`} stopColor={color} />)}</linearGradient> : layer.kind === 'radial-gradient' ? <radialGradient key={layerIndex} id={`hero-finish-${index}-${layerIndex}`} cx={`${layer.centerX * 100}%`} cy={`${layer.centerY * 100}%`} r={`${layer.radius * 100}%`} data-gradient-mode="center-glow-aura-blend">{layer.colors.map((color, stop) => <stop key={stop} offset={`${stop / Math.max(1, layer.colors.length - 1) * 100}%`} stopColor={color} stopOpacity={stop === 1 ? .82 : undefined}/>)}</radialGradient> : null)}<filter id={`hero-aura-softness-${index}`} x="-18%" y="-18%" width="136%" height="136%"><feGaussianBlur stdDeviation={(.6 + Number(appliedEffect.parameters.softness || 0) * 3.8).toFixed(2)}/></filter><radialGradient id={`hero-light-apex-${index}`} cx="50%" cy="28%" r="58%"><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity={nailStageLightingOpacity(index, 'apex', appliedLighting.reflections[3].opacity)} /><stop offset="56%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity={nailStageLightingOpacity(index, 'apex', appliedLighting.reflections[3].opacity * .22)} /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[3].color)} stopOpacity="0" /></radialGradient><linearGradient id={`hero-light-primary-${index}`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${appliedLighting.reflections[0].angle} .5 .5)`}><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity="0" /><stop offset="42%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity={nailStageLightingOpacity(index, 'primary', appliedLighting.reflections[0].opacity)} /><stop offset="62%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity={nailStageLightingOpacity(index, 'primary', appliedLighting.reflections[0].opacity * .36)} /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[0].color)} stopOpacity="0" /></linearGradient><linearGradient id={`hero-light-edge-${index}`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity={nailStageLightingOpacity(index, 'edge', appliedLighting.reflections[2].opacity)} /><stop offset="22%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity="0" /><stop offset="78%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity="0" /><stop offset="100%" stopColor={stageLightingColor(activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish), appliedLighting.reflections[2].color)} stopOpacity={nailStageLightingOpacity(index, 'edge', appliedLighting.reflections[2].opacity * .72)} /></linearGradient><linearGradient id={`hero-light-depth-${index}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#000000" stopOpacity="0" /><stop offset="100%" stopColor="#000000" stopOpacity={appliedLighting.reflections[4].opacity} /></linearGradient></defs>
                    {appliedEffect.id === 'NegativeSpace' && <path data-hero-base-surface="true" data-material-id={renderedSurface.material.id} d={renderedSurface.path} fill={renderedSurface.materialStyle.baseTint} opacity={renderedSurface.materialStyle.opacity} />}
                    <DesignCoverage active={appliedEffect.id === 'NegativeSpace'} maskId={`hero-negative-space-${index}`}>
                    <MaterialLayers path={renderedSurface.path} surfaceBounds={renderedSurface.bounds} finish={surfaceMaterialFinish(activeFinish === 'NegativeSpace' ? activeFormulation.finish : (activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish)))} color={activeNailIndex === index ? activePolishColor : (nailPolishes[index]?.colorHex || activePolishColor)} fleckColor={activeNailIndex === index ? activeFormulation.fleckColor : (nailPolishes[index]?.fleckColor || activeFormulation.fleckColor)} glitterDensity={activeNailIndex === index ? activeFormulation.glitterDensity : (nailPolishes[index]?.glitterDensity ?? activeFormulation.glitterDensity)} opacity={activeNailIndex === index ? (appliedEffect.id === 'NegativeSpace' ? activeFormulation.opacity : appliedEffect.id === 'Marble' ? appliedEffect.opacity : appliedEffect.layers[0].opacity) : (nailPolishes[index]?.opacity ?? (appliedEffect.id === 'Marble' ? appliedEffect.opacity : appliedEffect.layers[0].opacity))} shine={activeNailIndex === index ? appliedEffect.shine : (nailPolishes[index]?.shine ?? appliedEffect.shine)} uid={`hero-material-${index}`} baseProps={{ className: 'nail-design-studio__nail-polish', 'data-design-layer': 'polish', 'data-hero-material-layer': 'true', 'data-polish-finish': surfaceMaterialFinish(activeFinish === 'NegativeSpace' ? activeFormulation.finish : (activeNailIndex === index ? activeFinish : (nailPolishes[index]?.finish || activeFinish))), 'data-hero-effect': appliedEffect.id, 'data-hero-lighting': 'Hero Lighting Engine', 'data-hero-reflection': appliedLighting.profile.reflection, 'data-material-id': renderedSurface.material.id }}/>
                    {(appliedEffect.id === 'Marble' ? [] : appliedEffect.layers.slice(1)).map((layer, layerIndex) => layer.kind === 'color-block' ? <ColorBlockRegions key={layerIndex} layer={layer} bounds={renderedSurface.bounds} clipId={`hero-effect-mask-${index}`} /> : ['linear-gradient', 'radial-gradient'].includes(layer.kind) ? <path key={layerIndex} data-effect-layer={layer.kind === 'radial-gradient' ? 'aura' : undefined} d={renderedSurface.path} fill={`url(#hero-finish-${index}-${layerIndex + 1})`} opacity={layer.opacity} clipPath={layer.kind === 'radial-gradient' ? `url(#hero-effect-mask-${index})` : undefined} filter={layer.kind === 'radial-gradient' ? `url(#hero-aura-softness-${index})` : undefined} /> : layer.kind === 'veins' ? <MarbleVeins key={layerIndex} effect={marbleEffectForNail(index)} nailIdentity={`${heroDocument.metadata.id}:nail-${index}`} clipId={`hero-effect-mask-${index}`} /> : layer.paths?.map((path, pathIndex) => <path key={`${layerIndex}-${pathIndex}`} d={path} stroke={layer.color} opacity={layer.opacity} fill="none" vectorEffect="non-scaling-stroke" />))}
                    </DesignCoverage>
                    {appliedEffect.id === 'Marble' && <MarbleVeins effect={marbleEffectForNail(index)} nailIdentity={`${heroDocument.metadata.id}:nail-${index}`} clipId={`hero-effect-mask-${index}`} />}
                    <FrenchTipRegion data={frenchTips[index]} nailPath={renderedSurface.path} bounds={renderedSurface.bounds} uid={`hero-french-${index}`} />
                    <path data-hero-lighting-layer="full-surface-depth" data-surface-finish={appliedLighting.effectId} d={renderedSurface.path} fill={`url(#hero-light-depth-${index})`} opacity={appliedLighting.profile.veinPreservation} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-apex-${index})`} style={{ mixBlendMode: 'screen' }} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-primary-${index})`} style={{ mixBlendMode: 'screen' }} />
                    <path d={renderedSurface.path} fill={`url(#hero-light-edge-${index})`} style={{ mixBlendMode: 'screen' }} />
                    {appliedEffect.id === 'Marble' && !moveMarble && activeTool.id === 'effects' && activeNailIndex === index && <MarbleVeins effect={marbleEffectForNail(index)} nailIdentity={`${heroDocument.metadata.id}:nail-${index}`} clipId={`hero-effect-mask-${index}`} selectedId={selectedStream?.id} interactionOnly onSelect={selectMarbleStream} onBodyDown={startVeinBodyDrag} onPointDown={startVeinPointDrag} onWidthDown={startVeinWidthDrag} />}
                  </svg>
                </button>
              ))}
            </div>
          </div>
        </main>
        {rightPanelOpen && !focusMode && <aside id="design-properties-panel" className="nail-design-studio__panel nail-design-studio__properties" aria-label="Design properties panel">
          {activeTool.id === 'effects' && heroDocument.nail.effect.id === 'Marble' && marbleSetMode !== 'independent' && <section className="nail-design-studio__marble-set" aria-label="Marble Set composition" data-marble-set-mode={marbleSetCoordination.mode} data-marble-set-seed={marbleSetCoordination.setSeed} data-marble-set-members={marbleSetCoordination.participatingNailIds.join(',')}>
            <h2>Marble Set</h2>
            <div className="nail-design-studio__marble-set-style" role="group" aria-label="Marble Set Style"><span>Style</span><button type="button" aria-pressed={marbleSetMode === 'coordinated'} onClick={() => changeMarbleSetStyle('coordinated')}>Coordinated</button><button type="button" aria-pressed={marbleSetMode === 'flow'} onClick={() => changeMarbleSetStyle('flow')}>Flow</button></div>
            <label className="nail-design-studio__marble-variation">Variation <span>Similar</span><input aria-label="Marble Set Variation" type="range" min="0" max="2" step="1" value={{ low: 0, medium: 1, high: 2 }[marbleSetVariation]} onChange={(event) => setMarbleSetVariation(['low', 'medium', 'high'][Number(event.target.value)])} /><span>Unique</span></label>
            <button type="button" className="nail-design-studio__marble-coordinate" onClick={coordinateFromThisNail}>Coordinate From This Nail</button>
            <button type="button" onClick={randomizeMarbleSet}>Randomize</button>
            <details className="nail-design-studio__marble-more"><summary aria-label="More Marble Set actions">More Choices</summary><div>
              {marbleSetCoordination.participatingNailIds.includes(`nail-${activeNailIndex}`) && <><button type="button" onClick={detachMarbleNail}>Detach Current Nail</button><button type="button" onClick={applyMarbleSet}>Reset Current Nail to Set</button></>}
              <button type="button" onClick={applyMarbleSet}>Reapply Set Style</button><button type="button" onClick={resetMarbleSet}>Reset Set</button>
            </div></details>
          </section>}
          <h2>Design Properties</h2>
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
