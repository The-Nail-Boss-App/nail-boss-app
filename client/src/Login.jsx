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
      <div style={{ ...S.centered, alignItems: "flex-start", paddingTop: "clamp(10px, 3.5vh, 34px)", paddingBottom: 10 }}>
        <div style={{ ...S.card(420), padding: "16px 28px 22px" }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
            <LogoMark variant="wordmark" style={{ width: 320 }} />
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 1 }}>
            Welcome back 💅
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 9, lineHeight: 1.24 }}>
            Start with a nail design. Turn that design into money.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 8 }}>
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
                  padding: "10px 13px",
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
              style={{ ...S.btnPrimary, width: "100%", justifyContent: "center", padding: "10px 0", fontSize: 15 }}
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
