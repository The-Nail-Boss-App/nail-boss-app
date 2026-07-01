import { VIEWBOX, clamp, getNailFreeEdgeExtent, getNailGeometry, normalizeFrenchTipData } from "./blueprint.js";
import { SharedPolishRealismLayers } from "./PolishRenderer.jsx";
import { PatternDefs, resolvePatternColors } from "./NailCanvas.jsx";
import { resolvePolishDataForRender } from "./polish.js";

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
  const transform = rotatePath(rotation, VIEWBOX.cx, getNailGeometry(nail).bottomY);
  const frenchMaterialClipId = `${clipId}-${layer.id}-french-realism-clip`;
  const frenchPatternClipId = `${clipId}-${layer.id}-french-pattern-clip`;
  const frenchPatternId = `${clipId}-${layer.id}-french-pattern`;
  const patternColors = resolvePatternColors({
    pattern: data.pattern || "dots",
    colorHex: data.patternColorHex || data.colorHex,
    secondaryColorHex: data.patternSecondaryColorHex || "#3B1F35",
    patternColorHex3: data.patternColorHex3,
    patternColorHex4: data.patternColorHex4,
  });
  const patternLayer = {
    ...layer,
    transform: {
      ...(layer.transform || {}),
      scaleX: data.patternScale ?? 1,
      scaleY: data.patternScale ?? 1,
      rotation: data.patternRotation ?? 0,
      x: data.patternOffsetX ?? 0.5,
      y: data.patternOffsetY ?? 0.5,
    },
    data: {
      pattern: data.pattern || "dots",
      colorHex: patternColors.colorHex,
      secondaryColorHex: patternColors.secondaryColorHex,
      patternColorHex3: patternColors.patternColorHex3,
      patternColorHex4: patternColors.patternColorHex4,
      density: data.patternSpacing ?? 0.5,
    },
  };
  const baseLayer = (nail?.layers || []).find((candidate) => candidate.type === "base");
  const material = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || data.colorHex);
  const layerOpacity = clamp(Number(layer.opacity ?? 1), 0, 1);
  const patternOpacity = clamp(Number(data.patternOpacity ?? 1), 0, 1);
  return <g clipPath={`url(#${clipId})`} opacity={layerOpacity} pointerEvents="none" data-layer-type="frenchTip" data-french-tip-style={data.style} data-realism-renderer="shared-polish-material-engine">
    <defs><clipPath id={frenchMaterialClipId}><path d={path}/></clipPath><clipPath id={frenchPatternClipId}><path d={path}/></clipPath>{data.fillType === "pattern" && <PatternDefs layer={patternLayer} id={frenchPatternId}/>}</defs>
    <g transform={transform}>
      {data.fillType === "pattern" ? <g clipPath={`url(#${frenchPatternClipId})`} data-french-tip-fill="pattern" data-french-tip-pattern={data.pattern} data-french-tip-pattern-opacity={patternOpacity} opacity={patternOpacity}><path d={path} fill={data.colorHex}/><rect x="0" y="0" width={VIEWBOX.width} height={VIEWBOX.height} fill={`url(#${frenchPatternId})`}/></g> : <path d={path} fill={data.colorHex} stroke={thumbnail ? "none" : "rgba(59,31,53,.08)"} strokeWidth={thumbnail ? 0 : 1.1}/>}
      <SharedPolishRealismLayers nail={nail} path={path} clipId={frenchMaterialClipId} uid={clipId} shine={material.shine ?? 0.74} colorHex={data.fillType === "pattern" ? (data.patternColorHex || data.colorHex) : data.colorHex} polishType={material.polishType || "Cream"} materialScope="french-tip"/>
      <path data-realism-layer="top-coat-continuity-seam" d={path} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={thumbnail ? 0.8 : 1.2}/>
    </g>
  </g>;
}
