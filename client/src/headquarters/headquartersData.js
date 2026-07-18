export const officialAssets = {
  darkBackgroundLogo: '/anitaset-logo-secondary.png',
  primaryLogo: '/anitaset-logo-main.png',
  favicon: '/anitaset-favicon.png',
  anitaPortrait: null,
  headquartersBlueprintPhoto: null,
};

export const assetSlots = {
  anitaPortrait: 'Replace officialAssets.anitaPortrait with the approved full-body Anita concierge image when delivered.',
  headquartersBlueprintPhoto: 'Replace officialAssets.headquartersBlueprintPhoto with the Founder Approved Headquarters photographic environment when delivered.',
};

export const executiveBrief = [
  'The Headquarters of the Nail Industry.',
  'Built different. Built to lead.'
];

export const businessMetrics = [
  { label: 'Revenue Today', value: '$12,450', note: '18% vs yesterday', tone: 'pink', icon: '💲' },
  { label: 'New Nail Shops', value: '128', note: '24% this week', tone: 'violet', icon: '▱' },
  { label: 'Active Clients', value: '1,248', note: '16% this week', tone: 'gold', icon: '♚' },
  { label: 'Designs Created', value: '1,126', note: '32% today', tone: 'violet', icon: '▣' },
  { label: 'Bookings', value: '342', note: '20% this week', tone: 'pink', icon: '▦' },
  { label: 'Profit Today', value: '$5,320', note: '22% vs yesterday', tone: 'gold', icon: '♕' },
];

export const primaryRooms = [
  { key: 'create', title: 'CREATE', room: 'DESIGN STUDIO', purpose: 'Bring your ideas to life.', actionLabel: 'Enter District', destination: 'studio', enabled: true, icon: '✎' },
  { key: 'price', title: 'PRICE', room: 'PRICING HUB', purpose: 'Price with confidence. Profit with purpose.', actionLabel: 'Enter District', destination: 'proposals', enabled: true, icon: '◎' },
  { key: 'sell', title: 'SELL', room: 'NAIL SHOP', purpose: 'Showcase your work. Book more clients.', actionLabel: 'Enter District', destination: 'nail-shop', enabled: true, icon: '▱' },
  { key: 'grow', title: 'GROW', room: 'GROWTH CENTER', purpose: 'Market smarter. Scale faster.', actionLabel: 'Opening Soon', enabled: false, icon: '↗' },
];

export const directoryItems = [
  { key: 'artist', title: 'ARTIST DISTRICT', purpose: 'Connect. Showcase. Get inspired.', actionLabel: 'Enter District', destination: 'artist-district', enabled: true, icon: '♛', status: 'Open' },
  { key: 'marketplace', title: 'MARKETPLACE', purpose: 'Shop. Sell. Earn.', actionLabel: 'Opening Soon', enabled: false, icon: '🛒', status: 'Coming Soon' },
  { key: 'vendor', title: 'VENDOR HUB', purpose: 'Supplier tools, wholesale drops, and brand visibility.', actionLabel: 'Opening Soon', enabled: false, icon: '▤', status: 'Coming Soon' },
  { key: 'education', title: 'EDUCATION', purpose: 'Learn, certify, and level up.', actionLabel: 'Opening Soon', enabled: false, icon: '▧', status: 'In Development' },
  { key: 'community', title: 'COMMUNITY', purpose: 'Owner circles and peer momentum.', actionLabel: 'Opening Soon', enabled: false, icon: '♧', status: 'Coming Soon' },
  { key: 'events', title: 'EVENTS', purpose: 'Launch weeks, live moments, and industry calendars.', actionLabel: 'Opening Soon', enabled: false, icon: '▦', status: 'Coming Soon' },
];

export const priorities = [
  { description: 'New Design', destination: 'studio', enabled: true, icon: '✓', primary: true },
  { description: 'New Proposal', destination: 'proposals', enabled: true, icon: '▧' },
  { description: 'Add Client', enabled: false, icon: '♙' },
  { description: 'Post to Community', enabled: false, icon: '♧' },
  { description: 'Add New Product', enabled: false, icon: '▣' },
  { description: 'Create Promotion', enabled: false, icon: '📣' },
  { description: 'AI Shop Manager', enabled: false, icon: '☼' },
];

export const liveUpdates = [
  { title: 'Summer Chrome Week', meta: 'May 12 – May 18', badge: 'Live' },
  { title: 'New Nail Shop', meta: 'Luxe Claws Studio just opened.', badge: 'New' },
  { title: 'Featured Artist', meta: '@NailsByTee trending this week', badge: 'Hot' },
  { title: 'Vendor Spotlight', meta: 'Gloss Society Collection just landed!', badge: 'New' },
  { title: 'Trending Shape', meta: 'Soft square chrome is leading searches.', badge: 'Trend' },
];
