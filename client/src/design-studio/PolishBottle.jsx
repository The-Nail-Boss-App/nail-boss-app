import { useMemo } from "react";
import { COLORS } from "../styles.js";

const SIZE_MAP = {
  small: { width: 38, height: 58, capWidth: 18, capHeight: 15, bodyWidth: 30, bodyHeight: 38 },
  medium: { width: 52, height: 76, capWidth: 24, capHeight: 20, bodyWidth: 40, bodyHeight: 50 },
  large: { width: 78, height: 112, capWidth: 36, capHeight: 29, bodyWidth: 62, bodyHeight: 73 },
};

const BOTTLE_GLITTER = [[.25,.2,1,.9],[.5,.17,.55,.58],[.72,.25,.8,.78],[.38,.36,1.2,.86],[.64,.43,.5,.54],[.25,.51,.65,.6],[.51,.56,1,.92],[.74,.64,.55,.46],[.36,.72,.8,.72],[.61,.78,1.15,.82],[.48,.86,.55,.5]];

function finishStyles(finish = "Cream", opacity = 1, shine = 0.62, glitterDensity = 0.35, shimmerIntensity = 0.35) {
  const type = finish === "Chrome-ready" ? "Chrome-ready" : finish;
  return {
    liquidOpacity: type === "Jelly" ? 0.58 + opacity * 0.22 : type === "Glass" ? 0.42 + opacity * 0.22 : type === "Matte" ? 0.9 : Math.max(0.55, opacity),
    glossOpacity: type === "Matte" ? 0.1 : Math.min(0.52, 0.2 + shine * 0.4),
    diffusion: type === "Matte" ? "saturate(.82)" : type === "Glass" || type === "Jelly" ? "saturate(1.12)" : "saturate(1.04)",
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
  const bodyX = (dims.width - dims.bodyWidth) / 2;
  const bodyY = dims.capHeight - 1;
  const bodyBottom = bodyY + dims.bodyHeight;
  const bodyPath = `M${bodyX + 4} ${bodyY}h${dims.bodyWidth - 8}q4 0 4 4l2 ${dims.bodyHeight - 10}q0 6-6 6H${bodyX + 4}q-6 0-6-6l2-${dims.bodyHeight - 10}q0-4 4-4Z`;
  const labelScale = size === "large" ? 1 : size === "medium" ? .72 : .52;

  const bottle = <svg aria-hidden="true" className={`polish-bottle-figure ${selected ? "is-selected" : ""}`} width={dims.width} height={dims.height} viewBox={`0 0 ${dims.width} ${dims.height}`} style={{ display: "block", overflow: "hidden", transition: "transform 180ms ease, filter 180ms ease", filter: selected ? "drop-shadow(0 0 7px rgba(232,160,191,.38))" : undefined }} data-polish-finish={resolvedFinish} data-polish-color={colorHex} data-polish-opacity={opacity} data-polish-viscosity={viscosity} data-polish-shine={shine} data-bottle-renderer="simplified">
    <defs>
      <linearGradient id={`${uid}-liquid`} x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor={colorHex} stopOpacity={material.liquidOpacity}/><stop offset=".58" stopColor={colorHex} stopOpacity={Math.min(1, material.liquidOpacity + .14)}/><stop offset="1" stopColor="#210b1d" stopOpacity=".4"/></linearGradient>
      <linearGradient id={`${uid}-edge`} x1="0" x2="1"><stop offset="0" stopColor="#1c0918" stopOpacity=".48"/><stop offset=".16" stopColor="#fff" stopOpacity=".1"/><stop offset=".78" stopColor="#fff" stopOpacity=".04"/><stop offset="1" stopColor="#150711" stopOpacity=".5"/></linearGradient>
      <linearGradient id={`${uid}-cap`} x1="0" x2="1"><stop offset="0" stopColor="#080608"/><stop offset=".3" stopColor="#433740"/><stop offset=".58" stopColor="#171117"/><stop offset="1" stopColor="#030203"/></linearGradient>
      <clipPath id={`${uid}-body-clip`}><path d={bodyPath}/></clipPath>
      <pattern id={`${uid}-sparkle`} width="9" height="8" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".75" fill="#fff7c7" opacity={material.glitter || material.shimmer}/><circle cx="7" cy="5" r=".45" fill="#fff" opacity={(material.glitter || material.shimmer) * .8}/></pattern>
    </defs>
    <ellipse data-bottle-layer="contact-shadow" cx={dims.width/2} cy={bodyBottom + 3} rx={dims.bodyWidth*.4} ry="3" fill="#000" opacity=".3"/>
    <g data-bottle-layer="cap"><rect x={(dims.width-dims.capWidth)/2} y="1" width={dims.capWidth} height={dims.capHeight} rx="4" fill={`url(#${uid}-cap)`}/><path d={`M${(dims.width-dims.capWidth)/2+4} 3v${dims.capHeight-6}`} stroke="#fff" opacity=".18" strokeLinecap="round"/></g>
    <g data-bottle-layer="body">
      <path d={bodyPath} fill={`url(#${uid}-liquid)`} stroke={selected ? COLORS.plum : "#2b1525"} strokeWidth="1.2" filter={material.diffusion}/>
      <path d={bodyPath} fill={`url(#${uid}-edge)`} pointerEvents="none"/>
      <g clipPath={`url(#${uid}-body-clip)`} data-bottle-layer="polish-content">
        {material.metallic > 0 && <path d={`M${bodyX} ${bodyY+13}h${dims.bodyWidth}l-7 9H${bodyX}z`} fill="#fff" opacity={material.metallic}/>}
        {material.shimmer > 0 && <rect x={bodyX} y={bodyY} width={dims.bodyWidth} height={dims.bodyHeight} fill={`url(#${uid}-sparkle)`} opacity={material.shimmer}/>}
        {material.glitter > 0 && <g data-bottle-material-layer="suspended-glitter-particles">{BOTTLE_GLITTER.map(([x,y,r,a], index) => <circle key={index} cx={bodyX + dims.bodyWidth*x} cy={bodyY + dims.bodyHeight*y} r={r * (size === "small" ? .72 : 1)} fill={index % 3 ? "#fff" : "#ffe6a3"} opacity={a * material.glitter}/>)}</g>}
        {material.catEye > 0 && <path d={`M${bodyX+5} ${bodyBottom-8}L${bodyX+dims.bodyWidth-5} ${bodyY+8}`} stroke="#fff6b8" strokeWidth="3" opacity=".5"/>}
      </g>
      <path data-bottle-layer="edge-highlight" d={`M${bodyX+3} ${bodyY+7}v${dims.bodyHeight-15}`} stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".22"/>
      <path className="polish-bottle-reflection" data-bottle-layer="front-reflection" d={`M${bodyX+dims.bodyWidth*.68} ${bodyY+7}q3 5 1 12`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity={material.glossOpacity} fill="none"/>
    </g>
    <g data-bottle-layer="label"><rect x={bodyX+dims.bodyWidth*.18} y={bodyY+dims.bodyHeight*.47} width={dims.bodyWidth*.64} height={dims.bodyHeight*.29} rx="2" fill="#fffaf7" fillOpacity=".92" stroke="#3b1f35" strokeOpacity=".16"/>{size !== "small" && <text x={dims.width/2} y={bodyY+dims.bodyHeight*.58} textAnchor="middle" fontSize={9*labelScale} fontWeight="700" fill="#3B1F35">{String(name).slice(0, 16)}</text>}{size === "large" && <><text x={dims.width/2} y={bodyY+dims.bodyHeight*.67} textAnchor="middle" fontSize="6" fill="#7B2F59">{String(collection || "Atelier").slice(0, 18)}</text><text x={dims.width/2} y={bodyY+dims.bodyHeight*.74} textAnchor="middle" fontSize="5" fill="#6b5a66">{resolvedFinish} · {sizeLabel}</text></>}</g>
  </svg>;

  if (onClick) return <button type="button" aria-label={accessibleLabel} title={accessibleLabel} onClick={onClick} className={`polish-bottle-button ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", border: 0, background: "transparent", padding: 2, cursor: "pointer", borderRadius: 14, boxSizing: "border-box", transition: "transform 180ms ease, filter 180ms ease, box-shadow 180ms ease" }}>{bottle}</button>;
  return <span role="img" aria-label={accessibleLabel} title={accessibleLabel} className={`polish-bottle-static ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", padding: 1, boxSizing: "border-box" }}>{bottle}</span>;
}
