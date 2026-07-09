// ─────────────────────────────────────────────────────────────────────────────
// Shared design tokens & style helpers
// Import these in every component for a consistent look.
// ─────────────────────────────────────────────────────────────────────────────

export const COLORS = {
  // Brand
  plum:        "#3b1f35",
  plumLight:   "#5a3050",
  blackCherry: "#5b0f2f",
  rose:        "#f04f96",
  roseDim:     "#f5c8e8",
  cream:       "#fffaf7",
  softGold:    "#d8a642",

  // Surfaces
  bg:          "#fffaf7",
  surface:     "#fffaf7",
  border:      "#e8cddd",
  borderFocus: "#3b1f35",

  // Text
  text:        "#1a1018",
  textMuted:   "#7d6674",
  textFaint:   "#b89baa",
  muted:       "#7d6674",

  // Status
  statusSent:             "#6b7280",
  statusViewed:           "#2563eb",
  statusAccepted:         "#16a34a",
  statusChangesRequested: "#d97706",
  statusDeclined:         "#dc2626",
};

export const FONT = "'DM Sans', system-ui, sans-serif";

// Base reset applied once in index.jsx via a <style> tag injection
export const BASE_CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: ${FONT};
    background: ${COLORS.bg};
    color: ${COLORS.text};
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  input, select, textarea, button { font-family: inherit; }
  a { color: inherit; text-decoration: none; }
`;

// ── Reusable inline-style objects ────────────────────────────────────────────

export const S = {
  // Page wrapper
  page: {
    minHeight: "100vh",
    background: COLORS.bg,
    display: "flex",
    flexDirection: "column",
  },

  // Centered card
  card: (maxWidth = 480) => ({
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    padding: "36px 32px",
    width: "100%",
    maxWidth,
    boxShadow: "0 4px 32px rgba(60,20,50,.08)",
  }),

  // Content area (sidebar-less pages)
  centered: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  // Full-width page with sidebar
  appShell: {
    display: "flex",
    minHeight: "100vh",
  },

  // Sidebar
  sidebar: {
    width: 220,
    background: COLORS.plum,
    color: "#f5eef3",
    display: "flex",
    flexDirection: "column",
    padding: "24px 14px",
    gap: 4,
    flexShrink: 0,
    transition: "width .18s ease, padding .18s ease",
  },

  sidebarCollapsed: {
    width: 72,
    padding: "18px 10px",
    overflow: "hidden",
  },

  sidebarExpanded: {
    width: 220,
    padding: "24px 14px",
  },

  // Main content area
  mainContent: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "auto",
    background: COLORS.bg,
  },

  // Topbar
  topbar: {
    padding: "18px 32px",
    borderBottom: `1px solid ${COLORS.border}`,
    background: COLORS.surface,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Primary button
  btnPrimary: {
    background: COLORS.plum,
    color: "#fff",
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  // Secondary button
  btnSecondary: {
    background: COLORS.roseDim,
    color: COLORS.plum,
    border: "none",
    borderRadius: 12,
    padding: "12px 22px",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  // Ghost button
  btnGhost: {
    background: "transparent",
    color: COLORS.textMuted,
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: "10px 18px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    transition: "border-color .15s, color .15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  },

  // Form label
  label: {
    display: "block",
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: ".06em",
    color: COLORS.textMuted,
    marginBottom: 6,
  },

  // Text input / select
  input: {
    width: "100%",
    padding: "10px 13px",
    border: `1.5px solid ${COLORS.border}`,
    borderRadius: 10,
    fontSize: 14,
    color: COLORS.text,
    background: COLORS.surface,
    outline: "none",
    transition: "border-color .15s",
  },

  // Spacing helpers
  gap: (n) => ({ gap: n }),
  mt:  (n) => ({ marginTop: n }),
  mb:  (n) => ({ marginBottom: n }),
  p:   (n) => ({ padding: n }),
};

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_META = {
  Sent:             { bg: "#f3f4f6", color: COLORS.statusSent },
  Viewed:           { bg: "#eff6ff", color: COLORS.statusViewed },
  Accepted:         { bg: "#f0fdf4", color: COLORS.statusAccepted },
  ChangesRequested: { bg: "#fffbeb", color: COLORS.statusChangesRequested },
  Declined:         { bg: "#fef2f2", color: COLORS.statusDeclined },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.Sent;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "3px 10px",
      borderRadius: 9999,
      fontSize: 11,
      fontWeight: 700,
      background: meta.bg,
      color: meta.color,
      letterSpacing: ".03em",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: meta.color, flexShrink: 0,
      }} />
      {status}
    </span>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────────────────────

export function NavItem({ label, icon, active, onClick, collapsed = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: collapsed ? 0 : 9,
        justifyContent: collapsed ? "center" : "flex-start",
        minHeight: 42,
        padding: collapsed ? "9px 8px" : "9px 12px",
        borderRadius: 10,
        fontSize: 13,
        fontWeight: 500,
        color: active ? "#f5c8e8" : "rgba(245,238,243,.65)",
        background: active ? "rgba(245,200,232,.13)" : "transparent",
        border: "none",
        cursor: "pointer",
        width: "100%",
        textAlign: "left",
        transition: "background .15s, color .15s",
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 15, display: "inline-flex", flexShrink: 0 }}>{icon}</span>
      <span style={{
        opacity: collapsed ? 0 : 1,
        width: collapsed ? 0 : "auto",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "opacity .15s ease",
      }}>{label}</span>
    </button>
  );
}

// ── Brand logo mark ───────────────────────────────────────────────────────────

export function LogoMark({ size = 36, variant = "icon", style = {} }) {
  const isWordmark = variant === "wordmark";

  return (
    <img
      src={isWordmark ? "/anitaset-logo-main.png" : "/anitaset-logo-secondary.png"}
      alt="AnitaSet"
      width={isWordmark ? undefined : size}
      height={isWordmark ? undefined : size}
      style={{
        display: "block",
        width: isWordmark ? "min(100%, 320px)" : size,
        height: isWordmark ? "auto" : size,
        maxWidth: "100%",
        objectFit: "contain",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
