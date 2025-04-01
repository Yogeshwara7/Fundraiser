import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
      protocol: "https",
      hostname: "pixabay.com",
    },
    ],
  },
};

export default nextConfig;

