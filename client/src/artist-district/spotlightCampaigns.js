/** @typedef {'eyebrow' | 'display' | 'script'} SpotlightTitleRole */

/**
 * @typedef {Object} SpotlightCampaign
 * @property {string} id
 * @property {string} badge
 * @property {{ text: string, role: SpotlightTitleRole }[]} titleParts
 * @property {string} description
 * @property {{ value: string, label: string, icon?: string }[]} metrics
 * @property {{ label: string, href: string, ariaLabel: string }} cta
 * @property {{ src: string, alt: string }} artwork
 * @property {string} theme
 * @property {'active' | 'scheduled' | 'archived'} status
 */

/** @type {SpotlightCampaign} */
export const summerChromeCampaign = {
  id: 'summer-chrome-week',
  badge: 'LIVE NOW',
  titleParts: [
    { text: 'SUMMER', role: 'eyebrow' },
    { text: 'CHROME', role: 'display' },
    { text: 'Week', role: 'script' },
  ],
  description: 'Discover the artists, designs, products, and collections defining this season’s chrome trend.',
  metrics: [
    { value: '18', label: 'Featured Artists' },
    { value: '42', label: 'Chrome Designs' },
    { value: '6', label: 'Participating Shops' },
    { value: '11', label: 'Vendor Collections' },
  ],
  cta: {
    label: 'Explore Chrome',
    href: '#',
    ariaLabel: 'Explore Summer Chrome Week',
  },
  artwork: {
    src: '/assets/anitaset/artist-district/spotlight/summer-chrome-week.png',
    alt: 'A luxury editorial arrangement of chrome nail designs shown on hands with varied skin tones.',
  },
  theme: 'chrome-editorial',
  status: 'active',
};
