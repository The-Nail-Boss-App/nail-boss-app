import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import { layerSort } from "./blueprint.js";

const LABELS = { base: "Base", gradient: "Gradient", pattern: "Pattern", drawing: "Drawing", charm: "Charm", decal: "Decal", jewel: "Jewel", frenchTip: "French Tip" };

export default function LayersPanel({ layers, selectedLayerId, onSelect, onToggleVisible, onToggleLock, onMove, onDelete }) {
  const renderOrdered = [...layers].sort(layerSort);
  const visibleOrdered = [...renderOrdered].reverse();
  const movableLayers = renderOrdered.filter((layer) => layer.type !== "base");
  const bottomMovableId = movableLayers[0]?.id;
  const topMovableId = movableLayers.at(-1)?.id;
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={UI.sectionTitle}>Layers</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {visibleOrdered.map((layer) => {
          const selected = layer.id === selectedLayerId;
          const isBase = layer.type === "base";
          const disableUp = isBase || layer.id === topMovableId;
          const disableDown = isBase || layer.id === bottomMovableId;
          return (
            <div key={layer.id} style={{ border: `1.5px solid ${selected ? COLORS.plum : COLORS.border}`, background: selected ? COLORS.roseDim : "#fff", borderRadius: 12, padding: 10 }}>
              <button type="button" onClick={() => onSelect(layer.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", color: COLORS.text }}>
                <strong style={{ fontSize: 13 }}>{layer.name}</strong>
                <span style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}>{LABELS[layer.type] || layer.type} · order {layer.order}</span>
              </button>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
                <button type="button" onClick={() => onToggleVisible(layer.id)} style={UI.iconButton(false)}>{layer.visible ? "Hide" : "Show"}</button>
                <button type="button" onClick={() => onToggleLock(layer.id)} disabled={isBase} style={UI.iconButton(false, isBase)}>{layer.locked ? "Unlock" : "Lock"}</button>
                <button type="button" onClick={() => onMove(layer.id, 1)} disabled={disableUp} style={UI.iconButton(false, disableUp)}>Up</button>
                <button type="button" onClick={() => onMove(layer.id, -1)} disabled={disableDown} style={UI.iconButton(false, disableDown)}>Down</button>
                <button type="button" onClick={() => onDelete(layer.id)} disabled={isBase || layer.locked} style={UI.iconButton(false, isBase || layer.locked)}>Delete</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
