import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/feed`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${siteUrl}/essenciais`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/anunciar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/perfil`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.82,
    },
    {
      url: `${siteUrl}/tokens`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.78,
    },
    {
      url: `${siteUrl}/entrar`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.74,
    },
    {
      url: `${siteUrl}/trabalhos`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.72,
    },
    {
      url: `${siteUrl}/chat`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.68,
    },
  ];
}
