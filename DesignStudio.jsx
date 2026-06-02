// ─────────────────────────────────────────────────────────────────────────────
// DesignStudio.jsx  —  Task 4 refined version
// Self-contained: inline NailSVG + controls + save logic.
// Layout: controls LEFT  |  preview RIGHT
// Validation: name + baseColorHex required before save.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useId } from "react";
import { S, COLORS } from "./styles.js";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const SHAPES  = ["Almond", "Coffin", "Square", "Stiletto", "Oval"];
const EFFECTS = ["Solid", "Gradient", "Chrome", "CatEye", "Marble"];

const EFFECT_LABELS = {
  Solid:    "Solid",
  Gradient: "Gradient",
  Chrome:   "Chrome",
  CatEye:   "Cat Eye",
  Marble:   "Marble",
};

const DEFAULTS = {
  name:          "",
  shape:         "Almond",
  length:        50,          // 1-100
  width:         50,          // 1-100
  baseColorHex:  "#E8A0BF",
  effect:        "Solid",
  effectColorHex:"#FFFFFF",
  tags:          "",
};

// ─────────────────────────────────────────────────────────────────────────────
// NailSVG — inline SVG nail that responds to all sliders/pickers.
// Rotated 180° so the tip faces DOWN (artist orientation).
// ─────────────────────────────────────────────────────────────────────────────

const VB_W = 200;
const VB_H = 300;
const CX   = 100;

/** Build an SVG path string for the nail body based on shape + dimensions. */
function buildNailPath(shape, halfW, nailH) {
  const baseY = 252;
  const tipY  = baseY - nailH;

  switch (shape) {
    case "Square":
      // Flat top, nearly vertical sides — slight rx handled by SVG filter
      return [
        `M ${CX - halfW} ${baseY}`,
        `L ${CX - halfW} ${tipY + 4}`,
        `Q ${CX - halfW} ${tipY}  ${CX - halfW + 4} ${tipY}`,
        `L ${CX + halfW - 4} ${tipY}`,
        `Q ${CX + halfW} ${tipY}  ${CX + halfW} ${tipY + 4}`,
        `L ${CX + halfW} ${baseY}`,
        "Z",
      ].join(" ");

    case "Coffin": {
      // Tapers to a flat squared-off tip
      const tipHW = halfW * 0.28;
      return [
        `M ${CX - halfW}        ${baseY}`,
        `L ${CX - halfW * 0.80} ${tipY + 22}`,
        `L ${CX - tipHW}        ${tipY}`,
        `L ${CX + tipHW}        ${tipY}`,
        `L ${CX + halfW * 0.80} ${tipY + 22}`,
        `L ${CX + halfW}        ${baseY}`,
        "Z",
      ].join(" ");
    }

    case "Stiletto":
      // Very narrow pointed tip
      return [
        `M ${CX - halfW}        ${baseY}`,
        `C ${CX - halfW}        ${baseY - nailH * 0.38}`,
        `  ${CX - halfW * 0.18} ${tipY + nailH * 0.12}`,
        `  ${CX}                ${tipY}`,
        `C ${CX + halfW * 0.18} ${tipY + nailH * 0.12}`,
        `  ${CX + halfW}        ${baseY - nailH * 0.38}`,
        `  ${CX + halfW}        ${baseY}`,
        "Z",
      ].join(" ");

    case "Oval":
      // Softer, more rounded tip than Almond — flatter curve
      return [
        `M ${CX - halfW} ${baseY}`,
        `C ${CX - halfW} ${baseY - nailH * 0.32}`,
        `  ${CX - halfW * 0.72} ${tipY + nailH * 0.08}`,
        `  ${CX}                ${tipY}`,
        `C ${CX + halfW * 0.72} ${tipY + nailH * 0.08}`,
        `  ${CX + halfW} ${baseY - nailH * 0.32}`,
        `  ${CX + halfW} ${baseY}`,
        "Z",
      ].join(" ");

    case "Almond":
    default:
      // Fuller curve at mid-nail, tapers elegantly to tip
      return [
        `M ${CX - halfW} ${baseY}`,
        `C ${CX - halfW}        ${baseY - nailH * 0.50}`,
        `  ${CX - halfW * 0.48} ${tipY  + nailH * 0.16}`,
        `  ${CX}                ${tipY  + nailH * 0.03}`,
        `C ${CX + halfW * 0.48} ${tipY  + nailH * 0.16}`,
        `  ${CX + halfW}        ${baseY - nailH * 0.50}`,
        `  ${CX + halfW}        ${baseY}`,
        "Z",
      ].join(" ");
  }
}

