import { useState } from "react";
import { COLORS } from "../styles.js";
import { UI } from "./studioStyles.js";
import HandPreview from "./HandPreview.jsx";
export default function FullSetPreview({ blueprint, activeNailId, selectedSlots = [], onSelectSlot, onViewChange }) {
  const [view, setView] = useState("full");
  function choose(next) { setView(next); onViewChange?.(); }
  return <section style={UI.setPreview}>
    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
      {["full", "left", "right"].map((item) => <button key={item} type="button" onClick={() => choose(item)} style={UI.miniButton(view === item)}>{item === "full" ? "Full Set" : item === "left" ? "Left Hand" : "Right Hand"}</button>)}
      <span style={{ marginLeft: "auto", color: COLORS.textMuted, fontSize: 12, fontWeight: 700 }}>Click a thumbnail to edit that nail. Selected targets stay highlighted.</span>
    </div>
    {(view === "full" || view === "left") && <HandPreview blueprint={blueprint} hand="left" activeNailId={activeNailId} selectedSlots={selectedSlots} onSelectSlot={onSelectSlot}/>}
    {(view === "full" || view === "right") && <HandPreview blueprint={blueprint} hand="right" activeNailId={activeNailId} selectedSlots={selectedSlots} onSelectSlot={onSelectSlot}/>}
  </section>;
}
