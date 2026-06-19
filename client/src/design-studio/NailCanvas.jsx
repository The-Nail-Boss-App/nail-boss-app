import { useMemo, useRef, useState } from "react";
import { COLORS } from "../styles.js";
import { renderAssetShapes } from "./assets.js";
import { VIEWBOX, buildNailPath, constrainStrokePoints, getNailArchitecture, getNailGeometry, normalizedToSvg, projectPointInsideNailSilhouette, svgToNormalized, layerSort } from "./blueprint.js";
import { AssetContactShadow, AssetSpecularAccent, AssetSurfaceBlend, assetLayerRenderProps } from "./assetRendering.js";
import { FrenchTipShape } from "./frenchTipRendering.js";
import { PolishDefs, PolishSurface } from "./PolishRenderer.jsx";
import { polishMaterialProfile, resolvePolishDataForRender } from "./polish.js";

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

export function artMaterialProfile(baseLayer, nail) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const material = polishMaterialProfile(data.polishType, data.shine);
  const artOpacity = data.polishType === "Jelly" ? 0.82 : data.polishType === "Milky" ? 0.88 : data.polishType === "Matte" ? 0.76 : 1;
  const edgeSoftness = data.polishType === "Milky" ? 0.7 : data.polishType === "Matte" ? 0.45 : data.polishType === "Jelly" ? 0.35 : 0;
  const surfaceHighlight = data.polishType === "Matte" ? 0.05 : data.polishType === "Jelly" ? 0.2 : data.polishType === "Milky" ? 0.1 : 0.14;
  return { ...data, material, artOpacity, edgeSoftness, surfaceHighlight };
}

