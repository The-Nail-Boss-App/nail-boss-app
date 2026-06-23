import { useState } from 'react';
import { COLORS } from './styles';
import FullSetRenderer from './FullSetRenderer';
import { buildBlueprintPreviewSummary, createBlueprintFromDesign, createCustomBlueprintTheme, getBlueprintContentSignature, getDefaultBlueprintThemes, normalizeBlueprintTheme } from './blueprintEngine';


const FULL_SET_RENDERER_SAMPLE = {
  name: 'Shop Sample Set',
  nails: {
    left: [
      { shape: 'Almond', length: 0.64, width: 0.5, layers: [{ id: 'base', type: 'base', order: 0, data: { colorHex: '#F7C7D9', polishType: 'Jelly' } }, { id: 'aura', type: 'gradient', order: 1, opacity: 0.75, data: { colorA: '#FFFFFF', colorB: '#D96BA6', direction: 'aura' } }] },
      { shape: 'Coffin', length: 0.7, width: 0.54, layers: [{ id: 'base', type: 'base', order: 0, data: { colorHex: '#E8A0BF', polishType: 'Cream' } }, { id: 'french', type: 'frenchTip', order: 2, data: { colorHex: '#FFFFFF', style: 'classic' } }] },
      { shape: 'Almond', length: 0.76, width: 0.52, layers: [{ id: 'base', type: 'base', order: 0, data: { colorHex: '#B84E8A', polishType: 'Chrome' } }, { id: 'jewel', type: 'jewel', order: 3, data: { assetId: 'jewel-round', x: 0.5, y: 0.58, scaleX: 0.18, scaleY: 0.18, colorHex: '#FDE68A' } }] },
      { shape: 'Oval', length: 0.68, width: 0.5, layers: [{ id: 'base', type: 'base', order: 0, data: { colorHex: '#F3A6C8', polishType: 'Milky' } }, { id: 'dots', type: 'pattern', order: 1, opacity: 0.7, data: { pattern: 'dots', colorHex: '#7B2D5F' } }] },
      { shape: 'Round', length: 0.58, width: 0.48, layers: [{ id: 'base', type: 'base', order: 0, data: { colorHex: '#FFFFFF', polishType: 'Cream' } }, { id: 'decal', type: 'decal', order: 3, data: { assetId: 'decal-sparkle', x: 0.52, y: 0.5, scaleX: 0.2, scaleY: 0.2, colorHex: '#D96BA6' } }] },
    ],
  },
};

const DEFAULT_PROFILE = {
  shopName: 'Nail Boss Studio',
  tagline: 'Custom nail artistry for standout sets.',
  about: 'A welcoming nail space for expressive, detail-led looks — from clean classics to statement art.',
  contactEmail: 'hello@nailboss.example',
  phone: '(555) 123-4567',
  location: 'Serving local nail lovers by appointment',
  instagram: '@nailbossstudio',
  tiktok: '@nailbossstudio',
  website: 'nailboss.example',
  bookingLink: 'Booking link coming soon',
  primaryColor: '#7b2d5f',
  accentColor: '#f3a6c8',
};


const BLUEPRINT_TYPOGRAPHY_STYLES = {
  'polished serif': { fontFamily: 'Georgia, Times, serif', letterSpacing: '0.01em', textTransform: 'none' },
  'elevated serif': { fontFamily: 'Georgia, Times, serif', letterSpacing: '0.04em', textTransform: 'uppercase' },
  'bold magazine': { fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: '-0.03em', textTransform: 'uppercase' },
  'romantic script': { fontFamily: 'Brush Script MT, Georgia, serif', letterSpacing: '0.02em', textTransform: 'none' },
  'sunny rounded': { fontFamily: 'Trebuchet MS, Arial, sans-serif', letterSpacing: '0.02em', textTransform: 'none' },
  'festive classic': { fontFamily: 'Georgia, Times, serif', letterSpacing: '0.03em', textTransform: 'uppercase' },
  'dark dramatic': { fontFamily: 'Impact, Arial Black, sans-serif', letterSpacing: '0.05em', textTransform: 'uppercase' },
  'fluid shimmer': { fontFamily: 'Trebuchet MS, Arial, sans-serif', letterSpacing: '0.04em', textTransform: 'none' },
  'wild bold': { fontFamily: 'Arial Black, Arial, sans-serif', letterSpacing: '0.02em', textTransform: 'uppercase' },
  'clean sans': { fontFamily: 'Inter, Arial, sans-serif', letterSpacing: '0', textTransform: 'none' },
};

const BLUEPRINT_ACCENT_STYLES = {
  'soft frame': { borderRadius: 24, boxShadow: 'inset 0 0 0 8px rgba(255,255,255,.35)', badgeRadius: 999, pattern: 'linear-gradient(135deg, rgba(255,255,255,.4), transparent)' },
  'gold foil': { borderRadius: 18, boxShadow: '0 18px 40px rgba(120,90,20,.18)', badgeRadius: 6, pattern: 'radial-gradient(circle at 18% 20%, rgba(212,175,55,.28), transparent 24%)' },
  'graphic blocks': { borderRadius: 10, boxShadow: '12px 12px 0 rgba(0,0,0,.08)', badgeRadius: 0, pattern: 'linear-gradient(90deg, rgba(0,0,0,.08) 0 18%, transparent 18%)' },
  'pearl glow': { borderRadius: 32, boxShadow: '0 0 36px rgba(248,215,218,.85)', badgeRadius: 999, pattern: 'radial-gradient(circle at 80% 15%, rgba(255,255,255,.8), transparent 20%)' },
  'citrus pop': { borderRadius: 20, boxShadow: '0 16px 0 rgba(34,211,238,.18)', badgeRadius: 14, pattern: 'linear-gradient(135deg, rgba(34,211,238,.18), rgba(249,115,22,.12))' },
  'sparkle garland': { borderRadius: 22, boxShadow: '0 0 0 3px rgba(220,38,38,.2)', badgeRadius: 999, pattern: 'radial-gradient(circle, rgba(220,38,38,.18) 0 3px, transparent 4px)' },
  'velvet edge': { borderRadius: 8, boxShadow: 'inset 0 0 0 4px rgba(127,29,29,.7)', badgeRadius: 4, pattern: 'linear-gradient(135deg, rgba(127,29,29,.24), transparent)' },
  'iridescent scales': { borderRadius: 28, boxShadow: '0 16px 36px rgba(14,116,144,.2)', badgeRadius: 999, pattern: 'radial-gradient(circle at 20% 20%, rgba(167,139,250,.32), transparent 18%), radial-gradient(circle at 80% 70%, rgba(34,211,238,.25), transparent 22%)' },
  'animal print': { borderRadius: 16, boxShadow: '0 18px 0 rgba(69,26,3,.12)', badgeRadius: 12, pattern: 'radial-gradient(ellipse at 20% 30%, rgba(69,26,3,.2) 0 7%, transparent 8%)' },
  'thin line': { borderRadius: 4, boxShadow: 'none', badgeRadius: 2, pattern: 'linear-gradient(90deg, rgba(15,23,42,.08) 1px, transparent 1px)' },
};

const PROFILE_FIELDS = [
  { id: 'shopName', label: 'Shop Name', placeholder: 'Your shop name' },
  { id: 'tagline', label: 'Tagline', placeholder: 'A short, memorable tagline' },
  { id: 'about', label: 'About / Bio', placeholder: 'Tell clients what makes your shop special', type: 'textarea' },
  { id: 'contactEmail', label: 'Contact Email', placeholder: 'hello@yourshop.com', inputMode: 'email' },
  { id: 'phone', label: 'Phone', placeholder: '(555) 123-4567', inputMode: 'tel' },
  { id: 'location', label: 'Location / Service Area', placeholder: 'City, neighborhood, or service area' },
  { id: 'instagram', label: 'Instagram', placeholder: '@yourhandle' },
  { id: 'tiktok', label: 'TikTok', placeholder: '@yourhandle' },
  { id: 'website', label: 'Website', placeholder: 'yourshop.com' },
  { id: 'bookingLink', label: 'Booking Link', placeholder: 'Paste or describe your booking destination' },
];

const BRAND_FIELDS = [
  { id: 'primaryColor', label: 'Primary Color' },
  { id: 'accentColor', label: 'Accent Color' },
];

const SERVICE_CATEGORIES = [
  'Full Set',
  'Fill-In',
  'Gel Manicure',
  'Press-On Set',
  'Pedicure',
  'Custom Design',
  'Add-On',
];

export const NAIL_SHOP_SERVICES_STORAGE_KEY = 'nailBoss.nailShop.services.v1';

const DEFAULT_SERVICES = [
  {
    id: 'classic-full-set',
    name: 'Classic Full Set',
    description: '',
    category: 'Full Set',
    startingPrice: 55,
    estimatedTime: '120 min',
    active: true,
  },
  {
    id: 'fill-in',
    name: 'Fill-In',
    description: '',
    category: 'Fill-In',
    startingPrice: 35,
    estimatedTime: '75 min',
    active: true,
  },
  {
    id: 'custom-press-on-set',
    name: 'Custom Press-On Set',
    description: '',
    category: 'Press-On Set',
    startingPrice: 45,
    estimatedTime: '3 business days',
    active: true,
  },
];


export const NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY = 'nailBoss.nailShop.pricingLibrary.v1';

const DEFAULT_PRICING_LIBRARY = {
  lengthPricing: { label: 'Length Pricing', unit: '$', rows: [
    { id: 'length-medium', name: 'Medium', amount: 0 },
    { id: 'length-long', name: 'Long', amount: 10 },
    { id: 'length-xl', name: 'XL', amount: 15 },
    { id: 'length-xxl', name: 'XXL', amount: 20 },
  ] },
  finishPricing: { label: 'Finish Pricing', unit: '$', rows: [
    { id: 'finish-cream', name: 'Cream', amount: 0 },
    { id: 'finish-jelly', name: 'Jelly', amount: 5 },
    { id: 'finish-milky', name: 'Milky', amount: 5 },
    { id: 'finish-matte', name: 'Matte', amount: 5 },
    { id: 'finish-chrome', name: 'Chrome', amount: 10 },
    { id: 'finish-cat-eye', name: 'Cat Eye', amount: 8 },
    { id: 'finish-marble', name: 'Marble', amount: 12 },
    { id: 'finish-french-tip', name: 'French Tip', amount: 5 },
  ] },
  nailArtPricing: { label: 'Nail Art Pricing', unit: '$', rows: [
    { id: 'art-basic', name: 'Basic Art', amount: 5 },
    { id: 'art-advanced', name: 'Advanced Art', amount: 15 },
    { id: 'art-character', name: 'Character Art', amount: 30 },
  ] },
  embellishmentPricing: { label: 'Embellishment Pricing', unit: '$', rows: [
    { id: 'embellishment-charm', name: 'Charm', amount: 5 },
    { id: 'embellishment-luxury-charm', name: 'Luxury Charm', amount: 10 },
    { id: 'embellishment-jewel', name: 'Jewel', amount: 3 },
    { id: 'embellishment-3d-gel', name: '3D Gel', amount: 10 },
    { id: 'embellishment-decal-sticker', name: 'Decal / Sticker', amount: 2 },
  ] },
  timeAddOns: { label: 'Time Add-Ons', unit: 'min', rows: [
    { id: 'time-chrome', name: 'Chrome', amount: 15 },
    { id: 'time-french-tip', name: 'French Tip', amount: 10 },
    { id: 'time-advanced-art', name: 'Advanced Art', amount: 30 },
    { id: 'time-character-art', name: 'Character Art', amount: 60 },
    { id: 'time-charm-placement', name: 'Charm Placement', amount: 10 },
  ] },
};

