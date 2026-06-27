const BLUEPRINT_VERSION = 1;

export const BLUEPRINT_STATUSES = ['Draft', 'Portfolio Ready', 'Gallery Ready'];
export const DEFAULT_BLUEPRINT_STATUS = 'Draft';
export const FEATURED_BLUEPRINT_COLLECTIONS = ['Summer Chrome', 'Bridal Collection', 'Holiday Glam', 'After Dark', 'Spring Bloom', 'Signature Collection'];

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
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
const list = (value) => (Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : []);
const numberOrNull = (value) => (Number.isFinite(Number(value)) ? Number(value) : null);
const timestamp = (value) => (Number.isNaN(Date.parse(value)) ? new Date().toISOString() : new Date(value).toISOString());
const clone = (value) => JSON.parse(JSON.stringify(value));
const firstDefined = (...values) => values.find((value) => value !== undefined && value !== null);

const flattenDesignNails = (design) => {
  const source = isObject(design) ? design : {};
  const blueprintDocument = isObject(source.document) ? source.document : isObject(source.blueprint?.document) ? source.blueprint.document : source.blueprint;
  const fullSetData = firstDefined(source.fullSetData, source.fullSet, blueprintDocument, source);
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

const normalizeBlueprintStatus = (value) => (BLUEPRINT_STATUSES.includes(value) ? value : DEFAULT_BLUEPRINT_STATUS);
const normalizeFeaturedCollection = (value) => (FEATURED_BLUEPRINT_COLLECTIONS.includes(value) ? value : '');
const normalizeCreatorStory = (value) => {
  const source = isObject(value) ? value : {};
  return {
    inspiration: text(source.inspiration),
    techniqueNotes: text(source.techniqueNotes),
    productsUsed: text(source.productsUsed),
  };
};


const lowerTokens = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).toLowerCase();
  if (Array.isArray(value)) return value.map(lowerTokens).join(' ');
  if (isObject(value)) return Object.values(value).map(lowerTokens).join(' ');
  return '';
};

const includesAnyToken = (value, patterns) => patterns.some((pattern) => pattern.test(lowerTokens(value)));
const titleCase = (value, fallback) => text(String(value || '').replace(/[-_]+/g, ' '), fallback).replace(/\b\w/g, (char) => char.toUpperCase());

const layerIdentity = (layer) => lowerTokens({
  type: layer?.type,
  kind: layer?.kind,
  tool: layer?.tool,
  category: layer?.category,
  assetType: layer?.assetType,
  assetId: layer?.assetId,
  name: layer?.name,
  label: layer?.label,
  data: layer?.data,
});

const FRENCH_RE = [/french\s*tip/, /french-tip/, /frenchtip/, /\bfrench\b/, /\btip\b/];
const CHARM_RE = [/\bcharms?\b/];
const JEWEL_RE = [/\bjewels?\b/, /\bgems?\b/, /rhinestone/, /crystal/];
const DECAL_RE = [/\bdecals?\b/, /sticker/];
const PATTERN_RE = [/\bpattern\b/, /sparkle/, /\bstars?\b/, /glitter/, /shimmer/];

const layerMatches = (layer, patterns) => includesAnyToken(layerIdentity(layer), patterns);

const visibleLayer = (layer) => isObject(layer) && layer.visible !== false && layer.hidden !== true && layer.deleted !== true && layer.enabled !== false;

const nailCollections = (value) => {
  if (Array.isArray(value)) return value;
  if (!isObject(value)) return [];
  return uniqueList(Object.keys(value)).flatMap((key) => Array.isArray(value[key]) ? value[key] : []);
};

const pushLayerLike = (layers, item, sourcePath) => {
  if (!visibleLayer(item)) return;
  layers.push({ ...item, _sourcePath: sourcePath });
};

const pushLayerArray = (layers, items, sourcePath) => {
  list(items).forEach((item, index) => pushLayerLike(layers, item, `${sourcePath}[${index}]`));
};

