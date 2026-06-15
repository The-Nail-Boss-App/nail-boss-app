import { getNailArchitecture, VIEWBOX } from "./blueprint.js";
import { hasExplicitPolishType, polishOpacity, resolvePolishDataForRender } from "./polish.js";

export function PolishDefs({ nail, baseLayer, fallbackColor, uid }) {
  const resolvedFallbackColor = fallbackColor || nail?.baseColorHex || "#E8A0BF";
  const rawData = baseLayer?.data || {};
  const data = resolvePolishDataForRender(rawData, resolvedFallbackColor);
  const color = data.colorHex;
  const legacyEffectColor = data.effectColorHex || "#FFFFFF";
  const usesLegacyEffect = !hasExplicitPolishType(rawData);
  const legacyChromeColor = usesLegacyEffect && rawData.effect === "Chrome" ? legacyEffectColor : color;
  const legacyCatEyeColor = usesLegacyEffect && rawData.effect === "CatEye" ? legacyEffectColor : "#fff";
  const shine = data.topCoat === "Matte" || data.polishType === "Matte" ? 0 : data.shine;
  const chrome = data.polishType === "Chrome" ? data.chromeIntensity : 0;
  return <>
    <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.22 + shine * 0.28}/><stop offset="34%" stopColor={color}/><stop offset="72%" stopColor={color} stopOpacity=".9"/><stop offset="100%" stopColor="#2b1024" stopOpacity=".18"/></linearGradient>
    <radialGradient id={`${uid}-jelly`} cx="48%" cy="38%" r="72%"><stop offset="0%" stopColor="#fff" stopOpacity=".32"/><stop offset="42%" stopColor={color} stopOpacity=".72"/><stop offset="100%" stopColor={color} stopOpacity=".42"/></radialGradient>
    <radialGradient id={`${uid}-milky`} cx="52%" cy="36%" r="82%"><stop offset="0%" stopColor="#fff" stopOpacity=".62"/><stop offset="45%" stopColor={color} stopOpacity=".74"/><stop offset="100%" stopColor="#fff" stopOpacity=".38"/></radialGradient>
    <linearGradient id={`${uid}-chrome`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.55 + chrome * 0.38}/><stop offset="18%" stopColor={color}/><stop offset="38%" stopColor={legacyChromeColor} stopOpacity={0.18 + chrome * 0.5}/><stop offset="58%" stopColor="#fff" stopOpacity={0.4 + chrome * 0.45}/><stop offset="82%" stopColor={legacyChromeColor}/><stop offset="100%" stopColor="#111" stopOpacity={0.18 + chrome * 0.24}/></linearGradient>
    <linearGradient id={`${uid}-cat`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${data.catEyeAngle} .5 .5)`}><stop offset="0%" stopColor={color}/><stop offset="45%" stopColor={legacyCatEyeColor} stopOpacity={data.catEyeIntensity}/><stop offset="54%" stopColor={color}/><stop offset="100%" stopColor="#210e24" stopOpacity=".45"/></linearGradient>
    <linearGradient id={`${uid}-legacy-gradient`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={legacyEffectColor}/><stop offset="100%" stopColor={color}/></linearGradient>
    <linearGradient id={`${uid}-sidewall-shadow`} x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#160817" stopOpacity=".28"/><stop offset="18%" stopColor="#160817" stopOpacity=".11"/><stop offset="50%" stopColor="#160817" stopOpacity="0"/><stop offset="82%" stopColor="#160817" stopOpacity=".10"/><stop offset="100%" stopColor="#160817" stopOpacity=".26"/></linearGradient>
    <linearGradient id={`${uid}-free-edge-depth`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity=".13"/><stop offset="42%" stopColor="#fff" stopOpacity=".22"/><stop offset="100%" stopColor="#4a203e" stopOpacity=".18"/></linearGradient>
    <filter id={`${uid}-soft-edge`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.45"/></filter>
    <filter id={`${uid}-surface-blur`} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.1"/></filter>
    <pattern id={`${uid}-legacy-marble`} width="54" height="54" patternUnits="userSpaceOnUse"><rect width="54" height="54" fill="transparent"/><path d="M-8 42 C14 24 19 12 46 -2 M5 57 C22 37 38 34 62 10" stroke={legacyEffectColor} strokeWidth="5" opacity=".72" fill="none"/><path d="M3 8 C22 23 31 7 51 26" stroke="#fff" strokeWidth="2" opacity=".32" fill="none"/></pattern>
    <pattern id={`${uid}-glitter`} width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="transparent"/><circle cx="6" cy="7" r={1 + data.sparkleSize * 2.2} fill="#fff" opacity={0.35 + data.sparkleDensity * 0.55}/><circle cx="21" cy="17" r={0.8 + data.sparkleSize * 1.5} fill={color} opacity=".8"/><path d="M14 3 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4-1.8 4-1.8Z" fill="#fff" opacity={data.sparkleDensity}/></pattern>
  </>;
}

export function RealisticNailSurfaceRenderer({ nail, baseLayer, path, clipId, uid }) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const fillId = data.polishType === "Jelly" ? "jelly" : data.polishType === "Milky" ? "milky" : data.polishType === "Chrome" ? "chrome" : data.polishType === "Cat Eye" ? "cat" : data.polishType === "Gradient" ? "legacy-gradient" : "cream";
  const arch = getNailArchitecture(nail);
  const shine = data.topCoat === "Matte" || data.polishType === "Matte" ? 0 : data.shine;
  const apexLean = (arch.apex.x - arch.cx) * 0.15;
  const freeEdgeY = arch.topY + arch.height * arch.freeEdgeYNorm;
  const freeEdgeDepth = Math.max(10, arch.height * (0.055 + (nail?.freeEdgeThickness ?? 0.5) * 0.035));
  const sidewallOpacity = 0.12 + (nail?.sidewallCurve ?? 0.5) * 0.12;
  return <>
    <path d={path} fill={`url(#${uid}-${fillId})`} opacity={polishOpacity(data)}/>
    {data.polishType === "Glitter" && <g clipPath={`url(#${clipId})`}><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${uid}-glitter)`}/></g>}
    {data.polishType === "Marble" && <g clipPath={`url(#${clipId})`}><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${uid}-legacy-marble)`}/></g>}
    <g clipPath={`url(#${clipId})`} pointerEvents="none" data-realism-layer="surface-curvature">
      <rect data-realism-layer="sidewall-shadows" x={arch.left} y={arch.topY} width={arch.width} height={arch.height} fill={`url(#${uid}-sidewall-shadow)`} opacity={sidewallOpacity}/>
      <ellipse data-realism-layer="free-edge-depth" cx={arch.cx} cy={freeEdgeY + freeEdgeDepth * .42} rx={arch.width * .42} ry={freeEdgeDepth} fill={`url(#${uid}-free-edge-depth)`} opacity={0.48 + (nail?.freeEdgeThickness ?? 0.5) * 0.24}/>
      <ellipse data-realism-layer="apex-highlight" cx={arch.apex.x - arch.width * .14 + apexLean} cy={arch.apex.y - arch.height * .08} rx={Math.max(14, arch.width * (.11 + shine * .05))} ry={Math.max(42, arch.height * (.24 + shine * .08))} fill="#fff" opacity={0.10 + shine * 0.24} transform={`rotate(${8 + (arch.apexYNorm - .42) * 24} ${arch.apex.x} ${arch.apex.y})`} filter={`url(#${uid}-surface-blur)`}/>
      <path d={`M ${arch.cx - arch.width * .18} ${arch.topY + arch.height * .14} C ${arch.cx - arch.width * .08} ${arch.topY + arch.height * .05}, ${arch.cx + arch.width * .12} ${arch.topY + arch.height * .08}, ${arch.cx + arch.width * .2} ${arch.topY + arch.height * .2}`} fill="none" stroke="#fff" strokeWidth="5" strokeOpacity={shine * .34} strokeLinecap="round" filter={`url(#${uid}-surface-blur)`}/>
    </g>
    <path data-realism-layer="soft-edge-definition" d={path} fill="none" stroke="rgba(59,31,53,.18)" strokeWidth="1.15" filter={`url(#${uid}-soft-edge)`} pointerEvents="none"/>
    <path d={path} fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="0.75" pointerEvents="none"/>
  </>;
}

export const PolishSurface = RealisticNailSurfaceRenderer;
