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
      return <><circle r="28" fill={color} stroke={stroke} strokeWidth="2"/><path d="M-18 -8 L0 -25 L18 -8 L11 18 L-11 18Z" fill="none" stroke="#8AA8B8" strokeWidth="2"/><circle cx="-9" cy="-11" r="5" fill="#fff" opacity=".85"/></>;
    case "jewel-oval":
      return <><ellipse rx="24" ry="32" fill={color} stroke={stroke} strokeWidth="2"/><ellipse rx="12" ry="19" fill="none" stroke="#8AA8B8" strokeWidth="2"/><circle cx="-7" cy="-13" r="5" fill="#fff" opacity=".85"/></>;
    case "jewel-teardrop":
      return <><path d="M0 -34 C24 -4 26 28 0 31 C-26 28 -24 -4 0 -34Z" fill={color} stroke={stroke} strokeWidth="2.5"/><path d="M0 -21 C9 -3 10 15 0 20" fill="none" stroke="#8AA8B8" strokeWidth="2"/></>;
    case "jewel-square":
      return <><rect x="-25" y="-25" width="50" height="50" rx="6" fill={color} stroke={stroke} strokeWidth="2.5"/><path d="M-25 -25 L0 0 L25 -25 M25 25 L0 0 L-25 25" stroke="#8AA8B8" strokeWidth="2"/></>;
    case "jewel-pearl":
      return <><circle r="26" fill={color} stroke={stroke} strokeWidth="2"/><circle cx="-9" cy="-11" r="7" fill="#fff" opacity=".9"/><path d="M-15 17 C-2 25 16 17 20 1" stroke="#EADFCB" strokeWidth="3" fill="none"/></>;
    case "jewel-cluster":
      return <><circle cx="-16" cy="5" r="17" fill={color} stroke={stroke} strokeWidth="2"/><circle cx="11" cy="8" r="20" fill="#E7F7FF" stroke={stroke} strokeWidth="2"/><circle cx="0" cy="-16" r="15" fill="#fff" stroke={stroke} strokeWidth="2" opacity=".9"/></>;
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
