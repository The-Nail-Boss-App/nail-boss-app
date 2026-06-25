import { useId } from 'react';
import { renderAssetShapes } from './design-studio/assets';
import { ArtRealismDefs, GradientLayerShape, PaintedStroke, PatternDefs, artMaterialProfile } from './design-studio/NailCanvas';
import { AssetContactShadow, AssetSpecularAccent, AssetSurfaceBlend, assetLayerRenderProps, isRenderableAssetLayer } from './design-studio/assetRendering';
import { VIEWBOX, buildNailPath, layerSort } from './design-studio/blueprint';
import { FrenchTipShape } from './design-studio/frenchTipRendering';
import { PolishDefs, PolishSurface } from './design-studio/PolishRenderer';
import { normalizeFullSetDesign } from './fullSetRenderer';

export const BLUEPRINT_GALLERY_RENDER_MODES = ['gallery'];
export const BLUEPRINT_GALLERY_PRESENTATION_THEMES = ['luxury-tray', 'minimal-white', 'velvet-display', 'boutique', 'magazine'];

const NAIL_ORDER = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

export const GALLERY_ARTWORK_VIEWBOX = {
  x: 18,
  y: 18,
  width: 204,
  height: 314,
};

export const GALLERY_ARTWORK_BOUNDS_PROFILE = {
  viewBox: `${GALLERY_ARTWORK_VIEWBOX.x} ${GALLERY_ARTWORK_VIEWBOX.y} ${GALLERY_ARTWORK_VIEWBOX.width} ${GALLERY_ARTWORK_VIEWBOX.height}`,
  preserveAspectRatio: 'xMidYMid meet',
  targetCellHeightFill: [0.85, 0.95],
  targetCellWidthFill: [0.8, 0.9],
  distortionSafe: true,
};

const SHAPE_FAMILIES = {
  Almond: 'tapered',
  Coffin: 'tapered',
  Stiletto: 'pointed',
  Lipstick: 'asymmetric',
  Oval: 'rounded',
  Round: 'rounded',
  Square: 'flat',
  Duck: 'wide',
  Flare: 'wide',
};

