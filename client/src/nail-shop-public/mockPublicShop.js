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
  shopName: 'Luxe Nail Studio',
  tagline: 'Art. Attitude. Perfection.',
  bio: 'A black-cherry Atlanta nail boutique for luxury gel, sculptural 3D art, custom designs, and collectible press-ons.',
  brandStory: 'Luxe Nail Studio layers hot-pink confidence, chrome detail, and appointment-first care into every set.',
  location: 'Atlanta, Georgia',
  rating: '4.9',
  reviewCount: '284 reviews',
  accentColor: '#ff2f92',
  specialtyTags: ['Luxury Gel', '3D Art', 'Custom Designs', 'Press-Ons'],
  bannerImage: nailShopAssets.banner,
  profileNailImage: nailShopAssets.signature,
  merchandiseImage: nailShopAssets.merchandise,
  interiorImage: nailShopAssets.interior,
  hasMultipleArtists: true,
  signatureNail: {
    title: 'Signature Nail™',
    subtitle: 'Luxe storefront identity in nail-design form.',
    image: nailShopAssets.signature,
  },
  featuredDisplayItems: nailShopAssets.displayWindow.map((image, index) => ({
    id: `display-window-${index + 1}`,
    type: 'design',
    title: ['Black Cherry Aura', 'Pearl Veil French', 'Gilded Marble', 'Velvet Chrome', 'Soft Sculptural Bloom'][index],
    subtitle: ['Gloss', 'Pearl', 'Chrome', 'Velvet', 'Bloom'][index],
    image,
    visualLabel: `Approved Display Window nail design ${index + 1}`,
    badge: index === 0 ? 'Signature' : 'Window',
  })),
  services: [
    { title: 'Luxury Gel Set', price: 'From $95', duration: '120 min' },
    { title: '3D Art Add-On', price: 'From $35', duration: '30 min' },
    { title: 'Custom Press-On Fitting', price: 'From $82', duration: '60 min' },
  ],
  gallery: nailShopAssets.displayWindow.map((image, index) => ({
    id: `gallery-look-${index + 1}`,
    title: ['Boutique Aura', 'Pearl Muse', 'Gold Detail', 'Cherry Gloss', 'Sculpted Petal'][index],
    image,
  })),
  artists: nailShopAssets.artistAvatars.map((image, index) => ({
    id: `artist-nail-avatar-${index + 1}`,
    name: ['Nova Chrome', 'Pearl Voss', 'Royal Rina', 'Coffin Kira', 'Emerald Muse'][index],
    specialty: ['Luxury Gel', 'Pearl French', '3D Art', 'Press-Ons', 'Custom Designs'][index],
    status: index === 0 ? 'Featured' : index === 3 ? 'Booking' : 'Available',
    image,
  })),
  reviews: [
    { id: 'review-1', name: 'Maya R.', rating: '5.0', copy: 'The black cherry set looked like wearable jewelry. Precise, glossy, and photo-ready.' },
    { id: 'review-2', name: 'Talia J.', rating: '4.9', copy: 'Fast messages, stunning 3D detail, and the prettiest chrome finish I have had in Atlanta.' },
  ],
};

export default mockPublicShop;
