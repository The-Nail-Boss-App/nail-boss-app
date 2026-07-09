import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import { layerSort } from "./blueprint.js";

const LABELS = { base: "Base Polish", gradient: "Gradient", pattern: "Pattern", drawing: "Drawing", charm: "Charm", decal: "Sticker", jewel: "Charm", frenchTip: "Pattern", topCoat: "Top Coat" };
const DEFAULT_ROWS = [
  { key: "base", match: ["base"], name: "Base Polish", type: "Color foundation", icon: "◐" },
  { key: "gradient", match: ["gradient"], name: "Gradient", type: "Technique", icon: "◒" },
  { key: "pattern", match: ["pattern", "frenchTip"], name: "Pattern", type: "Technique", icon: "▧" },
  { key: "drawing", match: ["drawing"], name: "Drawing", type: "Brush artwork", icon: "✎" },
  { key: "decal", match: ["decal"], name: "Sticker", type: "Sticker Studio™", icon: "▣" },
  { key: "charm", match: ["charm", "jewel"], name: "Charm", type: "Embellishment", icon: "◇" },
  { key: "topCoat", match: ["topCoat"], name: "Top Coat", type: "Finish seal", icon: "◌" },
];

function rowForLayer(layer) {
  if (layer?.data?.topCoat || layer?.type === "topCoat") return "topCoat";
  return DEFAULT_ROWS.find((row) => row.match.includes(layer?.type))?.key || layer?.type || "";
}

function layerRowStyle(active, enabled) {
  return {
    display: "grid",
    gridTemplateColumns: "18px 30px 30px 1fr auto",
    alignItems: "center",
    gap: 8,
    minHeight: 48,
    padding: "8px 9px",
    border: `1px solid ${active ? COLORS.plum : enabled ? "rgba(123,47,89,.24)" : "rgba(123,47,89,.13)"}`,
    borderRadius: 15,
    background: active
      ? "linear-gradient(135deg, #fff0f8, #fffaf7)"
      : enabled
        ? "linear-gradient(135deg, #fff, #fff8fc)"
        : "linear-gradient(135deg, rgba(255,250,247,.86), rgba(245,232,240,.54))",
    boxShadow: active ? "0 14px 30px rgba(123,47,89,.16)" : "0 8px 18px rgba(60,20,50,.055)",
  };
}

const iconButton = (disabled = false) => ({
  border: 0,
  background: "transparent",
  color: disabled ? COLORS.textFaint : COLORS.plum,
  fontSize: 15,
  cursor: disabled ? "default" : "pointer",
  padding: 0,
});

export default function LayersPanel({ layers, selectedLayerId, onSelect, onToggleVisible, onToggleLock, onMove, onDelete }) {
  const renderOrdered = [...layers].sort(layerSort);
  const visibleOrdered = [...renderOrdered].reverse();
  const layersByRow = DEFAULT_ROWS.reduce((acc, row) => ({ ...acc, [row.key]: [] }), {});
  visibleOrdered.forEach((layer) => (layersByRow[rowForLayer(layer)] || (layersByRow[rowForLayer(layer)] = [])).push(layer));
  const movableLayers = renderOrdered.filter((layer) => layer.type !== "base");
  const bottomMovableId = movableLayers[0]?.id;
  const topMovableId = movableLayers.at(-1)?.id;

  return (
    <section style={{ marginBottom: 8 }}>
      <div style={{ ...UI.sectionTitle, color: COLORS.plum }}>Layer Stack</div>
      <div style={{ display: "grid", gap: 8 }}>
        {DEFAULT_ROWS.map((row) => {
          const rowLayers = layersByRow[row.key] || [];
          const firstLayer = rowLayers[0];
          const enabled = rowLayers.length > 0;
          const active = rowLayers.some((layer) => layer.id === selectedLayerId);
          const isBase = firstLayer?.type === "base";
          const disableUp = !firstLayer || isBase || firstLayer.id === topMovableId;
          const disableDown = !firstLayer || isBase || firstLayer.id === bottomMovableId;
          return (
            <div key={row.key} style={layerRowStyle(active, enabled)}>
              <button type="button" title="Drag handle" disabled={!enabled} onClick={() => firstLayer && onMove(firstLayer.id, 1)} style={iconButton(!enabled || disableUp)}>Up</button>
              <button type="button" title={firstLayer?.visible === false ? "Hidden" : "Visible"} disabled={!enabled} onClick={() => firstLayer && onToggleVisible(firstLayer.id)} style={iconButton(!enabled)}>{firstLayer?.visible === false ? "○" : "👁"}</button>
              <button type="button" title={firstLayer?.locked ? "Locked" : "Unlocked"} disabled={!enabled || isBase} onClick={() => firstLayer && onToggleLock(firstLayer.id)} style={iconButton(!enabled || isBase)}>{firstLayer?.locked ? "🔒" : "🔓"}</button>
              <button type="button" disabled={!enabled} onClick={() => firstLayer && onSelect(firstLayer.id)} style={{ border: 0, background: "transparent", textAlign: "left", padding: 0, cursor: enabled ? "pointer" : "default", color: enabled ? COLORS.text : COLORS.textMuted }}>
                <strong style={{ display: "block", fontSize: 13 }}>{row.name}</strong>
                <span style={{ display: "block", fontSize: 11, color: active ? COLORS.plum : COLORS.textMuted }}>{enabled ? `${LABELS[firstLayer.type] || row.name} · ${rowLayers.length} layer${rowLayers.length > 1 ? "s" : ""}` : `Inactive · ${row.type}`}</span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 26, height: 26, borderRadius: 9, display: "grid", placeItems: "center", background: active ? COLORS.plum : "rgba(123,47,89,.08)", color: active ? "#fff" : COLORS.plum, fontWeight: 900 }}>{row.icon}</span>
                <button type="button" disabled={disableDown} onClick={() => firstLayer && onMove(firstLayer.id, -1)} style={UI.iconOnlyButton(false, disableDown)}>Down</button>
                <button type="button" title="Delete layer" disabled={!firstLayer || isBase || firstLayer.locked} onClick={() => firstLayer && onDelete(firstLayer.id)} style={UI.iconOnlyButton(false, !firstLayer || isBase || firstLayer.locked)}>×</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
