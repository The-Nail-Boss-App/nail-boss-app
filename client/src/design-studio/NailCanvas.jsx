import { useMemo, useRef, useState } from "react";
import { COLORS } from "../styles.js";
import { renderAssetShapes } from "./assets.js";
import { VIEWBOX, buildNailPath, constrainStrokePoints, getNailArchitecture, getNailGeometry, normalizedToSvg, projectPointInsideNailSilhouette, svgToNormalized, layerSort, normalizeGradientStops } from "./blueprint.js";
import { AssetContactShadow, AssetSpecularAccent, AssetSurfaceBlend, assetLayerRenderProps } from "./assetRendering.js";
import { FrenchTipShape } from "./frenchTipRendering.js";
import { PolishDefs, PolishSurface, SharedPolishRealismLayers } from "./PolishRenderer.jsx";
import { polishMaterialProfile, polishSurfacePreset, resolvePolishDataForRender } from "./polish.js";
import { HeroEngineRegistry, HERO_SURFACE_VIEWPORT, createHeroSurfaceInput, heroDocumentFromLegacyNail, registerHeroSurfaceRenderingEngine } from "../hero-design";

const heroSurfaceRegistry = new HeroEngineRegistry();
const heroSurfaceRenderer = registerHeroSurfaceRenderingEngine(heroSurfaceRegistry);

function gradientPoints(direction = "vertical", angle = 90) {
  if (direction === "aura") return null;
  const presets = {
    vertical: 90,
    "reverse-vertical": 270,
    horizontal: 0,
    diagonal: 45,
    "reverse-diagonal": 135,
  };
  const degrees = Number.isFinite(Number(angle)) && !Object.hasOwn(presets, direction) ? Number(angle) : (presets[direction] ?? 90);
  const radians = (degrees * Math.PI) / 180;
  const x = Math.cos(radians) * 0.5;
  const y = Math.sin(radians) * 0.5;
  return { x1: (0.5 - x).toFixed(3), y1: (0.5 - y).toFixed(3), x2: (0.5 + x).toFixed(3), y2: (0.5 + y).toFixed(3) };
}

function gradientStops(layer) {
  const data = layer.data || {};
  const softness = Math.max(0, Math.min(1, Number.isFinite(Number(data.softness)) ? Number(data.softness) : 0.62));
  const stops = normalizeGradientStops(data);
  return { stops, softness };
}

const MATERIAL_QA_PRESETS = ["Cream", "Jelly", "Matte", "Glass", "Chrome-ready"];

