import { useId, useMemo } from "react";

const SIZE_MAP = {
  small: { width: 38, height: 52 },
  medium: { width: 88, height: 116 },
  large: { width: 112, height: 148 },
};

const BOTTLE_GLITTER = [[28,57,1.3,.8],[45,53,.8,.6],[67,60,1.1,.8],[35,72,1.4,.9],[61,77,.8,.7],[25,91,1,.7],[74,94,1.4,.8],[48,106,.9,.6]];

function bottleFinish(finish, opacity, shine, glitterDensity, shimmerIntensity) {
  return {
    liquidOpacity: finish === "Jelly" ? .48 + opacity * .32 : finish === "Matte" ? .94 : Math.max(.58, opacity),
    reflectionOpacity: finish === "Matte" ? .1 : Math.min(.62, .2 + shine * .45),
    glitter: finish === "Glitter" ? glitterDensity : 0,
    shimmer: ["Shimmer", "Cat Eye"].includes(finish) ? shimmerIntensity : 0,
  };
}

/** UI-only rendering of the Founder-approved Signature Bottle V1. */
export default function PolishBottle({ colorHex = "#E8A3B6", label, selected = false, size = "small", polishType, finish, opacity = 1, viscosity = .5, shine = .62, shimmerIntensity = .35, glitterDensity = .35, name = "AnitaSet", onClick, className = "" }) {
  const dims = SIZE_MAP[size] || SIZE_MAP.small;
  const resolvedFinish = finish || polishType || "Cream";
  const material = useMemo(() => bottleFinish(resolvedFinish, opacity, shine, glitterDensity, shimmerIntensity), [resolvedFinish, opacity, shine, glitterDensity, shimmerIntensity]);
  const reactId = useId();
  const uid = `anitaset-bottle-${reactId.replace(/:/g, "")}`;
  const accessibleLabel = label || `${name} ${colorHex} ${resolvedFinish} polish bottle preview`;
  const bodyPath = "M18 42 Q16 42 14 48 L4 111 Q2 125 16 127 L38 127 Q44 127 46 118 L50 103 L54 118 Q56 127 62 127 L84 127 Q98 125 96 111 L86 48 Q84 42 80 42 Z";
  const liquidPath = "M18 51 L10 112 Q9 118 17 119 L35 119 Q38 119 40 112 L48 88 Q50 83 52 88 L60 112 Q62 119 65 119 L83 119 Q91 118 90 112 L82 51 Z";

  const bottle = <svg aria-hidden="true" className={`polish-bottle-figure ${selected ? "is-selected" : ""}`} width={dims.width} height={dims.height} viewBox="0 0 100 132" data-polish-finish={resolvedFinish} data-polish-color={colorHex} data-polish-opacity={opacity} data-polish-viscosity={viscosity} data-polish-shine={shine} data-bottle-renderer="anitaset-signature-v1">
    <defs>
      <linearGradient id={`${uid}-gold`} x1="0" x2="1"><stop stopColor="#8d5526"/><stop offset=".18" stopColor="#ffe4b2"/><stop offset=".52" stopColor="#f5bf7b"/><stop offset=".82" stopColor="#fff0c8"/><stop offset="1" stopColor="#7a431e"/></linearGradient>
      <linearGradient id={`${uid}-polish`} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#fff" stopOpacity=".2"/><stop offset=".18" stopColor={colorHex}/><stop offset=".72" stopColor={colorHex}/><stop offset="1" stopColor="#17050f" stopOpacity=".55"/></linearGradient>
      <linearGradient id={`${uid}-glass`} x1="0" x2="1"><stop stopColor="#fff" stopOpacity=".65"/><stop offset=".12" stopColor="#fff" stopOpacity=".06"/><stop offset=".8" stopColor="#fff" stopOpacity=".14"/><stop offset="1" stopColor="#fff" stopOpacity=".68"/></linearGradient>
      <clipPath id={`${uid}-liquid-clip`}><path d={liquidPath}/></clipPath>
    </defs>
    <ellipse cx="50" cy="128" rx="39" ry="4" fill="#000" opacity=".5"/>
    <g data-bottle-layer="cap">
      <path d="M27 3 L73 3 L78 11 L74 39 L26 39 L22 11 Z" fill={`url(#${uid}-gold)`} stroke="#ffe4b4" strokeWidth="1.2"/>
      <path d="M29 7 H70" stroke="#fff8dd" strokeWidth="1.4" opacity=".8"/>
      <text x="50" y="27" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fontStyle="italic" fill="#70421f">AS</text>
    </g>
    <g data-bottle-layer="body">
      <path d={bodyPath} fill="#fff" fillOpacity=".08" stroke="#f8e8e8" strokeWidth="3"/>
      <path data-bottle-layer="polish-content" d={liquidPath} fill={`url(#${uid}-polish)`} fillOpacity={material.liquidOpacity}/>
      <g clipPath={`url(#${uid}-liquid-clip)`}>
        {(material.glitter > 0 || material.shimmer > 0) && <g data-bottle-material-layer="suspended-glitter-particles">{BOTTLE_GLITTER.map(([cx,cy,r,a], index) => <circle key={index} cx={cx} cy={cy} r={r} fill={index % 3 ? "#fff7dc" : "#ffd86e"} opacity={a * (material.glitter || material.shimmer)}/>)}</g>}
      </g>
      <path d={bodyPath} fill={`url(#${uid}-glass)`} stroke="#fff" strokeOpacity=".48" strokeWidth="1"/>
      <path data-bottle-layer="front-reflection" d="M21 49 L13 108 Q12 114 18 115 M79 48 L88 108" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity={material.reflectionOpacity}/>
      <g data-bottle-layer="label" fill="#fff4dd" textAnchor="middle" fontFamily="Georgia, serif"><text x="50" y="65" fontSize="5">♛</text><text x="50" y="73" fontSize="7" letterSpacing=".8">ANITASET</text><text x="50" y="80" fontSize="4.5">GEL POLISH</text></g>
    </g>
  </svg>;

  if (onClick) return <button type="button" aria-label={accessibleLabel} title={accessibleLabel} onClick={onClick} className={`polish-bottle-button ${className}`.trim()}>{bottle}</button>;
  return <span role="img" aria-label={accessibleLabel} title={accessibleLabel} className={`polish-bottle-static ${className}`.trim()}>{bottle}</span>;
}
