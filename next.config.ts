import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // TypeScript configuration
  typescript: {
    // Allow production builds to complete despite TypeScript errors
    ignoreBuildErrors: true,
  },
  
  // ESLint configuration  
  eslint: {
    // Allow production builds to complete despite ESLint errors during development
    ignoreDuringBuilds: true,
  },

  // Turbopack configuration (stable)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
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
      {
        protocol: 'https',
        hostname: 'qpulpytptbwwumicyzwr.supabase.co',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' ? {
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: true,
    }
  } : {}),

  // Webpack optimizations
  webpack: (config: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
          },
          react: {
            test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
            name: 'react',
            priority: 20,
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
