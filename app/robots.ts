import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/volunteer/", "/login", "/auth/"],
    },
    sitemap: `${process.env.SITE_URL!}/sitemap.xml`,
  };
}
