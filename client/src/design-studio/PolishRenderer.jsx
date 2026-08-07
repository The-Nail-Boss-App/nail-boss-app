import { getNailArchitecture } from "./blueprint.js";
import { polishMaterialProfile, polishOpacity, polishSurfacePreset, resolvePolishDataForRender } from "./polish.js";
import { resolveMaterialMaps, resolveNailMaterial, resolvePigment } from "./materialFoundation.js";

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
    apexTight: `${uid}-gel-apex-tight`,
    verticalReflection: `${uid}-gel-vertical-reflection`,
    cuticleFade: `${uid}-gel-cuticle-fade`,
    chromeSweep: `${uid}-gel-chrome-sweep`,
    matteGrain: `${uid}-gel-matte-grain`,
    thickness: `${uid}-gel-thickness`,
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
    Duck: { curve: 0.3, width: 0.124, drift: 0.035, fade: 0.76, secondary: 0.72, asymmetry: 0 },
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
    <radialGradient id={ids.apexTight} cx="44%" cy="31%" r="42%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".58"/>
      <stop offset="38%" stopColor="#ffffff" stopOpacity=".20"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </radialGradient>
    <linearGradient id={ids.verticalReflection} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
      <stop offset="42%" stopColor="#ffffff" stopOpacity=".18"/>
      <stop offset="50%" stopColor="#ffffff" stopOpacity=".54"/>
      <stop offset="58%" stopColor="#ffffff" stopOpacity=".16"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
    </linearGradient>
    <linearGradient id={ids.cuticleFade} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#160812" stopOpacity=".24"/>
      <stop offset="8%" stopColor="#321028" stopOpacity=".10"/>
      <stop offset="22%" stopColor="#ffffff" stopOpacity="0"/>
    </linearGradient>
    <linearGradient id={ids.chromeSweep} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".52"/>
      <stop offset="24%" stopColor="#7dd3fc" stopOpacity=".18"/>
      <stop offset="52%" stopColor="#f0abfc" stopOpacity=".16"/>
      <stop offset="78%" stopColor="#111827" stopOpacity=".20"/>
      <stop offset="100%" stopColor="#ffffff" stopOpacity=".26"/>
    </linearGradient>
    <pattern id={ids.matteGrain} width="7" height="7" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="2" r=".38" fill="#fff" opacity=".22"/>
      <circle cx="5" cy="4" r=".42" fill="#210d1c" opacity=".18"/>
      <circle cx="3" cy="6" r=".28" fill="#fff" opacity=".16"/>
    </pattern>
    <radialGradient id={ids.thickness} cx="50%" cy="42%" r="72%">
      <stop offset="0%" stopColor="#ffffff" stopOpacity=".34"/>
      <stop offset="48%" stopColor="#ffffff" stopOpacity=".12"/>
      <stop offset="82%" stopColor="#160812" stopOpacity=".16"/>
      <stop offset="100%" stopColor="#160812" stopOpacity=".42"/>
    </radialGradient>
    <filter id={ids.shadowBlur} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3.2"/></filter>
  </>;
}

// Fixed, hand-authored particle positions avoid per-frame randomness. Positions
// cluster toward the center while the varied radii/opacity create suspended depth.
const GLITTER_PARTICLES = [
  [.50,.12,1.4,.92], [.39,.17,.7,.58], [.61,.19,1,.76], [.47,.23,.55,.52],
  [.55,.27,1.8,.84], [.31,.29,.65,.48], [.69,.31,.8,.62], [.43,.34,1.1,.9],
  [.59,.37,.55,.5], [.51,.40,1.5,.7], [.36,.43,.85,.64], [.64,.45,1.1,.82],
  [.46,.48,.6,.55], [.56,.51,2,.92], [.27,.53,.55,.38], [.73,.55,.7,.44],
  [.41,.57,1.25,.75], [.62,.60,.6,.56], [.49,.63,.9,.86], [.34,.66,.55,.42],
  [.67,.68,1.35,.72], [.54,.71,.65,.5], [.44,.74,1.7,.88], [.24,.76,.5,.34],
  [.76,.78,.6,.4], [.59,.81,1,.68], [.38,.83,.75,.6], [.51,.87,1.4,.82],
];

