import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // libSQL ships a native driver; keep it out of the server bundle.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  experimental: {
    // Admin photo uploads go through a Server Action (and the proxy): 8 photos × 12 MB per batch.
    serverActions: { bodySizeLimit: '100mb' },
    proxyClientMaxBodySize: '100mb',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // When listings move to a CMS/CDN, allow its image host here, e.g.
    // remotePatterns: [{ protocol: 'https', hostname: 'images.example-cms.com' }],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
