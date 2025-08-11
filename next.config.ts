import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: ['localhost'], // Allow localhost images
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
