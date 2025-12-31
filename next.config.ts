import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.fal.media',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
