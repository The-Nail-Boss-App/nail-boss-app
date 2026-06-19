import { getNailArchitecture, getNailGeometry, normalizedToSvg } from "./blueprint.js";

export const RENDERABLE_ASSET_LAYER_TYPES = new Set(["charm", "jewel", "decal"]);

export function isRenderableAssetLayer(layer) {
  return RENDERABLE_ASSET_LAYER_TYPES.has(layer?.type) && layer.visible !== false;
}

export function assetLayerRenderProps(layer, nail, artProfile = {}) {
  const transform = layer?.transform || {};
  const geometry = getNailGeometry(nail);
  const point = normalizedToSvg(transform, nail);
  const scaleX = Math.abs(transform.scaleX ?? 0.18);
  const scaleY = Math.abs(transform.scaleY ?? scaleX);
  const size = Math.min(geometry.width, geometry.height);
  const arch = getNailArchitecture(nail);
  const yCurve = Math.max(-1, Math.min(1, ((point.y - arch.apex.y) / Math.max(1, arch.height * 0.5))));
  const materialDepth = artProfile?.material?.depth ?? 0.78;
  const contactOpacity = layer?.type === "decal" ? 0.13 + materialDepth * 0.06 : layer?.type === "jewel" ? 0.24 + materialDepth * 0.08 : 0.2 + materialDepth * 0.07;
  const surfaceBlendOpacity = layer?.type === "decal" ? (artProfile.polishType === "Jelly" ? 0.18 : artProfile.polishType === "Milky" ? 0.13 : artProfile.polishType === "Matte" ? 0.08 : 0.1) : 0;
  return {
    assetId: layer?.data?.assetId || "",
    colorHex: layer?.data?.colorHex || "#FFFFFF",
    opacity: layer?.opacity ?? 1,
    outerTransform: null,
    point,
    size,
    scaleX,
    scaleY,
    rotation: transform.rotation ?? 0,
    surfaceBlendOpacity,
    contactShadow: {
      cx: point.x + arch.width * 0.012,
      cy: point.y + size * scaleY * (0.22 + yCurve * 0.03),
      rx: size * scaleX * 0.34,
      ry: size * scaleY * 0.12,
      opacity: contactOpacity,
    },
    innerTransform: `translate(${point.x} ${point.y}) rotate(${transform.rotation ?? 0}) scale(${(size * scaleX) / 84} ${(size * scaleY) / 84})`,
  };
}

export function AssetContactShadow({ render, uid }) {
  if (!render?.contactShadow) return null;
  const s = render.contactShadow;
  return <ellipse data-realism-layer="asset-contact-shadow" cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#1a0815" opacity={s.opacity} filter={uid ? `url(#${uid}-asset-shadow-blur)` : undefined}/>;
}

export function AssetSurfaceBlend({ layer, render }) {
  if (!render || layer?.type !== "decal" || !render.surfaceBlendOpacity) return null;
  return <g data-realism-layer="decal-surface-blending" pointerEvents="none" transform={render.innerTransform}>
    <rect x="-42" y="-42" width="84" height="84" rx="18" fill="#fff" opacity={render.surfaceBlendOpacity}/>
    <path d="M -30 -18 C -10 -32 16 -28 34 -10" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity={render.surfaceBlendOpacity * 0.75} fill="none"/>
  </g>;
}

export function AssetSpecularAccent({ layer, render }) {
  if (!render || !["jewel", "charm"].includes(layer?.type)) return null;
  const r = Math.max(1.8, Math.min(render.size * render.scaleX, render.size * render.scaleY) * (layer.type === "jewel" ? 0.08 : 0.055));
  return <g data-realism-layer="asset-specular-accent" data-realism-depth="improved-highlight-depth" pointerEvents="none">
    <circle cx={render.point.x - render.size * render.scaleX * 0.12} cy={render.point.y - render.size * render.scaleY * 0.14} r={r} fill="#fff" opacity={layer.type === "jewel" ? ".72" : ".42"}/>
    <path d={`M ${render.point.x + render.size * render.scaleX * 0.08} ${render.point.y - render.size * render.scaleY * 0.18} l ${r * 0.7} ${r * 0.2}`} stroke="#fff" strokeWidth={Math.max(1, r * 0.38)} strokeLinecap="round" opacity=".38"/>
    <circle cx={render.point.x + render.size * render.scaleX * 0.02} cy={render.point.y + render.size * render.scaleY * 0.12} r={r * 1.28} fill="#1a0815" opacity={layer.type === "jewel" ? ".16" : ".11"}/>
  </g>;
}
