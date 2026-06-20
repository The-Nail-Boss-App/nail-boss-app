import NailThumbnail from "./NailThumbnail.jsx";
import { LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS } from "./blueprint.js";
export default function HandPreview({ blueprint, hand = "left", activeNailId, onSelectSlot }) {
  const slots = hand === "left" ? LEFT_HAND_SLOTS : RIGHT_HAND_SLOTS;
  return <div style={{ display: "flex", gap: 10, alignItems: "center", overflowX: "auto", padding: "8px 2px" }}>{slots.map((slot) => {
    const nail = blueprint.nails.find((item) => item.slot === slot);
    return nail ? <NailThumbnail key={slot} nail={nail} active={nail.id === activeNailId} onClick={() => onSelectSlot(slot)}/> : null;
  })}</div>;
}
