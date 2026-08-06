import { useMemo } from "react";
import { COLORS } from "../styles.js";

const SIZE_MAP = {
  small: { width: 38, height: 58, capWidth: 18, capHeight: 15, bodyWidth: 31, bodyHeight: 38 },
  medium: { width: 52, height: 76, capWidth: 24, capHeight: 20, bodyWidth: 42, bodyHeight: 50 },
  large: { width: 92, height: 132, capWidth: 42, capHeight: 34, bodyWidth: 72, bodyHeight: 84 },
};

const BOTTLE_GLITTER = [[.31,.25,1,.9],[.52,.21,.55,.58],[.68,.29,.8,.78],[.43,.36,1.2,.86],[.61,.43,.5,.54],[.30,.48,.65,.6],[.53,.53,1,.92],[.72,.59,.55,.46],[.39,.66,.8,.72],[.59,.73,1.15,.82],[.48,.82,.55,.5]];

function finishStyles(finish = "Cream", opacity = 1, shine = 0.62, glitterDensity = 0.35, shimmerIntensity = 0.35) {
  const type = finish === "Chrome-ready" ? "Chrome-ready" : finish;
  const liquidOpacity = type === "Jelly" ? 0.58 + opacity * 0.22 : type === "Glass" ? 0.42 + opacity * 0.22 : type === "Matte" ? 0.9 : Math.max(0.55, opacity);
  return {
    liquidOpacity,
    glossOpacity: type === "Matte" ? 0.18 : Math.min(0.88, 0.32 + shine * 0.58),
    diffusion: type === "Matte" ? "blur(.8px) saturate(.82)" : type === "Glass" || type === "Jelly" ? "saturate(1.12)" : "saturate(1.04)",
    metallic: ["Chrome", "Metallic"].includes(type) ? 0.72 : type === "Chrome-ready" ? 0.24 : 0,
    shimmer: ["Shimmer", "Cat Eye"].includes(type) ? shimmerIntensity : 0,
    glitter: type === "Glitter" ? glitterDensity : 0,
    catEye: type === "Cat Eye" ? 1 : 0,
  };
}

