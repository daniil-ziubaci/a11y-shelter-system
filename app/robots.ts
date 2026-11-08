import { isIndexingAllowed } from "@/lib/indexing";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/volunteer/", "/login", "/auth/"],
    },
    sitemap: isIndexingAllowed()
      ? `${process.env.SITE_URL!}/sitemap.xml`
      : undefined,
  };
}
