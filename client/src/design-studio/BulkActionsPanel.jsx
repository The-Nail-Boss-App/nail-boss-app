import { S } from "../styles.js";
import { UI } from "./studioStyles.js";
import { FULL_SET_SLOTS, LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS, slotLabel } from "./blueprint.js";
export default function BulkActionsPanel({ activeSlot, clipboard, selectedSlots, onToggleSlot, onCopy, onPaste, onDuplicate, onMirror, onApplyBase, onApplyShape, onReset }) {
  const currentHand = activeSlot?.startsWith("left") ? "left" : "right";
  const canPaste = Boolean(clipboard) && selectedSlots.length > 0;
  return <div style={{ borderTop: "1px solid #F1D7E6", marginTop: 12, paddingTop: 12 }}>
    <div style={UI.sectionTitle}>Full-set actions</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <button type="button" style={S.btnSecondary} onClick={onCopy}>1. Copy active nail</button>
      <button type="button" style={{ ...S.btnSecondary, opacity: canPaste ? 1 : 0.55 }} aria-disabled={!canPaste} onClick={onPaste}>3. Paste to selected</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("hand")}>Duplicate to hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("opposite")}>Match opposite</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("all")}>Duplicate all</button>
      <button type="button" style={S.btnGhost} onClick={() => onMirror(currentHand)}>Mirror hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyBase("hand")}>Base to hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyBase("all")}>Base to all</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyShape("hand")}>Shape to hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyShape("all")}>Shape to all</button>
      <button type="button" style={{ ...S.btnSecondary, gridColumn: "1 / -1" }} onClick={onReset}>Reset active nail</button>
    </div>
    <p style={{ margin: "10px 0 6px", fontSize: 12, fontWeight: 700, color: "#6B4A61" }}>2. Select destination nails, then paste copied design.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{FULL_SET_SLOTS.map((slot) => <label key={slot} style={{ fontSize: 11 }}><input type="checkbox" checked={selectedSlots.includes(slot)} onChange={() => onToggleSlot(slot)}/> {slotLabel(slot)}</label>)}</div>
    <p style={{ margin: "8px 0 0", fontSize: 11, color: "#8A647C" }}>Paste to selected is available after you copy a nail and check at least one destination nail.</p>
  </div>;
}
