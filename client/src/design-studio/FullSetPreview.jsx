import { useState } from "react";
import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import HandPreview from "./HandPreview.jsx";
import NailThumbnail from "./NailThumbnail.jsx";
import { FULL_SET_SLOTS, LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS, slotLabel } from "./blueprint.js";

export default function FullSetPreview({ blueprint, activeNailId, onSelectSlot, onViewChange, hero = false }) {
  const [view, setView] = useState("full");
  function choose(next) { setView(next); onViewChange?.(); }

  if (hero) {
    const heroSlots = view === "left" ? LEFT_HAND_SLOTS : view === "right" ? RIGHT_HAND_SLOTS : FULL_SET_SLOTS;
    return <section data-testid="full-set-hero-canvas" aria-label="Full Set Mode hero canvas" style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse at 50% 64%, rgba(60,20,50,.14), transparent 34%), radial-gradient(circle at 18% 16%, rgba(245,200,232,.22), transparent 28%), linear-gradient(118deg, transparent 0 17%, rgba(216,166,66,.22) 17.12%, transparent 17.48% 42%, rgba(216,166,66,.15) 42.12%, transparent 42.42% 68%, rgba(216,166,66,.16) 68.12%, transparent 68.46%), linear-gradient(135deg, #fffaf7, #fbf1ed 52%, #f7e8f1)", padding: "18px clamp(14px, 2vw, 28px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flex: "0 0 auto" }}>
        {["full", "left", "right"].map((item) => <button key={item} type="button" onClick={() => choose(item)} style={UI.miniButton(view === item)}>{item === "full" ? "Full Set" : item === "left" ? "Left Hand" : "Right Hand"}</button>)}
        <span style={{ marginLeft: "auto", color: COLORS.plum, fontSize: 12, fontWeight: 900, letterSpacing: ".08em", textTransform: "uppercase" }}>Ten large editable nails</span>
      </div>
      <div style={{ flex: "1 1 auto", minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(1px, .45vw, 8px)", overflow: "visible" }}>
        {heroSlots.map((slot) => {
          const nail = blueprint.nails.find((item) => item.slot === slot);
          return nail ? <NailThumbnail key={slot} nail={nail} hero active={nail.id === activeNailId} onClick={() => onSelectSlot(slot)} aria-label={`Edit ${slotLabel(slot)}`} /> : null;
        })}
      </div>
    </section>;
  }

  return <section style={{ borderTop: `1px solid ${COLORS.border}`, padding: "10px 14px", background: COLORS.cream }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      {["full", "left", "right"].map((item) => <button key={item} type="button" onClick={() => choose(item)} style={UI.miniButton(view === item)}>{item === "full" ? "Full Set" : item === "left" ? "Left Hand" : "Right Hand"}</button>)}
      <span style={{ marginLeft: "auto", color: COLORS.textMuted, fontSize: 12, fontWeight: 700 }}>Click a nail to edit that nail.</span>
    </div>
    {(view === "full" || view === "left") && <HandPreview blueprint={blueprint} hand="left" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>} 
    {(view === "full" || view === "right") && <HandPreview blueprint={blueprint} hand="right" activeNailId={activeNailId} onSelectSlot={onSelectSlot}/>} 
  </section>;
}
