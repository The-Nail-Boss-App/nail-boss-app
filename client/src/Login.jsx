// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx
// Fake login: just enter your name. Stores in state (parent) and proceeds.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { S, COLORS, LogoMark } from "./styles.js";

export default function Login({ onLogin }) {
  const [name,  setName]  = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    onLogin(name.trim());
  }

  return (
    <div style={S.page}>
      <div style={S.centered}>
        <div style={S.card(420)}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{
              background: COLORS.plum,
              borderRadius: 14,
              padding: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <LogoMark size={32} color="#f5c8e8" />
            </div>
            <div>
              <p style={{ fontSize: 18, fontWeight: 800, color: COLORS.plum, lineHeight: 1.1 }}>
                AnitaSet
              </p>
              <p style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                Design. Price. Sell. Grow.
              </p>
            </div>
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>
            Welcome back 💅
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 28, lineHeight: 1.5 }}>
            Start with a nail design. Turn that design into money.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 20 }}>
              <label style={S.label} htmlFor="tech-name">Your name</label>
              <input
                id="tech-name"
                type="text"
                placeholder="e.g. Mia Johnson"
                value={name}
                onChange={e => { setName(e.target.value); setError(""); }}
                autoFocus
                style={{
                  ...S.input,
                  fontSize: 15,
                  padding: "12px 14px",
                  borderColor: error ? COLORS.statusDeclined : COLORS.border,
                }}
                data-testid="input-tech-name"
              />
              {error && (
                <p style={{ color: COLORS.statusDeclined, fontSize: 12, marginTop: 6 }}>
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", padding: "13px 0", fontSize: 15 }}
              data-testid="button-login"
            >
              Enter AnitaSet →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
