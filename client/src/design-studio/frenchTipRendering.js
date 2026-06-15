import { VIEWBOX, clamp, getNailFreeEdgeExtent, getNailGeometry, normalizeFrenchTipData } from "./blueprint.js";

function rotatePath(rotation, cx, cy) {
  return rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined;
}

export function frenchTipPath(layer, nail) {
  const data = normalizeFrenchTipData(layer?.data || {});
  const g = getNailGeometry(nail);
  const freeEdge = getNailFreeEdgeExtent(nail);
  const renderBottomY = freeEdge.renderBottomY;
  const width = g.width * data.smileWidth;
  const left = g.cx - width / 2;
  const right = g.cx + width / 2;
  const tipY = g.bottomY - g.height * data.tipHeight;
  const depth = g.height * data.smileDepth;
  const curveLift = g.height * data.smileCurve * 0.12;
  const angleOffset = data.style === "angled" ? g.height * 0.18 : 0;
  const yLeft = clamp(tipY - angleOffset, g.topY, g.bottomY);
  const yRight = clamp(tipY + angleOffset, g.topY, g.bottomY);
  const centerY = clamp(tipY + depth + curveLift, g.topY, g.bottomY);

  if (data.style === "reverse") {
    const cutY = clamp(g.topY + g.height * data.tipHeight, g.topY, g.bottomY);
    const cupY = clamp(cutY - depth - curveLift, g.topY, g.bottomY);
    return `M ${g.left} ${g.topY} L ${g.right} ${g.topY} L ${right} ${cutY} Q ${g.cx} ${cupY} ${left} ${cutY} Z`;
  }

  if (data.style === "v") {
    const pointY = clamp(tipY + depth + g.height * 0.08, g.topY, g.bottomY);
    return `M ${left} ${tipY} L ${g.cx} ${pointY} L ${right} ${tipY} L ${g.right} ${renderBottomY} L ${g.left} ${renderBottomY} Z`;
  }

  const deepBoost = data.style === "deep" ? g.height * 0.12 : 0;
  const qY = clamp(centerY + deepBoost, g.topY, g.bottomY);
  return `M ${left} ${yLeft} Q ${g.cx} ${qY} ${right} ${yRight} L ${g.right} ${renderBottomY} L ${g.left} ${renderBottomY} Z`;
}

export function FrenchTipShape({ layer, nail, clipId, thumbnail = false }) {
  const data = normalizeFrenchTipData(layer?.data || {});
  const path = frenchTipPath(layer, nail);
  const rotation = data.style === "angled" ? data.rotation || 0 : data.rotation;
  return <g clipPath={`url(#${clipId})`} opacity={layer.opacity} pointerEvents="none" data-layer-type="frenchTip" data-french-tip-style={data.style}>
    <path d={path} fill={data.colorHex} transform={rotatePath(rotation, VIEWBOX.cx, getNailGeometry(nail).bottomY)} stroke={thumbnail ? "none" : "rgba(59,31,53,.12)"} strokeWidth={thumbnail ? 0 : 1.5}/>
  </g>;
}