const DEFAULT_DEPOSIT_PERCENT = 50;
const PRICING_CATEGORY_IDS = Object.keys(DEFAULT_PRICING_LIBRARY);


const COST_ENGINE_LENGTH_OPTIONS = ['Medium', 'Long', 'XL', 'XXL'];
const COST_ENGINE_FINISH_OPTIONS = ['Cream', 'Jelly', 'Milky', 'Matte', 'Chrome', 'Cat Eye', 'Marble', 'French Tip'];
const COST_ENGINE_ART_OPTIONS = ['None', 'Basic Art', 'Advanced Art', 'Character Art'];
const COST_ENGINE_EMBELLISHMENTS = [
  { id: 'charm', label: 'Charm', rowName: 'Charm' },
  { id: 'luxuryCharm', label: 'Luxury Charm', rowName: 'Luxury Charm' },
  { id: 'jewel', label: 'Jewel', rowName: 'Jewel' },
  { id: 'threeDGel', label: '3D Gel', rowName: '3D Gel' },
  { id: 'decalSticker', label: 'Decal / Sticker', rowName: 'Decal / Sticker' },
];

const EMPTY_COST_ENGINE_FORM = {
  serviceId: '',
  length: 'Medium',
  finish: 'Cream',
  artLevel: 'None',
  embellishments: COST_ENGINE_EMBELLISHMENTS.reduce((counts, item) => ({ ...counts, [item.id]: 0 }), {}),
};

const EMPTY_SERVICE_FORM = {
  name: '',
  description: '',
  category: SERVICE_CATEGORIES[0],
  startingPrice: '',
  estimatedTime: '',
  active: true,
};

const EMPTY_PROPOSAL_DRAFT_FORM = {
  clientName: '',
  clientContact: '',
  proposalTitle: '',
  proposalNotes: '',
  serviceType: '',
  proposedDate: '',
  customMessage: '',
};


export const NAIL_SHOP_POLICIES_STORAGE_KEY = 'nailBoss.nailShop.policies.v1';

const BUSINESS_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const CANCELLATION_WINDOWS = ['24 Hours', '48 Hours', '72 Hours', 'Custom Policy Text'];

const DEFAULT_POLICIES = {
  depositRules: {
    depositPercent: 25,
    minimumDepositAmount: 20,
    fullPaymentRequired: false,
  },
  cancellationPolicy: {
    window: '24 Hours',
    customText: '',
  },
  appointmentRules: {
    gracePeriodMinutes: 10,
    maxReschedules: 1,
    noShowFee: 25,
  },
  pressOnRules: {
    processingTimeDays: 5,
    rushOrderFee: 15,
    pickupAvailable: true,
    shippingAvailable: true,
  },
  businessHours: BUSINESS_DAYS.reduce((hours, day) => ({
    ...hours,
    [day]: {
      open: !['Saturday', 'Sunday'].includes(day),
      openTime: '09:00',
      closeTime: '17:00',
    },
  }), {}),
  bookingRequirements: {
    depositRequired: true,
    consultationRequired: false,
    sizingRequired: false,
    approvalRequired: false,
  },
};

export const NAIL_SHOP_PROFILE_STORAGE_KEY = 'nailBoss.nailShop.profile.v1';

const PROFILE_FIELD_IDS = [...PROFILE_FIELDS, ...BRAND_FIELDS].map((field) => field.id);

const friendly = (value, placeholder) => value.trim() || placeholder;
const safeColor = (value, fallback) => (/^#[0-9A-F]{6}$/i.test(value) ? value : fallback);

const normalizeProfile = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return DEFAULT_PROFILE;

  return PROFILE_FIELD_IDS.reduce((normalized, fieldId) => ({
    ...normalized,
    [fieldId]: typeof candidate[fieldId] === 'string' ? candidate[fieldId] : DEFAULT_PROFILE[fieldId],
  }), { ...DEFAULT_PROFILE });
};

const loadSavedProfile = () => {
  if (typeof window === 'undefined') return DEFAULT_PROFILE;

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_PROFILE_STORAGE_KEY);
    return saved ? normalizeProfile(JSON.parse(saved)) : DEFAULT_PROFILE;
  } catch (error) {
    return DEFAULT_PROFILE;
  }
};

const persistProfile = (profileToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_PROFILE_STORAGE_KEY, JSON.stringify(normalizeProfile(profileToSave)));
  } catch (error) {
    // Keep the editor usable if browser storage is unavailable.
  }
};

const normalizePrice = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};


const clampPercent = (value) => {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
};

const normalizePricingAmount = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};


const normalizePolicyNumber = (value) => {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const normalizePolicies = (candidate) => {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const depositRules = source.depositRules && typeof source.depositRules === 'object' && !Array.isArray(source.depositRules) ? source.depositRules : {};
  const cancellationPolicy = source.cancellationPolicy && typeof source.cancellationPolicy === 'object' && !Array.isArray(source.cancellationPolicy) ? source.cancellationPolicy : {};
  const appointmentRules = source.appointmentRules && typeof source.appointmentRules === 'object' && !Array.isArray(source.appointmentRules) ? source.appointmentRules : {};
  const pressOnRules = source.pressOnRules && typeof source.pressOnRules === 'object' && !Array.isArray(source.pressOnRules) ? source.pressOnRules : {};
  const businessHours = source.businessHours && typeof source.businessHours === 'object' && !Array.isArray(source.businessHours) ? source.businessHours : {};
  const bookingRequirements = source.bookingRequirements && typeof source.bookingRequirements === 'object' && !Array.isArray(source.bookingRequirements) ? source.bookingRequirements : {};

  return {
    depositRules: {
      depositPercent: clampPercent(depositRules.depositPercent ?? DEFAULT_POLICIES.depositRules.depositPercent),
      minimumDepositAmount: normalizePolicyNumber(depositRules.minimumDepositAmount ?? DEFAULT_POLICIES.depositRules.minimumDepositAmount),
      fullPaymentRequired: typeof depositRules.fullPaymentRequired === 'boolean' ? depositRules.fullPaymentRequired : DEFAULT_POLICIES.depositRules.fullPaymentRequired,
    },
    cancellationPolicy: {
      window: CANCELLATION_WINDOWS.includes(cancellationPolicy.window) ? cancellationPolicy.window : DEFAULT_POLICIES.cancellationPolicy.window,
      customText: typeof cancellationPolicy.customText === 'string' ? cancellationPolicy.customText : DEFAULT_POLICIES.cancellationPolicy.customText,
    },
    appointmentRules: {
      gracePeriodMinutes: normalizePolicyNumber(appointmentRules.gracePeriodMinutes ?? DEFAULT_POLICIES.appointmentRules.gracePeriodMinutes),
      maxReschedules: normalizePolicyNumber(appointmentRules.maxReschedules ?? DEFAULT_POLICIES.appointmentRules.maxReschedules),
      noShowFee: normalizePolicyNumber(appointmentRules.noShowFee ?? DEFAULT_POLICIES.appointmentRules.noShowFee),
    },
    pressOnRules: {
      processingTimeDays: normalizePolicyNumber(pressOnRules.processingTimeDays ?? DEFAULT_POLICIES.pressOnRules.processingTimeDays),
      rushOrderFee: normalizePolicyNumber(pressOnRules.rushOrderFee ?? DEFAULT_POLICIES.pressOnRules.rushOrderFee),
      pickupAvailable: typeof pressOnRules.pickupAvailable === 'boolean' ? pressOnRules.pickupAvailable : DEFAULT_POLICIES.pressOnRules.pickupAvailable,
      shippingAvailable: typeof pressOnRules.shippingAvailable === 'boolean' ? pressOnRules.shippingAvailable : DEFAULT_POLICIES.pressOnRules.shippingAvailable,
    },
    businessHours: BUSINESS_DAYS.reduce((normalized, day) => {
      const hours = businessHours[day] && typeof businessHours[day] === 'object' && !Array.isArray(businessHours[day]) ? businessHours[day] : {};
      normalized[day] = {
        open: typeof hours.open === 'boolean' ? hours.open : DEFAULT_POLICIES.businessHours[day].open,
        openTime: typeof hours.openTime === 'string' ? hours.openTime : DEFAULT_POLICIES.businessHours[day].openTime,
        closeTime: typeof hours.closeTime === 'string' ? hours.closeTime : DEFAULT_POLICIES.businessHours[day].closeTime,
      };
      return normalized;
    }, {}),
    bookingRequirements: {
      depositRequired: typeof bookingRequirements.depositRequired === 'boolean' ? bookingRequirements.depositRequired : DEFAULT_POLICIES.bookingRequirements.depositRequired,
      consultationRequired: typeof bookingRequirements.consultationRequired === 'boolean' ? bookingRequirements.consultationRequired : DEFAULT_POLICIES.bookingRequirements.consultationRequired,
      sizingRequired: typeof bookingRequirements.sizingRequired === 'boolean' ? bookingRequirements.sizingRequired : DEFAULT_POLICIES.bookingRequirements.sizingRequired,
      approvalRequired: typeof bookingRequirements.approvalRequired === 'boolean' ? bookingRequirements.approvalRequired : DEFAULT_POLICIES.bookingRequirements.approvalRequired,
    },
  };
};

const loadSavedPolicies = () => {
  if (typeof window === 'undefined') return normalizePolicies(DEFAULT_POLICIES);

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_POLICIES_STORAGE_KEY);
    return saved ? normalizePolicies(JSON.parse(saved)) : normalizePolicies(DEFAULT_POLICIES);
  } catch (error) {
    return normalizePolicies(DEFAULT_POLICIES);
  }
};

const persistPolicies = (policiesToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_POLICIES_STORAGE_KEY, JSON.stringify(normalizePolicies(policiesToSave)));
  } catch (error) {
    // Keep the manager usable if browser storage is unavailable.
  }
};

const normalizePricingLibrary = (candidate) => {
  const source = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : {};
  const savedCategories = source.categories && typeof source.categories === 'object' && !Array.isArray(source.categories) ? source.categories : source;
  const categories = PRICING_CATEGORY_IDS.reduce((normalized, categoryId) => {
    const fallback = DEFAULT_PRICING_LIBRARY[categoryId];
    const rows = Array.isArray(savedCategories[categoryId]?.rows) ? savedCategories[categoryId].rows : fallback.rows;
    normalized[categoryId] = {
      ...fallback,
      rows: rows.map((row, index) => ({
        id: typeof row?.id === 'string' && row.id.trim() ? row.id : `${categoryId}-${Date.now()}-${index}`,
        name: typeof row?.name === 'string' ? row.name : fallback.rows[index]?.name || 'New Modifier',
        amount: normalizePricingAmount(row?.amount),
      })),
    };
    return normalized;
  }, {});

  return {
    categories,
    depositPercent: clampPercent(source.depositPercent ?? DEFAULT_DEPOSIT_PERCENT),
  };
};

