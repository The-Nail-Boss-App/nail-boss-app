export const ASSET_CATEGORIES = [
  { id: "charms", label: "Charms" },
  { id: "jewels", label: "Jewels" },
  { id: "decals", label: "Decals" },
];

export const STARTER_ASSETS = [
  { id: "charm-bow", category: "charms", name: "Bow", defaultColor: "#F5C8E8" },
  { id: "charm-heart", category: "charms", name: "Heart", defaultColor: "#EF5DA8" },
  { id: "charm-star", category: "charms", name: "Star", defaultColor: "#FFD166" },
  { id: "charm-flower", category: "charms", name: "Flower", defaultColor: "#F5A3C7" },
  { id: "charm-butterfly", category: "charms", name: "Butterfly", defaultColor: "#CDB4DB" },
  { id: "charm-moon", category: "charms", name: "Moon", defaultColor: "#FDF2C2" },
  { id: "charm-crown", category: "charms", name: "Crown", defaultColor: "#E7C46A" },
  { id: "charm-chain", category: "charms", name: "Chain link", defaultColor: "#D9C8A9" },
  { id: "jewel-round", category: "jewels", name: "Round rhinestone", defaultColor: "#DDF7FF" },
  { id: "jewel-oval", category: "jewels", name: "Oval rhinestone", defaultColor: "#E7F0FF" },
  { id: "jewel-teardrop", category: "jewels", name: "Teardrop rhinestone", defaultColor: "#E8FBFF" },
  { id: "jewel-square", category: "jewels", name: "Square gem", defaultColor: "#D8E2FF" },
  { id: "jewel-pearl", category: "jewels", name: "Pearl", defaultColor: "#FFF8EA" },
  { id: "jewel-cluster", category: "jewels", name: "Crystal cluster", defaultColor: "#EFFBFF" },
  { id: "decal-smiley", category: "decals", name: "Smiley face", defaultColor: "#FFD166" },
  { id: "decal-flame", category: "decals", name: "Flame", defaultColor: "#FF6B35" },
  { id: "decal-lightning", category: "decals", name: "Lightning bolt", defaultColor: "#FFD23F" },
  { id: "decal-lips", category: "decals", name: "Lips", defaultColor: "#E84A7F" },
  { id: "decal-checker", category: "decals", name: "Checker accent", defaultColor: "#3B1F35" },
  { id: "decal-swirl", category: "decals", name: "Abstract swirl", defaultColor: "#FFFFFF" },
  { id: "decal-tiny-flower", category: "decals", name: "Tiny flower", defaultColor: "#F6A6C1" },
  { id: "decal-sparkle", category: "decals", name: "Sparkle", defaultColor: "#FFFFFF" },
];

function GemSparkle({ x = 0, y = 0, size = 1, opacity = 0.95 }) {
  return <g data-realism-layer="jewel-white-sparkle-reflection" transform={`translate(${x} ${y}) scale(${size})`} opacity={opacity} pointerEvents="none">
    <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6Z" fill="#fff"/>
    <circle r="1.3" fill="#fff"/>
  </g>;
}

