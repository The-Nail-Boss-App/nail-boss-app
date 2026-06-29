import { COLORS, S } from "../styles.js";
import { ASSET_SIZE_RANGE, POLISH_TYPES, TOP_COATS, GRADIENT_COLOR_LIMITS, normalizeGradientData, normalizeGradientStops, normalizePolishData } from "./blueprint.js";
import { PATTERNS, GRADIENT_DIRECTIONS, FRENCH_TIP_PRESETS, FRENCH_TIP_STYLES } from "./blueprint.js";
import { findAsset } from "./assets.js";
import { UI } from "./studioStyles.js";

function Range({ label, value, min, max, step = 1, onChange, disabled }) {
  return <div style={UI.field}><label style={S.label}>{label}: {value}</label><input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} /></div>;
}

function Color({ label, value, onChange, disabled }) {
  return <div style={UI.field}><label style={S.label}>{label}</label><input type="color" value={value || "#FFFFFF"} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10 }} /></div>;
}

function GradientStopsControls({ layer, disabled, onPatch }) {
  const stops = normalizeGradientStops(layer.data);
  const patchGradient = (patch) => onPatch({ data: normalizeGradientData({ ...layer.data, ...patch }) });
  const patchStop = (index, patch) => {
    const nextStops = stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop);
    patchGradient({ gradientStops: nextStops, colorA: nextStops[0].color, colorB: nextStops[nextStops.length - 1].color });
  };
  const addStop = () => {
    if (stops.length >= GRADIENT_COLOR_LIMITS.max) return;
    const nextCount = stops.length + 1;
    const nextStops = [...stops, { color: "#FFFFFF", position: 50 }]
      .map((stop, index) => ({ ...stop, position: index === 0 ? 0 : index === nextCount - 1 ? 100 : Math.round((index / (nextCount - 1)) * 100) }));
    patchGradient({ gradientStops: nextStops });
  };
  const removeStop = (index) => {
    if (stops.length <= GRADIENT_COLOR_LIMITS.min) return;
    const nextStops = stops.filter((_, stopIndex) => stopIndex !== index);
    patchGradient({ gradientStops: nextStops, colorA: nextStops[0].color, colorB: nextStops[nextStops.length - 1].color });
  };
  return <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 10, marginTop: 10, background: "#fff" }}>
    <div style={UI.sectionTitle}>Additional Colors</div>
    <p style={UI.smallText}>Optional color stops are sorted by position. Start Color and End Color remain the first and last stops.</p>
    {stops.map((stop, index) => {
      const isEnd = index === 0 || index === stops.length - 1;
      return <div key={`${index}-${stop.color}`} style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr auto", gap: 8, alignItems: "center", marginTop: 8 }}>
        <input aria-label={`Gradient stop ${index + 1} color`} type="color" value={stop.color} disabled={disabled} onChange={(e) => patchStop(index, { color: e.target.value })} style={{ width: "100%", height: 34, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}/>
        <input aria-label={`Gradient stop ${index + 1} position`} type="range" min={isEnd ? stop.position : 0} max={isEnd ? stop.position : 100} value={stop.position} disabled={disabled || isEnd} onChange={(e) => patchStop(index, { position: Number(e.target.value) })}/>
        <button type="button" onClick={() => removeStop(index)} disabled={disabled || stops.length <= GRADIENT_COLOR_LIMITS.min} style={UI.iconButton(false, disabled || stops.length <= GRADIENT_COLOR_LIMITS.min)}>Remove</button>
      </div>;
    })}
    <button type="button" onClick={addStop} disabled={disabled || stops.length >= GRADIENT_COLOR_LIMITS.max} style={{ ...S.btnSecondary, marginTop: 10, padding: "8px 12px" }}>Add color</button>
    <p style={UI.smallText}>{stops.length}/{GRADIENT_COLOR_LIMITS.max} total gradient colors.</p>
  </div>;
}

