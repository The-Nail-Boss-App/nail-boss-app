import { useState } from "react";
import { COLORS } from "../styles.js";
import { ASSET_CATEGORIES, STARTER_ASSETS, renderAssetShapes } from "./assets.js";
import { UI } from "./studioStyles.js";

export default function AssetLibrary({ onAddAsset, initialCategory = "charms", categories = ASSET_CATEGORIES }) {
  const [category, setCategory] = useState(initialCategory);
  const activeCategory = categories.some((item) => item.id === category)
    ? category
    : categories[0]?.id;
  const assets = STARTER_ASSETS.filter((asset) => asset.category === activeCategory);
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={UI.sectionTitle}>Nail Art</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {categories.map((item) => <button key={item.id} type="button" onClick={() => setCategory(item.id)} style={UI.miniButton(activeCategory === item.id)}>{item.label}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        {assets.map((asset) => (
          <button
            key={asset.id}
            type="button"
            aria-label={`Add ${asset.name}`}
            title={asset.name}
            data-testid="visual-asset-button"
            data-asset-label-visibility="tooltip-only"
            onClick={() => onAddAsset(asset)}
            style={{ border: `1px solid ${COLORS.border}`, borderRadius: 14, background: "#fff", padding: 8, cursor: "pointer", textAlign: "center", minHeight: 76 }}
          >
            <svg viewBox="-42 -42 84 84" width="54" height="54" aria-hidden="true">{renderAssetShapes(asset.id, asset.defaultColor)}</svg>
          </button>
        ))}
      </div>
    </section>
  );
}