function RoundFacetedGem({ color = "#DDF7FF", oval = false }) {
  const scale = oval ? "scale(.86 1.12)" : undefined;
  return <g data-asset-renderer="shared-faceted-jewel-renderer" data-jewel-kind={oval ? "oval-faceted-rhinestone" : "round-domed-faceted-rhinestone"} transform={scale}>
    <circle data-realism-layer="jewel-outer-cut-shape" r="29" fill={color} stroke="#f9feff" strokeWidth="2.6"/>
    <circle data-realism-layer="jewel-rim-edge-highlight" r="28" fill="none" stroke="#ffffff" strokeWidth="3" opacity=".72"/>
    <circle data-realism-layer="jewel-inner-glow-color-tint" r="23" fill={color} opacity=".62"/>
    <path data-realism-layer="round-gem-dome-facet-highlight-marker" d="M0 -27 L13 -13 L26 0 L12 6 L0 28 L-11 6 L-26 0 L-13 -13Z" fill="#ffffff" opacity=".22"/>
    <path data-realism-layer="jewel-lowlight-shadow-facets" d="M26 0 L12 6 L0 28 L18 18 Z M-26 0 L-11 6 L0 28 L-19 15 Z" fill="#1f3146" opacity=".24"/>
    <path data-realism-layer="jewel-directional-highlight-facet" d="M-21 -6 L-9 -21 L4 -25 L-2 -4 L-15 7Z" fill="#fff" opacity=".48"/>
    <g data-realism-layer="jewel-inner-facets" fill="none" stroke="#5c7f9c" strokeWidth="1.35" opacity=".62">
      <path d="M0 -27 L0 28 M-26 0 L26 0 M-13 -13 L12 6 M13 -13 L-11 6"/>
      <circle r="13"/>
    </g>
    <ellipse data-realism-layer="jewel-glass-refraction-layer" cx="-7" cy="-10" rx="12" ry="7" fill="#fff" opacity=".26" transform="rotate(-24 -7 -10)"/>
    <GemSparkle x="-12" y="-15" size=".82"/>
    <GemSparkle x="12" y="8" size=".44" opacity=".68"/>
  </g>;
}

function SquareFacetedGem({ color = "#D8E2FF" }) {
  return <g data-asset-renderer="shared-faceted-jewel-renderer" data-jewel-kind="square-cut-crystal-rhinestone">
    <rect data-realism-layer="jewel-outer-cut-shape" x="-28" y="-28" width="56" height="56" rx="7" fill={color} stroke="#f9feff" strokeWidth="2.6"/>
    <rect data-realism-layer="jewel-rim-edge-highlight" x="-25" y="-25" width="50" height="50" rx="5" fill="none" stroke="#fff" strokeWidth="2.5" opacity=".75"/>
    <path data-realism-layer="square-gem-facet-highlight-marker" d="M-28 -28 L0 -16 L28 -28 L16 0 L28 28 L0 16 L-28 28 L-16 0Z" fill="#fff" opacity=".2"/>
    <path data-realism-layer="square-gem-lowlight-marker" d="M16 0 L28 28 L0 16 L0 0Z M-16 0 L-28 28 L0 16 L0 0Z" fill="#1f3146" opacity=".25"/>
    <path data-realism-layer="jewel-directional-highlight-facet" d="M-22 -23 L-3 -15 L-15 2 L-27 -1Z" fill="#fff" opacity=".5"/>
    <rect data-realism-layer="jewel-inner-glow-color-tint" x="-15" y="-15" width="30" height="30" rx="4" fill={color} opacity=".58"/>
    <g data-realism-layer="jewel-inner-facets" fill="none" stroke="#5c7198" strokeWidth="1.45" opacity=".66">
      <path d="M-28 -28 L0 0 L28 -28 M28 28 L0 0 L-28 28 M0 -28 L0 28 M-28 0 L28 0"/>
      <rect x="-15" y="-15" width="30" height="30" rx="3"/>
    </g>
    <path data-realism-layer="jewel-glass-refraction-layer" d="M-12 -18 C-1 -24 12 -17 18 -6 C6 -10 -5 -7 -18 2Z" fill="#fff" opacity=".26"/>
    <GemSparkle x="-14" y="-16" size=".75"/>
    <GemSparkle x="14" y="13" size=".42" opacity=".66"/>
  </g>;
}

