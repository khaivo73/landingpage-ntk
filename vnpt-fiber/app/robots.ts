import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const url = process.env.SITE_URL;
  const enabled = process.env.SITE_INDEXABLE === "true" && Boolean(url);
  return {
    rules: {
      userAgent: "*",
      ...(enabled ? { allow: "/" } : { disallow: "/" }),
    },
    ...(enabled ? { sitemap: `${url}/sitemap.xml` } : {}),
  };
}
