import React, { act } from "react";
import { createRoot } from "react-dom/client";
import DesignStudio from "./DesignStudio";
import { resolvePigment } from "./materialFoundation";
import { resolvePolishDataForRender } from "./polish";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// NailCanvas contains a Vite-only development guard that react-scripts/Jest
// cannot parse. Keep this integration test on the real DesignStudio state path
// and real polish renderer while replacing only the unrelated canvas shell.
jest.mock("./NailCanvas.jsx", () => {
  const React = require("react");
  const { PolishSurface } = require("./PolishRenderer");
  return {
    __esModule: true,
    patternColorSlots: () => [],
    default: ({ nail, layers }) => {
      const baseLayer = layers.find((layer) => layer.type === "base");
      return <svg><PolishSurface nail={nail} baseLayer={baseLayer} path="M0 0L10 0L10 10Z" clipId="test-mask" uid="live-state" /></svg>;
    },
  };
});
jest.mock("./FullSetPreview.jsx", () => () => null);

const setInputValue = (input, value) => {
  Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
};

describe("MAT-F02R2 live pigment state", () => {
  let container;
  let root;

  beforeEach(async () => {
    window.localStorage.clear();
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => [] }));
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<DesignStudio />));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  test.each(["#000000", "#FFFFFF", "#991435", "#07152F", "#E8A0BF"])(
    "carries UI selection %s through the active layer, renderer resolution, and pigment fill",
    async (colorHex) => {
      const picker = container.querySelector('input[aria-label="Polish Color picker"]');
      await act(async () => setInputValue(picker, colorHex.toLowerCase()));

      const pigment = container.querySelector('[data-material-layer="base-pigment"]');
      expect(pigment.getAttribute("data-source-color")).toBe(colorHex);
      expect(pigment.getAttribute("data-resolved-color")).toBe(colorHex);
      expect(pigment.getAttribute("data-pigment-color")).toBe(colorHex);
      expect(pigment.getAttribute("fill")).toBe(colorHex);
      expect(resolvePolishDataForRender({ colorHex, polishType: "Cream" }, "#E8A0BF").colorHex).toBe(colorHex);
      expect(resolvePigment({ baseColor: colorHex }).baseColor).toBe(colorHex);
    },
  );

  test("never replaces explicit black with default pink and does not retain stale selections", async () => {
    const picker = container.querySelector('input[aria-label="Polish Color picker"]');
    for (const colorHex of ["#991435", "#000000", "#07152F", "#FFFFFF", "#000000"]) {
      await act(async () => setInputValue(picker, colorHex.toLowerCase()));
      const pigment = container.querySelector('[data-material-layer="base-pigment"]');
      expect(pigment.dataset.sourceColor).toBe(colorHex);
      expect(pigment.dataset.resolvedColor).toBe(colorHex);
      expect(pigment.getAttribute("fill")).toBe(colorHex);
      if (colorHex === "#000000") expect(pigment.outerHTML).not.toContain('fill="#E8A0BF"');
    }
  });

  test("keeps legacy fallback behavior only when a layer has no explicit color", () => {
    expect(resolvePolishDataForRender({}, "#345678").colorHex).toBe("#345678");
    expect(resolvePolishDataForRender({}, undefined).colorHex).toBe("#E8A0BF");
  });
});
