import type { MetadataRoute } from 'next';

/** Web app manifest: "Add to Home Screen" on phones, and a mobile-friendliness signal. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'V-Star Properties',
    short_name: 'V-Star',
    description:
      'Houses, townhouses, apartments and land for sale and rent in San Fernando and South Trinidad.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2568A7',
    lang: 'en-TT',
    categories: ['business', 'lifestyle'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
