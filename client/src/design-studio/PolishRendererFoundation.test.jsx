import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PolishDefs, PolishSurface, SharedPolishRealismLayers } from "./PolishRenderer";

const nail = { shape: "Almond", length: 1, width: 1, freeEdgeThickness: .5, baseColorHex: "#E8A0BF" };
const path = "M70 18 Q120 0 170 18 L160 310 Q120 340 80 310Z";

function renderFinish(polishType, extra = {}) {
  return renderToStaticMarkup(<svg viewBox="0 0 240 340"><defs><clipPath id="mask"><path d={path}/></clipPath><PolishDefs uid="foundation"/></defs><PolishSurface nail={nail} baseLayer={{ data: { polishType, colorHex: "#A41432", ...extra } }} path={path} clipId="mask" uid="foundation"/></svg>);
}

function renderSharedSurface({ polishType = "Cream", colorHex = "#07152F", materialScope = "base-polish" } = {}) {
  return renderToStaticMarkup(<svg viewBox="0 0 240 340"><defs><clipPath id="shared-mask"><path d={path}/></clipPath><PolishDefs uid="shared"/></defs><SharedPolishRealismLayers nail={nail} path={path} clipId="shared-mask" uid="shared" colorHex={colorHex} polishType={polishType} materialScope={materialScope}/></svg>);
}

describe("Design Studio hybrid material renderer", () => {
  test.each([["Cream", "cream"], ["Jelly", "jelly"], ["Matte", "matte"], ["Glass", "glass"], ["Chrome-ready", "chrome-ready"]])("routes %s through its shared preset", (finish, id) => {
    const markup = renderFinish(finish);
    expect(markup).toContain('data-material-renderer="hybrid-layered"');
    expect(markup).toContain(`data-material-preset="${id}"`);
    expect(markup).toContain('data-render-layer="base-pigment"');
    expect(markup).toContain('data-render-layer="curvature-lighting"');
    expect(markup).toContain('data-render-layer="reflection"');
    expect(markup).toContain('data-render-layer="top-coat"');
    expect(markup).toContain('data-render-layer="detail-overlays"');
  });

  test("adds the generic thickness/transmission pass only when the preset requests it", () => {
    expect(renderFinish("Jelly")).toContain('data-material-layer="thickness-transmission"');
    expect(renderFinish("Glass")).toContain('data-material-layer="thickness-transmission"');
    expect(renderFinish("Cream")).not.toContain('data-material-layer="thickness-transmission"');
  });

  test("uses identical Cream material architecture for light and dark pigments", () => {
    const light = renderFinish("Cream", { colorHex: "#FFF8F0" });
    const dark = renderFinish("Cream", { colorHex: "#07152F" });
    const architecture = (markup) => Array.from(markup.matchAll(/data-render-layer="([^"]+)"/g), (match) => match[1]);
    expect(architecture(light)).toEqual(architecture(dark));
    expect(light).toContain('opacity="1"');
    expect(dark).toContain('opacity="1"');
    expect(light).not.toContain('data-material-layer="thickness-transmission"');
    expect(dark).not.toContain('data-material-layer="thickness-transmission"');
    expect(light).toContain('data-edge-response="cream-relative-luminance"');
    expect(dark).toContain('data-edge-response="cream-relative-luminance"');
  });

  test("uses a continuous luminance-derived edge boost only for Cream base polish", () => {
    const light = renderSharedSurface({ colorHex: "#FFF8F0" });
    const dark = renderSharedSurface({ colorHex: "#07152F" });
    const boost = (markup) => Number(markup.match(/data-edge-contrast-boost="([^"]+)"/)?.[1]);
    expect(boost(light)).toBeGreaterThanOrEqual(0);
    expect(boost(dark)).toBeGreaterThan(boost(light));
  });

  test.each(["Jelly", "Milky", "Matte", "Glass", "Chrome", "Chrome-ready", "Glitter"])("keeps %s on the MAT-F01 edge response", (polishType) => {
    const markup = renderSharedSurface({ polishType });
    expect(markup).toContain('data-edge-response="mat-f01-baseline"');
    expect(markup).toContain('data-edge-contrast-boost="0"');
    expect(markup).not.toContain('data-edge-response="cream-relative-luminance"');
  });

  test.each(["gradient-ombre", "gradient-polish-color", "french-tip"])("keeps %s shared rendering on the MAT-F01 edge response", (materialScope) => {
    const markup = renderSharedSurface({ polishType: "Cream", materialScope });
    expect(markup).toContain('data-edge-response="mat-f01-baseline"');
    expect(markup).toContain('data-edge-contrast-boost="0"');
  });

  test("renders valid maps and keeps the procedural fallback for invalid maps", () => {
    const markup = renderFinish("Cream", { materialMaps: { reflection: "/maps/studio.webp", normal: "https://unsafe.invalid/normal.png" } });
    expect(markup).toContain('data-material-map="reflection"');
    expect(markup).toContain('href="/maps/studio.webp"');
    expect(markup).not.toContain("unsafe.invalid");
    expect(markup).toContain('data-map-fallback="procedural"');
  });
});
