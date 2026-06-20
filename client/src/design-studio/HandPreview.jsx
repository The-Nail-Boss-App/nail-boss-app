import NailThumbnail from "./NailThumbnail.jsx";
import { LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS } from "./blueprint.js";
export default function HandPreview({ blueprint, hand = "left", activeNailId, selectedSlots = [], onSelectSlot }) {
  const slots = hand === "left" ? LEFT_HAND_SLOTS : RIGHT_HAND_SLOTS;
  return <div aria-label={`${hand} hand preview`} style={{ borderLeft: hand === "left" ? "4px solid #9D4D72" : "4px solid #E8A0BF", display: "flex", gap: 10, alignItems: "center", overflowX: "auto", padding: "8px 2px 8px 10px", marginBottom: 6, background: hand === "left" ? "#fff7fb" : "#fff" }}>{slots.map((slot) => {
    const nail = blueprint.nails.find((item) => item.slot === slot);
    return nail ? <NailThumbnail key={slot} nail={nail} active={nail.id === activeNailId} selected={selectedSlots.includes(slot)} onClick={() => onSelectSlot(slot)}/> : null;
  })}</div>;
}
