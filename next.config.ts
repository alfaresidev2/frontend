import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  images: {
    domains: ['influencer-mega-bucket.s3.ap-south-1.amazonaws.com','example.com','picsum.photos'],
  },
};

export default nextConfig;
