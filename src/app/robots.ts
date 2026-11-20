import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/chat/return/'] },
    sitemap: 'https://businesspaddy.com.ng/sitemap.xml',
  };
}
