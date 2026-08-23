import type { MetadataRoute } from "next";

const BASE = "https://thievnsden.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/thoughts`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/loot`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    {
      url: `${BASE}/playground/face-the-den`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE}/playground/would-you-rather`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    { url: `${BASE}/afterimage`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/gaming`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