const SHAPE_FOOTPRINTS = {
  rounded: { length: 0.9, width: 0.96, padding: 0.032 },
  flat: { length: 0.96, width: 1.02, padding: 0.035 },
  tapered: { length: 1, width: 0.98, padding: 0.038 },
  pointed: { length: 1.16, width: 0.92, padding: 0.045 },
  asymmetric: { length: 1.06, width: 1.02, padding: 0.044 },
  wide: { length: 0.98, width: 1.22, padding: 0.05 },
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function safeDimension(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? clamp(number, 0.28, 1.2) : fallback;
}

export function createBlueprintCompositionProfile(normalizedSet = {}) {
  const nails = [normalizedSet.left, normalizedSet.right].flatMap((row) => (Array.isArray(row) ? row : [])).slice(0, 10);
  const safeNails = nails.length ? nails : [{ shape: 'Almond', length: 0.62, width: 0.52 }];
  const maxNailLength = Math.max(...safeNails.map((nail) => safeDimension(nail?.length, 0.62)));
  const maxNailWidth = Math.max(...safeNails.map((nail) => safeDimension(nail?.width, 0.52)));
  const shapeFamilies = [...new Set(safeNails.map((nail) => SHAPE_FAMILIES[nail?.shape] || 'tapered'))];
  const primaryShapeFamily = shapeFamilies.includes('wide') ? 'wide'
    : shapeFamilies.includes('pointed') ? 'pointed'
      : shapeFamilies.includes('asymmetric') ? 'asymmetric'
        : shapeFamilies.includes('flat') ? 'flat'
          : shapeFamilies.includes('rounded') ? 'rounded'
            : 'tapered';
  const shapeFootprint = shapeFamilies.reduce((footprint, family) => {
    const current = SHAPE_FOOTPRINTS[family] || SHAPE_FOOTPRINTS.tapered;
    return {
      length: Math.max(footprint.length, current.length),
      width: Math.max(footprint.width, current.width),
      padding: Math.max(footprint.padding, current.padding),
    };
  }, { length: 0, width: 0, padding: 0 });

  const estimatedNailFootprint = {
    length: Number((shapeFootprint.length * (0.82 + maxNailLength * 0.5)).toFixed(3)),
    width: Number((shapeFootprint.width * (0.78 + maxNailWidth * 0.54)).toFixed(3)),
  };
  const safeTrayPadding = `${clamp(shapeFootprint.padding + maxNailLength * 0.018 + maxNailWidth * 0.012, 0.036, 0.072) * 100}%`;
  const rowGap = `${clamp(0.008 + (maxNailLength - 0.5) * 0.018, 0.006, 0.026) * 100}%`;
  const columnGap = `${clamp(0.003 + (maxNailWidth - 0.5) * 0.008, 0.002, 0.012) * 100}%`;
  const nailAspectRatio = Number(clamp(estimatedNailFootprint.width / estimatedNailFootprint.length, 0.52, 0.86).toFixed(3));

  return {
    maxNailLength,
    maxNailWidth,
    shapeFamily: primaryShapeFamily,
    shapeFamilies,
    estimatedNailFootprint,
    safeTrayPadding,
    rowGap,
    columnGap,
    shapeFootprintPadding: shapeFootprint.padding,
    nailAspectRatio,
    rows: 2,
    columns: 5,
    visibleNailCount: 10,
  };
}

export function buildGalleryGrid(compositionProfile, renderMode = 'gallery') {
  const profile = compositionProfile || createBlueprintCompositionProfile();
  const trayFill = renderMode === 'gallery' ? 0.98 : 0.92;
  const nailFill = 0.99;
  const trayPadding = `clamp(1px, ${clamp(profile.shapeFootprintPadding * 0.36, 0.012, 0.026) * 100}%, 6px)`;
  const rowGap = `clamp(1px, ${clamp(0.002 + (profile.maxNailLength - 0.5) * 0.006, 0.002, 0.01) * 100}%, 4px)`;
  const columnGap = `clamp(2px, ${clamp(0.004 + (profile.maxNailWidth - 0.5) * 0.008, 0.004, 0.014) * 100}%, 8px)`;
  const safeAspect = Number(clamp(profile.estimatedNailFootprint.width / profile.estimatedNailFootprint.length, 0.5, 0.92).toFixed(3));

  return {
    rows: 2,
    columns: 5,
    cellWidth: 'minmax(0, 1fr)',
    cellHeight: 'minmax(0, 1fr)',
    rowGap,
    columnGap,
    trayPadding,
    availableTrayArea: `${Math.round(trayFill * 100)}%`,
    nailFill: `${Math.round(nailFill * 100)}%`,
    cellAspectRatio: safeAspect,
  };
}

export function getBlueprintGalleryGridStyle(renderMode = 'gallery', compositionProfile) {
  const grid = buildGalleryGrid(compositionProfile, renderMode);
  return {
    '--gallery-tray-area': grid.availableTrayArea,
    '--gallery-tray-padding': grid.trayPadding,
    '--gallery-row-gap': grid.rowGap,
    '--gallery-column-gap': grid.columnGap,
    '--gallery-cell-width': grid.cellWidth,
    '--gallery-cell-height': grid.cellHeight,
    '--gallery-nail-fill': grid.nailFill,
    '--gallery-cell-aspect': grid.cellAspectRatio,
  };
}

function BlueprintGalleryNail({ nail, uid }) {
  const clipId = `${uid}-gallery-${nail.id}`;
  const base = nail.layers.find((layer) => layer.type === 'base');
  const path = buildNailPath(nail.shape, nail);
  const artLayers = nail.layers.filter((layer) => layer.type !== 'base' && layer.visible !== false).sort(layerSort);

  return (
    <svg viewBox={GALLERY_ARTWORK_BOUNDS_PROFILE.viewBox} width="100%" height="100%" preserveAspectRatio={GALLERY_ARTWORK_BOUNDS_PROFILE.preserveAspectRatio} aria-hidden="true" focusable="false" style={styles.nailSvg} data-gallery-artwork-bounds="tight">
      <defs>
        <clipPath id={clipId}><path d={path} /></clipPath>
        <PolishDefs nail={nail} baseLayer={base} uid={clipId} />
        <filter id={`${clipId}-asset-shadow-blur`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.2" /></filter>
        <ArtRealismDefs uid={clipId} />
      </defs>
      <PolishSurface nail={nail} baseLayer={base} path={path} clipId={clipId} uid={clipId} />
      {artLayers.map((layer) => {
        if (layer.type === 'frenchTip') return <FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId} thumbnail />;
        if (layer.type === 'drawing') return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity}>{(layer.data?.strokes || []).map((stroke) => <PaintedStroke key={stroke.id} stroke={stroke} nail={nail} baseLayer={base} uid={clipId} baseColor={base?.data?.colorHex} />)}</g>;
        if (layer.type === 'gradient') return <GradientLayerShape key={layer.id} layer={layer} nail={nail} baseLayer={base} path={path} clipId={clipId} uid={clipId} thumbnail />;
        if (layer.type === 'pattern') {
          const id = `${clipId}-${layer.id}`;
          const art = artMaterialProfile(base, nail);
          return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={(layer.opacity ?? 1) * art.artOpacity} data-realism-layer="material-aware-clipped-pattern"><defs><PatternDefs id={id} layer={layer} /></defs><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`} /><path d={path} fill="#fff" opacity={art.surfaceHighlight * 0.32} /></g>;
        }
        if (!isRenderableAssetLayer(layer)) return null;
        const assetRender = assetLayerRenderProps(layer, nail, artMaterialProfile(base, nail));
        return (
          <g key={layer.id} clipPath={`url(#${clipId})`} opacity={assetRender.opacity} data-layer-type={layer.type} data-asset-id={assetRender.assetId}>
            <AssetContactShadow render={assetRender} uid={clipId} />
            <AssetSurfaceBlend layer={layer} render={assetRender} />
            <g transform={assetRender.innerTransform}>{renderAssetShapes(assetRender.assetId, assetRender.colorHex)}</g>
            <AssetSpecularAccent layer={layer} render={assetRender} />
          </g>
        );
      })}
    </svg>
  );
}

export default function BlueprintGalleryRenderer({ designData, renderMode = 'gallery', presentationTheme = 'luxury-tray' }) {
  const uid = useId().replace(/:/g, '');
  const normalized = normalizeFullSetDesign(designData);
  const rows = [normalized.left, normalized.right];

  return (
    <div style={{ ...styles.shell, ...getBlueprintGalleryGridStyle(renderMode, createBlueprintCompositionProfile(normalized)) }} data-testid="blueprint-gallery-renderer" data-render-mode={renderMode} data-presentation-theme={presentationTheme} aria-label="Blueprint gallery product preview">
      <div style={styles.tray} data-testid="blueprint-gallery-artwork-tray">
        {rows.flatMap((nails, rowIndex) => nails.slice(0, 5).map((nail, nailIndex) => (
          <div key={nail.id} style={styles.nailSlot} data-testid="blueprint-gallery-nail" data-finger-position={NAIL_ORDER[nailIndex]} data-gallery-row={rowIndex === 0 ? 'top' : 'bottom'}>
            <BlueprintGalleryNail nail={nail} uid={`${uid}-${rowIndex}`} />
          </div>
        )))}
      </div>
    </div>
  );
}

const styles = {
  shell: {
    alignItems: 'center',
    background: 'radial-gradient(circle at 50% 44%, rgba(255,255,255,.98) 0 34%, rgba(255,247,251,.92) 62%, rgba(244,214,229,.82) 100%)',
    borderRadius: 24,
    boxShadow: 'inset 0 0 0 1px rgba(123,45,95,.08), inset 0 -28px 52px rgba(123,45,95,.08)',
    contain: 'layout paint size',
    display: 'grid',
    height: '100%',
    justifyItems: 'center',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    padding: 'clamp(1px, .45%, 4px)',
    width: '100%',
  },
  tray: {
    alignContent: 'center',
    display: 'grid',
    gap: 'var(--gallery-row-gap) var(--gallery-column-gap)',
    gridTemplateColumns: 'repeat(5, var(--gallery-cell-width))',
    gridTemplateRows: 'repeat(2, var(--gallery-cell-height))',
    height: 'var(--gallery-tray-area)',
    justifyItems: 'center',
    maxHeight: '100%',
    maxWidth: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    padding: 'var(--gallery-tray-padding)',
    width: 'var(--gallery-tray-area)',
    background: 'linear-gradient(145deg, rgba(255,255,255,.18), rgba(248,232,241,.06))',
    borderRadius: 20,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.18), inset 0 20px 36px rgba(255,255,255,.08)',
    backdropFilter: 'blur(10px)',
  },
  nailSlot: {
    alignItems: 'center',
    display: 'grid',
    filter: 'drop-shadow(0 10px 12px rgba(90,44,80,.18))',
    height: 'var(--gallery-nail-fill)',
    justifyItems: 'center',
    maxHeight: '100%',
    maxWidth: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    placeItems: 'center',
    width: 'var(--gallery-nail-fill)',
  },
  nailSvg: {
    display: 'block',
    height: '100%',
    maxHeight: '100%',
    maxWidth: '100%',
    objectFit: 'contain',
    overflow: 'visible',
    width: '100%',
  },
};