export function ArtRealismDefs({ uid }) {
  return <>
    <filter id={`${uid}-art-soft-edge`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.55"/></filter>
    <filter id={`${uid}-paint-contact-blur`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.85"/></filter>
  </>;
}

export function PaintedStroke({ stroke, nail, baseLayer, uid, baseColor }) {
  const art = artMaterialProfile(baseLayer, nail);
  const d = strokePath(stroke.points, nail);
  const width = (stroke.width || 0.04) * 100;
  const color = stroke.tool === "eraser" ? baseColor : stroke.colorHex;
  const opacity = (stroke.opacity ?? 1) * art.artOpacity;
  return <g data-realism-layer="painted-stroke-material-aware-opacity" style={{ mixBlendMode: art.polishType === "Jelly" ? "multiply" : "normal" }}>
    <path data-realism-layer="paint-contact-shadow" d={d} fill="none" stroke="#1a0815" strokeWidth={width * 1.08} strokeOpacity={0.06 + art.material.depth * 0.05} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${uid}-paint-contact-blur)`}/>
    {art.edgeSoftness > 0 && <path data-realism-layer="material-softened-paint-edge" d={d} fill="none" stroke={color} strokeWidth={width * 1.12} strokeOpacity={opacity * 0.34} strokeLinecap="round" strokeLinejoin="round" filter={`url(#${uid}-art-soft-edge)`}/>}
    <path d={d} fill="none" stroke={color} strokeWidth={width} strokeOpacity={opacity} strokeLinecap="round" strokeLinejoin="round" filter={stroke.tool === "soft" ? `url(#${uid}-soft)` : undefined} strokeDasharray={stroke.tool === "glitter" ? "1 9" : undefined}/>
    <path data-realism-layer="wet-paint-surface-highlight" d={d} fill="none" stroke="#fff" strokeWidth={Math.max(1, width * 0.18)} strokeOpacity={art.surfaceHighlight} strokeLinecap="round" strokeLinejoin="round"/>
  </g>;
}

function patternTransform(layer, baseRotation = 0) {
  const transform = layer.transform || {};
  const x = ((Number.isFinite(transform.x) ? transform.x : 0.5) - 0.5) * VIEWBOX.width;
  const y = ((Number.isFinite(transform.y) ? transform.y : 0.5) - 0.5) * VIEWBOX.height;
  const scaleX = Number.isFinite(transform.scaleX) ? Math.max(0.2, transform.scaleX) : 1;
  const scaleY = Number.isFinite(transform.scaleY) ? Math.max(0.2, transform.scaleY) : 1;
  const rotation = (Number.isFinite(transform.rotation) ? transform.rotation : 0) + baseRotation;
  return `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotation.toFixed(3)} ${VIEWBOX.cx} ${VIEWBOX.height / 2}) scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)})`;
}

export function PatternDefs({ layer, id }) {
  const c = layer.data.colorHex || "#fff";
  const s = layer.data.secondaryColorHex || "#3B1F35";
  switch (layer.data.pattern) {
    case "stripes": return <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, 35)}><rect width="18" height="18" fill="transparent"/><rect width="7" height="18" fill={c}/></pattern>;
    case "checker": return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="24" height="24" fill="transparent"/><rect width="12" height="12" fill={c}/><rect x="12" y="12" width="12" height="12" fill={c}/><rect x="12" width="12" height="12" fill={s} opacity=".25"/><rect y="12" width="12" height="12" fill={s} opacity=".25"/></pattern>;
    case "french-tip": return <pattern id={id} width="240" height="360" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="240" height="360" fill="transparent"/><path d="M54 255 Q120 305 186 255 L186 360 L54 360 Z" fill={c}/></pattern>;
    case "glitter": return <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="34" height="34" fill="transparent"/><circle cx="7" cy="8" r="2" fill={c}/><circle cx="24" cy="18" r="1.5" fill={c}/><path d="M18 4 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill={c} opacity=".85"/></pattern>;
    case "marble": return <pattern id={id} width="54" height="54" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="54" height="54" fill="transparent"/><path d="M-8 42 C14 24 19 12 46 -2 M5 57 C22 37 38 34 62 10" stroke={c} strokeWidth="5" opacity=".75" fill="none"/><path d="M3 8 C22 23 31 7 51 26" stroke={s} strokeWidth="2" opacity=".35" fill="none"/></pattern>;
    case "camo": return <pattern id={id} width="74" height="58" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="camo"><rect width="74" height="58" fill="transparent"/><path d="M-8 13 C1 3 14 5 19 12 C27 7 42 9 43 20 C54 19 67 25 63 37 C58 50 38 47 32 40 C21 48 4 43 7 31 C-1 29 -14 23 -8 13Z" fill={c} opacity=".9"/><path d="M39 -4 C49 0 57 7 56 17 C66 14 78 19 80 30 C82 42 67 48 56 43 C49 52 32 51 28 40 C24 29 35 25 42 24 C34 16 28 4 39 -4Z" fill={s} opacity=".55"/><path d="M10 48 C17 38 29 40 34 47 C39 43 51 45 53 54 C55 64 41 68 33 63 C26 70 11 68 8 58 C2 58 -1 52 10 48Z" fill={c} opacity=".65"/></pattern>;
    case "houndstooth": return <pattern id={id} width="36" height="36" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="houndstooth"><rect width="36" height="36" fill="transparent"/><path d="M0 0 H18 V6 L24 0 H36 V12 L30 18 H36 V36 H18 V30 L12 36 H0 V24 L6 18 H0 Z" fill={c}/><path d="M18 0 H24 L18 6 Z M30 12 H36 L30 18 Z M0 18 H6 L0 24 Z M12 30 H18 L12 36 Z" fill={s} opacity=".42"/></pattern>;
    case "dots":
    default: return <pattern id={id} width="26" height="26" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="26" height="26" fill="transparent"/><circle cx="7" cy="7" r="3.5" fill={c}/><circle cx="20" cy="20" r="2.5" fill={c} opacity=".8"/></pattern>;
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
  const [cursorPoint, setCursorPoint] = useState(null);
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
    if (mode === "draw" || mode === "eraser") setCursorPoint(svgPoint(event));
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
    if (mode === "draw" || mode === "eraser") setCursorPoint(svgPoint(event));
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
      const art = artMaterialProfile(baseLayer, nail);
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={(layer.opacity ?? 1) * art.artOpacity} data-realism-layer="material-aware-clipped-pattern" pointerEvents="none"><defs><PatternDefs layer={layer} id={id}/></defs><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`}/><path d={path} fill="#fff" opacity={art.surfaceHighlight * 0.32}/><path d={path} fill="#2b1024" opacity={art.polishType === "Matte" ? 0.035 : 0}/></g>;
    }
    if (layer.type === "frenchTip") {
      return <FrenchTipShape key={layer.id} layer={layer} nail={nail} clipId={clipId}/>;
    }
    if (layer.type === "drawing") {
      return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={layer.opacity} pointerEvents={drawingMode ? "none" : "auto"} onPointerDown={selectOverlay}>
        {(layer.data?.strokes || []).map((stroke) => <PaintedStroke key={stroke.id} stroke={stroke} nail={nail} baseLayer={baseLayer} uid={uid} baseColor={baseLayer?.data?.colorHex}/>) }
      </g>;
    }
    const p = normalizedToSvg(layer.transform, nail);
    const size = Math.min(geometry.width, geometry.height) * layer.transform.scaleX;
    const assetRender = assetLayerRenderProps(layer, nail, artMaterialProfile(baseLayer, nail));
    const selected = selectedLayerId === layer.id;
    return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={assetRender.opacity} onPointerDown={(e) => pointerDown(e, layer)} style={{ cursor: layer.locked ? "not-allowed" : "grab" }} data-layer-type={layer.type} data-asset-id={assetRender.assetId}>
      <AssetContactShadow render={assetRender} uid={uid}/>
      <AssetSurfaceBlend layer={layer} render={assetRender}/>
      <g transform={assetRender.innerTransform}>
        {renderAssetShapes(assetRender.assetId, assetRender.colorHex)}
        <AssetSpecularAccent layer={layer} render={assetRender}/>
      </g>
      {selected && <g pointerEvents="none"><rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx="8" fill="none" stroke={COLORS.plum} strokeWidth="2" strokeDasharray="5 4"/><circle cx={p.x + size / 2} cy={p.y + size / 2} r="5" fill={COLORS.plum}/><path d={`M${p.x} ${p.y - size / 2 - 14} L${p.x} ${p.y - size / 2 - 2}`} stroke={COLORS.plum} strokeWidth="2"/><circle cx={p.x} cy={p.y - size / 2 - 18} r="5" fill="#fff" stroke={COLORS.plum} strokeWidth="2"/></g>}
    </g>;
  }

  const brushCursorRadius = Math.max(3, (brush?.size || 5) * 0.9);
  const brushCursorLength = Math.max(13, brushCursorRadius * 2.6);
  const brushCursorWidth = Math.max(3.5, brushCursorRadius * 0.72);
  const canvasCursor = mode === "draw" || mode === "eraser" ? "none" : "default";

  return <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", position: "relative" }}>
    <div style={{ width: "min(54vh, 96%)", maxWidth: 430, aspectRatio: "2 / 3", background: "linear-gradient(180deg,#fff,#fbf1f8)", border: `1px solid ${COLORS.border}`, borderRadius: 28, boxShadow: "inset 0 0 0 12px rgba(255,255,255,.55), 0 18px 50px rgba(60,20,50,.10)", padding: 12 }}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" role="img" aria-label="Editable single nail canvas" onPointerDown={canvasDown} onPointerMove={(e) => { pointerMove(e); canvasMove(e); }} onPointerUp={finishPointerGesture} onPointerCancel={cancelPointerGesture} onPointerLeave={() => setCursorPoint(null)} style={{ touchAction: "none", userSelect: "none", cursor: canvasCursor }}>
        <defs>
          <clipPath id={clipId}><path d={path}/></clipPath>
          <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="1.2"/></filter>
          <ArtRealismDefs uid={uid}/>
          <filter id={`${uid}-asset-shadow-blur`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <PolishDefs nail={nail} baseLayer={baseLayer} uid={uid}/>
        </defs>
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="transparent"/>
        <PolishSurface nail={nail} baseLayer={baseLayer} path={path} clipId={clipId} uid={uid}/>
        {artLayers.map(layerNode)}
        {drag?.kind === "drawing" && <g clipPath={`url(#${clipId})`}><path d={strokePath(drag.stroke.points, nail)} fill="none" stroke={drag.stroke.colorHex} strokeWidth={(drag.stroke.width || 0.04) * 100} strokeOpacity={drag.stroke.opacity} strokeLinecap="round" strokeLinejoin="round" data-realism-layer="in-progress-painted-stroke-preview"/></g>}
        {cursorPoint && mode === "draw" && <g pointerEvents="none" aria-hidden="true" transform={`translate(${cursorPoint.x} ${cursorPoint.y}) rotate(-34)`}>
          <path d={`M ${-brushCursorLength * 0.46} ${-brushCursorWidth * 0.42} L ${brushCursorLength * 0.32} ${-brushCursorWidth * 0.23} Q ${brushCursorLength * 0.55} 0 ${brushCursorLength * 0.32} ${brushCursorWidth * 0.23} L ${-brushCursorLength * 0.46} ${brushCursorWidth * 0.42} Q ${-brushCursorLength * 0.35} 0 ${-brushCursorLength * 0.46} ${-brushCursorWidth * 0.42} Z`} fill={brush.colorHex} fillOpacity=".72" stroke="#2b1024" strokeOpacity=".62" strokeWidth="1.1"/>
          <path d={`M ${-brushCursorLength * 0.34} 0 L ${brushCursorLength * 0.5} 0`} stroke="#fff" strokeOpacity=".58" strokeWidth="1" strokeLinecap="round"/>
          <rect x={-brushCursorLength * 0.72} y={-brushCursorWidth * 0.5} width={brushCursorLength * 0.26} height={brushCursorWidth} rx={brushCursorWidth * 0.32} fill="#d7a06a" stroke="#6d3d22" strokeWidth=".9"/>
          <line x1={-brushCursorLength * 0.88} y1="0" x2={-brushCursorLength * 0.72} y2="0" stroke="#3B1F35" strokeWidth={Math.max(2, brushCursorWidth * 0.48)} strokeLinecap="round"/>
        </g>}
        {cursorPoint && mode === "eraser" && <g pointerEvents="none" aria-hidden="true"><circle cx={cursorPoint.x} cy={cursorPoint.y} r={brushCursorRadius} fill="rgba(255,255,255,.55)" stroke={COLORS.plum} strokeWidth="1.8" strokeDasharray="4 3"/><circle cx={cursorPoint.x} cy={cursorPoint.y} r={Math.max(1.5, brushCursorRadius * .22)} fill={COLORS.plum} opacity=".32"/></g>}
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
    <p style={{ marginTop: 6, color: COLORS.textMuted, fontSize: 13 }}>{selectedLayerId ? "Drag selected artwork inside the strict nail boundary. Use Properties for size and rotation." : "Choose Draw for a visible brush cursor, set nail color, or select a board layer."}</p>
    {notice && <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: COLORS.plum, color: "#fff", padding: "10px 14px", borderRadius: 999, fontSize: 12, boxShadow: "0 10px 30px rgba(60,20,50,.2)" }}>{notice}</div>}
  </div>;
}
