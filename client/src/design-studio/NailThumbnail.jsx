import { COLORS } from "../styles.js";
import { renderAssetShapes } from "./assets.js";
import { VIEWBOX, buildNailPath, layerSort, slotLabel } from "./blueprint.js";
import { assetLayerRenderProps, isRenderableAssetLayer } from "./assetRendering.js";
import { strokePath } from "./NailCanvas.jsx";

function MiniPattern({ id, layer }) {
  const color = layer.data?.colorHex || "#fff";
  return <pattern id={id} width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="transparent"/><circle cx="8" cy="8" r="3" fill={color}/><circle cx="21" cy="21" r="2" fill={color} opacity=".75"/></pattern>;
}

export default function NailThumbnail({ nail, active = false, onClick }) {
  const clipId = `thumb-clip-${nail.id}`;
  const base = nail.layers.find((layer) => layer.type === "base");
  const path = buildNailPath(nail.shape, nail);
  const artLayers = nail.layers.filter((layer) => layer.type !== "base" && layer.visible !== false).sort(layerSort);
  return <button type="button" onClick={onClick} aria-pressed={active} aria-label={`Edit ${slotLabel(nail.slot)} nail`} style={{ border: `2px solid ${active ? COLORS.plum : COLORS.border}`, background: active ? COLORS.roseDim : "#fff", borderRadius: 16, padding: 8, minWidth: 86, cursor: "pointer", boxShadow: active ? "0 10px 24px rgba(90,44,80,.18)" : "none" }}>
    <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="70" height="104" role="img" aria-label={`${slotLabel(nail.slot)} preview`} style={{ display: "block", margin: "0 auto" }}>
      <defs><clipPath id={clipId}><path d={path}/></clipPath></defs>
      <path d={path} fill={base?.data?.colorHex || nail.baseColorHex} stroke="rgba(59,31,53,.35)" strokeWidth="3"/>
      <g clipPath={`url(#${clipId})`}><ellipse cx="88" cy="105" rx="16" ry="70" fill="#fff" opacity=".22" transform="rotate(12 88 105)"/></g>
      {artLayers.map((layer) => {
        if (layer.type === "drawing") return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity}>{(layer.data?.strokes || []).map((stroke) => <path key={stroke.id} d={strokePath(stroke.points, nail)} fill="none" stroke={stroke.colorHex} strokeWidth={(stroke.width || 0.04) * 100} strokeOpacity={stroke.opacity} strokeLinecap="round" strokeLinejoin="round"/>)}</g>;
        if (layer.type === "gradient") return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity}><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={layer.data?.colorB || "#E8A0BF"}/></g>;
        if (layer.type === "pattern") { const id = `${clipId}-${layer.id}`; return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity}><defs><MiniPattern id={id} layer={layer}/></defs><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/></g>; }
        if (!isRenderableAssetLayer(layer)) return null;
        const assetRender = assetLayerRenderProps(layer, nail);
        return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={assetRender.opacity} data-layer-type={layer.type} data-asset-id={assetRender.assetId}>
          <g transform={assetRender.innerTransform}>
            {assetRender.inlineSvg ? <g dangerouslySetInnerHTML={{ __html: assetRender.inlineSvg }}/> : renderAssetShapes(assetRender.assetId, assetRender.colorHex)}
          </g>
        </g>;
      })}
      <path d={path} fill="none" stroke="rgba(59,31,53,.45)" strokeWidth="3"/>
    </svg>
    <div style={{ fontSize: 11, fontWeight: 800, color: active ? COLORS.plum : COLORS.textMuted }}>{slotLabel(nail.slot)}</div>
  </button>;
}
