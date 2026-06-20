import { S } from "../styles.js";
import { UI } from "./studioStyles.js";
import { FULL_SET_SLOTS, LEFT_HAND_SLOTS, RIGHT_HAND_SLOTS, slotLabel } from "./blueprint.js";
export default function BulkActionsPanel({ activeSlot, clipboard, selectedSlots, onToggleSlot, onCopy, onPaste, onDuplicate, onMirror, onApplyBase, onApplyShape, onReset }) {
  const currentHand = activeSlot?.startsWith("left") ? "left" : "right";
  const canPaste = Boolean(clipboard) && selectedSlots.length > 0;
  return <div style={{ borderTop: "1px solid #F1D7E6", marginTop: 12, paddingTop: 12 }}>
    <div style={UI.sectionTitle}>Full-set actions</div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <button type="button" aria-label="Copy active nail" title="Copy active nail" style={S.btnSecondary} onClick={onCopy}>⧉ Copy</button>
      <button type="button" aria-label="Paste to selected nails" title="Paste to selected nails" style={{ ...S.btnSecondary, opacity: canPaste ? 1 : 0.55 }} aria-disabled={!canPaste} onClick={onPaste}>📋 Paste</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("hand")} title="Duplicate to hand" aria-label="Duplicate to hand">⧉ Hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("opposite")} title="Match opposite" aria-label="Match opposite">⇄ Match</button>
      <button type="button" style={S.btnGhost} onClick={() => onDuplicate("all")} title="Duplicate all" aria-label="Duplicate all">⧉ All</button>
      <button type="button" style={S.btnGhost} onClick={() => onMirror(currentHand)} title="Mirror hand" aria-label="Mirror hand">🪞 Mirror</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyBase("hand")} title="Base to hand" aria-label="Base to hand">↙ Base hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyBase("all")} title="Base to all" aria-label="Base to all">⬚ Base all</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyShape("hand")} title="Shape to hand" aria-label="Shape to hand">↙ Shape hand</button>
      <button type="button" style={S.btnGhost} onClick={() => onApplyShape("all")} title="Shape to all" aria-label="Shape to all">⬚ Shape all</button>
      <button type="button" style={{ ...S.btnSecondary, gridColumn: "1 / -1" }} onClick={onReset} title="Reset active nail" aria-label="Reset active nail">↺ Reset active nail</button>
    </div>
    <p style={{ margin: "10px 0 6px", fontSize: 12, fontWeight: 700, color: "#6B4A61" }}>2. Select destination nails, then paste copied design.</p>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{FULL_SET_SLOTS.map((slot) => <label key={slot} style={{ fontSize: 11 }}><input type="checkbox" checked={selectedSlots.includes(slot)} onChange={() => onToggleSlot(slot)}/> {slotLabel(slot)}</label>)}</div>
    <p style={{ margin: "8px 0 0", fontSize: 11, color: "#8A647C" }}>Paste to selected is available after you copy a nail and check at least one destination nail.</p>
  </div>;
}
