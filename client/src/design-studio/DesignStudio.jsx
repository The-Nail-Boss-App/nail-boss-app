import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { COLORS, S } from "../styles.js";
import NailCanvas, { patternColorSlots } from "./NailCanvas.jsx";
import AssetLibrary from "./AssetLibrary.jsx";
import LayersPanel from "./LayersPanel.jsx";
import PropertiesPanel from "./PropertiesPanel.jsx";
import DrawingToolbar from "./DrawingToolbar.jsx";
import FullSetPreview from "./FullSetPreview.jsx";
import PolishBottle from "./PolishBottle.jsx";
import { UI } from "./studioStyles.js";
import {
  DEFAULT_ACTIVE_SLOT,
  FULL_SET_SLOTS,
  LEFT_HAND_SLOTS,
  RIGHT_HAND_SLOTS,
  SHAPES,
  STYLE_CATEGORIES,
  addLayerToBlueprint,
  applyFrenchTipToSlots,
  addStrokeToDrawingLayer,
  summarizeFullSetAssets,
  setActiveNailBySlot,
  resetNailDesign,
  mirrorHandDesign,
  ensureFullSetBlueprint,
  createFullSetBlueprint,
  copyNailToSlots,
  cloneNailDesign,
  applyBaseToSlots,
  assetLayer,
  clamp,
  flatDesignFromBlueprint,
  frenchTipLayer,
  FRENCH_TIP_PRESETS,
  FRENCH_TIP_STYLES,
  getActiveNail,
  getVisibleBaseColor,
  gradientLayer,
  normalizeGradientData,
  isReusableDrawingLayer,
  layerSort,
  normalizeHex,
  normalizeTags,
  patternLayer,
  pushHistory,
  renumberLayers,
  restoreHistorySnapshot,
  safeTransform,
  revalidateLayersAfterNailResize,
  synchronizeBase,
  uid,
  updateActiveNail,
  POLISH_TYPES,
  normalizePolishData,
  PATTERNS,
  STARTER_SIGNATURE_LOOKS,
  applySignatureLookToBlueprint,
  createSignatureLookFromBlueprint,
  normalizeSignatureLook,
} from "./blueprint.js";

// useEffect(() => { if (!dirty) clearAutosaveTimer(); }, [dirty])
// localStorage.setItem(PANEL_PREFS_STORAGE_KEY) preserves collapsible panel memory.
const PANEL_PREFS_STORAGE_KEY = "anitaset.designStudio.panels.v1";
const RECENT_POLISH_LIMIT = 12;
const DESIGN_NAME_MAX_LENGTH = 32;
const GRADIENT_DIRECTIONS = ["vertical", "reverse-vertical", "horizontal", "diagonal", "reverse-diagonal", "aura"];
const DEFAULT_GRADIENT_ACCENT = "#F6A6CF";

const PANEL_GROUPS = [
  ["nailBasics", "signatureLooks", "designDetails"],
  ["artTools", "properties", "layers"],
];


function CommandPopoverPortal({ children }) {
  if (typeof document === "undefined") return children;
  return createPortal(children, document.body);
}

const STUDIO_CARDS = [
  {
    id: "polishStudio",
    title: "Polish Studio™",
    icon: "◐",
    copy: "Color, HEX, material finish, and Polish Rack™.",
  },
  {
    id: "techniqueStudio",
    title: "Technique Studio™",
    icon: "◠",
    copy: "French tips, gradients, patterns, and precision effects.",
  },
  {
    id: "gemStudio",
    title: "Gem Studio™",
    icon: "✦",
    copy: "Jewels and dimensional sparkle placement.",
  },
  {
    id: "charmStudio",
    title: "Charm Studio™",
    icon: "✧",
    copy: "Charms, decals, and elevated nail art assets.",
  },
  {
    id: "brushStudio",
    title: "Brush Studio™",
    icon: "✎",
    copy: "Freehand detail brush and stroke controls.",
  },
  {
    id: "topCoatStudio",
    title: "Top Coat Studio™",
    icon: "⬚",
    copy: "Gloss, matte, material shine, and finishing layers.",
  },
];

const STUDIO_DOCK_MODES = [
  "Studio View",
  "Full Set",
  "Left Hand",
  "Right Hand",
  "Press-On Tray",
  "Magazine",
  "Recipe",
  "Blueprint",
];

const DEFAULT_PANEL_STATE = {
  polishStudio: true,
  nailBasics: false,
  signatureLooks: true,
  designDetails: false,
  artTools: true,
  layerEffects: true,
  detailBrush: false,
  properties: true,
  layers: true,
};

function collapsePanelSiblings(state) {
  return PANEL_GROUPS.reduce(
    (next, group) => {
      const openPanels = group.filter((id) => next[id]);
      if (openPanels.length <= 1) return next;
      const keepOpen = openPanels[0];
      return group.reduce(
        (groupState, id) => ({ ...groupState, [id]: id === keepOpen }),
        next,
      );
    },
    { ...state },
  );
}

function loadPanelState() {
  if (typeof window === "undefined") return DEFAULT_PANEL_STATE;
  try {
    return collapsePanelSiblings({
      ...DEFAULT_PANEL_STATE,
      ...JSON.parse(
        window.localStorage.getItem(PANEL_PREFS_STORAGE_KEY) || "{}",
      ),
    });
  } catch {
    return DEFAULT_PANEL_STATE;
  }
}

function StudioMicrointeractionStyles() {
  return (
    <style>{`
      @keyframes anitasetDrawerSettle { from { opacity: .62; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes anitasetBottleSelected { 0% { transform: translateY(0) scale(1); } 48% { transform: translateY(-3px) scale(1.025); } 100% { transform: translateY(0) scale(1); } }
      @keyframes anitasetRackInsert { from { opacity: 0; transform: translateY(10px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes anitasetHeroFade { from { opacity: .78; transform: translateY(4px) scale(.997); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes anitasetStatusSheen { from { background-position: 120% 0; } to { background-position: -120% 0; } }
      .studio-motion-button:hover:not(:disabled), .studio-card-button:hover, .studio-dock-button:hover, .studio-current-polish:hover, .polish-bottle-button:hover { transform: translateY(-1px); filter: brightness(1.025); box-shadow: 0 16px 34px rgba(60,20,50,.12); }
      .studio-motion-button:active:not(:disabled), .studio-card-button:active, .studio-dock-button:active, .studio-current-polish:active, .polish-bottle-button:active { transform: translateY(1px) scale(.99); box-shadow: inset 0 2px 8px rgba(60,20,50,.12), 0 8px 18px rgba(60,20,50,.08); }
      .studio-motion-button:focus-visible, .studio-card-button:focus-visible, .studio-dock-button:focus-visible, .studio-current-polish:focus-visible, .polish-bottle-button:focus-visible { outline: 3px solid rgba(123,47,89,.32); outline-offset: 3px; }
      .studio-motion-button[aria-pressed="true"], .studio-card-button[aria-pressed="true"], .studio-dock-button[aria-pressed="true"] { box-shadow: 0 0 0 3px rgba(255,214,232,.86), 0 18px 40px rgba(123,47,89,.16); }
      .studio-motion-button:disabled { cursor: not-allowed; filter: saturate(.65); }
      .studio-card-button:hover { transform: translateY(-2px) scale(1.02); }
      .polish-bottle-button:hover .polish-bottle-figure { transform: translateY(-3px); filter: drop-shadow(0 8px 10px rgba(60,20,50,.14)); }
      .polish-bottle-button:hover .polish-bottle-reflection { opacity: .8; transform: translateX(6%); }
      .polish-bottle-figure.is-selected { animation: anitasetBottleSelected 260ms cubic-bezier(.2,.8,.2,1); filter: drop-shadow(0 8px 14px rgba(123,47,89,.20)); }
      .polish-rack-bottle { animation: anitasetRackInsert 260ms cubic-bezier(.2,.8,.2,1); will-change: transform, opacity; }
      .studio-popover-motion { animation: anitasetDrawerSettle 220ms cubic-bezier(.2,.8,.2,1); transform-origin: top right; }
      .studio-hero-fade { animation: anitasetHeroFade 180ms ease both; will-change: transform, opacity; }
      .studio-status-loading { color: transparent; min-width: 116px; background: linear-gradient(90deg, rgba(123,47,89,.10), rgba(123,47,89,.24), rgba(123,47,89,.10)); background-size: 220% 100%; animation: anitasetStatusSheen 950ms ease-in-out infinite; }
      @media (prefers-reduced-motion: reduce) { .studio-motion-button, .studio-card-button, .studio-dock-button, .studio-current-polish, .polish-bottle-button, .polish-bottle-figure, .polish-rack-bottle, .studio-popover-motion, .studio-hero-fade, .studio-status-loading { animation: none !important; transition-duration: 1ms !important; } }
    `}</style>
  );
}

function CollapsiblePanel({ id, title, open, onToggle, children }) {
  return (
    <section data-panel-id={id} style={UI.panelSection}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-panel-body`}
        aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
        title={`${open ? "Collapse" : "Expand"} ${title}`}
        onClick={() => onToggle(id)}
        className="studio-motion-button"
        style={UI.panelHeader}
      >
        <span style={UI.sectionTitle}>{title}</span>
        <span aria-hidden="true" style={{ fontSize: 16, color: COLORS.plum }}>
          {open ? "▾" : "▸"}
        </span>
      </button>
      {open && (
        <div id={`${id}-panel-body`} style={UI.panelBody}>
          {children}
        </div>
      )}
    </section>
  );
}

function IconActionButton({
  label,
  icon,
  disabled = false,
  onClick,
  active = false,
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="studio-motion-button"
      aria-pressed={active}
      style={UI.iconOnlyButton(active, disabled)}
    >
      {icon}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div style={UI.field}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

function GeometrySlider({ label, value = 0.5, onChange }) {
  return (
    <Field label={`${label} ${Math.round((value ?? 0.5) * 100)}%`}>
      <input
        type="range"
        min="0"
        max="100"
        value={Math.round((value ?? 0.5) * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: "100%" }}
      />
    </Field>
  );
}

function normalizeHexDraft(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/^#/, "")
    .toUpperCase();
  if (!/^[0-9A-F]{3}$|^[0-9A-F]{6}$/.test(cleaned)) return "";
  return `#${cleaned}`;
}

function HexInput({ value, onCommit, label = "HEX" }) {
  const [draft, setDraft] = useState(value || "#FFFFFF");
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    setDraft(value || "#FFFFFF");
    setInvalid(false);
  }, [value]);

  function commitDraft() {
    const normalized = normalizeHexDraft(draft);
    if (!normalized) {
      setInvalid(true);
      setDraft(value || "#FFFFFF");
      return;
    }
    setInvalid(false);
    setDraft(normalized);
    onCommit(normalized);
  }

  return (
    <input
      aria-label={label}
      aria-invalid={invalid}
      style={{
        ...S.input,
        fontFamily: "monospace",
        borderColor: invalid ? "#b91c1c" : S.input.borderColor,
      }}
      value={draft}
      maxLength={7}
      onChange={(e) => {
        const next = e.target.value.toUpperCase();
        if (/^#?[0-9A-F]{0,6}$/.test(next)) {
          setDraft(next);
          setInvalid(false);
        }
      }}
      onBlur={commitDraft}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitDraft();
        }
      }}
    />
  );
}

function ColorInput({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <PolishBottle
        colorHex={value}
        label={`Selected Polish Color ${value}`}
        selected
        size="medium"
      />
      <input
        aria-label="Polish Color picker"
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: 44,
          height: 42,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          background: "transparent",
        }}
      />
      <HexInput value={value} onCommit={onChange} label="Polish HEX" />
    </div>
  );
}