function MaterialQAStrip({ nail }) {
  if (!import.meta.env.DEV) return null;
  const qaNail = { ...nail, shape: nail?.shape || "Almond", length: nail?.length || 0.64, width: nail?.width || 0.5 };
  const qaPath = buildNailPath(qaNail);
  return (
    <div data-testid="renderer-material-qa-strip" data-renderer-version="nail-surface-v2" style={{ position: "absolute", right: 12, bottom: 46, display: "flex", gap: 8, padding: "8px 10px", border: "1px solid rgba(123,47,89,.16)", borderRadius: 14, background: "rgba(255,255,255,.86)", boxShadow: "0 12px 28px rgba(60,20,50,.10)", pointerEvents: "none", zIndex: 2 }}>
      {MATERIAL_QA_PRESETS.map((preset) => {
        const uid = `material-qa-${preset.toLowerCase()}`;
        const clipId = `${uid}-clip`;
        const baseLayer = { id: uid, type: "base", data: { colorHex: preset === "Matte" ? "#252025" : preset === "Glass" ? "#A41432" : preset === "Chrome-ready" ? "#C68AD5" : "#E8A0BF", polishType: preset, materialPreset: preset, shine: preset === "Matte" ? 0.08 : 0.82, transparency: preset === "Jelly" ? 0.5 : 0 } };
        return (
          <figure key={preset} data-material-preset={preset.toLowerCase()} style={{ margin: 0, width: 44, textAlign: "center", color: COLORS.plum, fontSize: 9, fontWeight: 700, letterSpacing: ".02em" }}>
            <svg viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="44" height="66" aria-label={`${preset} renderer QA swatch`}>
              <defs>
                <clipPath id={clipId}><path d={qaPath}/></clipPath>
                <PolishDefs uid={uid}/>
              </defs>
              <PolishSurface nail={qaNail} baseLayer={baseLayer} path={qaPath} clipId={clipId} uid={uid}/>
            </svg>
            <figcaption>{preset}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function renderGradientStops(stops, aura = false) {
  return stops.map((stop, index) => {
    const offset = `${Math.round(stop.position)}%`;
    const middleAura = aura && index > 0 && index < stops.length - 1;
    return <stop key={`${stop.color}-${offset}-${index}`} offset={offset} stopColor={stop.color} stopOpacity={middleAura ? ".82" : undefined}/>;
  });
}

export function LayerGradient({ layer, id }) {
  const direction = layer.data?.direction || "vertical";
  const { stops } = gradientStops(layer);
  if (direction === "aura") {
    return <radialGradient id={id} cx="50%" cy="42%" r="64%" data-gradient-mode="center-glow-aura-blend" data-gradient-stop-count={stops.length}>
      {renderGradientStops(stops, true)}
    </radialGradient>;
  }
  const points = gradientPoints(direction, layer.data?.angle);
  return <linearGradient id={id} {...points} data-gradient-softness="diffused-salon-ombre" data-gradient-stop-count={stops.length}>
    {renderGradientStops(stops)}
  </linearGradient>;
}

export function GradientLayerShape({ layer, nail, baseLayer, path, clipId, uid, thumbnail = false }) {
  const id = `${uid}-${layer.id}-ombre`;
  const art = artMaterialProfile(baseLayer, nail);
  const softness = Math.max(0, Math.min(1, Number(layer.data?.softness ?? 0.62)));
  const filterId = `${id}-diffusion`;
  const materialOpacity = (layer.opacity ?? 0.45) * art.artOpacity;
  return <g key={layer.id} clipPath={`url(#${clipId})`} opacity={materialOpacity} pointerEvents="none" data-layer-type="gradient" style={{ mixBlendMode: layer.data?.blendMode || "multiply" }} data-gradient-renderer="shared-active-thumbnail-salon-ombre" data-gradient-direction={layer.data?.direction || "vertical"} data-gradient-material={art.polishType} data-gradient-blend="polish-preserving-default" data-gradient-opacity={materialOpacity.toFixed(2)}>
    <defs><LayerGradient layer={layer} id={id}/><filter id={filterId} x="-18%" y="-18%" width="136%" height="136%"><feGaussianBlur stdDeviation={(0.6 + softness * (thumbnail ? 2.6 : 3.8)).toFixed(2)}/></filter></defs>
    <rect data-realism-layer="soft-diffusion-blur-clipped-gradient-fill" x="-4" y="-4" width={VIEWBOX.width + 8} height={VIEWBOX.height + 8} fill={`url(#${id})`} filter={`url(#${filterId})`}/>
    {art.polishType === "Jelly" && <rect data-realism-layer="jelly-translucent-glassy-gradient-blend" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${id})`} opacity=".38" style={{ mixBlendMode: "multiply" }}/>}
    {art.polishType === "Milky" && <><rect data-realism-layer="milky-cloudy-ombre-veil" width={VIEWBOX.width} height={VIEWBOX.height} fill="#fff8fb" opacity=".18"/><ellipse cx="120" cy="145" rx="74" ry="118" fill="#fff" opacity=".12" filter={`url(#${filterId})`}/></>}
    {art.polishType === "Matte" && <rect data-realism-layer="matte-low-shine-satin-gradient-blend" width={VIEWBOX.width} height={VIEWBOX.height} fill="#2b1024" opacity=".035"/>}
    <path data-realism-layer="gradient-edge-depth-and-nail-curvature" d={path} fill="none" stroke="#fff" strokeOpacity={art.polishType === "Matte" ? .08 : .18} strokeWidth="1.2"/>
    <SharedPolishRealismLayers nail={nail} path={path} clipId={clipId} uid={uid} shine={art.shine} colorHex={normalizeGradientStops(layer.data || {}).at(-1)?.color || art.colorHex} polishType={art.polishType} materialScope="gradient-ombre"/>
  </g>;
}


const NAIL_BASELINE_SCALE = 1.65;
const HERO_SAFE_CONTAINED_ZOOM = 1.55;
const HERO_MAX_ZOOM = 2.4;
const HERO_CANVAS_SAFE_PADDING = "clamp(8px, 1.2vh, 14px) clamp(10px, 1.2vw, 16px)";
const HERO_CANVAS_VERTICAL_SAFE_GAP = 0;
const HERO_BASE_HEIGHT_VH = 72;
const HERO_MAX_HEIGHT_VH = 94;

export function heroZoomFit(zoom = 1) {
  const requestedZoom = Math.max(0.25, Number(zoom) || 1);
  const visualZoom = Math.min(requestedZoom, HERO_MAX_ZOOM);
  const heightVh = `${Math.min(HERO_BASE_HEIGHT_VH * visualZoom, HERO_MAX_HEIGHT_VH).toFixed(2)}vh`;
  const panEnabled = visualZoom > HERO_SAFE_CONTAINED_ZOOM;

  // The zoom label remains tied to requestedZoom in DesignStudio; high zoom remains
  // visible by growing the stage and enabling internal Hero Canvas pan before capping.
  return {
    requestedZoom: requestedZoom.toFixed(2),
    visualZoom: visualZoom.toFixed(2),
    capped: visualZoom < requestedZoom,
    panEnabled,
    heightVh,
    baselineScale: NAIL_BASELINE_SCALE,
  };
}

// Material blending keeps legacy guards: data.polishType === "Jelly" ? 0.82, data.polishType === "Milky" ? 0.88, data.polishType === "Matte" ? 0.76.
export function artMaterialProfile(baseLayer, nail) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const surfacePreset = polishSurfacePreset(data);
  const material = polishMaterialProfile(surfacePreset, data.shine);
  const artOpacity = data.polishType === "Jelly" ? 0.82 : data.polishType === "Milky" ? 0.88 : surfacePreset === "Matte" ? 0.76 : 1;
  const edgeSoftness = data.polishType === "Milky" ? 0.7 : surfacePreset === "Matte" ? 0.45 : data.polishType === "Jelly" ? 0.35 : surfacePreset === "Glitter" ? 0.18 : 0;
  const surfaceHighlight = surfacePreset === "Matte" ? 0.05 : data.polishType === "Jelly" ? 0.2 : data.polishType === "Milky" ? 0.1 : surfacePreset === "Chrome" ? 0.24 : 0.14;
  return { ...data, polishType: surfacePreset, material, artOpacity, edgeSoftness, surfaceHighlight };
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
  const spacing = Number.isFinite(layer.data?.density) ? 1.6 - layer.data.density : 1;
  const scaleX = (Number.isFinite(transform.scaleX) ? Math.max(0.2, transform.scaleX) : 1) * spacing;
  const scaleY = (Number.isFinite(transform.scaleY) ? Math.max(0.2, transform.scaleY) : 1) * spacing;
  const rotation = (Number.isFinite(transform.rotation) ? transform.rotation : 0) + baseRotation;
  return `translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${rotation.toFixed(3)} ${VIEWBOX.cx} ${VIEWBOX.height / 2}) scale(${scaleX.toFixed(3)} ${scaleY.toFixed(3)})`;
}

export function patternColorSlots(pattern) {
  if (pattern === "camo") {
    return [
      { key: "colorHex", label: "Pattern color", fallback: "#6B7F4E" },
      { key: "secondaryColorHex", label: "Pattern Color 2", fallback: "#3B1F35" },
      { key: "patternColorHex3", label: "Pattern Color 3", fallback: "#A78B5F" },
      { key: "patternColorHex4", label: "Pattern Color 4", fallback: "#2F3A24" },
    ];
  }
  return [
    { key: "colorHex", label: "Pattern color", fallback: "#FFFFFF" },
    { key: "secondaryColorHex", label: "Secondary color", fallback: "#3B1F35" },
  ];
}

export function resolvePatternColors(data = {}) {
  const slots = patternColorSlots(data.pattern);
  return slots.reduce((colors, slot) => ({ ...colors, [slot.key]: data[slot.key] || slot.fallback }), {});
}

export function PatternDefs({ layer, id }) {
  const colors = resolvePatternColors(layer.data || {});
  const c = colors.colorHex;
  const s = colors.secondaryColorHex;
  const accent = colors.patternColorHex3 || s;
  const deep = colors.patternColorHex4 || s;
  switch (layer.data.pattern) {
    case "stripes": return <pattern id={id} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, 35)}><rect width="18" height="18" fill="transparent"/><rect width="7" height="18" fill={c}/></pattern>;
    case "checker": return <pattern id={id} width="24" height="24" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="24" height="24" fill="transparent"/><rect width="12" height="12" fill={c}/><rect x="12" y="12" width="12" height="12" fill={c}/><rect x="12" width="12" height="12" fill={s} opacity=".25"/><rect y="12" width="12" height="12" fill={s} opacity=".25"/></pattern>;
    case "french-tip": return <pattern id={id} width="240" height="360" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)}><rect width="240" height="360" fill="transparent"/><path d="M54 255 Q120 305 186 255 L186 360 L54 360 Z" fill={c}/></pattern>;
    case "glitter": return <pattern id={id} width="47" height="43" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="glitter" data-pattern-quality="artist-calibrated-fine-scattered-flecks-dots-crosses-sparkle-points"><rect width="47" height="43" fill="transparent"/><circle cx="5" cy="9" r="1.15" fill={c} opacity=".88"/><circle cx="18" cy="6" r=".65" fill={s} opacity=".72"/><circle cx="36" cy="13" r="1.35" fill={c} opacity=".82"/><circle cx="27" cy="31" r=".9" fill={c} opacity=".8"/><circle cx="10" cy="35" r=".55" fill={s} opacity=".68"/><path d="M23 16 h4 M25 14 v4 M42 27 h3 M43.5 25.5 v3 M14 22 h2.8 M15.4 20.6 v2.8" stroke={c} strokeWidth=".8" strokeLinecap="round" opacity=".76"/><path d="M31 3 l1 2.4 2.5 .9 -2.5 .9 -1 2.4 -1-2.4 -2.5-.9 2.5-.9Z M4 24 l.8 1.9 2 .7 -2 .8 -.8 1.9 -.8-1.9 -2-.8 2-.7Z" fill={c} opacity=".7"/><path d="M39 38 l.55 1.3 1.35 .5 -1.35 .45 -.55 1.35 -.55-1.35 -1.35-.45 1.35-.5Z" fill={s} opacity=".6"/></pattern>;
    case "marble": return <pattern id={id} width="92" height="74" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="marble" data-pattern-quality="artist-calibrated-soft-flowing-veins-varied-thickness-opacity"><rect width="92" height="74" fill="transparent"/><path d="M-12 55 C8 38 22 43 34 26 C45 10 63 16 79 -7" stroke={c} strokeWidth="4.4" strokeLinecap="round" opacity=".38" fill="none"/><path d="M-8 61 C13 45 25 50 38 31 C49 15 66 21 85 -2" stroke={c} strokeWidth="1.45" strokeLinecap="round" opacity=".72" fill="none"/><path d="M9 -5 C22 13 18 24 35 34 C50 43 60 53 57 81" stroke={s} strokeWidth="2.2" strokeLinecap="round" opacity=".34" fill="none"/><path d="M25 4 C31 13 42 12 49 23 C55 33 69 31 82 45" stroke={c} strokeWidth=".9" strokeLinecap="round" opacity=".55" fill="none"/><path d="M5 22 C17 27 26 21 36 15 M52 58 C63 50 72 56 88 47" stroke={s} strokeWidth="1.1" strokeLinecap="round" opacity=".28" fill="none"/></pattern>;
    case "camo": return <pattern id={id} width="86" height="64" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="camo" data-camo-shapes="artist-calibrated-flatter-overlapping-irregular-patches-varied-scale-asymmetric"><rect width="86" height="64" fill="transparent"/><path d="M-7 10 C3 2 20 3 28 11 C22 18 10 17 5 25 C-4 24 -13 18 -7 10Z" fill={c} opacity=".72"/><path d="M35 -4 C47 0 59 1 66 10 C60 19 47 16 42 25 C32 24 26 14 30 5 C31 1 33 -2 35 -4Z" fill={s} opacity=".64"/><path d="M12 35 C24 28 39 32 46 41 C38 50 25 49 17 57 C6 54 2 43 12 35Z" fill={accent} opacity=".34"/><path d="M55 29 C68 22 83 28 89 39 C82 50 66 47 58 57 C48 52 47 37 55 29Z" fill={c} opacity=".58"/><path d="M24 18 C36 13 49 17 54 25 C47 32 33 32 27 40 C18 36 17 24 24 18Z" fill={accent} opacity=".42"/><path d="M62 5 C72 5 82 12 81 22 C72 27 62 23 57 31 C50 25 53 11 62 5Z" fill={deep} opacity=".5"/></pattern>;
    case "houndstooth": return <pattern id={id} width="52" height="52" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="houndstooth" data-houndstooth-shapes="artist-calibrated-broken-check-strong-diagonal-tooth-extensions-low-checkerboard"><rect width="52" height="52" fill={s} opacity=".12"/><path d="M0 0 H18 L28 12 L38 0 H52 V14 L40 26 L52 33 V52 H32 L24 42 L12 52 H0 V38 L13 26 L0 19 Z" fill={c}/><path d="M26 0 H52 V22 L44 26 L52 36 V52 H39 L28 39 L23 52 H0 V31 L8 26 L0 14 V0 H14 L25 11 Z" fill={s} opacity=".86"/><path d="M0 0 H11 L27 16 V27 H5 L0 21 Z M52 52 H41 L25 36 V25 H47 L52 31 Z" fill={c}/><path d="M27 6 L38 0 H49 L34 17 Z M40 26 L52 33 V43 L34 33 Z M24 42 L12 52 H1 L18 35 Z M13 26 L0 19 V8 L18 20 Z" fill={c} opacity=".98"/></pattern>;
    case "leopard": return <pattern id={id} width="78" height="62" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="leopard" data-animal-print="artist-calibrated-open-broken-irregular-rosettes-varied-size-rotation-accent-dots"><rect width="78" height="62" fill="transparent"/><path d="M8 9 C14 2 27 4 31 13 M31 18 C25 26 12 25 7 17 M38 35 C46 27 61 30 64 40 M58 49 C49 55 36 50 34 41 M53 7 C61 2 72 6 73 15 M67 22 C59 26 50 21 50 13 M8 45 C13 38 24 40 26 48 M20 56 C12 59 4 53 5 47" stroke={s} strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" opacity=".92" fill="none"/><path d="M16 15 C19 12 24 14 25 18 C22 21 17 21 14 18 Z M45 41 C49 37 55 39 56 44 C52 48 45 48 42 44 Z M58 15 C60 12 66 13 67 17 C64 20 58 20 55 17 Z" fill={c} opacity=".42"/><circle cx="4" cy="31" r="1.4" fill={s} opacity=".82"/><circle cx="30" cy="5" r="1.1" fill={s} opacity=".72"/><circle cx="70" cy="35" r="1.6" fill={s} opacity=".8"/><circle cx="40" cy="58" r="1" fill={s} opacity=".68"/></pattern>;
    case "cheetah": return <pattern id={id} width="62" height="52" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="cheetah" data-animal-print="artist-calibrated-random-small-solid-irregular-spots-varied-scale-spacing"><rect width="62" height="52" fill="transparent"/><path d="M7 6 C11 3 17 5 16 10 C14 14 8 14 5 10 C5 8 6 7 7 6Z M35 4 C40 2 45 6 43 11 C40 15 33 13 32 8 C32 6 33 5 35 4Z M52 18 C57 15 63 19 61 25 C58 30 50 27 49 22 C49 20 50 19 52 18Z M18 31 C24 28 31 33 28 39 C24 44 16 40 15 35 C15 33 16 32 18 31Z M3 43 C6 40 11 42 11 46 C9 50 3 49 1 45 C1 44 2 43 3 43Z M43 40 C48 36 56 40 54 47 C50 52 41 49 40 43 C41 42 42 41 43 40Z M25 15 C28 13 33 15 32 20 C29 23 24 22 23 18 Z M55 3 C59 1 64 5 62 9 C59 12 54 10 53 6 Z M10 22 C13 20 17 22 16 26 C14 29 9 28 8 24 Z" fill={s} opacity=".9"/></pattern>;
    case "zebra": return <pattern id={id} width="88" height="76" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, -8)} data-pattern="zebra" data-animal-print="artist-calibrated-long-thin-flowing-organic-zebra-bands-natural-spacing"><rect width="88" height="76" fill="transparent"/><path d="M-12 9 C10 -3 28 5 48 -6 C41 7 26 13 8 25 C0 30 -8 26 -12 9Z M31 4 C49 -3 68 2 96 -8 C83 9 64 17 43 22 C35 24 30 15 31 4Z M-10 39 C13 24 32 30 53 17 C47 31 30 42 8 53 C1 56 -7 50 -10 39Z M45 37 C63 27 78 31 96 19 C91 36 72 50 52 55 C43 57 39 45 45 37Z M5 74 C24 55 45 60 68 45 C62 62 42 76 17 84 C9 86 5 82 5 74Z" fill={s} opacity=".9"/><path d="M17 -2 C10 15 0 25 -13 34 M72 0 C60 19 45 31 27 39 M86 54 C71 64 59 74 48 84" stroke={c} strokeWidth="2.1" opacity=".24" fill="none" strokeLinecap="round"/></pattern>;
    case "cow-print": return <pattern id={id} width="104" height="86" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="cow-print" data-animal-print="artist-calibrated-fewer-large-angular-irregular-patches-strong-negative-space"><rect width="104" height="86" fill="transparent"/><path d="M-3 11 C10 -4 36 1 42 18 C39 36 17 42 4 32 C-5 25 -9 18 -3 11Z M67 2 C84 -6 105 8 102 27 C96 43 75 41 65 29 C55 17 56 7 67 2Z M23 56 C38 45 61 52 64 68 C58 84 34 91 20 76 C13 68 14 61 23 56Z" fill={s} opacity=".9"/><path d="M80 58 C91 52 107 60 105 74 C99 85 84 87 76 77 C70 69 72 61 80 58Z" fill={s} opacity=".78"/></pattern>;
    case "snake-print": return <pattern id={id} width="36" height="42" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer)} data-pattern="snake-print" data-animal-print="artist-calibrated-tight-staggered-organic-scale-diamond-texture"><rect width="36" height="42" fill="transparent"/><path d="M18 1 C25 7 30 14 29 21 C28 29 23 35 18 41 C13 35 7 29 7 21 C6 14 11 7 18 1Z M0 1 C7 7 12 14 11 21 C10 29 5 35 0 41 M36 1 C29 7 24 14 25 21 C26 29 31 35 36 41" fill="none" stroke={s} strokeWidth="2" opacity=".78"/><path d="M18 7 C22 12 25 16 24 21 C24 27 21 31 18 36 C15 31 12 27 12 21 C11 16 14 12 18 7Z" fill={c} opacity=".28"/><path d="M9 21 H27 M15 12 L21 12 M14 31 L22 31" stroke={s} strokeWidth=".9" opacity=".38"/></pattern>;
    case "tiger-stripe": return <pattern id={id} width="78" height="64" patternUnits="userSpaceOnUse" patternTransform={patternTransform(layer, 8)} data-pattern="tiger-stripe" data-animal-print="artist-calibrated-fewer-bold-sharp-thick-claw-tapered-stripes-uneven-direction"><rect width="78" height="64" fill="transparent"/><path d="M-8 4 C15 8 29 16 39 32 C23 29 8 23 -8 15 Z M52 -5 C52 13 43 26 25 37 C27 20 36 6 52 -5Z M84 9 C62 17 49 28 39 45 C57 42 72 34 86 22 Z M1 43 C20 39 36 47 50 63 C31 65 13 58 -4 52 Z M72 40 C55 41 44 49 34 70 C51 67 65 58 80 49 Z" fill={s} opacity=".94"/><path d="M21 1 C17 12 11 18 0 24 M64 19 C55 27 49 36 43 49 M15 63 C23 55 31 51 42 50" stroke={c} strokeWidth="4.2" opacity=".22" fill="none" strokeLinecap="round"/></pattern>;
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