const pushNailLayers = (layers, nails, sourcePath) => {
  nailCollections(nails).forEach((nail, nailIndex) => {
    if (!isObject(nail)) return;
    ['layers', 'artLayers', 'canvasLayers', 'boardLayers', 'assets'].forEach((key) => pushLayerArray(layers, nail[key], `${sourcePath}[${nailIndex}].${key}`));
  });
};

const summaryEntries = (summary, sourcePath) => {
  if (!isObject(summary)) return [];
  const entries = [];
  const add = (type, count, label) => {
    const safeCount = Math.max(0, Number(count) || 0);
    for (let index = 0; index < safeCount; index += 1) entries.push({ type, name: label || type, data: { label: label || type }, _sourcePath: `${sourcePath}.${type}` });
  };
  add('charm', summary.charmCount ?? summary.charmsCount ?? summary.charms, 'Charm');
  add('jewel', summary.jewelCount ?? summary.jewelsCount ?? summary.gemCount ?? summary.gems, 'Jewel');
  add('decal', summary.decalCount ?? summary.decalsCount ?? summary.stickers, 'Decal');
  add('frenchTip', summary.frenchTipCount ?? (summary.frenchTip || summary.french ? 1 : 0), 'French Tip');
  add('pattern', summary.patternCount ?? summary.sparkleCount ?? summary.starCount ?? (summary.pattern || summary.sparkle || summary.star ? 1 : 0), summary.pattern || 'Pattern');
  return entries;
};

export function collectDesignLayers(design) {
  const source = isObject(design) ? design : {};
  const layers = [];
  const blueprintDocument = isObject(source.document) ? source.document : isObject(source.blueprint?.document) ? source.blueprint.document : source.blueprint;
  [
    ['design.layers', source.layers], ['design.canvasLayers', source.canvasLayers], ['design.boardLayers', source.boardLayers], ['design.artLayers', source.artLayers],
    ['design.assets', source.assets], ['design.fullSetAssets', source.fullSetAssets], ['design.activeNail.layers', source.activeNail?.layers], ['design.activeNail.artLayers', source.activeNail?.artLayers],
  ].forEach(([path, items]) => pushLayerArray(layers, items, path));
  pushNailLayers(layers, source.nails, 'design.nails');
  pushNailLayers(layers, source.fullSetData?.nails, 'design.fullSetData.nails');
  pushNailLayers(layers, source.fullSet?.nails, 'design.fullSet.nails');
  pushNailLayers(layers, blueprintDocument?.nails, 'design.blueprint.nails');
  pushLayerArray(layers, blueprintDocument?.layers, 'design.blueprint.layers');
  [source.productUse, source.productUseHook, source.rendererSummary, source.summary, blueprintDocument?.productUse, blueprintDocument?.productUseHook, blueprintDocument?.summary]
    .forEach((summary, index) => summaryEntries(summary, `summary[${index}]`).forEach((entry) => pushLayerLike(layers, entry, entry._sourcePath)));
  return layers;
}

const safeThemeId = (input) => text(input).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || DEFAULT_THEME.themeId;