function FrenchTipControls({ layer, onAdd, onPatch, onApply, quickAccess = false }) {
  const data = layer?.data || {};
  return (
    <section
      data-testid={quickAccess ? "french-tip-quick-access-controls" : "technique-studio-french-tip-controls"}
      data-control-home={quickAccess ? "command-quick-access" : "technique-studio"}
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
        background: "#fff",
      }}
    >
      <div style={UI.sectionTitle}>French Tip Precision</div>
      <button
        type="button"
        onClick={onAdd}
        style={{ ...S.btnSecondary, padding: "9px 12px", marginBottom: 10 }}
      >
        Add French Tip
      </button>
      <Field label="Preset">
        <select
          style={S.input}
          value={data.preset || "medium"}
          data-testid="french-tip-preset-control"
          onChange={(e) => onPatch({ preset: e.target.value })}
        >
          {Object.keys(FRENCH_TIP_PRESETS).map((preset) => (
            <option key={preset} value={preset}>
              {preset}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Style">
        <select
          style={S.input}
          value={data.style || "classic"}
          data-testid="french-tip-style-control"
          onChange={(e) => onPatch({ style: e.target.value })}
        >
          {FRENCH_TIP_STYLES.map((style) => (
            <option key={style} value={style}>
              {style}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label={`Tip height ${Math.round((data.tipHeight ?? 0.32) * 100)}%`}
      >
        <input
          type="range"
          min="8"
          max="72"
          value={Math.round((data.tipHeight ?? 0.32) * 100)}
          data-testid="french-tip-height-slider"
          onChange={(e) => onPatch({ tipHeight: Number(e.target.value) / 100 })}
          style={{ width: "100%" }}
        />
      </Field>
      <Field
        label={`Smile curve ${Math.round((data.smileCurve ?? 0.32) * 100)}%`}
      >
        <input
          type="range"
          min="0"
          max="100"
          value={Math.round((data.smileCurve ?? 0.32) * 100)}
          data-testid="french-tip-smile-curve-slider"
          onChange={(e) =>
            onPatch({ smileCurve: Number(e.target.value) / 100 })
          }
          style={{ width: "100%" }}
        />
      </Field>
      <Field
        label={`Smile depth ${Math.round((data.smileDepth ?? 0.24) * 100)}%`}
      >
        <input
          type="range"
          min="0"
          max="65"
          value={Math.round((data.smileDepth ?? 0.24) * 100)}
          data-testid="french-tip-smile-depth-slider"
          onChange={(e) =>
            onPatch({ smileDepth: Number(e.target.value) / 100 })
          }
          style={{ width: "100%" }}
        />
      </Field>
      <Field
        label={`Smile width ${Math.round((data.smileWidth ?? 0.82) * 100)}%`}
      >
        <input
          type="range"
          min="25"
          max="100"
          value={Math.round((data.smileWidth ?? 0.82) * 100)}
          data-testid="french-tip-smile-width-slider"
          onChange={(e) =>
            onPatch({ smileWidth: Number(e.target.value) / 100 })
          }
          style={{ width: "100%" }}
        />
      </Field>
      <Field label="Fill Type">
        <select
          style={S.input}
          value={data.fillType || "solid"}
          data-testid="french-tip-fill-type-control"
          onChange={(e) => onPatch({ fillType: e.target.value })}
        >
          <option value="solid">Solid</option>
          <option value="pattern">Pattern</option>
        </select>
      </Field>
      {(data.fillType || "solid") === "pattern" ? (
        <>
          <Field label="Pattern">
            <select
              style={S.input}
              value={data.pattern || "dots"}
              onChange={(e) => onPatch({ pattern: e.target.value })}
            >
              {PATTERNS.map((pattern) => (
                <option key={pattern} value={pattern}>
                  {pattern}
                </option>
              ))}
            </select>
          </Field>
          {patternColorSlots(data.pattern || "dots").map((slot, index) => {
            const frenchKey = index === 0 ? "patternColorHex" : index === 1 ? "patternSecondaryColorHex" : slot.key;
            const fallback = index === 0 ? data.colorHex || slot.fallback : slot.fallback;
            return (
              <Field key={slot.key} label={index === 0 ? "Pattern primary color" : index === 1 ? "Pattern secondary color" : slot.label}>
                <ColorInput
                  value={data[frenchKey] || fallback}
                  onChange={(value) =>
                    onPatch({ [frenchKey]: normalizeHex(value, fallback) })
                  }
                />
              </Field>
            );
          })}
          <Field
            label={`Pattern scale ${Math.round((data.patternScale ?? 1) * 100)}%`}
          >
            <input
              type="range"
              min="20"
              max="300"
              value={Math.round((data.patternScale ?? 1) * 100)}
              onChange={(e) =>
                onPatch({ patternScale: Number(e.target.value) / 100 })
              }
              style={{ width: "100%" }}
            />
          </Field>
          <Field label={`Pattern spacing ${Math.round((data.patternSpacing ?? 0.5) * 100)}%`}>
            <input type="range" min="0" max="100" value={Math.round((data.patternSpacing ?? 0.5) * 100)} data-testid="french-tip-pattern-spacing-slider" onChange={(e) => onPatch({ patternSpacing: Number(e.target.value) / 100 })} style={{ width: "100%" }} />
          </Field>
          <Field label={`Pattern rotation ${Math.round(data.patternRotation ?? 0)}°`}>
            <input type="range" min="-180" max="180" value={Math.round(data.patternRotation ?? 0)} data-testid="french-tip-pattern-rotation-slider" onChange={(e) => onPatch({ patternRotation: Number(e.target.value) })} style={{ width: "100%" }} />
          </Field>
          <Field label={`Pattern X offset ${Math.round((data.patternOffsetX ?? 0.5) * 100)}%`}>
            <input type="range" min="0" max="100" value={Math.round((data.patternOffsetX ?? 0.5) * 100)} data-testid="french-tip-pattern-x-offset-slider" onChange={(e) => onPatch({ patternOffsetX: Number(e.target.value) / 100 })} style={{ width: "100%" }} />
          </Field>
          <Field label={`Pattern Y offset ${Math.round((data.patternOffsetY ?? 0.5) * 100)}%`}>
            <input type="range" min="0" max="100" value={Math.round((data.patternOffsetY ?? 0.5) * 100)} data-testid="french-tip-pattern-y-offset-slider" onChange={(e) => onPatch({ patternOffsetY: Number(e.target.value) / 100 })} style={{ width: "100%" }} />
          </Field>
          <Field label={`Pattern opacity ${Math.round((data.patternOpacity ?? 1) * 100)}%`}>
            <input type="range" min="5" max="100" value={Math.round((data.patternOpacity ?? 1) * 100)} data-testid="french-tip-pattern-opacity-slider" onChange={(e) => onPatch({ patternOpacity: Number(e.target.value) / 100 })} style={{ width: "100%" }} />
          </Field>
        </>
      ) : (
        <Field label="Tip color">
          <div data-testid="french-tip-visible-color-binding">
          <ColorInput
            value={data.colorHex || "#FFFFFF"}
            onChange={(value) =>
              onPatch({ colorHex: normalizeHex(value, "#FFFFFF") })
            }
          />
          </div>
        </Field>
      )}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => onApply("active")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Apply to active nail
        </button>
        <button
          type="button"
          onClick={() => onApply("hand")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Apply to current hand
        </button>
        <button
          type="button"
          onClick={() => onApply("all")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Apply to all nails
        </button>
      </div>
      <p style={UI.smallText}>
        Classic, deep, angled, V-French, and reverse French render as clipped
        vector layers inside each nail silhouette.
      </p>
    </section>
  );
}

function GradientWorkflowControls({ layer, baseColor, polishFillMode, onAdd, onPatch, onPatchStop, onAddStop, onRemoveStop, onOpacity, onFillMode, onApply }) {
  const data = layer?.data || normalizeGradientData({
    colorA: baseColor,
    colorB: DEFAULT_GRADIENT_ACCENT,
    gradientStops: [{ color: baseColor, position: 0 }, { color: DEFAULT_GRADIENT_ACCENT, position: 100 }],
  });
  const stops = data.gradientStops || [];
  return (
    <section data-testid="gradient-workflow-controls" style={{ ...UI.panelSection, borderColor: "rgba(123,47,89,.24)" }}>
      <div style={UI.panelBody}>
        <div style={UI.sectionTitle}>Gradient Workflow</div>
        <p style={UI.smallText}>Gradients start with the current polish color plus one gradient color, then blend over the polish at partial opacity by default.</p>
        <Field label="Polish color mode">
          <select aria-label="Polish color mode" style={S.input} value={polishFillMode} onChange={(e) => onFillMode(e.target.value)}>
            <option value="solid">Solid Polish Color</option>
            <option value="gradient">Gradient Polish Color</option>
          </select>
        </Field>
        {!layer && <button type="button" onClick={onAdd} style={{ ...S.btnSecondary, padding: "9px 12px", marginBottom: 10 }}>Add blended gradient</button>}
        <Field label="Gradient color stop 1">
          <input aria-label="Gradient color stop 1" type="color" value={stops[0]?.color || baseColor} onChange={(e) => onPatchStop(0, { color: e.target.value })} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10 }} />
        </Field>
        <Field label="Gradient color stop 2">
          <input aria-label="Gradient color stop 2" type="color" value={stops[1]?.color || DEFAULT_GRADIENT_ACCENT} onChange={(e) => onPatchStop(1, { color: e.target.value })} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10 }} />
        </Field>
        {stops.slice(2).map((stop, offsetIndex) => (
          <Field key={`${stop.color}-${offsetIndex}`} label={`Gradient color stop ${offsetIndex + 3}`}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
              <input aria-label={`Gradient color stop ${offsetIndex + 3}`} type="color" value={stop.color} onChange={(e) => onPatchStop(offsetIndex + 2, { color: e.target.value })} style={{ width: "100%", height: 38, border: `1px solid ${COLORS.border}`, borderRadius: 10 }} />
              <button type="button" onClick={() => onRemoveStop(offsetIndex + 2)} style={UI.iconButton(false)}>Remove</button>
            </div>
          </Field>
        ))}
        <button type="button" onClick={onAddStop} style={{ ...S.btnSecondary, padding: "8px 12px" }}>Add color stop</button>
        <Field label="Direction">
          <select aria-label="Gradient direction" style={S.input} value={data.direction || "vertical"} onChange={(e) => onPatch({ direction: e.target.value })}>{GRADIENT_DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}</select>
        </Field>
        <GeometrySlider label="Gradient opacity / blend" value={layer?.opacity ?? 0.45} onChange={onOpacity} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={() => onApply("active")} style={UI.iconButton(false)}>Apply to active nail</button>
          <button type="button" onClick={() => onApply("hand")} style={UI.iconButton(false)}>Apply to current hand</button>
          <button type="button" onClick={() => onApply("all")} style={UI.iconButton(false)}>Apply to full set</button>
        </div>
      </div>
    </section>
  );
}

function PatternWorkflowControls({ layer, onAdd, onPatch }) {
  const data = layer?.data || { pattern: "dots", colorHex: "#FFFFFF", secondaryColorHex: "#3B1F35" };
  return (
    <section data-testid="pattern-workflow-controls" style={{ ...UI.panelSection, borderColor: "rgba(123,47,89,.24)" }}>
      <div style={UI.panelBody}>
        <div style={UI.sectionTitle}>Pattern Workflow</div>
        {!layer && <button type="button" onClick={onAdd} style={{ ...S.btnSecondary, padding: "9px 12px", marginBottom: 10 }}>Add pattern layer</button>}
        <Field label="Pattern">
          <select style={S.input} value={data.pattern || "dots"} onChange={(e) => onPatch({ pattern: e.target.value })}>
            {PATTERNS.map((pattern) => <option key={pattern} value={pattern}>{pattern}</option>)}
          </select>
        </Field>
        {patternColorSlots(data.pattern || "dots").map((slot) => (
          <Field key={slot.key} label={slot.label}>
            <ColorInput value={data[slot.key] || slot.fallback} onChange={(value) => onPatch({ [slot.key]: normalizeHex(value, slot.fallback) })} />
          </Field>
        ))}
        <p style={UI.smallText}>Advanced pattern size, rotation, placement, and layer ordering stay preserved in Nail Art Controls™ and Layers.</p>
      </div>
    </section>
  );
}

function layerById(nail, id) {
  return nail?.layers?.find((layer) => layer.id === id) || null;
}

const MAX_BLUEPRINT_JSON_BYTES = 100 * 1024;
const BLUEPRINT_WARNING_BYTES = Math.floor(MAX_BLUEPRINT_JSON_BYTES * 0.85);

function utf8ByteLength(value) {
  if (typeof TextEncoder !== "undefined")
    return new TextEncoder().encode(value).length;
  return unescape(encodeURIComponent(value)).length;
}

function serializedBlueprintSize(blueprint) {
  return utf8ByteLength(JSON.stringify(blueprint));
}

function blueprintSizeMessage(bytes) {
  const kb = Math.round(bytes / 1024);
  const maxKb = Math.round(MAX_BLUEPRINT_JSON_BYTES / 1024);
  return `Blueprint is ${kb}KB; AnitaSet supports up to ${maxKb}KB per editable design.`;
}

function collectDesignPalette(nail) {
  const colors = [];
  const add = (value) => {
    if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) return;
    const normalized = value.toUpperCase();
    if (!colors.includes(normalized)) colors.push(normalized);
  };
  add(nail?.baseColorHex);
  (nail?.layers || []).forEach((layer) => {
    const data = layer.data || {};
    add(data.colorHex);
    add(data.effectColorHex);
    add(data.colorA);
    add(data.colorB);
    add(data.secondaryColorHex);
    (data.strokes || []).forEach((stroke) => add(stroke.colorHex));
  });
  return colors;
}

function PolishColorControls({
  value,
  polishType = "Cream",
  recentPolish = [],
  onChange,
  onPolishTypeChange,
  onApply,
  onRackSelect,
  compact = false,
}) {
  return (
    <section
      data-testid="polish-color-controls"
      aria-label="Polish Studio"
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 12,
        marginBottom: compact ? 0 : 14,
        background: "#fff",
      }}
    >
      <div style={UI.sectionTitle}>Polish Studio</div>
      <Field label="Polish Color">
        <ColorInput value={value} onChange={onChange} />
      </Field>
      <Field label="HEX">
        <HexInput value={value} onCommit={onChange} label="Polish HEX" />
      </Field>
      <Field label="Polish Type">
        <select
          style={S.input}
          value={polishType}
          onChange={(e) => onPolishTypeChange(e.target.value)}
        >
          {POLISH_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>
      <PolishRack
        colors={recentPolish}
        activeColor={value}
        polishType={polishType}
        onSelect={onRackSelect || onChange}
      />
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
        <button
          type="button"
          onClick={() => onApply("active")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Active nail
        </button>
        <button
          type="button"
          onClick={() => onApply("hand")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Current hand
        </button>
        <button
          type="button"
          onClick={() => onApply("all")}
          className="studio-motion-button"
          style={UI.iconButton(false)}
        >
          Full set
        </button>
      </div>
      <p style={UI.smallText}>
        Cream, Jelly, Milky, and Matte each render through the shared material
        engine with shape-aware depth.
      </p>
    </section>
  );
}

function PolishRack({ colors, activeColor, polishType, onSelect }) {
  return (
    <section
      aria-label="Polish Rack™"
      data-testid="polish-rack"
      style={{
        marginTop: 12,
        minWidth: 0,
        maxWidth: "100%",
        padding: "10px 8px",
        borderRadius: 18,
        border: "1px solid rgba(123,47,89,.16)",
        background: "linear-gradient(180deg, #fff, #fff7fb)",
        boxShadow: "0 10px 26px rgba(59,31,53,.08)",
        overflow: "hidden",
      }}
    >
      <div style={{ ...UI.sectionTitle, marginBottom: 2 }}>Polish Rack™</div>
      <div style={{ ...UI.smallText, marginTop: 0, marginBottom: 8 }}>
        Recently Used Polish
      </div>
      {colors.length ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(34px, 1fr))",
            gap: "6px 4px",
            alignItems: "end",
            justifyItems: "center",
            minWidth: 0,
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {colors.map((color) => (
            <PolishBottle
              key={color}
              className="polish-rack-bottle"
              colorHex={color}
              label={`Apply Polish Color ${color}`}
              selected={activeColor?.toUpperCase() === color}
              polishType={polishType}
              onClick={() => onSelect(color)}
            />
          ))}
        </div>
      ) : (
        <p style={{ ...UI.smallText, margin: 0 }}>
          Apply a Polish Color to place the first bottle on the rack.
        </p>
      )}
    </section>
  );
}

