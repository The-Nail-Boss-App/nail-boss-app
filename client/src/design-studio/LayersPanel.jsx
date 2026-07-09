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
    gridTemplateColumns: "28px 30px 30px 1fr 34px",
    alignItems: "center",
    gap: 9,
    minHeight: 54,
    padding: "9px 10px",
    border: `1px solid ${active ? COLORS.softGold : enabled ? "rgba(240,79,150,.30)" : "rgba(123,47,89,.14)"}`,
    borderRadius: 14,
    background: active
      ? "linear-gradient(135deg, rgba(91,15,47,.96), rgba(59,31,53,.96))"
      : enabled
        ? "linear-gradient(135deg, rgba(255,250,247,.98), rgba(245,200,232,.28))"
        : "linear-gradient(135deg, rgba(255,250,247,.72), rgba(245,232,240,.42))",
    color: active ? COLORS.cream : enabled ? COLORS.text : COLORS.textMuted,
    boxShadow: active ? "0 16px 34px rgba(60,20,50,.22)" : "0 8px 18px rgba(60,20,50,.07)",
  };
}

const iconButton = (active = false, disabled = false) => ({
  border: "1px solid transparent",
  background: active ? "rgba(240,79,150,.16)" : "transparent",
  color: disabled ? COLORS.textFaint : "inherit",
  fontSize: 16,
  cursor: disabled ? "default" : "pointer",
  padding: 3,
  borderRadius: 9,
  minHeight: 28,
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
    <section style={{ marginBottom: 8 }} data-testid="layer-stack-panel">
      <div style={{ ...UI.sectionTitle, color: COLORS.rose }}>Design Layers</div>
      <div role="list" aria-label="Layer stack" style={{ display: "grid", gap: 8 }}>
        {DEFAULT_ROWS.map((row) => {
          const rowLayers = layersByRow[row.key] || [];
          const firstLayer = rowLayers[0];
          const enabled = rowLayers.length > 0;
          const active = rowLayers.some((layer) => layer.id === selectedLayerId);
          const isBase = firstLayer?.type === "base";
          const disableUp = !firstLayer || isBase || firstLayer.id === topMovableId;
          const disableDown = !firstLayer || isBase || firstLayer.id === bottomMovableId;
          return (
            <div key={row.key} role="listitem" style={layerRowStyle(active, enabled)} data-layer-active={active ? "true" : "false"} data-layer-enabled={enabled ? "true" : "false"}>
              <button type="button" aria-label={`Move ${row.name}`} title="Drag handle / move up" disabled={disableUp} onClick={() => firstLayer && onMove(firstLayer.id, 1)} style={iconButton(false, !enabled || disableUp)}>Up</button>
              <button type="button" aria-label={`${firstLayer?.visible === false ? "Show" : "Hide"} ${row.name}`} title={firstLayer?.visible === false ? "Hidden" : "Visible"} disabled={!enabled} onClick={() => firstLayer && onToggleVisible(firstLayer.id)} style={iconButton(firstLayer?.visible !== false, !enabled)}>{firstLayer?.visible === false ? "◌" : "◉"}</button>
              <button type="button" aria-label={`${firstLayer?.locked ? "Unlock" : "Lock"} ${row.name}`} title={firstLayer?.locked ? "Locked" : "Unlocked"} disabled={!enabled || isBase} onClick={() => firstLayer && onToggleLock(firstLayer.id)} style={iconButton(firstLayer?.locked, !enabled || isBase)}>{firstLayer?.locked ? "🔒" : "◇"}</button>
              <button type="button" disabled={!enabled} onClick={() => firstLayer && onSelect(firstLayer.id)} style={{ border: 0, background: "transparent", textAlign: "left", padding: 0, cursor: enabled ? "pointer" : "default", color: "inherit" }}>
                <strong style={{ display: "block", fontSize: 14, letterSpacing: ".02em" }}>{row.name}</strong>
                <span style={{ display: "block", fontSize: 11, color: active ? COLORS.roseDim : COLORS.textMuted }}>{enabled ? `${LABELS[firstLayer.type] || row.name} · ${rowLayers.length} layer${rowLayers.length > 1 ? "s" : ""}` : `Inactive · ${row.type}`}</span>
              </button>
              <div style={{ display: "grid", gap: 2 }}><button type="button" aria-label={`Move ${row.name} down`} disabled={disableDown} onClick={() => firstLayer && onMove(firstLayer.id, -1)} style={{ ...iconButton(false, !enabled || disableDown), fontSize: 10 }}>Down</button><button type="button" title="Delete layer" disabled={!firstLayer || isBase || firstLayer.locked} onClick={() => firstLayer && onDelete(firstLayer.id)} style={iconButton(false, !firstLayer || isBase || firstLayer.locked)}>{row.icon}</button></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
