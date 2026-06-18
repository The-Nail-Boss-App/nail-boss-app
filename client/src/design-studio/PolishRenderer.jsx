import { getNailArchitecture } from "./blueprint.js";
import { polishOpacity, resolvePolishDataForRender } from "./polish.js";

function surfaceIds(uid) {
  return {
    body: `${uid}-gel-body`,
    sidewall: `${uid}-gel-sidewall`,
    apex: `${uid}-gel-apex`,
    reflection: `${uid}-gel-reflection`,
    freeEdge: `${uid}-gel-free-edge`,
    glossBlur: `${uid}-gel-gloss-blur`,
    shadowBlur: `${uid}-gel-shadow-blur`,
    curvature: `${uid}-gel-curvature`,
    freeEdgeRim: `${uid}-gel-free-edge-rim`,
  };
}

export function PolishDefs({ uid }) {
  const ids = surfaceIds(uid);
  return <>
    <linearGradient id={ids.body} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".22"/>
      <stop offset="28%" stopColor="#ffffff" stopOpacity=".04"/>
      <stop offset="64%" stopColor="#2b1024" stopOpacity=".07"/>
      <stop offset="100%" stopColor="#160812" stopOpacity=".14"/>
    </linearGradient>
    <linearGradient id={ids.sidewall} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#120712" stopOpacity=".30"/>
      <stop offset="18%" stopColor="#120712" stopOpacity=".11"/>
      <stop offset="46%" stopColor="#ffffff" stopOpacity=".02"/>
      <stop offset="76%" stopColor="#120712" stopOpacity=".09"/>
      <stop offset="100%" stopColor="#120712" stopOpacity=".26"/>
    </linearGradient>
    <radialGradient id={ids.apex} cx="46%" cy="38%" r="58%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".34"/>
      <stop offset="27%" stopColor="#ffffff" stopOpacity=".16"/>
      <stop offset="58%" stopColor="#ffffff" stopOpacity=".04"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id={ids.reflection} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".64"/>
      <stop offset="42%" stopColor="#ffffff" stopOpacity=".18"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </linearGradient>
    <linearGradient id={ids.freeEdge} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".06"/>
      <stop offset="45%" stopColor="#3b1f35" stopOpacity=".08"/>
      <stop offset="100%" stopColor="#120712" stopOpacity=".24"/>
    </linearGradient>
    <filter id={ids.glossBlur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <radialGradient id={ids.curvature} cx="50%" cy="34%" r="70%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".20"/>
      <stop offset="38%" stopColor="#ffffff" stopOpacity=".055"/>
      <stop offset="72%" stopColor="#321028" stopOpacity=".10"/>
      <stop offset="100%" stopColor="#120712" stopOpacity=".24"/>
    </radialGradient>
    <linearGradient id={ids.freeEdgeRim} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".18"/>
      <stop offset="38%" stopColor="#3b1f35" stopOpacity=".18"/>
      <stop offset="100%" stopColor="#0f0610" stopOpacity=".36"/>
    </linearGradient>
    <filter id={ids.shadowBlur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
  </>;
}

export function GelNailSurfaceRenderer({ nail, baseLayer, path, clipId, uid }) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const ids = surfaceIds(uid);
  const arch = getNailArchitecture(nail);
  const shine = Math.max(0.18, Math.min(1, data.shine ?? 0.62));
  const opacity = polishOpacity({ ...data, polishType: "Cream" });
  const shoulderY = arch.topY + arch.height * 0.14;
  const apexY = arch.apex.y;
  const freeEdgeY = arch.topY + arch.height * arch.freeEdgeYNorm;
  const curveBias = nail?.shape === "Stiletto" || nail?.shape === "Almond" ? 0.86 : nail?.shape === "Square" || nail?.shape === "Coffin" ? 1.08 : 0.98;
  const rimDepth = Math.max(3.5, arch.height * (0.012 + (nail?.freeEdgeThickness ?? 0.5) * 0.012));

  return <g pointerEvents="none">
    <path d={path} fill={data.colorHex} opacity={opacity}/>
    <g clipPath={`url(#${clipId})`}>
      <path data-realism-layer="curvature-shadow" d={path} fill={`url(#${ids.body})`} opacity=".95"/>
      <ellipse data-realism-layer="shape-aware-curvature" cx={arch.cx} cy={arch.topY + arch.height * 0.42} rx={arch.width * 0.52 * curveBias} ry={arch.height * 0.58} fill={`url(#${ids.curvature})`} opacity=".92"/>
      <rect x={arch.left - 4} y={arch.topY - 2} width={arch.width + 8} height={arch.height + 8} fill={`url(#${ids.sidewall})`} opacity=".88"/>
      <ellipse cx={arch.cx - arch.width * 0.08} cy={apexY} rx={arch.width * 0.43} ry={arch.height * 0.24} fill={`url(#${ids.apex})`} opacity={0.7 + shine * 0.28}/>
      <path data-realism-layer="soft-reflection-map" d={`M ${arch.cx - arch.width * 0.23} ${shoulderY} C ${arch.cx - arch.width * 0.36 * curveBias} ${apexY - arch.height * 0.02} ${arch.cx - arch.width * 0.22} ${freeEdgeY - arch.height * 0.08} ${arch.cx - arch.width * 0.05} ${arch.bottomY - arch.height * 0.06}`} stroke={`url(#${ids.reflection})`} strokeWidth={Math.max(9, arch.width * 0.08)} strokeLinecap="round" fill="none" opacity={0.30 + shine * 0.34} filter={`url(#${ids.glossBlur})`}/>
      <path d={`M ${arch.cx + arch.width * 0.18} ${shoulderY + arch.height * 0.02} C ${arch.cx + arch.width * 0.08} ${apexY + arch.height * 0.01} ${arch.cx + arch.width * 0.16} ${freeEdgeY - arch.height * 0.05} ${arch.cx + arch.width * 0.26} ${arch.bottomY - arch.height * 0.08}`} stroke="#ffffff" strokeWidth={Math.max(3, arch.width * 0.026)} strokeLinecap="round" fill="none" opacity={0.12 + shine * 0.22}/>
      <rect data-realism-layer="nail-thickness-depth" x={arch.left - 6} y={freeEdgeY} width={arch.width + 12} height={arch.bottomY - freeEdgeY + 10} fill={`url(#${ids.freeEdge})`} opacity=".92"/>
      <path data-realism-layer="free-edge-thickness-rim" d={`M ${arch.left + arch.width * 0.12} ${arch.bottomY - rimDepth} Q ${arch.cx} ${arch.bottomY + rimDepth * 0.28} ${arch.right - arch.width * 0.12} ${arch.bottomY - rimDepth}`} stroke={`url(#${ids.freeEdgeRim})`} strokeWidth={rimDepth} strokeLinecap="round" fill="none" opacity=".62"/>
      <ellipse cx={arch.cx} cy={arch.bottomY - arch.height * 0.025} rx={arch.width * 0.32} ry={arch.height * 0.035} fill="#2b1024" opacity=".10" filter={`url(#${ids.shadowBlur})`}/>
      <path d={`M ${arch.left + arch.width * 0.04} ${shoulderY} C ${arch.left + arch.width * 0.005} ${apexY + arch.height * 0.1} ${arch.left + arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.left + arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(5, arch.width * 0.04)} strokeLinecap="round" fill="none" opacity=".16" filter={`url(#${ids.shadowBlur})`}/>
      <path d={`M ${arch.right - arch.width * 0.04} ${shoulderY} C ${arch.right - arch.width * 0.005} ${apexY + arch.height * 0.1} ${arch.right - arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.right - arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(4, arch.width * 0.034)} strokeLinecap="round" fill="none" opacity=".12" filter={`url(#${ids.shadowBlur})`}/>
    </g>
    <path d={path} fill="none" stroke="rgba(59,31,53,.26)" strokeWidth="1.2"/>
    <path d={path} fill="none" stroke="rgba(255,255,255,.42)" strokeWidth=".8"/>
  </g>;
}

export const PolishSurface = GelNailSurfaceRenderer;
