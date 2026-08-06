import { useId } from 'react';

/**
 * Material is deliberately independent from pigment. These immutable profiles
 * describe how a cured surface responds to light; color only tints the base.
 */
export const MATERIAL_PROFILES = Object.freeze({
  Cream: Object.freeze({ opacity: 1, edge: .34, curvature: .32, reflection: .78, topCoat: .44, diffuse: .08, grain: 0, transmission: 0 }),
  Matte: Object.freeze({ opacity: .96, edge: .18, curvature: .18, reflection: .06, topCoat: .04, diffuse: .34, grain: .28, transmission: 0 }),
  Jelly: Object.freeze({ opacity: .68, edge: .48, curvature: .24, reflection: .9, topCoat: .58, diffuse: .04, grain: 0, transmission: .42 }),
  Glitter: Object.freeze({ opacity: .94, edge: .3, curvature: .28, reflection: .7, topCoat: .5, diffuse: .06, grain: 0, transmission: .08 }),
});

export const materialProfile = (finish = 'Cream') => MATERIAL_PROFILES[finish] || MATERIAL_PROFILES.Cream;

const PARTICLES = [
  [75,48,2.7,.92],[105,62,1.2,.58],[137,51,1.8,.8],[166,75,1,.5],[91,91,1.5,.72],
  [124,105,3.1,.88],[153,120,1.4,.62],[72,132,1,.46],[111,145,2.1,.82],[144,159,1.1,.55],
  [170,181,2.6,.74],[87,192,1.4,.65],[128,210,1,.48],[157,225,2,.9],[102,244,2.8,.76],
  [139,260,1.3,.57],[79,274,1.8,.7],[119,291,1,.45],[151,303,2.4,.84],[108,321,1.5,.61],
];

