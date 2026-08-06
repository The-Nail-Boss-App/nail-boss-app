import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PolishDefs, PolishSurface } from "./PolishRenderer";

const nail = { shape: "Almond", length: 1, width: 1, freeEdgeThickness: .5, baseColorHex: "#E8A0BF" };
const path = "M70 18 Q120 0 170 18 L160 310 Q120 340 80 310Z";

function renderFinish(polishType, extra = {}) {
  return renderToStaticMarkup(<svg viewBox="0 0 240 340"><defs><clipPath id="mask"><path d={path}/></clipPath><PolishDefs uid="foundation"/></defs><PolishSurface nail={nail} baseLayer={{ data: { polishType, colorHex: "#A41432", ...extra } }} path={path} clipId="mask" uid="foundation"/></svg>);
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

  test("renders valid maps and keeps the procedural fallback for invalid maps", () => {
    const markup = renderFinish("Cream", { materialMaps: { reflection: "/maps/studio.webp", normal: "https://unsafe.invalid/normal.png" } });
    expect(markup).toContain('data-material-map="reflection"');
    expect(markup).toContain('href="/maps/studio.webp"');
    expect(markup).not.toContain("unsafe.invalid");
    expect(markup).toContain('data-map-fallback="procedural"');
  });
});
