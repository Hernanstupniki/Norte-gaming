import type { NextConfig } from "next";

const productionImageHost = process.env.NEXT_PUBLIC_IMAGE_HOST || process.env.NEXT_PUBLIC_SITE_HOSTNAME || "nortegaming.zubuagency.com";

const nextConfig: NextConfig = {
  images: {
    // Needed in local dev when backend media is served from localhost.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: productionImageHost,
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