function StudioCard({ studio, active, onSelect }) {
  return (
    <button
      type="button"
      data-testid={`studio-card-${studio.id}`}
      aria-pressed={active}
      onClick={() => onSelect(studio.id)}
      className="studio-card-button"
      style={UI.studioCard(active)}
    >
      <span aria-hidden="true" style={UI.studioCardIcon}>
        {studio.icon}
      </span>
      <span>
        <span style={UI.studioCardTitle}>{studio.title}</span>
        <span style={UI.studioCardCopy}>{studio.copy}</span>
      </span>
    </button>
  );
}

function DesignBoardIntro() {
  return (
    <section
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
        background: "#fff",
      }}
    >
      <div style={UI.sectionTitle}>Design Board Framework</div>
      <p style={{ ...UI.smallText, marginTop: 0 }}>
        Use this board to organize reusable nail art, drawing strokes, and layer
        edits while the preview stays sticky.
      </p>
    </section>
  );
}
function DesignPalette({ colors }) {
  return (
    <section
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: 16,
        padding: 12,
        marginBottom: 14,
        background: "#fff",
      }}
    >
      <div style={UI.sectionTitle}>Design Palette</div>
      {colors.length ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {colors.map((color) => (
            <div
              key={color}
              title={color}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 8px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 999,
                background: "#fff",
              }}
            >
              <PolishBottle
                colorHex={color}
                label={`Polish Color ${color}`}
                size="small"
                />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: COLORS.textMuted,
                }}
              >
                {color}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p style={UI.smallText}>
          Choose polish or artwork colors and they will appear here
          automatically.
        </p>
      )}
    </section>
  );
}
const SIGNATURE_LOOKS_STORAGE_KEY = "anitaset.signatureLooks.v1";

function loadStoredSignatureLooks() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(SIGNATURE_LOOKS_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed)
      ? parsed.map(normalizeSignatureLook).filter((look) => !look.starter)
      : [];
  } catch {
    return [];
  }
}

function persistSignatureLooks(looks) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SIGNATURE_LOOKS_STORAGE_KEY,
    JSON.stringify(looks.filter((look) => !look.starter)),
  );
}

function SignatureLooksPanel({
  looks,
  selectedId,
  onSelect,
  onSave,
  onApply,
  onDuplicate,
  onRename,
  onDelete,
}) {
  const selected = looks.find((look) => look.id === selectedId) || looks[0];
  const starterLooks = looks.filter((look) => look.starter);
  const customLooks = looks.filter((look) => !look.starter);
  const selectedIsStarter = Boolean(selected?.starter);
  return (
    <div data-testid="signature-looks-panel">
      <div style={UI.sectionTitle}>Signature Looks Library</div>
      <p style={{ ...UI.smallText, marginTop: 0, marginBottom: 8 }}>
        Compact grouped dropdown with protected Starter Looks and editable My
        Looks.
      </p>
      <Field label="Saved Signature Looks">
        <select
          data-testid="signature-looks-select"
          aria-label="Signature Looks"
          style={S.input}
          value={selected?.id || ""}
          onChange={(e) => onSelect(e.target.value)}
        >
          <optgroup label="Starter Looks">
            {starterLooks.map((look) => (
              <option key={look.id} value={look.id}>
                {look.name}
                {look.scope === "full-set" ? " · full set" : ""}
              </option>
            ))}
          </optgroup>
          <optgroup label="My Looks">
            {customLooks.length ? (
              customLooks.map((look) => (
                <option key={look.id} value={look.id}>
                  {look.name}
                  {look.scope === "full-set" ? " · full set" : ""}
                </option>
              ))
            ) : (
              <option disabled value="__empty_custom_looks">
                No saved custom looks
              </option>
            )}
          </optgroup>
        </select>
      </Field>
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 8,
          marginBottom: 8,
          background: COLORS.roseDim,
        }}
      >
        <strong style={{ fontSize: 13 }}>
          {selected?.name || "Choose a Signature Look"}
        </strong>
        <span
          style={{ display: "block", fontSize: 11, color: COLORS.textMuted }}
        >
          {selectedIsStarter
            ? "Starter look · protected"
            : "Custom look · editable"}
          {selected?.scope === "full-set" ? " · full set" : " · single nail"}
        </span>
      </div>
      <div
        data-testid="signature-look-primary-actions"
        style={{
          ...UI.actionGrid,
          gridTemplateColumns: "repeat(4, minmax(40px, 1fr))",
          marginBottom: 8,
        }}
      >
        <IconActionButton
          icon="↙"
          label="Apply selected Signature Look to active nail"
          disabled={!selected}
          onClick={() => selected && onApply(selected, "active")}
        />
        <IconActionButton
          icon="⬚"
          label="Apply selected Signature Look to full set"
          disabled={!selected}
          onClick={() => selected && onApply(selected, "all")}
        />
        <IconActionButton
          icon="💾"
          label="Save active nail as Signature Look"
          onClick={() => onSave("nail")}
        />
        <IconActionButton
          icon="▣"
          label="Save full set as Signature Look"
          onClick={() => onSave("full-set")}
        />
      </div>
      <div
        data-testid="signature-look-manage-actions"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          flexWrap: "wrap",
        }}
      >
        <span style={{ ...UI.smallText, marginRight: 2 }}>Manage</span>
        <IconActionButton
          icon="⧉"
          label="Duplicate selected Signature Look"
          disabled={!selected}
          onClick={() => selected && onDuplicate(selected)}
        />
        <IconActionButton
          icon="✎"
          label="Rename selected custom Signature Look"
          disabled={!selected || selectedIsStarter}
          onClick={() => selected && onRename(selected)}
        />
        <IconActionButton
          icon="🗑"
          label="Delete selected custom Signature Look"
          disabled={!selected || selectedIsStarter}
          onClick={() => selected && onDelete(selected)}
        />
      </div>
      {!customLooks.length && (
        <p style={UI.smallText}>
          No custom looks yet. Duplicate a starter or save the active nail/full
          set to edit your own library.
        </p>
      )}
    </div>
  );
}

