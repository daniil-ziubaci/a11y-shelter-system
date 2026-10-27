import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!);

const nextConfig: NextConfig = {
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