const loadSavedPricingLibrary = () => {
  if (typeof window === 'undefined') return normalizePricingLibrary();

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY);
    return saved ? normalizePricingLibrary(JSON.parse(saved)) : normalizePricingLibrary();
  } catch (error) {
    return normalizePricingLibrary();
  }
};

const persistPricingLibrary = (pricingLibraryToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_PRICING_LIBRARY_STORAGE_KEY, JSON.stringify(normalizePricingLibrary(pricingLibraryToSave)));
  } catch (error) {
    // Keep the manager usable if browser storage is unavailable.
  }
};

const normalizeService = (candidate, index = 0) => {
  const fallback = DEFAULT_SERVICES[index] || DEFAULT_SERVICES[0];
  const service = candidate && typeof candidate === 'object' && !Array.isArray(candidate) ? candidate : fallback;
  const category = SERVICE_CATEGORIES.includes(service.category) ? service.category : fallback.category;

  return {
    id: typeof service.id === 'string' && service.id.trim() ? service.id : `service-${Date.now()}-${index}`,
    name: typeof service.name === 'string' ? service.name : fallback.name,
    description: typeof service.description === 'string' ? service.description : '',
    category,
    startingPrice: normalizePrice(service.startingPrice),
    estimatedTime: typeof service.estimatedTime === 'string' ? service.estimatedTime : fallback.estimatedTime,
    active: typeof service.active === 'boolean' ? service.active : true,
  };
};

const normalizeServices = (candidate) => {
  if (!Array.isArray(candidate)) return DEFAULT_SERVICES;
  return candidate.map((service, index) => normalizeService(service, index));
};

const loadSavedServices = () => {
  if (typeof window === 'undefined') return DEFAULT_SERVICES;

  try {
    const saved = window.localStorage.getItem(NAIL_SHOP_SERVICES_STORAGE_KEY);
    return saved ? normalizeServices(JSON.parse(saved)) : DEFAULT_SERVICES;
  } catch (error) {
    return DEFAULT_SERVICES;
  }
};

const persistServices = (servicesToSave) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(NAIL_SHOP_SERVICES_STORAGE_KEY, JSON.stringify(normalizeServices(servicesToSave)));
  } catch (error) {
    // Keep the manager usable if browser storage is unavailable.
  }
};


const parseMinutes = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : 0;
  if (typeof value !== 'string') return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const formatMoney = (value) => normalizePrice(value).toFixed(2).replace(/\.00$/, '');

const findModifierAmount = (pricingLibrary, categoryId, name) => {
  const rows = pricingLibrary?.categories?.[categoryId]?.rows;
  if (!Array.isArray(rows)) return 0;
  const row = rows.find((candidate) => candidate?.name === name);
  return normalizePricingAmount(row?.amount);
};

const calculateCostEngine = (form, services, pricingLibrary) => {
  const service = services.find((candidate) => candidate.id === form.serviceId) || services[0] || normalizeService();
  const breakdown = [{ label: 'Base Service', amount: normalizePrice(service.startingPrice) }];
  let suggestedPrice = breakdown[0].amount;
  let estimatedTime = parseMinutes(service.estimatedTime);

  const addPriceModifier = (label, categoryId, name, multiplier = 1) => {
    const amount = findModifierAmount(pricingLibrary, categoryId, name) * multiplier;
    if (amount > 0) breakdown.push({ label, amount });
    suggestedPrice += amount;
  };

  addPriceModifier(`${form.length} Length`, 'lengthPricing', form.length);
  addPriceModifier(form.finish, 'finishPricing', form.finish);
  if (form.artLevel !== 'None') addPriceModifier(form.artLevel, 'nailArtPricing', form.artLevel);

  COST_ENGINE_EMBELLISHMENTS.forEach((item) => {
    const count = Math.max(0, Number.parseInt(form.embellishments[item.id], 10) || 0);
    addPriceModifier(`${count} ${item.label}${count === 1 ? '' : 's'}`, 'embellishmentPricing', item.rowName, count);
  });

  estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', form.finish);
  if (form.artLevel !== 'None') estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', form.artLevel);
  const charmCount = Math.max(0, Number.parseInt(form.embellishments.charm, 10) || 0);
  estimatedTime += findModifierAmount(pricingLibrary, 'timeAddOns', 'Charm Placement') * charmCount;

  const depositPercent = clampPercent(pricingLibrary?.depositPercent ?? DEFAULT_DEPOSIT_PERCENT);

  return {
    service,
    breakdown,
    suggestedPrice,
    suggestedDeposit: suggestedPrice * (depositPercent / 100),
    estimatedTime,
    depositPercent,
  };
};


const hasText = (value) => typeof value === 'string' && value.trim().length > 0;

const describeDepositPolicy = (policies) => {
  const depositRules = normalizePolicies(policies).depositRules;
  if (depositRules.fullPaymentRequired) return 'Full payment is required to book.';
  return `${depositRules.depositPercent}% deposit required; minimum deposit $${formatMoney(depositRules.minimumDepositAmount)}.`;
};

const describeCancellationPolicy = (policies) => {
  const cancellationPolicy = normalizePolicies(policies).cancellationPolicy;
  if (cancellationPolicy.window === 'Custom Policy Text') {
    return cancellationPolicy.customText.trim() || 'Custom cancellation policy not added yet.';
  }
  return `${cancellationPolicy.window} cancellation notice requested.`;
};

const describeBookingRequirements = (policies) => {
  const requirements = normalizePolicies(policies).bookingRequirements;
  const enabled = [
    requirements.depositRequired ? 'deposit required' : '',
    requirements.consultationRequired ? 'consultation required' : '',
    requirements.sizingRequired ? 'sizing required' : '',
    requirements.approvalRequired ? 'artist approval required' : '',
  ].filter(Boolean);
  return enabled.length ? enabled.join(', ') : 'No booking requirements selected yet.';
};

const getProposalDraftData = ({ profile, calculation, policies, form = EMPTY_PROPOSAL_DRAFT_FORM }) => {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedPolicies = normalizePolicies(policies);
  const selectedServiceName = calculation.service?.name?.trim() || '';
  const serviceType = form.serviceType?.trim() || selectedServiceName;
  const suggestedPrice = calculation.suggestedPrice > 0 ? `$${formatMoney(calculation.suggestedPrice)}` : 'Pricing unavailable';
  const suggestedDeposit = calculation.suggestedDeposit > 0 ? `$${calculation.suggestedDeposit.toFixed(2)}` : 'Pricing unavailable';
  const estimatedTime = calculation.estimatedTime > 0 ? `${calculation.estimatedTime} min` : 'Pricing unavailable';
  const depositPolicy = hasText(describeDepositPolicy(normalizedPolicies)) ? describeDepositPolicy(normalizedPolicies) : 'Policy not set';
  const cancellationPolicy = hasText(describeCancellationPolicy(normalizedPolicies)) ? describeCancellationPolicy(normalizedPolicies) : 'Policy not set';
  const bookingRequirements = hasText(describeBookingRequirements(normalizedPolicies)) ? describeBookingRequirements(normalizedPolicies) : 'Policy not set';

  return {
    clientName: form.clientName?.trim() || 'Client not set',
    clientContact: form.clientContact?.trim() || 'Client not set',
    proposalTitle: form.proposalTitle?.trim() || `Draft proposal for ${serviceType || 'Service not selected'}`,
    proposalNotes: form.proposalNotes?.trim() || 'What’s included not added yet.',
    serviceType: serviceType || 'Service not selected',
    selectedService: selectedServiceName || 'Service not selected',
    proposedDate: form.proposedDate?.trim() || 'Turnaround not set',
    customMessage: form.customMessage?.trim() || 'No custom message added.',
    shopName: normalizedProfile.shopName?.trim() || 'Shop name not added yet',
    businessContact: [normalizedProfile.contactEmail, normalizedProfile.phone].filter(hasText).join(' / ') || 'Business contact not added yet',
    suggestedPrice,
    suggestedDeposit,
    estimatedTime,
    depositPolicy,
    cancellationPolicy,
    bookingRequirements,
  };
};

const formatProposalDraftText = (draftData) => ([
  'Internal Proposal Draft — not sent, saved, or converted to a proposal record.',
  `Client: ${draftData.clientName}`,
  `Client contact: ${draftData.clientContact}`,
  `Proposal title: ${draftData.proposalTitle}`,
  `Shop name: ${draftData.shopName}`,
  `Business contact: ${draftData.businessContact}`,
  `Selected service: ${draftData.selectedService}`,
  `Service type: ${draftData.serviceType}`,
  `Suggested price: ${draftData.suggestedPrice}`,
  `Suggested deposit: ${draftData.suggestedDeposit}`,
  `Estimated time: ${draftData.estimatedTime}`,
  `Proposed date / turnaround: ${draftData.proposedDate}`,
  `Deposit policy: ${draftData.depositPolicy}`,
  `Cancellation policy: ${draftData.cancellationPolicy}`,
  `Booking requirements: ${draftData.bookingRequirements}`,
  `Notes / what’s included: ${draftData.proposalNotes}`,
  `Custom message: ${draftData.customMessage}`,
]).join('\n');

const buildProposalDraftSummary = ({ profile, calculation, policies }) => {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedPolicies = normalizePolicies(policies);
  const contact = [normalizedProfile.contactEmail, normalizedProfile.phone].filter(hasText).join(' / ') || 'Business contact not added yet';

  return [
    'Proposal Draft Summary (internal preview only)',
    `Shop name: ${friendly(normalizedProfile.shopName, 'Shop name not added yet')}`,
    `Selected service: ${friendly(calculation.service?.name || '', 'No service selected yet')}`,
    `Suggested price: $${formatMoney(calculation.suggestedPrice)}`,
    `Suggested deposit: $${calculation.suggestedDeposit.toFixed(2)}`,
    `Estimated time: ${calculation.estimatedTime ? `${calculation.estimatedTime} min` : 'Estimated time not available yet'}`,
    `Deposit policy: ${describeDepositPolicy(normalizedPolicies)}`,
    `Cancellation policy: ${describeCancellationPolicy(normalizedPolicies)}`,
    `Booking requirements: ${describeBookingRequirements(normalizedPolicies)}`,
    `Business contact: ${contact}`,
  ].join('\n');
};

