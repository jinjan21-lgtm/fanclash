import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://fanclash.vercel.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://fanclash.vercel.app/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://fanclash.vercel.app/signup', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://fanclash.vercel.app/demo', lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: 'https://fanclash.vercel.app/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://fanclash.vercel.app/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
