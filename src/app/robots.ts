import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/company';

/**
 * /robots.txt: everything public is crawlable except the staff admin. (The saved page stays
 * crawlable on purpose: it carries noindex, which crawlers can only see if they may fetch it.)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin'] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
    host: siteUrl(),
  };
}