export default function PropertiesPanel({ layer, onPatch, onDuplicate, onDelete }) {
  if (!layer) {
    return <section><div style={UI.sectionTitle}>Nail Art Controls™</div><p style={UI.smallText}>Select an art layer to edit position, size, color, opacity, and rotation. Artwork is clipped to strict nail-surface boundaries.</p></section>;
  }
  const disabled = layer.locked;
  const asset = findAsset(layer.data?.assetId);
  const isAsset = ["charm", "jewel", "decal"].includes(layer.type);
  return (
    <section>
      <div style={UI.sectionTitle}>Nail Art Controls™</div>
      <div style={UI.field}>
        <label style={S.label}>Layer name</label>
        <input style={S.input} value={layer.name} disabled={layer.type === "base"} onChange={(e) => onPatch({ name: e.target.value })} />
      </div>
      <p style={{ ...UI.smallText, marginBottom: 12 }}>Type: <strong>{layer.type}</strong>{asset ? ` · ${asset.category}` : ""}</p>
      {layer.type === "base" && (() => {
        const polish = normalizePolishData(layer.data);
        const patchPolish = (patch) => { const nextType = patch.polishType || polish.polishType; onPatch({ data: normalizePolishData({ ...layer.data, effect: "Solid", topCoat: nextType === "Matte" ? "Matte" : (layer.data.topCoat || "Gloss"), ...patch, polishType: nextType }, layer.data.colorHex) }); };
        return <>
          <div style={{ ...UI.sectionTitle, marginTop: 8 }}>Polish Settings</div>
          <p style={UI.smallText}>Physical realism is rendered automatically from the nail shape, color, shine, and top coat. Special polish-effect controls stay hidden for this milestone.</p>
          <div style={UI.field}><label style={S.label}>Polish Type</label><select style={S.input} value={polish.polishType} onChange={(e) => patchPolish({ polishType: e.target.value })}>{POLISH_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}</select></div>
          <Color label="Color" value={polish.colorHex} onChange={(colorHex) => patchPolish({ colorHex })} />
          <Range label="Shine" value={Math.round(polish.shine * 100)} min={0} max={100} onChange={(v) => patchPolish({ shine: v / 100 })} />
          <Range label="Transparency" value={Math.round(polish.transparency * 100)} min={0} max={100} onChange={(v) => patchPolish({ transparency: v / 100 })} />
          <div style={UI.field}><label style={S.label}>Top Coat</label><select style={S.input} value={polish.topCoat} onChange={(e) => patchPolish({ topCoat: e.target.value })}>{TOP_COATS.map((coat) => <option key={coat}>{coat}</option>)}</select></div>
        </>;
      })()}
      {isAsset && <>
        <Color label="Color" value={layer.data.colorHex || asset?.defaultColor || "#FFFFFF"} onChange={(colorHex) => onPatch({ data: { ...layer.data, colorHex } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
        <Range label="Size" value={Math.round(layer.transform.scaleX * 100)} min={Math.round(ASSET_SIZE_RANGE.min * 100)} max={Math.round(ASSET_SIZE_RANGE.max * 100)} onChange={(v) => onPatch({ transform: { ...layer.transform, scaleX: v / 100, scaleY: v / 100 } })} disabled={disabled} />
        <Range label="Rotation" value={Math.round(layer.transform.rotation)} min={-180} max={180} onChange={(v) => onPatch({ transform: { ...layer.transform, rotation: v } })} disabled={disabled} />
        <Range label="X position" value={Math.round(layer.transform.x * 100)} min={0} max={100} onChange={(v) => onPatch({ transform: { ...layer.transform, x: v / 100 } })} disabled={disabled} />
        <Range label="Y position" value={Math.round(layer.transform.y * 100)} min={0} max={100} onChange={(v) => onPatch({ transform: { ...layer.transform, y: v / 100 } })} disabled={disabled} />
      </>}
      {layer.type === "gradient" && <>
        <div style={{ ...UI.sectionTitle, marginTop: 8 }}>Ombré / Gradient</div>
        <p style={UI.smallText}>Salon-style soft gel blend with clipped diffusion, nail curvature, and material-aware shine.</p>
        <Color label="Start color" value={layer.data.colorA} onChange={(colorA) => onPatch({ data: normalizeGradientData({ ...layer.data, colorA }) })} disabled={disabled} />
        <Color label="End color" value={layer.data.colorB} onChange={(colorB) => onPatch({ data: normalizeGradientData({ ...layer.data, colorB }) })} disabled={disabled} />
        <GradientStopsControls layer={layer} disabled={disabled} onPatch={onPatch} />
        <div style={UI.field}><label style={S.label}>Blend direction</label><select style={S.input} value={layer.data.direction || "vertical"} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, direction: e.target.value } })}>{GRADIENT_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select></div>
        <Range label="Blend position" value={Math.round((layer.data.blendPosition ?? 0.5) * 100)} min={8} max={92} onChange={(v) => onPatch({ data: { ...layer.data, blendPosition: v / 100 } })} disabled={disabled} />
        <Range label="Softness / diffusion" value={Math.round((layer.data.softness ?? 0.62) * 100)} min={0} max={100} onChange={(v) => onPatch({ data: { ...layer.data, softness: v / 100 } })} disabled={disabled} />
        <Range label="Angle" value={Math.round(layer.data.angle ?? 90)} min={0} max={360} onChange={(v) => onPatch({ data: { ...layer.data, angle: v } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
      </>}
      {layer.type === "pattern" && <>
        <div style={UI.field}><label style={S.label}>Pattern</label><select style={S.input} value={layer.data.pattern} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, pattern: e.target.value } })}>{PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}</select></div>
        <Color label="Pattern color" value={layer.data.colorHex} onChange={(colorHex) => onPatch({ data: { ...layer.data, colorHex } })} disabled={disabled} />
        <Color label="Secondary color" value={layer.data.secondaryColorHex || "#3B1F35"} onChange={(secondaryColorHex) => onPatch({ data: { ...layer.data, secondaryColorHex } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
      </>}
      {layer.type === "frenchTip" && <p style={UI.smallText}>Use the French Tip Precision panel on the left as the single home for French Tip presets, color, shape, and bulk apply controls.</p>}
      {layer.type === "drawing" && <>
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
        <p style={UI.smallText}>Strokes: {layer.data?.strokes?.length || 0}. Select Draw or Eraser in the top toolbar to edit vector strokes.</p>
      </>}
      {layer.type !== "base" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button type="button" onClick={onDuplicate} disabled={disabled} style={UI.iconButton(false, disabled)}>Duplicate</button><button type="button" onClick={onDelete} disabled={disabled} style={UI.iconButton(false, disabled)}>Delete</button></div>}
    </section>
  );
}
