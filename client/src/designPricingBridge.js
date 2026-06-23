const DEFAULT_DEPOSIT_PERCENT = 50;

const DESIGN_SERVICE_CATEGORY = 'Custom Design';
const EMBELLISHMENT_ROW_NAMES = {
  charms: 'Charm',
  jewels: 'Jewel',
  decals: 'Decal / Sticker',
};

const ART_LAYER_TYPES = new Set(['drawing', 'pattern', 'gradient', 'frenchTip']);
const EMBELLISHMENT_LAYER_TYPES = new Set(['charm', 'jewel', 'decal']);

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

const toNumber = (value, fallback = 0) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCount = (value) => Math.max(0, Math.trunc(toNumber(value, 0)));

const toTitleCase = (value) => normalizeText(value)
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

const unique = (values) => [...new Set(values.filter(Boolean))];

const visibleLayers = (nail) => (Array.isArray(nail?.layers) ? nail.layers : [])
  .filter((layer) => layer && layer.visible !== false);

const layersFromDesign = (design) => {
  if (!isPlainObject(design)) return [];
  const blueprint = isPlainObject(design.blueprint) ? design.blueprint : design;
  const nails = Array.isArray(blueprint.nails) ? blueprint.nails : [];
  const activeNailId = normalizeText(blueprint.canvas?.activeNailId);
  const activeNail = nails.find((nail) => normalizeText(nail?.id) === activeNailId);
  const orderedNails = activeNail ? [activeNail, ...nails.filter((nail) => nail !== activeNail)] : nails;
  return orderedNails.flatMap((nail) => visibleLayers(nail).map((layer) => ({ nail, layer })));
};

const nailsFromDesign = (design) => {
  if (!isPlainObject(design)) return [];
  const blueprint = isPlainObject(design.blueprint) ? design.blueprint : design;
  if (Array.isArray(blueprint.nails)) return blueprint.nails.filter(isPlainObject);
  return [design].filter(isPlainObject);
};

const firstAvailable = (...values) => values.find((value) => normalizeText(value));

const lengthTierFromValue = (length) => {
  const numeric = toNumber(length, NaN);
  if (!Number.isFinite(numeric)) return 'Medium';
  if (numeric >= 0.85) return 'XXL';
  if (numeric >= 0.72) return 'XL';
  if (numeric >= 0.58) return 'Long';
  return 'Medium';
};

const readLayerType = (layer) => normalizeText(layer?.type);

const countLayerType = (layerEntries, type) => layerEntries.filter(({ layer }) => readLayerType(layer) === type).length;

const hasLayerType = (layerEntries, type) => countLayerType(layerEntries, type) > 0;

const inferFinishTypes = (design, layerEntries) => {
  const finishes = [];
  const baseLayers = layerEntries.filter(({ layer }) => readLayerType(layer) === 'base');
  baseLayers.forEach(({ layer }) => {
    finishes.push(toTitleCase(firstAvailable(layer.data?.polishType, layer.data?.effect)));
  });
  finishes.push(toTitleCase(design?.polishType));
  finishes.push(toTitleCase(design?.effect));
  if (hasLayerType(layerEntries, 'gradient')) finishes.push('Gradient');
  if (hasLayerType(layerEntries, 'frenchTip')) finishes.push('French Tip');
  return unique(finishes).length ? unique(finishes) : ['Cream'];
};

const inferArtLevel = ({ gradientCount, frenchTipCount, patternCount, drawingCount, charmCount, jewelCount, decalCount }) => {
  const artSignals = gradientCount + frenchTipCount + patternCount + drawingCount;
  const embellishmentSignals = charmCount + jewelCount + decalCount;
  if (drawingCount >= 3 || patternCount >= 3 || artSignals >= 5 || embellishmentSignals >= 8) return 'Advanced Art';
  if (artSignals > 0 || embellishmentSignals > 0) return 'Basic Art';
  return 'None';
};

const complexityFromInputs = ({ artLevel, finishTypes, embellishments }) => {
  const embellishmentCount = embellishments.charmCount + embellishments.jewelCount + embellishments.decalCount;
  if (artLevel === 'Advanced Art' || embellishmentCount >= 8 || finishTypes.length >= 4) return 'high';
  if (artLevel === 'Basic Art' || embellishmentCount > 0 || finishTypes.length >= 2) return 'medium';
  return 'low';
};

