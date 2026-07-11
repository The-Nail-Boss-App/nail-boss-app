export const nailShopPublicCss = `
  .nail-shop-public-shell {
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
    box-sizing: border-box;
    padding: clamp(18px, 4vw, 56px);
    color: #21111d;
    background:
      radial-gradient(circle at 12% 10%, rgba(240, 79, 150, 0.18), transparent 26%),
      radial-gradient(circle at 86% 4%, rgba(216, 166, 66, 0.18), transparent 24%),
      linear-gradient(135deg, #fffaf7 0%, #f8edf2 45%, #efe0e8 100%);
    font-family: "DM Sans", "Inter", system-ui, sans-serif;
  }

  .nail-shop-public-shell * { box-sizing: border-box; }

  .nsp-frame {
    width: min(1180px, 100%);
    margin: 0 auto;
    display: grid;
    gap: clamp(18px, 3vw, 30px);
  }

  .nsp-kicker {
    color: #d8a642;
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .nsp-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: minmax(220px, 0.82fr) minmax(0, 1.18fr);
    gap: clamp(20px, 4vw, 44px);
    align-items: center;
    border: 1px solid rgba(216, 166, 66, 0.32);
    border-radius: 34px;
    padding: clamp(22px, 5vw, 52px);
    background:
      linear-gradient(145deg, rgba(59, 31, 53, 0.96), rgba(91, 15, 47, 0.93)),
      linear-gradient(45deg, rgba(255, 250, 247, 0.16), rgba(216, 166, 66, 0.12));
    box-shadow: 0 28px 80px rgba(59, 31, 53, 0.22);
    color: #fffaf7;
  }

  .nsp-hero::after {
    content: "";
    position: absolute;
    inset: 14px;
    pointer-events: none;
    border: 1px solid rgba(255, 250, 247, 0.14);
    border-radius: 26px;
  }

  .nsp-signature-placeholder {
    min-height: clamp(240px, 32vw, 390px);
    border-radius: 999px 999px 34px 34px;
    border: 1px solid rgba(216, 166, 66, 0.45);
    background:
      radial-gradient(circle at 45% 18%, rgba(255, 250, 247, 0.42), transparent 15%),
      linear-gradient(160deg, rgba(255, 250, 247, 0.24), rgba(240, 79, 150, 0.18) 46%, rgba(26, 16, 24, 0.3)),
      repeating-linear-gradient(135deg, rgba(255,255,255,.09) 0 2px, transparent 2px 13px);
    box-shadow: inset 0 0 34px rgba(255, 250, 247, 0.18), 0 24px 58px rgba(26, 16, 24, 0.34);
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 28px;
    text-align: center;
  }

  .nsp-signature-placeholder span {
    max-width: 180px;
    color: rgba(255, 250, 247, 0.76);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .nsp-hero-copy { position: relative; z-index: 1; min-width: 0; }

  .nsp-title {
    margin: 10px 0 12px;
    font-family: Georgia, "Times New Roman", serif;
    font-size: clamp(2.4rem, 7vw, 5.9rem);
    line-height: 0.92;
    letter-spacing: -0.055em;
    color: #fffaf7;
  }

  .nsp-tagline {
    max-width: 680px;
    color: rgba(255, 250, 247, 0.78);
    font-size: clamp(1rem, 2vw, 1.22rem);
    line-height: 1.65;
  }

  .nsp-location { margin-top: 16px; color: #f5c8e8; font-weight: 800; }

  .nsp-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 28px; }

  .nsp-button {
    border: 1px solid rgba(216, 166, 66, 0.62);
    border-radius: 999px;
    padding: 13px 20px;
    min-height: 48px;
    background: linear-gradient(135deg, #fffaf7, #f3d8e6);
    color: #3b1f35;
    font-weight: 900;
    box-shadow: 0 16px 32px rgba(26, 16, 24, 0.22);
  }

  .nsp-button.secondary { background: rgba(255, 250, 247, 0.1); color: #fffaf7; }

  .nsp-card {
    border: 1px solid rgba(232, 205, 221, 0.9);
    border-radius: 30px;
    padding: clamp(18px, 3vw, 30px);
    background: rgba(255, 250, 247, 0.82);
    box-shadow: 0 22px 54px rgba(59, 31, 53, 0.11);
    backdrop-filter: blur(18px);
  }

  .nsp-section-title {
    margin: 5px 0 20px;
    font-family: Georgia, "Times New Roman", serif;
    color: #3b1f35;
    font-size: clamp(1.8rem, 4vw, 3.1rem);
    letter-spacing: -0.04em;
  }

  .nsp-display-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }

  .nsp-display-card {
    min-width: 0;
    border-radius: 24px;
    padding: 14px;
    border: 1px solid rgba(216, 166, 66, 0.28);
    background: linear-gradient(180deg, #fffaf7, #f8edf2);
    box-shadow: 0 14px 32px rgba(59, 31, 53, 0.1);
  }

  .nsp-visual-placeholder {
    min-height: 156px;
    border-radius: 20px;
    background:
      radial-gradient(circle at 30% 24%, rgba(216, 166, 66, 0.28), transparent 18%),
      linear-gradient(145deg, rgba(91, 15, 47, 0.9), rgba(59, 31, 53, 0.82));
  }

  .nsp-design-name { margin: 14px 0 10px; color: #3b1f35; font-weight: 900; }

  .nsp-disabled-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .nsp-disabled-actions button {
    border: 1px solid #e8cddd;
    border-radius: 999px;
    padding: 8px 10px;
    color: #7d6674;
    background: #fffaf7;
  }

  .nsp-tabs { display: flex; flex-wrap: wrap; gap: 10px; }
  .nsp-tab {
    border: 1px solid rgba(91, 15, 47, 0.16);
    border-radius: 999px;
    padding: 11px 16px;
    background: rgba(255, 250, 247, 0.82);
    color: #5b0f2f;
    font-weight: 900;
  }

  .nsp-empty { color: #7d6674; font-size: 1rem; line-height: 1.7; }

  @media (max-width: 860px) {
    .nsp-hero { grid-template-columns: 1fr; }
    .nsp-display-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 560px) {
    .nail-shop-public-shell { padding: 14px; }
    .nsp-hero, .nsp-card { border-radius: 24px; }
    .nsp-display-grid { grid-template-columns: 1fr; }
    .nsp-actions, .nsp-tabs { flex-direction: column; }
    .nsp-button, .nsp-tab { width: 100%; }
  }
`;
