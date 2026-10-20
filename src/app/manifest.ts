import type { MetadataRoute } from 'next';

/**
 * Web app manifest: lets visitors add the site to their home screen and open it full-screen like an
 * app (the "mobile app" from the brand's coming-soon post, first step). Offline support would also
 * need a service worker.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Al Khoury Real Estate',
    short_name: 'Al Khoury',
    description: 'Houses, apartments, commercial property and land to buy or rent across Lebanon.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0b0b0c',
    categories: ['business', 'lifestyle'],
    lang: 'en',
    dir: 'auto',
    icons: [
      { src: '/brand/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/brand/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/brand/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Properties', short_name: 'Properties', url: '/en/listings' },
      { name: 'العقارات', short_name: 'العقارات', url: '/ar/listings' },
    ],
  };
}
