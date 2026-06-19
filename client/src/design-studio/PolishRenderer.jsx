import { getNailArchitecture } from "./blueprint.js";
import { polishOpacity, resolvePolishDataForRender } from "./polish.js";

function surfaceIds(uid) {
  return {
    body: `${uid}-gel-body`,
    sidewall: `${uid}-gel-sidewall`,
    apex: `${uid}-gel-apex`,
    reflection: `${uid}-gel-reflection`,
    reflectionFade: `${uid}-gel-reflection-fade`,
    topCoatDepth: `${uid}-gel-top-coat-depth`,
    edgeCatch: `${uid}-gel-edge-catch`,
    freeEdge: `${uid}-gel-free-edge`,
    glossBlur: `${uid}-gel-gloss-blur`,
    brokenGlossBlur: `${uid}-gel-broken-gloss-blur`,
    shadowBlur: `${uid}-gel-shadow-blur`,
    curvature: `${uid}-gel-curvature`,
    freeEdgeRim: `${uid}-gel-free-edge-rim`,
  };
}

function reflectionProfile(shape) {
  const profiles = {
    Square: { curve: 0.34, width: 0.118, drift: 0.04, fade: 0.74, secondary: 0.7, asymmetry: 0 },
    Coffin: { curve: 0.42, width: 0.108, drift: 0.05, fade: 0.72, secondary: 0.66, asymmetry: 0 },
    Almond: { curve: 0.96, width: 0.078, drift: 0.13, fade: 0.58, secondary: 0.5, asymmetry: 0 },
    Oval: { curve: 0.84, width: 0.082, drift: 0.11, fade: 0.62, secondary: 0.54, asymmetry: 0 },
    Stiletto: { curve: 1.18, width: 0.062, drift: 0.16, fade: 0.52, secondary: 0.43, asymmetry: 0 },
    Round: { curve: 0.76, width: 0.088, drift: 0.1, fade: 0.64, secondary: 0.58, asymmetry: 0 },
    Lipstick: { curve: 0.72, width: 0.082, drift: 0.12, fade: 0.6, secondary: 0.5, asymmetry: 0.055 },
  };
  return profiles[shape] || profiles.Almond;
}