function MaterialDefs({ id, color }) {
  return <defs>
    <radialGradient id={`${id}-pigment`} cx="50%" cy="38%" r="72%"><stop offset="0" stopColor={color}/><stop offset="66%" stopColor={color}/><stop offset="100%" stopColor="#170812"/></radialGradient>
    <radialGradient id={`${id}-transmission`} cx="50%" cy="44%" r="64%"><stop offset="0" stopColor="#fff" stopOpacity=".36"/><stop offset="48%" stopColor={color} stopOpacity=".12"/><stop offset="100%" stopColor="#200914" stopOpacity=".48"/></radialGradient>
    <linearGradient id={`${id}-edges`} x1="0" x2="1"><stop stopColor="#130710" stopOpacity=".72"/><stop offset=".18" stopColor="#130710" stopOpacity="0"/><stop offset=".78" stopColor="#130710" stopOpacity="0"/><stop offset="1" stopColor="#130710" stopOpacity=".64"/></linearGradient>
    <radialGradient id={`${id}-curve`} cx="46%" cy="31%" r="68%"><stop stopColor="#fff" stopOpacity=".3"/><stop offset=".4" stopColor="#fff" stopOpacity=".06"/><stop offset="1" stopColor="#000" stopOpacity=".24"/></radialGradient>
    <linearGradient id={`${id}-reflection`} x1="0" x2="1"><stop offset=".16" stopColor="#fff" stopOpacity="0"/><stop offset=".31" stopColor="#fff" stopOpacity=".86"/><stop offset=".42" stopColor="#fff" stopOpacity=".1"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
    <pattern id={`${id}-grain`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".55" fill="#fff" opacity=".26"/><circle cx="5" cy="5" r=".48" fill="#190a14" opacity=".2"/></pattern>
  </defs>;
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function hexToHsl(hex) {
  const value = /^#[\da-f]{6}$/i.test(hex) ? hex.slice(1) : 'D94C70';
  const [r, g, b] = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const max = Math.max(r, g, b); const min = Math.min(r, g, b); const delta = max - min;
  let hue = 0;
  if (delta) hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return { h: (hue * 60 + 360) % 360, s: saturation, l: lightness };
}

function hslToHex({ h, s, l }) {
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - chroma / 2;
  const [r, g, b] = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  return `#${[r, g, b].map((channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Jelly tones change pigment brightness/concentration without changing its hue. */
export function jellyTransmissionPalette(color) {
  const body = /^#[\da-f]{6}$/i.test(color) ? color.toUpperCase() : '#D94C70';
  const source = hexToHsl(body);
  const tone = (lightness, saturationFloor) => hslToHex({ ...source, l: clamp(lightness, .08, .82), s: clamp(Math.max(source.s, saturationFloor)) });
  return Object.freeze({
    transmission: tone(source.l + Math.max(.12, (1 - source.l) * .2), .62),
    body,
    edge: tone(source.l * .68, .72),
    depth: tone(source.l * .46, .76),
  });
}

function JellyDefs({ id, tones }) {
  return <defs>
    <radialGradient id={`${id}-jelly-pigment`} cx="49%" cy="38%" r="72%"><stop offset="0" stopColor={tones.transmission}/><stop offset="52%" stopColor={tones.body}/><stop offset="100%" stopColor={tones.edge}/></radialGradient>
    <radialGradient id={`${id}-jelly-depth`} cx="50%" cy="39%" r="74%"><stop offset="0" stopColor={tones.body} stopOpacity=".08"/><stop offset="65%" stopColor={tones.body} stopOpacity=".2"/><stop offset="88%" stopColor={tones.edge} stopOpacity=".68"/><stop offset="100%" stopColor={tones.depth}/></radialGradient>
    <linearGradient id={`${id}-jelly-edges`} x1="0" x2="1"><stop stopColor={tones.depth}/><stop offset=".13" stopColor={tones.edge} stopOpacity=".28"/><stop offset=".84" stopColor={tones.edge} stopOpacity=".22"/><stop offset="1" stopColor={tones.depth}/></linearGradient>
    <linearGradient id={`${id}-jelly-tip`} x1="0" y1="0" x2="0" y2="1"><stop offset=".58" stopColor={tones.body} stopOpacity="0"/><stop offset=".84" stopColor={tones.edge} stopOpacity=".44"/><stop offset="1" stopColor={tones.depth}/></linearGradient>
    <radialGradient id={`${id}-jelly-transmission`} cx="48%" cy="35%" r="58%"><stop offset="0" stopColor={tones.transmission} stopOpacity=".72"/><stop offset="54%" stopColor={tones.transmission} stopOpacity=".32"/><stop offset="100%" stopColor={tones.body} stopOpacity="0"/></radialGradient>
    <linearGradient id={`${id}-jelly-reflection`} x1="0" x2="1"><stop offset=".25" stopColor={tones.transmission} stopOpacity="0"/><stop offset=".29" stopColor={tones.transmission} stopOpacity=".48"/><stop offset=".35" stopColor={tones.transmission} stopOpacity=".2"/><stop offset=".39" stopColor={tones.transmission} stopOpacity="0"/></linearGradient>
  </defs>;
}

function JellyLayers({ path, color, opacity, uid, baseProps }) {
  const control = clamp(opacity);
  const pigmentConcentration = .74 + control * .18;
  const transmission = .64 - control * .18;
  const tones = jellyTransmissionPalette(color);
  return <g data-material-renderer="MaterialRenderer" data-material-profile="JellyMaterial" data-jelly-pigment-concentration={pigmentConcentration.toFixed(3)} data-jelly-transmission={transmission.toFixed(3)} data-jelly-highlight-width="14%">
    <JellyDefs id={uid} tones={tones}/>
    <path {...baseProps} data-material-layer="base-jelly-pigment" d={path} fill={`url(#${uid}-jelly-pigment)`} opacity={pigmentConcentration}/>
    <path data-material-layer="colored-light-transmission" d={path} fill={`url(#${uid}-jelly-transmission)`} opacity={transmission}/>
    <path data-material-layer="internal-color-depth" d={path} fill={`url(#${uid}-jelly-depth)`} opacity={.52 + control * .16} style={{ mixBlendMode: 'multiply' }}/>
    <path data-material-layer="edge-concentration" d={path} fill={`url(#${uid}-jelly-edges)`} opacity={.42 + control * .16} style={{ mixBlendMode: 'multiply' }}/>
    <path data-material-layer="tip-concentration" d={path} fill={`url(#${uid}-jelly-tip)`} opacity={.4 + control * .14} style={{ mixBlendMode: 'multiply' }}/>
    <path data-material-layer="reflection" d={path} fill={`url(#${uid}-jelly-reflection)`} opacity=".46"/>
    <path data-material-layer="top-coat" d={path} fill="none" stroke={tones.transmission} strokeWidth="1.1" strokeOpacity=".34"/>
  </g>;
}

/** Shared ordered pipeline: pigment → curvature → edges → material → reflection → top coat → detail. */
export function MaterialLayers({ path, finish = 'Cream', color = '#D94C70', opacity = 1, uid = 'material', baseProps = {} }) {
  if (finish === 'Jelly') return <JellyLayers path={path} color={color} opacity={opacity} uid={uid} baseProps={baseProps}/>;
  const p = materialProfile(finish);
  return <g data-material-renderer="MaterialRenderer" data-material-profile={`${finish}Material`}>
    <MaterialDefs id={uid} color={color}/>
    <path {...baseProps} data-material-layer="base-pigment" d={path} fill={`url(#${uid}-pigment)`} opacity={opacity * p.opacity}/>
    <path data-material-layer="curvature-shadow" d={path} fill={`url(#${uid}-curve)`} opacity={p.curvature}/>
    <path data-material-layer="edge-darkening" d={path} fill={`url(#${uid}-edges)`} opacity={p.edge}/>
    {p.transmission > 0 && <path data-material-layer="internal-light-transmission" d={path} fill={`url(#${uid}-transmission)`} opacity={p.transmission}/>} 
    <path data-material-layer="material-diffusion" d={path} fill="#f5edf2" opacity={p.diffuse}/>
    {finish === 'Glitter' && <g data-material-layer="submerged-glitter">{PARTICLES.map(([x,y,r,a], i) => i % 6 === 0 ? <path key={i} d={`M${x-r*2} ${y}h${r*4}M${x} ${y-r*2}v${r*4}`} stroke="#fff9d6" strokeWidth={Math.max(.55,r*.45)} opacity={a}/> : <circle key={i} cx={x} cy={y} r={r} fill={i%3 ? '#fff' : '#ffd978'} opacity={a}/>)}</g>}
    <path data-material-layer="reflection" d={path} fill={`url(#${uid}-reflection)`} opacity={p.reflection}/>
    <path data-material-layer="top-coat" d={path} fill="none" stroke="#fff" strokeWidth="2.2" strokeOpacity={p.topCoat}/>
    {p.grain > 0 && <path data-material-layer="surface-detail" d={path} fill={`url(#${uid}-grain)`} opacity={p.grain}/>} 
  </g>;
}

export function MaterialSwatch({ finish, color, className = '' }) {
  const id = useId().replace(/:/g, '');
  const path = 'M9 31C7 18 17 7 32 8c10-5 26 1 29 12 8 6 4 23-8 27-13 7-38 4-44-4-3-4-3-8 0-12Z';
  return <svg className={className} viewBox="0 0 70 56" role="img" aria-label={`${finish} polish sample swatch`}><MaterialLayers path={path} finish={finish} color={color} uid={`swatch-${id}`}/></svg>;
}
