const BLUEPRINT_VERSION = 1;

const DEFAULT_THEME = {
  themeId: 'classic',
  themeName: 'Classic',
  primaryColor: '#7b2d5f',
  accentColor: '#f3a6c8',
  backgroundColor: '#fff7fb',
  textColor: '#2f1b2b',
  typographyStyle: 'polished serif',
  accentStyle: 'soft frame',
  season: 'evergreen',
  collectionLabel: 'Signature',
};

const DEFAULT_BLUEPRINT_THEMES = [
  DEFAULT_THEME,
  { themeId: 'luxury', themeName: 'Luxury', primaryColor: '#211827', accentColor: '#d4af37', backgroundColor: '#fbf7ef', textColor: '#1f1722', typographyStyle: 'elevated serif', accentStyle: 'gold foil', season: 'evergreen', collectionLabel: 'Atelier' },
  { themeId: 'editorial', themeName: 'Editorial', primaryColor: '#111827', accentColor: '#ef4444', backgroundColor: '#f8fafc', textColor: '#111827', typographyStyle: 'bold magazine', accentStyle: 'graphic blocks', season: 'evergreen', collectionLabel: 'Runway' },
  { themeId: 'bridal', themeName: 'Bridal', primaryColor: '#9f7aea', accentColor: '#f8d7da', backgroundColor: '#fffafa', textColor: '#4a2f45', typographyStyle: 'romantic script', accentStyle: 'pearl glow', season: 'wedding', collectionLabel: 'Bridal Suite' },
  { themeId: 'summer', themeName: 'Summer', primaryColor: '#f97316', accentColor: '#22d3ee', backgroundColor: '#fff7ed', textColor: '#431407', typographyStyle: 'sunny rounded', accentStyle: 'citrus pop', season: 'summer', collectionLabel: 'Poolside' },
  { themeId: 'holiday', themeName: 'Holiday', primaryColor: '#166534', accentColor: '#dc2626', backgroundColor: '#f7fee7', textColor: '#14532d', typographyStyle: 'festive classic', accentStyle: 'sparkle garland', season: 'holiday', collectionLabel: 'Holiday Drop' },
  { themeId: 'goth', themeName: 'Goth', primaryColor: '#111111', accentColor: '#7f1d1d', backgroundColor: '#1f1b24', textColor: '#f8fafc', typographyStyle: 'dark dramatic', accentStyle: 'velvet edge', season: 'fall', collectionLabel: 'After Dark' },
  { themeId: 'mermaid', themeName: 'Mermaid', primaryColor: '#0e7490', accentColor: '#a78bfa', backgroundColor: '#ecfeff', textColor: '#164e63', typographyStyle: 'fluid shimmer', accentStyle: 'iridescent scales', season: 'summer', collectionLabel: 'Siren Set' },
  { themeId: 'cheetah', themeName: 'Cheetah', primaryColor: '#92400e', accentColor: '#f59e0b', backgroundColor: '#fffbeb', textColor: '#451a03', typographyStyle: 'wild bold', accentStyle: 'animal print', season: 'evergreen', collectionLabel: 'Wild Print' },
  { themeId: 'minimal', themeName: 'Minimal', primaryColor: '#334155', accentColor: '#cbd5e1', backgroundColor: '#ffffff', textColor: '#0f172a', typographyStyle: 'clean sans', accentStyle: 'thin line', season: 'evergreen', collectionLabel: 'Essentials' },
];

const isObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const text = (value, fallback = '') => (typeof value === 'string' && value.trim() ? value.trim() : fallback);
const list = (value) => (Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : []);
const numberOrNull = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const timestamp = (value) => (Number.isNaN(Date.parse(value)) ? new Date().toISOString() : new Date(value).toISOString());
const clone = (value) => JSON.parse(JSON.stringify(value));

const safeThemeId = (input) => text(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DEFAULT_THEME.themeId;
const safeColor = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback);

export function getDefaultBlueprintThemes() {
  return clone(DEFAULT_BLUEPRINT_THEMES);
}

