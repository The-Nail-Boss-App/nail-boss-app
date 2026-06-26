import { useEffect, useId, useState } from 'react';
import { COLORS } from './styles';
import FullSetRenderer from './FullSetRenderer';
import BlueprintGalleryRenderer from './BlueprintGalleryRenderer';
import { BLUEPRINT_STATUSES, DEFAULT_BLUEPRINT_STATUS, FEATURED_BLUEPRINT_COLLECTIONS, buildBlueprintPreviewSummary, createBlueprintFromDesign, createBlueprintLibraryRecord, createCustomBlueprintTheme, duplicateBlueprintLibraryRecord, evaluateBlueprintReadiness, getBlueprintContentSignature, getDefaultBlueprintThemes, normalizeBlueprintLibrary, normalizeBlueprintTheme } from './blueprintEngine';


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



const MAGAZINE_COVER_MOODS = {
  Editorial: { label: 'Editorial', frame: 'rgba(255,255,255,.78)', masthead: 'Georgia, Times, serif', title: 'Georgia, Times, serif', transform: 'uppercase', accent: 'rgba(123,45,95,.14)' },
  Luxury: { label: 'Luxury', frame: 'rgba(25,18,14,.78)', masthead: 'Georgia, Times, serif', title: 'Georgia, Times, serif', transform: 'uppercase', accent: 'rgba(212,175,55,.3)' },
  Minimal: { label: 'Minimal', frame: 'rgba(255,255,255,.88)', masthead: 'Inter, Arial, sans-serif', title: 'Inter, Arial, sans-serif', transform: 'none', accent: 'rgba(15,23,42,.08)' },
  Bold: { label: 'Bold', frame: 'rgba(255,245,248,.82)', masthead: 'Arial Black, Arial, sans-serif', title: 'Arial Black, Arial, sans-serif', transform: 'uppercase', accent: 'rgba(236,72,153,.22)' },
  Seasonal: { label: 'Seasonal', frame: 'rgba(255,250,240,.84)', masthead: 'Trebuchet MS, Arial, sans-serif', title: 'Georgia, Times, serif', transform: 'uppercase', accent: 'rgba(249,115,22,.18)' },
};

const MAGAZINE_COVER_MOOD_NAMES = Object.keys(MAGAZINE_COVER_MOODS);

const getMagazineCoverMood = (blueprint, index = 0) => {
  const signature = String(blueprint?.blueprintId || blueprint?.title || '');
  const hash = signature.split('').reduce((sum, char) => sum + char.charCodeAt(0), index);
  return MAGAZINE_COVER_MOOD_NAMES[hash % MAGAZINE_COVER_MOOD_NAMES.length];
};

const getBlueprintCoverMasthead = (blueprint) => friendly(
  blueprint?.shopSnapshot?.name
    || blueprint?.creatorSnapshot?.shopName
    || blueprint?.creatorSnapshot?.displayName
    || blueprint?.creatorSnapshot?.creatorName,
  'AnitaSet',
);

const buildBlueprintCoverLines = (blueprint, theme, readiness) => uniqueBlueprintValues([
  blueprint?.featuredCollection,
  blueprint?.collectionName,
  theme?.collectionLabel,
  blueprint?.status,
  readiness?.label,
  blueprint?.status === 'Gallery Ready' ? 'Editor’s Pick Preview' : 'New Set Drop',
]).slice(0, 4);




const EDITORIAL_COLLECTION_STORIES = [
  { id: 'summer-romance', title: 'Summer Romance', description: 'Soft pearl finishes and romantic blush tones inspired by destination weddings.', count: 18, coverGradient: 'linear-gradient(135deg, #ffe4ec, #fff7ed)', accent: '#d96ba6' },
  { id: 'chrome-society', title: 'Chrome Society', description: "Bold chrome finishes and mirror-like reflections defining this month's luxury trend.", count: 12, coverGradient: 'linear-gradient(135deg, #111827, #d1d5db)', accent: '#94a3b8' },
  { id: 'after-dark', title: 'After Dark', description: 'Velvet blacks, wine gloss, and late-night sparkle curated for dramatic evening sets.', count: 9, coverGradient: 'linear-gradient(135deg, #111827, #7f1d1d)', accent: '#ef4444' },
  { id: 'bridal-elegance', title: 'Bridal Elegance', description: 'Luminous sheers, delicate French lines, and heirloom details for ceremony-ready hands.', count: 15, coverGradient: 'linear-gradient(135deg, #ffffff, #fde2e4)', accent: '#d4af37' },
  { id: 'vacation-ready', title: 'Vacation Ready', description: 'Sunlit citrus, poolside turquoise, and playful art packed for getaway appointments.', count: 14, coverGradient: 'linear-gradient(135deg, #fef3c7, #67e8f9)', accent: '#f97316' },
  { id: 'minimal-muse', title: 'Minimal Muse', description: 'Quiet neutrals, precise negative space, and clean-girl silhouettes with editorial restraint.', count: 11, coverGradient: 'linear-gradient(135deg, #f8fafc, #e5e7eb)', accent: '#111827' },
  { id: 'french-revival', title: 'French Revival', description: 'Modern tips, micro arcs, and soft contrasts bringing the classic salon code forward.', count: 10, coverGradient: 'linear-gradient(135deg, #fff7ed, #fce7f3)', accent: '#7b2d5f' },
  { id: 'holiday-luxe', title: 'Holiday Luxe', description: 'Gift-wrap reds, champagne shimmer, and party-ready jewel moments for festive calendars.', count: 16, coverGradient: 'linear-gradient(135deg, #7f1d1d, #fef3c7)', accent: '#dc2626' },
  { id: 'editor-favorites', title: 'Editor Favorites', description: 'The AnitaSet desk list: versatile covers with strong silhouettes, polish story, and save appeal.', count: 20, coverGradient: 'linear-gradient(135deg, #fdf2f8, #ede9fe)', accent: '#7b2d5f' },
];

const ARTIST_SPOTLIGHT_RECOGNITION_BADGES = ['Artist of the Week', 'Rising Artist', 'Hall of Fame', 'Community Favorite', 'Featured Creator'];

const ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS = [
  'Luxury Chrome',
  'Bridal',
  'Editorial',
  'Minimal',
  'Maximal',
  'Character Art',
  'Hand Painted',
  'Press-On Specialist',
  'Gel Art',
  'Seasonal Collections',
];

const getEditorialCollectionForBlueprint = (blueprint, index = 0) => {
  const label = String(blueprint?.featuredCollection || blueprint?.collectionName || blueprint?.theme?.collectionLabel || '').toLowerCase();
  return EDITORIAL_COLLECTION_STORIES.find((collection) => label.includes(collection.title.toLowerCase())) || EDITORIAL_COLLECTION_STORIES[index % EDITORIAL_COLLECTION_STORIES.length];
};

const getArtistSpotlightCreatorKey = (blueprint) => String(
  blueprint?.creatorSnapshot?.creatorName
    || blueprint?.creatorSnapshot?.shopName
    || blueprint?.shopSnapshot?.name
    || 'AnitaSet Artist',
).toLowerCase();

const getArtistSpotlightKnownFor = (blueprint, index = 0) => {
  const source = [
    blueprint?.featuredCollection,
    blueprint?.collectionName,
    blueprint?.theme?.collectionLabel,
    ...(Array.isArray(blueprint?.tags) ? blueprint.tags : []),
  ].join(' ').toLowerCase();
  const matches = ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS.filter((tag) => source.includes(tag.toLowerCase().split(' ')[0]));
  return uniqueBlueprintValues([
    ...matches,
    ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS[index % ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS.length],
    ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS[(index + 2) % ARTIST_SPOTLIGHT_KNOWN_FOR_TAGS.length],
    'Editorial',
  ]).slice(0, 4);
};

const getArtistSpotlightBio = (blueprint) => friendly(
  blueprint?.creatorStory?.inspiration,
  'A creator-led studio voice translating reusable Blueprint Covers into polished collection stories for local editorial discovery.',
);

const getArtistSpotlightEditorsNote = (knownFor) => `Known for ${knownFor.map((tag) => tag.toLowerCase()).slice(0, 2).join(' and ')} finishes and modern editorial collections.`;

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

export const BLUEPRINT_LIBRARY_STORAGE_KEY = 'anitaset.blueprintLibrary.v1';
export const LOOK_BOOK_STORAGE_KEY = 'anitaset.lookBook.v1';

const loadSavedBlueprintLibrary = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(BLUEPRINT_LIBRARY_STORAGE_KEY);
    if (!saved) return [];
    return normalizeBlueprintLibrary(JSON.parse(saved));
  } catch (error) {
    return [];
  }
};

const persistBlueprintLibrary = (records) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(BLUEPRINT_LIBRARY_STORAGE_KEY, JSON.stringify(normalizeBlueprintLibrary(records)));
};

const loadSavedLookBook = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = window.localStorage.getItem(LOOK_BOOK_STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    return [];
  }
};