function TeardropFacetedGem({ color = "#E8FBFF" }) {
  return <g data-asset-renderer="shared-faceted-jewel-renderer" data-jewel-kind="teardrop-cut-crystal">
    <path data-realism-layer="jewel-outer-cut-shape" d="M0 -35 C25 -6 27 28 0 32 C-27 28 -25 -6 0 -35Z" fill={color} stroke="#f9feff" strokeWidth="2.6"/>
    <path data-realism-layer="jewel-rim-edge-highlight" d="M0 -30 C20 -5 21 23 0 27 C-21 23 -20 -5 0 -30Z" fill="none" stroke="#fff" strokeWidth="2.2" opacity=".68"/>
    <path data-realism-layer="jewel-inner-facets" d="M0 -30 L0 27 M0 -30 L13 2 L0 27 L-13 2Z M-20 4 L0 8 L20 4" fill="none" stroke="#5c7f9c" strokeWidth="1.5" opacity=".62"/>
    <path data-realism-layer="jewel-directional-highlight-facet" d="M-5 -24 C5 -10 8 2 3 13 C-7 3 -12 -9 -5 -24Z" fill="#fff" opacity=".4"/>
    <path data-realism-layer="jewel-lowlight-shadow-facets" d="M12 3 C18 15 11 26 0 27 L3 13Z" fill="#1f3146" opacity=".22"/>
    <GemSparkle x="-7" y="-12" size=".7"/>
  </g>;
}

export function findAsset(assetId) {
  return STARTER_ASSETS.find((asset) => asset.id === assetId);
}