export function normalizeBlueprintTheme(input) {
  const source = isObject(input) ? input : {};
  const matchedDefault = DEFAULT_BLUEPRINT_THEMES.find((theme) => theme.themeId === source.themeId || theme.themeName === source.themeName) || DEFAULT_THEME;
  return {
    themeId: safeThemeId(source.themeId || matchedDefault.themeId),
    themeName: text(source.themeName, matchedDefault.themeName),
    primaryColor: safeColor(source.primaryColor, matchedDefault.primaryColor),
    accentColor: safeColor(source.accentColor, matchedDefault.accentColor),
    backgroundColor: safeColor(source.backgroundColor, matchedDefault.backgroundColor),
    textColor: safeColor(source.textColor, matchedDefault.textColor),
    typographyStyle: text(source.typographyStyle, matchedDefault.typographyStyle),
    accentStyle: text(source.accentStyle, matchedDefault.accentStyle),
    season: text(source.season, matchedDefault.season),
    collectionLabel: text(source.collectionLabel, matchedDefault.collectionLabel),
  };
}

export function normalizeBlueprint(input) {
  const source = isObject(input) ? input : {};
  const design = isObject(source.designSnapshot) ? source.designSnapshot : {};
  const pricing = isObject(source.pricingGuidance) ? source.pricingGuidance : {};
  const creator = isObject(source.creatorSnapshot) ? source.creatorSnapshot : {};
  const materials = isObject(source.materials) ? source.materials : {};
  const stats = isObject(source.engagementStats) ? source.engagementStats : {};
  return {
    blueprintId: text(source.blueprintId, `blueprint-${Date.now()}`),
    blueprintVersion: Number.isFinite(Number(source.blueprintVersion)) ? Number(source.blueprintVersion) : BLUEPRINT_VERSION,
    title: text(source.title, text(design.designName, 'Untitled Blueprint')),
    creatorSnapshot: { creatorName: text(creator.creatorName, 'Unknown creator'), shopName: text(creator.shopName), contact: text(creator.contact), location: text(creator.location) },
    designSnapshot: {
      designId: text(design.designId, text(source.designId, `design-${Date.now()}`)),
      designName: text(design.designName, text(source.designName, 'Untitled design')),
      fullSetData: design.fullSetData || design.nails || source.fullSetData || { nails: [] },
      shape: text(design.shape, 'Mixed'), length: text(design.length, 'Custom'), width: text(design.width, 'Custom'),
      colors: list(design.colors), effects: list(design.effects), charms: list(design.charms), jewels: list(design.jewels), decals: list(design.decals),
    },
    pricingGuidance: { suggestedPrice: numberOrNull(pricing.suggestedPrice), suggestedDeposit: numberOrNull(pricing.suggestedDeposit), estimatedTime: text(pricing.estimatedTime, 'Not estimated'), breakdown: isObject(pricing.breakdown) ? pricing.breakdown : {} },
    materials: { colors: list(materials.colors), products: list(materials.products), vendorReferences: list(materials.vendorReferences) },
    tags: list(source.tags), difficulty: text(source.difficulty, 'Not rated'), collectionName: text(source.collectionName),
    theme: normalizeBlueprintTheme(source.theme),
    visibility: ['private', 'portfolio', 'gallery-ready'].includes(source.visibility) ? source.visibility : 'private',
    engagementStats: { views: Number(stats.views) || 0, saves: Number(stats.saves) || 0, likes: Number(stats.likes) || 0, remixes: Number(stats.remixes) || 0 },
    createdAt: timestamp(source.createdAt), updatedAt: timestamp(source.updatedAt),
  };
}

export function createBlueprintFromDesign(design, options = {}) {
  const source = isObject(design) ? design : {};
  return normalizeBlueprint({ ...options, title: options.title || source.name || source.designName, designSnapshot: { ...source, ...(options.designSnapshot || {}), designId: source.id || source.designId, designName: source.name || source.designName, fullSetData: source.fullSetData || source.nails || source }, pricingGuidance: options.pricingGuidance, materials: options.materials, theme: options.theme });
}

export function buildBlueprintPreviewSummary(blueprint) {
  const normalized = normalizeBlueprint(blueprint);
  return {
    title: normalized.title,
    creatorLine: [normalized.creatorSnapshot.creatorName, normalized.creatorSnapshot.shopName].filter(Boolean).join(' • ') || 'Creator not set',
    designLine: `${normalized.designSnapshot.designName} • ${normalized.designSnapshot.shape} • ${normalized.designSnapshot.length}`,
    priceLine: normalized.pricingGuidance.suggestedPrice === null ? 'Pricing guidance not set' : `$${normalized.pricingGuidance.suggestedPrice}`,
    themeLine: `${normalized.theme.themeName} theme (${normalized.theme.collectionLabel})`,
    tagLine: normalized.tags.length ? normalized.tags.join(', ') : 'No tags yet',
    visibilityLine: normalized.visibility,
  };
}
