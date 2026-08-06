import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { jellyTransmissionPalette, MATERIAL_PROFILES, MaterialLayers, renderHybridJellySafely } from './MaterialRenderer';
import { HYBRID_JELLY_LAYER_ORDER, JELLY_MATERIAL_PROFILE } from './HybridMaterialRenderer';

const PATH = 'M10 0h40v100H10Z';
const renderMaterial = (finish, color = '#B7103A', opacity = 1) => renderToStaticMarkup(
  <svg><MaterialLayers path={PATH} finish={finish} color={color} opacity={opacity} uid="test-material"/></svg>,
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
    expect(JELLY_MATERIAL_PROFILE).toMatchObject({ texture: null, reflectionWidth: .1, topCoatPigment: null });
  });
  test('locks the Cream, Matte, and Glitter material baselines', () => {
    expect(MATERIAL_PROFILES.Cream).toEqual({ opacity: 1, edge: .34, curvature: .32, reflection: .78, topCoat: .44, diffuse: .08, grain: 0, transmission: 0 });
    expect(MATERIAL_PROFILES.Matte).toEqual({ opacity: .96, edge: .18, curvature: .18, reflection: .06, topCoat: .04, diffuse: .34, grain: .28, transmission: 0 });
    expect(MATERIAL_PROFILES.Glitter).toEqual({ opacity: .94, edge: .3, curvature: .28, reflection: .7, topCoat: .5, diffuse: .06, grain: 0, transmission: .08 });

    for (const finish of ['Cream', 'Matte', 'Glitter']) {
      const markup = renderMaterial(finish);
      expect(markup).toContain('data-material-layer="base-pigment"');
      expect(markup).toContain('data-material-layer="curvature-shadow"');
      expect(markup).toContain('data-material-layer="edge-darkening"');
      expect(markup).toContain('fill="#f5edf2"');
      expect(markup).toContain('stop-color="#fff"');
      expect(markup).not.toContain('data-material-layer="base-jelly-pigment"');
    }
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
    expect(markup).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
  });

  test('uses cherry, wine, and burgundy transmission tones for the reported red failure', () => {
    expect(jellyTransmissionPalette('#A40A30')).toEqual({ transmission: '#E30E43', body: '#A40A30', edge: '#700721', depth: '#4B0516' });
    const markup = renderMaterial('Jelly', '#A40A30', .52);
    expect(markup).toContain('data-reflection-width="10%"');
    expect(markup).not.toMatch(/(?:#fff(?:fff)?|white|gray|silver|lavender)/i);
  });

  test('uses transparency as transmission and pigment concentration rather than desaturation', () => {
    const clearer = renderMaterial('Jelly', '#087F5B', .2);
    const richer = renderMaterial('Jelly', '#087F5B', .9);
    expect(clearer).toContain('data-jelly-pigment-concentration="0.776"');
    expect(clearer).toContain('data-jelly-transmission="0.604"');
    expect(richer).toContain('data-jelly-pigment-concentration="0.902"');
    expect(richer).toContain('data-jelly-transmission="0.478"');
    expect(clearer).toContain('data-material-layer="base-pigment"');
    expect(richer).toContain('data-material-layer="jelly-transmission"');
    expect(clearer).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
    expect(richer).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
  });
});
