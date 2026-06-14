import { getNailGeometry, normalizedToSvg } from "./blueprint.js";

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
  return {
    assetId: layer?.data?.assetId || "",
    colorHex: layer?.data?.colorHex || "#FFFFFF",
    inlineSvg: layer?.data?.svg || "",
    opacity: layer?.opacity ?? 1,
    outerTransform: null,
    innerTransform: `translate(${point.x} ${point.y}) rotate(${transform.rotation ?? 0}) scale(${(size * scaleX) / 84} ${(size * scaleY) / 84})`,
  };
}
