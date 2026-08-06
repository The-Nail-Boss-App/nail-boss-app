import { DEFAULT_NAIL_MATERIAL, LEGACY_MATERIAL_ALIASES, NAIL_MATERIAL_PRESETS, resolveMaterialMaps, resolveNailMaterial, resolvePigment } from "./materialFoundation";

describe("hybrid nail material foundation", () => {
  test.each(["Cream", "Jelly", "Matte", "Glass", "Chrome-ready"])("resolves the %s preset", (finish) => {
    expect(resolveNailMaterial(finish)).toEqual(NAIL_MATERIAL_PRESETS[finish]);
  });

  test("falls back to Cream and maps legacy finish names", () => {
    expect(resolveNailMaterial("unknown")).toEqual(DEFAULT_NAIL_MATERIAL);
    expect(resolveNailMaterial("solid").id).toBe("cream");
    expect(resolveNailMaterial("chrome-ready").id).toBe("chrome-ready");
    expect(LEGACY_MATERIAL_ALIASES.jelly).toBe("Jelly");
  });

  test("clamps material overrides without mutating the central preset", () => {
    const result = resolveNailMaterial("Jelly", { transmission: 9, roughness: -2, clearCoat: "invalid" });
    expect(result).toMatchObject({ transmission: 1, roughness: 0, clearCoat: NAIL_MATERIAL_PRESETS.Jelly.clearCoat });
    expect(NAIL_MATERIAL_PRESETS.Jelly.transmission).toBe(.48);
  });

  test("uses null procedural fallbacks for missing or unsafe maps", () => {
    expect(resolveMaterialMaps({ reflection: "https://untrusted.example/map.png", normal: "", texture: "/assets/polish.png" })).toEqual({ texture: "/assets/polish.png", roughness: null, reflection: null, normal: null, height: null, gloss: null, noise: null, detail: null });
  });

  test("normalizes pigment separately from the material", () => {
    expect(resolvePigment({ baseColor: "#aa00cc", opacity: 4, pigmentStrength: -.2 })).toEqual({ baseColor: "#AA00CC", opacity: 1, saturation: 1, tint: 0, pigmentStrength: 0 });
  });
});
