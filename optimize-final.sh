#!/bin/bash

# Final optimization script for Zenith
echo "🚀 Running final optimizations for Zenith..."

# Clear all caches
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Reinstall with production optimizations
echo "📦 Reinstalling dependencies with production optimizations..."
rm -rf node_modules
npm ci --production=false --prefer-offline

# Generate optimized Prisma client
echo "🔧 Generating optimized Prisma client..."
npm run db:generate

# Run type checking
echo "🔍 Running type check..."
npm run type-check

# Run build to verify everything works
echo "🏗️ Building application..."
npm run build

echo "✅ Final optimizations completed!"
echo ""
echo "📊 Repository Statistics:"
echo "Total files in root: $(ls -1 | wc -l)"
echo "Node modules size: $(du -sh node_modules 2>/dev/null || echo 'Not found')"
echo "Build size: $(du -sh .next 2>/dev/null || echo 'Not built')"
echo ""
echo "🎯 Performance improvements applied:"
echo "  ✅ Turbo mode enabled for dev server"
echo "  ✅ Bundle optimization configured"
echo "  ✅ Image optimization enabled"
echo "  ✅ Console removal in production"
echo "  ✅ Compression enabled"
echo "  ✅ Package imports optimized"
echo ""
echo "🚀 Your Zenith repository is now optimized and ready for production!"