function buildReflectionPath(arch, profile, side = "left", broken = 0) {
  const direction = side === "left" ? -1 : 1;
  const asymmetry = profile.asymmetry * arch.width;
  const startX = arch.cx + direction * arch.width * (side === "left" ? 0.22 : 0.17) + asymmetry;
  const endX = arch.cx + direction * arch.width * (side === "left" ? 0.05 : 0.27) + asymmetry * 0.45;
  const c1X = arch.cx + direction * arch.width * (0.18 + profile.drift * profile.curve) + asymmetry;
  const c2X = arch.cx + direction * arch.width * (0.03 + profile.drift * 0.45) + asymmetry * 0.7;
  const shoulderY = arch.topY + arch.height * (0.15 + broken * 0.018);
  const apexY = arch.apex.y + arch.height * (0.015 * broken);
  const lowerY = arch.bottomY - arch.height * (profile.fade * 0.16 + 0.035 + broken * 0.02);
  return `M ${startX} ${shoulderY} C ${c1X} ${apexY - arch.height * (0.04 + profile.curve * 0.025)} ${c2X} ${arch.topY + arch.height * (0.58 + broken * 0.04)} ${endX} ${lowerY}`;
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
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".54"/>
      <stop offset="36%" stopColor="#ffffff" stopOpacity=".25"/>
      <stop offset="67%" stopColor="#ffffff" stopOpacity=".09"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </linearGradient>
    <linearGradient id={ids.reflectionFade} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".45"/>
      <stop offset="52%" stopColor="#ffffff" stopOpacity=".18"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </linearGradient>
    <radialGradient id={ids.topCoatDepth} cx="46%" cy="30%" r="78%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".24"/>
      <stop offset="44%" stopColor="#ffffff" stopOpacity=".075"/>
      <stop offset="78%" stopColor="#1a0815" stopOpacity=".06"/>
      <stop offset="100%" stopColor="#1a0815" stopOpacity=".16"/>
    </radialGradient>
    <linearGradient id={ids.edgeCatch} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".42"/>
      <stop offset="16%" stopColor="#ffffff" stopOpacity=".08"/>
      <stop offset="84%" stopColor="#ffffff" stopOpacity=".07"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity=".36"/>
    </linearGradient>
    <linearGradient id={ids.freeEdge} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".06"/>
      <stop offset="45%" stopColor="#3b1f35" stopOpacity=".08"/>
      <stop offset="100%" stopColor="#120712" stopOpacity=".24"/>
    </linearGradient>
    <filter id={ids.glossBlur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.8"/></filter>
    <filter id={ids.brokenGlossBlur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.4"/></filter>
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
  const freeEdgeY = arch.topY + arch.height * arch.freeEdgeYNorm;
  const profile = reflectionProfile(nail?.shape);
  const curveBias = profile.curve;
  const flatBroadReflection = nail?.shape === "Square" || nail?.shape === "Coffin";
  const asymmetricLipstickReflection = nail?.shape === "Lipstick";
  const rimDepth = Math.max(3.5, arch.height * (0.012 + (nail?.freeEdgeThickness ?? 0.5) * 0.012));
  const mainStrokeWidth = Math.max(7, arch.width * profile.width * (flatBroadReflection ? 1.18 : 1));
  const darkColorEdgeBoost = /^#(?:0|1|2|3|4|5)/i.test(data.colorHex || "") ? 0.08 : 0;

  return <g pointerEvents="none">
    <path d={path} fill={data.colorHex} opacity={opacity}/>
    <g clipPath={`url(#${clipId})`}>
      <path data-realism-layer="curvature-shadow" d={path} fill={`url(#${ids.body})`} opacity=".95"/>
      <ellipse data-realism-layer="shape-aware-curvature" cx={arch.cx + (asymmetricLipstickReflection ? arch.width * 0.025 : 0)} cy={arch.topY + arch.height * 0.42} rx={arch.width * (flatBroadReflection ? 0.58 : 0.48) * (1 + curveBias * 0.05)} ry={arch.height * (flatBroadReflection ? 0.52 : 0.61)} fill={`url(#${ids.curvature})`} opacity=".92"/>
      <rect x={arch.left - 4} y={arch.topY - 2} width={arch.width + 8} height={arch.height + 8} fill={`url(#${ids.sidewall})`} opacity=".88"/>
      <ellipse data-realism-layer="top-coat-depth-illusion" cx={arch.cx - arch.width * 0.06} cy={arch.apex.y - arch.height * 0.015} rx={arch.width * 0.48} ry={arch.height * 0.28} fill={`url(#${ids.topCoatDepth})`} opacity={0.62 + shine * 0.25}/>
      <ellipse cx={arch.cx - arch.width * 0.08} cy={arch.apex.y} rx={arch.width * 0.43} ry={arch.height * 0.24} fill={`url(#${ids.apex})`} opacity={0.48 + shine * 0.22}/>
      <g data-realism-layer="shape-aware-reflection-paths" opacity={0.42 + shine * 0.28}>
        <path data-reflection-profile={flatBroadReflection ? "flatter-broader" : asymmetricLipstickReflection ? "lipstick-asymmetric" : "curved-tapered"} d={buildReflectionPath(arch, profile, "left", 0)} stroke={`url(#${ids.reflection})`} strokeWidth={mainStrokeWidth} strokeLinecap="round" fill="none" filter={`url(#${ids.glossBlur})`}/>
        <path data-realism-layer="soft-reflection-map soft-broken-reflection" d={buildReflectionPath(arch, profile, "left", 1)} stroke={`url(#${ids.reflectionFade})`} strokeWidth={Math.max(3.5, mainStrokeWidth * 0.42)} strokeLinecap="round" strokeDasharray={`${Math.max(15, arch.height * 0.06)} ${Math.max(10, arch.height * 0.045)} ${Math.max(5, arch.height * 0.018)} ${Math.max(14, arch.height * 0.05)}`} fill="none" opacity=".58" filter={`url(#${ids.brokenGlossBlur})`}/>
        <path d={buildReflectionPath(arch, profile, "right", 0.35)} stroke="#ffffff" strokeWidth={Math.max(2.4, arch.width * 0.022 * profile.secondary)} strokeLinecap="round" strokeDasharray={`${Math.max(18, arch.height * 0.07)} ${Math.max(12, arch.height * 0.04)}`} fill="none" opacity={0.11 + shine * 0.16} filter={`url(#${ids.glossBlur})`}/>
      </g>
      <path data-realism-layer="subtle-edge-catch-lighting" d={path} fill="none" stroke={`url(#${ids.edgeCatch})`} strokeWidth={Math.max(2.6, arch.width * 0.018)} opacity={0.30 + darkColorEdgeBoost + shine * 0.08}/>
      <rect data-realism-layer="nail-thickness-depth" x={arch.left - 6} y={freeEdgeY} width={arch.width + 12} height={arch.bottomY - freeEdgeY + 10} fill={`url(#${ids.freeEdge})`} opacity=".92"/>
      <path data-realism-layer="free-edge-thickness-rim" d={`M ${arch.left + arch.width * 0.12} ${arch.bottomY - rimDepth} Q ${arch.cx} ${arch.bottomY + rimDepth * 0.28} ${arch.right - arch.width * 0.12} ${arch.bottomY - rimDepth}`} stroke={`url(#${ids.freeEdgeRim})`} strokeWidth={rimDepth} strokeLinecap="round" fill="none" opacity=".62"/>
      <ellipse cx={arch.cx} cy={arch.bottomY - arch.height * 0.025} rx={arch.width * 0.32} ry={arch.height * 0.035} fill="#2b1024" opacity=".10" filter={`url(#${ids.shadowBlur})`}/>
      <path d={`M ${arch.left + arch.width * 0.04} ${arch.topY + arch.height * 0.14} C ${arch.left + arch.width * 0.005} ${arch.apex.y + arch.height * 0.1} ${arch.left + arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.left + arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(5, arch.width * 0.04)} strokeLinecap="round" fill="none" opacity=".16" filter={`url(#${ids.shadowBlur})`}/>
      <path d={`M ${arch.right - arch.width * 0.04} ${arch.topY + arch.height * 0.14} C ${arch.right - arch.width * 0.005} ${arch.apex.y + arch.height * 0.1} ${arch.right - arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.right - arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(4, arch.width * 0.034)} strokeLinecap="round" fill="none" opacity=".12" filter={`url(#${ids.shadowBlur})`}/>
    </g>
    <path d={path} fill="none" stroke="rgba(59,31,53,.26)" strokeWidth="1.2"/>
    <path d={path} fill="none" stroke="rgba(255,255,255,.42)" strokeWidth=".8"/>
  </g>;
}

export const PolishSurface = GelNailSurfaceRenderer;
