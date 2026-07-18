// ─────────────────────────────────────────────────────────────────────────────
// Headquarters.jsx
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { COLORS, S, LogoMark } from "./styles.js";

export default function Headquarters({ techName, onStartLook, onViewProposals }) {
  const openSavedDesigns = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("nailBossOpenSavedDesigns", "1");
    }
    onStartLook();
  };
  const [counts, setCounts] = useState({ designs: "–", proposals: "–" });

  useEffect(() => {
    // Fetch live counts for the stat cards
    Promise.all([
      fetch("/api/designs").then(r => r.json()),
      fetch("/api/proposals").then(r => r.json()),
    ])
      .then(([designs, proposals]) => {
        setCounts({ designs: designs.length, proposals: proposals.length });
      })
      .catch(() => {}); // silently ignore if server isn't up
  }, []);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" :
    hour < 17 ? "Good afternoon" :
                "Good evening";

  return (
    <div style={{ padding: "40px 40px 40px" }}>
      {/* Welcome heading */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: COLORS.plum, marginBottom: 4 }}>
          {greeting}, {techName} 👋
        </h1>
        <p style={{ fontSize: 14, color: COLORS.textMuted }}>
          Design. Price. Sell. Grow.
        </p>
      </div>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40, maxWidth: 500 }}>
        {[
          { label: "Saved Designs",  value: counts.designs,   icon: "✦", onClick: onStartLook, savedDesigns: true, testId: "headquarters-saved-designs" },
          { label: "Total Proposals", value: counts.proposals, icon: "◻", onClick: onViewProposals, testId: "headquarters-total-proposals" },
        ].map(c => (
          <button key={c.label} type="button" onClick={c.savedDesigns ? openSavedDesigns : c.onClick} data-testid={c.testId} style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: "22px 20px",
            textAlign: "left",
            cursor: "pointer",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: COLORS.plum, lineHeight: 1 }}>
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6, fontWeight: 600 }}>
              {c.label}
            </div>
          </button>
        ))}
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        <button
          style={{ ...S.btnPrimary, fontSize: 15, padding: "15px 30px", borderRadius: 14 }}
          onClick={onStartLook}
          data-testid="button-start-look"
        >
          ✦ Start a design
        </button>
        <button
          style={{ ...S.btnSecondary, fontSize: 14, padding: "15px 24px", borderRadius: 14 }}
          onClick={onViewProposals}
          data-testid="button-view-proposals"
        >
          ◻ View proposals
        </button>
      </div>

      {/* Quick tips */}
      <div style={{
        marginTop: 48,
        padding: "20px 24px",
        background: COLORS.roseDim,
        borderRadius: 16,
        maxWidth: 520,
        border: `1px solid ${COLORS.rose}`,
      }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: COLORS.plum, marginBottom: 8 }}>
          Quick workflow
        </p>
        <ol style={{ paddingLeft: 18, color: COLORS.plumLight, fontSize: 13, lineHeight: 2.1 }}>
          <li>Open <strong>Design Studio</strong> → design a look → Save</li>
          <li>Use AnitaSet to turn that design into a priced client proposal</li>
          <li>Open <strong>Proposals</strong> → pick design → enter client + price → Create</li>
          <li>Copy the proposal link and send it to your client</li>
          <li>Watch the status update when they Accept or request changes</li>
        </ol>
      </div>
    </div>
  );
}
