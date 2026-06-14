import { getNailArchitecture, VIEWBOX } from "./blueprint.js";
import { normalizePolishData, polishOpacity } from "./polish.js";

export function PolishDefs({ baseLayer, uid }) {
  const data = normalizePolishData(baseLayer?.data || {});
  const color = data.colorHex;
  const shine = data.topCoat === "Matte" || data.polishType === "Matte" ? 0 : data.shine;
  const chrome = data.polishType === "Chrome" ? data.chromeIntensity : 0;
  return <>
    <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.22 + shine * 0.28}/><stop offset="34%" stopColor={color}/><stop offset="72%" stopColor={color} stopOpacity=".9"/><stop offset="100%" stopColor="#2b1024" stopOpacity=".18"/></linearGradient>
    <radialGradient id={`${uid}-jelly`} cx="48%" cy="38%" r="72%"><stop offset="0%" stopColor="#fff" stopOpacity=".32"/><stop offset="42%" stopColor={color} stopOpacity=".72"/><stop offset="100%" stopColor={color} stopOpacity=".42"/></radialGradient>
    <radialGradient id={`${uid}-milky`} cx="52%" cy="36%" r="82%"><stop offset="0%" stopColor="#fff" stopOpacity=".62"/><stop offset="45%" stopColor={color} stopOpacity=".74"/><stop offset="100%" stopColor="#fff" stopOpacity=".38"/></radialGradient>
    <linearGradient id={`${uid}-chrome`} x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity={0.55 + chrome * 0.38}/><stop offset="18%" stopColor={color}/><stop offset="38%" stopColor="#777" stopOpacity={0.18 + chrome * 0.5}/><stop offset="58%" stopColor="#fff" stopOpacity={0.4 + chrome * 0.45}/><stop offset="82%" stopColor={color}/><stop offset="100%" stopColor="#111" stopOpacity={0.18 + chrome * 0.24}/></linearGradient>
    <linearGradient id={`${uid}-cat`} x1="0" y1="0" x2="1" y2="0" gradientTransform={`rotate(${data.catEyeAngle} .5 .5)`}><stop offset="0%" stopColor={color}/><stop offset="45%" stopColor="#fff" stopOpacity={data.catEyeIntensity}/><stop offset="54%" stopColor={color}/><stop offset="100%" stopColor="#210e24" stopOpacity=".45"/></linearGradient>
    <pattern id={`${uid}-glitter`} width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="transparent"/><circle cx="6" cy="7" r={1 + data.sparkleSize * 2.2} fill="#fff" opacity={0.35 + data.sparkleDensity * 0.55}/><circle cx="21" cy="17" r={0.8 + data.sparkleSize * 1.5} fill={color} opacity=".8"/><path d="M14 3 l1.8 4 4 1.8 -4 1.8 -1.8 4 -1.8 -4 -4-1.8 4-1.8Z" fill="#fff" opacity={data.sparkleDensity}/></pattern>
  </>;
}
export function PolishSurface({ nail, baseLayer, path, clipId, uid }) {
  const data = normalizePolishData(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  const fillId = data.polishType === "Jelly" ? "jelly" : data.polishType === "Milky" ? "milky" : data.polishType === "Chrome" ? "chrome" : data.polishType === "Cat Eye" ? "cat" : "cream";
  const arch = getNailArchitecture(nail);
  const shine = data.topCoat === "Matte" || data.polishType === "Matte" ? 0 : data.shine;
  return <>
    <path d={path} fill={`url(#${uid}-${fillId})`} opacity={polishOpacity(data)} stroke="rgba(59,31,53,.24)" strokeWidth="2"/>
    {data.polishType === "Glitter" && <g clipPath={`url(#${clipId})`}><rect width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${uid}-glitter)`}/></g>}
    <g clipPath={`url(#${clipId})`} pointerEvents="none">
      <ellipse cx={arch.apex.x - arch.width * .16} cy={arch.apex.y - arch.height * .1} rx={10 + arch.width * .08} ry={arch.height * .28} fill="#fff" opacity={0.08 + shine * 0.22} transform={`rotate(12 ${arch.apex.x} ${arch.apex.y})`}/>
      <rect x={arch.left} y={arch.topY} width={arch.width * .12} height={arch.height} fill="#2b1024" opacity=".08"/><rect x={arch.right - arch.width * .12} y={arch.topY} width={arch.width * .12} height={arch.height} fill="#2b1024" opacity=".08"/>
      <ellipse cx={arch.cx} cy={arch.topY + arch.height * arch.freeEdgeYNorm} rx={arch.width * .26} ry="7" fill="#fff" opacity={0.08 + shine * 0.12}/>
      <path d={`M ${arch.cx - arch.width * .18} ${arch.topY + arch.height * .14} C ${arch.cx - arch.width * .08} ${arch.topY + arch.height * .05}, ${arch.cx + arch.width * .12} ${arch.topY + arch.height * .08}, ${arch.cx + arch.width * .2} ${arch.topY + arch.height * .2}`} fill="none" stroke="#fff" strokeWidth="5" strokeOpacity={shine * .42} strokeLinecap="round"/>
    </g>
  </>;
}
