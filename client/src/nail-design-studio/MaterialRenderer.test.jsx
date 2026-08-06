import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MATERIAL_PROFILES, MaterialLayers } from './MaterialRenderer';

const PATH = 'M10 0h40v100H10Z';
const renderMaterial = (finish, color = '#B7103A', opacity = 1) => renderToStaticMarkup(
  <svg><MaterialLayers path={PATH} finish={finish} color={color} opacity={opacity} uid="test-material"/></svg>,
);

describe('Jelly Material Engine', () => {
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

  test.each(['#B7103A', '#FF69B4', '#6A0DAD', '#087F5B', '#102A72', '#5C2A18', '#E85D04', '#E0B400'])('keeps %s as the color in every Jelly light layer', (color) => {
    const markup = renderMaterial('Jelly', color, .55);
    expect(markup).toContain('data-material-layer="internal-color-depth"');
    expect(markup).toContain('data-material-layer="edge-concentration"');
    expect(markup).toContain('data-material-layer="tip-concentration"');
    expect(markup).toContain('data-material-layer="colored-light-transmission"');
    expect(markup).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
    expect(markup.match(new RegExp(`stop-color="${color}"`, 'gi')).length).toBeGreaterThan(12);
  });

  test('uses transparency as transmission and pigment concentration rather than desaturation', () => {
    const clearer = renderMaterial('Jelly', '#087F5B', .2);
    const richer = renderMaterial('Jelly', '#087F5B', .9);
    expect(clearer).toContain('data-jelly-pigment-concentration="0.704"');
    expect(clearer).toContain('data-jelly-transmission="0.528"');
    expect(richer).toContain('data-jelly-pigment-concentration="0.858"');
    expect(richer).toContain('data-jelly-transmission="0.416"');
    expect(clearer).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
    expect(richer).not.toMatch(/stop-color="(?:#fff(?:fff)?|white|gray)"/i);
  });
});
