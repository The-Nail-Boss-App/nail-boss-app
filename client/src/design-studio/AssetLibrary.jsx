import { useState } from "react";
import { COLORS } from "../styles.js";
import { ASSET_CATEGORIES, STARTER_ASSETS, renderAssetShapes } from "./assets.js";
import { UI } from "./studioStyles.js";

export default function AssetLibrary({ onAddAsset }) {
  const [category, setCategory] = useState("charms");
  const assets = STARTER_ASSETS.filter((asset) => asset.category === category);
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={UI.sectionTitle}>Nail Art</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {ASSET_CATEGORIES.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} style={UI.miniButton(category === item.id)}>{item.label}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {assets.map((asset) => (
          <button key={asset.id} type="button" onClick={() => onAddAsset(asset)} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, background: "#fff", padding: 10, cursor: "pointer", textAlign: "center" }}>
            <svg viewBox="-42 -42 84 84" width="58" height="58" aria-hidden="true">{renderAssetShapes(asset.id, asset.defaultColor)}</svg>
            <div style={{ fontSize: 12, color: COLORS.text, fontWeight: 700 }}>{asset.name}</div>
          </button>
        ))}
      </div>
    </section>
  );
}
