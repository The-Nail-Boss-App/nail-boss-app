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
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const flattenDesignNails = (design) => {
  const source = isObject(design) ? design : {};
  const fullSetData = firstDefined(source.fullSetData, source.fullSet, source.blueprint, source);
  const nails = fullSetData?.nails;
  if (Array.isArray(nails)) return nails;
  if (isObject(nails)) return [...list(nails.left), ...list(nails.right), ...list(nails.leftHand), ...list(nails.rightHand)];
  if (Array.isArray(fullSetData)) return fullSetData;
  return [];
};

const designLayerValues = (design, predicate, mapper) => uniqueList(
  flattenDesignNails(design)
    .flatMap((nail) => list(nail?.layers))
    .filter(predicate)
    .map(mapper),
);

const uniqueList = (items) => [...new Set(list(items).map((item) => String(item || '').trim()).filter(Boolean))];

const safeThemeId = (input) => text(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DEFAULT_THEME.themeId;
const safeColor = (value, fallback) => (/^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value).toLowerCase() : fallback);

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

export function createCustomBlueprintTheme(baseTheme, overrides = {}) {
  const base = normalizeBlueprintTheme(baseTheme);
  return normalizeBlueprintTheme({
    ...base,
    ...overrides,
    themeId: overrides.themeId || `custom-${base.themeId}`,
    themeName: overrides.themeName || `${base.themeName} Custom`,
  });
}

export function getBlueprintContentSignature(blueprint) {
  const normalized = normalizeBlueprint(blueprint);
  return JSON.stringify({
    title: normalized.title,
    creatorSnapshot: normalized.creatorSnapshot,
    designSnapshot: normalized.designSnapshot,
    pricingGuidance: normalized.pricingGuidance,
    materials: normalized.materials,
    tags: normalized.tags,
    difficulty: normalized.difficulty,
    visibility: normalized.visibility,
  });
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

export function normalizeBlueprintLibrary(input) {
  const records = Array.isArray(input) ? input : [];
  return records.map((record) => normalizeBlueprint(record));
}

export function createBlueprintLibraryRecord(blueprint, options = {}) {
  const now = new Date().toISOString();
  return normalizeBlueprint({
    ...clone(blueprint || {}),
    ...options,
    blueprintId: options.blueprintId || `blueprint-${Date.now()}`,
    createdAt: options.createdAt || now,
    updatedAt: options.updatedAt || now,
    theme: normalizeBlueprintTheme(options.theme || blueprint?.theme),
  });
}

export function duplicateBlueprintLibraryRecord(blueprint) {
  const normalized = normalizeBlueprint(blueprint);
  const now = new Date().toISOString();
  return normalizeBlueprint({
    ...clone(normalized),
    blueprintId: `blueprint-${Date.now()}`,
    title: `${normalized.title} Copy`,
    createdAt: now,
    updatedAt: now,
    theme: clone(normalized.theme),
    designSnapshot: clone(normalized.designSnapshot),
    pricingGuidance: clone(normalized.pricingGuidance),
  });
}

export function createBlueprintFromDesign(design, options = {}) {
  const source = isObject(design) ? design : {};
  const fullSetData = firstDefined(source.fullSetData, source.fullSet, source.blueprint, source.nails ? { nails: source.nails } : source);
  const extractedColors = designLayerValues(source, (layer) => layer?.data?.colorHex || layer?.data?.colorA || layer?.data?.colorB, (layer) => layer?.data?.colorHex || layer?.data?.colorA || layer?.data?.colorB);
  const extractedEffects = designLayerValues(source, (layer) => layer?.type && layer.type !== 'base', (layer) => layer?.data?.label || layer?.data?.pattern || layer?.data?.style || layer.type);
  const extractedCharms = designLayerValues(source, (layer) => layer?.type === 'charm', (layer) => layer?.data?.assetId || 'Charm');
  const extractedJewels = designLayerValues(source, (layer) => layer?.type === 'jewel', (layer) => layer?.data?.assetId || 'Jewel');
  const extractedDecals = designLayerValues(source, (layer) => layer?.type === 'decal', (layer) => layer?.data?.assetId || 'Decal');
  const designSnapshot = {
    ...source,
    ...(options.designSnapshot || {}),
    designId: firstDefined(source.id, source.designId),
    designName: firstDefined(source.name, source.designName),
    fullSetData,
    shape: firstDefined(source.shape, options.designSnapshot?.shape),
    length: firstDefined(source.length, options.designSnapshot?.length),
    width: firstDefined(source.width, options.designSnapshot?.width),
    colors: uniqueList(firstDefined(source.colors, options.designSnapshot?.colors, extractedColors)),
    effects: uniqueList(firstDefined(source.effects, options.designSnapshot?.effects, extractedEffects)),
    charms: uniqueList(firstDefined(source.charms, options.designSnapshot?.charms, extractedCharms)),
    jewels: uniqueList(firstDefined(source.jewels, options.designSnapshot?.jewels, extractedJewels)),
    decals: uniqueList(firstDefined(source.decals, options.designSnapshot?.decals, extractedDecals)),
  };

  return normalizeBlueprint({
    ...options,
    title: options.title || source.name || source.designName,
    designId: designSnapshot.designId,
    designName: designSnapshot.designName,
    designSnapshot,
    pricingGuidance: options.pricingGuidance,
    materials: options.materials || { colors: designSnapshot.colors },
    theme: options.theme,
  });
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