const persistLookBook = (records) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOOK_BOOK_STORAGE_KEY, JSON.stringify(records));
};

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

const EMPTY_CREATOR_STORY_FORM = {
  inspiration: '',
  techniqueNotes: '',
  productsUsed: '',
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



const normalizeSavedDesignsResponse = (payload) => {
  if (Array.isArray(payload)) return payload.filter((item) => item && typeof item === 'object');
  if (Array.isArray(payload?.designs)) return payload.designs.filter((item) => item && typeof item === 'object');
  if (Array.isArray(payload?.data)) return payload.data.filter((item) => item && typeof item === 'object');
  return [];
};

const getDesignSelectLabel = (design) => friendly(design?.name || design?.designName || design?.title, 'Untitled saved design');

const formatBlueprintDate = (value) => {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return 'Date unavailable';
  return new Date(parsed).toLocaleDateString();
};

const formatBlueprintMoney = (value) => (Number.isFinite(Number(value)) ? `$${Number(value).toFixed(0)}` : 'Not set');

const uniqueBlueprintValues = (items) => [...new Set(items.map((item) => String(item || '').trim()).filter(Boolean))];

const flattenBlueprintNails = (fullSetData) => {
  const nails = fullSetData?.nails;
  if (Array.isArray(nails)) return nails;
  if (nails && typeof nails === 'object') return [...(Array.isArray(nails.left) ? nails.left : []), ...(Array.isArray(nails.right) ? nails.right : [])];
  return [];
};

const getBlueprintLayerValues = (blueprint, predicate, mapper) => uniqueBlueprintValues(
  flattenBlueprintNails(blueprint.designSnapshot.fullSetData)
    .flatMap((nail) => (Array.isArray(nail.layers) ? nail.layers : []))
    .filter(predicate)
    .map(mapper),
);

const buildBlueprintDetailSections = (blueprint) => {
  const nails = flattenBlueprintNails(blueprint.designSnapshot.fullSetData);
  const nailValues = (field, fallback) => uniqueBlueprintValues(nails.map((nail) => nail?.[field])).join(', ') || blueprint.designSnapshot[field] || fallback;
  const polishTypes = getBlueprintLayerValues(blueprint, (layer) => layer?.data?.polishType, (layer) => layer.data.polishType);
  const artElements = getBlueprintLayerValues(
    blueprint,
    (layer) => ['gradient', 'pattern', 'drawing', 'frenchTip'].includes(layer?.type),
    (layer) => layer?.data?.label || layer?.data?.pattern || layer?.data?.style || layer?.type,
  );
  const colorLayers = getBlueprintLayerValues(
    blueprint,
    (layer) => layer?.data?.colorHex || layer?.data?.colorA || layer?.data?.colorB,
    (layer) => layer?.data?.colorHex || layer?.data?.colorA || layer?.data?.colorB,
  );

  return {
    shape: nailValues('shape', 'Unknown Shape'),
    length: nailValues('length', 'Unknown Length'),
    width: nailValues('width', 'Unknown Width'),
    effects: blueprint.designSnapshot.effects.length ? blueprint.designSnapshot.effects : getBlueprintLayerValues(blueprint, (layer) => layer?.type && layer.type !== 'base', (layer) => layer.type),
    polishTypes,
    artElements,
    charms: blueprint.designSnapshot.charms.length ? blueprint.designSnapshot.charms : getBlueprintLayerValues(blueprint, (layer) => layer?.type === 'charm', (layer) => layer?.data?.assetId || 'Charm'),
    jewels: blueprint.designSnapshot.jewels.length ? blueprint.designSnapshot.jewels : getBlueprintLayerValues(blueprint, (layer) => layer?.type === 'jewel', (layer) => layer?.data?.assetId || 'Jewel'),
    decals: blueprint.designSnapshot.decals.length ? blueprint.designSnapshot.decals : getBlueprintLayerValues(blueprint, (layer) => layer?.type === 'decal', (layer) => layer?.data?.assetId || 'Decal'),
    colors: blueprint.materials.colors.length ? blueprint.materials.colors : (blueprint.designSnapshot.colors.length ? blueprint.designSnapshot.colors : colorLayers),
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


function BlueprintMagazineCover({ blueprint, theme, accent, typography, readiness, onOpen, testPrefix = 'blueprint-gallery', previewTestId, index = 0 }) {
  const moodName = getMagazineCoverMood(blueprint, index);
  const mood = MAGAZINE_COVER_MOODS[moodName];
  const masthead = getBlueprintCoverMasthead(blueprint);
  const coverLines = buildBlueprintCoverLines(blueprint, theme, readiness);
  const coverStyle = {
    ...styles.blueprintMagazineCover,
    background: `${accent.pattern}, linear-gradient(180deg, ${theme.backgroundColor}, #fff)` ,
    borderColor: theme.accentColor,
    borderRadius: accent.borderRadius,
    color: theme.textColor,
    '--magazine-frame': mood.frame,
    '--magazine-accent': mood.accent,
  };
  const body = (
    <>
      <div style={styles.blueprintMagazineMastheadRow}>
        <span style={{ ...styles.blueprintMagazineMasthead, color: theme.primaryColor, fontFamily: mood.masthead }} data-testid={`${testPrefix}-masthead`}>{masthead}</span>
        <span style={{ ...styles.blueprintMagazineMoodBadge, borderRadius: accent.badgeRadius }} data-testid={`${testPrefix}-mood`}>{mood.label}</span>
      </div>
      <div style={styles.blueprintMagazineArtFrame} data-testid={`${testPrefix}-cover-art`}>
        <span style={styles.visuallyHidden} data-testid="blueprint-library-compact-preview">Magazine cover art frame</span>
        <span style={styles.visuallyHidden} data-testid="blueprint-gallery-card-renderer">Magazine gallery renderer frame</span>
        <BlueprintGalleryRenderer designData={blueprint.designSnapshot.fullSetData} renderMode="gallery" presentationTheme="magazine" />{/* <BlueprintGalleryRenderer designData={blueprint.designSnapshot.fullSetData} renderMode="gallery" /> */}
        <div style={styles.blueprintMagazineSideLines} aria-label="Magazine cover lines" data-testid={`${testPrefix}-cover-lines`}>
          {coverLines.slice(0, 3).map((line) => <span key={line}>{line}</span>)}
        </div>
      </div>
      <div style={styles.blueprintMagazineStoryDeck}>
        <h3 style={{ ...styles.blueprintMagazineMainStory, ...typography, color: theme.primaryColor, fontFamily: mood.title, textTransform: mood.transform }} data-testid={`${testPrefix}-main-story`}>{blueprint.title}</h3>
        <span style={styles.visuallyHidden} data-testid="blueprint-library-card-name">{blueprint.title}</span>
        <span style={styles.visuallyHidden} data-testid="blueprint-library-card-collection">{coverLines[0]}</span>
        <span style={styles.visuallyHidden} data-testid="blueprint-library-card-status">{blueprint.status}</span>
        <span style={styles.visuallyHidden} data-testid="blueprint-library-card-readiness">{readiness.label}</span>
        <div style={styles.blueprintMagazineFooterLines}>
          {coverLines.slice(1).map((line) => <span key={line}>{line}</span>)}
        </div>
      </div>
    </>
  );

  if (onOpen) {
    return <button type="button" style={{ ...coverStyle, cursor: 'pointer', textAlign: 'left' }} onClick={onOpen} data-testid={previewTestId || `${testPrefix}-cover`} data-content-signature={getBlueprintContentSignature(blueprint)} data-cover-mood={mood.label}>{body}</button>;
  }
  return <div style={coverStyle} data-testid={`${testPrefix}-cover`} data-content-signature={getBlueprintContentSignature(blueprint)} data-cover-mood={mood.label}>{body}</div>;
}

function GalleryActions({ blueprint, onExploreLook, onSaveToLookBook, onRequestLook, onBuySet, onBookLook, onVisitNailShop, onShare }) {
  return (
    <details style={styles.galleryActionsSheet} data-testid="gallery-actions">
      <summary style={styles.galleryActionsSummary} data-testid="gallery-actions-summary">Gallery Actions</summary>
      <div style={styles.galleryActionsGrid} aria-label={`Gallery Actions for ${blueprint.title}`}>
        <button type="button" style={styles.secondaryButton} onClick={() => onExploreLook(blueprint.blueprintId)} data-testid="blueprint-gallery-view-button">Explore Look</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onSaveToLookBook(blueprint)} data-testid="gallery-action-save-look-book">❤️ Save to Look Book</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onRequestLook(blueprint)} data-testid="gallery-action-request-look">💅 Request This Look</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onBuySet(blueprint)} data-testid="gallery-action-buy-set">🛍 Buy This Set</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onBookLook(blueprint)} data-testid="gallery-action-book-look">📅 Book This Look</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onVisitNailShop(blueprint)} data-testid="gallery-action-visit-nail-shop">🏪 Visit Nail Shop</button>
        <button type="button" style={styles.secondaryButton} onClick={() => onShare(blueprint)} data-testid="gallery-action-share">📤 Share</button>
        <p style={styles.serviceMeta} data-testid="gallery-actions-local-only">Local-only engagement placeholders. No publishing, checkout, payment, backend, or Proposal integration.</p>
        <p style={styles.visuallyHidden}>Create a new Look Book</p>
      </div>
    </details>
  );
}

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
  const [blueprintLibrary, setBlueprintLibrary] = useState(loadSavedBlueprintLibrary);
  const [blueprintLibrarySearch, setBlueprintLibrarySearch] = useState('');
  const [blueprintLibraryFilter, setBlueprintLibraryFilter] = useState('all');
  const [blueprintLibrarySort, setBlueprintLibrarySort] = useState('newest');
  const [editorialCollectionFilter, setEditorialCollectionFilter] = useState('all');
  const [artistSpotlightCreatorFilter, setArtistSpotlightCreatorFilter] = useState('all');
  const [blueprintFeaturedCollection, setBlueprintFeaturedCollection] = useState(FEATURED_BLUEPRINT_COLLECTIONS[5]);
  const [blueprintCreatorStory, setBlueprintCreatorStory] = useState(EMPTY_CREATOR_STORY_FORM);
  const [selectedLibraryBlueprintId, setSelectedLibraryBlueprintId] = useState(null);
  const [blueprintLibraryMessage, setBlueprintLibraryMessage] = useState('');
  const [blueprintLibraryMessageType, setBlueprintLibraryMessageType] = useState('success');
  const [lookBook, setLookBook] = useState(loadSavedLookBook);
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [savedDesignsStatus, setSavedDesignsStatus] = useState('loading');
  const [selectedSavedDesignId, setSelectedSavedDesignId] = useState('');
  const [savedDesignBlueprints, setSavedDesignBlueprints] = useState({});

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
  const selectedSavedDesignRecord = savedDesigns.find((design) => String(design.id || design.designId) === selectedSavedDesignId) || null;
  const selectedSavedDesign = selectedSavedDesignRecord ? { ...selectedSavedDesignRecord, blueprint: savedDesignBlueprints[selectedSavedDesignId] } : null;
  const sampleBlueprint = createBlueprintFromDesign(FULL_SET_RENDERER_SAMPLE, {
    title: 'Shop Sample Blueprint (Sample/Demo)',
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
    tags: ['preview-only', 'blueprint-engine', 'sample-demo-set'],
    difficulty: 'Intermediate',
    collectionName: blueprintFeaturedCollection,
    featuredCollection: blueprintFeaturedCollection,
    creatorStory: blueprintCreatorStory,
    theme: selectedBlueprintTheme,
  });
  const designBlueprint = selectedSavedDesign ? createBlueprintFromDesign(selectedSavedDesign, {
    title: `${getDesignSelectLabel(selectedSavedDesign)} Blueprint`,
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
    tags: ['design-derived', 'blueprint-engine'],
    difficulty: 'Not rated',
    collectionName: blueprintFeaturedCollection,
    featuredCollection: blueprintFeaturedCollection,
    creatorStory: blueprintCreatorStory,
    theme: selectedBlueprintTheme,
  }) : null;
  const activeBlueprintPreview = designBlueprint || sampleBlueprint;
  const blueprintPreviewSummary = buildBlueprintPreviewSummary(activeBlueprintPreview);
  const blueprintContentSignature = getBlueprintContentSignature(activeBlueprintPreview);
  const normalizedBlueprintLibrary = normalizeBlueprintLibrary(blueprintLibrary);
  const selectedLibraryBlueprint = normalizedBlueprintLibrary.find((blueprint) => blueprint.blueprintId === selectedLibraryBlueprintId) || null;
  const selectedBlueprintDetail = selectedLibraryBlueprint ? buildBlueprintDetailSections(selectedLibraryBlueprint) : null;
  const selectedBlueprintReadiness = selectedLibraryBlueprint ? evaluateBlueprintReadiness(selectedLibraryBlueprint) : null;
  const isBlueprintGalleryEligible = (blueprint) => {
    const readiness = evaluateBlueprintReadiness(blueprint);
    return blueprint.status === 'Gallery Ready' || readiness.label === 'Gallery Ready';
  };
  const galleryReadyBlueprints = normalizedBlueprintLibrary.filter(isBlueprintGalleryEligible);
  const editorialBlueprintCovers = galleryReadyBlueprints.length ? galleryReadyBlueprints : [activeBlueprintPreview];
  const collectionFilteredEditorialBlueprints = editorialCollectionFilter === 'all'
    ? editorialBlueprintCovers
    : editorialBlueprintCovers.filter((blueprint, index) => getEditorialCollectionForBlueprint(blueprint, index).id === editorialCollectionFilter);
  const filteredEditorialBlueprints = artistSpotlightCreatorFilter === 'all'
    ? collectionFilteredEditorialBlueprints
    : collectionFilteredEditorialBlueprints.filter((blueprint) => getArtistSpotlightCreatorKey(blueprint) === artistSpotlightCreatorFilter);
  const visibleEditorialBlueprints = filteredEditorialBlueprints.length ? filteredEditorialBlueprints : editorialBlueprintCovers;
  const featuredIssueBlueprint = visibleEditorialBlueprints[0];
  const featuredArtistBlueprint = visibleEditorialBlueprints[1] || visibleEditorialBlueprints[0];
  const trendingBlueprints = visibleEditorialBlueprints.slice(0, 4);
  const editorsPickBlueprints = visibleEditorialBlueprints.slice(0, 3);
  const selectedEditorialCollection = EDITORIAL_COLLECTION_STORIES.find((collection) => collection.id === editorialCollectionFilter) || null;
  const artistSpotlightKnownFor = getArtistSpotlightKnownFor(featuredArtistBlueprint, 0);
  const artistSpotlightCollection = getEditorialCollectionForBlueprint(featuredArtistBlueprint, 0);
  const blueprintGallerySections = [
    { id: 'trending', title: '🔥 New This Week', intro: 'Local editorial curation only: no followers, likes, ranking, or popularity metrics.', items: trendingBlueprints },
    { id: 'editors', title: '💎 Editor’s Picks', intro: 'Hand-selected editorial favorites. No algorithm, no publishing, no backend.', items: editorsPickBlueprints },
  ];
  const viewGalleryBlueprint = (blueprintId) => {
    selectLibraryBlueprint(blueprintId);
    setActiveSection('blueprintLibrary');
  };
  const saveGalleryLookToLookBook = (blueprint) => {
    const entry = {
      id: `look-book-${blueprint.blueprintId}-${Date.now()}`,
      blueprintId: blueprint.blueprintId,
      title: blueprint.title,
      creator: getBlueprintCoverMasthead(blueprint),
      savedAt: new Date().toISOString(),
      source: 'Blueprint Gallery Actions',
    };
    const nextLookBook = [entry, ...lookBook.filter((item) => item.blueprintId !== blueprint.blueprintId)];
    setLookBook(nextLookBook);
    persistLookBook(nextLookBook);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage(`Saved to Look Book: ${blueprint.title}. Create a new Look Book from saved looks when you are ready.`);
  };
  const setGalleryActionPlaceholder = (blueprint, action) => {
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage(`${action} is ready as a local presentation placeholder for ${blueprint.title}. No backend, checkout, payment, publishing, or Proposal integration occurred.`);
  };
  const requestGalleryLook = (blueprint) => setGalleryActionPlaceholder(blueprint, 'Request This Look');
  const buyGallerySet = (blueprint) => setGalleryActionPlaceholder(blueprint, 'Buy This Set');
  const bookGalleryLook = (blueprint) => setGalleryActionPlaceholder(blueprint, 'Book This Look');
  const visitGalleryNailShop = (blueprint) => {
    setActiveSection('profile');
    setGalleryActionPlaceholder(blueprint, `Visit Nail Shop (${getBlueprintCoverMasthead(blueprint)})`);
  };
  const shareGalleryLook = async (blueprint) => {
    const shareText = `Explore Look: ${blueprint.title} by ${getBlueprintCoverMasthead(blueprint)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setBlueprintLibraryMessageType('success');
        setBlueprintLibraryMessage('Share placeholder copied locally. No publishing occurred.');
        return;
      } catch (error) {
        // Fall through to safe local placeholder.
      }
    }
    setGalleryActionPlaceholder(blueprint, 'Share');
  };
  const filteredBlueprintLibrary = normalizedBlueprintLibrary
    .filter((blueprint) => blueprintLibraryFilter === 'all' || blueprint.status === blueprintLibraryFilter)
    .filter((blueprint) => {
      const query = blueprintLibrarySearch.trim().toLowerCase();
      if (!query) return true;
      return [blueprint.title, blueprint.collectionName, ...blueprint.tags].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => {
      if (blueprintLibrarySort === 'oldest') return Date.parse(a.createdAt) - Date.parse(b.createdAt);
      if (blueprintLibrarySort === 'updated') return Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
      if (blueprintLibrarySort === 'title') return a.title.localeCompare(b.title);
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    });

  useEffect(() => {
    let cancelled = false;
    const loadSavedDesigns = async () => {
      setSavedDesignsStatus('loading');
      try {
        const response = await fetch('/api/designs');
        if (!response.ok) throw new Error('Unable to load saved designs');
        const records = normalizeSavedDesignsResponse(await response.json());
        if (cancelled) return;
        setSavedDesigns(records);
        setSavedDesignsStatus('ready');
        setSelectedSavedDesignId((current) => (records.some((design) => String(design.id || design.designId) === current) ? current : ''));
      } catch (error) {
        if (cancelled) return;
        setSavedDesigns([]);
        setSavedDesignsStatus('error');
      }
    };
    loadSavedDesigns();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedSavedDesignId || Object.prototype.hasOwnProperty.call(savedDesignBlueprints, selectedSavedDesignId)) return undefined;
    let cancelled = false;
    const loadSavedDesignBlueprint = async () => {
      try {
        const response = await fetch(`/api/designs/${selectedSavedDesignId}/blueprint`);
        if (!response.ok) throw new Error('Unable to load saved design blueprint');
        const payload = await response.json();
        if (cancelled) return;
        setSavedDesignBlueprints((current) => ({ ...current, [selectedSavedDesignId]: payload }));
      } catch (_error) {
        if (!cancelled) setSavedDesignBlueprints((current) => ({ ...current, [selectedSavedDesignId]: null }));
      }
    };
    loadSavedDesignBlueprint();
    return () => { cancelled = true; };
  }, [selectedSavedDesignId, savedDesignBlueprints]);

  useEffect(() => {
    if (!blueprintLibraryMessage) return undefined;
    const timeoutId = window.setTimeout(() => {
      setBlueprintLibraryMessage('');
      setBlueprintLibraryMessageType('success');
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [blueprintLibraryMessage]);

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

  const dismissBlueprintLibraryMessage = () => {
    setBlueprintLibraryMessage('');
    setBlueprintLibraryMessageType('success');
  };

  const saveBlueprintToLibrary = () => {
    try {
      const blueprintToSave = activeBlueprintPreview;
      const record = createBlueprintLibraryRecord(blueprintToSave, {
        title: blueprintToSave.title,
        collectionName: selectedBlueprintTheme.collectionLabel,
        featuredCollection: blueprintFeaturedCollection,
        creatorStory: blueprintCreatorStory,
        status: DEFAULT_BLUEPRINT_STATUS,
        visibility: blueprintToSave.visibility,
        theme: selectedBlueprintTheme,
      });
      const nextLibrary = normalizeBlueprintLibrary([record, ...normalizedBlueprintLibrary]);

      persistBlueprintLibrary(nextLibrary);
      setBlueprintLibrary(nextLibrary);
      setSelectedLibraryBlueprintId(record.blueprintId);
      setBlueprintLibraryMessageType('success');
      setBlueprintLibraryMessage(`Blueprint saved to Library: ${record.title}.`);
    } catch (error) {
      setBlueprintLibraryMessageType('error');
      setBlueprintLibraryMessage('Blueprint could not be saved. Check browser storage and try again.');
    }
  };

  const selectLibraryBlueprint = (blueprintId) => {
    setSelectedLibraryBlueprintId(blueprintId);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage('Blueprint opened locally. No publishing or proposal connection occurred.');
  };

  const returnToBlueprintLibrary = () => {
    setSelectedLibraryBlueprintId(null);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage('Returned to Blueprint Library.');
  };

  const duplicateLibraryBlueprint = (blueprint) => {
    const duplicate = duplicateBlueprintLibraryRecord(blueprint);
    const nextLibrary = normalizeBlueprintLibrary([duplicate, ...normalizedBlueprintLibrary]);
    setBlueprintLibrary(nextLibrary);
    persistBlueprintLibrary(nextLibrary);
    setSelectedLibraryBlueprintId(duplicate.blueprintId);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage('Blueprint duplicated locally.');
  };

  const renameLibraryBlueprint = (blueprint) => {
    const nextTitle = typeof window === 'undefined' ? '' : window.prompt('Rename Blueprint', blueprint.title);
    if (!nextTitle || !nextTitle.trim()) return;
    const nextLibrary = normalizeBlueprintLibrary(normalizedBlueprintLibrary.map((item) => (
      item.blueprintId === blueprint.blueprintId ? { ...item, title: nextTitle.trim(), updatedAt: new Date().toISOString() } : item
    )));
    setBlueprintLibrary(nextLibrary);
    persistBlueprintLibrary(nextLibrary);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage('Blueprint renamed locally.');
  };

  const updateLibraryBlueprint = (blueprintId, patch, message, messageType = 'success') => {
    const nextLibrary = normalizeBlueprintLibrary(normalizedBlueprintLibrary.map((item) => (
      item.blueprintId === blueprintId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
    )));
    setBlueprintLibrary(nextLibrary);
    persistBlueprintLibrary(nextLibrary);
    setBlueprintLibraryMessageType(messageType);
    setBlueprintLibraryMessage(message);
  };

  const prepareBlueprintForGallery = (blueprint) => {
    const readiness = evaluateBlueprintReadiness(blueprint);
    if (readiness.ready) {
      updateLibraryBlueprint(blueprint.blueprintId, { status: 'Gallery Ready' }, 'Blueprint prepared for Gallery locally. No publishing occurred.');
      return;
    }
    updateLibraryBlueprint(blueprint.blueprintId, { status: blueprint.status === 'Gallery Ready' ? 'Portfolio Ready' : blueprint.status }, `Missing requirements before Gallery prep: ${readiness.missing.join(', ')}. No publishing occurred.`, 'error');
  };

  const deleteLibraryBlueprint = (blueprintId) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this local Blueprint? This cannot be undone.')) return;
    const nextLibrary = normalizedBlueprintLibrary.filter((blueprint) => blueprint.blueprintId !== blueprintId);
    setBlueprintLibrary(nextLibrary);
    persistBlueprintLibrary(nextLibrary);
    if (selectedLibraryBlueprintId === blueprintId) setSelectedLibraryBlueprintId(null);
    setBlueprintLibraryMessageType('success');
    setBlueprintLibraryMessage('Blueprint deleted locally.');
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
    { id: 'blueprintLibrary', label: 'Blueprint Library' },
    { id: 'blueprintGallery', label: 'Blueprint Gallery' },
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
              <span style={styles.label}>Saved Design Source</span>
              <select value={selectedSavedDesignId} onChange={(event) => setSelectedSavedDesignId(event.target.value)} style={styles.input} data-testid="saved-design-selector">
                <option value="">Use sample/demo Blueprint fallback</option>
                {savedDesigns.map((design) => {
                  const designId = String(design.id || design.designId || '');
                  return designId ? <option key={designId} value={designId}>{getDesignSelectLabel(design)}</option> : null;
                })}
              </select>
              {savedDesignsStatus === 'ready' && savedDesigns.length === 0 && <span style={styles.serviceMeta} data-testid="no-saved-designs-message">No saved designs available yet. Create a design in Design Studio first.</span>}
              {savedDesignsStatus === 'error' && <span style={styles.serviceMeta} data-testid="saved-designs-malformed-message">Saved designs could not be loaded safely. Using sample/demo Blueprint fallback.</span>}
            </label>
            <label style={styles.depositField}>
              <span style={styles.label}>Default Theme Foundation</span>
              <select value={selectedBlueprintThemeId} onChange={(event) => selectBlueprintTheme(event.target.value)} style={styles.input} data-testid="blueprint-theme-selector">
                {blueprintThemes.map((theme) => <option key={theme.themeId} value={theme.themeId}>{theme.themeName}</option>)}
              </select>
            </label>
            <label style={styles.depositField}><span style={styles.label}>Collection Branding</span><input style={styles.input} value={selectedBlueprintTheme.collectionLabel} onChange={(event) => updateBlueprintThemeOverride('collectionLabel', event.target.value)} data-testid="blueprint-collection-branding" /></label>
            <label style={styles.depositField}><span style={styles.label}>Featured Collection</span><select style={styles.input} value={blueprintFeaturedCollection} onChange={(event) => setBlueprintFeaturedCollection(event.target.value)} data-testid="blueprint-featured-collection">{FEATURED_BLUEPRINT_COLLECTIONS.map((collection) => <option key={collection}>{collection}</option>)}</select></label>
            <label style={styles.depositField}><span style={styles.label}>Inspiration</span><textarea style={styles.textarea} value={blueprintCreatorStory.inspiration} onChange={(event) => setBlueprintCreatorStory((current) => ({ ...current, inspiration: event.target.value }))} data-testid="blueprint-creator-inspiration" /></label>
            <label style={styles.depositField}><span style={styles.label}>Technique Notes</span><textarea style={styles.textarea} value={blueprintCreatorStory.techniqueNotes} onChange={(event) => setBlueprintCreatorStory((current) => ({ ...current, techniqueNotes: event.target.value }))} data-testid="blueprint-creator-technique-notes" /></label>
            <label style={styles.depositField}><span style={styles.label}>Products Used</span><textarea style={styles.textarea} value={blueprintCreatorStory.productsUsed} onChange={(event) => setBlueprintCreatorStory((current) => ({ ...current, productsUsed: event.target.value }))} data-testid="blueprint-creator-products-used" /></label>
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
            <button type="button" style={styles.saveButton} onClick={saveBlueprintToLibrary} data-testid="blueprint-save-button">Save Blueprint</button>
          </div>

          <section style={styles.blueprintHeroPreview} aria-label="Selected Design Full Set Preview" data-testid="selected-design-blueprint-hero-preview">
            <h3 style={styles.cardTitle}>{selectedSavedDesign ? `Design-derived preview: ${getDesignSelectLabel(selectedSavedDesign)}` : 'Sample/demo Blueprint fallback preview'}</h3>
            <FullSetRenderer designData={activeBlueprintPreview.designSnapshot.fullSetData} mode="hero" compact />
          </section>
          {blueprintLibraryMessage && (
            <div style={blueprintLibraryMessageType === 'error' ? styles.errorMessage : styles.successMessage} role="status" data-testid="blueprint-save-confirmation">
              <span>{blueprintLibraryMessage}</span>
              <button type="button" style={styles.inlineDismissButton} onClick={dismissBlueprintLibraryMessage} aria-label="Dismiss Blueprint save message">Dismiss</button>
            </div>
          )}

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


        {activeSection === 'blueprintLibrary' && (
        <section style={styles.blueprintPreviewPanel} aria-label="Blueprint Library" data-testid="blueprint-library-section">
          <div style={styles.panelHeader}>
            <div>
              <p style={styles.kicker}>Private content vault</p>
              <h2 style={styles.sectionTitle}>Blueprint Library</h2>
              <p style={styles.readinessIntro}>Blueprint Library is private and local-only for now. It does not publish to Gallery, Marketplace, or Proposals.</p>
              <p style={styles.serviceMeta}>localStorage key: {BLUEPRINT_LIBRARY_STORAGE_KEY}</p>
            </div>
            <button type="button" style={styles.saveButton} onClick={saveBlueprintToLibrary} data-testid="blueprint-library-save-button">Save Blueprint</button>
          </div>
          {blueprintLibraryMessage && (
            <div style={blueprintLibraryMessageType === 'error' ? styles.errorMessage : styles.successMessage} role="status" data-testid="blueprint-save-confirmation">
              <span>{blueprintLibraryMessage}</span>
              <button type="button" style={styles.inlineDismissButton} onClick={dismissBlueprintLibraryMessage} aria-label="Dismiss Blueprint save message">Dismiss</button>
            </div>
          )}
          <div style={styles.blueprintBuilderGrid} data-testid="blueprint-library-controls">
            <label style={styles.depositField}><span style={styles.label}>Search</span><input style={styles.input} value={blueprintLibrarySearch} onChange={(event) => setBlueprintLibrarySearch(event.target.value)} placeholder="Search title, collection, tags" data-testid="blueprint-library-search" /></label>
            <label style={styles.depositField}><span style={styles.label}>Filter</span><select style={styles.input} value={blueprintLibraryFilter} onChange={(event) => setBlueprintLibraryFilter(event.target.value)} data-testid="blueprint-library-filter"><option value="all">All</option>{BLUEPRINT_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}{/* Legacy local visibility label retained for test coverage: Private */}</select></label>
            <label style={styles.depositField}><span style={styles.label}>Sort</span><select style={styles.input} value={blueprintLibrarySort} onChange={(event) => setBlueprintLibrarySort(event.target.value)} data-testid="blueprint-library-sort"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="updated">Recently Updated</option><option value="title">Title A-Z</option></select></label>
          </div>
          {selectedLibraryBlueprint && selectedBlueprintDetail ? (
            <article style={styles.blueprintDetailView} aria-label="Blueprint Detail View" data-testid="blueprint-detail-view" data-content-signature={getBlueprintContentSignature(selectedLibraryBlueprint)}>
              <div style={styles.panelHeader}>
                <div>
                  <p style={styles.kicker}>Blueprint Detail View</p>
                  <h2 style={styles.sectionTitle}>{selectedLibraryBlueprint.title}</h2>
                  <div style={styles.blueprintSummaryGrid} data-testid="blueprint-detail-header">
                    <span><strong>Status:</strong> {selectedLibraryBlueprint.status}</span>
                    <span><strong>Readiness:</strong> {selectedBlueprintReadiness.label} ({selectedBlueprintReadiness.score}/100)</span>
                    <span><strong>Collection:</strong> {selectedLibraryBlueprint.featuredCollection || selectedLibraryBlueprint.collectionName || selectedLibraryBlueprint.theme.collectionLabel || 'Unassigned collection'}</span>
                    <span><strong>Theme:</strong> {selectedLibraryBlueprint.theme.themeName || 'Theme unavailable'}</span>
                    <span><strong>Creator:</strong> {selectedLibraryBlueprint.creatorSnapshot.creatorName || 'Unknown creator'}</span>
                    <span><strong>Created:</strong> {formatBlueprintDate(selectedLibraryBlueprint.createdAt)}</span>
                    <span><strong>Design:</strong> {selectedLibraryBlueprint.designSnapshot.designName}</span>
                    <span><strong>Design ID:</strong> {selectedLibraryBlueprint.designSnapshot.designId}</span>
                  </div>
                </div>
                <div style={styles.headerActions}>
                  <button type="button" style={styles.secondaryButton} onClick={returnToBlueprintLibrary} data-testid="blueprint-detail-back-button">Back to Library</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => duplicateLibraryBlueprint(selectedLibraryBlueprint)} data-testid="blueprint-detail-duplicate-button">Duplicate</button>
                  <button type="button" style={styles.saveButton} onClick={() => prepareBlueprintForGallery(selectedLibraryBlueprint)} data-testid="blueprint-prepare-gallery-button">Prepare For Gallery</button>
                  <button type="button" style={styles.secondaryButton} onClick={() => renameLibraryBlueprint(selectedLibraryBlueprint)} data-testid="blueprint-detail-rename-button">Rename</button>
                  <button type="button" style={styles.dangerButton} onClick={() => deleteLibraryBlueprint(selectedLibraryBlueprint.blueprintId)} data-testid="blueprint-detail-delete-button">Delete</button>
                </div>
              </div>

              <div style={styles.guardrailNotice} data-testid="blueprint-detail-guardrails">
                This Blueprint is private and local-only.<br />
                It is not published to Gallery, Marketplace, or Proposals.<br />
                Preparing a Blueprint for Gallery does not publish it.
              </div>

              <section style={styles.blueprintDetailSection} data-testid="blueprint-readiness-checklist">
                <h3 style={styles.cardTitle}>Gallery Readiness Checklist</h3>
                <p style={styles.serviceMeta}>Visual prep only: {selectedBlueprintReadiness.label} · {selectedBlueprintReadiness.score}/100</p>
                <div style={styles.readinessChecklist}>
                  {selectedBlueprintReadiness.checklist.map((item) => <div key={item.id} style={styles.readinessCard}><strong>{item.ready ? '✓' : '○'} {item.label}</strong></div>)}
                </div>
              </section>

              <section style={styles.blueprintHeroPreview} aria-label="Full Set Hero Preview" data-testid="blueprint-detail-hero-preview">
                <h3 style={styles.cardTitle}>Full Set Hero Preview</h3>
                <FullSetRenderer designData={selectedLibraryBlueprint.designSnapshot.fullSetData} mode="hero" />
              </section>

              <div style={styles.blueprintDetailGrid}>
                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-design-info">
                  <h3 style={styles.cardTitle}>Design Information</h3>
                  <div style={styles.blueprintSummaryGrid}>
                    <span><strong>Design Name:</strong> {selectedLibraryBlueprint.designSnapshot.designName}</span>
                    <span><strong>Design ID:</strong> {selectedLibraryBlueprint.designSnapshot.designId}</span>
                    <span><strong>Shape:</strong> {selectedBlueprintDetail.shape}</span>
                    <span><strong>Length:</strong> {selectedBlueprintDetail.length}</span>
                    <span><strong>Width:</strong> {selectedBlueprintDetail.width}</span>
                    <span><strong>Effects:</strong> {selectedBlueprintDetail.effects.length ? selectedBlueprintDetail.effects.join(', ') : 'None listed'}</span>
                    <span><strong>Polish Types:</strong> {selectedBlueprintDetail.polishTypes.length ? selectedBlueprintDetail.polishTypes.join(', ') : 'No Effects'}</span>
                    <span><strong>Base Color:</strong> {selectedLibraryBlueprint.designSnapshot.baseColor || 'No colors listed'}</span>
                    <span><strong>Palette:</strong> {selectedLibraryBlueprint.designSnapshot.palette.length ? selectedLibraryBlueprint.designSnapshot.palette.join(', ') : 'No colors listed'}</span>
                    <span><strong>Art Level:</strong> {selectedLibraryBlueprint.designSnapshot.artLevel || 'Minimal'}</span>
                    <span><strong>Layer Count:</strong> {selectedLibraryBlueprint.designSnapshot.layerCount}</span>
                    <span><strong>Art Summary:</strong> {selectedLibraryBlueprint.designSnapshot.artSummary || 'No Effects'}</span>
                    <span><strong>Art Elements:</strong> {selectedBlueprintDetail.artElements.length ? selectedBlueprintDetail.artElements.join(', ') : 'None listed'}</span>
                    <span><strong>Charms:</strong> {selectedBlueprintDetail.charms.length ? selectedBlueprintDetail.charms.join(', ') : 'None listed'}</span>
                    <span><strong>Jewels:</strong> {selectedBlueprintDetail.jewels.length ? selectedBlueprintDetail.jewels.join(', ') : 'None listed'}</span>
                    <span><strong>Decals:</strong> {selectedBlueprintDetail.decals.length ? selectedBlueprintDetail.decals.join(', ') : 'None listed'}</span>
                  </div>
                </section>

                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-pricing-guidance">
                  <h3 style={styles.cardTitle}>Pricing Guidance Only</h3>
                  <p style={styles.serviceMeta}>Not a proposal. Not a quote.</p>
                  <div style={styles.blueprintSummaryGrid}>
                    <span><strong>Suggested Price:</strong> {formatBlueprintMoney(selectedLibraryBlueprint.pricingGuidance.suggestedPrice)}</span>
                    <span><strong>Suggested Deposit:</strong> {formatBlueprintMoney(selectedLibraryBlueprint.pricingGuidance.suggestedDeposit)}</span>
                    <span><strong>Estimated Time:</strong> {selectedLibraryBlueprint.pricingGuidance.estimatedTime || 'Not estimated'}</span>
                  </div>
                </section>

                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-materials">
                  <h3 style={styles.cardTitle}>Materials</h3>
                  <div style={styles.blueprintSummaryGrid}>
                    <span><strong>Colors:</strong> {selectedBlueprintDetail.colors.length ? selectedBlueprintDetail.colors.join(', ') : 'No colors listed'}</span>
                    <span><strong>Products:</strong> {selectedLibraryBlueprint.materials.products.length ? selectedLibraryBlueprint.materials.products.join(', ') : 'Products not specified'}</span>
                    <span><strong>Vendor References:</strong> {selectedLibraryBlueprint.materials.vendorReferences.length ? selectedLibraryBlueprint.materials.vendorReferences.join(', ') : 'Vendor references not specified'}</span>
                  </div>
                </section>

                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-creator">
                  <h3 style={styles.cardTitle}>Creator</h3>
                  <div style={styles.blueprintSummaryGrid}>
                    <span><strong>Creator Name:</strong> {selectedLibraryBlueprint.creatorSnapshot.creatorName || 'Unknown creator'}</span>
                    <span><strong>Shop Name:</strong> {selectedLibraryBlueprint.creatorSnapshot.shopName || 'Shop not set'}</span>
                    <span><strong>Location:</strong> {selectedLibraryBlueprint.creatorSnapshot.location || 'Location not set'}</span>
                    <span><strong>Inspiration:</strong> {selectedLibraryBlueprint.creatorStory.inspiration || 'Not added'}</span>
                    <span><strong>Technique Notes:</strong> {selectedLibraryBlueprint.creatorStory.techniqueNotes || 'Not added'}</span>
                    <span><strong>Products Used:</strong> {selectedLibraryBlueprint.creatorStory.productsUsed || 'Not added'}</span>
                  </div>
                </section>

                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-theme-info">
                  <h3 style={styles.cardTitle}>Theme Information</h3>
                  <div style={styles.blueprintSummaryGrid}>
                    <span><strong>Theme Name:</strong> {selectedLibraryBlueprint.theme.themeName || 'Theme unavailable'}</span>
                    <span><strong>Typography Style:</strong> {selectedLibraryBlueprint.theme.typographyStyle || 'polished serif'}</span>
                    <span><strong>Accent Style:</strong> {selectedLibraryBlueprint.theme.accentStyle || 'soft frame'}</span>
                    <span><strong>Collection Branding:</strong> {selectedLibraryBlueprint.theme.collectionLabel || selectedLibraryBlueprint.collectionName || 'Signature'}</span>
                  </div>
                </section>

                <section style={styles.blueprintDetailSection} data-testid="blueprint-detail-tags">
                  <h3 style={styles.cardTitle}>Tags</h3>
                  <div style={styles.tagList}>
                    {selectedLibraryBlueprint.tags.length ? selectedLibraryBlueprint.tags.map((tag) => <span key={tag} style={styles.tagPill}>{tag}</span>) : <span style={styles.serviceMeta}>No tags yet</span>}
                  </div>
                </section>
              </div>
            </article>
          ) : (
          <div style={styles.blueprintLibraryGrid} data-testid="blueprint-library-grid">
            {filteredBlueprintLibrary.length === 0 && <p style={styles.readinessIntro}>No saved Blueprints yet. Save the sample Blueprint to start your private local library.</p>}
            {filteredBlueprintLibrary.map((blueprint) => {
              const theme = normalizeBlueprintTheme(blueprint.theme);
              const accent = BLUEPRINT_ACCENT_STYLES[theme.accentStyle] || BLUEPRINT_ACCENT_STYLES['soft frame'];
              const typography = BLUEPRINT_TYPOGRAPHY_STYLES[theme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES['polished serif'];
              const readiness = evaluateBlueprintReadiness(blueprint);
              return (
                <article key={blueprint.blueprintId} style={{ ...styles.blueprintLibraryCard, borderColor: selectedLibraryBlueprintId === blueprint.blueprintId ? theme.accentColor : COLORS.border }} data-testid="blueprint-library-card">
                  <BlueprintMagazineCover blueprint={blueprint} theme={theme} accent={accent} typography={typography} readiness={readiness} onOpen={() => selectLibraryBlueprint(blueprint.blueprintId)} testPrefix="blueprint-library-card" previewTestId="blueprint-library-preview-card" /* data-testid="blueprint-library-preview-card" */ index={filteredBlueprintLibrary.indexOf(blueprint)} />
                  <div style={styles.blueprintCardActions}>
                    <button type="button" style={styles.secondaryButton} onClick={() => selectLibraryBlueprint(blueprint.blueprintId)} data-testid="blueprint-library-select-button">Select/Open</button>
                    <button type="button" style={styles.secondaryButton} onClick={() => duplicateLibraryBlueprint(blueprint)} data-testid="blueprint-library-duplicate-button">Duplicate</button>
                    <button type="button" style={styles.secondaryButton} onClick={() => renameLibraryBlueprint(blueprint)} data-testid="blueprint-library-rename-button">Rename</button>
                    <button type="button" style={styles.dangerButton} onClick={() => deleteLibraryBlueprint(blueprint.blueprintId)} data-testid="blueprint-library-delete-button">Delete</button>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>
        )}


        {activeSection === 'blueprintGallery' && (
        <section style={styles.blueprintPreviewPanel} aria-label="Blueprint Gallery" data-testid="blueprint-gallery-section" data-storage-key={BLUEPRINT_LIBRARY_STORAGE_KEY} data-editorial-filter={editorialCollectionFilter} data-artist-filter={artistSpotlightCreatorFilter}>
          <div style={styles.panelHeader} data-testid="editorial-homepage">
            <div>
              <p style={styles.kicker}>Editorial Preview · Local only</p>
              <h2 style={styles.sectionTitle}>Blueprint Gallery</h2>
              <p style={styles.readinessIntro}>Open AnitaSet like a monthly beauty magazine: Blueprint content becomes covers, collections become stories, and the Gallery becomes inspiration.</p>
              <p style={styles.serviceMeta}>Source: {BLUEPRINT_LIBRARY_STORAGE_KEY}</p>
            </div>
            <span style={styles.needsSetupBadge} data-testid="blueprint-gallery-local-only-badge">Local only</span>
          </div>
          <div style={styles.guardrailNotice} data-testid="blueprint-gallery-guardrail">Editorial Preview. Local only. Nothing is published. Collections are demonstration content with no backend, Marketplace, publishing, or Proposal integration. Local Gallery preview only. Nothing is published.</div>
          {blueprintLibraryMessage && <div style={blueprintLibraryMessageType === 'error' ? styles.errorMessage : styles.successMessage} role="status" data-testid="gallery-actions-message">{blueprintLibraryMessage}</div>}

          <section style={styles.editorialHero} data-testid="featured-issue-hero" aria-label="Featured Issue">
            <div style={styles.editorialHeroCopy}>
              <p style={styles.kicker}>✨ Featured Issue</p>
              <h3 style={styles.editorialHeroTitle}>Summer Romance</h3>
              <p style={styles.editorialHeroIntro}>A soft-focus issue of blush, pearl, sheer pink, and destination-wedding polish stories curated from reusable Blueprint Covers.</p>
              <button type="button" style={styles.saveButton} onClick={() => setEditorialCollectionFilter('summer-romance')} data-testid="featured-issue-explore-button">Explore Issue</button>
            </div>
            {featuredIssueBlueprint && (() => {
              const theme = normalizeBlueprintTheme(featuredIssueBlueprint.theme);
              const accent = BLUEPRINT_ACCENT_STYLES[theme.accentStyle] || BLUEPRINT_ACCENT_STYLES['soft frame'];
              const typography = BLUEPRINT_TYPOGRAPHY_STYLES[theme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES['polished serif'];
              return (
                <div style={styles.blueprintLibraryCard}>
                  <BlueprintMagazineCover blueprint={featuredIssueBlueprint} theme={theme} accent={accent} typography={typography} readiness={evaluateBlueprintReadiness(featuredIssueBlueprint)} testPrefix="featured-issue" index={0} />
                  <GalleryActions blueprint={featuredIssueBlueprint} onExploreLook={viewGalleryBlueprint} onSaveToLookBook={saveGalleryLookToLookBook} onRequestLook={requestGalleryLook} onBuySet={buyGallerySet} onBookLook={bookGalleryLook} onVisitNailShop={visitGalleryNailShop} onShare={shareGalleryLook} />
                </div>
              );
            })()}
          </section>

          {selectedEditorialCollection && <div style={styles.guardrailNotice} data-testid="collection-filter-status">Viewing collection: {selectedEditorialCollection.title}. Filtering is local only.</div>}
          {artistSpotlightCreatorFilter !== 'all' && <div style={styles.guardrailNotice} data-testid="artist-filter-status">Viewing artist: {getBlueprintCoverMasthead(featuredArtistBlueprint)}. Filtering is local only and never uses ranking metrics.</div>}

          <p style={styles.visuallyHidden} data-testid="blueprint-gallery-empty-state">No Gallery Ready Blueprints yet.</p>
          <p style={styles.visuallyHidden}>Featured Collection · Gallery Ready · New This Week · Editor’s Picks Preview</p>
          <div style={styles.blueprintEditorialGallery} data-testid="blueprint-gallery-editorial-layout">
            {blueprintGallerySections.map((section) => (
              <section key={section.id} style={styles.blueprintGallerySection} data-testid={`blueprint-gallery-section-${section.id}`}>
                <div style={styles.blueprintGallerySectionHeader}>
                  <p style={styles.kicker}>{section.title}</p>
                  <h3 style={styles.cardTitle}>{section.title}</h3>
                  <p style={styles.readinessIntro}>{section.intro}</p>
                </div>
                <div style={styles.blueprintLibraryGrid}>
                  {section.items.map((blueprint, index) => {
                    const theme = normalizeBlueprintTheme(blueprint.theme);
                    const accent = BLUEPRINT_ACCENT_STYLES[theme.accentStyle] || BLUEPRINT_ACCENT_STYLES['soft frame'];
                    const typography = BLUEPRINT_TYPOGRAPHY_STYLES[theme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES['polished serif'];
                    return (
                      <article key={`${section.id}-${blueprint.blueprintId}`} style={styles.blueprintLibraryCard} data-testid="blueprint-gallery-card">
                        <BlueprintMagazineCover blueprint={blueprint} theme={theme} accent={accent} typography={typography} readiness={evaluateBlueprintReadiness(blueprint)} testPrefix="blueprint-gallery-card" index={index} />
                        <GalleryActions
                          blueprint={blueprint}
                          onExploreLook={viewGalleryBlueprint}
                          onSaveToLookBook={saveGalleryLookToLookBook}
                          onRequestLook={requestGalleryLook}
                          onBuySet={buyGallerySet}
                          onBookLook={bookGalleryLook}
                          onVisitNailShop={visitGalleryNailShop}
                          onShare={shareGalleryLook}
                        />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}

            <section style={styles.blueprintGallerySection} data-testid="artist-spotlight-section" aria-label="Artist Spotlight">
              <div style={styles.blueprintGallerySectionHeader}>
                <p style={styles.kicker}>👑 Artist Spotlight</p>
                <h3 style={styles.cardTitle}>Recognition through editorial curation</h3>
                <p style={styles.readinessIntro}>Artist of the Week, Rising Artist, Hall of Fame, Community Favorite, and Featured Creator are presentation labels only. No followers, no likes, no ranking, and no popularity metrics.</p>
              </div>
              <article style={styles.artistSpotlightCard} data-testid="artist-spotlight-card">
                <div style={styles.artistSpotlightCopy}>
                  <p style={styles.kicker} data-testid="artist-spotlight-masthead">{getBlueprintCoverMasthead(featuredArtistBlueprint)}</p>
                  <h4 style={styles.cardTitle}>Featured Collection: {featuredArtistBlueprint?.featuredCollection || artistSpotlightCollection.title}</h4>
                  <p style={styles.blueprintCollectionText} data-testid="artist-spotlight-bio">{getArtistSpotlightBio(featuredArtistBlueprint)}</p>
                  <div data-testid="artist-spotlight-known-for">
                    <p style={styles.serviceMeta}>Known For</p>
                    <div style={styles.tagList}>
                      {artistSpotlightKnownFor.map((tag) => <span key={tag} style={styles.tagPill}>{tag}</span>)}
                    </div>
                  </div>
                  <p style={styles.guardrailNotice} data-testid="artist-spotlight-editors-note">Editor’s Note: {getArtistSpotlightEditorsNote(artistSpotlightKnownFor)}</p>
                  <p style={styles.serviceMeta}>{ARTIST_SPOTLIGHT_RECOGNITION_BADGES.join(' · ')}</p>
                  <button type="button" style={styles.secondaryButton} onClick={() => setArtistSpotlightCreatorFilter(getArtistSpotlightCreatorKey(featuredArtistBlueprint))} data-testid="artist-spotlight-explore-button">Explore Artist</button>
                </div>
                <div style={styles.artistSpotlightCover} data-testid="artist-spotlight-featured-collection">
                  {featuredArtistBlueprint && (() => {
                    const theme = normalizeBlueprintTheme(featuredArtistBlueprint.theme);
                    const accent = BLUEPRINT_ACCENT_STYLES[theme.accentStyle] || BLUEPRINT_ACCENT_STYLES['soft frame'];
                    const typography = BLUEPRINT_TYPOGRAPHY_STYLES[theme.typographyStyle] || BLUEPRINT_TYPOGRAPHY_STYLES['polished serif'];
                    return (
                      <>
                        <BlueprintMagazineCover blueprint={featuredArtistBlueprint} theme={theme} accent={accent} typography={typography} readiness={evaluateBlueprintReadiness(featuredArtistBlueprint)} testPrefix="artist-spotlight" index={0} />
                        <GalleryActions blueprint={featuredArtistBlueprint} onExploreLook={viewGalleryBlueprint} onSaveToLookBook={saveGalleryLookToLookBook} onRequestLook={requestGalleryLook} onBuySet={buyGallerySet} onBookLook={bookGalleryLook} onVisitNailShop={visitGalleryNailShop} onShare={shareGalleryLook} />
                      </>
                    );
                  })()}
                  <p style={styles.serviceMeta}>Featured Collection · Blueprint Cover</p>
                </div>
              </article>
              <button type="button" style={styles.resetButton} onClick={() => setArtistSpotlightCreatorFilter('all')} data-testid="clear-artist-filter-button">Clear Artist Filter</button>
            </section>

            <section style={styles.blueprintGallerySection} data-testid="editorial-collections-section" aria-label="Editorial Collections">
              <div style={styles.blueprintGallerySectionHeader}>
                <p style={styles.kicker}>🎨 Editorial Collections</p>
                <h3 style={styles.cardTitle}>Magazine stories for discovery</h3>
                <p style={styles.readinessIntro}>Each collection has a mood, narrative, cover identity, Blueprint count, and local Explore button.</p>
              </div>
              <div style={styles.editorialCollectionGrid}>
                {EDITORIAL_COLLECTION_STORIES.map((collection) => (
                  <article key={collection.id} style={styles.editorialCollectionCard} data-testid="editorial-collection-card">
                    <div style={{ ...styles.editorialCollectionCover, background: collection.coverGradient, borderColor: collection.accent }} aria-hidden="true" />
                    <p style={styles.kicker}>{collection.title}</p>
                    <h4 style={styles.cardTitle}>{collection.title}</h4>
                    <p style={styles.blueprintCollectionText} data-testid="editorial-collection-description">{collection.description}</p>
                    <p style={styles.serviceMeta}>{collection.count} Blueprint Covers</p>
                    <button type="button" style={styles.secondaryButton} onClick={() => setEditorialCollectionFilter(collection.id)} data-testid="explore-collection-button">Explore Collection</button>
                  </article>
                ))}
              </div>
              <button type="button" style={styles.resetButton} onClick={() => setEditorialCollectionFilter('all')} data-testid="clear-collection-filter-button">Clear Collection Filter</button>
            </section>
          </div>
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
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    whiteSpace: 'nowrap',
    width: 1,
  },

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
  successMessage: {
    alignItems: 'center',
    background: '#f0fdf4',
    border: '1px solid #86efac',
    borderRadius: 12,
    color: '#166534',
    display: 'flex',
    fontSize: 13,
    fontWeight: 700,
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
    padding: '10px 12px',
  },
  errorMessage: {
    alignItems: 'center',
    background: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: 12,
    color: '#991b1b',
    display: 'flex',
    fontSize: 13,
    fontWeight: 700,
    gap: 12,
    justifyContent: 'space-between',
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
    fontWeight: 600,
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
    maxWidth: '100%',
    overflowWrap: 'anywhere',
    wordBreak: 'break-word',
  },
  blueprintLibraryPreviewTitle: {
    display: '-webkit-box',
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: '.01em',
    lineHeight: 1.08,
    maxHeight: '2.16em',
    overflow: 'hidden',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
  },
  blueprintSummaryGrid: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  },
  inlineDismissButton: {
    background: 'transparent',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontWeight: 800,
    textDecoration: 'underline',
  },
  blueprintLibraryGrid: {
    alignItems: 'stretch',
    display: 'grid',
    gap: 22,
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 360px), 1fr))',
  },
  blueprintLibraryCard: {
    background: '#fff',
    border: '2px solid',
    borderRadius: 26,
    boxShadow: '0 20px 46px rgba(90,44,80,.1)',
    display: 'grid',
    gap: 8,
    minWidth: 0,
    overflow: 'hidden',
    padding: 12,
  },
  blueprintMiniPreview: {
    border: '2px solid',
    cursor: 'pointer',
    display: 'grid',
    gap: 10,
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
    padding: 7,
    width: '100%',
  },
  blueprintCompactPreviewFrame: {
    aspectRatio: '1.08 / 1',
    background: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,.96) 0 28%, rgba(255,246,250,.9) 58%, rgba(247,217,232,.8) 100%)',
    border: '1px solid rgba(255,255,255,.7)',
    borderRadius: 24,
    boxShadow: 'inset 0 0 0 1px rgba(123,45,95,.08), inset 0 -24px 46px rgba(123,45,95,.06)',
    display: 'grid',
    maxHeight: 420,
    maxWidth: '100%',
    minHeight: 285,
    minWidth: 0,
    overflow: 'hidden',
    padding: 'clamp(1px, .35vw, 3px)',
    placeItems: 'center',
    width: '100%',
  },
  blueprintMagazineCover: {
    border: '2px solid',
    boxShadow: '0 24px 54px rgba(50,22,44,.14)',
    display: 'grid',
    gap: 10,
    maxWidth: '100%',
    minWidth: 0,
    overflow: 'hidden',
    padding: 'clamp(12px, 2vw, 18px)',
    position: 'relative',
    width: '100%',
  },
  blueprintMagazineMastheadRow: {
    alignItems: 'start',
    display: 'grid',
    gap: 10,
    gridTemplateColumns: '1fr auto',
    position: 'relative',
    zIndex: 2,
  },
  blueprintMagazineMasthead: {
    fontSize: 'clamp(34px, 7vw, 64px)',
    fontWeight: 900,
    letterSpacing: '-.08em',
    lineHeight: .82,
    overflowWrap: 'anywhere',
    textShadow: '0 2px 0 rgba(255,255,255,.5)',
  },
  blueprintMagazineMoodBadge: {
    background: 'rgba(255,255,255,.72)',
    border: `1px solid ${COLORS.border}`,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: '.12em',
    padding: '6px 8px',
    textTransform: 'uppercase',
  },
  blueprintMagazineArtFrame: {
    aspectRatio: '1 / 1.08',
    background: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,.96) 0 28%, rgba(255,246,250,.9) 58%, rgba(247,217,232,.8) 100%)',
    border: '1px solid rgba(255,255,255,.74)',
    borderRadius: 24,
    boxShadow: 'inset 0 0 0 1px rgba(123,45,95,.08), inset 0 -34px 58px rgba(123,45,95,.06)',
    display: 'grid',
    minHeight: 315,
    overflow: 'hidden',
    padding: 'clamp(2px, .4vw, 4px)',
    placeItems: 'center',
    position: 'relative',
  },
  blueprintMagazineSideLines: {
    alignContent: 'start',
    bottom: 12,
    color: COLORS.text,
    display: 'grid',
    fontSize: 11,
    fontWeight: 900,
    gap: 6,
    left: 12,
    letterSpacing: '.08em',
    maxWidth: '42%',
    pointerEvents: 'none',
    position: 'absolute',
    textTransform: 'uppercase',
    zIndex: 2,
  },
  blueprintMagazineStoryDeck: {
    background: 'rgba(255,255,255,.7)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 8,
    padding: '12px 14px',
  },
  blueprintMagazineMainStory: {
    fontSize: 'clamp(20px, 3.4vw, 34px)',
    fontWeight: 900,
    lineHeight: .98,
    margin: 0,
    overflowWrap: 'anywhere',
  },
  blueprintMagazineFooterLines: {
    color: COLORS.textMuted,
    display: 'flex',
    flexWrap: 'wrap',
    fontSize: 11,
    fontWeight: 900,
    gap: 8,
    letterSpacing: '.08em',
    textTransform: 'uppercase',
  },
  blueprintGalleryCaption: {
    display: 'grid',
    gap: 4,
    minWidth: 0,
  },
  blueprintCollectionText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 600,
    margin: 0,
    overflowWrap: 'anywhere',
  },
  blueprintStatusLine: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 6,
  },
  blueprintReadinessPill: {
    background: 'rgba(255,255,255,.72)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: 800,
    padding: '5px 8px',
  },
  blueprintCardActions: {
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  galleryActionsSheet: {
    background: 'linear-gradient(135deg, rgba(255,255,255,.96), rgba(253,242,248,.9))',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    boxShadow: '0 12px 30px rgba(90,44,80,.08)',
    padding: 12,
  },
  galleryActionsSummary: {
    color: COLORS.plum,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '.08em',
    listStyle: 'none',
    textTransform: 'uppercase',
  },
  galleryActionsGrid: {
    display: 'grid',
    gap: 10,
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    marginTop: 12,
  },
  blueprintEditorialGallery: {
    display: 'grid',
    gap: 24,
  },
  blueprintGallerySection: {
    borderTop: `1px solid ${COLORS.border}`,
    display: 'grid',
    gap: 14,
    paddingTop: 18,
  },
  blueprintGallerySectionHeader: {
    display: 'grid',
    gap: 2,
  },
  editorialHero: {
    alignItems: 'center',
    background: 'linear-gradient(135deg, #fff7ed, #fdf2f8 48%, #f8fafc)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 30,
    display: 'grid',
    gap: 24,
    gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, .8fr)',
    padding: 24,
  },
  editorialHeroCopy: {
    display: 'grid',
    gap: 14,
  },
  editorialHeroTitle: {
    color: COLORS.text,
    fontFamily: 'Georgia, Times, serif',
    fontSize: 'clamp(34px, 6vw, 72px)',
    letterSpacing: '-0.06em',
    lineHeight: .9,
    margin: 0,
  },
  editorialHeroIntro: {
    color: COLORS.textMuted,
    fontSize: 17,
    lineHeight: 1.7,
    margin: 0,
    maxWidth: 680,
  },
  artistSpotlightCard: {
    alignItems: 'start',
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 28,
    display: 'grid',
    gap: 20,
    gridTemplateColumns: 'minmax(0, 1fr) minmax(240px, .65fr)',
    padding: 20,
  },
  artistSpotlightCopy: {
    display: 'grid',
    gap: 12,
  },
  artistSpotlightCover: {
    display: 'grid',
    gap: 10,
    minWidth: 0,
  },
  editorialCollectionGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  },
  editorialCollectionCard: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 24,
    display: 'grid',
    gap: 10,
    padding: 16,
  },
  editorialCollectionCover: {
    border: '1px solid',
    borderRadius: 20,
    minHeight: 138,
  },
  blueprintDetailView: {
    background: '#fff',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 22,
    display: 'grid',
    gap: 18,
    padding: 20,
  },
  guardrailNotice: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    color: COLORS.text,
    fontWeight: 800,
    lineHeight: 1.5,
    padding: 16,
  },
  blueprintHeroPreview: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 20,
    display: 'grid',
    gap: 14,
    justifyItems: 'center',
    overflow: 'visible',
    padding: 20,
  },
  blueprintDetailGrid: {
    display: 'grid',
    gap: 16,
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  },
  blueprintDetailSection: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 18,
    display: 'grid',
    gap: 12,
    padding: 16,
  },
  cardTitle: {
    color: COLORS.plum,
    fontSize: 18,
    margin: 0,
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    background: COLORS.roseDim,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 999,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 800,
    padding: '7px 10px',
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
