import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import { layerSort } from "./blueprint.js";

const LABELS = { base: "Base Polish", gradient: "Technique", pattern: "Technique", drawing: "Brush / Drawing", charm: "Charm", decal: "Sticker", jewel: "Charm", frenchTip: "Technique", topCoat: "Top Coat" };
const DEFAULT_ROWS = [
  { key: "base", name: "Base Polish", type: "Finish" },
  { key: "technique", name: "Technique", type: "Effect" },
  { key: "drawing", name: "Brush / Drawing", type: "Artwork" },
  { key: "decal", name: "Sticker", type: "Asset" },
  { key: "charm", name: "Charm", type: "Embellishment" },
  { key: "topCoat", name: "Top Coat", type: "Finish" },
];
const TECHNIQUE_TYPES = new Set(["gradient", "pattern", "frenchTip"]);
const STICKER_TYPES = new Set(["decal"]);
const CHARM_TYPES = new Set(["charm", "jewel"]);

function rowKeyForLayer(layer) {
  if (!layer) return "";
  if (layer?.data?.topCoat || layer.type === "topCoat") return "topCoat";
  if (TECHNIQUE_TYPES.has(layer.type)) return "technique";
  if (STICKER_TYPES.has(layer.type)) return "decal";
  if (CHARM_TYPES.has(layer.type)) return "charm";
  return layer.type;
}

export default function LayersPanel({ layers, selectedLayerId, onSelect, onToggleVisible, onToggleLock, onMove, onDelete }) {
  const renderOrdered = [...layers].sort(layerSort);
  const visibleOrdered = [...renderOrdered].reverse();
  const layersByRow = DEFAULT_ROWS.reduce((acc, row) => ({ ...acc, [row.key]: [] }), {});
  visibleOrdered.forEach((layer) => {
    const key = rowKeyForLayer(layer);
    (layersByRow[key] || (layersByRow[key] = [])).push(layer);
  });
  const movableLayers = renderOrdered.filter((layer) => layer.type !== "base");
  const bottomMovableId = movableLayers[0]?.id;
  const topMovableId = movableLayers.at(-1)?.id;

  return (
    <section style={{ marginBottom: 8 }}>
      <div style={UI.sectionTitle}>Layer Stack</div>
      <div style={{ display: "grid", gap: 7 }}>
        {DEFAULT_ROWS.map((row) => {
          const rowLayers = layersByRow[row.key] || [];
          const active = rowLayers.some((layer) => layer.id === selectedLayerId);
          const enabled = rowLayers.length > 0;
          return (
            <section key={row.key} style={{ border: `1px solid ${active ? COLORS.plum : "rgba(123,47,89,.14)"}`, borderRadius: 14, background: active ? "linear-gradient(135deg, #fff0f8, #fffaf7)" : enabled ? "rgba(255,250,247,.92)" : "rgba(245,232,240,.44)", opacity: enabled ? 1 : .62, boxShadow: active ? "0 12px 28px rgba(123,47,89,.13)" : "0 8px 18px rgba(60,20,50,.05)", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "28px 1fr auto", alignItems: "center", gap: 7, padding: "8px 9px" }}>
                <span aria-hidden="true" style={{ color: enabled ? COLORS.plum : COLORS.textMuted, fontSize: 15 }}>{enabled ? "◉" : "○"}</span>
                <button type="button" onClick={() => rowLayers[0] && onSelect(rowLayers[0].id)} disabled={!enabled} style={{ border: 0, background: "transparent", textAlign: "left", cursor: enabled ? "pointer" : "default", padding: 0, color: COLORS.text }}>
                  <strong style={{ display: "block", fontSize: 12 }}>{row.name}</strong>
                  <span style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}>{enabled ? `${rowLayers.length} ${row.type.toLowerCase()} layer${rowLayers.length > 1 ? "s" : ""}` : `${row.type} not active`}</span>
                </button>
                <span aria-hidden="true" style={{ color: enabled ? COLORS.textMuted : COLORS.textFaint, fontSize: 14 }}>{enabled ? "⋯" : "□"}</span>
              </div>
              {rowLayers.map((layer) => {
                const selected = layer.id === selectedLayerId;
                const isBase = layer.type === "base";
                const disableUp = isBase || layer.id === topMovableId;
                const disableDown = isBase || layer.id === bottomMovableId;
                return (
                  <div key={layer.id} style={{ margin: "0 7px 7px 34px", padding: 7, borderRadius: 10, border: `1px solid ${selected ? COLORS.plum : "rgba(123,47,89,.12)"}`, background: selected ? COLORS.roseDim : "#fff" }}>
                    <button type="button" onClick={() => onSelect(layer.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", color: COLORS.text }}>
                      <strong style={{ fontSize: 12 }}>{layer.name}</strong>
                      <span style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}>{LABELS[layer.type] || layer.type} · order {layer.order}</span>
                    </button>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                      <button type="button" onClick={() => onToggleVisible(layer.id)} style={UI.iconButton(false)}>{layer.visible ? "👁" : "○"}</button>
                      <button type="button" onClick={() => onToggleLock(layer.id)} disabled={isBase} style={UI.iconButton(false, isBase)}>{layer.locked ? "Locked" : "Lock"}</button>
                      <button type="button" onClick={() => onMove(layer.id, 1)} disabled={disableUp} style={UI.iconButton(false, disableUp)}>Up</button>
                      <button type="button" onClick={() => onMove(layer.id, -1)} disabled={disableDown} style={UI.iconButton(false, disableDown)}>Down</button>
                      <button type="button" onClick={() => onDelete(layer.id)} disabled={isBase || layer.locked} style={UI.iconButton(false, isBase || layer.locked)}>Delete</button>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}