export const DESIGN_METADATA_FIELD_PATHS = {
  shape: ['design.shape', 'design.nails[].shape', 'design.fullSetData.nails[].shape', 'design.blueprint.nails[].shape'],
  length: ['design.length', 'design.nails[].length', 'design.fullSetData.nails[].length', 'design.blueprint.nails[].length'],
  width: ['design.width', 'design.nails[].width', 'design.fullSetData.nails[].width', 'design.blueprint.nails[].width'],
  polishColor: ['design.polishColor', 'design.polishColors[]', 'design.baseColorHex', 'design.nails[].baseColorHex', 'design.nails[].layers[type=base].data.colorHex'],
  baseColor: ['legacy design.baseColorHex', 'legacy design.nails[].baseColorHex', 'legacy design.nails[].layers[type=base].data.colorHex'],
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

/**
 * Creative Data Architecture™ purpose map.
 * Nail Design™ is the editable artwork source; it owns canvas data, nails,
 * layers, masks, polish color layers, polish types, techniques, top coat
 * layers, embellishment layers, drawing layers, and design metadata.
 * Nail Recipe™ is generated from Nail Design and owns production/recreation
 * instructions: recipe steps, layer order, polish colors/types, techniques,
 * paintable top coats, masks/placement notes, embellishments, product usage
 * placeholders, difficulty/time estimates, and recreation notes.
 * Nail Blueprint™ is generated from Nail Design + Nail Recipe and owns the
 * business/client-facing sales document: hero preview, title, price, deposit,
 * appointment time, service category, collection, creator/shop snapshot,
 * gallery readiness/status, proposal-ready details, and customer-facing notes.
 */
const CREATIVE_OBJECT_PURPOSES = Object.freeze({
  nailDesign: 'Editable artwork source',
  nailRecipe: 'Production and recreation instructions',
  nailBlueprint: 'Business and client-facing sales document',
});

const layerData = (layer) => (isObject(layer?.data) ? layer.data : {});
const layerLabel = (layer, fallback) => text(layerData(layer).label || layer?.label || layer?.name || layerData(layer).assetId || layer?.assetId || layerData(layer).assetType || layer?.assetType, fallback);
const layerPolishColor = (layer) => safeColor(layerData(layer).colorHex || layerData(layer).polishColor || layerData(layer).polishColorHex || layerData(layer).baseColorHex, '');
const layerPolishType = (layer) => text(layerData(layer).polishType || layerData(layer).typeName || layerData(layer).effect);
const layerTechnique = (layer) => text(layerData(layer).technique || layerData(layer).style || layerData(layer).preset || (layerMatches(layer, FRENCH_RE) ? 'French Tip' : ''));
const topCoatCoverage = (layer) => ['full', 'partial', 'masked', 'unknown'].includes(layerData(layer).coverage) ? layerData(layer).coverage : (layerData(layer).mask || layerData(layer).maskSummary ? 'masked' : layerData(layer).placement ? 'partial' : 'unknown');
const isTopCoatLayer = (layer) => layer?.type === 'topCoat' || layer?.kind === 'top-coat' || layer?.category === 'topCoat' || /top\s*coat/i.test(layerIdentity(layer));

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
      baseColor: text(design.baseColor), polishColor: text(design.polishColor, text(design.baseColor)), polishColors: list(design.polishColors).length ? list(design.polishColors) : list(design.colors), secondaryColors: list(design.secondaryColors), palette: list(design.palette),
      polishTypes: list(design.polishTypes), gradients: list(design.gradients), chrome: Boolean(design.chrome), catEye: Boolean(design.catEye), marble: Boolean(design.marble), frenchTips: list(design.frenchTips), patterns: list(design.patterns),
      charmCount: Number(design.charmCount) || 0, jewelCount: Number(design.jewelCount) || 0, decalCount: Number(design.decalCount) || 0, layerCount: Number(design.layerCount) || 0, artLayerCount: Number(design.artLayerCount) || 0,
      artLevel: text(design.artLevel, 'Minimal'), artSummary: text(design.artSummary, 'No Effects'), effectsUsed: list(design.effectsUsed),
    },
    pricingGuidance: { suggestedPrice: numberOrNull(pricing.suggestedPrice), suggestedDeposit: numberOrNull(pricing.suggestedDeposit), estimatedTime: text(pricing.estimatedTime, 'Not estimated'), breakdown: isObject(pricing.breakdown) ? pricing.breakdown : {} },
    materials: { colors: list(materials.colors), effects: list(materials.effects), products: list(materials.products), vendorReferences: list(materials.vendorReferences) },
    tags: list(source.tags), difficulty: text(source.difficulty, 'Not rated'), collectionName: text(source.collectionName),
    status: normalizeBlueprintStatus(source.status),
    featuredCollection: normalizeFeaturedCollection(source.featuredCollection || source.collectionName),
    creatorStory: normalizeCreatorStory(source.creatorStory),
    theme: normalizeBlueprintTheme(source.theme),
    visibility: ['private', 'portfolio', 'gallery-ready'].includes(source.visibility) ? source.visibility : 'private',
    engagementStats: { views: Number(stats.views) || 0, saves: Number(stats.saves) || 0, likes: Number(stats.likes) || 0, remixes: Number(stats.remixes) || 0 },
    createdAt: timestamp(source.createdAt), updatedAt: timestamp(source.updatedAt),
  };
}

