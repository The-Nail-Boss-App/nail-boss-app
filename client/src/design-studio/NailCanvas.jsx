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
  const accent = s;
  switch (layer.data.pattern) {
    case "stripes": return <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, 35)}><rect width="18" height="18" fill="transparent"/><rect width="7" height="18" fill={c}/></pattern>;
    case "checker": return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="24" height="24" fill="transparent"/><rect width="12" height="12" fill={c}/><rect x="12" y="12" width="12" height="12" fill={c}/><rect x="12" width="12" height="12" fill={s} opacity=".25"/><rect y="12" width="12" height="12" fill={s} opacity=".25"/></pattern>;
    case "french-tip": return <pattern id={id} width="240" height="360" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="240" height="360" fill="transparent"/><path d="M54 255 Q120 305 186 255 L186 360 L54 360 Z" fill={c}/></pattern>;
    case "glitter": return <pattern id={id} width="34" height="34" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="34" height="34" fill="transparent"/><circle cx="7" cy="8" r="2" fill={c}/><circle cx="24" cy="18" r="1.5" fill={c}/><path d="M18 4 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2Z" fill={c} opacity=".85"/></pattern>;
    case "marble": return <pattern id={id} width="54" height="54" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="54" height="54" fill="transparent"/><path d="M-8 42 C14 24 19 12 46 -2 M5 57 C22 37 38 34 62 10" stroke={c} strokeWidth="5" opacity=".75" fill="none"/><path d="M3 8 C22 23 31 7 51 26" stroke={s} strokeWidth="2" opacity=".35" fill="none"/></pattern>;
    case "camo": return <pattern id={id} width="58" height="46" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="camo" data-camo-shapes="small-layered-organic-patches-three-tones-less-repetition"><rect width="58" height="46" fill="transparent"/><path d="M-6 7 C-1 1 7 2 9 7 C15 3 22 6 21 13 C20 20 11 19 8 16 C5 21 -4 19 -5 13 C-9 12 -10 9 -6 7Z" fill={c} opacity=".72"/><path d="M28 -3 C34 -1 37 4 34 9 C42 8 49 12 48 19 C46 26 37 26 34 22 C30 27 22 24 23 17 C24 12 30 12 31 8 C26 6 24 0 28 -3Z" fill={s} opacity=".62"/><path d="M9 28 C14 23 22 25 22 31 C29 29 35 33 34 39 C32 46 23 46 20 41 C16 46 8 43 9 36 C4 35 5 31 9 28Z" fill={accent} opacity=".36"/><path d="M39 29 C44 23 53 25 54 31 C61 32 62 38 57 43 C51 48 44 44 42 40 C38 45 32 42 33 36 C30 33 35 30 39 29Z" fill={c} opacity=".58"/><path d="M18 13 C23 10 29 12 29 17 C34 18 35 23 30 26 C25 29 20 26 19 22 C14 24 10 20 12 16 C13 15 15 14 18 13Z" fill={accent} opacity=".4"/><path d="M45 5 C50 3 56 7 55 12 C61 14 60 20 55 22 C50 24 46 21 45 17 C40 18 37 14 39 9 C40 7 42 6 45 5Z" fill={s} opacity=".5"/></pattern>;
    case "houndstooth": return <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="houndstooth" data-houndstooth-shapes="broken-check-tooth-diagonal-extensions"><rect width="48" height="48" fill={s} opacity=".16"/><path d="M0 0 H20 L24 6 L31 0 H48 V12 L39 21 L48 24 V48 H28 L24 42 L17 48 H0 V36 L9 27 L0 24 Z" fill={c}/><path d="M24 0 H48 V20 L42 24 L48 31 V48 H36 L27 39 L24 48 H0 V28 L6 24 L0 17 V0 H12 L21 9 Z" fill={s} opacity=".9"/><path d="M0 0 H12 L24 12 V24 H6 L0 18 Z M48 48 H36 L24 36 V24 H42 L48 30 Z" fill={c}/><path d="M24 6 L31 0 H39 L30 12 Z M39 21 L48 24 V31 L36 27 Z M24 42 L17 48 H9 L18 36 Z M9 27 L0 24 V17 L12 21 Z" fill={c} opacity=".96"/></pattern>;
    case "leopard": return <pattern id={id} width="72" height="58" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="leopard" data-animal-print="irregular-rosette-open-centers"><rect width="72" height="58" fill="transparent"/><path d="M9 9 C15 3 28 7 29 17 C25 13 17 13 13 18 C7 18 5 13 9 9Z M34 34 C41 27 54 31 56 41 C51 37 43 37 39 43 C32 43 29 38 34 34Z M50 6 C57 2 66 7 65 15 C61 12 55 13 53 18 C47 17 45 10 50 6Z" fill={s} opacity=".92"/><path d="M17 16 C19 14 23 15 24 18 C22 21 17 22 14 19 C14 18 15 17 17 16Z M42 40 C45 37 51 39 52 43 C49 47 42 47 39 43 C40 42 41 41 42 40Z M55 15 C57 12 62 13 63 16 C60 19 55 20 52 17 C53 16 54 15 55 15Z" fill={c} opacity=".5"/><path d="M4 42 C8 38 15 39 17 45 C14 50 6 50 3 45 Z M62 29 C66 26 71 29 70 34 C67 38 61 37 59 32 Z" fill={s} opacity=".82"/></pattern>;
    case "cheetah": return <pattern id={id} width="54" height="48" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="cheetah" data-animal-print="small-solid-irregular-scattered-spots"><rect width="54" height="48" fill="transparent"/><path d="M8 7 C12 4 17 6 17 11 C15 15 9 15 6 11 C6 9 7 8 8 7Z M31 5 C35 3 40 6 39 10 C37 14 31 14 29 10 C29 8 30 6 31 5Z M44 24 C49 21 54 25 52 30 C49 34 43 32 41 28 C41 26 42 25 44 24Z M17 29 C22 27 27 31 25 36 C22 40 15 38 14 33 C14 31 15 30 17 29Z M4 40 C8 37 13 40 12 44 C9 48 3 46 2 42 C2 41 3 40 4 40Z M35 39 C39 36 45 39 44 44 C41 48 34 47 32 42 C33 41 34 40 35 39Z" fill={s} opacity=".9"/><path d="M23 18 C26 16 30 18 29 22 C27 25 22 24 21 20 Z M49 7 C52 5 56 8 54 12 C51 14 47 12 47 9 Z" fill={c} opacity=".68"/></pattern>;
    case "zebra": return <pattern id={id} width="78" height="70" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, -8)} data-pattern="zebra" data-animal-print="flowing-organic-stripe-bands"><rect width="78" height="70" fill="transparent"/><path d="M-8 8 C10 0 24 4 38 -4 C33 11 18 13 5 22 C-2 27 -8 23 -8 8Z M30 8 C45 2 62 5 84 -5 C75 12 61 19 45 21 C36 22 31 17 30 8Z M-6 37 C11 25 26 28 41 18 C38 35 24 43 7 49 C0 51 -5 47 -6 37Z M42 35 C56 27 69 30 84 20 C79 38 64 48 48 50 C41 50 38 41 42 35Z M6 67 C20 52 38 55 54 45 C51 62 34 72 16 77 C10 78 6 74 6 67Z" fill={s} opacity=".9"/><path d="M15 0 C11 13 4 20 -7 27 M63 0 C55 18 43 29 30 35 M76 51 C64 60 54 68 45 77" stroke={c} strokeWidth="3" opacity=".28" fill="none"/></pattern>;
    case "cow-print": return <pattern id={id} width="90" height="76" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="cow-print" data-animal-print="large-irregular-organic-patches-negative-space"><rect width="90" height="76" fill="transparent"/><path d="M4 8 C14 -3 33 1 36 15 C40 29 26 40 12 35 C1 31 -4 17 4 8Z M54 3 C68 -5 88 5 86 21 C84 36 65 39 56 28 C47 18 46 8 54 3Z M20 51 C31 43 49 48 51 62 C53 76 35 82 23 73 C14 66 12 57 20 51Z M68 47 C80 43 94 52 91 65 C88 77 72 79 64 69 C58 61 60 51 68 47Z" fill={s} opacity=".9"/><path d="M37 34 C44 29 55 33 56 42 C53 50 41 52 35 45 C32 41 33 37 37 34Z" fill={c} opacity=".35"/></pattern>;
    case "snake-print": return <pattern id={id} width="44" height="50" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="snake-print" data-animal-print="scale-like-repeating-organic-diamond-texture"><rect width="44" height="50" fill="transparent"/><path d="M22 1 C31 8 37 16 36 25 C35 34 28 42 22 49 C15 42 8 34 8 25 C8 16 14 8 22 1Z M0 1 C9 8 15 16 14 25 C13 34 6 42 0 49 M44 1 C35 8 29 16 30 25 C31 34 38 42 44 49" fill="none" stroke={s} strokeWidth="2.4" opacity=".75"/><path d="M22 8 C27 13 31 19 30 25 C30 31 26 36 22 42 C18 36 14 31 14 25 C13 19 17 13 22 8Z" fill={c} opacity=".3"/><path d="M11 25 H33 M18 14 L26 14 M17 36 L27 36" stroke={s} strokeWidth="1" opacity=".35"/></pattern>;
    case "tiger-stripe": return <pattern id={id} width="74" height="62" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, 8)} data-pattern="tiger-stripe" data-animal-print="sharp-organic-stripe-marks-uneven-spacing"><rect width="74" height="62" fill="transparent"/><path d="M-6 4 C14 8 24 14 31 26 C18 23 7 19 -5 16 Z M50 -3 C48 13 40 24 26 32 C28 18 36 7 50 -3Z M78 10 C59 16 47 25 39 38 C54 36 67 30 80 22 Z M3 39 C18 38 31 43 42 56 C27 57 13 54 -1 49 Z M70 44 C55 42 45 47 35 64 C50 62 62 57 75 52 Z" fill={s} opacity=".9"/><path d="M24 0 C20 8 15 13 6 18 M62 21 C55 26 50 33 45 43 M14 61 C20 55 26 52 35 51" stroke={c} strokeWidth="3" opacity=".24" fill="none"/></pattern>;
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