const buildProposalReadiness = ({ profile, services, pricingLibrary, calculation, policies }) => {
  const normalizedProfile = normalizeProfile(profile);
  const normalizedServices = normalizeServices(services);
  const normalizedPricingLibrary = normalizePricingLibrary(pricingLibrary);
  const normalizedPolicies = normalizePolicies(policies);
  const activeServices = normalizedServices.filter((service) => service.active);
  const modifierCount = PRICING_CATEGORY_IDS.reduce((count, categoryId) => (
    count + (normalizedPricingLibrary.categories[categoryId]?.rows || []).filter((row) => hasText(row.name)).length
  ), 0);
  const bookingRequirements = describeBookingRequirements(normalizedPolicies);
  const checklist = [
    {
      id: 'business-profile',
      label: 'Business Profile',
      ready: hasText(normalizedProfile.shopName) && (hasText(normalizedProfile.contactEmail) || hasText(normalizedProfile.phone)),
      detail: 'Ready when shop name plus email or phone exists.',
    },
    {
      id: 'service-menu',
      label: 'Service Menu',
      ready: activeServices.length > 0,
      detail: 'Ready when at least one active service exists.',
    },
    {
      id: 'pricing-library',
      label: 'Pricing Library',
      ready: modifierCount > 0 && normalizedPricingLibrary.depositPercent >= 0 && normalizedPricingLibrary.depositPercent <= 100,
      detail: 'Ready when pricing modifiers exist and deposit percent is valid.',
    },
    {
      id: 'cost-engine',
      label: 'Cost Engine',
      ready: Boolean(calculation.service?.id) && calculation.suggestedPrice > 0 && calculation.suggestedDeposit >= 0 && calculation.estimatedTime > 0,
      detail: 'Ready when current sandbox calculation has service, suggested price, deposit, and estimated time.',
    },
    {
      id: 'policies',
      label: 'Policies',
      ready: Boolean(normalizedPolicies.depositRules) && hasText(describeCancellationPolicy(normalizedPolicies)) && hasText(bookingRequirements),
      detail: 'Ready when deposit rules, cancellation policy, and booking requirements exist.',
    },
  ];

  return {
    checklist,
    ready: checklist.every((item) => item.ready),
  };
};

const serviceToForm = (service) => ({
  name: service.name,
  description: service.description,
  category: service.category,
  startingPrice: String(service.startingPrice),
  estimatedTime: service.estimatedTime,
  active: service.active,
});

const formToService = (form, existingId) => normalizeService({
  ...form,
  id: existingId || `service-${Date.now()}`,
  startingPrice: normalizePrice(form.startingPrice),
});

