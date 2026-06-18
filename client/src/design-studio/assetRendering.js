import { getNailArchitecture, getNailGeometry, normalizedToSvg } from "./blueprint.js";

export const RENDERABLE_ASSET_LAYER_TYPES = new Set(["charm", "jewel", "decal"]);

export function isRenderableAssetLayer(layer) {
  return RENDERABLE_ASSET_LAYER_TYPES.has(layer?.type) && layer.visible !== false;
}

export function assetLayerRenderProps(layer, nail) {
  const transform = layer?.transform || {};
  const geometry = getNailGeometry(nail);
  const point = normalizedToSvg(transform, nail);
  const scaleX = Math.abs(transform.scaleX ?? 0.18);
  const scaleY = Math.abs(transform.scaleY ?? scaleX);
  const size = Math.min(geometry.width, geometry.height);
  const arch = getNailArchitecture(nail);
  const yCurve = Math.max(-1, Math.min(1, ((point.y - arch.apex.y) / Math.max(1, arch.height * 0.5))));
  const contactOpacity = layer?.type === "decal" ? 0.16 : layer?.type === "jewel" ? 0.28 : 0.22;
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

export function AssetSpecularAccent({ layer, render }) {
  if (!render || !["jewel", "charm"].includes(layer?.type)) return null;
  const r = Math.max(1.8, Math.min(render.size * render.scaleX, render.size * render.scaleY) * (layer.type === "jewel" ? 0.08 : 0.055));
  return <g data-realism-layer="asset-specular-accent" pointerEvents="none">
    <circle cx={render.point.x - render.size * render.scaleX * 0.12} cy={render.point.y - render.size * render.scaleY * 0.14} r={r} fill="#fff" opacity={layer.type === "jewel" ? ".72" : ".42"}/>
    <path d={`M ${render.point.x + render.size * render.scaleX * 0.08} ${render.point.y - render.size * render.scaleY * 0.18} l ${r * 0.7} ${r * 0.2}`} stroke="#fff" strokeWidth={Math.max(1, r * 0.38)} strokeLinecap="round" opacity=".38"/>
  </g>;
}