function GlitterParticleField({ arch }) {
  return <g data-realism-layer="individual-glitter-particles layered-suspended-depth">
    {GLITTER_PARTICLES.map(([x, y, radius, opacity], index) => {
      const px = arch.left + arch.width * x;
      const py = arch.topY + arch.height * y;
      return index % 5 === 0
        ? <path key={index} d={`M ${px-radius*2} ${py} h ${radius*4} M ${px} ${py-radius*2} v ${radius*4}`} stroke="#fffbe8" strokeWidth={Math.max(.45, radius*.45)} strokeLinecap="round" opacity={opacity}/>
        : <circle key={index} cx={px} cy={py} r={radius} fill={index % 3 === 0 ? "#ffe5a6" : "#fff"} opacity={opacity}/>;
    })}
  </g>;
}

function materialProfile(polishType = "Cream", shine = 0.62) {
  return polishMaterialProfile(polishType, shine);
}

function relativeLuminance(colorHex = "#E8A0BF") {
  const channels = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(colorHex)?.slice(1).map((value) => {
    const channel = parseInt(value, 16) / 255;
    return channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4;
  });
  return channels ? channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722 : .5;
}


export function SharedPolishRealismLayers({ nail, path, clipId, uid, shine = 0.62, colorHex = "#E8A0BF", polishType = "Cream", materialScope = "base", maps = {} }) {
  const ids = surfaceIds(uid);
  const arch = getNailArchitecture(nail);
  const freeEdgeY = arch.topY + arch.height * arch.freeEdgeYNorm;
  const profile = reflectionProfile(nail?.shape);
  const curveBias = profile.curve;
  const flatBroadReflection = nail?.shape === "Square" || nail?.shape === "Coffin";
  const asymmetricLipstickReflection = nail?.shape === "Lipstick";
  const rimDepth = Math.max(3.5, arch.height * (0.012 + (nail?.freeEdgeThickness ?? 0.5) * 0.012));
  const mainStrokeWidth = Math.max(7, arch.width * profile.width * (flatBroadReflection ? 1.18 : 1));
  const material = materialProfile(polishType, shine);
  const materialMaps = resolveMaterialMaps(maps);
  // MAT-F02's continuous luminance calibration belongs only to a resolved
  // Cream base-polish surface. Shared consumers (including French tips and
  // gradients) retain the MAT-F01 baseline edge response.
  const usesCreamEdgeCalibration = material.id === "cream" && materialScope === "base-polish";
  const edgeContrastBoost = usesCreamEdgeCalibration ? (1 - relativeLuminance(colorHex)) * .08 : 0;

  return <g clipPath={`url(#${clipId})`} data-realism-renderer="shared-polish-material-engine" data-renderer-version="nail-surface-v3" data-material-scope={materialScope} data-polish-material={polishType} data-material-preset={polishType.toLowerCase()} data-surface-presets="Cream Jelly Matte Glass Chrome-ready">
    <g data-render-layer="curvature" data-realism-layer="curvature-shading">
    <path data-realism-layer="curvature-shadow" d={path} fill={`url(#${ids.body})`} opacity={0.84 + material.depth * 0.14}/>
    <ellipse data-realism-layer="shape-aware-curvature" cx={arch.cx + (asymmetricLipstickReflection ? arch.width * 0.025 : 0)} cy={arch.topY + arch.height * 0.42} rx={arch.width * (flatBroadReflection ? 0.58 : 0.48) * (1 + curveBias * 0.05)} ry={arch.height * (flatBroadReflection ? 0.52 : 0.61)} fill={`url(#${ids.curvature})`} opacity={0.55 + material.depth * 0.37}/>
    <rect data-realism-layer="subtle-sidewall-shading" x={arch.left - 4} y={arch.topY - 2} width={arch.width + 8} height={arch.height + 8} fill={`url(#${ids.sidewall})`} opacity={0.5 + material.depth * 0.38}/>
    <path data-realism-layer="cuticle-fade" d={path} fill={`url(#${ids.cuticleFade})`} opacity={0.48 + material.depth * 0.32}/>
    </g>
    <g data-render-layer="curvature-lighting" data-realism-layer="apex-highlight">
    <ellipse data-realism-layer="apex-highlight-soft-builder-gel-crown" cx={arch.cx - arch.width * 0.08} cy={arch.apex.y} rx={arch.width * 0.43} ry={arch.height * 0.24} fill={`url(#${ids.apex})`} opacity={0.18 + material.apex * 0.42}/>
    <ellipse data-realism-layer="apex-highlight-tight-default-zoom-readability" cx={arch.cx - arch.width * 0.12} cy={arch.apex.y - arch.height * 0.045} rx={arch.width * 0.22} ry={arch.height * 0.095} fill={`url(#${ids.apexTight})`} opacity={0.12 + material.apex * 0.22}/>
    </g>
    <g data-render-layer="reflection" data-realism-layer="environment-reflection">
    <g data-realism-layer="shape-aware-reflection-paths" opacity={0.08 + material.reflection * 0.62}>
      <path data-reflection-profile={flatBroadReflection ? "flatter-broader" : asymmetricLipstickReflection ? "lipstick-asymmetric" : "curved-tapered"} d={buildReflectionPath(arch, profile, "left", 0)} stroke={`url(#${ids.reflection})`} strokeWidth={mainStrokeWidth} strokeLinecap="round" fill="none" filter={`url(#${material.blur > 1.4 ? ids.brokenGlossBlur : ids.glossBlur})`}/>
      <path data-realism-layer="soft-reflection-map soft-broken-reflection" d={buildReflectionPath(arch, profile, "left", 1)} stroke={`url(#${ids.reflectionFade})`} strokeWidth={Math.max(3.5, mainStrokeWidth * 0.42)} strokeLinecap="round" strokeDasharray={`${Math.max(15, arch.height * 0.06)} ${Math.max(10, arch.height * 0.045)} ${Math.max(5, arch.height * 0.018)} ${Math.max(14, arch.height * 0.05)}`} fill="none" opacity=".58" filter={`url(#${ids.brokenGlossBlur})`}/>
      <path d={buildReflectionPath(arch, profile, "right", 0.35)} stroke="#ffffff" strokeWidth={Math.max(2.4, arch.width * 0.022 * profile.secondary)} strokeLinecap="round" strokeDasharray={`${Math.max(18, arch.height * 0.07)} ${Math.max(12, arch.height * 0.04)}`} fill="none" opacity={0.04 + material.reflection * 0.23} filter={`url(#${ids.glossBlur})`}/>
    </g>
    <path data-realism-layer="subtle-reflection-overlay-vertical-window" d={path} fill={`url(#${ids.verticalReflection})`} opacity={0.04 + material.gloss * 0.16}/>
    {material.metallic > 0 && <path data-realism-layer="chrome-material-preset-iridescent-sweep" d={path} fill={`url(#${ids.chromeSweep})`} opacity={0.32 + material.metallic * 0.44} style={{ mixBlendMode: "screen" }}/>}
    {material.sparkle > 0 && <GlitterParticleField arch={arch}/>}
    </g>
    <g data-render-layer="top-coat" data-realism-layer="top-coat-finish" opacity={material.clearCoat}>
    <ellipse data-realism-layer="top-coat-depth-illusion" cx={arch.cx - arch.width * 0.06} cy={arch.apex.y - arch.height * 0.015} rx={arch.width * 0.48} ry={arch.height * 0.28} fill={`url(#${ids.topCoatDepth})`} opacity={0.28 + material.depth * 0.24 + material.glass * 0.26}/>
    <path data-realism-layer="subtle-edge-catch-lighting" data-edge-response={usesCreamEdgeCalibration ? "cream-relative-luminance" : "mat-f01-baseline"} data-edge-contrast-boost={edgeContrastBoost} d={path} fill="none" stroke={`url(#${ids.edgeCatch})`} strokeWidth={Math.max(2.6, arch.width * 0.018)} opacity={0.18 + edgeContrastBoost + material.edge * 0.24}/>
    <rect data-realism-layer="nail-thickness-depth" x={arch.left - 6} y={freeEdgeY} width={arch.width + 12} height={arch.bottomY - freeEdgeY + 10} fill={`url(#${ids.freeEdge})`} opacity={0.45 + material.depth * 0.47}/>
    <path data-realism-layer="free-edge-thickness-rim" d={`M ${arch.left + arch.width * 0.12} ${arch.bottomY - rimDepth} Q ${arch.cx} ${arch.bottomY + rimDepth * 0.28} ${arch.right - arch.width * 0.12} ${arch.bottomY - rimDepth}`} stroke={`url(#${ids.freeEdgeRim})`} strokeWidth={rimDepth} strokeLinecap="round" fill="none" opacity={0.34 + material.edge * 0.28}/>
    <ellipse cx={arch.cx} cy={arch.bottomY - arch.height * 0.025} rx={arch.width * 0.32} ry={arch.height * 0.035} fill="#2b1024" opacity=".10" filter={`url(#${ids.shadowBlur})`}/>
    <path data-realism-layer="soft-diffusion-veil" d={path} fill="#ffffff" opacity={material.diffusion} />
    <path data-realism-layer="edge-shadow-left-sidewall-depth" d={`M ${arch.left + arch.width * 0.04} ${arch.topY + arch.height * 0.14} C ${arch.left + arch.width * 0.005} ${arch.apex.y + arch.height * 0.1} ${arch.left + arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.left + arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(5, arch.width * 0.04)} strokeLinecap="round" fill="none" opacity=".16" filter={`url(#${ids.shadowBlur})`}/>
    <path data-realism-layer="edge-shadow-right-sidewall-depth" d={`M ${arch.right - arch.width * 0.04} ${arch.topY + arch.height * 0.14} C ${arch.right - arch.width * 0.005} ${arch.apex.y + arch.height * 0.1} ${arch.right - arch.width * 0.08} ${arch.bottomY - arch.height * 0.12} ${arch.right - arch.width * 0.16} ${arch.bottomY - arch.height * 0.02}`} stroke="#1a0815" strokeWidth={Math.max(4, arch.width * 0.034)} strokeLinecap="round" fill="none" opacity=".12" filter={`url(#${ids.shadowBlur})`}/>
    </g>
    <g data-render-layer="detail-overlays" data-map-fallback="procedural">
      {polishType === "Matte" && <path data-realism-layer="velvet-micro-grain" d={path} fill={`url(#${ids.matteGrain})`} opacity=".42"/>}
      {Object.entries(materialMaps).map(([kind, href]) => href && <image key={kind} data-material-map={kind} href={href} x={arch.left} y={arch.topY} width={arch.width} height={arch.height} preserveAspectRatio="none" opacity={kind === "reflection" || kind === "gloss" ? material.reflectionStrength : .35}/>)}
    </g>
  </g>;
}

// Compatibility note: polishType === "Matte" remains a supported shared material layer.
export function GelNailSurfaceRenderer({ nail, baseLayer, path, clipId, uid }) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const surfacePreset = polishSurfacePreset(data);
  const shine = surfacePreset === "Matte" ? Math.min(0.18, data.shine ?? 0.08) : Math.max(0.18, Math.min(1, data.shine ?? 0.62));
  const opacity = polishOpacity(data);
  const material = resolveNailMaterial(surfacePreset, data.materialProperties);
  const pigment = resolvePigment({ baseColor: data.colorHex, opacity, saturation: data.saturation, tint: data.tint, pigmentStrength: data.pigmentStrength });
  const maps = resolveMaterialMaps(data.materialMaps || data.maps);

  return <g pointerEvents="none" data-material-renderer="hybrid-layered" data-material-preset={material.id} data-material-map-fallback="procedural">
    <g data-render-layer="base-pigment"><path data-material-layer="base-pigment" d={path} fill={pigment.baseColor} opacity={pigment.opacity * material.opacity * pigment.pigmentStrength} data-material-preset={material.id}/></g>
    {material.transmission > 0 && <g data-render-layer="material-volume" data-transmission={material.transmission} data-thickness-influence={material.thicknessInfluence}><path data-material-layer="thickness-transmission" d={path} fill={`url(#${surfaceIds(uid).thickness})`} opacity={material.transmission * material.thicknessInfluence} style={{ mixBlendMode: "screen" }}/></g>}
    {surfacePreset === "Matte" && <path data-material-layer="matte-muted-pigment-veil" d={path} fill="#b9adb4" opacity=".10"/>}
    {data.polishType === "Milky" && <path data-material-layer="milky-builder-gel-veil soft-cloudy-milky-diffusion" d={path} fill="#fff8fb" opacity=".36"/>}
    <SharedPolishRealismLayers nail={nail} path={path} clipId={clipId} uid={uid} shine={shine} colorHex={pigment.baseColor} polishType={surfacePreset} materialScope="base-polish" maps={maps}/>
    <path d={path} fill="none" stroke="rgba(59,31,53,.26)" strokeWidth="1.2"/>
    <path d={path} fill="none" stroke="rgba(255,255,255,.42)" strokeWidth=".8"/>
  </g>;
}
export const PolishSurface = GelNailSurfaceRenderer;