export default function NailShop() {
  const [profile, setProfile] = useState(loadSavedProfile);
  const [saveMessage, setSaveMessage] = useState('');
  const [services, setServices] = useState(loadSavedServices);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [serviceMessage, setServiceMessage] = useState('');
  const [pricingLibrary, setPricingLibrary] = useState(loadSavedPricingLibrary);
  const [pricingMessage, setPricingMessage] = useState('');
  const [costEngineForm, setCostEngineForm] = useState(EMPTY_COST_ENGINE_FORM);
  const [policies, setPolicies] = useState(loadSavedPolicies);
  const [policiesMessage, setPoliciesMessage] = useState('');
  const [proposalCopyMessage, setProposalCopyMessage] = useState('');
  const [proposalDraftForm, setProposalDraftForm] = useState(EMPTY_PROPOSAL_DRAFT_FORM);
  const [generatedProposalDraft, setGeneratedProposalDraft] = useState(null);
  const [proposalDraftMessage, setProposalDraftMessage] = useState('');
  const [activeSection, setActiveSection] = useState('profile');
  const [selectedBlueprintThemeId, setSelectedBlueprintThemeId] = useState('classic');
  const [blueprintThemeOverrides, setBlueprintThemeOverrides] = useState({});

  const updateProfile = (field, value) => {
    setSaveMessage('');
    setProfile((current) => ({ ...current, [field]: value }));
  };

  const saveProfile = () => {
    persistProfile(profile);
    setProfile((current) => normalizeProfile(current));
    setSaveMessage('Shop saved.');
  };

  const resetProfile = () => {
    setProfile(DEFAULT_PROFILE);
    persistProfile(DEFAULT_PROFILE);
    setSaveMessage('Shop reset to defaults.');
  };

  const updateServiceForm = (field, value) => {
    setServiceMessage('');
    setServiceForm((current) => ({ ...current, [field]: value }));
  };

  const saveService = () => {
    const nextService = formToService(serviceForm, editingServiceId);
    const nextServices = editingServiceId
      ? services.map((service) => (service.id === editingServiceId ? nextService : service))
      : [...services, nextService];
    const normalized = normalizeServices(nextServices);
    setServices(normalized);
    persistServices(normalized);
    setServiceForm(EMPTY_SERVICE_FORM);
    setEditingServiceId(null);
    setServiceMessage(editingServiceId ? 'Service updated.' : 'Service added.');
  };

  const editService = (service) => {
    setEditingServiceId(service.id);
    setServiceForm(serviceToForm(service));
    setServiceMessage('Editing service.');
  };

  const cancelServiceEditing = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setServiceMessage('Service editing canceled.');
  };

  const deleteService = (serviceId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this service?')) return;
    const nextServices = services.filter((service) => service.id !== serviceId);
    setServices(nextServices);
    persistServices(nextServices);
    if (editingServiceId === serviceId) cancelServiceEditing();
    setServiceMessage('Service deleted.');
  };

  const toggleServiceActive = (serviceId) => {
    const nextServices = services.map((service) => (
      service.id === serviceId ? { ...service, active: !service.active } : service
    ));
    setServices(nextServices);
    persistServices(nextServices);
    setServiceMessage('Service status updated.');
  };


  const updatePricingRow = (categoryId, rowId, field, value) => {
    setPricingMessage('');
    setPricingLibrary((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [categoryId]: {
          ...current.categories[categoryId],
          rows: current.categories[categoryId].rows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)),
        },
      },
    }));
  };

  const addPricingRow = (categoryId) => {
    setPricingMessage('');
    setPricingLibrary((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [categoryId]: {
          ...current.categories[categoryId],
          rows: [...current.categories[categoryId].rows, { id: `${categoryId}-${Date.now()}`, name: 'New Modifier', amount: 0 }],
        },
      },
    }));
  };

  const deletePricingRow = (categoryId, rowId) => {
    setPricingMessage('');
    setPricingLibrary((current) => ({
      ...current,
      categories: {
        ...current.categories,
        [categoryId]: {
          ...current.categories[categoryId],
          rows: current.categories[categoryId].rows.filter((row) => row.id !== rowId),
        },
      },
    }));
  };

  const savePricingLibrary = () => {
    const normalized = normalizePricingLibrary(pricingLibrary);
    setPricingLibrary(normalized);
    persistPricingLibrary(normalized);
    setPricingMessage('Pricing library saved.');
  };


  const updatePolicySection = (section, field, value) => {
    setPoliciesMessage('');
    setPolicies((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const updateBusinessHours = (day, field, value) => {
    setPoliciesMessage('');
    setPolicies((current) => ({
      ...current,
      businessHours: {
        ...current.businessHours,
        [day]: {
          ...current.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  const savePolicies = () => {
    const normalized = normalizePolicies(policies);
    setPolicies(normalized);
    persistPolicies(normalized);
    setPoliciesMessage('Policies saved.');
  };

  const resetPolicies = () => {
    const defaults = normalizePolicies(DEFAULT_POLICIES);
    setPolicies(defaults);
    persistPolicies(defaults);
    setPoliciesMessage('Policies reset to defaults.');
  };

  const normalizedServices = normalizeServices(services);
  const normalizedPricingLibrary = normalizePricingLibrary(pricingLibrary);
  const costEngineServiceId = costEngineForm.serviceId || normalizedServices[0]?.id || '';
  const costEngineCalculation = calculateCostEngine({ ...costEngineForm, serviceId: costEngineServiceId }, normalizedServices, normalizedPricingLibrary);
  const proposalReadiness = buildProposalReadiness({
    profile,
    services: normalizedServices,
    pricingLibrary: normalizedPricingLibrary,
    calculation: costEngineCalculation,
    policies,
  });
  const proposalDraftSummary = buildProposalDraftSummary({ profile, calculation: costEngineCalculation, policies });
  const liveProposalDraftData = getProposalDraftData({ profile, calculation: costEngineCalculation, policies, form: proposalDraftForm });
  const proposalDraftPreviewData = generatedProposalDraft || liveProposalDraftData;
  const proposalDraftText = formatProposalDraftText(proposalDraftPreviewData);
  const blueprintThemes = getDefaultBlueprintThemes();
  const selectedDefaultBlueprintTheme = normalizeBlueprintTheme(blueprintThemes.find((theme) => theme.themeId === selectedBlueprintThemeId));
  const selectedBlueprintTheme = createCustomBlueprintTheme(selectedDefaultBlueprintTheme, blueprintThemeOverrides);
  const blueprintTypography = BLUEPRINT_TYPOGRAPHY_STYLES[selectedBlueprintTheme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES[selectedDefaultBlueprintTheme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES['polished serif'];
  const blueprintAccent = BLUEPRINT_ACCENT_STYLES[selectedBlueprintTheme.accentStyle] || BLUEPRINT_ACCENT_STYLES[selectedDefaultBlueprintTheme.accentStyle] || BLUEPRINT_ACCENT_STYLES['soft frame'];
  const sampleBlueprint = createBlueprintFromDesign(FULL_SET_RENDERER_SAMPLE, {
    title: 'Shop Sample Blueprint',
    creatorSnapshot: {
      creatorName: friendly(profile.shopName, 'Nail Boss Creator'),
      shopName: friendly(profile.shopName, 'Nail Boss Studio'),
      contact: friendly(profile.contactEmail, 'Contact not set'),
      location: friendly(profile.location, 'Location not set'),
    },
    pricingGuidance: {
      suggestedPrice: costEngineCalculation.suggestedPrice,
      suggestedDeposit: costEngineCalculation.suggestedDeposit,
      estimatedTime: costEngineCalculation.estimatedTime ? `${costEngineCalculation.estimatedTime} min` : 'Not estimated',
      breakdown: costEngineCalculation.breakdown,
    },
    materials: { colors: ['Blush jelly', 'White cream', 'Gold jewel'], products: [], vendorReferences: [] },
    tags: ['preview-only', 'blueprint-engine', 'sample-set'],
    difficulty: 'Intermediate',
    collectionName: selectedBlueprintTheme.collectionLabel,
    theme: selectedBlueprintTheme,
  });
  const blueprintPreviewSummary = buildBlueprintPreviewSummary(sampleBlueprint);
  const blueprintContentSignature = getBlueprintContentSignature(sampleBlueprint);

  const updateBlueprintThemeOverride = (field, value) => {
    setBlueprintThemeOverrides((current) => ({ ...current, [field]: value }));
  };

  const selectBlueprintTheme = (themeId) => {
    const nextTheme = normalizeBlueprintTheme(blueprintThemes.find((theme) => theme.themeId === themeId));
    setSelectedBlueprintThemeId(themeId);
    setBlueprintThemeOverrides({
      primaryColor: nextTheme.primaryColor,
      accentColor: nextTheme.accentColor,
      backgroundColor: nextTheme.backgroundColor,
      textColor: nextTheme.textColor,
      typographyStyle: nextTheme.typographyStyle,
      accentStyle: nextTheme.accentStyle,
      collectionLabel: nextTheme.collectionLabel,
      themeName: `${nextTheme.themeName} Custom`,
    });
  };

  const resetBlueprintThemeBuilder = () => {
    setBlueprintThemeOverrides({});
  };

  const updateCostEngineField = (field, value) => {
    setCostEngineForm((current) => ({ ...current, [field]: value }));
  };

  const updateCostEngineEmbellishment = (field, value) => {
    const count = Math.max(0, Number.parseInt(value, 10) || 0);
    setCostEngineForm((current) => ({
      ...current,
      embellishments: { ...current.embellishments, [field]: count },
    }));
  };

  const resetCostEngine = () => {
    setCostEngineForm(EMPTY_COST_ENGINE_FORM);
  };

  const updateProposalDraftForm = (field, value) => {
    setProposalDraftMessage('');
    setProposalCopyMessage('');
    setProposalDraftForm((current) => ({ ...current, [field]: value }));
  };

  const generateProposalDraft = () => {
    setGeneratedProposalDraft(liveProposalDraftData);
    setProposalDraftMessage('Draft generated locally. Nothing was sent or saved.');
    setProposalCopyMessage('');
  };

  const resetProposalDraft = () => {
    setProposalDraftForm(EMPTY_PROPOSAL_DRAFT_FORM);
    setGeneratedProposalDraft(null);
    setProposalDraftMessage('Draft reset.');
    setProposalCopyMessage('');
  };

  const copyProposalDraftText = async () => {
    setProposalCopyMessage('');
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setProposalCopyMessage('Clipboard unavailable. You can manually select and copy the draft text.');
      return;
    }

    try {
      await navigator.clipboard.writeText(proposalDraftText);
      setProposalCopyMessage('Draft text copied.');
    } catch (error) {
      setProposalCopyMessage('Copy failed safely. You can manually select and copy the draft text.');
    }
  };

  const copyProposalSummary = async () => {
    setProposalCopyMessage('');
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setProposalCopyMessage('Clipboard unavailable. You can manually select and copy the summary.');
      return;
    }

    try {
      await navigator.clipboard.writeText(proposalDraftSummary);
      setProposalCopyMessage('Proposal draft summary copied.');
    } catch (error) {
      setProposalCopyMessage('Copy failed safely. You can manually select and copy the summary.');
    }
  };

  const primaryColor = safeColor(profile.primaryColor, DEFAULT_PROFILE.primaryColor);
  const accentColor = safeColor(profile.accentColor, DEFAULT_PROFILE.accentColor);

  const shopSections = [
    { id: 'profile', label: 'Profile' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing Library' },
    { id: 'costEngine', label: 'Cost Engine' },
    { id: 'policies', label: 'Policies' },
    { id: 'proposalReadiness', label: 'Proposal Readiness' },
    { id: 'proposalDraft', label: 'Proposal Draft' },
    { id: 'fullSetRenderer', label: 'Full Set Renderer' },
    { id: 'blueprintEngine', label: 'Blueprint Engine' },
  ];

  const preview = {
    shopName: friendly(profile.shopName, 'Your nail shop name'),
    tagline: friendly(profile.tagline, 'Add a tagline to welcome clients.'),
    about: friendly(profile.about, 'Add a short bio so clients know your style, vibe, and specialties.'),
    contactEmail: friendly(profile.contactEmail, 'Email not added yet'),
    phone: friendly(profile.phone, 'Phone not added yet'),
    location: friendly(profile.location, 'Service area not added yet'),
    instagram: friendly(profile.instagram, 'Instagram not added yet'),
    tiktok: friendly(profile.tiktok, 'TikTok not added yet'),
    website: friendly(profile.website, 'Website not added yet'),
    bookingLink: friendly(profile.bookingLink, 'Booking link placeholder'),
  };

  return (
    <main style={styles.page} aria-labelledby="nail-shop-title">
      <section style={styles.hero}>
        <p style={styles.kicker}>Business workspace</p>
        <h1 id="nail-shop-title" style={styles.title}>Nail Shop</h1>
        <p style={styles.subtitle}>
          Start shaping a public-facing storefront profile for your nail business. This is frontend-only
          customization saved to this browser with localStorage, so it is safe to experiment without saving changes to a backend.
        </p>
      </section>

      <section style={styles.workspace} aria-label="Nail Shop profile customization">
        <aside style={styles.previewPanel} aria-label="Live storefront preview" data-testid="nail-shop-preview">
          <div style={{ ...styles.previewHero, background: primaryColor }}>
            <div style={{ ...styles.previewBadge, color: primaryColor, background: accentColor }}>
              Live Preview
            </div>
            <h2 style={styles.previewTitle}>{preview.shopName}</h2>
            <p style={styles.previewTagline}>{preview.tagline}</p>
          </div>

          <div style={styles.previewBody}>
            <section>
              <h3 style={styles.previewHeading}>About</h3>
              <p style={styles.previewText}>{preview.about}</p>
            </section>

            <section style={styles.previewCard}>
              <h3 style={styles.previewHeading}>Contact</h3>
              <p style={styles.previewLine}>Email: {preview.contactEmail}</p>
              <p style={styles.previewLine}>Phone: {preview.phone}</p>
              <p style={styles.previewLine}>Area: {preview.location}</p>
            </section>

            <section style={styles.previewCard}>
              <h3 style={styles.previewHeading}>Social links</h3>
              <p style={styles.previewLine}>Instagram: {preview.instagram}</p>
              <p style={styles.previewLine}>TikTok: {preview.tiktok}</p>
              <p style={styles.previewLine}>Website: {preview.website}</p>
            </section>

            <button type="button" style={{ ...styles.bookingButton, background: accentColor, color: primaryColor }}>
              {preview.bookingLink}
            </button>
          </div>
        </aside>

        <nav style={styles.sectionTabs} aria-label="Nail Shop sections" data-testid="nail-shop-section-tabs">
          {shopSections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              style={activeSection === section.id ? styles.activeTab : styles.sectionTab}
              aria-pressed={activeSection === section.id}
              data-testid={`nail-shop-tab-${section.id}`}
            >
              {section.label}
            </button>
          ))}
        </nav>

        {activeSection === 'profile' && (
        <form style={styles.editor} aria-label="Edit storefront profile">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Profile details</p>
              <h2 style={styles.sectionTitle}>Customize your storefront</h2>
            </div>
            <div style={styles.headerActions}>
              <button type="button" onClick={saveProfile} style={styles.saveButton} data-testid="nail-shop-save">
                Save Shop
              </button>
              <button type="button" onClick={resetProfile} style={styles.resetButton} data-testid="nail-shop-reset">
                Reset to Default
              </button>
            </div>
          </div>

          {saveMessage && (
            <div style={styles.saveMessage} role="status" data-testid="nail-shop-save-message">
              {saveMessage}
            </div>
          )}

          <div style={styles.fieldGrid}>
            {PROFILE_FIELDS.map((field) => (
              <label key={field.id} style={field.type === 'textarea' ? styles.fullField : styles.field}>
                <span style={styles.label}>{field.label}</span>
                {field.type === 'textarea' ? (
                  <textarea
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    style={{ ...styles.input, ...styles.textarea }}
                    data-testid={`nail-shop-${field.id}`}
                  />
                ) : (
                  <input
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    placeholder={field.placeholder}
                    inputMode={field.inputMode}
                    style={styles.input}
                    data-testid={`nail-shop-${field.id}`}
                  />
                )}
              </label>
            ))}
          </div>

          <div style={styles.brandGrid} aria-label="Brand colors">
            {BRAND_FIELDS.map((field) => (
              <label key={field.id} style={styles.colorField}>
                <span style={styles.label}>{field.label}</span>
                <span style={styles.colorControl}>
                  <input
                    type="color"
                    value={safeColor(profile[field.id], DEFAULT_PROFILE[field.id])}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    style={styles.colorInput}
                    data-testid={`nail-shop-${field.id}`}
                  />
                  <input
                    value={profile[field.id]}
                    onChange={(event) => updateProfile(field.id, event.target.value)}
                    style={styles.input}
                    aria-label={`${field.label} hex value`}
                  />
                </span>
              </label>
            ))}
          </div>
        </form>
        )}

        {activeSection === 'services' && (
        <section style={styles.servicePanel} aria-label="Service Menu Manager" data-testid="service-menu-manager">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Service Menu</p>
              <h2 style={styles.sectionTitle}>Manage shop services</h2>
            </div>
            <span style={styles.serviceCount}>{services.length} services</span>
          </div>

          {serviceMessage && (
            <div style={styles.saveMessage} role="status" data-testid="service-menu-message">
              {serviceMessage}
            </div>
          )}

          <div style={styles.serviceForm} data-testid="service-form">
            <label style={styles.fullField}>
              <span style={styles.label}>Service Name</span>
              <input value={serviceForm.name} onChange={(event) => updateServiceForm('name', event.target.value)} style={styles.input} data-testid="service-name-input" />
            </label>
            <label style={styles.fullField}>
              <span style={styles.label}>Description</span>
              <textarea value={serviceForm.description} onChange={(event) => updateServiceForm('description', event.target.value)} rows={3} style={{ ...styles.input, ...styles.serviceTextarea }} data-testid="service-description-input" />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Category</span>
              <select value={serviceForm.category} onChange={(event) => updateServiceForm('category', event.target.value)} style={styles.input} data-testid="service-category-select">
                {SERVICE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Starting Price</span>
              <input value={serviceForm.startingPrice} onChange={(event) => updateServiceForm('startingPrice', event.target.value)} inputMode="decimal" style={styles.input} data-testid="service-price-input" />
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Estimated Time</span>
              <input value={serviceForm.estimatedTime} onChange={(event) => updateServiceForm('estimatedTime', event.target.value)} placeholder="90 min" style={styles.input} data-testid="service-time-input" />
            </label>
            <label style={styles.toggleLabel}>
              <input type="checkbox" checked={serviceForm.active} onChange={(event) => updateServiceForm('active', event.target.checked)} data-testid="service-active-input" />
              Active service
            </label>
            <div style={styles.serviceActions}>
              <button type="button" onClick={saveService} style={styles.saveButton} data-testid="service-save-button">Save Service</button>
              <button type="button" onClick={cancelServiceEditing} style={styles.resetButton} data-testid="service-cancel-button">Cancel editing</button>
            </div>
          </div>

          <div style={styles.serviceList} data-testid="service-list">
            {services.map((service) => (
              <article key={service.id} style={styles.serviceCard} data-testid="service-card">
                <div style={styles.serviceCardHeader}>
                  <div>
                    <h3 style={styles.serviceName}>{service.name.trim() || 'Untitled Service'}</h3>
                    <p style={styles.serviceMeta}>{service.category} · ${normalizePrice(service.startingPrice)}+ · {service.estimatedTime.trim() || 'Time TBD'}</p>
                  </div>
                  <span style={service.active ? styles.activeBadge : styles.inactiveBadge} data-testid="service-status-badge">
                    {service.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {service.description.trim() && <p style={styles.serviceDescription}>{service.description}</p>}
                <div style={styles.serviceActions}>
                  <button type="button" onClick={() => editService(service)} style={styles.smallButton} data-testid="service-edit-button">Edit Service</button>
                  <button type="button" onClick={() => toggleServiceActive(service.id)} style={styles.smallButton} data-testid="service-toggle-button">{service.active ? 'Set Inactive' : 'Set Active'}</button>
                  <button type="button" onClick={() => deleteService(service.id)} style={styles.deleteButton} data-testid="service-delete-button">Delete Service</button>
                </div>
              </article>
            ))}
          </div>
        </section>
        )}

        {activeSection === 'costEngine' && (
        <section style={styles.costEnginePanel} aria-label="Cost Engine Sandbox" data-testid="cost-engine-sandbox">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Cost Engine Sandbox™</p>
              <h2 style={styles.sectionTitle}>Suggested pricing calculator</h2>
            </div>
            <button type="button" onClick={resetCostEngine} style={styles.resetButton} data-testid="cost-engine-reset-button">
              Reset Calculation
            </button>
          </div>

          <div style={styles.costEngineGrid}>
            <label style={styles.field}>
              <span style={styles.label}>Service</span>
              <select value={costEngineServiceId} onChange={(event) => updateCostEngineField('serviceId', event.target.value)} style={styles.input} data-testid="cost-engine-service-select">
                {normalizedServices.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Length</span>
              <select value={costEngineForm.length} onChange={(event) => updateCostEngineField('length', event.target.value)} style={styles.input} data-testid="cost-engine-length-select">
                {COST_ENGINE_LENGTH_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Finish</span>
              <select value={costEngineForm.finish} onChange={(event) => updateCostEngineField('finish', event.target.value)} style={styles.input} data-testid="cost-engine-finish-select">
                {COST_ENGINE_FINISH_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label style={styles.field}>
              <span style={styles.label}>Art Level</span>
              <select value={costEngineForm.artLevel} onChange={(event) => updateCostEngineField('artLevel', event.target.value)} style={styles.input} data-testid="cost-engine-art-select">
                {COST_ENGINE_ART_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div style={styles.embellishmentGrid} aria-label="Embellishments">
            {COST_ENGINE_EMBELLISHMENTS.map((item) => (
              <label key={item.id} style={styles.field}>
                <span style={styles.label}>{item.label} count</span>
                <input type="number" min="0" value={costEngineForm.embellishments[item.id]} onChange={(event) => updateCostEngineEmbellishment(item.id, event.target.value)} style={styles.input} data-testid={`cost-engine-${item.id}-count`} />
              </label>
            ))}
          </div>

          <div style={styles.costEngineResults}>
            <div style={styles.resultCard} data-testid="cost-engine-suggested-price"><span>Suggested Price</span><strong>${formatMoney(costEngineCalculation.suggestedPrice)}</strong></div>
            <div style={styles.resultCard} data-testid="cost-engine-suggested-deposit"><span>Suggested Deposit ({costEngineCalculation.depositPercent}%)</span><strong>${costEngineCalculation.suggestedDeposit.toFixed(2)}</strong></div>
            <div style={styles.resultCard} data-testid="cost-engine-estimated-time"><span>Estimated Time</span><strong>{costEngineCalculation.estimatedTime} min</strong></div>
          </div>

          <section style={styles.breakdownCard} aria-label="Price Breakdown" data-testid="cost-engine-breakdown">
            <h3 style={styles.serviceName}>Price Breakdown</h3>
            {costEngineCalculation.breakdown.map((item) => (
              <div key={item.label} style={styles.breakdownRow}><span>{item.label}</span><span>${formatMoney(item.amount)}</span></div>
            ))}
            <div style={styles.breakdownTotal}><span>Total</span><span>${formatMoney(costEngineCalculation.suggestedPrice)}</span></div>
          </section>
        </section>
        )}

        {activeSection === 'fullSetRenderer' && (
        <section style={styles.rendererPreviewPanel} aria-label="Full Set Renderer Preview" data-testid="full-set-renderer-preview-section">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Visual verification only</p>
              <h2 style={styles.sectionTitle}>Full Set Renderer Preview</h2>
              <p style={styles.readinessIntro}>Reusable renderer sandbox only. Not connected to proposals, blueprints, storefront products, gallery, or Design Studio state.</p>
            </div>
          </div>
          <div style={styles.rendererHeroShowcase}>
            <FullSetRenderer designData={FULL_SET_RENDERER_SAMPLE} mode="hero" compact />
          </div>
          <div style={styles.rendererHandRow} data-testid="full-set-renderer-horizontal-hands">
            <FullSetRenderer designData={FULL_SET_RENDERER_SAMPLE} mode="left" compact />
            <FullSetRenderer designData={FULL_SET_RENDERER_SAMPLE} mode="right" compact />
          </div>
          <div style={styles.rendererSupportingPreview}>
            <FullSetRenderer designData={FULL_SET_RENDERER_SAMPLE} mode="full" compact />
          </div>
        </section>
        )}

        {activeSection === 'pricing' && (
        <section style={styles.pricingPanel} aria-label="Pricing Library Manager" data-testid="pricing-library-manager">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Pricing Library</p>
              <h2 style={styles.sectionTitle}>Manage reusable pricing modifiers</h2>
            </div>
            <button type="button" onClick={savePricingLibrary} style={styles.saveButton} data-testid="pricing-library-save-button">
              Save Pricing Library
            </button>
          </div>

          {pricingMessage && <div style={styles.saveMessage} role="status" data-testid="pricing-library-message">{pricingMessage}</div>}

          <div style={styles.pricingCategoryGrid}>
            {PRICING_CATEGORY_IDS.map((categoryId) => {
              const category = pricingLibrary.categories[categoryId];
              return (
                <section key={categoryId} style={styles.pricingCategory} data-testid="pricing-library-category">
                  <div style={styles.pricingCategoryHeader}>
                    <h3 style={styles.serviceName}>{category.label}</h3>
                    <button type="button" onClick={() => addPricingRow(categoryId)} style={styles.smallButton} data-testid="pricing-add-modifier-button">Add Modifier</button>
                  </div>
                  {category.rows.map((row) => (
                    <div key={row.id} style={styles.pricingRow} data-testid="pricing-modifier-row">
                      <input value={row.name} onChange={(event) => updatePricingRow(categoryId, row.id, 'name', event.target.value)} aria-label={`${category.label} modifier name`} style={styles.input} />
                      <label style={styles.amountField}>
                        <span style={styles.amountPrefix}>{category.unit === '$' ? '$' : ''}</span>
                        <input value={row.amount} onChange={(event) => updatePricingRow(categoryId, row.id, 'amount', event.target.value)} inputMode="decimal" aria-label={`${row.name || category.label} amount`} style={styles.input} />
                        <span style={styles.amountSuffix}>{category.unit === 'min' ? 'min' : ''}</span>
                      </label>
                      <button type="button" onClick={() => deletePricingRow(categoryId, row.id)} style={styles.deleteButton} data-testid="pricing-delete-modifier-button">Delete Modifier</button>
                    </div>
                  ))}
                </section>
              );
            })}
          </div>

          <label style={styles.depositField}>
            <span style={styles.label}>Suggested Deposit Percent</span>
            <input value={pricingLibrary.depositPercent} onChange={(event) => setPricingLibrary((current) => ({ ...current, depositPercent: event.target.value }))} inputMode="decimal" style={styles.input} data-testid="pricing-deposit-percent-input" />
          </label>
        </section>
        )}

        {activeSection === 'policies' && (
        <section style={styles.policiesPanel} aria-label="Policies & Booking Rules Manager" data-testid="policies-booking-rules-manager">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Policies & Booking Rules</p>
              <h2 style={styles.sectionTitle}>Define how your shop operates</h2>
            </div>
            <div style={styles.headerActions}>
              <button type="button" onClick={savePolicies} style={styles.saveButton} data-testid="policies-save-button">Save Policies</button>
              <button type="button" onClick={resetPolicies} style={styles.resetButton} data-testid="policies-reset-button">Reset to Defaults</button>
            </div>
          </div>

          {policiesMessage && <div style={styles.saveMessage} role="status" data-testid="policies-message">{policiesMessage}</div>}

          <div style={styles.policyGrid}>
            <section style={styles.policyCard}>
              <h3 style={styles.serviceName}>Deposit Rules</h3>
              <label style={styles.field}><span style={styles.label}>Deposit Percent</span><input value={policies.depositRules.depositPercent} onChange={(event) => updatePolicySection('depositRules', 'depositPercent', event.target.value)} inputMode="decimal" style={styles.input} data-testid="policies-deposit-percent" /></label>
              <label style={styles.field}><span style={styles.label}>Minimum Deposit Amount</span><input value={policies.depositRules.minimumDepositAmount} onChange={(event) => updatePolicySection('depositRules', 'minimumDepositAmount', event.target.value)} inputMode="decimal" style={styles.input} data-testid="policies-minimum-deposit" /></label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.depositRules.fullPaymentRequired} onChange={(event) => updatePolicySection('depositRules', 'fullPaymentRequired', event.target.checked)} data-testid="policies-full-payment-required" />Full Payment Required</label>
            </section>

            <section style={styles.policyCard}>
              <h3 style={styles.serviceName}>Cancellation Policy</h3>
              <label style={styles.field}><span style={styles.label}>Cancellation Window</span><select value={policies.cancellationPolicy.window} onChange={(event) => updatePolicySection('cancellationPolicy', 'window', event.target.value)} style={styles.input} data-testid="policies-cancellation-window">{CANCELLATION_WINDOWS.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
              <label style={styles.fullField}><span style={styles.label}>Custom Policy Text</span><textarea value={policies.cancellationPolicy.customText} onChange={(event) => updatePolicySection('cancellationPolicy', 'customText', event.target.value)} rows={4} style={{ ...styles.input, ...styles.serviceTextarea }} data-testid="policies-custom-cancellation-text" /></label>
            </section>

            <section style={styles.policyCard}>
              <h3 style={styles.serviceName}>Appointment Rules</h3>
              <label style={styles.field}><span style={styles.label}>Grace Period Minutes</span><input value={policies.appointmentRules.gracePeriodMinutes} onChange={(event) => updatePolicySection('appointmentRules', 'gracePeriodMinutes', event.target.value)} inputMode="numeric" style={styles.input} data-testid="policies-grace-period" /></label>
              <label style={styles.field}><span style={styles.label}>Max Reschedules</span><input value={policies.appointmentRules.maxReschedules} onChange={(event) => updatePolicySection('appointmentRules', 'maxReschedules', event.target.value)} inputMode="numeric" style={styles.input} data-testid="policies-max-reschedules" /></label>
              <label style={styles.field}><span style={styles.label}>No-Show Fee</span><input value={policies.appointmentRules.noShowFee} onChange={(event) => updatePolicySection('appointmentRules', 'noShowFee', event.target.value)} inputMode="decimal" style={styles.input} data-testid="policies-no-show-fee" /></label>
            </section>

            <section style={styles.policyCard}>
              <h3 style={styles.serviceName}>Press-On Rules</h3>
              <label style={styles.field}><span style={styles.label}>Processing Time (days)</span><input value={policies.pressOnRules.processingTimeDays} onChange={(event) => updatePolicySection('pressOnRules', 'processingTimeDays', event.target.value)} inputMode="numeric" style={styles.input} data-testid="policies-processing-time" /></label>
              <label style={styles.field}><span style={styles.label}>Rush Order Fee</span><input value={policies.pressOnRules.rushOrderFee} onChange={(event) => updatePolicySection('pressOnRules', 'rushOrderFee', event.target.value)} inputMode="decimal" style={styles.input} data-testid="policies-rush-order-fee" /></label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.pressOnRules.pickupAvailable} onChange={(event) => updatePolicySection('pressOnRules', 'pickupAvailable', event.target.checked)} data-testid="policies-pickup-available" />Pickup Available</label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.pressOnRules.shippingAvailable} onChange={(event) => updatePolicySection('pressOnRules', 'shippingAvailable', event.target.checked)} data-testid="policies-shipping-available" />Shipping Available</label>
            </section>
          </div>

          <section style={styles.policyCard}>
            <h3 style={styles.serviceName}>Business Hours</h3>
            <div style={styles.businessHoursGrid}>
              {BUSINESS_DAYS.map((day) => (
                <div key={day} style={styles.businessHoursRow} data-testid="policies-business-hours-row">
                  <label style={styles.toggleLabel}><input type="checkbox" checked={policies.businessHours[day].open} onChange={(event) => updateBusinessHours(day, 'open', event.target.checked)} data-testid={`policies-${day.toLowerCase()}-open`} />{day}</label>
                  <input type="time" value={policies.businessHours[day].openTime} onChange={(event) => updateBusinessHours(day, 'openTime', event.target.value)} disabled={!policies.businessHours[day].open} aria-label={`${day} open time`} style={styles.input} />
                  <input type="time" value={policies.businessHours[day].closeTime} onChange={(event) => updateBusinessHours(day, 'closeTime', event.target.value)} disabled={!policies.businessHours[day].open} aria-label={`${day} close time`} style={styles.input} />
                </div>
              ))}
            </div>
          </section>

          <section style={styles.policyCard}>
            <h3 style={styles.serviceName}>Booking Requirements</h3>
            <div style={styles.requirementsGrid}>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.bookingRequirements.depositRequired} onChange={(event) => updatePolicySection('bookingRequirements', 'depositRequired', event.target.checked)} data-testid="policies-deposit-required" />Deposit Required</label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.bookingRequirements.consultationRequired} onChange={(event) => updatePolicySection('bookingRequirements', 'consultationRequired', event.target.checked)} data-testid="policies-consultation-required" />Consultation Required</label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.bookingRequirements.sizingRequired} onChange={(event) => updatePolicySection('bookingRequirements', 'sizingRequired', event.target.checked)} data-testid="policies-sizing-required" />Sizing Required</label>
              <label style={styles.toggleLabel}><input type="checkbox" checked={policies.bookingRequirements.approvalRequired} onChange={(event) => updatePolicySection('bookingRequirements', 'approvalRequired', event.target.checked)} data-testid="policies-approval-required" />Approval Required</label>
            </div>
          </section>
        </section>
        )}



        {activeSection === 'blueprintEngine' && (
        <section style={styles.blueprintPreviewPanel} aria-label="Blueprint Engine Preview" data-testid="blueprint-engine-preview-section">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Blueprint Engine Preview</p>
              <h2 style={styles.sectionTitle}>Blueprint = Content • Blueprint Theme = Presentation</h2>
              <p style={styles.readinessIntro}>Preview only. This does not publish to Gallery or Marketplace, create backend blueprint records, connect to Proposals, or connect to Design Studio.</p>
            </div>
            <span style={styles.needsSetupBadge}>Not published</span>
          </div>

          <div style={styles.blueprintBuilderGrid} data-testid="blueprint-theme-builder-controls">
            <label style={styles.depositField}>
              <span style={styles.label}>Default Theme Foundation</span>
              <select value={selectedBlueprintThemeId} onChange={(event) => selectBlueprintTheme(event.target.value)} style={styles.input} data-testid="blueprint-theme-selector">
                {blueprintThemes.map((theme) => <option key={theme.themeId} value={theme.themeId}>{theme.themeName}</option>)}
              </select>
            </label>
            <label style={styles.depositField}><span style={styles.label}>Collection Branding</span><input style={styles.input} value={selectedBlueprintTheme.collectionLabel} onChange={(event) => updateBlueprintThemeOverride('collectionLabel', event.target.value)} data-testid="blueprint-collection-branding" /></label>
            <label style={styles.depositField}><span style={styles.label}>Theme Name</span><input style={styles.input} value={selectedBlueprintTheme.themeName} onChange={(event) => updateBlueprintThemeOverride('themeName', event.target.value)} data-testid="blueprint-theme-name" /></label>
            {['primaryColor', 'accentColor', 'backgroundColor', 'textColor'].map((field) => (
              <label key={field} style={styles.depositField}>
                <span style={styles.label}>{field.replace('Color', ' Color')}</span>
                <input type="color" style={styles.colorInput} value={selectedBlueprintTheme[field]} onChange={(event) => updateBlueprintThemeOverride(field, event.target.value)} data-testid={`blueprint-${field}`} />
              </label>
            ))}
            <label style={styles.depositField}><span style={styles.label}>Typography Style</span><select style={styles.input} value={selectedBlueprintTheme.typographyStyle} onChange={(event) => updateBlueprintThemeOverride('typographyStyle', event.target.value)} data-testid="blueprint-typography-style">{Object.keys(BLUEPRINT_TYPOGRAPHY_STYLES).map((style) => <option key={style}>{style}</option>)}</select></label>
            <label style={styles.depositField}><span style={styles.label}>Accent Style</span><select style={styles.input} value={selectedBlueprintTheme.accentStyle} onChange={(event) => updateBlueprintThemeOverride('accentStyle', event.target.value)} data-testid="blueprint-accent-style">{Object.keys(BLUEPRINT_ACCENT_STYLES).map((style) => <option key={style}>{style}</option>)}</select></label>
            <button type="button" style={styles.secondaryButton} onClick={resetBlueprintThemeBuilder} data-testid="blueprint-theme-reset">Reset to default theme</button>
          </div>

          <article style={{ ...styles.blueprintThemeCard, background: `${blueprintAccent.pattern}, ${selectedBlueprintTheme.backgroundColor}`, color: selectedBlueprintTheme.textColor, borderColor: selectedBlueprintTheme.accentColor, borderRadius: blueprintAccent.borderRadius, boxShadow: blueprintAccent.boxShadow }} data-testid="blueprint-theme-preview-card" data-content-signature={blueprintContentSignature}>
            <div style={{ ...styles.blueprintCoverStrip, background: selectedBlueprintTheme.accentColor }} data-testid="blueprint-cover-style" />
            <div style={{ ...styles.previewBadge, background: selectedBlueprintTheme.accentColor, color: selectedBlueprintTheme.primaryColor, borderRadius: blueprintAccent.badgeRadius }}>{blueprintPreviewSummary.themeLine}</div>
            <h3 style={{ ...styles.blueprintPreviewTitle, ...blueprintTypography, color: selectedBlueprintTheme.primaryColor }}>{blueprintPreviewSummary.title}</h3>
            <p style={styles.serviceMeta}>{blueprintPreviewSummary.creatorLine}</p>
            <p style={styles.serviceDescription}>{blueprintPreviewSummary.designLine}</p>
            <div style={styles.blueprintSummaryGrid} data-testid="blueprint-preview-summary">
              <span><strong>Pricing:</strong> {blueprintPreviewSummary.priceLine}</span>
              <span><strong>Visibility:</strong> {blueprintPreviewSummary.visibilityLine}</span>
              <span><strong>Tags:</strong> {blueprintPreviewSummary.tagLine}</span>
              <span><strong>Accent:</strong> {selectedBlueprintTheme.accentStyle}</span>
              <span><strong>Typography:</strong> {selectedBlueprintTheme.typographyStyle}</span>
              <span><strong>Collection:</strong> {selectedBlueprintTheme.collectionLabel}</span>
            </div>
          </article>
        </section>
        )}

        {activeSection === 'proposalDraft' && (
        <section style={styles.proposalDraftPanel} aria-label="Proposal Draft Generator" data-testid="proposal-draft-section">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Internal draft only</p>
              <h2 style={styles.sectionTitle}>Proposal Draft Generator</h2>
              <p style={styles.readinessIntro}>Assemble a local-only proposal draft from Nail Shop data. This does not send, save, create proposal records, call proposal APIs, or connect to Design Studio or Blueprint.</p>
            </div>
            <span style={styles.needsSetupBadge}>Not sent</span>
          </div>

          {proposalDraftMessage && <div style={styles.saveMessage} role="status" data-testid="proposal-draft-message">{proposalDraftMessage}</div>}
          {proposalCopyMessage && <div style={styles.saveMessage} role="status" data-testid="proposal-draft-copy-message">{proposalCopyMessage}</div>}

          <div style={styles.proposalDraftGrid}>
            <label style={styles.field}><span style={styles.label}>Client Name</span><input value={proposalDraftForm.clientName} onChange={(event) => updateProposalDraftForm('clientName', event.target.value)} style={styles.input} data-testid="proposal-draft-client-name" /></label>
            <label style={styles.field}><span style={styles.label}>Client Email or Phone</span><input value={proposalDraftForm.clientContact} onChange={(event) => updateProposalDraftForm('clientContact', event.target.value)} style={styles.input} data-testid="proposal-draft-client-contact" /></label>
            <label style={styles.field}><span style={styles.label}>Proposal Title</span><input value={proposalDraftForm.proposalTitle} onChange={(event) => updateProposalDraftForm('proposalTitle', event.target.value)} style={styles.input} data-testid="proposal-draft-title" /></label>
            <label style={styles.field}><span style={styles.label}>Service Type</span><input value={proposalDraftForm.serviceType} onChange={(event) => updateProposalDraftForm('serviceType', event.target.value)} placeholder={proposalDraftPreviewData.selectedService} style={styles.input} data-testid="proposal-draft-service-type" /></label>
            <label style={styles.field}><span style={styles.label}>Proposed Date / Turnaround</span><input value={proposalDraftForm.proposedDate} onChange={(event) => updateProposalDraftForm('proposedDate', event.target.value)} style={styles.input} data-testid="proposal-draft-proposed-date" /></label>
            <label style={styles.fullField}><span style={styles.label}>Proposal Notes / What’s Included</span><textarea value={proposalDraftForm.proposalNotes} onChange={(event) => updateProposalDraftForm('proposalNotes', event.target.value)} rows={4} style={{ ...styles.input, ...styles.serviceTextarea }} data-testid="proposal-draft-notes" /></label>
            <label style={styles.fullField}><span style={styles.label}>Optional custom message</span><textarea value={proposalDraftForm.customMessage} onChange={(event) => updateProposalDraftForm('customMessage', event.target.value)} rows={3} style={{ ...styles.input, ...styles.serviceTextarea }} data-testid="proposal-draft-custom-message" /></label>
          </div>

          <div style={styles.headerActions}>
            <button type="button" onClick={generateProposalDraft} style={styles.saveButton} data-testid="proposal-draft-generate-button">Generate Draft</button>
            <button type="button" onClick={copyProposalDraftText} style={styles.smallButton} data-testid="proposal-draft-copy-button">Copy Draft Text</button>
            <button type="button" onClick={resetProposalDraft} style={styles.resetButton} data-testid="proposal-draft-reset-button">Reset Draft</button>
          </div>

          <section style={styles.draftSummaryCard} aria-label="Proposal Draft Preview" data-testid="proposal-draft-preview">
            <div>
              <p style={styles.kicker}>Full Set Hero Preview</p>
              <div style={styles.rendererHeroShowcase} data-testid="proposal-draft-full-set-hero-preview">
                <FullSetRenderer designData={FULL_SET_RENDERER_SAMPLE} mode="hero" compact />
              </div>
            </div>
            <pre style={styles.summaryPreview} data-testid="proposal-draft-text-preview">{proposalDraftText}</pre>
          </section>
        </section>
        )}

        {activeSection === 'proposalReadiness' && (
        <section style={styles.proposalReadinessPanel} aria-label="Proposal Readiness" data-testid="proposal-readiness-section">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Proposal Readiness™</p>
              <h2 style={styles.sectionTitle}>Proposal-ready setup summary</h2>
              <p style={styles.readinessIntro}>
                Internal-only readiness check for future professional proposals. This does not create a proposal,
                send anything externally, or connect to Proposals, Design Studio, or Blueprint.
              </p>
            </div>
            <span style={proposalReadiness.ready ? styles.readyBadge : styles.needsSetupBadge} data-testid="proposal-readiness-overall-status">
              {proposalReadiness.ready ? 'Proposal Ready' : 'Needs Setup'}
            </span>
          </div>

          <div style={styles.readinessChecklist} data-testid="proposal-readiness-checklist">
            {proposalReadiness.checklist.map((item) => (
              <article key={item.id} style={styles.readinessCard} data-testid="proposal-readiness-card">
                <div style={styles.readinessCardHeader}>
                  <h3 style={styles.serviceName}>{item.label}</h3>
                  <span style={item.ready ? styles.readyBadge : styles.needsSetupBadge}>
                    {item.ready ? 'Ready' : 'Needs Setup'}
                  </span>
                </div>
                <p style={styles.serviceMeta}>{item.detail}</p>
              </article>
            ))}
          </div>

          <section style={styles.draftSummaryCard} aria-label="Proposal Draft Summary preview" data-testid="proposal-draft-summary-preview">
            <div style={styles.panelHeader}>
              <div>
                <p style={styles.kicker}>Internal preview</p>
                <h3 style={styles.serviceName}>Proposal Draft Summary</h3>
              </div>
              <button type="button" onClick={copyProposalSummary} style={styles.saveButton} data-testid="proposal-copy-summary-button">
                Copy Summary
              </button>
            </div>
            {proposalCopyMessage && <div style={styles.saveMessage} role="status" data-testid="proposal-copy-message">{proposalCopyMessage}</div>}
            <pre style={styles.summaryPreview}>{proposalDraftSummary}</pre>
          </section>
        </section>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    width: '100%',
    padding: '32px',
  },
  hero: {
    maxWidth: 780,
    marginBottom: 28,
  },
  kicker: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '.08em',
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  title: {
    color: COLORS.plum,
    fontSize: 34,
    lineHeight: 1.1,
    margin: '0 0 10px',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 1.6,
    maxWidth: 680,
    margin: 0,
  },
  workspace: {
    alignItems: 'start',
    display: 'grid',
    gap: 18,
    gridTemplateColumns: '1fr',
    maxWidth: 1180,
  },
  visibleSection: {
    display: 'block',
  },
  hiddenSection: {
    display: 'none',
  },
  editor: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    padding: 22,
  },
  panelHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 16,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 22,
    margin: 0,
  },
  headerActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-end',
  },
  saveButton: {
    background: COLORS.plum,
    border: `1px solid ${COLORS.plum}`,
    borderRadius: 999,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
  },
  resetButton: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    cursor: 'pointer',
    fontWeight: 700,
    padding: '10px 14px',
    whiteSpace: 'nowrap',
  },
  saveMessage: {
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: 12,
    color: '#166534',
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 16,
    padding: '10px 12px',
  },
  fieldGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  field: {
    display: 'grid',
    gap: 7,
  },
  fullField: {
    display: 'grid',
    gap: 7,
    gridColumn: '1 / -1',
  },
  label: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 700,
  },
  input: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    color: COLORS.text,
    font: 'inherit',
    minHeight: 42,
    padding: '10px 12px',
    width: '100%',
  },
  textarea: {
    lineHeight: 1.5,
    minHeight: 104,
    resize: 'vertical',
  },
  brandGrid: {
    borderTop: `1px solid ${COLORS.border}`,
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    marginTop: 20,
    paddingTop: 20,
  },
  colorField: {
    display: 'grid',
    gap: 7,
  },
  colorControl: {
    alignItems: 'center',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '52px 1fr',
  },
  colorInput: {
    background: 'transparent',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    cursor: 'pointer',
    height: 42,
    padding: 4,
    width: 52,
  },
  previewPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    boxShadow: '0 18px 42px rgba(60,20,50,.1)',
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, .9fr) minmax(320px, 1.1fr)',
    overflow: 'hidden',
  },
  previewHero: {
    color: '#fff',
    padding: 24,
  },
  previewBadge: {
    borderRadius: 999,
    display: 'inline-flex',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '.08em',
    marginBottom: 42,
    padding: '6px 10px',
    textTransform: 'uppercase',
  },
  previewTitle: {
    fontSize: 32,
    lineHeight: 1.05,
    margin: '0 0 8px',
  },
  previewTagline: {
    fontSize: 15,
    lineHeight: 1.5,
    margin: 0,
    opacity: 0.9,
  },
  previewBody: {
    display: 'grid',
    gap: 16,
    padding: 22,
  },
  previewHeading: {
    color: COLORS.text,
    fontSize: 14,
    margin: '0 0 8px',
    textTransform: 'uppercase',
  },
  previewText: {
    color: COLORS.textMuted,
    lineHeight: 1.6,
    margin: 0,
  },
  previewCard: {
    background: COLORS.roseDim,
    borderRadius: 16,
    padding: 16,
  },
  previewLine: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    margin: '0 0 5px',
    overflowWrap: 'anywhere',
  },
  sectionTabs: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    boxShadow: '0 10px 30px rgba(60,20,50,.05)',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
  },
  sectionTab: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 14px',
  },
  activeTab: {
    background: COLORS.plum,
    border: `1px solid ${COLORS.plum}`,
    borderRadius: 999,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 800,
    padding: '10px 14px',
  },
  bookingButton: {
    border: 'none',
    borderRadius: 999,
    cursor: 'default',
    fontWeight: 800,
    padding: '13px 18px',
    width: '100%',
  },


  costEnginePanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  costEngineGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  },
  embellishmentGrid: {
    borderTop: `1px solid ${COLORS.border}`,
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    paddingTop: 16,
  },
  costEngineResults: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  },
  resultCard: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    color: COLORS.text,
    display: 'grid',
    gap: 6,
    padding: 16,
  },
  breakdownCard: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 8,
    padding: 16,
  },
  breakdownRow: {
    alignItems: 'center',
    color: COLORS.textMuted,
    display: 'flex',
    fontSize: 14,
    justifyContent: 'space-between',
  },
  breakdownTotal: {
    alignItems: 'center',
    borderTop: `1px solid ${COLORS.border}`,
    color: COLORS.text,
    display: 'flex',
    fontWeight: 800,
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 10,
  },
  blueprintPreviewPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  blueprintBuilderGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
  },
  colorInput: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 14,
    height: 44,
    padding: 4,
    width: '100%',
  },
  blueprintThemeCard: {
    border: '2px solid',
    borderRadius: 22,
    display: 'grid',
    gap: 12,
    padding: 22,
  },
  blueprintCoverStrip: {
    borderRadius: 999,
    height: 10,
    width: '100%',
  },
  blueprintPreviewTitle: {
    fontSize: 28,
    lineHeight: 1.1,
    margin: 0,
  },
  blueprintSummaryGrid: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  rendererPreviewPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    gridColumn: '1 / -1',
    padding: 20,
  },
  rendererHeroShowcase: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
  },
  rendererHandRow: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))',
    marginBottom: 16,
  },
  rendererSupportingPreview: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 14,
  },
  pricingPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  pricingCategoryGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  },
  pricingCategory: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 10,
    padding: 16,
  },
  pricingCategoryHeader: {
    alignItems: 'center',
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
  },
  pricingRow: {
    alignItems: 'center',
    display: 'grid',
    gap: 8,
    gridTemplateColumns: 'minmax(120px, 1fr) minmax(90px, 120px) auto',
  },
  amountField: {
    alignItems: 'center',
    display: 'grid',
    gap: 4,
    gridTemplateColumns: 'auto 1fr auto',
  },
  amountPrefix: {
    color: COLORS.textMuted,
    fontWeight: 800,
  },
  amountSuffix: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: 800,
  },
  depositField: {
    display: 'grid',
    gap: 7,
    maxWidth: 320,
  },
  policiesPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  policyGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  policyCard: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 12,
    padding: 16,
  },
  businessHoursGrid: {
    display: 'grid',
    gap: 10,
  },
  businessHoursRow: {
    alignItems: 'center',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'minmax(130px, 1fr) minmax(110px, 140px) minmax(110px, 140px)',
  },
  requirementsGrid: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  proposalDraftPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  proposalDraftGrid: {
    display: 'grid',
    gap: 14,
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  },
  proposalReadinessPanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  readinessIntro: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    margin: '8px 0 0',
    maxWidth: 720,
  },
  readinessChecklist: {
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  },
  readinessCard: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 8,
    padding: 16,
  },
  readinessCardHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 10,
    justifyContent: 'space-between',
  },
  readyBadge: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: 999,
    color: '#166534',
    fontSize: 11,
    fontWeight: 800,
    padding: '6px 10px',
    whiteSpace: 'nowrap',
  },
  needsSetupBadge: {
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: 999,
    color: '#9a3412',
    fontSize: 11,
    fontWeight: 800,
    padding: '6px 10px',
    whiteSpace: 'nowrap',
  },
  draftSummaryCard: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 12,
    padding: 16,
  },
  summaryPreview: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    color: COLORS.text,
    font: '13px/1.6 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    margin: 0,
    overflowX: 'auto',
    padding: 16,
    whiteSpace: 'pre-wrap',
  },
  servicePanel: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(60,20,50,.06)',
    display: 'grid',
    gap: 16,
    gridColumn: '1 / -1',
    padding: 22,
  },
  serviceCount: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    fontSize: 12,
    fontWeight: 800,
    padding: '7px 10px',
    whiteSpace: 'nowrap',
  },
  serviceForm: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 12,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    padding: 16,
  },
  serviceTextarea: {
    lineHeight: 1.5,
    minHeight: 78,
    resize: 'vertical',
  },
  toggleLabel: {
    alignItems: 'center',
    color: COLORS.text,
    display: 'flex',
    fontSize: 13,
    fontWeight: 700,
    gap: 8,
  },
  serviceActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceList: {
    display: 'grid',
    gap: 12,
  },
  serviceCard: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    padding: 16,
  },
  serviceCardHeader: {
    alignItems: 'flex-start',
    display: 'flex',
    gap: 12,
    justifyContent: 'space-between',
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 17,
    margin: '0 0 5px',
  },
  serviceMeta: {
    color: COLORS.textMuted,
    fontSize: 13,
    margin: 0,
  },
  serviceDescription: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 1.5,
    margin: '10px 0 0',
  },
  activeBadge: {
    background: '#dcfce7',
    border: '1px solid #86efac',
    borderRadius: 999,
    color: '#166534',
    fontSize: 11,
    fontWeight: 800,
    padding: '5px 9px',
  },
  inactiveBadge: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: 999,
    color: '#475569',
    fontSize: 11,
    fontWeight: 800,
    padding: '5px 9px',
  },
  smallButton: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.plum,
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    padding: '8px 10px',
  },
  deleteButton: {
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 999,
    color: '#be123c',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 800,
    padding: '8px 10px',
  },
};
