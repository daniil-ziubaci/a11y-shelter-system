import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

const nextConfig: NextConfig = {
  async headers() {
    const galleryCache = {
      source: "/shelters/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    };
    if (process.env.ALLOW_INDEXING === "true") {
      return [galleryCache];
    }
    return [
      galleryCache,
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseUrl.hostname,
        pathname: "/storage/v1/object/public/pet-photos/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
