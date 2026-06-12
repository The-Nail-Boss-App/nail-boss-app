import { useMemo, useRef, useState } from "react";
import { COLORS } from "../styles.js";
import { renderAssetShapes } from "./assets.js";
import { VIEWBOX, buildNailPath, constrainStrokePoints, getNailGeometry, normalizedToSvg, projectPointInsideNailSilhouette, svgToNormalized, layerSort } from "./blueprint.js";

function EffectDefs({ baseLayer, uid }) {
  const data = baseLayer?.data || {};
  const base = data.colorHex || "#E8A0BF";
  const fx = data.effectColorHex || "#FFFFFF";
  switch (data.effect) {
    case "Gradient":
      return <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={fx}/><stop offset="100%" stopColor={base}/></linearGradient>;
    case "Chrome":
      return <linearGradient id={`${uid}-base`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity=".95"/><stop offset="30%" stopColor={base}/><stop offset="62%" stopColor={fx}/><stop offset="100%" stopColor="#fff" stopOpacity=".6"/></linearGradient>;
    case "CatEye":
      return <radialGradient id={`${uid}-base`} cx="50%" cy="45%" r="70%"><stop offset="0%" stopColor={fx}/><stop offset="42%" stopColor={base}/><stop offset="100%" stopColor="#2c1530" stopOpacity=".38"/></radialGradient>;
    case "Marble":
      return <pattern id={`${uid}-base`} width="42" height="42" patternUnits="userSpaceOnUse"><rect width="42" height="42" fill={base}/><path d="M-8 33 C8 20 13 8 31 -4 M4 45 C17 30 25 27 50 11" stroke={fx} strokeWidth="4" opacity=".62" fill="none"/><path d="M2 4 C16 14 25 8 40 19" stroke="#fff" strokeWidth="2" opacity=".55" fill="none"/></pattern>;
    case "Solid":
    default:
      return null;
  }
}

function LayerGradient({ layer, id }) {
  const direction = layer.data.direction || "vertical";
  const points = {
    vertical: { x1: "0", y1: "0", x2: "0", y2: "1" },
    horizontal: { x1: "0", y1: "0", x2: "1", y2: "0" },
    diagonal: { x1: "0", y1: "0", x2: "1", y2: "1" },
    "reverse-diagonal": { x1: "1", y1: "0", x2: "0", y2: "1" },
  }[direction] || { x1: "0", y1: "0", x2: "0", y2: "1" };
  return <linearGradient id={id} {...points}><stop offset="0%" stopColor={layer.data.colorA || "#fff"}/><stop offset="100%" stopColor={layer.data.colorB || "#E8A0BF"}/></linearGradient>;
}

function PatternDefs({ layer, id }) {
  const c = layer.data.colorHex || "#fff";
  const s = layer.data.secondaryColorHex || "#3B1F35";
  switch (layer.data.pattern) {
    case "stripes": return <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="18" height="18" fill="transparent"/><rect width="7" height="18" fill={c}/></pattern>;
    case "checker": return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse"><rect width="24" height="24" fill="transparent"/><rect width="12" height="12" fill={c}/><rect x="12" y="12" width="12" height="12" fill={c}/><rect x="12" width="12" height="12" fill={s} opacity=".25"/><rect y="12" width="12" height="12" fill={s} opacity=".25"/></pattern>;
    case "french-tip": return <pattern id={id} width="240" height="360" patternUnits="userSpaceOnUse"><rect width="240" height="360" fill="transparent"/><path d="M54 255 Q120 305 186 255 L186 360 L54 360 Z" fill={c}/></pattern>;
    case "glitter": return <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse"><rect width="34" height="34" fill="transparent"/><circle cx="7" cy="8" r="2" fill={c}/><circle cx="24" cy="18" r="1.5" fill={c}/><path d="M18 4 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill={c} opacity=".85"/></pattern>;
    case "marble": return <pattern id={id} width="54" height="54" patternUnits="userSpaceOnUse"><rect width="54" height="54" fill="transparent"/><path d="M-8 42 C14 24 19 12 46 -2 M5 57 C22 37 38 34 62 10" stroke={c} strokeWidth="5" opacity=".75" fill="none"/><path d="M3 8 C22 23 31 7 51 26" stroke={s} strokeWidth="2" opacity=".35" fill="none"/></pattern>;
    case "dots":
    default: return <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse"><rect width="26" height="26" fill="transparent"/><circle cx="7" cy="7" r="3.5" fill={c}/><circle cx="20" cy="20" r="2.5" fill={c} opacity=".8"/></pattern>;
  }
}

export function strokePath(points = [], nail) {
  if (!points.length) return "";
  return points.map((point, index) => {
    const svgPoint = normalizedToSvg(point, nail);
    return `${index === 0 ? "M" : "L"} ${svgPoint.x.toFixed(4)} ${svgPoint.y.toFixed(4)}`;
  }).join(" ");
}

export default function NailCanvas({ nail, layers, selectedLayerId, mode, brush, notice, onSelectLayer, onTransformLayer, onDrawingStroke, onEraseStroke }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const clipId = useMemo(() => `nail-clip-${Math.random().toString(36).slice(2)}`, []);
  const uid = useMemo(() => `defs-${Math.random().toString(36).slice(2)}`, []);
  const path = buildNailPath(nail.shape, nail);
  const baseLayer = layers.find((layer) => layer.type === "base");
  const artLayers = [...layers].filter((layer) => layer.type !== "base" && layer.visible !== false).sort(layerSort);
  const geometry = getNailGeometry(nail);

  function svgPoint(event) {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * VIEWBOX.width, y: ((event.clientY - rect.top) / rect.height) * VIEWBOX.height };
  }

  function pointerDown(event, layer) {
    if (mode === "draw" || mode === "eraser") return;
    event.stopPropagation();
    onSelectLayer(layer.id);
    if (layer.locked) return;
    const start = svgToNormalized(svgPoint(event), nail);
    setDrag({ layerId: layer.id, start, original: { ...layer.transform } });
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function pointerMove(event) {
    if (!drag) return;
    const now = svgToNormalized(svgPoint(event), nail);
    onTransformLayer(drag.layerId, { ...drag.original, x: drag.original.x + now.x - drag.start.x, y: drag.original.y + now.y - drag.start.y }, false);
  }

  function pointerUp() {
    if (!drag) return;
    onTransformLayer(drag.layerId, null, true, drag.original);
    setDrag(null);
  }

  function canvasDown(event) {
    if (mode !== "draw" && mode !== "eraser") {
      onSelectLayer(null);
      return;
    }
    const point = projectPointInsideNailSilhouette(svgToNormalized(svgPoint(event), nail), nail);
    if (mode === "eraser") {
      onEraseStroke(point);
      return;
    }
    const stroke = { id: `stroke-${Date.now().toString(36)}`, points: [point], colorHex: brush.colorHex, width: brush.size / 100, opacity: brush.opacity, tool: brush.tool };
    setDrag({ drawing: true, stroke });
  }

  function canvasMove(event) {
    if (!drag?.drawing) return;
    const point = projectPointInsideNailSilhouette(svgToNormalized(svgPoint(event), nail), nail);
    const previous = drag.stroke.points[drag.stroke.points.length - 1];
    if (previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 0.001) return;
    const stroke = { ...drag.stroke, points: constrainStrokePoints([...drag.stroke.points, point], nail) };
    setDrag({ drawing: true, stroke });
  }

  function canvasUp() {
    if (drag?.drawing) onDrawingStroke({ ...drag.stroke, points: constrainStrokePoints(drag.stroke.points, nail) });
    setDrag(null);
  }

  function layerNode(layer) {
    if (layer.type === "gradient") {
      const id = `${uid}-${layer.id}`;
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} onPointerDown={(e) => { e.stopPropagation(); onSelectLayer(layer.id); }}><defs><LayerGradient layer={layer} id={id}/></defs><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/></g>;
    }
    if (layer.type === "pattern") {
      const id = `${uid}-${layer.id}`;
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} onPointerDown={(e) => { e.stopPropagation(); onSelectLayer(layer.id); }}><defs><PatternDefs layer={layer} id={id}/></defs><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/></g>;
    }
    if (layer.type === "drawing") {
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} onPointerDown={(e) => { e.stopPropagation(); onSelectLayer(layer.id); }}>
        {(layer.data?.strokes || []).map((stroke) => <path key={stroke.id} d={strokePath(stroke.points, nail)} fill="none" stroke={stroke.tool === "eraser" ? baseLayer?.data?.colorHex : stroke.colorHex} strokeWidth={(stroke.width || 0.04) * 100} strokeOpacity={stroke.opacity} strokeLinecap="round" strokeLinejoin="round" filter={stroke.tool === "soft" ? `url(#${uid}-soft)` : undefined} strokeDasharray={stroke.tool === "glitter" ? "1 9" : undefined}/>) }
      </g>;
    }
    const p = normalizedToSvg(layer.transform, nail);
    const size = Math.min(geometry.width, geometry.height) * layer.transform.scaleX;
    const selected = selectedLayerId === layer.id;
    return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} onPointerDown={(e) => pointerDown(e, layer)} style={{ cursor: layer.locked ? "not-allowed" : "grab" }}>
      <g transform={`translate(${p.x} ${p.y}) rotate(${layer.transform.rotation}) scale(${size / 84})`}>
        {renderAssetShapes(layer.data?.assetId, layer.data?.colorHex)}
      </g>
      {selected && <g pointerEvents="none"><rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx="8" fill="none" stroke={COLORS.plum} strokeWidth="2" strokeDasharray="5 4"/><circle cx={p.x + size / 2} cy={p.y + size / 2} r="5" fill={COLORS.plum}/><path d={`M${p.x} ${p.y - size / 2 - 14} L${p.x} ${p.y - size / 2 - 2}`} stroke={COLORS.plum} strokeWidth="2"/><circle cx={p.x} cy={p.y - size / 2 - 18} r="5" fill="#fff" stroke={COLORS.plum} strokeWidth="2"/></g>}
    </g>;
  }

  return <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative" }}>
    <div style={{ width: "min(72vh, 96%)", maxWidth: 560, aspectRatio: "2 / 3", background: "linear-gradient(180deg,#fff,#fbf1f8)", border: `1px solid ${COLORS.border}`, borderRadius: 28, boxShadow: "inset 0 0 0 12px rgba(255,255,255,.55), 0 18px 50px rgba(60,20,50,.10)", padding: 18 }}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" role="img" aria-label="Editable single nail canvas" onPointerDown={canvasDown} onPointerMove={(e) => { pointerMove(e); canvasMove(e); }} onPointerUp={() => { pointerUp(); canvasUp(); }} onPointerCancel={() => { pointerUp(); canvasUp(); }} style={{ touchAction: "none", userSelect: "none" }}>
        <defs>
          <clipPath id={clipId}><path d={path}/></clipPath>
          <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="1.2"/></filter>
          <EffectDefs baseLayer={baseLayer} uid={uid}/>
        </defs>
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="transparent"/>
        <path d={path} fill={baseLayer?.data?.effect === "Solid" ? baseLayer.data.colorHex : `url(#${uid}-base)`} stroke="rgba(59,31,53,.24)" strokeWidth="2"/>
        <g clipPath={`url(#${clipId})`}><ellipse cx="88" cy="105" rx="16" ry="70" fill="#fff" opacity=".28" transform="rotate(12 88 105)"/></g>
        {artLayers.map(layerNode)}
        {drag?.drawing && <g clipPath={`url(#${clipId})`}><path d={strokePath(drag.stroke.points, nail)} fill="none" stroke={drag.stroke.colorHex} strokeWidth={(drag.stroke.width || 0.04) * 100} strokeOpacity={drag.stroke.opacity} strokeLinecap="round" strokeLinejoin="round"/></g>}
        <path d={path} fill="none" stroke="rgba(59,31,53,.45)" strokeWidth="2.5" pointerEvents="none"/>
      </svg>
    </div>
    <p style={{ marginTop: 10, color: COLORS.textMuted, fontSize: 13 }}>{selectedLayerId ? "Drag selected artwork inside the strict nail boundary. Use Properties for size and rotation." : "Select an art layer, add an asset, or choose Draw to begin."}</p>
    {notice && <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: COLORS.plum, color: "#fff", padding: "10px 14px", borderRadius: 999, fontSize: 12, boxShadow: "0 10px 30px rgba(60,20,50,.2)" }}>{notice}</div>}
  </div>;
}
