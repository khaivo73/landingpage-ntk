import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  const url = process.env.SITE_URL;
  if (!url || process.env.SITE_INDEXABLE !== "true") return [];
  return [
    { url, changeFrequency: "monthly", priority: 1 },
    {
      url: `${url}/chinh-sach-bao-mat`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
