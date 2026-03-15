import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://clipforge.vercel.app', lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: 'https://clipforge.vercel.app/login', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://clipforge.vercel.app/signup', lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: 'https://clipforge.vercel.app/privacy', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: 'https://clipforge.vercel.app/terms', lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ];
}
