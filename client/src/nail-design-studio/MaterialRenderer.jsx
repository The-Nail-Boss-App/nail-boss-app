import { useId } from 'react';
import { features } from '../config/features';
import { HybridJellyMaterial } from './HybridMaterialRenderer';

export { jellyTransmissionPalette } from './HybridMaterialRenderer';

/**
 * Material is deliberately independent from pigment. These immutable profiles
 * describe how a cured surface responds to light; color only tints the base.
 */
export const MATERIAL_PROFILES = Object.freeze({
  Cream: Object.freeze({ opacity: 1, edge: .14, curvature: .16, reflection: .66, topCoat: .52, diffuse: .01, grain: 0, transmission: 0 }),
  Matte: Object.freeze({ opacity: 1, edge: .14, curvature: .24, reflection: .018, topCoat: .012, diffuse: .12, grain: 0, transmission: 0 }),
  Jelly: Object.freeze({ opacity: .68, edge: .48, curvature: .24, reflection: .9, topCoat: .58, diffuse: .04, grain: 0, transmission: .42 }),
  Glitter: Object.freeze({ opacity: .94, edge: .3, curvature: .28, reflection: .7, topCoat: .5, diffuse: .06, grain: 0, transmission: .08 }),
});

export const materialProfile = (finish = 'Cream') => MATERIAL_PROFILES[finish] || MATERIAL_PROFILES.Cream;

export function renderHybridJellySafely(props, hybridRenderer = HybridJellyMaterial) {
  try {
    return hybridRenderer(props);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('Hybrid Jelly renderer failed; using legacy Jelly renderer.', error);
    return null;
  }
}

export const GLITTER_PARTICLE_CAPACITY = 2000;
export const GLITTER_EMBEDDED_BLUR = .24;
export const GLITTER_MICRO_RADIUS = Object.freeze({ min: .2, max: .42 });
const hashSeed = (value) => [...value].reduce((hash, character) => Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0, 2166136261);

/** Stable prefix population: density reveals particles instead of resizing a fixed set. */
export function glitterParticleField(baseColor = '#D94C70', fleckColor = '#E8D7A8', density = .46) {
  let state = hashSeed(`${baseColor.toUpperCase()}|${fleckColor.toUpperCase()}|standard-glitter-v1`);
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const count = Math.round(clamp(density) * GLITTER_PARTICLE_CAPACITY);
  return Array.from({ length: count }, (_, index) => {
    const scaleRoll = random();
    const size = scaleRoll < .9 ? 'micro' : scaleRoll < .985 ? 'small' : 'medium';
    const radius = size === 'micro' ? GLITTER_MICRO_RADIUS.min + random() * (GLITTER_MICRO_RADIUS.max - GLITTER_MICRO_RADIUS.min) : size === 'small' ? .5 + random() * .34 : .9 + random() * .38;
    const depthRoll = random();
    // Sample a conservative normalized nail envelope before the authoritative
    // Hero clip. This preserves every shape mask while avoiding the old full-
    // rectangle reservoir, whose corners could never contribute visible flecks.
    const yNorm = random();
    const shoulder = Math.min(1, .66 + yNorm * 3.4);
    const tip = yNorm <= .68 ? 1 : Math.max(.12, 1 - ((yNorm - .68) / .32) * .88);
    const halfWidth = 72 * shoulder * tip;
    return Object.freeze({
      index, x: 120 + (random() * 2 - 1) * halfWidth, y: 20 + yNorm * 326, radius, size,
      squash: .42 + random() * .68, rotation: random() * 180,
      depth: depthRoll < .68 ? 'embedded' : depthRoll < .985 ? 'surface' : 'specular',
      opacity: depthRoll < .68 ? .24 + random() * .3 : depthRoll < .985 ? .46 + random() * .36 : .82 + random() * .16,
    });
  });
}

