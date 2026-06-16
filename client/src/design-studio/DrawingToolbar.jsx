import { COLORS, S } from "../styles.js";
import { UI } from "./studioStyles.js";

const TOOLS = [
  { id: "solid", label: "Detail Brush" },
];

export default function DrawingToolbar({ brush, onBrushChange, mode }) {
  const disabled = mode !== "draw" && mode !== "eraser";
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={UI.sectionTitle}>Detail Brush</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {TOOLS.map((tool) => <button key={tool.id} type="button" disabled={disabled} onClick={() => onBrushChange({ tool: tool.id })} style={UI.miniButton(brush.tool === tool.id)}>{tool.label}</button>)}
      </div>
      <label style={S.label}>Brush color</label>
      <input type="color" value={brush.colorHex} disabled={disabled || mode === "eraser"} onChange={(event) => onBrushChange({ colorHex: event.target.value })} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10, marginBottom: 10 }} />
      <label style={S.label}>Brush size</label>
      <input type="range" min="1" max="14" value={brush.size} disabled={disabled} onChange={(event) => onBrushChange({ size: Number(event.target.value) })} style={{ width: "100%" }} />
      <label style={{ ...S.label, marginTop: 10 }}>Opacity</label>
      <input type="range" min="0.1" max="1" step="0.05" value={brush.opacity} disabled={disabled} onChange={(event) => onBrushChange({ opacity: Number(event.target.value) })} style={{ width: "100%" }} />
      <p style={{ ...UI.smallText, marginTop: 8 }}>MVP tools: Detail Brush paints vector strokes, and Eraser removes the nearest stroke in the selected drawing layer. Both stay clipped to the nail.</p>
    </section>
  );
}
