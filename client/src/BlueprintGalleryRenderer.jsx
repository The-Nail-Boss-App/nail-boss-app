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

export function getBlueprintGalleryAutoScaleStyle(renderMode = 'gallery') {
  return {
    '--gallery-art-fill': renderMode === 'gallery' ? '88%' : '84%',
    '--gallery-tray-gap': 'clamp(1px, 0.8%, 6px)',
    '--gallery-row-gap': 'clamp(2px, 1.2%, 8px)',
    '--gallery-nail-width': 'min(calc((var(--gallery-art-fill) - (4 * var(--gallery-tray-gap))) / 5), calc((100% - var(--gallery-row-gap)) / 2 * 0.66))',
  };
}

function BlueprintGalleryNail({ nail, uid }) {
  const clipId = `${uid}-gallery-${nail.id}`;
  const base = nail.layers.find((layer) => layer.type === 'base');
  const path = buildNailPath(nail.shape, nail);
  const artLayers = nail.layers.filter((layer) => layer.type !== 'base' && layer.visible !== false).sort(layerSort);

  return (
    <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" aria-hidden="true" focusable="false" style={styles.nailSvg}>
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
    <div style={{ ...styles.shell, ...getBlueprintGalleryAutoScaleStyle(renderMode) }} data-testid="blueprint-gallery-renderer" data-render-mode={renderMode} data-presentation-theme={presentationTheme} aria-label="Blueprint gallery product preview">
      <div style={styles.tray} data-testid="blueprint-gallery-artwork-tray">
        {rows.map((nails, rowIndex) => (
          <div key={rowIndex === 0 ? 'top' : 'bottom'} style={styles.row} data-testid="blueprint-gallery-nail-row">
            {nails.slice(0, 5).map((nail, nailIndex) => (
              <div key={nail.id} style={styles.nailSlot} data-testid="blueprint-gallery-nail" data-finger-position={NAIL_ORDER[nailIndex]}>
                <BlueprintGalleryNail nail={nail} uid={`${uid}-${rowIndex}`} />
              </div>
            ))}
          </div>
        ))}
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
    padding: 'clamp(2px, 1%, 8px)',
    width: '100%',
  },
  tray: {
    alignContent: 'center',
    display: 'grid',
    gap: 'var(--gallery-row-gap)',
    gridTemplateRows: 'repeat(2, minmax(0, 1fr))',
    height: '88%',
    justifyItems: 'center',
    maxHeight: '100%',
    maxWidth: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    width: 'var(--gallery-art-fill)',
  },
  row: {
    alignItems: 'center',
    display: 'grid',
    gap: 'var(--gallery-tray-gap)',
    gridTemplateColumns: 'repeat(5, var(--gallery-nail-width))',
    height: '100%',
    justifyContent: 'center',
    maxHeight: '100%',
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
  },
  nailSlot: {
    aspectRatio: '70 / 104',
    display: 'grid',
    filter: 'drop-shadow(0 10px 12px rgba(90,44,80,.18))',
    maxHeight: '100%',
    minHeight: 0,
    minWidth: 0,
    overflow: 'hidden',
    placeItems: 'center',
    width: 'var(--gallery-nail-width)',
  },
  nailSvg: {
    display: 'block',
    height: '100%',
    maxHeight: '100%',
    maxWidth: '100%',
    overflow: 'visible',
    width: '100%',
  },
};
