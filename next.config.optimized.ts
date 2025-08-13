// Frontend Performance Optimization Configuration
import type { NextConfig } from "next";
import * as path from "path";

const nextConfig: NextConfig = {
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'qpulpytptbwwumicyzwr.supabase.co',
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
    formats: ['image/webp', 'image/avif'], // Modern formats for better compression
    minimumCacheTTL: 31536000, // 1 year cache for images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@monaco-editor/react',
      '@headlessui/react'
    ],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    }
  },

  // Webpack optimizations
  webpack: (config, { isServer, dev }) => {
    // Only apply optimizations in production
    if (!dev && !isServer) {
      // Bundle splitting for better caching
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for stable libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              enforce: true,
              priority: 20,
            },
            // Monaco Editor separate chunk (large library)
            monaco: {
              test: /[\\/]node_modules[\\/]monaco-editor[\\/]/,
              name: 'monaco',
              chunks: 'all',
              enforce: true,
              priority: 30,
            },
            // React/Next.js framework chunk
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              chunks: 'all',
              enforce: true,
              priority: 25,
            },
            // UI libraries chunk
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|framer-motion|lucide-react)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              enforce: true,
              priority: 15,
            },
            // Default chunk for remaining code
            default: {
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Tree shaking optimization
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Module concatenation for better performance
      config.optimization.concatenateModules = true;
    }

    // SVG optimization
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Reduce bundle size by excluding source maps in production
    if (!dev) {
      config.devtool = false;
    }

    return config;
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Output optimization
  output: 'standalone',
  
  // Static page generation for better performance
  trailingSlash: false,
  
  // Security headers that also help with performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Cache static assets aggressively
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
      // API routes caching
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=600' // 5min browser, 10min CDN
          }
        ],
      },
      // Static assets long-term caching
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      }
    ];
  },

  // Rewrites for better SEO and performance
  async rewrites() {
    return [
      // Optimize common routes
      {
        source: '/clubs/:slug',
        destination: '/clubs/[slug]'
      },
      {
        source: '/posts/:id',
        destination: '/posts/[id]'
      }
    ];
  },
};

export default nextConfig;
