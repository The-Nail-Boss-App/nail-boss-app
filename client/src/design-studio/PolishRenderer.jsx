import { polishOpacity, resolvePolishDataForRender } from "./polish.js";

export function PolishDefs() {
  return null;
}

export function FlatNailSurfaceRenderer({ nail, baseLayer, path }) {
  const data = resolvePolishDataForRender(baseLayer?.data || {}, nail?.baseColorHex || "#E8A0BF");
  return <>
    <path d={path} fill={data.colorHex} opacity={polishOpacity({ ...data, polishType: "Cream" })}/>
    <path d={path} fill="none" stroke="rgba(59,31,53,.24)" strokeWidth="1.2" pointerEvents="none"/>
  </>;
}

export const PolishSurface = FlatNailSurfaceRenderer;
