import { normalizePolishData } from './design-studio/blueprint';

export const FULL_SET_RENDER_MODES = ['left', 'right', 'full', 'hero'];
export const HAND_SLOTS = ['thumb', 'index', 'middle', 'ring', 'pinky'];

const DEFAULT_SHAPE = 'Almond';
const DEFAULT_LENGTH = 0.62;
const DEFAULT_WIDTH = 0.52;
const DEFAULT_COLORS = ['#F7C7D9', '#E8A0BF', '#D96BA6', '#B84E8A', '#F3A6C8'];

const normalizeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeLayers = (layers, fallbackColor) => {
  if (!Array.isArray(layers) || !layers.length) {
    return [{ id: 'base', type: 'base', order: 0, visible: true, data: normalizePolishData({ colorHex: fallbackColor }) }];
  }

  const normalized = layers.map((layer, index) => ({
    ...layer,
    id: layer?.id || `layer-${index}`,
    type: layer?.type || 'base',
    order: normalizeNumber(layer?.order, index),
    visible: layer?.visible !== false,
    data: layer?.type === 'base' || !layer?.type ? normalizePolishData(layer?.data || {}, fallbackColor) : (layer?.data || {}),
  }));

  if (!normalized.some((layer) => layer.type === 'base')) {
    normalized.unshift({ id: 'base', type: 'base', order: 0, visible: true, data: normalizePolishData({ colorHex: fallbackColor }) });
  }

  return normalized;
};

export function normalizeFullSetNail(candidate = {}, slot = 'index', hand = 'left', index = 0) {
  const fallbackColor = DEFAULT_COLORS[index % DEFAULT_COLORS.length];
  return {
    ...candidate,
    id: candidate.id || `${hand}-${slot}`,
    hand,
    slot,
    shape: candidate.shape || DEFAULT_SHAPE,
    length: normalizeNumber(candidate.length, DEFAULT_LENGTH),
    width: normalizeNumber(candidate.width, DEFAULT_WIDTH),
    layers: normalizeLayers(candidate.layers, candidate.baseColor || candidate.colorHex || fallbackColor),
  };
}

const nailsFromArray = (items, hand) => HAND_SLOTS.map((slot, index) => normalizeFullSetNail(items?.[index], slot, hand, index));
const nailsFromMap = (items, hand) => HAND_SLOTS.map((slot, index) => normalizeFullSetNail(items?.[slot], slot, hand, index));

export function normalizeFullSetDesign(designData = {}) {
  const source = designData && typeof designData === 'object' ? designData : {};
  const nails = source.nails && typeof source.nails === 'object' ? source.nails : source;
  const leftSource = nails.left || nails.leftHand || nails.leftHandNails;
  const rightSource = nails.right || nails.rightHand || nails.rightHandNails;

  const left = Array.isArray(leftSource) ? nailsFromArray(leftSource, 'left') : nailsFromMap(leftSource, 'left');
  const right = Array.isArray(rightSource) ? nailsFromArray(rightSource, 'right') : nailsFromMap(rightSource, 'right');

  return {
    id: source.id || 'full-set-renderer-design',
    name: source.name || source.designName || 'Full Set Renderer Preview',
    left,
    right,
  };
}

export function getFullSetRenderHands(designData, mode = 'full') {
  const normalized = normalizeFullSetDesign(designData);
  if (mode === 'left') return [{ id: 'left', label: 'Left Hand', nails: normalized.left }];
  if (mode === 'right') return [{ id: 'right', label: 'Right Hand', nails: normalized.right }];
  return [
    { id: 'left', label: 'Left Hand', nails: normalized.left },
    { id: 'right', label: 'Right Hand', nails: normalized.right },
  ];
}
