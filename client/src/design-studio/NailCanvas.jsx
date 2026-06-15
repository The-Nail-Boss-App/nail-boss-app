import { useMemo, useRef, useState } from "react";
import { COLORS } from "../styles.js";
import { renderAssetShapes } from "./assets.js";
import { VIEWBOX, buildNailPath, constrainStrokePoints, getNailArchitecture, getNailGeometry, normalizedToSvg, projectPointInsideNailSilhouette, svgToNormalized, layerSort } from "./blueprint.js";
import { assetLayerRenderProps } from "./assetRendering.js";
import { FrenchTipShape } from "./frenchTipRendering.js";
import { PolishDefs, PolishSurface } from "./PolishRenderer.jsx";

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

export default function NailCanvas({ nail, layers, selectedLayerId, mode, brush, notice, debugOverlay = false, onSelectLayer, onTransformLayer, onDrawingStroke, onStageEraseStroke, onEraseStroke }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const clipId = useMemo(() => `nail-clip-${Math.random().toString(36).slice(2)}`, []);
  const uid = useMemo(() => `defs-${Math.random().toString(36).slice(2)}`, []);
  const path = buildNailPath(nail.shape, nail);
  const baseLayer = layers.find((layer) => layer.type === "base");
  const artLayers = [...layers].filter((layer) => layer.type !== "base" && layer.visible !== false).sort(layerSort);
  const geometry = getNailGeometry(nail);
  const architecture = getNailArchitecture(nail);

  function svgPoint(event) {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * VIEWBOX.width, y: ((event.clientY - rect.top) / rect.height) * VIEWBOX.height };
  }

  function setActiveDrag(nextDrag) {
    dragRef.current = nextDrag;
    setDrag(nextDrag);
  }

  function releaseCapture(target, pointerId) {
    if (!target?.releasePointerCapture || pointerId === undefined || pointerId === null) return;
    try {
      if (!target.hasPointerCapture || target.hasPointerCapture(pointerId)) target.releasePointerCapture(pointerId);
    } catch {
      // Pointer capture may already be released by the browser after pointerup/cancel.
    }
  }

  function pointerDown(event, layer) {
    if (dragRef.current || mode === "draw" || mode === "eraser") return;
    event.stopPropagation();
    onSelectLayer(layer.id);
    if (layer.locked) return;
    const start = svgToNormalized(svgPoint(event), nail);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveDrag({ kind: "asset", layerId: layer.id, start, original: { ...layer.transform }, pointerId: event.pointerId, captureTarget: event.currentTarget });
  }

  function pointerMove(event) {
    if (mode === "draw" || mode === "eraser") return;
    const activeDrag = dragRef.current;
    if (activeDrag?.kind !== "asset" || activeDrag.pointerId !== event.pointerId) return;
    const now = svgToNormalized(svgPoint(event), nail);
    onTransformLayer(activeDrag.layerId, { ...activeDrag.original, x: activeDrag.original.x + now.x - activeDrag.start.x, y: activeDrag.original.y + now.y - activeDrag.start.y }, false);
  }

  function finishPointerGesture(event) {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (activeDrag.kind === "asset") {
      onTransformLayer(activeDrag.layerId, null, true, activeDrag.original);
      releaseCapture(activeDrag.captureTarget, activeDrag.pointerId);
      setActiveDrag(null);
      return;
    }
    if (activeDrag.kind === "drawing") {
      onDrawingStroke({ ...activeDrag.stroke, points: constrainStrokePoints(activeDrag.stroke.points, nail) });
      releaseCapture(activeDrag.captureTarget, activeDrag.pointerId);
      setActiveDrag(null);
      return;
    }
    if (activeDrag.kind === "eraser") {
      onEraseStroke(activeDrag.pendingEraseTarget);
      releaseCapture(activeDrag.captureTarget, activeDrag.pointerId);
      setActiveDrag(null);
    }
  }

  function cancelPointerGesture(event) {
    const activeDrag = dragRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (activeDrag.kind === "asset") {
      onTransformLayer(activeDrag.layerId, activeDrag.original, false, { cancel: true });
    }
    releaseCapture(activeDrag.captureTarget, activeDrag.pointerId);
    setActiveDrag(null);
  }

  function canvasDown(event) {
    if (dragRef.current) return;
    if (mode !== "draw" && mode !== "eraser") {
      onSelectLayer(null);
      return;
    }
    const point = projectPointInsideNailSilhouette(svgToNormalized(svgPoint(event), nail), nail);
    if (mode === "eraser") {
      const pendingEraseTarget = onStageEraseStroke(point);
      if (!pendingEraseTarget) return;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setActiveDrag({ kind: "eraser", point, pendingEraseTarget, pointerId: event.pointerId, captureTarget: event.currentTarget });
      return;
    }
    const stroke = { id: `stroke-${Date.now().toString(36)}`, points: [point], colorHex: brush.colorHex, width: brush.size / 100, opacity: brush.opacity, tool: brush.tool };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setActiveDrag({ kind: "drawing", stroke, pointerId: event.pointerId, captureTarget: event.currentTarget });
  }

  function canvasMove(event) {
    const activeDrag = dragRef.current;
    if (activeDrag?.kind !== "drawing" || activeDrag.pointerId !== event.pointerId) return;
    const point = projectPointInsideNailSilhouette(svgToNormalized(svgPoint(event), nail), nail);
    const previous = activeDrag.stroke.points[activeDrag.stroke.points.length - 1];
    if (previous && Math.hypot(previous.x - point.x, previous.y - point.y) < 0.001) return;
    const stroke = { ...activeDrag.stroke, points: constrainStrokePoints([...activeDrag.stroke.points, point], nail) };
    setActiveDrag({ ...activeDrag, stroke });
  }


  function layerNode(layer) {
    const drawingMode = mode === "draw" || mode === "eraser";
    const selectOverlay = (event) => {
      if (drawingMode) return;
      event.stopPropagation();
      onSelectLayer(layer.id);
    };
    if (layer.type === "gradient") {
      const id = `${uid}-${layer.id}`;
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} pointerEvents="none"><defs><LayerGradient layer={layer} id={id}/></defs><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/></g>;
    }
    if (layer.type === "pattern") {
      const id = `${uid}-${layer.id}`;
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} pointerEvents="none"><defs><PatternDefs layer={layer} id={id}/></defs><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/></g>;
    }
    if (layer.type === "frenchTip") {
      return <FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId}/>;
    }
    if (layer.type === "drawing") {
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} pointerEvents={drawingMode ? "none" : "auto"} onPointerDown={selectOverlay}>
        {(layer.data?.strokes || []).map((stroke) => <path key={stroke.id} d={strokePath(stroke.points, nail)} fill="none" stroke={stroke.tool === "eraser" ? baseLayer?.data?.colorHex : stroke.colorHex} strokeWidth={(stroke.width || 0.04) * 100} strokeOpacity={stroke.opacity} strokeLinecap="round" strokeLinejoin="round" filter={stroke.tool === "soft" ? `url(#${uid}-soft)` : undefined} strokeDasharray={stroke.tool === "glitter" ? "1 9" : undefined}/>) }
      </g>;
    }
    const p = normalizedToSvg(layer.transform, nail);
    const size = Math.min(geometry.width, geometry.height) * layer.transform.scaleX;
    const assetRender = assetLayerRenderProps(layer, nail);
    const selected = selectedLayerId === layer.id;
    return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={assetRender.opacity} onPointerDown={(e) => pointerDown(e, layer)} style={{ cursor: layer.locked ? "not-allowed" : "grab" }} data-layer-type={layer.type} data-asset-id={assetRender.assetId}>
      <ellipse cx={p.x + 4} cy={p.y + size * .28} rx={size * .34} ry={size * .13} fill="#2b1024" opacity=".22"/>
      <g transform={assetRender.innerTransform}>
        {renderAssetShapes(assetRender.assetId, assetRender.colorHex)}
        {layer.type === "jewel" && <circle cx={p.x - size * .12} cy={p.y - size * .14} r={Math.max(2, size * .08)} fill="#fff" opacity=".72"/>}
      </g>
      {selected && <g pointerEvents="none"><rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx="8" fill="none" stroke={COLORS.plum} strokeWidth="2" strokeDasharray="5 4"/><circle cx={p.x + size / 2} cy={p.y + size / 2} r="5" fill={COLORS.plum}/><path d={`M${p.x} ${p.y - size / 2 - 14} L${p.x} ${p.y - size / 2 - 2}`} stroke={COLORS.plum} strokeWidth="2"/><circle cx={p.x} cy={p.y - size / 2 - 18} r="5" fill="#fff" stroke={COLORS.plum} strokeWidth="2"/></g>}
    </g>;
  }

  return <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative" }}>
    <div style={{ width: "min(54vh, 96%)", maxWidth: 430, aspectRatio: "2 / 3", background: "linear-gradient(180deg,#fff,#fbf1f8)", border: `1px solid ${COLORS.border}`, borderRadius: 28, boxShadow: "inset 0 0 0 12px rgba(255,255,255,.55), 0 18px 50px rgba(60,20,50,.10)", padding: 12 }}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" role="img" aria-label="Editable single nail canvas" onPointerDown={canvasDown} onPointerMove={(e) => { pointerMove(e); canvasMove(e); }} onPointerUp={finishPointerGesture} onPointerCancel={cancelPointerGesture} style={{ touchAction: "none", userSelect: "none" }}>
        <defs>
          <clipPath id={clipId}><path d={path}/></clipPath>
          <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="1.2"/></filter>
          <PolishDefs nail={nail} baseLayer={baseLayer} uid={uid}/>
        </defs>
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="transparent"/>
        <PolishSurface nail={nail} baseLayer={baseLayer} path={path} clipId={clipId} uid={uid}/>
        {artLayers.map(layerNode)}
        {drag?.kind === "drawing" && <g clipPath={`url(#${clipId})`}><path d={strokePath(drag.stroke.points, nail)} fill="none" stroke={drag.stroke.colorHex} strokeWidth={(drag.stroke.width || 0.04) * 100} strokeOpacity={drag.stroke.opacity} strokeLinecap="round" strokeLinejoin="round"/></g>}
        {debugOverlay && <g pointerEvents="none" aria-hidden="true">
          <line x1={architecture.cx} y1={architecture.topY - 6} x2={architecture.cx} y2={architecture.bottomY + 6} stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6 5"/>
          <circle cx={architecture.apex.x} cy={architecture.apex.y} r="5" fill="#f97316" stroke="#fff" strokeWidth="2"/>
          <line x1={architecture.left} y1={architecture.apex.y} x2={architecture.right} y2={architecture.apex.y} stroke="#f97316" strokeWidth="1.25" strokeDasharray="4 4"/>
          <path d={`M ${architecture.cx - architecture.cuticle.halfW} ${architecture.cuticle.y} Q ${architecture.cx} ${architecture.topY - architecture.height * 0.025} ${architecture.cx + architecture.cuticle.halfW} ${architecture.cuticle.y}`} fill="none" stroke="#16a34a" strokeWidth="2"/>
          <line x1={architecture.left} y1={architecture.topY + architecture.height * 0.18} x2={architecture.left} y2={architecture.bottomY - 10} stroke="#db2777" strokeWidth="1.5" strokeDasharray="5 5"/>
          <line x1={architecture.right} y1={architecture.topY + architecture.height * 0.18} x2={architecture.right} y2={architecture.bottomY - 10} stroke="#db2777" strokeWidth="1.5" strokeDasharray="5 5"/>
          <line x1={architecture.left} y1={architecture.topY + architecture.height * architecture.freeEdgeYNorm} x2={architecture.right} y2={architecture.topY + architecture.height * architecture.freeEdgeYNorm} stroke="#7c3aed" strokeWidth="1.5"/>
        </g>}
      </svg>
    </div>
    <p style={{ marginTop: 6, color: COLORS.textMuted, fontSize: 13 }}>{selectedLayerId ? "Drag selected artwork inside the strict nail boundary. Use Properties for size and rotation." : "Select an art layer, add an asset, or choose Draw to begin."}</p>
    {notice && <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: COLORS.plum, color: "#fff", padding: "10px 14px", borderRadius: 999, fontSize: 12, boxShadow: "0 10px 30px rgba(60,20,50,.2)" }}>{notice}</div>}
  </div>;
}