function MaterialDefs({ id, color, neutralCream = false, restrainedGlitter = false }) {
  const pigmentEdge = neutralCream ? color : '#170812';
  const transmissionEdge = neutralCream ? color : '#200914';
  const edgeColor = neutralCream ? '#000000' : '#130710';
  const grainColor = neutralCream ? '#000000' : '#190a14';
  return <defs>
    <radialGradient id={`${id}-pigment`} cx="50%" cy="38%" r="72%"><stop offset="0" stopColor={color}/><stop offset="66%" stopColor={color}/><stop offset="100%" stopColor={pigmentEdge}/></radialGradient>
    <radialGradient id={`${id}-transmission`} cx="50%" cy="44%" r="64%"><stop offset="0" stopColor="#fff" stopOpacity=".36"/><stop offset="48%" stopColor={color} stopOpacity=".12"/><stop offset="100%" stopColor={transmissionEdge} stopOpacity=".48"/></radialGradient>
    <linearGradient id={`${id}-edges`} x1="0" x2="1"><stop stopColor={edgeColor} stopOpacity={neutralCream ? '.22' : '.72'}/><stop offset={neutralCream ? '.1' : '.18'} stopColor={edgeColor} stopOpacity="0"/><stop offset={neutralCream ? '.9' : '.78'} stopColor={edgeColor} stopOpacity="0"/><stop offset="1" stopColor={edgeColor} stopOpacity={neutralCream ? '.16' : '.64'}/></linearGradient>
    <radialGradient id={`${id}-curve`} cx="46%" cy="25%" r="82%"><stop stopColor="#fff" stopOpacity={neutralCream ? '.08' : '.3'}/><stop offset=".3" stopColor="#fff" stopOpacity={neutralCream ? '.015' : '.06'}/><stop offset="1" stopColor="#000" stopOpacity={neutralCream ? '.08' : '.24'}/></radialGradient>
    {neutralCream
      ? <><radialGradient id={`${id}-reflection`} data-reflection-role="primary" data-reflection-width={restrainedGlitter ? '12%' : '18%'} cx="39%" cy="31%" r="58%" gradientTransform={restrainedGlitter ? 'matrix(.12 0 0 .88 .35 .04)' : 'matrix(.18 0 0 .92 .32 .025)'}><stop offset="0" stopColor="#fff" stopOpacity={restrainedGlitter ? '.58' : '.96'}/><stop offset="28%" stopColor="#fff" stopOpacity={restrainedGlitter ? '.34' : '.72'}/><stop offset="64%" stopColor="#fff" stopOpacity={restrainedGlitter ? '.07' : '.16'}/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient><radialGradient id={`${id}-secondary-reflection`} data-reflection-role="secondary" data-reflection-width={restrainedGlitter ? '7%' : '9%'} cx="73%" cy="43%" r="52%" gradientTransform={restrainedGlitter ? 'matrix(.07 0 0 .58 .68 .18)' : 'matrix(.09 0 0 .62 .665 .16)'}><stop offset="0" stopColor="#fff" stopOpacity={restrainedGlitter ? '.18' : '.3'}/><stop offset="42%" stopColor="#fff" stopOpacity={restrainedGlitter ? '.06' : '.12'}/><stop offset="100%" stopColor="#fff" stopOpacity="0"/></radialGradient></>
      : <linearGradient id={`${id}-reflection`} x1="0" x2="1"><stop offset=".16" stopColor="#fff" stopOpacity="0"/><stop offset=".31" stopColor="#fff" stopOpacity=".86"/><stop offset=".42" stopColor="#fff" stopOpacity=".1"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>}
    <pattern id={`${id}-grain`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="1" cy="2" r=".55" fill="#fff" opacity=".26"/><circle cx="5" cy="5" r=".48" fill={grainColor} opacity=".2"/></pattern>
  </defs>;
}

/**
 * MAT-F04 uses an achromatic, Matte-only light rig. Keeping these gradients out
 * of MaterialDefs prevents the soft diffuse calibration from changing Cream,
 * Jelly, or any legacy finish, while a solid pigment base preserves every hue.
 */
function MatteDefs({ id }) {
  return <defs>
    <linearGradient id={`${id}-matte-edges`} x1="0" x2="1"><stop stopColor="#000" stopOpacity=".52"/><stop offset=".14" stopColor="#000" stopOpacity="0"/><stop offset=".84" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".42"/></linearGradient>
    <radialGradient id={`${id}-matte-curve`} cx="45%" cy="31%" r="78%"><stop offset="0" stopColor="#fff" stopOpacity=".12"/><stop offset=".48" stopColor="#fff" stopOpacity=".025"/><stop offset=".82" stopColor="#000" stopOpacity=".08"/><stop offset="1" stopColor="#000" stopOpacity=".28"/></radialGradient>
    <radialGradient id={`${id}-matte-diffuse`} data-lighting-role="broad-environmental-diffuse" data-lighting-width="96%" cx="43%" cy="32%" r="88%" gradientTransform="matrix(.96 0 0 1 .015 0)"><stop offset="0" stopColor="#fff" stopOpacity=".16"/><stop offset=".7" stopColor="#fff" stopOpacity=".07"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
    <radialGradient id={`${id}-matte-reflection`} cx="35%" cy="27%" r="72%" gradientTransform="matrix(.62 0 0 1 .13 0)"><stop offset="0" stopColor="#fff" stopOpacity=".34"/><stop offset=".65" stopColor="#fff" stopOpacity=".06"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
    <linearGradient id={`${id}-matte-cuticle-tip`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#000" stopOpacity=".22"/><stop offset=".09" stopColor="#000" stopOpacity="0"/><stop offset=".82" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".18"/></linearGradient>
  </defs>;
}

function MatteLayers({ path, color, opacity, uid, baseProps }) {
  const p = MATERIAL_PROFILES.Matte;
  return <g data-material-renderer="MaterialRenderer" data-material-profile="MatteMaterial" data-material-contract="mat-f04-smooth-matte-gel" data-material-input-color={color} data-material-base-color={color} data-optical-color-model="matte-achromatic" data-clear-coat-reflection={p.reflection.toFixed(3)} data-clear-coat-top-coat={p.topCoat.toFixed(3)}>
    <MatteDefs id={uid}/>
    <path {...baseProps} data-material-layer="base-pigment" d={path} fill={color} opacity={opacity * p.opacity}/>
    <path data-material-layer="curvature-shadow" d={path} fill={`url(#${uid}-matte-curve)`} opacity={p.curvature}/>
    <path data-material-layer="edge-darkening" d={path} fill={`url(#${uid}-matte-edges)`} opacity={p.edge}/>
    <path data-material-layer="cuticle-tip-depth" d={path} fill={`url(#${uid}-matte-cuticle-tip)`} opacity=".12"/>
    <path data-material-layer="material-diffusion" d={path} fill={`url(#${uid}-matte-diffuse)`} opacity={p.diffuse}/>
    <path data-material-layer="reflection" d={path} fill={`url(#${uid}-matte-reflection)`} opacity={p.reflection}/>
    <path data-material-layer="top-coat" d={path} fill="none" stroke="#fff" strokeWidth=".7" strokeOpacity={p.topCoat}/>
  </g>;
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

/** Cream never becomes Matte: Shine scales only its clear surface response. */
export function creamGlossResponse(shine = .68) {
  const control = clamp(shine);
  return Object.freeze({
    reflection: .24 + control * .42,
    secondaryReflection: .04 + control * .1,
    topCoat: .22 + control * .3,
  });
}

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
function legacyJellyTransmissionPalette(color) {
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
  const tones = legacyJellyTransmissionPalette(color);
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

function GlitterLayers({ path, color, fleckColor, density, opacity, shine, uid, baseProps }) {
  // Glitter is particulate suspended in the approved opaque Cream polish body.
  // It intentionally borrows no transmission or metallic surface behavior.
  const p = MATERIAL_PROFILES.Cream;
  const gloss = creamGlossResponse(shine);
  const glitterGloss = { reflection: gloss.reflection * .58, secondaryReflection: gloss.secondaryReflection * .62, topCoat: gloss.topCoat * .84 };
  const particles = glitterParticleField(color, fleckColor, density);
  const paint = (particle, specular = false) => <ellipse key={particle.index} cx={particle.x} cy={particle.y} rx={particle.radius} ry={particle.radius * particle.squash}
    transform={`rotate(${particle.rotation.toFixed(1)} ${particle.x.toFixed(2)} ${particle.y.toFixed(2)})`}
    fill={specular ? `url(#${uid}-glitter-hit)` : fleckColor} opacity={particle.opacity.toFixed(2)}/>;
  const population = (depth) => particles.filter((particle) => particle.depth === depth);
  return <g data-material-renderer="MaterialRenderer" data-material-profile="GlitterMaterial" data-material-contract="mat-f05c-dense-micro-particulate-glitter"
    data-glitter-surface-foundation="Cream" data-optical-color-model="neutral-achromatic" data-material-shine={clamp(shine).toFixed(2)}
    data-material-input-color={color} data-material-base-color={color} data-glitter-fleck-color={fleckColor} data-glitter-density={clamp(density).toFixed(2)} data-glitter-particle-count={particles.length}>
    <MaterialDefs id={uid} color={color} neutralCream restrainedGlitter/>
    <defs><clipPath id={`${uid}-glitter-mask`}><path d={path}/></clipPath><filter id={`${uid}-embedded-softness`}><feGaussianBlur stdDeviation={GLITTER_EMBEDDED_BLUR}/></filter><radialGradient id={`${uid}-glitter-hit`}><stop stopColor="#FFFFFF"/><stop offset=".22" stopColor={fleckColor}/><stop offset="1" stopColor={fleckColor} stopOpacity=".38"/></radialGradient></defs>
    <path {...baseProps} data-material-layer="base-pigment" d={path} fill={`url(#${uid}-pigment)`} opacity={opacity * p.opacity}/>
    <path data-material-layer="curvature-shadow" d={path} fill={`url(#${uid}-curve)`} opacity={p.curvature}/>
    <path data-material-layer="edge-darkening" d={path} fill={`url(#${uid}-edges)`} opacity={p.edge}/>
    <path data-material-layer="material-diffusion" d={path} fill="#FFFFFF" opacity={Math.min(p.diffuse, .025)}/>
    <g clipPath={`url(#${uid}-glitter-mask)`} transform={uid.startsWith('swatch-') ? 'scale(.35 .15)' : undefined} data-material-layer="glitter-particle-field">
      <g data-particle-depth="embedded" filter={`url(#${uid}-embedded-softness)`}>{population('embedded').map((particle) => paint(particle))}</g>
      <g data-particle-depth="surface-near">{population('surface').map((particle) => paint(particle))}</g>
      <g data-particle-depth="specular">{population('specular').map((particle) => paint(particle, true))}</g>
    </g>
    <path data-material-layer="reflection" data-glitter-highlight="restrained" d={path} fill={`url(#${uid}-reflection)`} opacity={glitterGloss.reflection}/>
    <path data-material-layer="secondary-reflection" d={path} fill={`url(#${uid}-secondary-reflection)`} opacity={glitterGloss.secondaryReflection}/>
    <path data-material-layer="top-coat" d={path} fill="none" stroke="#fff" strokeWidth="1.2" strokeOpacity={glitterGloss.topCoat}/>
  </g>;
}

/** Shared ordered pipeline: pigment → curvature → edges → material → reflection → top coat → detail. */
export function MaterialLayers({ path, finish = 'Cream', color = '#D94C70', fleckColor = '#E8D7A8', glitterDensity = .46, opacity = 1, shine = .68, uid = 'material', baseProps = {} }) {
  if (finish === 'Jelly') {
    if (features.materials.hybridJellyRenderer.enabled) {
      const hybrid = renderHybridJellySafely({ path, color, opacity, uid, baseProps });
      if (hybrid) return hybrid;
    }
    return <JellyLayers path={path} color={color} opacity={opacity} uid={uid} baseProps={baseProps}/>;
  }
  if (finish === 'Matte') return <MatteLayers path={path} color={color} opacity={opacity} uid={uid} baseProps={baseProps}/>;
  if (finish === 'Glitter') return <GlitterLayers path={path} color={color} fleckColor={fleckColor} density={glitterDensity} opacity={opacity} shine={shine} uid={uid} baseProps={baseProps}/>;
  const p = materialProfile(finish);
  const neutralCream = finish === 'Cream';
  const gloss = neutralCream ? creamGlossResponse(shine) : { reflection: p.reflection, secondaryReflection: 0, topCoat: p.topCoat };
  return <g data-material-renderer="MaterialRenderer" data-material-profile={`${finish}Material`} data-material-input-color={color} data-material-base-color={color} data-optical-color-model={neutralCream ? 'neutral-achromatic' : 'finish-profile'} data-material-shine={neutralCream ? clamp(shine).toFixed(2) : undefined} data-clear-coat-reflection={gloss.reflection.toFixed(3)} data-clear-coat-top-coat={gloss.topCoat.toFixed(3)}>
    <MaterialDefs id={uid} color={color} neutralCream={neutralCream}/>
    <path {...baseProps} data-material-layer="base-pigment" d={path} fill={`url(#${uid}-pigment)`} opacity={opacity * p.opacity}/>
    <path data-material-layer="curvature-shadow" d={path} fill={`url(#${uid}-curve)`} opacity={p.curvature}/>
    <path data-material-layer="edge-darkening" d={path} fill={`url(#${uid}-edges)`} opacity={p.edge}/>
    {p.transmission > 0 && <path data-material-layer="internal-light-transmission" d={path} fill={`url(#${uid}-transmission)`} opacity={p.transmission}/>} 
    <path data-material-layer="material-diffusion" d={path} fill={neutralCream ? '#FFFFFF' : '#f5edf2'} opacity={neutralCream ? Math.min(p.diffuse, .025) : p.diffuse}/>
    <path data-material-layer="reflection" d={path} fill={`url(#${uid}-reflection)`} opacity={gloss.reflection}/>
    {neutralCream && <path data-material-layer="secondary-reflection" d={path} fill={`url(#${uid}-secondary-reflection)`} opacity={gloss.secondaryReflection}/>}
    <path data-material-layer="top-coat" d={path} fill="none" stroke="#fff" strokeWidth={neutralCream ? '1.4' : '2.2'} strokeOpacity={gloss.topCoat}/>
    {p.grain > 0 && <path data-material-layer="surface-detail" d={path} fill={`url(#${uid}-grain)`} opacity={p.grain}/>} 
  </g>;
}

export function MaterialSwatch({ finish, color, fleckColor, glitterDensity, className = '' }) {
  const id = useId().replace(/:/g, '');
  const path = 'M9 31C7 18 17 7 32 8c10-5 26 1 29 12 8 6 4 23-8 27-13 7-38 4-44-4-3-4-3-8 0-12Z';
  return <svg className={className} viewBox="0 0 70 56" role="img" aria-label={`${finish} polish sample swatch`}><MaterialLayers path={path} finish={finish} color={color} fleckColor={fleckColor} glitterDensity={glitterDensity} uid={`swatch-${id}`}/></svg>;
}