export default function NailCanvas({ nail, layers, selectedLayerId, mode, brush, notice, debugOverlay = false, zoom = 1, onSelectLayer, onTransformLayer, onDrawingStroke, onStageEraseStroke, onEraseStroke }) {
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const [cursorPoint, setCursorPoint] = useState(null);
  const dragRef = useRef(null);
  const clipId = useMemo(() => `nail-clip-${Math.random().toString(36).slice(2)}`, []);
  const uid = useMemo(() => `defs-${Math.random().toString(36).slice(2)}`, []);
  const legacyPath = buildNailPath(nail.shape, nail);
  const heroSurface = useMemo(() => {
    try {
      const document = heroDocumentFromLegacyNail(nail, { id: nail.id || "active-studio-nail", name: "Active Studio Nail", revision: nail.revision || 0 });
      return { result: heroSurfaceRenderer.process(createHeroSurfaceInput(document, HERO_SURFACE_VIEWPORT)), fallback: false };
    } catch {
      // The established renderer remains intact as a last-resort, never-blank canvas path.
      return { result: { path: legacyPath, fill: "#F4E8E4" }, fallback: true };
    }
  }, [nail.id, nail.revision, nail.shape, nail.length, nail.width, legacyPath]);
  const path = heroSurface.result.path;
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
      return <GradientLayerShape key={layer.id} layer={layer} nail={nail} baseLayer={baseLayer} path={path} clipId={clipId} uid={uid}/>;
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
      </g>
      <AssetSpecularAccent layer={layer} render={assetRender}/>
      {selected && <g data-realism-layer="selected-jewel-handles-visible-above-realism" pointerEvents="none"><rect x={p.x - size / 2} y={p.y - size / 2} width={size} height={size} rx="8" fill="none" stroke={COLORS.plum} strokeWidth="2" strokeDasharray="5 4"/><circle cx={p.x + size / 2} cy={p.y + size / 2} r="5" fill={COLORS.plum}/><path d={`M${p.x} ${p.y - size / 2 - 14} L${p.x} ${p.y - size / 2 - 2}`} stroke={COLORS.plum} strokeWidth="2"/><circle cx={p.x} cy={p.y - size / 2 - 18} r="5" fill="#fff" stroke={COLORS.plum} strokeWidth="2"/></g>}
    </g>;
  }

  const brushCursorRadius = Math.max(3, (brush?.size || 5) * 0.9);
  const brushCursorLength = Math.max(13, brushCursorRadius * 2.6);
  const brushCursorWidth = Math.max(3.5, brushCursorRadius * 0.72);
  const canvasCursor = mode === "draw" || mode === "eraser" ? "none" : "default";
  const fit = heroZoomFit(zoom);
  const activeSurfacePreset = polishSurfacePreset(resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex));

  return <div data-testid="bounded-hero-canvas-area" data-renderer-version="hero-surface-v1" data-hero-surface-state={heroSurfaceRenderer.state} data-hero-surface-fallback={heroSurface.fallback ? "legacy" : "none"} data-material-preset={activeSurfacePreset.toLowerCase()} data-zoom-containment-padding="dock-safe-expanded" data-default-nail-bottom-clip="prevented" style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: fit.panEnabled ? "auto" : "hidden", overscrollBehavior: "contain", boxSizing: "border-box", padding: HERO_CANVAS_SAFE_PADDING, background: "radial-gradient(ellipse at 50% 52%, rgba(255,255,255,.72) 0 20%, transparent 46%), radial-gradient(circle at 18% 14%, rgba(245,200,232,.22), transparent 30%), linear-gradient(118deg, transparent 0 16%, rgba(216,166,66,.24) 16.12%, transparent 16.5% 38%, rgba(216,166,66,.16) 38.14%, transparent 38.44% 64%, rgba(216,166,66,.18) 64.12%, transparent 64.5%), linear-gradient(135deg, #fffaf7, #fbf1ed 54%, #f7e8f1)" }}>
    <div aria-hidden="true" data-testid="studio-surface-texture" style={{ position: "absolute", inset: "8% 7% 10%", borderRadius: 32, background: "radial-gradient(circle at 18% 22%, rgba(255,255,255,.52), transparent 24%), radial-gradient(circle at 82% 78%, rgba(245,200,232,.18), transparent 28%), linear-gradient(125deg, rgba(255,255,255,.36), rgba(245,200,232,.16) 46%, rgba(199,154,93,.08))", border: "1px solid rgba(123,47,89,.10)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.72), 0 24px 70px rgba(60,20,50,.10)", pointerEvents: "none" }} />
    <div aria-hidden="true" style={{ position: "absolute", width: "min(360px, 54%)", height: 34, bottom: "13%", left: "50%", transform: "translateX(-50%)", borderRadius: "50%", background: "radial-gradient(ellipse, rgba(60,20,50,.18), rgba(123,47,89,.08) 42%, transparent 70%)", filter: "blur(3px)", pointerEvents: "none" }} />
    <div data-testid="zoomable-nail-canvas" data-zoom-containment={fit.panEnabled ? "internal-pan-at-high-zoom" : "bounded-fit-to-container"} data-zoom-fit-helper="heroZoomFit" data-zoom-requested={fit.requestedZoom} data-zoom-visual={fit.visualZoom} data-zoom-capped={fit.capped ? "true" : "false"} data-zoom-pan-enabled={fit.panEnabled ? "true" : "false"} data-baseline-scale="165-as-100" data-safe-contained-zoom={HERO_SAFE_CONTAINED_ZOOM} data-max-contained-zoom={HERO_MAX_ZOOM} style={{ height: fit.panEnabled ? fit.heightVh : `calc(100% - ${HERO_CANVAS_VERTICAL_SAFE_GAP}px)`, width: fit.panEnabled ? "auto" : "100%", maxHeight: fit.panEnabled ? "none" : "100%", maxWidth: fit.panEnabled ? "none" : "min(96%, 560px)", aspectRatio: "2 / 3", transition: "height 160ms ease", flex: "0 1 auto", marginTop: "0", marginBottom: "0", position: "relative", zIndex: 1, filter: "drop-shadow(0 18px 18px rgba(60,20,50,.14))", boxSizing: "border-box" }}>
      <svg ref={svgRef} viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`} width="100%" height="100%" role="img" aria-label="Editable single nail canvas" onPointerDown={canvasDown} onPointerMove={(e) => { pointerMove(e); canvasMove(e); }} onPointerUp={finishPointerGesture} onPointerCancel={cancelPointerGesture} onPointerLeave={() => setCursorPoint(null)} style={{ touchAction: "none", userSelect: "none", cursor: canvasCursor }}>
        <defs>
          <clipPath id={clipId}><path d={path}/></clipPath>
          <filter id={`${uid}-soft`}><feGaussianBlur stdDeviation="1.2"/></filter>
          <ArtRealismDefs uid={uid}/>
          <filter id={`${uid}-asset-shadow-blur`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="2.4"/></filter>
          <PolishDefs nail={nail} baseLayer={baseLayer} uid={uid}/>
        </defs>
        <rect width={VIEWBOX.width} height={VIEWBOX.height} fill="transparent"/>
        <path d={path} fill={heroSurface.result.fill} data-testid="hero-neutral-nail-surface" data-shape={nail.shape} data-mask={heroSurface.result.maskId || "legacy"}/>
        <PolishSurface nail={nail} baseLayer={baseLayer} path={path} clipId={clipId} uid={uid}/>
        {baseLayer?.data?.polishFillMode === "gradient" && <g clipPath={`url(#${clipId})`} pointerEvents="none" data-testid="gradient-polish-color-fill" data-gradient-mode="polish-base-fill">
          <defs><LayerGradient layer={{ id: "base-polish-gradient", data: baseLayer.data.gradient }} id={`${uid}-base-polish-gradient`}/></defs>
          <path d={path} fill={`url(#${uid}-base-polish-gradient)`} opacity=".82"/>
          <SharedPolishRealismLayers nail={nail} path={path} clipId={clipId} uid={uid} shine={baseLayer.data?.shine} colorHex={baseLayer.data?.colorHex} polishType={baseLayer.data?.polishType} materialScope="gradient-polish-color"/>
        </g>}
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
    <MaterialQAStrip nail={nail} />
    <p style={{ marginTop: 6, color: COLORS.textMuted, fontSize: 13 }}>{selectedLayerId ? "Drag selected artwork inside the strict nail boundary. Use Nail Art Controls™ for size and rotation." : "Choose Draw for a visible brush cursor, set nail color, or select a board layer."}</p>
    {notice && <div style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", background: COLORS.plum, color: "#fff", padding: "10px 14px", borderRadius: 999, fontSize: 12, boxShadow: "0 10px 30px rgba(60,20,50,.2)" }}>{notice}</div>}
  </div>;
}