function DesignStudio(_, ref) {
  const [designs, setDesigns] = useState([]);
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [designName, setDesignName] = useState("");
  const [blueprint, setBlueprint] = useState(() => createFullSetBlueprint());
  const [selectedLayerId, setSelectedLayerId] = useState("base-layer");
  const [mode, setMode] = useState("select");
  const [brush, setBrush] = useState({
    tool: "solid",
    colorHex: "#FFFFFF",
    size: 5,
    opacity: 1,
  });
  const [history, setHistory] = useState({ past: [], future: [] });
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "Ready" });
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("assets");
  const [clipboardNail, setClipboardNail] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [saveStatus, setSaveStatus] = useState("Ready");
  const [userSignatureLooks, setUserSignatureLooks] = useState(() =>
    loadStoredSignatureLooks(),
  );
  const [recentPolish, setRecentPolish] = useState([]);
  const [commandZoom, setCommandZoom] = useState(100);
  const [commandPopover, setCommandPopover] = useState("");
  const [activeStudio, setActiveStudio] = useState("polishStudio");
  const [selectedTechnique, setSelectedTechnique] = useState("");
  const [dockMode, setDockMode] = useState("Studio View");
  const [panelState, setPanelState] = useState(() => loadPanelState());
  const [savedDesignsOpen, setSavedDesignsOpen] = useState(false);
  // POLISH_TYPES.map((type) => <option key={type} value={type}>{type}</option>)
  // >{SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select>
  // Workspace Memory placeholders: future local persistence should restore zoom, selected polish, drawer state, canvas mode, and selected nail without changing Blueprint data.
  const [selectedSignatureLookId, setSelectedSignatureLookId] = useState(
    STARTER_SIGNATURE_LOOKS[0]?.id || "",
  );
  const autosaveTimerRef = useRef(null);
  const autosaveSessionRef = useRef(0);
  const editorSessionRef = useRef(0);
  const mountedRef = useRef(true);
  const savingRef = useRef(false);
  const queuedAutosaveRef = useRef(false);
  const saveSequenceRef = useRef(0);
  const editGenerationRef = useRef(0);
  const selectionRevisionRef = useRef(0);
  const activeSavePromiseRef = useRef(null);
  const generatedNameCounterRef = useRef(1);
  const generatedDraftNameRef = useRef("");
  const persistedDesignNameRef = useRef("");
  const dirtyRef = useRef(false);
  const blueprintRef = useRef(null);
  const selectedDesignIdRef = useRef("");
  const designNameRef = useRef("");
  const dragStartBlueprintRef = useRef(null);
  const polishStudioRef = useRef(null);

  const activeNail = getActiveNail(blueprint);
  const selectedLayer = useMemo(
    () => layerById(activeNail, selectedLayerId),
    [activeNail, selectedLayerId],
  );
  const baseLayer = activeNail.layers.find((layer) => layer.type === "base");
  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const activeSlot = activeNail.slot || DEFAULT_ACTIVE_SLOT;
  const productSummary = useMemo(
    () => summarizeFullSetAssets(blueprint),
    [blueprint],
  );
  const designPalette = useMemo(
    () => collectDesignPalette(activeNail),
    [activeNail],
  );
  const signatureLooks = useMemo(
    () => [...STARTER_SIGNATURE_LOOKS, ...userSignatureLooks],
    [userSignatureLooks],
  );
  const activePolish = normalizePolishData(
    baseLayer?.data || {},
    activeNail.baseColorHex,
  );
  const activePolishColor =
    baseLayer?.data?.colorHex || activeNail.baseColorHex;
  const [draftPolish, setDraftPolish] = useState({
    colorHex: activePolishColor,
    polishType: activePolish.polishType,
  });
  const collectionName =
    blueprint.metadata?.collectionName ||
    blueprint.metadata?.collection ||
    "No Collection Assigned";

  function rememberPolishColor(value) {
    const normalized = normalizeHex(value, "").toUpperCase();
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;
    setRecentPolish((prev) =>
      [normalized, ...prev.filter((color) => color !== normalized)].slice(
        0,
        RECENT_POLISH_LIMIT,
      ),
    );
  }

  useEffect(() => {
    loadDesigns();
    if (typeof window !== "undefined" && window.sessionStorage.getItem("nailBossOpenSavedDesigns") === "1") {
      setSavedDesignsOpen(true);
      setStatus({ type: "idle", message: "Saved Designs browser opening" });
    }
  }, []);
  useEffect(() => {
    dirtyRef.current = dirty;
    blueprintRef.current = blueprint;
    selectedDesignIdRef.current = selectedDesignId;
    designNameRef.current = designName;
  }, [dirty, blueprint, selectedDesignId, designName]);
  useEffect(() => {
    if (!dirty) clearAutosaveTimer();
  }, [dirty]);
  useEffect(
    () => () => {
      mountedRef.current = false;
      clearAutosaveTimer();
      autosaveSessionRef.current += 1;
      editorSessionRef.current += 1;
    },
    [],
  );
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "hidden" && dirtyRef.current)
        void save({ autosave: true, immediate: true });
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!dirtyRef.current) return undefined;
      event.preventDefault();
      event.returnValue = "";
      return "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    setDraftPolish({
      colorHex: activePolishColor,
      polishType: activePolish.polishType,
    });
  }, [activePolishColor, activePolish.polishType, commandPopover]);

  useImperativeHandle(ref, () => ({
    hasDirtyWork: () => dirtyRef.current,
    async prepareToLeave() {
      return guardReplacement();
    },
  }));

  function showNotice(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3600);
  }

  async function loadDesigns() {
    setLoading(true);
    try {
      const res = await fetch("/api/designs");
      if (!res.ok) throw new Error("Unable to load saved designs.");
      const data = await res.json();
      setDesigns(Array.isArray(data) ? data : []);
      if (typeof window !== "undefined" && window.sessionStorage.getItem("nailBossOpenSavedDesigns") === "1") {
        window.sessionStorage.removeItem("nailBossOpenSavedDesigns");
        setSavedDesignsOpen(true);
        setStatus({ type: "idle", message: "Saved Designs browser opened" });
        return;
      }
      setStatus({ type: "idle", message: "Saved designs loaded" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function markEdited() {
    editGenerationRef.current += 1;
  }

  function commit(
    nextBlueprint,
    { selectLayerId = selectedLayerId, noticeMessage = "" } = {},
  ) {
    markEdited();
    const normalized = ensureFullSetBlueprint(nextBlueprint);
    setHistory((prev) => pushHistory(prev, blueprint));
    blueprintRef.current = normalized;
    dirtyRef.current = true;
    setBlueprint(normalized);
    setSelectedLayerId(selectLayerId);
    setDirty(true);
    setStatus({ type: "dirty", message: "Unsaved changes" });
    setSaveStatus("Unsaved changes");
    scheduleAutosave();
    if (noticeMessage) showNotice(noticeMessage);
  }

  function replaceLoaded(nextBlueprint, design, message = "Blueprint loaded") {
    autosaveSessionRef.current += 1;
    editorSessionRef.current += 1;
    clearAutosaveTimer();
    generatedDraftNameRef.current = "";
    persistedDesignNameRef.current = design?.name || "";
    const normalized = ensureFullSetBlueprint(nextBlueprint, design);
    blueprintRef.current = normalized;
    dirtyRef.current = false;
    setBlueprint(normalized);
    setDesignName(design?.name || "");
    setSelectedLayerId("base-layer");
    setHistory({ past: [], future: [] });
    setDirty(false);
    setStatus({ type: "idle", message });
    setSaveStatus("Ready");
  }

  function mergeSavedDesign(savedDesign) {
    if (!savedDesign?.id) return;
    setDesigns((prev) => {
      const withoutSaved = prev.filter(
        (design) => design.id !== savedDesign.id,
      );
      return [savedDesign, ...withoutSaved].sort(
        (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
      );
    });
  }

  async function confirmDiscardAfterFailedSave() {
    showNotice(
      "Your changes could not be saved. Keep editing or discard changes and continue?",
    );
    return window.confirm(
      "Your changes could not be saved. Keep editing or discard changes and continue?",
    );
  }

  async function guardReplacement() {
    if (!dirtyRef.current) return true;
    const result = await save({ autosave: true, immediate: true });
    if (result?.ok && editGenerationRef.current === result.savedRevision)
      return true;
    return confirmDiscardAfterFailedSave();
  }

  async function newDesign() {
    if (!(await guardReplacement())) return;
    setSelectedDesignId("");
    selectedDesignIdRef.current = "";
    replaceLoaded(
      createFullSetBlueprint(),
      { name: "" },
      "New full-set design started",
    );
  }

  async function loadDesign(designId) {
    if (!designId) return;
    if (!(await guardReplacement())) return;
    const design = designs.find((item) => item.id === designId);
    setLoading(true);
    try {
      const res = await fetch(`/api/designs/${designId}/blueprint`);
      if (!res.ok) throw new Error("Unable to load this design blueprint.");
      const data = await res.json();
      setSelectedDesignId(designId);
      selectedDesignIdRef.current = designId;
      replaceLoaded(
        data.document,
        design,
        `Loaded ${design?.name || "saved design"}`,
      );
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }

  function updateBase(patch) {
    let next = synchronizeBase(blueprint, patch);
    if (["shape", "length", "width"].some((key) => patch[key] !== undefined))
      next = revalidateLayersAfterNailResize(next);
    if (patch.tags !== undefined)
      next = {
        ...next,
        metadata: { ...next.metadata, tags: normalizeTags(patch.tags) },
      };
    const before = JSON.stringify(
      getActiveNail(blueprint).layers.map((layer) => layer.transform),
    );
    const after = JSON.stringify(
      getActiveNail(next).layers.map((layer) => layer.transform),
    );
    commit(next, {
      noticeMessage:
        before !== after
          ? "Artwork was kept inside the updated nail boundary."
          : "",
    });
  }

  function patchLayer(layerId, patch, record = true) {
    const next = updateActiveNail(blueprint, (nail) => ({
      ...nail,
      layers: nail.layers.map((layer) => {
        if (layer.id !== layerId) return layer;
        const merged = {
          ...layer,
          ...patch,
          data: patch.data ? { ...layer.data, ...patch.data } : layer.data,
        };
        if (patch.transform)
          merged.transform = safeTransform(patch.transform, nail, layer.type);
        if (layer.type === "base") {
          merged.locked = true;
          merged.visible = true;
          merged.data = { ...layer.data, ...(patch.data || {}) };
        }
        return merged;
      }),
    }));
    const synced = updateActiveNail(next, (nail) => ({
      ...nail,
      baseColorHex: getVisibleBaseColor(nail),
    }));
    if (record) commit(synced, { selectLayerId: layerId });
    else {
      const normalized = ensureFullSetBlueprint(synced);
      blueprintRef.current = normalized;
      setBlueprint(normalized);
    }
  }

  function transformLayer(layerId, transform, final, options = {}) {
    if (options.cancel) {
      dragStartBlueprintRef.current = null;
      if (transform) patchLayer(layerId, { transform }, false);
      return;
    }
    if (transform) {
      if (!dragStartBlueprintRef.current)
        dragStartBlueprintRef.current = blueprint;
      patchLayer(layerId, { transform }, false);
    }
    if (final) {
      const preDragBlueprint = dragStartBlueprintRef.current || blueprint;
      dragStartBlueprintRef.current = null;
      setHistory((prev) => pushHistory(prev, preDragBlueprint));
      markEdited();
      dirtyRef.current = true;
      setDirty(true);
      setStatus({ type: "dirty", message: "Unsaved changes" });
      setSaveStatus("Unsaved changes");
      scheduleAutosave();
    }
  }

  function addAsset(asset) {
    const layer = assetLayer(asset, activeNail);
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function defaultGradientData(nail = activeNail, accent = DEFAULT_GRADIENT_ACCENT) {
    const baseColor = normalizeHex(nail?.baseColorHex || baseLayer?.data?.colorHex, activePolishColor);
    return normalizeGradientData({
      colorA: baseColor,
      colorB: accent,
      direction: "vertical",
      blendPosition: 0.5,
      softness: 0.62,
      angle: 90,
      gradientStops: [
        { color: baseColor, position: 0 },
        { color: accent, position: 100 },
      ],
    });
  }

  function addGradient() {
    const layer = {
      ...gradientLayer(activeNail),
      name: "Blended Gradient Overlay",
      opacity: 0.45,
      data: { ...defaultGradientData(), mode: "overlayBlend" },
    };
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function activeGradientLayer() {
    return selectedLayer?.type === "gradient"
      ? selectedLayer
      : activeNail.layers.find((layer) => layer.type === "gradient");
  }

  function patchGradientData(patch) {
    const layer = activeGradientLayer();
    if (!layer) {
      showNotice("Add a gradient layer first.");
      return;
    }
    const nextData = normalizeGradientData({ ...layer.data, ...patch });
    patchLayer(layer.id, { data: nextData });
    setSelectedLayerId(layer.id);
  }

  function patchGradientStop(index, patch) {
    const layer = activeGradientLayer();
    if (!layer) return;
    const stops = layer.data?.gradientStops || defaultGradientData().gradientStops;
    const nextStops = stops.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, ...patch } : stop,
    );
    patchGradientData({
      gradientStops: nextStops,
      colorA: nextStops[0]?.color,
      colorB: nextStops.at(-1)?.color,
    });
  }

  function addGradientStop() {
    const layer = activeGradientLayer();
    if (!layer) {
      addGradient();
      return;
    }
    const stops = layer.data?.gradientStops || defaultGradientData().gradientStops;
    if (stops.length >= 7) return;
    const nextCount = stops.length + 1;
    const nextStops = [...stops, { color: "#FFFFFF", position: 50 }].map((stop, index) => ({
      ...stop,
      position: index === 0 ? 0 : index === nextCount - 1 ? 100 : Math.round((index / (nextCount - 1)) * 100),
    }));
    patchGradientData({ gradientStops: nextStops, colorA: nextStops[0].color, colorB: nextStops.at(-1).color });
  }

  function removeGradientStop(index) {
    const layer = activeGradientLayer();
    if (!layer) return;
    const stops = layer.data?.gradientStops || defaultGradientData().gradientStops;
    if (stops.length <= 2) return;
    const nextStops = stops.filter((_, stopIndex) => stopIndex !== index);
    patchGradientData({ gradientStops: nextStops, colorA: nextStops[0].color, colorB: nextStops.at(-1).color });
  }

  function setPolishFillMode(mode) {
    const gradientData = baseLayer?.data?.gradient || defaultGradientData();
    updateBase({ polishFillMode: mode, gradient: gradientData, effect: mode === "gradient" ? "Gradient" : "Solid" });
  }

  function applyGradient(scope) {
    const sourceLayer = activeGradientLayer();
    if (!sourceLayer) {
      showNotice("Add a gradient layer first.");
      return;
    }
    const targets = scope === "active" ? [activeSlot] : slotsFor(scope);
    const next = updateActiveNail(blueprint, (nail) => nail);
    const patched = ensureFullSetBlueprint({
      ...next,
      nails: next.nails.map((nail) => {
        if (!targets.includes(nail.slot)) return nail;
        const exists = nail.layers.some((layer) => layer.id === sourceLayer.id || layer.type === "gradient");
        const copied = { ...sourceLayer, id: exists ? sourceLayer.id : uid("gradient") };
        return {
          ...nail,
          layers: exists
            ? nail.layers.map((layer) => layer.type === "gradient" ? { ...copied, id: layer.id } : layer)
            : renumberLayers([...nail.layers, copied]),
        };
      }),
    });
    commit(patched, { selectLayerId: sourceLayer.id, noticeMessage: "Gradient applied." });
  }

  function addPattern() {
    const layer = patternLayer(activeNail, "dots");
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function activePatternLayer() {
    return selectedLayer?.type === "pattern"
      ? selectedLayer
      : activeNail.layers.find((layer) => layer.type === "pattern");
  }

  function patchPatternData(patch) {
    const layer = activePatternLayer();
    if (!layer) {
      showNotice("Add a pattern layer first.");
      return;
    }
    patchLayer(layer.id, { data: { ...layer.data, ...patch } });
    setSelectedLayerId(layer.id);
  }

  function addFrenchTip() {
    const layer = frenchTipLayer(activeNail, "classic", "medium");
    commit(addLayerToBlueprint(blueprint, layer), { selectLayerId: layer.id });
    setTab("properties");
  }

  function activeFrenchTipLayer() {
    return selectedLayer?.type === "frenchTip"
      ? selectedLayer
      : activeNail.layers.find((layer) => layer.type === "frenchTip");
  }

  function patchFrenchTipData(patch) {
    const layer = activeFrenchTipLayer();
    if (!layer) {
      showNotice("Add a French Tip layer first.");
      return;
    }
    const presetPatch =
      patch.preset && FRENCH_TIP_PRESETS[patch.preset]
        ? FRENCH_TIP_PRESETS[patch.preset]
        : {};
    patchLayer(layer.id, { data: { ...layer.data, ...presetPatch, ...patch } });
    setSelectedLayerId(layer.id);
  }

  function applyFrenchTip(scope) {
    const layer = activeFrenchTipLayer();
    if (!layer) {
      showNotice("Add a French Tip layer first.");
      return;
    }
    const targets = scope === "active" ? [activeSlot] : slotsFor(scope);
    commit(applyFrenchTipToSlots(blueprint, layer, targets), {
      selectLayerId: layer.id,
      noticeMessage:
        scope === "all"
          ? "French tip applied to all nails."
          : scope === "hand"
            ? "French tip applied to current hand."
            : "French tip applied to active nail.",
    });
    setCommandPopover("");
  }

  function addStroke(stroke) {
    const preferredLayerId = isReusableDrawingLayer(selectedLayer)
      ? selectedLayer.id
      : selectedLayerId;
    const result = addStrokeToDrawingLayer(
      blueprint,
      stroke,
      brush.tool,
      preferredLayerId,
    );
    commit(result.blueprint, { selectLayerId: result.layerId });
  }

  function stageEraseStroke(point) {
    const drawing = isReusableDrawingLayer(selectedLayer)
      ? selectedLayer
      : activeNail.layers.find(isReusableDrawingLayer);
    if (!drawing) {
      showNotice("Select a visible unlocked drawing layer to erase strokes.");
      return null;
    }
    const strokes = drawing.data.strokes || [];
    if (!strokes.length) {
      showNotice("No visible strokes to erase on this layer.");
      return null;
    }
    let nearest = 0;
    let best = Infinity;
    strokes.forEach((stroke, i) =>
      stroke.points.forEach((p) => {
        const distance = Math.hypot(p.x - point.x, p.y - point.y);
        if (distance < best) {
          best = distance;
          nearest = i;
        }
      }),
    );
    return {
      layerId: drawing.id,
      strokeId: strokes[nearest]?.id || "",
      strokeIndex: nearest,
    };
  }

  function eraseStroke(target) {
    if (!target?.layerId) return;
    const drawing = activeNail.layers.find(
      (layer) => layer.id === target.layerId && isReusableDrawingLayer(layer),
    );
    if (!drawing) return;
    const strokes = drawing.data.strokes || [];
    const strokeIndex = strokes.findIndex((stroke, index) =>
      target.strokeId
        ? stroke.id === target.strokeId
        : index === target.strokeIndex,
    );
    if (strokeIndex < 0) return;
    const nextStrokes = strokes.filter((_, index) => index !== strokeIndex);
    patchLayer(drawing.id, { data: { ...drawing.data, strokes: nextStrokes } });
  }

  function deleteLayer(layerId = selectedLayerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base" || layer.locked) return;
    const next = updateActiveNail(blueprint, (nail) => ({
      ...nail,
      layers: renumberLayers(nail.layers.filter((item) => item.id !== layerId)),
    }));
    commit(next, { selectLayerId: "base-layer" });
  }

  function duplicateLayer(layerId = selectedLayerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base" || layer.locked) return;
    const copy = {
      ...layer,
      id: uid(layer.type),
      name: `${layer.name} copy`,
      locked: false,
      transform: safeTransform(
        {
          ...layer.transform,
          x: layer.transform.x + 0.06,
          y: layer.transform.y + 0.06,
        },
        activeNail,
        layer.type,
      ),
      data: { ...layer.data },
      order: activeNail.layers.length,
    };
    commit(addLayerToBlueprint(blueprint, copy), { selectLayerId: copy.id });
  }

  function moveLayer(layerId, direction) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    const next = updateActiveNail(blueprint, (nail) => {
      const renderOrdered = [...nail.layers].sort(layerSort);
      const index = renderOrdered.findIndex((item) => item.id === layerId);
      if (index <= 0) return nail;
      const target = clamp(index + direction, 1, renderOrdered.length - 1);
      if (target === index) return nail;
      [renderOrdered[index], renderOrdered[target]] = [
        renderOrdered[target],
        renderOrdered[index],
      ];
      const reorderedIds = new Set(renderOrdered.map((item) => item.id));
      const normalizedById = new Map(
        renderOrdered.map((item, order) => [item.id, { ...item, order }]),
      );
      const reorderedLayers = renderOrdered.map((item) => normalizedById.get(item.id));
      const remainingLayers = nail.layers
        .filter((item) => !reorderedIds.has(item.id))
        .map((item) => normalizedById.get(item.id) || item);
      return { ...nail, layers: [...reorderedLayers, ...remainingLayers] };
    });
    commit(next, { selectLayerId: layerId });
  }

  function toggleVisible(layerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    patchLayer(layerId, { visible: !layer.visible });
  }

  function toggleLock(layerId) {
    const layer = layerById(activeNail, layerId);
    if (!layer || layer.type === "base") return;
    patchLayer(layerId, { locked: !layer.locked });
  }

  function markHistoryMutation(message) {
    markEdited();
    dirtyRef.current = true;
    setDirty(true);
    setStatus({ type: "dirty", message });
    setSaveStatus("Unsaved changes");
    scheduleAutosave();
  }

  function undo() {
    if (!canUndo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.past[history.past.length - 1];
    const restored = restoreHistorySnapshot(snapshot);
    blueprintRef.current = restored;
    dirtyRef.current = true;
    setBlueprint(restored);
    setHistory({
      past: history.past.slice(0, -1),
      future: [current, ...history.future].slice(0, 50),
    });
    markHistoryMutation("Undo applied");
  }

  function redo() {
    if (!canRedo) return;
    const current = JSON.stringify(blueprint);
    const snapshot = history.future[0];
    const restored = restoreHistorySnapshot(snapshot);
    blueprintRef.current = restored;
    dirtyRef.current = true;
    setBlueprint(restored);
    setHistory({
      past: [...history.past, current].slice(-50),
      future: history.future.slice(1),
    });
    markHistoryMutation("Redo applied");
  }

  function clearAutosaveTimer() {
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = null;
  }

  function scheduleAutosave() {
    clearAutosaveTimer();
    const scheduledSession = autosaveSessionRef.current;
    autosaveTimerRef.current = window.setTimeout(() => {
      autosaveTimerRef.current = null;
      if (
        !mountedRef.current ||
        scheduledSession !== autosaveSessionRef.current ||
        !dirtyRef.current
      )
        return;
      void save({ autosave: true });
    }, 20000);
  }

  function generatedUntitledName() {
    if (generatedDraftNameRef.current) return generatedDraftNameRef.current;
    const existing = new Set(designs.map((design) => design.name));
    let name = `Untitled Set ${generatedNameCounterRef.current}`;
    while (existing.has(name))
      name = `Untitled Set ${++generatedNameCounterRef.current}`;
    generatedDraftNameRef.current = name;
    return name;
  }

  async function save(options = {}) {
    if (savingRef.current) {
      queuedAutosaveRef.current =
        queuedAutosaveRef.current ||
        Boolean(options.autosave || dirtyRef.current);
      setSaveStatus("Saving…");
      return (
        activeSavePromiseRef.current || { ok: false, reason: "save-in-flight" }
      );
    }

    const submittedRevision = editGenerationRef.current;
    const submittedSelectionRevision = selectionRevisionRef.current;
    const submittedEditorSession = editorSessionRef.current;
    const workingBlueprint = ensureFullSetBlueprint(
      blueprintRef.current || blueprint,
    );
    const existingDesignId = selectedDesignIdRef.current;
    const saveKind = {
      mode: options.autosave ? "autosave" : "manual",
      target: existingDesignId ? "existing-design-update" : "new-draft-create",
    };
    const visibleName = designNameRef.current.trim();
    let workingName = visibleName;
    if (!workingName && existingDesignId) {
      workingName = persistedDesignNameRef.current.trim();
      if (!workingName) {
        setStatus({
          type: "error",
          message: "Enter a design name before saving this existing design.",
        });
        setSaveStatus("Unsaved changes");
        return { ok: false, reason: "validation" };
      }
    } else if (!workingName && options.autosave) {
      workingName = generatedUntitledName();
    } else if (!workingName) {
      workingName = designName.trim();
    }
    const flat = flatDesignFromBlueprint(workingBlueprint, workingName);
    if (!flat.name) {
      setStatus({
        type: "error",
        message: "Enter a design name before saving.",
      });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(flat.baseColorHex)) {
      setStatus({
        type: "error",
        message: "Choose a valid base polish color.",
      });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }

    const blueprintBytes = serializedBlueprintSize(workingBlueprint);
    if (blueprintBytes > MAX_BLUEPRINT_JSON_BYTES) {
      setStatus({
        type: "error",
        message: `${blueprintSizeMessage(blueprintBytes)} Remove a few strokes or layers before saving.`,
      });
      setSaveStatus("Unsaved changes");
      return { ok: false, reason: "validation" };
    }
    if (blueprintBytes >= BLUEPRINT_WARNING_BYTES) {
      setStatus({
        type: "dirty",
        message: `${blueprintSizeMessage(blueprintBytes)} Saving, but consider simplifying before adding more details.`,
      });
    }

    savingRef.current = true;
    const sequence = ++saveSequenceRef.current;
    setSaving(true);
    setSaveStatus("Saving…");

    const savePromise = (async () => {
      let responseFromStaleEditorSession = false;
      try {
        let designId = existingDesignId;
        let savedDesign = designs.find((design) => design.id === designId);
        let savedBlueprint;
        if (!designId) {
          const res = await fetch("/api/designs/with-blueprint", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ design: flat, blueprint: workingBlueprint }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok)
            throw new Error(
              data.error || "Unable to create design with blueprint.",
            );
          designId = data.design?.id;
          savedDesign = data.design;
          savedBlueprint = data.blueprint;
          if (!designId || !savedBlueprint?.document)
            throw new Error("Saved design response was incomplete.");
        } else {
          const put = await fetch(`/api/designs/${designId}/with-blueprint`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ design: flat, blueprint: workingBlueprint }),
          });
          const data = await put.json().catch(() => ({}));
          if (!put.ok)
            throw new Error(
              data.error || "Unable to save design and blueprint.",
            );
          savedDesign = data.design;
          savedBlueprint = data.blueprint;
          if (!savedDesign?.id || !savedBlueprint?.document)
            throw new Error("Saved design response was incomplete.");
        }
        if (sequence !== saveSequenceRef.current)
          return { ok: false, reason: "superseded" };
        mergeSavedDesign(savedDesign);
        responseFromStaleEditorSession =
          editorSessionRef.current !== submittedEditorSession ||
          selectedDesignIdRef.current !== existingDesignId;
        if (responseFromStaleEditorSession) {
          return {
            ok: false,
            reason: "stale-editor-session",
            designId,
            savedRevision: submittedRevision,
            saveKind,
          };
        }
        if (!existingDesignId) {
          setSelectedDesignId(designId);
          selectedDesignIdRef.current = designId;
          if (savedDesign?.name && !designNameRef.current) {
            generatedDraftNameRef.current = savedDesign.name;
            designNameRef.current = savedDesign.name;
            setDesignName(savedDesign.name);
          } else if (savedDesign?.name) {
            generatedDraftNameRef.current = savedDesign.name;
          }
        }
        if (savedDesign?.name)
          persistedDesignNameRef.current = savedDesign.name;
        const unchangedSinceSubmit =
          editGenerationRef.current === submittedRevision &&
          selectionRevisionRef.current === submittedSelectionRevision;
        if (unchangedSinceSubmit) {
          const normalizedSaved = ensureFullSetBlueprint(
            savedBlueprint.document,
            savedDesign,
          );
          blueprintRef.current = normalizedSaved;
          designNameRef.current = savedDesign?.name || flat.name;
          generatedDraftNameRef.current = "";
          persistedDesignNameRef.current = savedDesign?.name || flat.name;
          setDesignName(savedDesign?.name || flat.name);
          setBlueprint(normalizedSaved);
          dirtyRef.current = false;
          setDirty(false);
          clearAutosaveTimer();
          setSaveStatus(options.autosave ? "Autosaved" : "Saved");
          setStatus({
            type: "saved",
            message:
              blueprintBytes >= BLUEPRINT_WARNING_BYTES
                ? `${blueprintSizeMessage(blueprintBytes)} Saved, but consider simplifying before adding more details.`
                : "Saved editable blueprint",
          });
        } else {
          queuedAutosaveRef.current = true;
          dirtyRef.current = true;
          setDirty(true);
          setSaveStatus("Unsaved changes");
          setStatus({
            type: "dirty",
            message: "Newer edits kept locally; another autosave is queued.",
          });
        }
        return {
          ok: true,
          designId,
          savedRevision: submittedRevision,
          saveKind,
        };
      } catch (error) {
        setSaveStatus("Save failed — changes kept locally");
        setStatus({
          type: "error",
          message:
            error.message ||
            "Save failed. Your unsaved editor work is still open.",
        });
        return { ok: false, reason: error.message || "save-failed" };
      } finally {
        setSaving(false);
        savingRef.current = false;
        activeSavePromiseRef.current = null;
        if (responseFromStaleEditorSession) queuedAutosaveRef.current = false;
        else if (
          queuedAutosaveRef.current ||
          (dirtyRef.current && options.autosave)
        ) {
          queuedAutosaveRef.current = false;
          scheduleAutosave();
        } else if (!dirtyRef.current) clearAutosaveTimer();
      }
    })();
    activeSavePromiseRef.current = savePromise;
    return savePromise;
  }

  function selectSlot(slot) {
    const current = blueprintRef.current || blueprint;
    const currentActive = getActiveNail(current);
    if (currentActive?.slot === slot) return;
    const next = ensureFullSetBlueprint(setActiveNailBySlot(current, slot));
    selectionRevisionRef.current += 1;
    blueprintRef.current = next;
    setBlueprint(next);
    setSelectedLayerId("base-layer");
    setStatus({
      type: dirtyRef.current ? "dirty" : "idle",
      message: `Editing ${slot}`,
    });
    if (dirtyRef.current && savingRef.current) queuedAutosaveRef.current = true;
  }

  function slotsFor(scope) {
    if (scope === "all") return FULL_SET_SLOTS;
    const handSlots = activeSlot.startsWith("left")
      ? LEFT_HAND_SLOTS
      : RIGHT_HAND_SLOTS;
    if (scope === "hand") return handSlots;
    if (scope === "opposite") {
      const source = activeSlot.startsWith("left")
        ? LEFT_HAND_SLOTS
        : RIGHT_HAND_SLOTS;
      const dest = activeSlot.startsWith("left")
        ? RIGHT_HAND_SLOTS
        : LEFT_HAND_SLOTS;
      return [dest[source.indexOf(activeSlot)]].filter(Boolean);
    }
    return selectedSlots;
  }

  function confirmBulk(message) {
    return window.confirm(message);
  }
  function copyActiveNail() {
    setClipboardNail(JSON.parse(JSON.stringify(activeNail)));
    showNotice("Active nail copied.");
  }
  function pasteToSelected() {
    if (!clipboardNail) {
      showNotice("Copy the active nail before pasting to selected nails.");
      return;
    }
    if (!selectedSlots.length) {
      showNotice("Select destination nails, then paste copied design.");
      return;
    }
    if (!confirmBulk("Overwrite selected nail designs?")) return;
    commit(
      {
        ...blueprint,
        nails: blueprint.nails.map((nail) =>
          selectedSlots.includes(nail.slot)
            ? cloneNailDesign(clipboardNail, nail)
            : nail,
        ),
      },
      { noticeMessage: "Copied artwork was re-fit where needed." },
    );
  }
  function duplicateActive(scope) {
    const targets = slotsFor(scope);
    if (!targets.length || !confirmBulk("Overwrite destination nail designs?"))
      return;
    commit(copyNailToSlots(blueprint, activeSlot, targets), {
      noticeMessage: "Copied artwork was re-fit where needed.",
    });
  }
  function mirrorHand(hand) {
    if (!confirmBulk("Mirror this hand to the opposite hand?")) return;
    commit(mirrorHandDesign(blueprint, hand), {
      noticeMessage: "Mirrored nails were re-fit where needed.",
    });
  }
  function applyBase(scope) {
    const targets = slotsFor(scope);
    if (!confirmBulk("Apply active base color to these nails?")) return;
    commit(
      applyBaseToSlots(
        blueprint,
        { baseColorHex: getVisibleBaseColor(activeNail) },
        targets,
      ),
    );
  }
  function applyShape(scope) {
    const targets = slotsFor(scope);
    if (
      !confirmBulk("Apply active hero shape, length, and width to these nails?")
    )
      return;
    commit(
      applyBaseToSlots(
        blueprint,
        {
          shape: activeNail.shape,
          width: activeNail.width,
          length: activeNail.length,
        },
        targets,
      ),
      { noticeMessage: "Artwork was revalidated after shape changes." },
    );
  }
  function resetActive() {
    if (!confirmBulk("Reset this nail to its base layer only?")) return;
    commit(resetNailDesign(blueprint, activeSlot), {
      selectLayerId: "base-layer",
    });
  }

  function updateUserSignatureLooks(updater) {
    setUserSignatureLooks((prev) => {
      const next = updater(prev)
        .map(normalizeSignatureLook)
        .filter((look) => !look.starter);
      persistSignatureLooks(next);
      return next;
    });
  }

  function saveSignatureLook(scope) {
    const fallback =
      scope === "full-set"
        ? `${designName || "Full Set"} Signature`
        : `${activeSlot} Signature`;
    const name = window.prompt("Name this Signature Look", fallback);
    if (!name) return;
    const look = createSignatureLookFromBlueprint(blueprint, name, scope);
    updateUserSignatureLooks((prev) => [...prev, look]);
    setSelectedSignatureLookId(look.id);
    showNotice("Signature Look saved.");
  }

  function applySignatureLook(look, scope) {
    commit(applySignatureLookToBlueprint(blueprint, look, scope), {
      selectLayerId: "base-layer",
      noticeMessage:
        scope === "all"
          ? "Signature Look applied to full set."
          : "Signature Look applied to selected nail.",
    });
  }

  function duplicateSignatureLook(look) {
    const copy = normalizeSignatureLook({
      ...look,
      id: uid("signature-look"),
      name: `${look.name} copy`,
      starter: false,
    });
    updateUserSignatureLooks((prev) => [...prev, copy]);
    setSelectedSignatureLookId(copy.id);
  }

  function renameSignatureLook(look) {
    if (look.starter) return;
    const name = window.prompt("Rename Signature Look", look.name);
    if (!name) return;
    updateUserSignatureLooks((prev) =>
      prev.map((item) => (item.id === look.id ? { ...item, name } : item)),
    );
  }

  function deleteSignatureLook(look) {
    if (look.starter || !confirmBulk(`Delete ${look.name}?`)) return;
    updateUserSignatureLooks((prev) =>
      prev.filter((item) => item.id !== look.id),
    );
    setSelectedSignatureLookId(STARTER_SIGNATURE_LOOKS[0]?.id || "");
  }

  function updateDesignName(value) {
    const limitedName = value.slice(0, DESIGN_NAME_MAX_LENGTH);
    markEdited();
    generatedDraftNameRef.current = "";
    designNameRef.current = limitedName;
    dirtyRef.current = true;
    setDesignName(limitedName);
    setDirty(true);
    setSaveStatus("Unsaved changes");
    scheduleAutosave();
  }

  function toggleCommandPopover(id) {
    setCommandPopover((current) => (current === id ? "" : id));
  }

  function openFrenchTipQuickAccess() {
    setCommandPopover((current) => (current === "french" ? "" : "french"));
    setActiveStudio("techniqueStudio");
    setTab("effects");
    showNotice("Technique Studio opened on the Creative Wall; French Tip quick access is anchored away from the Hero Canvas.");
  }


  function openSavedDesignsBrowser() {
    setSavedDesignsOpen(true);
    void loadDesigns();
  }

  function openPolishRack() {
    setCommandPopover("polish");
    setActiveStudio("polishStudio");
    setPanelState((prev) => ({ ...prev, polishStudio: true }));
    requestAnimationFrame(() =>
      polishStudioRef.current?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      }),
    );
    showNotice(
      "Polish Studio opened in the Creative Library with quick controls available from the command bar.",
    );
  }

  function adjustZoom(delta) {
    setCommandZoom((value) => clamp(value + delta, 25, 165));
  }

  function togglePanel(id) {
    setPanelState((prev) => {
      const group = PANEL_GROUPS.find((items) => items.includes(id));
      const next = group
        ? group.reduce(
            (state, panelId) => ({
              ...state,
              [panelId]: panelId === id ? !prev[id] : false,
            }),
            { ...prev },
          )
        : { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined")
        window.localStorage.setItem(
          PANEL_PREFS_STORAGE_KEY,
          JSON.stringify(next),
        );
      return next;
    });
  }

  const tagsString = (blueprint.metadata?.tags || []).join(", ");
  const [debugShapeOverlay, setDebugShapeOverlay] = useState(false);
  const statusColor =
    status.type === "error"
      ? "#b91c1c"
      : status.type === "saved"
        ? COLORS.statusAccepted
        : status.type === "dirty"
          ? COLORS.statusChangesRequested
          : COLORS.textMuted;
  const activeFrenchTip = activeFrenchTipLayer();
  const currentHand = activeSlot.startsWith("R") ? "right" : "left";
  const applyCurrentPolish = (scope) => {
    const targets = scope === "active" ? [activeSlot] : slotsFor(scope);
    const committedColor = normalizeHex(
      draftPolish.colorHex,
      activePolishColor,
    );
    const polish = normalizePolishData(
      { ...baseLayer?.data, polishType: draftPolish.polishType },
      committedColor,
    );
    rememberPolishColor(committedColor);
    commit(
      applyBaseToSlots(
        blueprint,
        {
          baseColorHex: committedColor,
          polishType: polish.polishType,
          shine: polish.shine,
          transparency: polish.transparency,
          topCoat:
            draftPolish.polishType === "Matte" ? "Matte" : polish.topCoat,
          effect: "Solid",
        },
        targets,
      ),
    );
    setCommandPopover("");
  };

  // POLISH_TYPES.map((type) => <option key={type} value={type}>{type}</option>)
  // >{SHAPES.map((shape) => <option key={shape}>{shape}</option>)}</select>
  // Workspace Memory placeholders: zoom, selected polish, drawer state, canvas mode, selected nail.
  const applyRackPolish = (value) => {
    const colorHex = normalizeHex(value, activePolishColor);
    setDraftPolish((prev) => ({ ...prev, colorHex }));
    rememberPolishColor(colorHex);
    updateBase({
      baseColorHex: colorHex,
      polishType: draftPolish.polishType,
      topCoat: draftPolish.polishType === "Matte" ? "Matte" : "Gloss",
      effect: "Solid",
    });
  };

  function selectStudioCard(id) {
    setActiveStudio(id);
    if (id === "polishStudio")
      setPanelState((prev) => ({ ...prev, polishStudio: true }));
    if (id === "techniqueStudio") {
      setTab("effects");
      setSelectedTechnique("");
    }
    if (id === "gemStudio" || id === "charmStudio") setTab("assets");
    if (id === "brushStudio") setTab("brush");
  }

  const renderActiveStudioPanel = () => {
    if (activeStudio === "polishStudio")
      return (
        <div
          ref={polishStudioRef}
          data-testid="creative-library-polish-studio"
          title="Polish Studio"
        >
          <PolishColorControls
            value={draftPolish.colorHex}
            recentPolish={recentPolish}
            polishType={draftPolish.polishType}
            onRackSelect={applyRackPolish}
            onPolishTypeChange={(polishType) =>
              setDraftPolish((prev) => ({ ...prev, polishType }))
            }
            onChange={(value) =>
              setDraftPolish((prev) => ({
                ...prev,
                colorHex: normalizeHex(value, prev.colorHex),
              }))
            }
            onApply={applyCurrentPolish}
          />
        </div>
      );
    if (activeStudio === "techniqueStudio")
      return (
        <section data-testid="technique-studio-panel" style={UI.panelSection}>
          <div style={UI.panelBody}>
            <div style={UI.sectionTitle}>Choose Technique</div>
            <div data-testid="technique-choice-grid" style={UI.techniqueChoiceGrid}>
              <button
                type="button"
                data-testid="technique-choice-french"
                aria-pressed={selectedTechnique === "french"}
                onClick={() => setSelectedTechnique("french")}
                style={UI.techniqueChoiceButton(selectedTechnique === "french")}
              >
                ◠ French Tip
              </button>
              <button
                type="button"
                data-testid="technique-choice-gradient"
                aria-pressed={selectedTechnique === "gradient"}
                onClick={() => setSelectedTechnique("gradient")}
                style={UI.techniqueChoiceButton(selectedTechnique === "gradient")}
              >
                ◐ Gradient
              </button>
              <button
                type="button"
                data-testid="technique-choice-pattern"
                aria-pressed={selectedTechnique === "pattern"}
                onClick={() => setSelectedTechnique("pattern")}
                style={UI.techniqueChoiceButton(selectedTechnique === "pattern")}
              >
                ▧ Pattern
              </button>
              <button
                type="button"
                data-testid="technique-choice-aura"
                aria-pressed={selectedTechnique === "aura"}
                onClick={() => setSelectedTechnique("gradient")}
                style={UI.techniqueChoiceButton(selectedTechnique === "aura")}
              >
                ✺ Aura
              </button>
            </div>
            {!selectedTechnique && <p data-testid="technique-studio-choice-prompt" style={UI.smallText}>Pick a technique to open its controls in this pop-out panel while the Hero Canvas stays visible.</p>}
            {selectedTechnique === "french" && (
              <FrenchTipControls
                layer={activeFrenchTip}
                onAdd={addFrenchTip}
                onPatch={patchFrenchTipData}
                onApply={applyFrenchTip}
              />
            )}
            {selectedTechnique === "gradient" && (
              <GradientWorkflowControls
                layer={activeGradientLayer()}
                baseColor={activePolishColor}
                polishFillMode={baseLayer?.data?.polishFillMode || "solid"}
                onAdd={addGradient}
                onPatch={patchGradientData}
                onPatchStop={patchGradientStop}
                onAddStop={addGradientStop}
                onRemoveStop={removeGradientStop}
                onOpacity={(opacity) => {
                  const layer = activeGradientLayer();
                  if (layer) patchLayer(layer.id, { opacity });
                }}
                onFillMode={setPolishFillMode}
                onApply={applyGradient}
              />
            )}
            {selectedTechnique === "pattern" && (
              <PatternWorkflowControls
                layer={activePatternLayer()}
                onAdd={addPattern}
                onPatch={patchPatternData}
              />
            )}
          </div>
        </section>
      );
    if (activeStudio === "gemStudio" || activeStudio === "charmStudio")
      return (
        <section data-testid={`${activeStudio}-panel`} style={UI.panelSection}>
          <div style={UI.panelBody}>
            <AssetLibrary onAddAsset={addAsset} />
          </div>
        </section>
      );
    if (activeStudio === "brushStudio")
      return (
        <section data-testid="brush-studio-panel" style={UI.panelSection}>
          <div style={UI.panelBody}>
            <DrawingToolbar
                brush={brush}
                mode={mode}
              onBrushChange={(patch) =>
                setBrush((prev) => ({ ...prev, ...patch }))
              }
            />
          </div>
        </section>
      );
    return (
      <section data-testid="top-coat-studio-panel" style={UI.panelSection}>
        <div style={UI.panelBody}>
          <div style={UI.sectionTitle}>Top Coat Studio™</div>
          <p style={UI.smallText}>
            Top coat finish follows the selected Polish Type today; this
            architecture keeps finishing controls ready for future gloss,
            velvet, chrome, and transparency tools.
          </p>
          <button
            type="button"
            onClick={() =>
              setDraftPolish((prev) => ({ ...prev, polishType: "Matte" }))
            }
            style={UI.iconButton(draftPolish.polishType === "Matte")}
          >
            Matte prep
          </button>
          <button
            type="button"
            onClick={() =>
              setDraftPolish((prev) => ({ ...prev, polishType: "Cream" }))
            }
            style={{
              ...UI.iconButton(draftPolish.polishType !== "Matte"),
              marginLeft: 8,
            }}
          >
            Gloss prep
          </button>
        </div>
      </section>
    );
  };

  return (
    <div style={UI.shell}>
      <StudioMicrointeractionStyles />
      <header
        data-testid="artist-command-bar"
        aria-label="Artist Command Bar"
        style={UI.artistCommandBar}
      >
        <div style={UI.commandIdentity}>
          <div style={UI.commandLogo}>AnitaSet</div>
          <input
            aria-label="Design Name"
            data-testid="artist-command-design-name"
            value={designName}
            maxLength={DESIGN_NAME_MAX_LENGTH}
            onChange={(e) => updateDesignName(e.target.value)}
            placeholder="Untitled Design"
            style={UI.commandDesignName}
          />
          <div data-testid="artist-command-design-name-counter" style={UI.commandDesignNameCounter}>
            {Math.min(designName.length, DESIGN_NAME_MAX_LENGTH)}/{DESIGN_NAME_MAX_LENGTH}
          </div>
          <div
            data-testid="artist-command-collection"
            style={UI.commandCollection}
          >
            {collectionName}
          </div>
        </div>

        <div style={UI.commandCenter}>
          <div
            data-testid="artist-command-autosave"
            style={{ ...UI.autoSaveBadge, color: statusColor }}
          >
            <span className={saving || loading ? "studio-status-loading" : ""}>
              {saving || loading ? "Saving…" : "● Auto Saved"}
            </span>
          </div>
          <div style={UI.commandGroup}>
            <button
              type="button"
              data-testid="current-polish-bottle"
              aria-expanded={commandPopover === "polish"}
              aria-controls="command-polish-color-popover"
              onClick={openPolishRack}
              className="studio-current-polish"
              style={UI.currentPolishButton}
              aria-label="Open Polish Color controls for Current Polish Bottle"
            >
              <PolishBottle
                colorHex={activePolishColor}
                label={`Current Polish Bottle ${activePolishColor}`}
                selected
                size="medium"
                polishType={activePolish.polishType}
                />
              <span style={UI.currentPolishText}>
                Current Polish Bottle™
                <strong style={UI.currentPolishMeta}>
                  {activePolish.polishType} · {activePolishColor}
                </strong>
              </span>
            </button>
            {commandPopover === "polish" && (
              <CommandPopoverPortal>
              <div
                id="command-polish-color-popover"
                data-testid="command-polish-color-popover"
                data-canvas-safe-placement="left-creative-library-anchor"
                className="studio-popover-motion"
                style={UI.commandPolishPopover}
              >
                {/* Canvas-safe marker: this quick polish popover is fixed to the Creative Library side rail instead of the centered hero canvas. */}
                <PolishColorControls
                  compact
                  value={draftPolish.colorHex}
                  recentPolish={recentPolish}
                  polishType={draftPolish.polishType}
                  onRackSelect={applyRackPolish}
                  onPolishTypeChange={(polishType) =>
                    setDraftPolish((prev) => ({ ...prev, polishType }))
                  }
                  onChange={(value) =>
                    setDraftPolish((prev) => ({
                      ...prev,
                      colorHex: normalizeHex(value, prev.colorHex),
                    }))
                  }
                  onApply={applyCurrentPolish}
                />
              </div>
              </CommandPopoverPortal>
            )}
          </div>
        </div>

        <nav aria-label="Artist workspace actions" style={UI.commandActions}>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="studio-motion-button"
            style={UI.commandButton(false, saving)}
          >
            Save Version
          </button>
          <div style={UI.commandGroup}>
            <button
              type="button"
              data-testid="command-nail-basics-trigger"
              aria-expanded={commandPopover === "nailBasics"}
              aria-controls="command-nail-basics-popover"
              onClick={() => toggleCommandPopover("nailBasics")}
              className="studio-motion-button"
              aria-pressed={commandPopover === "nailBasics"}
              style={UI.commandButton(commandPopover === "nailBasics")}
            >
              Nail Basics™
            </button>
            {commandPopover === "nailBasics" && (
              <CommandPopoverPortal>
              <div
                id="command-nail-basics-popover"
                data-testid="command-nail-basics-popover"
                className="studio-popover-motion"
                style={UI.commandPopover}
              >
                <div style={UI.sectionTitle}>Nail Basics™</div>
                <Field label="Nail Shape">
                  <select
                    style={S.input}
                    value={activeNail.shape}
                    onChange={(e) => updateBase({ shape: e.target.value })}
                  >
                    {SHAPES.map((shape) => (
                      <option key={shape}>{shape}</option>
                    ))}
                  </select>
                </Field>
                <GeometrySlider
                  label="Nail Length"
                  value={activeNail.length}
                  onChange={(length) => updateBase({ length })}
                />
                <GeometrySlider
                  label="Nail Width"
                  value={activeNail.width}
                  onChange={(width) => updateBase({ width })}
                />
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => showNotice("Nail basics already applied to the active nail.")}
                    className="studio-motion-button"
          style={UI.iconButton(false)}
                  >
                    Active Nail
                  </button>
                  <button
                    type="button"
                    onClick={() => applyShape("hand")}
                    className="studio-motion-button"
          style={UI.iconButton(false)}
                  >
                    Current Hand
                  </button>
                  <button
                    type="button"
                    onClick={() => applyShape("all")}
                    className="studio-motion-button"
          style={UI.iconButton(false)}
                  >
                    Full Set
                  </button>
                </div>
              </div>
              </CommandPopoverPortal>
            )}
          </div>
          <div style={UI.commandGroup}>
            <button
              type="button"
              data-testid="command-set-actions-trigger"
              aria-expanded={commandPopover === "set"}
              aria-controls="command-set-actions-popover"
              onClick={() => toggleCommandPopover("set")}
              className="studio-motion-button"
              aria-pressed={commandPopover === "set"}
              style={UI.commandButton(commandPopover === "set")}
            >
              Set Actions
            </button>
            {commandPopover === "set" && (
              <CommandPopoverPortal>
              <div
                id="command-set-actions-popover"
                data-testid="command-set-actions-popover"
                className="studio-popover-motion"
                style={UI.commandPopover}
              >
                <div style={UI.sectionTitle}>Set Actions</div>
                <button
                  type="button"
                  onClick={() => duplicateActive("all")}
                  className="studio-motion-button"
          style={UI.iconButton(false)}
                >
                  Apply current design to all nails
                </button>
                <button
                  type="button"
                  onClick={() => duplicateActive("opposite")}
                  className="studio-motion-button"
          style={UI.iconButton(false)}
                >
                  Duplicate current nail
                </button>
                <button
                  type="button"
                  onClick={copyActiveNail}
                  className="studio-motion-button"
          style={UI.iconButton(false)}
                >
                  Copy current nail
                </button>
                <button
                  type="button"
                  onClick={pasteToSelected}
                  disabled={!clipboardNail}
                  className="studio-motion-button"
                  style={UI.iconButton(false, !clipboardNail)}
                >
                  Paste to selected nails
                </button>
                <button
                  type="button"
                  onClick={() => duplicateActive("hand")}
                  className="studio-motion-button"
          style={UI.iconButton(false)}
                >
                  Duplicate to current hand
                </button>
                <button
                  type="button"
                  onClick={() => mirrorHand(currentHand)}
                  className="studio-motion-button"
          style={UI.iconButton(false)}
                >
                  Mirror current hand
                </button>
                <p style={{ ...UI.smallText, margin: 0 }}>
                  Paste uses the existing selected-nail workflow from Set
                  Actions.
                </p>
              </div>
              </CommandPopoverPortal>
            )}
          </div>
          <div style={UI.commandGroup}>
            <button
              type="button"
              data-testid="command-french-tip-trigger"
              aria-expanded={commandPopover === "french"}
              aria-controls="command-french-tip-popover"
              onClick={openFrenchTipQuickAccess}
              className="studio-motion-button"
              aria-pressed={commandPopover === "french"}
              style={UI.commandButton(commandPopover === "french", false)}
            >
              French Tip
            </button>
            {commandPopover === "french" && (
              <CommandPopoverPortal>
              <div
                id="command-french-tip-popover"
                data-testid="command-french-tip-popover"
                data-canvas-safe-placement="left-creative-wall-anchor"
                className="studio-popover-motion"
                style={UI.commandFrenchTipPopover}
              >
                <FrenchTipControls
                  layer={activeFrenchTip}
                  onAdd={addFrenchTip}
                  onPatch={patchFrenchTipData}
                  onApply={applyFrenchTip}
                  quickAccess
                />
              </div>
              </CommandPopoverPortal>
            )}
          </div>
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="studio-motion-button"
            style={UI.commandButton(false, !canUndo)}
          >
            Undo
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="studio-motion-button"
            style={UI.commandButton(false, !canRedo)}
          >
            Redo
          </button>
          <div data-testid="artist-command-zoom" style={UI.zoomPill}>
            <button
              type="button"
              aria-label="Zoom Out"
              onClick={() => adjustZoom(-10)}
              className="studio-motion-button"
              style={UI.zoomButton}
            >
              −
            </button>
            <span>{commandZoom}%</span>
            <button
              type="button"
              aria-label="Zoom In"
              onClick={() => adjustZoom(10)}
              className="studio-motion-button"
              style={UI.zoomButton}
            >
              ＋
            </button>
          </div>
          <button
            type="button"
            onClick={() => setMode("select")}
            className="studio-motion-button studio-canvas-mode-button"
            aria-pressed={mode === "select"}
            style={UI.canvasModeButton}
          >
            Canvas Mode
          </button>
        </nav>
      </header>

      {/* Studio personalization hooks (architecture only): work surface, walls, lighting, accent color, layout mode, left-handed mode, panel transparency. */}
      <div data-testid="creative-workspace-layout" style={UI.layout}>
        <aside
          data-testid="creative-wall"
          aria-label="Creative Wall"
          style={{ ...UI.panel, ...UI.creativeWallPanel }}
        >
          <div style={UI.panelPad}>
            <div style={UI.sectionTitle}>Creative Wall™</div>
            <div style={{ display: "none" }}>Art Tools</div>
            <div style={UI.creativeWall}>
              {STUDIO_CARDS.map((studio) => (
                <StudioCard
                  key={studio.id}
                  studio={studio}
                  active={activeStudio === studio.id}
                  onSelect={selectStudioCard}
                />
              ))}
            </div>
            <div
              data-testid="studio-working-panel"
              data-panel-behavior="pop-out-beside-creative-wall"
              style={UI.studioPopoutPanel}
            >
              {renderActiveStudioPanel()}
            </div>

            <CollapsiblePanel
              id="savedDesigns"
              title="Saved Designs"
              open={savedDesignsOpen}
              onToggle={() => setSavedDesignsOpen((open) => !open)}
            >
              <div data-testid="saved-designs-browser" aria-label="Saved Designs" style={{ display: "grid", gap: 8 }}>
                <strong style={{ color: COLORS.plum }}>Saved Designs</strong>
                <button type="button" onClick={openSavedDesignsBrowser} disabled={loading} style={UI.iconButton(false, loading)}>
                  {loading ? "Loading saved designs…" : "Refresh saved designs"}
                </button>
                {designs.length ? designs.map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    data-testid="saved-design-open-button"
                    onClick={() => loadDesign(design.id)}
                    style={{ ...UI.iconButton(selectedDesignId === design.id), justifyContent: "flex-start", textAlign: "left" }}
                  >
                    {design.name || "Untitled design"}
                  </button>
                )) : <p style={UI.smallText}>No saved designs yet.</p>}
              </div>
            </CollapsiblePanel>
            <CollapsiblePanel
              id="signatureLooks"
              title="Signature Looks"
              open={panelState.signatureLooks}
              onToggle={togglePanel}
            >
              <SignatureLooksPanel
                looks={signatureLooks}
                selectedId={selectedSignatureLookId}
                onSelect={setSelectedSignatureLookId}
                onSave={saveSignatureLook}
                onApply={applySignatureLook}
                onDuplicate={duplicateSignatureLook}
                onRename={renameSignatureLook}
                onDelete={deleteSignatureLook}
                />
            </CollapsiblePanel>
            <CollapsiblePanel
              id="designDetails"
              title="Design Details"
              open={panelState.designDetails}
              onToggle={togglePanel}
            >
              <DesignPalette colors={designPalette} />
              <Field label="Tags">
                <input
                  style={S.input}
                  value={tagsString}
                  onChange={(e) => updateBase({ tags: e.target.value })}
                  placeholder="bridal, chrome, accent"
                />
              </Field>
              <Field label="Style category">
                <select
                  style={S.input}
                  value={blueprint.metadata?.styleCategory || "Custom"}
                  onChange={(e) =>
                    commit({
                      ...blueprint,
                      metadata: {
                        ...blueprint.metadata,
                        styleCategory: e.target.value,
                      },
                    })
                  }
                >
                  {STYLE_CATEGORIES.map((category) => (
                    <option key={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Internal notes">
                <textarea
                  style={{ ...S.input, minHeight: 70 }}
                  value={blueprint.metadata?.internalNotes || ""}
                  onChange={(e) =>
                    commit({
                      ...blueprint,
                      metadata: {
                        ...blueprint.metadata,
                        internalNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Optional artist-only notes"
                />
              </Field>
              <Field label="Estimated service price">
                <input
                  style={S.input}
                  value={blueprint.metadata?.estimatedServicePrice || ""}
                  onChange={(e) =>
                    commit({
                      ...blueprint,
                      metadata: {
                        ...blueprint.metadata,
                        estimatedServicePrice: e.target.value,
                      },
                    })
                  }
                  placeholder="Placeholder for later pricing"
                />
              </Field>
            </CollapsiblePanel>
            {/* Developer Geometry Tools implementation is intentionally hidden until a future Developer Mode gate is available. */}
            <p style={UI.smallText}>
              Strict-fit mode keeps all editable vectors clipped and clamped
              inside the active nail surface for realistic product-use planning.
            </p>
          </div>
        </aside>

        <main
          data-testid="hero-canvas"
          aria-label="Hero Canvas"
          style={{ ...UI.panel, ...UI.heroCanvasPanel }}
        >
          <div style={UI.heroCanvasHeader}>
            <span>Hero Canvas</span>
            <span style={UI.smallText}>
              Always visible while studios adjust tools
            </span>
          </div>
          <section
            style={{
              ...UI.stickyPreview,
              borderBottom: `1px solid ${COLORS.border}`,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          >
            <div key={activeStudio} className="studio-hero-fade">
              <NailCanvas
                debugOverlay={debugShapeOverlay}
                zoom={commandZoom / 100}
                nail={activeNail}
                layers={activeNail.layers}
                selectedLayerId={selectedLayerId}
                mode={mode}
                brush={brush}
                notice={notice}
                onSelectLayer={(id) => setSelectedLayerId(id || "")}
                onTransformLayer={transformLayer}
                onDrawingStroke={addStroke}
                onStageEraseStroke={stageEraseStroke}
                onEraseStroke={eraseStroke}
              />
            </div>
          </section>
          <FullSetPreview
            blueprint={blueprint}
            activeNailId={activeNail.id}
            onSelectSlot={selectSlot}
            onViewChange={() =>
              dirtyRef.current && void save({ autosave: true, immediate: true })
            }
          />
        </main>

        <aside
          data-testid="nail-stack-right-panel"
          aria-label="Nail Stack"
          style={UI.panel}
        >
          <div style={UI.panelPad}>
            <div style={UI.nailStackHeader}>
              <div style={UI.sectionTitle}>Nail Stack™</div>
              <p style={{ ...UI.smallText, margin: 0 }}>
                Selected nail and layer properties stay here while creation
                tools live on the Creative Wall.
              </p>
            </div>
            <CollapsiblePanel
              id="properties"
              title="Nail Art Controls™"
              open={panelState.properties}
              onToggle={togglePanel}
            >
              <PropertiesPanel
                layer={selectedLayer}
                onPatch={(patch) =>
                  selectedLayer && patchLayer(selectedLayer.id, patch)
                }
                onDuplicate={() => duplicateLayer()}
                onDelete={() => deleteLayer()}
                />
            </CollapsiblePanel>
            <CollapsiblePanel
              id="layers"
              title="Layers"
              open={panelState.layers}
              onToggle={togglePanel}
            >
              <LayersPanel
                layers={activeNail.layers}
                selectedLayerId={selectedLayerId}
                onSelect={setSelectedLayerId}
                onToggleVisible={toggleVisible}
                onToggleLock={toggleLock}
                onMove={moveLayer}
                onDelete={deleteLayer}
                />
            </CollapsiblePanel>
            <div
              data-testid="history-placeholder"
              style={UI.historyPlaceholder}
            >
              <div style={UI.sectionTitle}>History</div>
              <p style={{ ...UI.smallText, margin: 0 }}>
                Placeholder for future action timeline and layer snapshots.
              </p>
            </div>
            <div style={{ marginTop: 12, ...UI.smallText }}>
              Product-use hook: {productSummary.nailCount} nails,{" "}
              {productSummary.visibleDrawingLayerCount} drawing layers,{" "}
              {productSummary.visibleGradientLayerCount} gradients,{" "}
              {productSummary.visiblePatternLayerCount} patterns,{" "}
              {productSummary.visibleFrenchTipLayerCount} French tips.
            </div>
          </div>
        </aside>
      </div>
      <nav
        data-testid="studio-dock"
        aria-label="Studio Dock"
        style={UI.studioDock}
      >
        {STUDIO_DOCK_MODES.map((modeName) => (
          <button
            key={modeName}
            type="button"
            aria-pressed={dockMode === modeName}
            onClick={() => setDockMode(modeName)}
            className="studio-dock-button"
            style={UI.dockButton(dockMode === modeName)}
          >
            {modeName}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default forwardRef(DesignStudio);