/** SVG gradient / pattern defs for each effect. */
function EffectDefs({ effect, baseColor, effectColor, uid }) {
  switch (effect) {
    case "Gradient":
      return (
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={effectColor} />
            <stop offset="100%" stopColor={baseColor}   />
          </linearGradient>
        </defs>
      );
    case "Chrome":
      return (
        <defs>
          <linearGradient id={uid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fff"        stopOpacity=".9"  />
            <stop offset="22%"  stopColor={baseColor}                     />
            <stop offset="58%"  stopColor={effectColor}                   />
            <stop offset="100%" stopColor="#fff"        stopOpacity=".55" />
          </linearGradient>
        </defs>
      );
    case "CatEye":
      return (
        <defs>
          <radialGradient id={uid} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={effectColor} stopOpacity=".95" />
            <stop offset="40%"  stopColor={effectColor} stopOpacity=".3"  />
            <stop offset="100%" stopColor={baseColor}                     />
          </radialGradient>
        </defs>
      );
    case "Marble":
      return (
        <defs>
          <linearGradient id={uid} x1=".12" y1="0" x2=".88" y2="1">
            <stop offset="0%"   stopColor={baseColor}                     />
            <stop offset="35%"  stopColor={effectColor} stopOpacity=".55" />
            <stop offset="68%"  stopColor={baseColor}   stopOpacity=".9"  />
            <stop offset="100%" stopColor={effectColor} stopOpacity=".4"  />
          </linearGradient>
        </defs>
      );
    default:
      return null;
  }
}

function NailSVG({ shape, length, width, baseColor, effectColor, effect }) {
  const uid    = useId().replace(/:/g, "g");   // valid XML id
  // Map 1-100 slider to SVG units
  const nailH  = 75  + (length / 100) * 120;  // 75 → 195 viewBox px
  const halfW  = 26  + (width  / 100) * 46;   // 26 → 72  viewBox px
  const path   = buildNailPath(shape, halfW, nailH);
  const fill   = effect === "Solid" ? baseColor : `url(#${uid})`;

  const baseY  = 252;
  const tipY   = baseY - nailH;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      width="160"
      height={Math.round(160 * VB_H / VB_W)}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`${shape} nail preview`}
      style={{
        transform: "rotate(180deg)",
        filter: "drop-shadow(0 8px 24px rgba(59,31,53,.22))",
        display: "block",
        overflow: "visible",
      }}
    >
      <EffectDefs
        effect={effect}
        baseColor={baseColor}
        effectColor={effectColor}
        uid={uid}
      />

      {/* ── Nail body ── */}
      <path d={path} fill={fill} />

      {/* ── Marble veins ── */}
      {effect === "Marble" && (
        <>
          <path
            d={`M ${CX - halfW * 0.52} ${baseY}
                C ${CX - halfW * 0.22} ${baseY - nailH * 0.4}
                  ${CX + halfW * 0.12} ${tipY + nailH * 0.36}
                  ${CX + halfW * 0.40} ${tipY}`}
            stroke={effectColor} strokeWidth="2.5" strokeOpacity=".42" fill="none"
          />
          <path
            d={`M ${CX + halfW * 0.26} ${baseY - nailH * 0.08}
                C ${CX}                ${baseY - nailH * 0.50}
                  ${CX - halfW * 0.16} ${tipY  + nailH * 0.22}
                  ${CX - halfW * 0.07} ${tipY  + nailH * 0.04}`}
            stroke={effectColor} strokeWidth="1.5" strokeOpacity=".30" fill="none"
          />
        </>
      )}

      {/* ── Cat Eye band ── */}
      {effect === "CatEye" && (
        <ellipse
          cx={CX}
          cy={(tipY + baseY) / 2}
          rx={halfW * 0.13}
          ry={nailH  * 0.36}
          fill={effectColor}
          fillOpacity=".68"
        />
      )}

      {/* ── Specular highlight ── */}
      <path
        d={`M ${CX - halfW * 0.46} ${baseY - nailH * 0.09}
            C ${CX - halfW * 0.42} ${baseY - nailH * 0.54}
              ${CX - halfW * 0.05} ${tipY  + nailH * 0.13}
              ${CX}                ${tipY  + nailH * 0.04}`}
        fill="white"
        fillOpacity=".18"
      />

      {/* ── Cuticle shadow (appears at tip after 180° rotation) ── */}
      <ellipse
        cx={CX}
        cy={baseY + 4}
        rx={halfW * 0.80}
        ry={9}
        fill="rgba(0,0,0,.14)"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Small form helper components
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ ...S.label, color: error ? "#b91c1c" : undefined }}>{label}</label>
      {children}
      {error && (
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#b91c1c", fontWeight: 500 }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ChipGroup({ options, value, onSelect, labelMap }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {options.map(opt => {
        const active = value === opt;
        return (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            style={{
              padding: "7px 13px",
              borderRadius: 20,
              border: `1.5px solid ${active ? COLORS.plum : COLORS.border}`,
              background: active ? COLORS.plum : "#fff",
              color:      active ? "#fff"       : COLORS.text,
              fontSize:   12,
              fontWeight: 600,
              cursor:     "pointer",
              transition: "all .13s",
              lineHeight: 1,
            }}
          >
            {labelMap ? labelMap[opt] : opt}
          </button>
        );
      })}
    </div>
  );
}