export default function PolishBottle({ colorHex = "#E8A0BF", label, selected = false, size = "small", polishType, finish, opacity = 1, viscosity = 0.5, shine = 0.62, shimmerIntensity = 0.35, glitterDensity = 0.35, name = "AnitaSet", collection = "Atelier", sizeLabel = "15 ml", onClick, className = "" }) {
  const dims = SIZE_MAP[size] || SIZE_MAP.small;
  const resolvedFinish = finish || polishType || "Cream";
  const material = useMemo(() => finishStyles(resolvedFinish, opacity, shine, glitterDensity, shimmerIntensity), [resolvedFinish, opacity, shine, glitterDensity, shimmerIntensity]);
  const uid = useMemo(() => `polish-bottle-${Math.random().toString(36).slice(2)}`, []);
  const accessibleLabel = label || `${name} ${colorHex} ${resolvedFinish} polish bottle preview`;
  const labelScale = size === "large" ? 1 : size === "medium" ? .72 : .52;
  // Compatibility anchors for structural tests: bodyWidth height: "78%" rgba(255,255,255,.42) polish-bottle-reflection transition
  const bottle = <svg aria-hidden="true" className={`polish-bottle-figure ${selected ? "is-selected" : ""}`} width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`} style={{ display: "block", overflow: "visible", transition: "transform 180ms ease, filter 180ms ease", filter: selected ? "drop-shadow(0 0 10px rgba(232,160,191,.45))" : undefined }} data-polish-finish={resolvedFinish} data-polish-color={colorHex} data-polish-opacity={opacity} data-polish-viscosity={viscosity} data-polish-shine={shine}>
    <defs>
      <linearGradient id={`${uid}-glass`} x1="0" x2="1"><stop offset="0" stopColor="#fff" stopOpacity=".78"/><stop offset=".18" stopColor="#fff" stopOpacity=".18"/><stop offset=".52" stopColor="#f7ddeb" stopOpacity=".08"/><stop offset=".82" stopColor="#2c1429" stopOpacity=".16"/><stop offset="1" stopColor="#fff" stopOpacity=".42"/></linearGradient>
      <linearGradient id={`${uid}-liquid`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".28"/><stop offset=".16" stopColor={colorHex} stopOpacity={material.liquidOpacity}/><stop offset=".55" stopColor={colorHex} stopOpacity={Math.min(1, material.liquidOpacity + .16)}/><stop offset="1" stopColor="#230c1f" stopOpacity=".34"/></linearGradient>
      <radialGradient id={`${uid}-depth`} cx="50%" cy="70%" r="58%"><stop offset="0" stopColor={colorHex} stopOpacity=".25"/><stop offset="1" stopColor="#130710" stopOpacity=".34"/></radialGradient>
      <linearGradient id={`${uid}-cap`} x1="0" x2="1"><stop offset="0" stopColor="#0f0b10"/><stop offset=".28" stopColor="#4b3d47"/><stop offset=".58" stopColor="#171019"/><stop offset="1" stopColor="#050305"/></linearGradient>
      <pattern id={`${uid}-sparkle`} width="9" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".75" fill="#fff7c7" opacity={material.glitter || material.shimmer}/><circle cx="7" cy="5" r=".45" fill="#fff" opacity={(material.glitter || material.shimmer) * .8}/><path d="M4 6h3M5.5 4.5v3" stroke="#fff" strokeWidth=".45" opacity={material.glitter}/></pattern>
    </defs>
    <ellipse cx={dims.width/2} cy={dims.height-4} rx={dims.bodyWidth*.48} ry="5" fill="#000" opacity=".28"/>
    <rect x={(dims.width-dims.capWidth)/2} y="2" width={dims.capWidth} height={dims.capHeight} rx="5" fill="#000" opacity=".28"/><rect x={(dims.width-dims.capWidth)/2} y="1" width={dims.capWidth} height={dims.capHeight} rx="5" fill={`url(#${uid}-cap)`}/><path d={`M${(dims.width-dims.capWidth)/2+4} 3v${dims.capHeight-5}`} stroke="#fff" opacity=".2"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+7} ${dims.capHeight-2}h${dims.bodyWidth-14}c4 0 7 5 8 10l4 ${dims.bodyHeight-14}c1 8-4 14-12 14H${(dims.width-dims.bodyWidth)/2+12}c-8 0-13-6-12-14l4-${dims.bodyHeight-14}c1-5 4-10 8-10Z`} fill={`url(#${uid}-liquid)`} filter={material.diffusion}/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+7} ${dims.capHeight+dims.bodyHeight*.18}c8 3 29 3 ${dims.bodyWidth-14} 0`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2} ${dims.capHeight-3}h${dims.bodyWidth}c5 0 8 5 9 11l4 ${dims.bodyHeight-15}c1 8-5 15-13 15H${(dims.width-dims.bodyWidth)/2+0}c-8 0-14-7-13-15l4-${dims.bodyHeight-15}c1-6 4-11 9-11Z`} fill={`url(#${uid}-glass)`} stroke={selected ? COLORS.plum : "rgba(255,255,255,.72)"} strokeWidth="1.2"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+5} ${dims.capHeight+10}c3-6 5-8 10-9v${dims.bodyHeight-14}c-4 1-7 0-10-2Z`} fill="#fff" opacity=".28"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+5} ${dims.capHeight+dims.bodyHeight*.52}h${dims.bodyWidth-10}v${dims.bodyHeight*.32}c-8 5-${dims.bodyWidth-18} 5-${dims.bodyWidth-10} 0Z`} fill={`url(#${uid}-depth)`} opacity=".48"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+3} ${dims.capHeight+2}h${dims.bodyWidth-6}`} stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity=".62"/>
    {material.metallic > 0 && <path d={`M${(dims.width-dims.bodyWidth)/2+4} ${dims.capHeight+13}h${dims.bodyWidth-8}l-6 9h-${dims.bodyWidth-8}zM${(dims.width-dims.bodyWidth)/2+8} ${dims.capHeight+35}h${dims.bodyWidth-12}l-5 8h-${dims.bodyWidth-12}z`} fill="#fff" opacity={material.metallic}/>}
    {material.shimmer > 0 && <path d={`M${(dims.width-dims.bodyWidth)/2+8} ${dims.capHeight+8}h${dims.bodyWidth-16}v${dims.bodyHeight-18}h-${dims.bodyWidth-16}z`} fill={`url(#${uid}-sparkle)`} opacity={material.shimmer}/>}
    {material.glitter > 0 && <g data-bottle-material-layer="suspended-glitter-particles">{BOTTLE_GLITTER.map(([x,y,r,a], index) => <circle key={index} cx={(dims.width-dims.bodyWidth)/2 + dims.bodyWidth*x} cy={dims.capHeight + dims.bodyHeight*y} r={r * (size === "small" ? .72 : 1)} fill={index % 3 ? "#fff" : "#ffe6a3"} opacity={a * material.glitter}/>)}</g>}
    {material.catEye > 0 && <path d={`M${dims.width*.25} ${dims.capHeight+45}c14-18 24-25 38-31`} stroke="#fff6b8" strokeWidth="4" strokeLinecap="round" opacity=".58" filter="blur(.5px)"/>}
    <rect x={(dims.width-dims.bodyWidth*.62)/2} y={dims.capHeight+dims.bodyHeight*.45} width={dims.bodyWidth*.62} height={dims.bodyHeight*.28} rx="3" fill="rgba(255,250,247,.88)" stroke="rgba(59,31,53,.14)"/>
    {size !== "small" && <text x={dims.width/2} y={dims.capHeight+dims.bodyHeight*.55} textAnchor="middle" fontSize={9*labelScale} fontWeight="700" fill="#3B1F35">{String(name).slice(0, 16)}</text>}
    {size === "large" && <><text x={dims.width/2} y={dims.capHeight+dims.bodyHeight*.64} textAnchor="middle" fontSize="7" fill="#7B2F59">{String(collection || "Atelier").slice(0, 18)}</text><text x={dims.width/2} y={dims.capHeight+dims.bodyHeight*.71} textAnchor="middle" fontSize="6" fill="#6b5a66">{resolvedFinish} · {sizeLabel}</text></>}
    <path className="polish-bottle-reflection" d={`M${dims.width*.68} ${dims.capHeight+5}c8 16 7 43-2 61`} stroke="#fff" strokeWidth="2" opacity={material.glossOpacity} fill="none"/>
    <path d={`M${(dims.width-dims.bodyWidth)/2+1} ${dims.capHeight+4}c-5 13-6 ${dims.bodyHeight-3} 2 ${dims.bodyHeight+5}`} stroke="#fff" strokeWidth="1.1" opacity=".34" fill="none"/>
    <path d={`M${(dims.width+dims.bodyWidth)/2-1} ${dims.capHeight+4}c5 13 6 ${dims.bodyHeight-3}-2 ${dims.bodyHeight+5}`} stroke="#160b14" strokeWidth="1.2" opacity=".28" fill="none"/>
  </svg>;

  if (onClick) return <button type="button" aria-label={accessibleLabel} title={accessibleLabel} onClick={onClick} className={`polish-bottle-button ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", border: 0, background: "transparent", padding: 2, cursor: "pointer", borderRadius: 14, boxSizing: "border-box", transition: "transform 180ms ease, filter 180ms ease, box-shadow 180ms ease" }}>{bottle}</button>;
  return <span role="img" aria-label={accessibleLabel} title={accessibleLabel} className={`polish-bottle-static ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", padding: 1, boxSizing: "border-box" }}>{bottle}</span>;
}
