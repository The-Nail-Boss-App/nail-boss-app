import React from 'react';

export const HYBRID_JELLY_LAYER_ORDER = Object.freeze([
  'shape-mask',
  'base-pigment',
  'curvature-shadow',
  'apex-highlight',
  'edge-depth',
  'jelly-transmission',
  'reflection',
  'top-coat',
]);

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function hexToHsl(hex) {
  const value = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : 'D94C70';
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
  let hue = 0;
  if (delta) hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  const lightness = (max + min) / 2;
  return { h: (hue * 60 + 360) % 360, s: delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0, l: lightness };
}

function hslToHex({ h, s, l }) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1)); const m = l - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Hue-locked optical tones: only saturation and lightness change. */
export function jellyTransmissionPalette(color) {
  const body = /^#[\da-f]{6}$/i.test(color) ? color.toUpperCase() : '#D94C70';
  const source = hexToHsl(body);
  const tone = (lightness, saturationFloor) => hslToHex({ ...source, l: clamp(lightness, .08, .82), s: clamp(Math.max(source.s, saturationFloor)) });
  return Object.freeze({ transmission: tone(source.l + Math.max(.12, (1 - source.l) * .2), .62), body, edge: tone(source.l * .68, .72), depth: tone(source.l * .46, .76) });
}

export const JELLY_MATERIAL_PROFILE = Object.freeze({
  id: 'hybrid-jelly',
  texture: null,
  reflectionWidth: .1,
  topCoatPigment: null,
});

/** Static normalized SVG maps are reused by every shape and scale with its bounds. */
export function HybridJellyMaterial({ path, color, opacity = 1, uid, baseProps = {} }) {
  if (!path || !uid) throw new Error('Hybrid Jelly requires a shape mask and unique nail id.');
  const control = clamp(Number(opacity));
  const pigment = .74 + control * .18; const transmission = .64 - control * .18;
  const tones = jellyTransmissionPalette(color); const clipId = `${uid}-hybrid-mask`;
  return <g data-material-renderer="HybridMaterialRenderer" data-material-profile="HybridJelly" data-jelly-pigment-concentration={pigment.toFixed(3)} data-jelly-transmission={transmission.toFixed(3)} data-reflection-width="10%">
    <defs>
      <clipPath id={clipId}><path d={path}/></clipPath>
      <linearGradient id={`${uid}-curve`} x1="0" x2="1"><stop stopColor={tones.depth} stopOpacity=".72"/><stop offset=".18" stopColor={tones.edge} stopOpacity=".12"/><stop offset=".5" stopColor={tones.body} stopOpacity="0"/><stop offset=".82" stopColor={tones.edge} stopOpacity=".1"/><stop offset="1" stopColor={tones.depth} stopOpacity=".68"/></linearGradient>
      <radialGradient id={`${uid}-apex`} cx="46%" cy="31%" r="42%"><stop stopColor={tones.transmission} stopOpacity=".46"/><stop offset=".34" stopColor={tones.transmission} stopOpacity=".2"/><stop offset="1" stopColor={tones.body} stopOpacity="0"/></radialGradient>
      <radialGradient id={`${uid}-depth`} cx="50%" cy="40%" r="76%"><stop offset=".58" stopColor={tones.body} stopOpacity="0"/><stop offset=".84" stopColor={tones.edge} stopOpacity=".46"/><stop offset="1" stopColor={tones.depth} stopOpacity=".86"/></radialGradient>
      <radialGradient id={`${uid}-transmit`} cx="49%" cy="38%" r="58%"><stop stopColor={tones.transmission} stopOpacity=".62"/><stop offset=".55" stopColor={tones.body} stopOpacity=".2"/><stop offset="1" stopColor={tones.body} stopOpacity="0"/></radialGradient>
      <linearGradient id={`${uid}-reflect`} x1="0" x2="1"><stop offset=".24" stopColor={tones.transmission} stopOpacity="0"/><stop offset=".28" stopColor={tones.transmission} stopOpacity=".42"/><stop offset=".34" stopColor={tones.transmission} stopOpacity=".16"/><stop offset=".38" stopColor={tones.transmission} stopOpacity="0"/></linearGradient>
    </defs>
    <g data-material-layer="shape-mask" clipPath={`url(#${clipId})`}>
      <path {...baseProps} data-material-layer="base-pigment" d={path} fill={tones.body} opacity={pigment}/>
      <path data-material-layer="curvature-shadow" d={path} fill={`url(#${uid}-curve)`} opacity=".7" style={{ mixBlendMode: 'multiply' }}/>
      <path data-material-layer="apex-highlight" d={path} fill={`url(#${uid}-apex)`}/>
      <path data-material-layer="edge-depth" d={path} fill={`url(#${uid}-depth)`} style={{ mixBlendMode: 'multiply' }}/>
      <path data-material-layer="jelly-transmission" d={path} fill={`url(#${uid}-transmit)`} opacity={transmission}/>
      <path data-material-layer="reflection" d={path} fill={`url(#${uid}-reflect)`} opacity=".52"/>
      <path data-material-layer="top-coat" data-top-coat-pigment="none" d={path} fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="1.1"/>
    </g>
  </g>;
}
