import { COLORS, S } from "../styles.js";
import { EFFECTS, POLISH_TYPES, TOP_COATS, clearStalePolishTypeForLegacyEffect, normalizePolishData } from "./blueprint.js";
import { PATTERNS, GRADIENT_DIRECTIONS, FRENCH_TIP_PRESETS, FRENCH_TIP_STYLES } from "./blueprint.js";
import { findAsset } from "./assets.js";
import { UI } from "./studioStyles.js";

function Range({ label, value, min, max, step = 1, onChange, disabled }) {
  return <div style={UI.field}><label style={S.label}>{label}: {value}</label><input type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} /></div>;
}

function Color({ label, value, onChange, disabled }) {
  return <div style={UI.field}><label style={S.label}>{label}</label><input type="color" value={value || "#FFFFFF"} disabled={disabled} onChange={(e) => onChange(e.target.value)} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10 }} /></div>;
}

export default function PropertiesPanel({ layer, onPatch, onDuplicate, onDelete }) {
  if (!layer) {
    return <section><div style={UI.sectionTitle}>Properties</div><p style={UI.smallText}>Select an art layer to edit position, size, color, opacity, and rotation. Artwork is clipped to strict nail-surface boundaries.</p></section>;
  }
  const disabled = layer.locked;
  const asset = findAsset(layer.data?.assetId);
  const isAsset = ["charm", "jewel", "decal"].includes(layer.type);
  return (
    <section>
      <div style={UI.sectionTitle}>Properties</div>
      <div style={UI.field}>
        <label style={S.label}>Layer name</label>
        <input style={S.input} value={layer.name} disabled={layer.type === "base"} onChange={(e) => onPatch({ name: e.target.value })} />
      </div>
      <p style={{ ...UI.smallText, marginBottom: 12 }}>Type: <strong>{layer.type}</strong>{asset ? ` · ${asset.category}` : ""}</p>
      {layer.type === "base" && (() => {
        const polish = normalizePolishData(layer.data);
        const patchPolish = (patch) => onPatch({ data: normalizePolishData(clearStalePolishTypeForLegacyEffect({ ...layer.data, ...patch }, patch), layer.data.colorHex) });
        return <>
          <div style={{ ...UI.sectionTitle, marginTop: 8 }}>Polish Settings</div>
          <div style={UI.field}><label style={S.label}>Polish Type</label><select style={S.input} value={polish.polishType} onChange={(e) => patchPolish({ polishType: e.target.value })}>{POLISH_TYPES.map((type) => <option key={type}>{type}</option>)}</select></div>
          <Color label="Color" value={polish.colorHex} onChange={(colorHex) => patchPolish({ colorHex })} />
          <Range label="Shine" value={Math.round(polish.shine * 100)} min={0} max={100} onChange={(v) => patchPolish({ shine: v / 100 })} />
          <Range label="Transparency" value={Math.round(polish.transparency * 100)} min={0} max={100} onChange={(v) => patchPolish({ transparency: v / 100 })} />
          <div style={UI.field}><label style={S.label}>Top Coat</label><select style={S.input} value={polish.topCoat} onChange={(e) => patchPolish({ topCoat: e.target.value })}>{TOP_COATS.map((coat) => <option key={coat}>{coat}</option>)}</select></div>
          {polish.polishType === "Glitter" && <>
            <Range label="Glitter Density" value={Math.round(polish.sparkleDensity * 100)} min={0} max={100} onChange={(v) => patchPolish({ sparkleDensity: v / 100 })} />
            <Range label="Glitter Size" value={Math.round(polish.sparkleSize * 100)} min={0} max={100} onChange={(v) => patchPolish({ sparkleSize: v / 100 })} />
          </>}
          {polish.polishType === "Cat Eye" && <>
            <Range label="Cat Eye Angle" value={Math.round(polish.catEyeAngle)} min={-180} max={180} onChange={(v) => patchPolish({ catEyeAngle: v })} />
            <Range label="Cat Eye Intensity" value={Math.round(polish.catEyeIntensity * 100)} min={0} max={100} onChange={(v) => patchPolish({ catEyeIntensity: v / 100 })} />
          </>}
          {polish.polishType === "Chrome" && <Range label="Chrome Intensity" value={Math.round(polish.chromeIntensity * 100)} min={0} max={100} onChange={(v) => patchPolish({ chromeIntensity: v / 100 })} />}
          <div style={UI.field}><label style={S.label}>Legacy effect</label><select style={S.input} value={layer.data.effect} onChange={(e) => patchPolish({ effect: e.target.value })}>{EFFECTS.map((effect) => <option key={effect}>{effect}</option>)}</select></div>
          <Color label="Effect color" value={layer.data.effectColorHex} onChange={(effectColorHex) => onPatch({ data: { ...layer.data, effectColorHex } })} />
        </>;
      })()}
      {isAsset && <>
        <Color label="Color" value={layer.data.colorHex || asset?.defaultColor || "#FFFFFF"} onChange={(colorHex) => onPatch({ data: { ...layer.data, colorHex } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
        <Range label="Size" value={Math.round(layer.transform.scaleX * 100)} min={6} max={34} onChange={(v) => onPatch({ transform: { ...layer.transform, scaleX: v / 100, scaleY: v / 100 } })} disabled={disabled} />
        <Range label="Rotation" value={Math.round(layer.transform.rotation)} min={-180} max={180} onChange={(v) => onPatch({ transform: { ...layer.transform, rotation: v } })} disabled={disabled} />
        <Range label="X position" value={Math.round(layer.transform.x * 100)} min={0} max={100} onChange={(v) => onPatch({ transform: { ...layer.transform, x: v / 100 } })} disabled={disabled} />
        <Range label="Y position" value={Math.round(layer.transform.y * 100)} min={0} max={100} onChange={(v) => onPatch({ transform: { ...layer.transform, y: v / 100 } })} disabled={disabled} />
      </>}
      {layer.type === "gradient" && <>
        <Color label="Color A" value={layer.data.colorA} onChange={(colorA) => onPatch({ data: { ...layer.data, colorA } })} disabled={disabled} />
        <Color label="Color B" value={layer.data.colorB} onChange={(colorB) => onPatch({ data: { ...layer.data, colorB } })} disabled={disabled} />
        <div style={UI.field}><label style={S.label}>Direction</label><select style={S.input} value={layer.data.direction} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, direction: e.target.value } })}>{GRADIENT_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select></div>
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
      </>}
      {layer.type === "pattern" && <>
        <div style={UI.field}><label style={S.label}>Pattern</label><select style={S.input} value={layer.data.pattern} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, pattern: e.target.value } })}>{PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}</select></div>
        <Color label="Pattern color" value={layer.data.colorHex} onChange={(colorHex) => onPatch({ data: { ...layer.data, colorHex } })} disabled={disabled} />
        <Color label="Secondary color" value={layer.data.secondaryColorHex || "#3B1F35"} onChange={(secondaryColorHex) => onPatch({ data: { ...layer.data, secondaryColorHex } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
      </>}
      {layer.type === "frenchTip" && <>
        <div style={UI.field}><label style={S.label}>Style</label><select style={S.input} value={layer.data.style ?? "classic"} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, style: e.target.value } })}>{FRENCH_TIP_STYLES.map((style) => <option key={style} value={style}>{style}</option>)}</select></div>
        <div style={UI.field}><label style={S.label}>Smile preset</label><select style={S.input} value={layer.data.preset ?? "medium"} disabled={disabled} onChange={(e) => onPatch({ data: { ...layer.data, ...FRENCH_TIP_PRESETS[e.target.value], preset: e.target.value } })}>{Object.keys(FRENCH_TIP_PRESETS).map((preset) => <option key={preset} value={preset}>{preset}</option>)}</select></div>
        <Color label="Tip color" value={layer.data.colorHex} onChange={(colorHex) => onPatch({ data: { ...layer.data, colorHex } })} disabled={disabled} />
        <Range label="Tip height" value={Math.round((layer.data.tipHeight ?? 0.32) * 100)} min={8} max={72} onChange={(v) => onPatch({ data: { ...layer.data, tipHeight: v / 100 } })} disabled={disabled} />
        <Range label="Smile curve" value={Math.round((layer.data.smileCurve ?? 0.32) * 100)} min={0} max={100} onChange={(v) => onPatch({ data: { ...layer.data, smileCurve: v / 100 } })} disabled={disabled} />
        <Range label="Smile depth" value={Math.round((layer.data.smileDepth ?? 0.24) * 100)} min={0} max={65} onChange={(v) => onPatch({ data: { ...layer.data, smileDepth: v / 100 } })} disabled={disabled} />
        <Range label="Smile width" value={Math.round((layer.data.smileWidth ?? 0.82) * 100)} min={25} max={100} onChange={(v) => onPatch({ data: { ...layer.data, smileWidth: v / 100 } })} disabled={disabled} />
        <Range label="Opacity" value={Math.round((layer.opacity ?? 1) * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
        <Range label="Angle" value={Math.round(layer.data.rotation ?? 0)} min={-45} max={45} onChange={(v) => onPatch({ data: { ...layer.data, rotation: v } })} disabled={disabled} />
      </>}
      {layer.type === "drawing" && <>
        <Range label="Opacity" value={Math.round(layer.opacity * 100)} min={5} max={100} onChange={(v) => onPatch({ opacity: v / 100 })} disabled={disabled} />
        <p style={UI.smallText}>Strokes: {layer.data?.strokes?.length || 0}. Select Draw or Eraser in the top toolbar to edit vector strokes.</p>
      </>}
      {layer.type !== "base" && <div style={{ display: "flex", gap: 8, marginTop: 12 }}><button type="button" onClick={onDuplicate} disabled={disabled} style={UI.iconButton(false, disabled)}>Duplicate</button><button type="button" onClick={onDelete} disabled={disabled} style={UI.iconButton(false, disabled)}>Delete</button></div>}
    </section>
  );
}
