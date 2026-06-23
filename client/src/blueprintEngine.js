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

export const DESIGN_METADATA_FIELD_PATHS = {
  shape: ['design.shape', 'design.nails[].shape', 'design.fullSetData.nails[].shape', 'design.blueprint.nails[].shape'],
  length: ['design.length', 'design.nails[].length', 'design.fullSetData.nails[].length', 'design.blueprint.nails[].length'],
  width: ['design.width', 'design.nails[].width', 'design.fullSetData.nails[].width', 'design.blueprint.nails[].width'],
  baseColor: ['design.baseColorHex', 'design.nails[].baseColorHex', 'design.nails[].layers[type=base].data.colorHex'],
  secondaryColors: ['layer.data.effectColorHex', 'layer.data.patternColorHex', 'layer.data.patternSecondaryColorHex', 'layer.data.secondaryColorHex', 'layer.data.gradientStops[].color'],
  gradients: ['design.nails[].layers[type=gradient].data', 'layer.data.colorA', 'layer.data.colorB', 'layer.data.gradientStops[]', 'layer.data.direction'],
  polishEffects: ['design.effect', 'design.polishType', 'design.nails[].layers[type=base].data.effect', 'layer.data.polishType', 'layer.data.topCoat'],
  frenchTips: ['design.nails[].layers[type=frenchTip].data.style', 'layer.data.preset', 'layer.data.tipColorHex'],
  patterns: ['design.nails[].layers[type=pattern].data.pattern', 'layer.data.patternColorHex', 'layer.data.patternSecondaryColorHex'],
  charms: ['design.nails[].layers[type=charm].data.assetId'],
  jewels: ['design.nails[].layers[type=jewel].data.assetId'],
  decals: ['design.nails[].layers[type=decal].data.assetId'],
  layers: ['design.nails[].layers[]', 'layer.type', 'layer.visible', 'layer.data'],
};

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
      baseColor: text(design.baseColor), secondaryColors: list(design.secondaryColors), palette: list(design.palette),
      polishTypes: list(design.polishTypes), gradients: list(design.gradients), chrome: Boolean(design.chrome), catEye: Boolean(design.catEye), marble: Boolean(design.marble), frenchTips: list(design.frenchTips), patterns: list(design.patterns),
      charmCount: Number(design.charmCount) || 0, jewelCount: Number(design.jewelCount) || 0, decalCount: Number(design.decalCount) || 0, layerCount: Number(design.layerCount) || 0, artLayerCount: Number(design.artLayerCount) || 0,
      artLevel: text(design.artLevel, 'Minimal'), artSummary: text(design.artSummary, 'No Effects'), effectsUsed: list(design.effectsUsed),
    },
    pricingGuidance: { suggestedPrice: numberOrNull(pricing.suggestedPrice), suggestedDeposit: numberOrNull(pricing.suggestedDeposit), estimatedTime: text(pricing.estimatedTime, 'Not estimated'), breakdown: isObject(pricing.breakdown) ? pricing.breakdown : {} },
    materials: { colors: list(materials.colors), effects: list(materials.effects), products: list(materials.products), vendorReferences: list(materials.vendorReferences) },
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

