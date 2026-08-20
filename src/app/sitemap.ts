import type { MetadataRoute } from "next";

const BASE = "https://thievnsden.com";

const thoughts = [
  "borrowed-goals",
  "never-impressive",
  "stop-explaining",
  "lonely-in-a-crowd",
  "staying-too-long",
  "becoming-what-you-hated",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/thoughts`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/loot`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/playground`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/gaming`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/join`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];

  const thoughtPages: MetadataRoute.Sitemap = thoughts.map((slug) => ({
    url: `${BASE}/thoughts/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticPages, ...thoughtPages];
}
