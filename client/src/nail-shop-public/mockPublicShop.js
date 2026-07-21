const ASSET_ROOT = '/assets/anitaset/nail-shop';

export const nailShopAssets = {
  banner: `${ASSET_ROOT}/banner/luxe-shop-banner.png`,
  signature: `${ASSET_ROOT}/signature/luxe-signature-nail.png`,
  displayWindow: [1, 2, 3, 4, 5].map((number) => `${ASSET_ROOT}/display-window/display-window-0${number}.png`),
  artistAvatars: [
    `${ASSET_ROOT}/artist-collective/avatar-yellow.png`,
    `${ASSET_ROOT}/artist-collective/avatar-white.png`,
    `${ASSET_ROOT}/artist-collective/avatar-royal-blue.png`,
    `${ASSET_ROOT}/artist-collective/avatar-hot-pink-coffin.png`,
    `${ASSET_ROOT}/artist-collective/avatar-green.png`,
  ],
  merchandise: `${ASSET_ROOT}/merchandise/luxe-merchandise-preview.png`,
  interior: `${ASSET_ROOT}/interior/luxe-interior-preview.png`,
};

export const mockPublicShop = {
  shopName: 'AnitaSet Atelier',
  tagline: 'Editorial nail artistry, glossy rituals, and black cherry moments curated like a luxury boutique.',
  bio: 'A Founder-approved Nail Shop room for premium sets, soft-glam rituals, and curated design discovery inside AnitaSet Headquarters.',
  brandStory: 'Every shelf, service, and window moment is arranged to feel like stepping into an upscale nail boutique owned by a creative professional.',
  location: 'Atlanta, GA',
  accentColor: '#f7d392',
  specialtyTags: ['3D charms', 'Chrome accents', 'Marble sets', 'Soft glam'],
  bannerImage: nailShopAssets.banner,
  profileNailImage: nailShopAssets.signature,
  merchandiseImage: nailShopAssets.merchandise,
  interiorImage: nailShopAssets.interior,
  hasMultipleArtists: true,
  signatureNail: {
    title: 'Signature Nail™',
    subtitle: 'Founder-approved nail-shaped profile identity.',
    image: nailShopAssets.signature,
  },
  featuredDisplayItems: nailShopAssets.displayWindow.map((image, index) => ({
    id: `display-window-${index + 1}`,
    type: 'design',
    title: ['Black Cherry Aura', 'Pearl Veil French', 'Gilded Marble', 'Velvet Chrome', 'Soft Sculptural Bloom'][index],
    subtitle: 'Curated storefront inspiration',
    image,
    visualLabel: `Approved Display Window nail design ${index + 1}`,
    badge: index === 0 ? 'Signature' : 'Window',
  })),
  services: [
    { title: 'Editorial Full Set', price: 'From $95', duration: '120 min' },
    { title: 'Soft-Glam Gel Ritual', price: 'From $68', duration: '75 min' },
    { title: 'Custom Press-On Fitting', price: 'From $82', duration: '60 min' },
  ],
  gallery: nailShopAssets.displayWindow.map((image, index) => ({
    id: `gallery-look-${index + 1}`,
    title: ['Boutique Aura', 'Pearl Muse', 'Gold Detail', 'Cherry Gloss', 'Sculpted Petal'][index],
    image,
  })),
  artists: nailShopAssets.artistAvatars.map((image, index) => ({
    id: `artist-nail-avatar-${index + 1}`,
    name: ['Yellow Aura', 'White Pearl', 'Royal Blue', 'Hot Pink Coffin', 'Green Muse'][index],
    image,
  })),
};

export default mockPublicShop;
