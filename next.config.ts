import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Product images and review photos are uploaded through server actions (5 MB per file, several files).
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
