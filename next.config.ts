import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'localhost',
      'qpulpytptbwwumicyzwr.supabase.co', // Add your Supabase project URL
    ],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3001',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
