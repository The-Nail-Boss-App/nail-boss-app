import { COLORS } from "../styles.js";

const SIZE_MAP = {
  small: { width: 30, height: 44, capWidth: 14, capHeight: 12, bodyWidth: 24, bodyHeight: 28 },
  medium: { width: 42, height: 60, capWidth: 18, capHeight: 16, bodyWidth: 34, bodyHeight: 38 },
  large: { width: 56, height: 78, capWidth: 24, capHeight: 20, bodyWidth: 46, bodyHeight: 52 },
};

export default function PolishBottle({ colorHex = "#E8A0BF", label, selected = false, size = "small", polishType, onClick, className = "" }) {
  const dims = SIZE_MAP[size] || SIZE_MAP.small;
  const accessibleLabel = label || `${polishType ? `${polishType} ` : ""}Polish Color ${colorHex}`;
  const bottle = <span aria-hidden="true" className={`polish-bottle-figure ${selected ? "is-selected" : ""}`} style={{ position: "relative", display: "inline-block", width: dims.width, height: dims.height, transition: "transform 180ms ease, filter 180ms ease" }}>
    <span style={{ position: "absolute", left: (dims.width - dims.capWidth) / 2, top: 0, width: dims.capWidth, height: dims.capHeight, borderRadius: "5px 5px 3px 3px", background: "linear-gradient(180deg, #3B1F35, #1F1020)", boxShadow: "inset 2px 0 0 rgba(255,255,255,.16)" }}/>
    <span style={{ position: "absolute", left: (dims.width - dims.bodyWidth) / 2, top: dims.capHeight - 2, width: dims.bodyWidth, height: dims.bodyHeight, borderRadius: "10px 10px 12px 12px", border: `1px solid ${selected ? COLORS.plum : "rgba(59,31,53,.22)"}`, background: "linear-gradient(135deg, rgba(255,255,255,.86), rgba(255,255,255,.28))", boxShadow: selected ? "0 0 0 3px rgba(123,47,89,.18), 0 8px 18px rgba(59,31,53,.18)" : "0 6px 14px rgba(59,31,53,.14)", overflow: "hidden" }}>
      <span style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "78%", background: colorHex, borderTop: "1px solid rgba(255,255,255,.55)" }}/>
      <span style={{ position: "absolute", left: "22%", top: "18%", width: "18%", height: "58%", borderRadius: 999, background: "rgba(255,255,255,.42)", filter: "blur(.2px)", transition: "opacity 180ms ease" }}/>
      <span style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(255,255,255,.28), transparent 46%, rgba(0,0,0,.06))" }}/><span className="polish-bottle-reflection" style={{ position: "absolute", inset: 0, background: "linear-gradient(115deg, transparent 8%, rgba(255,255,255,.34) 18%, transparent 34%)", opacity: selected ? .72 : .46, transform: "translateX(-12%)", transition: "opacity 180ms ease, transform 220ms ease" }}/>
    </span>
  </span>;

  if (onClick) {
    return <button type="button" aria-label={accessibleLabel} title={accessibleLabel} onClick={onClick} className={`polish-bottle-button ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", border: 0, background: "transparent", padding: 1, cursor: "pointer", borderRadius: 12, boxSizing: "border-box", transition: "transform 180ms ease, filter 180ms ease, box-shadow 180ms ease" }}>{bottle}</button>;
  }
  return <span role="img" aria-label={accessibleLabel} title={accessibleLabel} className={`polish-bottle-static ${className}`.trim()} style={{ display: "inline-flex", justifyContent: "center", maxWidth: "100%", padding: 1, boxSizing: "border-box" }}>{bottle}</span>;
}
