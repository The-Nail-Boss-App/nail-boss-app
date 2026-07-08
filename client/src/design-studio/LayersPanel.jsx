import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import { layerSort } from "./blueprint.js";
import { useState } from "react";

const LABELS = { base: "Base", gradient: "Gradient", pattern: "Pattern", drawing: "Drawing", charm: "Charm", decal: "Decal", jewel: "Jewel", frenchTip: "French Tip" };
const GROUP_LABELS = { base: "Nail Basics", gradient: "Chrome", pattern: "Chrome", drawing: "Drawing", charm: "Pearl Charm", decal: "Butterfly Sticker", jewel: "Pearl Charm", frenchTip: "French Tip" };
const GROUP_ORDER = ["French Tip", "Chrome", "Butterfly Sticker", "Pearl Charm", "Drawing", "Top Coat", "Nail Basics"];

function designGroupName(layer) {
  if (layer?.data?.topCoat || layer?.type === "topCoat") return "Top Coat";
  return GROUP_LABELS[layer?.type] || LABELS[layer?.type] || "Drawing";
}

export default function LayersPanel({ layers, selectedLayerId, onSelect, onToggleVisible, onToggleLock, onMove, onDelete }) {
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const renderOrdered = [...layers].sort(layerSort);
  const visibleOrdered = [...renderOrdered].reverse();
  const groups = visibleOrdered.reduce((acc, layer) => {
    const name = designGroupName(layer);
    acc[name] = acc[name] || [];
    acc[name].push(layer);
    return acc;
  }, {});
  const groupNames = Object.keys(groups).sort((a, b) => (GROUP_ORDER.indexOf(a) === -1 ? 99 : GROUP_ORDER.indexOf(a)) - (GROUP_ORDER.indexOf(b) === -1 ? 99 : GROUP_ORDER.indexOf(b)) || a.localeCompare(b));
  const movableLayers = renderOrdered.filter((layer) => layer.type !== "base");
  const bottomMovableId = movableLayers[0]?.id;
  const topMovableId = movableLayers.at(-1)?.id;
  return (
    <section style={{ marginBottom: 8 }}>
      <div style={UI.sectionTitle}>Design Groups</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {groupNames.map((groupName) => {
          const collapsed = collapsedGroups[groupName];
          return (
            <section key={groupName} data-testid="design-group" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, background: "#fff8fb", overflow: "hidden" }}>
              <button type="button" aria-expanded={!collapsed} onClick={() => setCollapsedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }))} style={{ width: "100%", border: 0, background: COLORS.roseDim, padding: "8px 10px", display: "flex", justifyContent: "space-between", cursor: "pointer", color: COLORS.plum, fontWeight: 900 }}>
                <span>{groupName}</span>
                <span>{collapsed ? "▸" : "▾"}</span>
              </button>
              {!collapsed && <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 6 }}>
        {groups[groupName].map((layer) => {
          const selected = layer.id === selectedLayerId;
          const isBase = layer.type === "base";
          const disableUp = isBase || layer.id === topMovableId;
          const disableDown = isBase || layer.id === bottomMovableId;
          return (
            <div key={layer.id} style={{ border: `1px solid ${selected ? COLORS.plum : COLORS.border}`, background: selected ? COLORS.roseDim : "#fff", borderRadius: 10, padding: 7 }}>
              <button type="button" onClick={() => onSelect(layer.id)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", color: COLORS.text }}>
                <strong style={{ fontSize: 12 }}>{layer.name}</strong>
                <span style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}>{LABELS[layer.type] || layer.type} · order {layer.order}</span>
              </button>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                <button type="button" onClick={() => onToggleVisible(layer.id)} style={UI.iconButton(false)}>{layer.visible ? "Hide" : "Show"}</button>
                <button type="button" onClick={() => onToggleLock(layer.id)} disabled={isBase} style={UI.iconButton(false, isBase)}>{layer.locked ? "Unlock" : "Lock"}</button>
                <button type="button" onClick={() => onMove(layer.id, 1)} disabled={disableUp} style={UI.iconButton(false, disableUp)}>Up</button>
                <button type="button" onClick={() => onMove(layer.id, -1)} disabled={disableDown} style={UI.iconButton(false, disableDown)}>Down</button>
                <button type="button" onClick={() => onDelete(layer.id)} disabled={isBase || layer.locked} style={UI.iconButton(false, isBase || layer.locked)}>Delete</button>
              </div>
            </div>
          );
        })}
              </div>}
            </section>
          );
        })}
      </div>
    </section>
  );
}