export function evaluateBlueprintReadiness(input) {
  const blueprint = normalizeBlueprint(input);
  const fullSetNails = flattenDesignNails(blueprint.designSnapshot.fullSetData);
  const checklist = [
    { id: 'title', label: 'Blueprint title exists', ready: hasText(blueprint.title) && blueprint.title !== 'Untitled Blueprint' },
    { id: 'theme', label: 'Theme exists', ready: hasText(blueprint.theme.themeName) },
    { id: 'heroPreview', label: 'Hero preview exists', ready: fullSetNails.length > 0 },
    { id: 'creatorInfo', label: 'Creator info exists', ready: hasText(blueprint.creatorSnapshot.creatorName) && blueprint.creatorSnapshot.creatorName !== 'Unknown creator' },
    { id: 'collection', label: 'Collection exists', ready: hasText(blueprint.featuredCollection) || hasText(blueprint.collectionName) || hasText(blueprint.theme.collectionLabel) },
    { id: 'tags', label: 'At least one tag exists', ready: blueprint.tags.length > 0 },
  ];
  const completed = checklist.filter((item) => item.ready).length;
  const score = Math.round((completed / checklist.length) * 100);
  const label = score === 100 ? 'Gallery Ready' : score >= 67 ? 'Almost Ready' : 'Not Ready';
  return { checklist, score, label, ready: score === 100, missing: checklist.filter((item) => !item.ready).map((item) => item.label) };
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
    status: DEFAULT_BLUEPRINT_STATUS,
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
  const layers = collectDesignLayers(source);
  const baseLayers = layers.filter((layer) => layer?.type === 'base');
  const typeCount = (type) => layers.filter((layer) => layer?.type === type || layerMatches(layer, type === 'frenchTip' ? FRENCH_RE : type === 'charm' ? CHARM_RE : type === 'jewel' ? JEWEL_RE : type === 'decal' ? DECAL_RE : type === 'pattern' ? PATTERN_RE : [new RegExp(`\\b${type}\\b`)])).length;
  const layerLabels = (type, fallback) => uniqueList(layers
    .filter((layer) => layer?.type === type || layerMatches(layer, type === 'frenchTip' ? FRENCH_RE : type === 'charm' ? CHARM_RE : type === 'jewel' ? JEWEL_RE : type === 'decal' ? DECAL_RE : type === 'pattern' ? PATTERN_RE : [new RegExp(`\\b${type}\\b`)]))
    .map((layer) => {
      const displayLabel = layer?.data?.label || layer?.label || layer?.name;
      if (displayLabel) return titleCase(displayLabel, fallback);
      return layer?.data?.assetId || layer?.assetId || layer?.data?.assetType || layer?.assetType || layer?.data?.pattern || layer?.data?.style || layer?.data?.preset || fallback;
    }));
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
    ...layerLabels('frenchTip', 'French Tip'),
    ...layers.filter((layer) => ['drawing'].includes(layer?.type)).map(() => 'Hand-painted art'),
  ]);
  const charmLabels = layerLabels('charm', 'Charm');
  const jewelLabels = layerLabels('jewel', 'Jewel');
  const decalLabels = layerLabels('decal', 'Decal');
  const artLayerCount = layers.filter((layer) => layer?.type !== 'base' && !layerMatches(layer, CHARM_RE) && !layerMatches(layer, JEWEL_RE) && !layerMatches(layer, DECAL_RE)).length;
  const embellishmentCount = typeCount('charm') + typeCount('jewel') + typeCount('decal');
  const artSummaryParts = uniqueList([
    typeCount('gradient') ? `${typeCount('gradient')} gradient` : '',
    typeCount('pattern') ? layerLabels('pattern', 'Pattern').join(', ') || `${typeCount('pattern')} Pattern` : '',
    typeCount('frenchTip') ? 'French Tip' : '',
    typeCount('drawing') ? `${typeCount('drawing')} drawing` : '',
    typeCount('charm') ? `${typeCount('charm')} Charm${typeCount('charm') === 1 ? '' : 's'}` : '',
    typeCount('jewel') ? `${typeCount('jewel')} Jewel${typeCount('jewel') === 1 ? '' : 's'}` : '',
    typeCount('decal') ? `${typeCount('decal')} Decal${typeCount('decal') === 1 ? '' : 's'}` : '',
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
    frenchTips: layerLabels('frenchTip', 'French Tip'),
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


export function normalizeNailDesign(design) {
  const source = isObject(design) ? design : {};
  const metadata = collectDesignMetadata(source);
  const fullSetData = firstDefined(source.fullSetData, source.fullSet, source.document, source.blueprint?.document, source.nails ? { nails: source.nails } : { nails: [] });
  const layers = collectDesignLayers(source);
  const legacyPolishColors = uniqueList([source.polishColor, ...(Array.isArray(source.polishColors) ? source.polishColors : []), source.baseColorHex, ...layers.map(layerPolishColor)]).filter((color) => /^#[0-9a-f]{6}$/i.test(color));
  return {
    objectType: 'Nail Design',
    purpose: CREATIVE_OBJECT_PURPOSES.nailDesign,
    designId: text(firstDefined(source.id, source.designId), `design-${Date.now()}`),
    designName: text(firstDefined(source.name, source.designName), 'Untitled design'),
    canvasData: clone(firstDefined(source.canvasData, source.canvas, {})),
    nails: flattenDesignNails(source),
    layers,
    masks: list(source.masks),
    polishColor: legacyPolishColors[0] || '',
    polishColors: legacyPolishColors,
    baseColorHex: source.baseColorHex,
    polishTypes: uniqueList([source.polishType, ...layers.map(layerPolishType), ...metadata.polishTypes]),
    techniques: uniqueList([source.technique, ...layers.map(layerTechnique), ...metadata.frenchTips, ...metadata.patterns]).filter((item) => item !== 'No Technique'),
    topCoatLayers: layers.filter(isTopCoatLayer),
    embellishmentLayers: layers.filter((layer) => layerMatches(layer, CHARM_RE) || layerMatches(layer, JEWEL_RE) || layerMatches(layer, DECAL_RE)),
    drawingLayers: layers.filter((layer) => layer?.type === 'drawing'),
    metadata: { ...metadata, polishColor: legacyPolishColors[0] || '', polishColors: legacyPolishColors },
    rawDesign: clone(source),
  };
}

const recipeStep = (category, label, details = {}) => ({ id: `${category}-${label}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), category, label, ...details });

export function createRecipeFromDesign(design) {
  const normalizedDesign = normalizeNailDesign(design);
  const layers = normalizedDesign.layers;
  const steps = [];
  const polishColors = normalizedDesign.polishColors.length ? normalizedDesign.polishColors : ['Unknown Polish Color'];
  polishColors.forEach((color) => steps.push(recipeStep('polishColor', `Polish Color: ${color}`)));
  const polishTypes = normalizedDesign.polishTypes.length ? normalizedDesign.polishTypes : ['Unknown Polish Type'];
  polishTypes.forEach((type) => steps.push(recipeStep('polishType', `Polish Type: ${type}`)));
  const techniques = uniqueList([...normalizedDesign.techniques, ...layers.map(layerTechnique)]).filter(Boolean);
  (techniques.length ? techniques : ['No Technique']).forEach((technique) => steps.push(recipeStep('technique', `Technique: ${technique}`)));
  const topCoatLayers = layers.filter(isTopCoatLayer);
  if (topCoatLayers.length) topCoatLayers.forEach((layer) => {
    const data = layerData(layer);
    const topCoat = text(data.topCoatType || data.topCoat || data.finish || layerLabel(layer, ''), 'Unknown Top Coat');
    const placement = text(data.placement, topCoatCoverage(layer) === 'full' ? 'full nail' : 'placement unknown');
    steps.push(recipeStep('topCoat', `Top Coat: ${topCoat}, applied to ${placement}`, { coverage: topCoatCoverage(layer), placement, maskSummary: text(data.maskSummary || data.mask), topCoatType: topCoat }));
  });
  else steps.push(recipeStep('topCoat', 'Top Coat: No Top Coat', { coverage: 'unknown', placement: '', maskSummary: '', topCoatType: 'No Top Coat' }));
  const charms = layers.filter((layer) => layerMatches(layer, CHARM_RE));
  const jewels = layers.filter((layer) => layerMatches(layer, JEWEL_RE));
  const patterns = layers.filter((layer) => layerMatches(layer, PATTERN_RE));
  steps.push(recipeStep('embellishment', `Embellishment: ${charms.length ? layerLabel(charms[0], 'Charm') : 'No Embellishments'}`));
  steps.push(recipeStep('jewels', `Jewels: ${jewels.length ? `${jewels.length} crystals` : 'No Embellishments'}`));
  if (patterns.length) steps.push(recipeStep('pattern', `Pattern: ${layerLabel(patterns[0], layerData(patterns[0]).pattern || 'Sparkle/star pattern')}`));
  return normalizeNailRecipe({
    recipeId: `recipe-${normalizedDesign.designId}`,
    sourceDesignId: normalizedDesign.designId,
    purpose: CREATIVE_OBJECT_PURPOSES.nailRecipe,
    steps,
    layerOrder: layers.map((layer, index) => ({ index, type: text(layer?.type || layer?.kind || layer?.category, 'layer'), label: layerLabel(layer, `Layer ${index + 1}`) })),
    polishColors,
    polishTypes,
    techniques: techniques.length ? techniques : ['No Technique'],
    topCoats: topCoatLayers.map((layer) => ({ coverage: topCoatCoverage(layer), placement: text(layerData(layer).placement), maskSummary: text(layerData(layer).maskSummary || layerData(layer).mask), topCoatType: text(layerData(layer).topCoatType || layerData(layer).topCoat || layerData(layer).finish, 'Unknown Top Coat') })),
    masksPlacementNotes: uniqueList(topCoatLayers.map((layer) => text(layerData(layer).maskSummary || layerData(layer).placement))),
    embellishments: uniqueList([...charms, ...jewels].map((layer) => layerLabel(layer, 'Embellishment'))),
    productUsagePlaceholders: ['Product usage TBD'],
    difficultyEstimate: normalizedDesign.metadata.artLevel,
    timeEstimate: normalizedDesign.metadata.artLevel === 'Advanced' ? '120+ minutes' : normalizedDesign.metadata.artLevel === 'Detailed' ? '90 minutes' : '60 minutes',
    recreationNotes: 'Generated from editable Nail Design layers.',
  });
}

export function normalizeNailRecipe(recipe) {
  const source = isObject(recipe) ? recipe : {};
  const safeSteps = list(source.steps).map((step, index) => isObject(step) ? { ...step, label: text(step.label, `Step ${index + 1}`) } : recipeStep('step', text(step, `Step ${index + 1}`)));
  return {
    objectType: 'Nail Recipe',
    recipeId: text(source.recipeId, `recipe-${Date.now()}`),
    sourceDesignId: text(source.sourceDesignId),
    purpose: text(source.purpose, CREATIVE_OBJECT_PURPOSES.nailRecipe),
    steps: safeSteps,
    layerOrder: list(source.layerOrder),
    polishColors: list(source.polishColors).length ? list(source.polishColors) : ['Unknown Polish Color'],
    polishTypes: list(source.polishTypes).length ? list(source.polishTypes) : ['Unknown Polish Type'],
    techniques: list(source.techniques).length ? list(source.techniques) : ['No Technique'],
    topCoats: list(source.topCoats), masksPlacementNotes: list(source.masksPlacementNotes), embellishments: list(source.embellishments).length ? list(source.embellishments) : ['No Embellishments'], productUsagePlaceholders: list(source.productUsagePlaceholders), difficultyEstimate: text(source.difficultyEstimate, 'Minimal'), timeEstimate: text(source.timeEstimate, '60 minutes'), recreationNotes: text(source.recreationNotes),
  };
}

export function createBlueprintFromDesignAndRecipe(design, recipe, options = {}) {
  const normalizedDesign = normalizeNailDesign(design);
  const normalizedRecipe = normalizeNailRecipe(recipe || createRecipeFromDesign(normalizedDesign.rawDesign));
  const blueprint = normalizeBlueprint({
    ...options,
    title: options.title || normalizedDesign.designName,
    designId: normalizedDesign.designId,
    designName: normalizedDesign.designName,
    designSnapshot: { ...(options.designSnapshot || {}), ...normalizedDesign.rawDesign, designId: normalizedDesign.designId, designName: normalizedDesign.designName, fullSetData: firstDefined(normalizedDesign.rawDesign.fullSetData, normalizedDesign.rawDesign.fullSet, normalizedDesign.rawDesign.nails ? { nails: normalizedDesign.rawDesign.nails } : { nails: normalizedDesign.nails }), ...normalizedDesign.metadata, polishColor: normalizedDesign.polishColor, polishColors: normalizedDesign.polishColors },
    pricingGuidance: options.pricingGuidance,
    materials: options.materials || { colors: normalizedDesign.polishColors, products: [], vendorReferences: [], effects: normalizedDesign.metadata.effectsUsed || normalizedDesign.metadata.effects },
    theme: options.theme,
  });
  return normalizeNailBlueprint({
    ...blueprint,
    sourceDesignId: normalizedDesign.designId,
    recipeId: normalizedRecipe.recipeId,
    recipeSnapshot: { recipeId: normalizedRecipe.recipeId, steps: normalizedRecipe.steps.slice(0, 6), difficultyEstimate: normalizedRecipe.difficultyEstimate, timeEstimate: normalizedRecipe.timeEstimate },
    recipeSummary: normalizedRecipe.steps.map((step) => step.label).slice(0, 6).join(' • '),
    businessSummary: { title: blueprint.title, price: blueprint.pricingGuidance.suggestedPrice, deposit: blueprint.pricingGuidance.suggestedDeposit, estimatedAppointmentTime: blueprint.pricingGuidance.estimatedTime, serviceCategory: text(options.serviceCategory, 'Custom nail art'), collection: blueprint.featuredCollection || blueprint.collectionName || blueprint.theme.collectionLabel },
  });
}

export function normalizeNailBlueprint(blueprint) {
  const normalized = normalizeBlueprint(blueprint);
  const source = isObject(blueprint) ? blueprint : {};
  return { ...normalized, objectType: 'Nail Blueprint', purpose: CREATIVE_OBJECT_PURPOSES.nailBlueprint, sourceDesignId: text(source.sourceDesignId, normalized.designSnapshot.designId), recipeId: text(source.recipeId), recipeSnapshot: isObject(source.recipeSnapshot) ? source.recipeSnapshot : null, recipeSummary: text(source.recipeSummary), businessSummary: isObject(source.businessSummary) ? source.businessSummary : {} };
}

export function createBlueprintFromDesign(design, options = {}) {
  const normalizedDesign = normalizeNailDesign(design);
  const recipe = createRecipeFromDesign(normalizedDesign.rawDesign);
  return createBlueprintFromDesignAndRecipe(normalizedDesign.rawDesign, recipe, options);
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
