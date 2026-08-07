import { DEFAULT_NAIL_MATERIAL, LEGACY_MATERIAL_ALIASES, NAIL_MATERIAL_PRESETS, resolveMaterialMaps, resolveNailMaterial, resolvePigment } from "./materialFoundation";

describe("hybrid nail material foundation", () => {
  test("calibrates Cream as opaque, non-metallic gel beneath an active clear coat", () => {
    const cream = resolveNailMaterial("Cream");
    expect(cream).toMatchObject({ id: "cream", opacity: 1, translucency: 0, transmission: 0, metallic: 0 });
    expect(cream.clearCoat).toBeGreaterThan(.85);
    expect(cream.clearCoatRoughness).toBeLessThan(.1);
    expect(cream.specularStrength).toBeGreaterThan(0);
    expect(cream.reflectionStrength).toBeGreaterThan(0);
  });

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

  test("keeps non-Cream optical presets at their MAT-F01 values", () => {
    expect(NAIL_MATERIAL_PRESETS.Jelly).toEqual({ id: "jelly", opacity: .68, translucency: .58, roughness: .1, smoothness: .9, specularStrength: .78, reflectionStrength: .82, diffusion: .02, transmission: .48, scattering: .22, thicknessInfluence: .82, metallic: 0, clearCoat: .86, clearCoatRoughness: .08 });
    expect(NAIL_MATERIAL_PRESETS.Matte).toEqual({ id: "matte", opacity: .96, translucency: 0, roughness: .92, smoothness: .08, specularStrength: .08, reflectionStrength: .045, diffusion: .2, transmission: 0, scattering: .12, thicknessInfluence: .2, metallic: 0, clearCoat: .04, clearCoatRoughness: .94 });
    expect(NAIL_MATERIAL_PRESETS.Glass).toEqual({ id: "glass", opacity: .3, translucency: .86, roughness: .04, smoothness: .96, specularStrength: .94, reflectionStrength: .94, diffusion: 0, transmission: .88, scattering: .06, thicknessInfluence: .94, metallic: 0, clearCoat: .94, clearCoatRoughness: .03 });
  });
});