export const buildDesignPricingInputs = (design) => {
  const safeDesign = isPlainObject(design) ? design : {};
  const nails = nailsFromDesign(safeDesign);
  const layerEntries = layersFromDesign(safeDesign);
  const primaryNail = nails[0] || {};
  const shape = toTitleCase(firstAvailable(primaryNail.shape, safeDesign.shape)) || 'Unknown';
  const width = toNumber(primaryNail.width ?? safeDesign.width, 0);
  const lengthTier = lengthTierFromValue(primaryNail.length ?? safeDesign.length);

  const gradientCount = countLayerType(layerEntries, 'gradient') + (normalizeText(safeDesign.effect).toLowerCase() === 'gradient' ? 1 : 0);
  const frenchTipCount = countLayerType(layerEntries, 'frenchTip');
  const patternCount = countLayerType(layerEntries, 'pattern');
  const drawingCount = countLayerType(layerEntries, 'drawing');
  const charmCount = countLayerType(layerEntries, 'charm') + normalizeCount(safeDesign.charmCount);
  const jewelCount = countLayerType(layerEntries, 'jewel') + normalizeCount(safeDesign.jewelCount);
  const decalCount = countLayerType(layerEntries, 'decal') + normalizeCount(safeDesign.decalCount);
  const artIndicators = {
    gradient: gradientCount > 0,
    frenchTip: frenchTipCount > 0,
    pattern: patternCount > 0,
    drawing: drawingCount > 0,
  };
  const finishTypes = inferFinishTypes(safeDesign, layerEntries);
  const artLevel = inferArtLevel({ gradientCount, frenchTipCount, patternCount, drawingCount, charmCount, jewelCount, decalCount });
  const embellishments = { charmCount, jewelCount, decalCount };

  return {
    serviceCategory: DESIGN_SERVICE_CATEGORY,
    lengthTier,
    finishTypes,
    artLevel,
    embellishments,
    estimatedComplexity: complexityFromInputs({ artLevel, finishTypes, embellishments }),
    designSignals: {
      shape,
      width,
      artIndicators,
      layerCounts: {
        gradientCount,
        frenchTipCount,
        patternCount,
        drawingCount,
        charmCount,
        jewelCount,
        decalCount,
        artLayerCount: layerEntries.filter(({ layer }) => ART_LAYER_TYPES.has(readLayerType(layer))).length,
        embellishmentLayerCount: layerEntries.filter(({ layer }) => EMBELLISHMENT_LAYER_TYPES.has(readLayerType(layer))).length,
      },
    },
  };
};

const normalizePricingAmount = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const clampPercent = (value) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

const categoryRows = (pricingLibrary, categoryId) => {
  const category = pricingLibrary?.categories?.[categoryId] || pricingLibrary?.[categoryId];
  return Array.isArray(category?.rows) ? category.rows : [];
};

const findModifierAmount = (pricingLibrary, categoryId, name) => {
  const normalizedName = normalizeText(name).toLowerCase();
  const row = categoryRows(pricingLibrary, categoryId).find((candidate) => normalizeText(candidate?.name).toLowerCase() === normalizedName);
  return normalizePricingAmount(row?.amount);
};

const addBreakdownAmount = (breakdown, label, amount) => {
  if (amount > 0) breakdown.push({ label, amount });
  return amount;
};

export const calculateDesignSuggestion = (design, pricingLibrary = {}) => {
  const inputs = buildDesignPricingInputs(design);
  const breakdown = [];
  let suggestedPrice = addBreakdownAmount(breakdown, 'Base Design Service', normalizePricingAmount(pricingLibrary?.basePrice ?? pricingLibrary?.baseServicePrice));
  let estimatedTime = normalizePricingAmount(pricingLibrary?.baseMinutes ?? pricingLibrary?.estimatedMinutes);

  suggestedPrice += addBreakdownAmount(breakdown, `${inputs.lengthTier} Length`, findModifierAmount(pricingLibrary, 'lengthPricing', inputs.lengthTier));

  inputs.finishTypes.forEach((finish) => {
    suggestedPrice += addBreakdownAmount(breakdown, finish, findModifierAmount(pricingLibrary, 'finishPricing', finish));
    estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', finish);
  });

  if (inputs.artLevel !== 'None') {
    suggestedPrice += addBreakdownAmount(breakdown, inputs.artLevel, findModifierAmount(pricingLibrary, 'nailArtPricing', inputs.artLevel));
    estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', inputs.artLevel);
  }

  Object.entries(EMBELLISHMENT_ROW_NAMES).forEach(([key, rowName]) => {
    const countKey = `${key.slice(0, -1)}Count`;
    const count = inputs.embellishments[countKey] || 0;
    const amount = findModifierAmount(pricingLibrary, 'embellishmentPricing', rowName) * count;
    suggestedPrice += addBreakdownAmount(breakdown, `${count} ${rowName}${count === 1 ? '' : 's'}`, amount);
  });

  estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', 'Charm Placement') * inputs.embellishments.charmCount;
  const depositPercent = clampPercent(pricingLibrary?.depositPercent ?? DEFAULT_DEPOSIT_PERCENT);

  return {
    suggestedPrice,
    suggestedDeposit: suggestedPrice * (depositPercent / 100),
    estimatedTime,
    breakdown,
    inputs,
  };
};
