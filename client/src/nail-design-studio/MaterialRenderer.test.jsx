import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { creamGlossResponse, jellyTransmissionPalette, MATERIAL_PROFILES, MaterialLayers, renderHybridJellySafely } from './MaterialRenderer';
import { HYBRID_JELLY_LAYER_ORDER, JELLY_MATERIAL_PROFILE } from './HybridMaterialRenderer';
import { FINISH_DEFAULTS, normalizePolishForFinish } from './polishFinish';

const PATH = 'M10 0h40v100H10Z';
const renderMaterial = (finish, color = '#B7103A', opacity = 1, shine = .68) => renderToStaticMarkup(
  <svg><MaterialLayers path={PATH} finish={finish} color={color} opacity={opacity} shine={shine} uid="test-material"/></svg>,
);

describe('Jelly Material Engine', () => {
  test('routes only Jelly through the isolated hybrid renderer', () => {
    expect(renderMaterial('Jelly')).toContain('data-material-renderer="HybridMaterialRenderer"');
    for (const finish of ['Cream', 'Matte', 'Glitter']) expect(renderMaterial(finish)).toContain('data-material-renderer="MaterialRenderer"');
  });

  test('falls back safely when hybrid composition fails', () => {
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    expect(renderHybridJellySafely({}, () => { throw new Error('map failed'); })).toBeNull();
    expect(warning).toHaveBeenCalledWith(expect.stringContaining('legacy Jelly'), expect.any(Error));
    warning.mockRestore();
  });

  test('locks the clipped hybrid layer order and clear top coat', () => {
    const markup = renderMaterial('Jelly', '#A40A30', .52);
    let cursor = -1;
    HYBRID_JELLY_LAYER_ORDER.forEach((layer) => {
      const next = markup.indexOf(`data-material-layer="${layer}"`);
      expect(next).toBeGreaterThan(cursor); cursor = next;
    });
    expect(markup).toContain('clip-path="url(#test-material-hybrid-mask)"');
    expect(markup).toContain('data-top-coat-pigment="none"');
    expect(JELLY_MATERIAL_PROFILE).toMatchObject({ id: 'hybrid-jelly', texture: null, pigmentRange: [.48, .62], transmissionRange: [.28, .18], edgeAbsorption: .3, reflectionWidth: .18, reflectionStrength: .34, topCoatPigment: null });
    expect(markup).toContain('data-material-contract="hybrid-jelly"');
  });
  test('locks the Cream, Matte, and Glitter material baselines', () => {
    expect(MATERIAL_PROFILES.Cream).toEqual({ opacity: 1, edge: .14, curvature: .16, reflection: .66, topCoat: .52, diffuse: .01, grain: 0, transmission: 0 });
    expect(MATERIAL_PROFILES.Matte).toEqual({ opacity: 1, edge: .14, curvature: .24, reflection: .018, topCoat: .012, diffuse: .12, grain: 0, transmission: 0 });
    expect(MATERIAL_PROFILES.Jelly).toEqual({ opacity: .68, edge: .48, curvature: .24, reflection: .9, topCoat: .58, diffuse: .04, grain: 0, transmission: .42 });
    expect(MATERIAL_PROFILES.Glitter).toEqual({ opacity: .94, edge: .3, curvature: .28, reflection: .7, topCoat: .5, diffuse: .06, grain: 0, transmission: .08 });

    for (const finish of ['Cream', 'Matte', 'Glitter']) {
      const markup = renderMaterial(finish);
      expect(markup).toContain('data-material-layer="base-pigment"');
      expect(markup).toContain('data-material-layer="curvature-shadow"');
      expect(markup).toContain('data-material-layer="edge-darkening"');
      expect(markup).toContain(finish === 'Cream' ? 'fill="#FFFFFF"' : finish === 'Matte' ? 'matte-diffuse' : 'fill="#f5edf2"');
      expect(markup).toContain('stop-color="#fff"');
      expect(markup).not.toContain('data-material-layer="base-jelly-pigment"');
    }
  });

  test.each(['#050505', '#B7103A', '#07152F', '#0B5D45', '#E8A0BF', '#B9A2D0'])('keeps MAT-F04 pigment opaque and hue-faithful for %s', (color) => {
    const markup = renderMaterial('Matte', color, 1, 1);
    expect(markup).toContain('data-material-contract="mat-f04-smooth-matte-gel"');
    expect(markup).toContain(`data-material-layer="base-pigment" d="${PATH}" fill="${color}" opacity="1"`);
    expect(markup).toContain('data-optical-color-model="matte-achromatic"');
    expect(markup).toContain('data-clear-coat-reflection="0.018"');
    expect(markup).toContain('data-clear-coat-top-coat="0.012"');
    expect(markup).not.toContain('data-material-layer="surface-detail"');
    expect(markup).not.toContain('linearGradient id="test-material-reflection"');
  });

  test('retains broad diffuse form with less specular response than Cream and Jelly', () => {
    const matte = renderMaterial('Matte');
    expect(MATERIAL_PROFILES.Matte.reflection).toBeLessThan(MATERIAL_PROFILES.Cream.reflection);
    expect(MATERIAL_PROFILES.Matte.reflection).toBeLessThan(MATERIAL_PROFILES.Jelly.reflection);
    expect(MATERIAL_PROFILES.Matte.diffuse).toBeGreaterThan(0);
    expect(MATERIAL_PROFILES.Matte.curvature).toBeGreaterThan(0);
    expect(matte).toContain('id="test-material-matte-diffuse"');
    expect(matte).toContain('gradientTransform="matrix(.72 0 0 1 .1 0)"');
    expect(matte).toContain('data-material-layer="cuticle-tip-depth"');
  });

  test('models Cream as opaque pigment under a shine-controlled clear coat', () => {
    const responses = [0, .25, .5, .75, 1].map(creamGlossResponse);
    for (let index = 1; index < responses.length; index += 1) {
      expect(responses[index].reflection).toBeGreaterThan(responses[index - 1].reflection);
      expect(responses[index].topCoat).toBeGreaterThan(responses[index - 1].topCoat);
    }
    expect(responses[0]).toEqual({ reflection: .24, secondaryReflection: .04, topCoat: .22 });
    const zero = renderMaterial('Cream', '#0D0D0D', 1, 0);
    expect(zero).toContain('data-material-shine="0.00"');
    expect(zero).toContain('data-clear-coat-reflection="0.240"');
    expect(zero).toContain('data-clear-coat-top-coat="0.220"');
    expect(zero).toContain('data-material-layer="secondary-reflection"');
    expect(zero).not.toContain('data-material-layer="internal-light-transmission"');
  });

  test('calibrates a narrow asymmetric primary and a weaker offset secondary clear-coat reflection', () => {
    const markup = renderMaterial('Cream', '#000000', 1, .68);
    expect(markup).toContain('data-reflection-role="primary" data-reflection-width="18%" cx="39%"');
    expect(markup).toContain('data-reflection-role="secondary" data-reflection-width="9%" cx="73%"');
    expect(18).toBeLessThan(42); // the merged MAT-F02 broad primary transform was 42%
    expect(39).not.toBe(50);
    const response = creamGlossResponse(.68);
    expect(response.secondaryReflection).toBeLessThan(response.reflection);
    expect(markup).toContain('stop-opacity=".08"');
    expect(MATERIAL_PROFILES.Cream.curvature).toBeLessThan(.2);
  });

  test.each([0, .25, .5, .68, .75, 1])('keeps pigment fixed while Shine %p scales only Cream clear-coat response', (shine) => {
    const black = renderMaterial('Cream', '#000000', 1, shine);
    const nearBlack = renderMaterial('Cream', '#0D0D0D', 1, shine);
    expect(black.match(/stop-color="#000000"/g).length).toBeGreaterThanOrEqual(3);
    expect(nearBlack.match(/stop-color="#0D0D0D"/g).length).toBeGreaterThanOrEqual(3);
    expect(black).toContain('data-material-profile="CreamMaterial"');
    expect(black).not.toContain('ChromeMaterial');
    expect(black).not.toContain('MatteMaterial');
  });

  test.each(['#000000', '#FFFFFF', '#991435', '#07152F', '#E8A0BF'])('keeps Cream pigment identity for %s while every optical token is achromatic', (color) => {
    const markup = renderMaterial('Cream', color);
    expect(markup).toContain(`data-material-input-color="${color}"`);
    expect(markup).toContain(`data-material-base-color="${color}"`);
    expect(markup).toContain('data-optical-color-model="neutral-achromatic"');
    expect(markup.match(new RegExp(`stop-color="${color}"`, 'g')).length).toBeGreaterThanOrEqual(3);
    expect(markup).not.toMatch(/#170812|#200914|#130710|#190a14|#f5edf2/i);
    const opticalColors = [...markup.matchAll(/(?:stop-color|fill|stroke)="(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})"/g)].map((match) => match[1]);
    expect(opticalColors.every((token) => token.toUpperCase() === color.toUpperCase() || /^#(?:000(?:000)?|FFF(?:FFF)?)$/i.test(token))).toBe(true);
  });

  test.each(['#A40A30', '#2457C5', '#7B2CBF', '#0B7A53', '#E85D04', '#6B3A2E', '#F06292', '#E6B800'])('preserves the hue family of %s through every Jelly tone', (color) => {
    const tones = jellyTransmissionPalette(color);
    const markup = renderMaterial('Jelly', color, .55);
    expect(tones.body).toBe(color);
    expect(new Set(Object.values(tones)).size).toBe(4);
    for (const tone of Object.values(tones)) expect(markup).toContain(`stop-color="${tone}"`);
    expect(markup).toContain('data-material-layer="curvature-shadow"');
    expect(markup).toContain('data-material-layer="edge-depth"');
    expect(markup).toContain('data-material-layer="jelly-transmission"');
    expect(markup).not.toMatch(/stop-color="(?:gray|silver)"/i);
  });

  test('uses cherry, wine, and burgundy transmission tones for the reported red failure', () => {
    expect(jellyTransmissionPalette('#A40A30')).toEqual({ transmission: '#E30E43', body: '#A40A30', edge: '#700721', depth: '#4B0516' });
    const markup = renderMaterial('Jelly', '#A40A30', .52);
    expect(markup).toContain('data-reflection-width="18%"');
    expect(markup).toContain('data-reflection-role="soft-clear-coat"');
    expect(markup).not.toMatch(/(?:gray|silver|lavender)/i);
  });

  test('uses transparency as transmission and pigment concentration rather than desaturation', () => {
    const clearer = renderMaterial('Jelly', '#087F5B', .2);
    const richer = renderMaterial('Jelly', '#087F5B', .9);
    expect(clearer).toContain('data-jelly-pigment-concentration="0.508"');
    expect(clearer).toContain('data-jelly-transmission="0.260"');
    expect(richer).toContain('data-jelly-pigment-concentration="0.606"');
    expect(richer).toContain('data-jelly-transmission="0.190"');
    expect(clearer).toContain('data-material-layer="base-pigment"');
    expect(richer).toContain('data-material-layer="jelly-transmission"');
    expect(clearer).not.toMatch(/stop-color="(?:gray|silver)"/i);
    expect(richer).not.toMatch(/stop-color="(?:gray|silver)"/i);
  });

  test('keeps Jelly optical behavior isolated from protected finish contracts', () => {
    expect(FINISH_DEFAULTS.Cream).toEqual({ baseColor: '#D94C70', opacity: 1, viscosity: .62, shine: .68 });
    expect(FINISH_DEFAULTS.Matte).toEqual({ baseColor: '#D94C70', opacity: 1, viscosity: .66, shine: .08, matteSoftness: .72 });
    expect(FINISH_DEFAULTS.Glass).toEqual({ baseColor: '#D94C70', translucency: .28, opacity: .82, viscosity: .44, shine: .92, glassClarity: .78 });
    expect(FINISH_DEFAULTS['Chrome-ready']).toEqual({ baseColor: '#D94C70', opacity: 1, viscosity: .64, shine: .88, metallicReflection: .35 });
    for (const finish of ['Cream', 'Matte', 'Glass', 'Chrome-ready']) {
      const markup = renderMaterial(finish);
      expect(markup).toContain(`data-material-profile="${finish}Material"`);
      expect(markup).not.toContain('data-material-contract="hybrid-jelly"');
    }
  });

  test('hydrates Jelly and preserves its contract across Jelly → Cream → Jelly switching', () => {
    const saved = normalizePolishForFinish({ colorHex: '#2457C5', finish: 'Jelly', translucency: .64, opacity: .73 }, 'Jelly');
    expect(saved).toMatchObject({ colorHex: '#2457C5', finish: 'Jelly', translucency: .64, opacity: .73 });
    const cream = normalizePolishForFinish(saved, 'Cream');
    const jelly = normalizePolishForFinish(cream, 'Jelly');
    expect(renderMaterial(cream.finish, cream.colorHex)).toContain('data-material-profile="CreamMaterial"');
    expect(renderMaterial(jelly.finish, jelly.colorHex, jelly.opacity)).toContain('data-material-contract="hybrid-jelly"');
  });

  test('keeps Jelly and Glass on visibly separate material routes', () => {
    const jelly = renderMaterial('Jelly', '#F06292', .55);
    const glass = renderMaterial('Glass', '#F06292', .55);
    expect(jelly).toContain('data-material-renderer="HybridMaterialRenderer"');
    expect(glass).toContain('data-material-profile="GlassMaterial"');
    expect(glass).not.toContain('data-jelly-pigment-concentration');
  });
});
