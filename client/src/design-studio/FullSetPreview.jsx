import { useEffect, useState } from "react";
import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import HandPreview from "./HandPreview.jsx";
import NailThumbnail from "./NailThumbnail.jsx";
import { FULL_SET_SLOTS, LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS, slotLabel } from "./blueprint.js";

const HERO_SET_ROWS = [
  { id: "top", slots: LEFT_HAND_SLOTS },
  { id: "bottom", slots: RIGHT_HAND_SLOTS },
];

const VIEW_LABELS = { full: "Full Set", left: "Left Hand", right: "Right Hand", spread: "Spread View" };

export default function FullSetPreview({ blueprint, activeNailId, onSelectSlot, onViewChange, view: controlledView, hero = false }) {
  const [localView, setLocalView] = useState(controlledView || "full");
  const view = controlledView || localView;
  useEffect(() => { if (controlledView) setLocalView(controlledView); }, [controlledView]);
  function choose(next) { setLocalView(next); onViewChange?.(next); }

  if (hero) {
    const rows = view === "left" ? [HERO_SET_ROWS[0]] : view === "right" ? [HERO_SET_ROWS[1]] : HERO_SET_ROWS;
    const isSpread = view === "spread";
    return <section data-testid={isSpread ? "spread-view-hero-canvas" : "full-set-hero-canvas"} data-default-view="fit-all-ten" aria-label={`${VIEW_LABELS[view] || "Full Set"} nail stage`} /* Full Set guardrail: gridTemplateRows: "repeat(2, minmax(0, 1fr))" */ style={{ height: "100%", minHeight: 0, display: "grid", gridTemplateRows: isSpread ? "1fr" : `repeat(${rows.length}, minmax(0, 1fr))`, gap: "clamp(12px, 2vh, 22px)", position: "relative", overflow: "visible", background: "radial-gradient(ellipse at 50% 64%, rgba(60,20,50,.14), transparent 34%), radial-gradient(circle at 18% 16%, rgba(245,200,232,.22), transparent 28%), linear-gradient(118deg, transparent 0 17%, rgba(216,166,66,.22) 17.12%, transparent 17.48% 42%, rgba(216,166,66,.15) 42.12%, transparent 42.42% 68%, rgba(216,166,66,.16) 68.12%, transparent 68.46%), linear-gradient(135deg, #fffaf7, #fbf1ed 52%, #f7e8f1)", padding: "clamp(18px, 3vh, 30px) clamp(16px, 2.4vw, 34px)", boxSizing: "border-box" }}>
      {isSpread ? <div data-testid="spread-view-nail-grid" style={{ minHeight: 0, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(10, minmax(54px, 1fr))", alignItems: "stretch", justifyItems: "stretch", columnGap: "clamp(8px, 1vw, 16px)", overflow: "visible" }}>
        {FULL_SET_SLOTS.map((slot) => {
          const nail = blueprint.nails.find((item) => item.slot === slot);
          return nail ? <NailThumbnail key={slot} nail={nail} hero active={nail.id === activeNailId} onClick={() => onSelectSlot(slot)} aria-label={`Edit ${slotLabel(slot)}`} /> : null;
        })}
      </div> : rows.map((row) => (
        <div key={row.id} data-testid={`full-set-hero-${row.id}-row`} style={{ minHeight: 0, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "stretch", justifyItems: "stretch", columnGap: "clamp(8px, 1.2vw, 18px)", overflow: "visible" }}>
          {row.slots.map((slot) => {
            const nail = blueprint.nails.find((item) => item.slot === slot);
            return nail ? <NailThumbnail key={slot} nail={nail} hero active={nail.id === activeNailId} onClick={() => onSelectSlot(slot)} aria-label={`Edit ${slotLabel(slot)}`} /> : null;
          })}
        </div>
      ))}
    </section>;
  }

  return <section style={{ borderTop: `1px solid ${COLORS.border}`, padding: "10px 14px", background: COLORS.cream }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      {["full", "left", "right", "spread"].map((item) => <button key={item} type="button" onClick={() => choose(item)} style={UI.miniButton(view === item)}>{VIEW_LABELS[item]}</button>)}
      <span style={{ marginLeft: "auto", color: COLORS.textMuted, fontSize: 12, fontWeight: 700 }}>Click a nail to edit immediately.</span>
    </div>
    {(view === "full" || view === "left" || view === "spread") && <HandPreview blueprint={blueprint} hand="left" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>}
    {(view === "full" || view === "right" || view === "spread") && <HandPreview blueprint={blueprint} hand="right" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>}
    <span style={{ display: "none" }}>{FULL_SET_SLOTS.length}</span>
  </section>;
}