function ColorRow({ value, onChange, error }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: 44, height: 44,
          border: `1.5px solid ${error ? "#fca5a5" : COLORS.border}`,
          borderRadius: 10, padding: 2,
          cursor: "pointer", background: "none", flexShrink: 0,
        }}
      />
      <input
        type="text"
        value={value}
        onChange={e => {
          // Accept valid 3 or 6-char hex strings
          const v = e.target.value;
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
        }}
        maxLength={7}
        placeholder="#E8A0BF"
        style={{
          ...S.input,
          fontFamily: "monospace",
          textTransform: "uppercase",
          flex: 1,
          borderColor: error ? "#fca5a5" : undefined,
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DesignStudio — main exported component
// ─────────────────────────────────────────────────────────────────────────────

export default function DesignStudio() {
  const [fields,  setFields]  = useState(DEFAULTS);
  const [errors,  setErrors]  = useState({});       // field-level validation
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);     // { ok: bool, msg: string }

  function set(key, value) {
    setFields(prev => ({ ...prev, [key]: value }));
    // Clear that field's error as soon as user edits it
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const errs = {};
    if (!fields.name.trim())
      errs.name = "Design name is required.";
    if (!fields.baseColorHex || fields.baseColorHex === "#") 
      errs.baseColorHex = "Pick a base color.";
    if (!/^#[0-9a-fA-F]{6}$/.test(fields.baseColorHex))
      errs.baseColorHex = "Enter a valid 6-digit hex color (e.g. #E8A0BF).";
    return errs;
  }

  const showToast = useCallback((ok, msg) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await fetch("/api/designs", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:           fields.name.trim(),
          shape:          fields.shape,
          length:         fields.length  / 100,
          width:          fields.width   / 100,
          baseColorHex:   fields.baseColorHex,
          effect:         fields.effect,
          effectColorHex: fields.effectColorHex,
          tags: fields.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Server error");
      }
      showToast(true, `"${fields.name.trim()}" saved!`);
      setFields(DEFAULTS);
    } catch (e) {
      showToast(false, e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  const showEffectColor = fields.effect !== "Solid";
  const effectColorLabel = {
    Gradient: "Gradient Top Color",
    Chrome:   "Chrome Highlight",
    CatEye:   "Cat Eye Band Color",
    Marble:   "Marble Vein Color",
  }[fields.effect] || "Effect Color";

  // ── Colours for the save button state ──────────────────────────────────────
  const hasErrors = Object.values(errors).some(Boolean);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: "flex",
      height: "100%",
      overflow: "hidden",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>

      {/* ══ LEFT — Controls panel ══════════════════════════════════════════════ */}
      <div style={{
        width: 320,
        flexShrink: 0,
        borderRight: `1px solid ${COLORS.border}`,
        background: COLORS.surface,
        overflowY: "auto",
        padding: "28px 22px 32px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}>
        <p style={{
          fontSize: 13, fontWeight: 700, letterSpacing: ".07em",
          textTransform: "uppercase", color: COLORS.plumLight,
          marginBottom: 22,
        }}>
          Controls
        </p>

        {/* Design Name (moved to top — required, so user sees it first) */}
        <Field label="Design Name *" error={errors.name}>
          <input
            type="text"
            placeholder='e.g. "Sunset Glam"'
            value={fields.name}
            onChange={e => set("name", e.target.value)}
            style={{
              ...S.input,
              borderColor: errors.name ? "#fca5a5" : undefined,
              outline: errors.name ? "none" : undefined,
              boxShadow: errors.name ? "0 0 0 2px #fecaca" : undefined,
            }}
          />
        </Field>

        {/* Shape */}
        <Field label="Nail Shape">
          <ChipGroup
            options={SHAPES}
            value={fields.shape}
            onSelect={v => set("shape", v)}
          />
        </Field>

        {/* Length */}
        <Field label={`Length — ${fields.length}%`}>
          <input
            type="range" min="1" max="100" value={fields.length}
            onChange={e => set("length", Number(e.target.value))}
            style={{ width: "100%", accentColor: COLORS.plum, marginTop: 4 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
            <span>Short</span><span>Long</span>
          </div>
        </Field>

        {/* Width */}
        <Field label={`Width — ${fields.width}%`}>
          <input
            type="range" min="1" max="100" value={fields.width}
            onChange={e => set("width", Number(e.target.value))}
            style={{ width: "100%", accentColor: COLORS.plum, marginTop: 4 }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: COLORS.muted, marginTop: 2 }}>
            <span>Narrow</span><span>Wide</span>
          </div>
        </Field>

        {/* Base Color */}
        <Field label="Base Color *" error={errors.baseColorHex}>
          <ColorRow
            value={fields.baseColorHex}
            onChange={v => set("baseColorHex", v)}
            error={!!errors.baseColorHex}
          />
        </Field>

        {/* Effect */}
        <Field label="Effect">
          <ChipGroup
            options={EFFECTS}
            value={fields.effect}
            onSelect={v => set("effect", v)}
            labelMap={EFFECT_LABELS}
          />
        </Field>

        {/* Effect color — only shown when relevant */}
        {showEffectColor && (
          <Field label={effectColorLabel}>
            <ColorRow
              value={fields.effectColorHex}
              onChange={v => set("effectColorHex", v)}
            />
          </Field>
        )}

        {/* Tags */}
        <Field label="Tags (comma-separated)">
          <input
            type="text"
            placeholder="e.g. bridal, summer, almond"
            value={fields.tags}
            onChange={e => set("tags", e.target.value)}
            style={S.input}
          />
        </Field>

        {/* ── Save ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 4 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...S.btnPrimary,
              width: "100%",
              justifyContent: "center",
              padding: "13px 0",
              fontSize: 14,
              opacity: saving ? .6 : 1,
            }}
          >
            {saving ? "Saving…" : "Save Design"}
          </button>

          {/* Inline validation summary */}
          {hasErrors && (
            <div style={{
              marginTop: 10,
              padding: "10px 14px",
              borderRadius: 9,
              background: "#fef2f2",
              border: "1px solid #fecaca",
              fontSize: 12,
              color: "#b91c1c",
              fontWeight: 500,
            }}>
              Please fix the highlighted fields before saving.
            </div>
          )}

          {/* Toast */}
          {toast && (
            <div style={{
              marginTop: 10,
              padding: "10px 14px",
              borderRadius: 9,
              fontSize: 13,
              fontWeight: 600,
              background: toast.ok ? "#f0fdf4" : "#fef2f2",
              color:      toast.ok ? "#15803d" : "#b91c1c",
              border: `1px solid ${toast.ok ? "#bbf7d0" : "#fecaca"}`,
            }}>
              {toast.ok ? "✓ " : "✕ "}{toast.msg}
            </div>
          )}
        </div>
      </div>

      {/* ══ RIGHT — Preview panel ══════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #faf8f7 0%, #f0e6f0 60%, #ede0ed 100%)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Background decoration */}
        <div style={{
          position: "absolute",
          width: 340, height: 340,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,200,232,.35) 0%, transparent 70%)",
          top: "50%", left: "50%",
          transform: "translate(-50%, -60%)",
          pointerEvents: "none",
        }} />

        {/* LIVE PREVIEW label */}
        <div style={{
          position: "absolute",
          top: 22,
          background: "rgba(59,31,53,.08)",
          borderRadius: 99,
          padding: "4px 14px",
          fontSize: 10,
          fontWeight: 800,
          color: COLORS.plumLight,
          letterSpacing: ".1em",
          textTransform: "uppercase",
        }}>
          Live Preview
        </div>

        {/* ── The nail ── */}
        <NailSVG
          shape={fields.shape}
          length={fields.length}
          width={fields.width}
          baseColor={fields.baseColorHex}
          effectColor={fields.effectColorHex}
          effect={fields.effect}
        />

        {/* Caption */}
        <div style={{ textAlign: "center", marginTop: 24, zIndex: 1 }}>
          {/* Color swatch + shape label */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
            <span style={{
              display: "inline-block",
              width: 14, height: 14,
              borderRadius: "50%",
              background: fields.baseColorHex,
              border: "1.5px solid rgba(0,0,0,.12)",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.plum }}>
              {fields.shape}
            </span>
          </div>

          <p style={{ fontSize: 12, color: COLORS.muted, marginBottom: 3 }}>
            {EFFECT_LABELS[fields.effect]}
            {fields.baseColorHex ? ` · ${fields.baseColorHex.toUpperCase()}` : ""}
          </p>

          <p style={{ fontSize: 11, color: COLORS.muted }}>
            Length {fields.length}% · Width {fields.width}%
          </p>

          {fields.name.trim() && (
            <p style={{
              marginTop: 10,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.plumLight,
              fontStyle: "italic",
            }}>
              "{fields.name.trim()}"
            </p>
          )}
        </div>

        {/* Colour palette quick-picks in the corner */}
        <div style={{
          position: "absolute",
          bottom: 22,
          right: 22,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          alignItems: "flex-end",
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: COLORS.muted }}>
            Quick colors
          </span>
          <div style={{ display: "flex", gap: 6 }}>
            {["#E8A0BF","#C084B0","#7B3F8C","#FF6B9D","#B5D5FF","#F4C2C2","#1a1018","#F9E4D4"].map(c => (
              <button
                key={c}
                title={c}
                onClick={() => set("baseColorHex", c)}
                style={{
                  width: 22, height: 22,
                  borderRadius: "50%",
                  background: c,
                  border: fields.baseColorHex === c
                    ? `2.5px solid ${COLORS.plum}`
                    : "1.5px solid rgba(0,0,0,.15)",
                  cursor: "pointer",
                  padding: 0,
                  flexShrink: 0,
                  transition: "transform .12s",
                }}
              />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
