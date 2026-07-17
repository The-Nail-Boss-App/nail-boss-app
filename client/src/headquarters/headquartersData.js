export const officialAssets = {
  darkBackgroundLogo: '/anitaset-logo-secondary.png',
  primaryLogo: '/anitaset-logo-main.png',
  favicon: '/anitaset-favicon.png',
};

export const executiveBrief = [
  'The ultimate hub for nail professionals to create, run, and grow unstoppable businesses.',
  'Welcome back, Boss — your next move starts from the executive lobby.',
  'Built different. Built to lead.'
];

export const businessMetrics = [
  { label: 'Revenue Today', value: '$12,450', note: '18% vs yesterday', tone: 'pink' },
  { label: 'New Nail Shops', value: '128', note: '24% this week', tone: 'violet' },
  { label: 'Active Clients', value: '1,248', note: '16% this week', tone: 'gold' },
  { label: 'Designs Created', value: '1,126', note: '32% today', tone: 'violet' },
  { label: 'Bookings', value: '342', note: '20% this week', tone: 'pink' },
  { label: 'Profit Today', value: '$5,320', note: '22% vs yesterday', tone: 'gold' },
];

export const primaryRooms = [
  { key: 'create', title: 'CREATE', room: 'DESIGN STUDIO', purpose: 'Bring your ideas to life.', actionLabel: 'Enter District', destination: 'studio', enabled: true },
  { key: 'price', title: 'PRICE', room: 'PRICING HUB', purpose: 'Price with confidence. Profit with purpose.', actionLabel: 'Enter District', destination: 'proposals', enabled: true },
  { key: 'sell', title: 'SELL', room: 'NAIL SHOP', purpose: 'Showcase your work. Book more clients.', actionLabel: 'Enter District', destination: 'nail-shop', enabled: true },
  { key: 'grow', title: 'GROW', room: 'GROWTH CENTER', purpose: 'Market smarter. Scale faster.', actionLabel: 'Coming Soon', enabled: false },
];

export const directoryItems = [
  { title: 'Artist District', purpose: 'Connect. Showcase. Get inspired.', actionLabel: 'Enter District', destination: 'artist-district', enabled: true },
  { title: 'Marketplace', purpose: 'Shop. Sell. Earn.', actionLabel: 'Coming Soon', enabled: false },
  { title: 'Vendor Hub', purpose: 'Suppliers and wholesale tools.', actionLabel: 'Coming Soon', enabled: false },
  { title: 'Education', purpose: 'Learn, certify, and level up.', actionLabel: 'Coming Soon', enabled: false },
  { title: 'Community', purpose: 'Owner circles and peer momentum.', actionLabel: 'Coming Soon', enabled: false },
];

export const priorities = [
  { category: 'Quick Actions', description: 'New Design', actionLabel: 'New Design', destination: 'studio', enabled: true },
  { category: 'Quick Actions', description: 'New Proposal', actionLabel: 'New Proposal', destination: 'proposals', enabled: true },
  { category: 'Quick Actions', description: 'Add Client', actionLabel: 'Client tools coming soon', enabled: false },
  { category: 'Quick Actions', description: 'Create Promotion', actionLabel: 'Promotion tools coming soon', enabled: false },
];

export const utilities = ['Messages', 'Calendar', 'Tasks'];

export const liveUpdates = [
  { title: 'Summer Chrome Week', meta: 'May 12 – May 18', badge: 'Live' },
  { title: 'New Vendor Drop', meta: 'Gloss Society Collection just landed!', badge: 'New' },
  { title: 'Artist Spotlight', meta: '@NailsByTee trending this week', badge: 'Hot' },
];
