import React from 'react';
import ArtistDistrictHeader from './ArtistDistrictHeader';
import ArtistDistrictSection from './ArtistDistrictSection';
import { artistDistrictStyles as styles } from './artistDistrictStyles';

const sections = [
  {
    id: 'featured-nail-shops',
    title: 'Featured Nail Shops',
    shops: [
      { name: 'Velvet Petal Studio', location: 'Atlanta, GA', tags: ['Sculpted Gel', 'Chrome Florals', 'Soft Glam'], window: 'Rose quartz sets, tonal french tips, and luminous evening finishes.' },
      { name: 'Cherry Lacquer Loft', location: 'Brooklyn, NY', tags: ['3D Charms', 'Black Cherry', 'Editorial Sets'], window: 'High-shine sculptural nails styled for bold campaign moments.' },
      { name: 'Golden Hour Nails', location: 'Los Angeles, CA', tags: ['Aura Blends', 'Soft Gold', 'Minimal Art'], window: 'Sun-washed neutrals, gold flecks, and dreamy almond silhouettes.' },
    ],
  },
  {
    id: 'trending-this-week',
    title: 'Trending This Week',
    shops: [
      { name: 'Plum Theory Atelier', location: 'Chicago, IL', tags: ['Deep Plum', 'Cat Eye', 'Layered Jelly'], window: 'Moody magnetic finishes balanced with sheer cream dimension.' },
      { name: 'Rosette Nail Room', location: 'Austin, TX', tags: ['Rose Details', 'Gel-X', 'Coquette'], window: 'Ribbon-soft accents, blush gradients, and delicate pearl moments.' },
      { name: 'Cocoa Crown Studio', location: 'Charlotte, NC', tags: ['Cocoa Nudes', 'Gold Foil'], window: 'Warm neutral sets with restrained metallic shine and glossy depth.' },
    ],
  },
  {
    id: 'new-artists',
    title: 'New Artists',
    shops: [
      { name: 'Moonlit Mani House', location: 'Seattle, WA', tags: ['Celestial Art', 'Velvet Cat Eye'], window: 'Starry accents and dimensional shimmer for midnight-inspired sets.' },
      { name: 'Peony Press Nails', location: 'Portland, OR', tags: ['Pressed Florals', 'Cream Base', 'Micro French'], window: 'Pressed-petal designs layered over creamy wearable shapes.' },
      { name: 'Studio Maraschino', location: 'Miami, FL', tags: ['Cherry Tones', 'Gloss Gel', 'Tiny Charms'], window: 'Juicy cherry palettes with playful charms and glassy overlays.' },
    ],
  },
  {
    id: 'browse-all-nail-shops',
    title: 'Browse All Nail Shops',
    shops: [
      { name: 'The Gilded Cuticle', location: 'Nashville, TN', tags: ['Soft Gold', 'Sculpted Tips'], window: 'Polished gold accents and refined special-occasion silhouettes.' },
      { name: 'Amaranth Nail Social', location: 'Denver, CO', tags: ['Deep Plum', 'Abstract Lines', 'Short Sets'], window: 'Graphic linework and rich plum palettes made for everyday wear.' },
      { name: 'Blush Bloom Bureau', location: 'Phoenix, AZ', tags: ['Rose Quartz', 'Bloom Art'], window: 'Airbrushed florals, translucent pinks, and luminous top coats.' },
      { name: 'Noir Nectar Nails', location: 'Oakland, CA', tags: ['Black Cherry', 'Gothic Glam'], window: 'Dark syrup shades with metallic glints and dramatic length.' },
      { name: 'Pearl Orchard Studio', location: 'Boston, MA', tags: ['Pearl Accents', 'Milky Cream', 'Bridal'], window: 'Soft pearl details and creamy finishes for elegant celebrations.' },
      { name: 'Sugarplum Set House', location: 'New Orleans, LA', tags: ['Jelly Color', 'Gold Stars', 'Playful Art'], window: 'Sweet jelly layers with tiny golden starbursts and glossy shine.' },
    ],
  },
];

export default function ArtistDistrict() {
  return (
    <main style={styles.page} aria-labelledby="artist-district-title">
      <div style={styles.shell}>
        <ArtistDistrictHeader />
        {sections.map((section) => <ArtistDistrictSection key={section.id} {...section} />)}
      </div>
    </main>
  );
}

export { sections as artistDistrictSections };