export function renderAssetShapes(assetId, color = "#FFFFFF") {
  const stroke = "#3B1F35";
  const pale = "#FFFFFF";
  switch (assetId) {
    case "charm-bow":
      return <><path d="M-4 0 C-22 -16 -34 -10 -34 3 C-34 15 -21 18 -4 4Z" fill={color} stroke={stroke} strokeWidth="3"/><path d="M4 0 C22 -16 34 -10 34 3 C34 15 21 18 4 4Z" fill={color} stroke={stroke} strokeWidth="3"/><circle r="7" fill={pale} stroke={stroke} strokeWidth="3"/></>;
    case "charm-heart":
      return <path d="M0 28 C-30 6 -34 -12 -19 -22 C-8 -29 0 -18 0 -18 C0 -18 8 -29 19 -22 C34 -12 30 6 0 28Z" fill={color} stroke={stroke} strokeWidth="3"/>;
    case "charm-star":
      return <path d="M0 -32 L8 -9 L32 -9 L13 5 L20 29 L0 14 L-20 29 L-13 5 L-32 -9 L-8 -9Z" fill={color} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/>;
    case "charm-flower":
      return <><g fill={color} stroke={stroke} strokeWidth="2.5"><ellipse rx="10" ry="20" transform="rotate(0) translate(0 -17)"/><ellipse rx="10" ry="20" transform="rotate(72) translate(0 -17)"/><ellipse rx="10" ry="20" transform="rotate(144) translate(0 -17)"/><ellipse rx="10" ry="20" transform="rotate(216) translate(0 -17)"/><ellipse rx="10" ry="20" transform="rotate(288) translate(0 -17)"/></g><circle r="8" fill="#FFE8A3" stroke={stroke} strokeWidth="2"/></>;
    case "charm-butterfly":
      return <><path d="M-3 -2 C-28 -28 -42 -2 -19 12 C-35 30 -4 34 -2 7Z" fill={color} stroke={stroke} strokeWidth="2.5"/><path d="M3 -2 C28 -28 42 -2 19 12 C35 30 4 34 2 7Z" fill={color} stroke={stroke} strokeWidth="2.5"/><path d="M0 -18 L0 22" stroke={stroke} strokeWidth="4" strokeLinecap="round"/></>;
    case "charm-moon":
      return <path d="M20 -30 C-14 -20 -16 20 18 31 C-5 36 -31 17 -31 -7 C-31 -31 -4 -43 20 -30Z" fill={color} stroke={stroke} strokeWidth="3"/>;
    case "charm-crown":
      return <path d="M-31 20 L-25 -17 L-8 3 L0 -23 L8 3 L25 -17 L31 20 Z" fill={color} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/>;
    case "charm-chain":
      return <><rect x="-38" y="-12" width="36" height="24" rx="12" fill="none" stroke={color} strokeWidth="8"/><rect x="2" y="-12" width="36" height="24" rx="12" fill="none" stroke={color} strokeWidth="8"/><path d="M-5 0 L5 0" stroke={stroke} strokeWidth="3"/></>;
    case "jewel-round":
      return <RoundFacetedGem color={color}/>;
    case "jewel-oval":
      return <RoundFacetedGem color={color} oval/>;
    case "jewel-teardrop":
      return <TeardropFacetedGem color={color}/>;
    case "jewel-square":
      return <SquareFacetedGem color={color}/>;
    case "jewel-pearl":
      return <><circle r="26" fill={color} stroke={stroke} strokeWidth="2"/><circle cx="-9" cy="-11" r="7" fill="#fff" opacity=".9"/><path d="M-15 17 C-2 25 16 17 20 1" stroke="#EADFCB" strokeWidth="3" fill="none"/></>;
    case "jewel-cluster":
      return <g data-asset-renderer="shared-faceted-jewel-renderer" data-jewel-kind="crystal-cluster-faceted"><g transform="translate(-16 5) scale(.58)"><RoundFacetedGem color={color}/></g><g transform="translate(11 8) scale(.68)"><RoundFacetedGem color="#E7F7FF"/></g><g transform="translate(0 -16) scale(.52)"><RoundFacetedGem color="#F8FEFF"/></g></g>;
    case "decal-smiley":
      return <><circle r="30" fill={color} stroke={stroke} strokeWidth="3"/><circle cx="-10" cy="-8" r="3" fill={stroke}/><circle cx="10" cy="-8" r="3" fill={stroke}/><path d="M-14 8 Q0 20 14 8" fill="none" stroke={stroke} strokeWidth="4" strokeLinecap="round"/></>;
    case "decal-flame":
      return <path d="M0 31 C-23 18 -21 -4 -9 -18 C-8 -5 2 -4 3 -28 C23 -10 24 18 0 31Z" fill={color} stroke={stroke} strokeWidth="3"/>;
    case "decal-lightning":
      return <path d="M6 -34 L-17 2 L1 2 L-7 34 L23 -8 L5 -8Z" fill={color} stroke={stroke} strokeWidth="3" strokeLinejoin="round"/>;
    case "decal-lips":
      return <><path d="M-36 0 C-19 -22 -8 -12 0 -3 C8 -12 19 -22 36 0 C19 17 -19 17 -36 0Z" fill={color} stroke={stroke} strokeWidth="2.5"/><path d="M-35 1 C-10 7 10 7 35 1" stroke={stroke} strokeWidth="3" fill="none"/></>;
    case "decal-checker":
      return <g stroke={stroke} strokeWidth="1.5"><rect x="-30" y="-30" width="60" height="60" rx="5" fill="#fff"/><rect x="-30" y="-30" width="20" height="20" fill={color}/><rect x="10" y="-30" width="20" height="20" fill={color}/><rect x="-10" y="-10" width="20" height="20" fill={color}/><rect x="-30" y="10" width="20" height="20" fill={color}/><rect x="10" y="10" width="20" height="20" fill={color}/></g>;
    case "decal-swirl":
      return <path d="M-28 10 C-11 -28 31 -21 20 4 C11 25 -21 18 -9 -1 C-2 -12 12 -8 9 3" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"/>;
    case "decal-tiny-flower":
      return <><g fill={color} stroke={stroke} strokeWidth="2"><circle cx="0" cy="-18" r="10"/><circle cx="17" cy="-5" r="10"/><circle cx="10" cy="16" r="10"/><circle cx="-10" cy="16" r="10"/><circle cx="-17" cy="-5" r="10"/></g><circle r="7" fill="#FFE8A3"/></>;
    case "decal-sparkle":
    default:
      return <><path d="M0 -34 C5 -10 10 -5 34 0 C10 5 5 10 0 34 C-5 10 -10 5 -34 0 C-10 -5 -5 -10 0 -34Z" fill={color} stroke={stroke} strokeWidth="2"/><path d="M27 -31 L27 -15 M19 -23 L35 -23" stroke={color} strokeWidth="5" strokeLinecap="round"/></>;
  }
}