const collectLayerColors = (layer) => {
  const data = isObject(layer?.data) ? layer.data : {};
  return uniqueList([
    data.colorHex,
    data.effectColorHex,
    data.colorA,
    data.colorB,
    data.patternColorHex,
    data.patternSecondaryColorHex,
    data.secondaryColorHex,
    ...list(data.gradientStops).map((stop) => stop?.color || stop?.colorHex),
    ...list(data.strokes).map((stroke) => stroke?.colorHex),
  ]).filter((color) => /^#[0-9a-f]{6}$/i.test(color));
};

const collectDesignMetadata = (design) => {
  const source = isObject(design) ? design : {};
  const nails = flattenDesignNails(source);
  const layers = nails.flatMap((nail) => list(nail?.layers).filter((layer) => layer?.visible !== false));
  const baseLayers = layers.filter((layer) => layer?.type === 'base');
  const typeCount = (type) => layers.filter((layer) => layer?.type === type).length;
  const layerLabels = (type, fallback) => uniqueList(layers
    .filter((layer) => layer?.type === type)
    .map((layer) => layer?.data?.label || layer?.data?.assetId || layer?.data?.pattern || layer?.data?.style || layer?.data?.preset || fallback));
  const shapes = uniqueList([source.shape, ...nails.map((nail) => nail?.shape)]);
  const lengths = uniqueList([source.length, ...nails.map((nail) => nail?.length)]);
  const widths = uniqueList([source.width, ...nails.map((nail) => nail?.width)]);
  const baseColors = uniqueList([source.baseColorHex, ...nails.map((nail) => nail?.baseColorHex), ...baseLayers.flatMap(collectLayerColors)]);
  const palette = uniqueList([...baseColors, ...layers.flatMap(collectLayerColors), ...list(source.colors)]);
  const gradientLabels = uniqueList(layers.filter((layer) => layer?.type === 'gradient').map((layer) => layer?.data?.direction ? `Gradient ${layer.data.direction}` : 'Gradient'));
  const polishTypes = uniqueList([source.polishType, ...baseLayers.map((layer) => layer?.data?.polishType)]);
  const baseEffects = uniqueList([source.effect, ...baseLayers.map((layer) => layer?.data?.effect)].filter((effect) => effect && effect !== 'Solid'));
  const effectTypes = uniqueList([
    ...baseEffects,
    ...gradientLabels,
    ...layerLabels('pattern', 'Pattern'),
    ...layerLabels('frenchTip', 'French tip'),
    ...layers.filter((layer) => ['drawing'].includes(layer?.type)).map(() => 'Hand-painted art'),
  ]);
  const charmLabels = layerLabels('charm', 'Charm');
  const jewelLabels = layerLabels('jewel', 'Jewel');
  const decalLabels = layerLabels('decal', 'Decal');
  const artLayerCount = layers.filter((layer) => !['base', 'charm', 'jewel', 'decal'].includes(layer?.type)).length;
  const embellishmentCount = typeCount('charm') + typeCount('jewel') + typeCount('decal');
  const artSummaryParts = uniqueList([
    typeCount('gradient') ? `${typeCount('gradient')} gradient` : '',
    typeCount('pattern') ? `${typeCount('pattern')} pattern` : '',
    typeCount('frenchTip') ? `${typeCount('frenchTip')} french tip` : '',
    typeCount('drawing') ? `${typeCount('drawing')} drawing` : '',
    embellishmentCount ? `${embellishmentCount} embellishment` : '',
  ]);

  return {
    shape: shapes.join(', ') || 'Unknown Shape',
    length: lengths.join(', ') || 'Unknown Length',
    width: widths.join(', ') || 'Unknown Width',
    baseColor: baseColors[0] || '',
    secondaryColors: palette.slice(baseColors.length),
    palette,
    colors: palette,
    effects: effectTypes.length ? effectTypes : ['No Effects'],
    polishTypes,
    gradients: gradientLabels,
    chrome: baseEffects.some((effect) => /chrome/i.test(effect)),
    catEye: baseEffects.some((effect) => /cat\s*eye|cateye/i.test(effect)),
    marble: [...baseEffects, ...layerLabels('pattern', '')].some((effect) => /marble/i.test(effect)),
    frenchTips: layerLabels('frenchTip', 'French tip'),
    patterns: layerLabels('pattern', 'Pattern'),
    charms: charmLabels.length ? charmLabels : ['No Embellishments'],
    jewels: jewelLabels.length ? jewelLabels : ['No Embellishments'],
    decals: decalLabels.length ? decalLabels : ['No Embellishments'],
    charmCount: typeCount('charm'),
    jewelCount: typeCount('jewel'),
    decalCount: typeCount('decal'),
    layerCount: layers.length,
    artLayerCount,
    artLevel: artLayerCount + embellishmentCount >= 8 ? 'Advanced' : artLayerCount + embellishmentCount >= 3 ? 'Detailed' : artLayerCount + embellishmentCount > 0 ? 'Simple' : 'Minimal',
    artSummary: artSummaryParts.length ? artSummaryParts.join(', ') : 'No Effects',
    effectsUsed: effectTypes.length ? effectTypes : ['No Effects'],
  };
};

export function createBlueprintFromDesign(design, options = {}) {
  const source = isObject(design) ? design : {};
  const fullSetData = firstDefined(source.fullSetData, source.fullSet, source.blueprint, source.nails ? { nails: source.nails } : source);
  const metadata = collectDesignMetadata(source);
  const designSnapshot = {
    ...source,
    ...(options.designSnapshot || {}),
    designId: firstDefined(source.id, source.designId),
    designName: firstDefined(source.name, source.designName),
    fullSetData,
    ...metadata,
    colors: uniqueList(firstDefined(source.colors, options.designSnapshot?.colors, metadata.colors)),
    effects: uniqueList(firstDefined(source.effects, options.designSnapshot?.effects, metadata.effects)),
    charms: uniqueList(firstDefined(source.charms, options.designSnapshot?.charms, metadata.charms)),
    jewels: uniqueList(firstDefined(source.jewels, options.designSnapshot?.jewels, metadata.jewels)),
    decals: uniqueList(firstDefined(source.decals, options.designSnapshot?.decals, metadata.decals)),
  };

  return normalizeBlueprint({
    ...options,
    title: options.title || source.name || source.designName,
    designId: designSnapshot.designId,
    designName: designSnapshot.designName,
    designSnapshot,
    pricingGuidance: options.pricingGuidance,
    materials: options.materials || { colors: designSnapshot.colors, products: [], vendorReferences: [], effects: designSnapshot.effectsUsed || designSnapshot.effects },
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
