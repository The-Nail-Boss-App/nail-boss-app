import { useState } from "react";
import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import HandPreview from "./HandPreview.jsx";
import NailThumbnail from "./NailThumbnail.jsx";
import { FULL_SET_SLOTS, LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS, slotLabel } from "./blueprint.js";

const HERO_SET_ROWS = [
  { id: "top", slots: LEFT_HAND_SLOTS },
  { id: "bottom", slots: RIGHT_HAND_SLOTS },
];

export default function FullSetPreview({ blueprint, activeNailId, onSelectSlot, onViewChange, hero = false }) {
  const [view, setView] = useState("full");
  function choose(next) { setView(next); onViewChange?.(next); }

  if (hero) {
    return <section data-testid="full-set-hero-canvas" aria-label="Full Set Mode hero canvas" style={{ height: "100%", minHeight: 0, display: "grid", gridTemplateRows: "1fr 1fr", gap: "clamp(8px, 1.8vh, 18px)", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 50% 64%, rgba(60,20,50,.14), transparent 34%), radial-gradient(circle at 18% 16%, rgba(245,200,232,.22), transparent 28%), linear-gradient(118deg, transparent 0 17%, rgba(216,166,66,.22) 17.12%, transparent 17.48% 42%, rgba(216,166,66,.15) 42.12%, transparent 42.42% 68%, rgba(216,166,66,.16) 68.12%, transparent 68.46%), linear-gradient(135deg, #fffaf7, #fbf1ed 52%, #f7e8f1)", padding: "clamp(12px, 2vh, 22px) clamp(12px, 1.8vw, 24px)", boxSizing: "border-box" }}>
      {HERO_SET_ROWS.map((row) => (
        <div key={row.id} data-testid={`full-set-hero-${row.id}-row`} style={{ minHeight: 0, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", alignItems: "center", justifyItems: "center", columnGap: "clamp(6px, 1vw, 16px)" }}>
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
      {["full", "left", "right"].map((item) => <button key={item} type="button" onClick={() => choose(item)} style={UI.miniButton(view === item)}>{item === "full" ? "Full Set" : item === "left" ? "Left Hand" : "Right Hand"}</button>)}
      <span style={{ marginLeft: "auto", color: COLORS.textMuted, fontSize: 12, fontWeight: 700 }}>Click a nail to edit that nail.</span>
    </div>
    {(view === "full" || view === "left") && <HandPreview blueprint={blueprint} hand="left" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>}
    {(view === "full" || view === "right") && <HandPreview blueprint={blueprint} hand="right" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>}
    <span style={{ display: "none" }}>{FULL_SET_SLOTS.length}</span>
  </section>;
}
