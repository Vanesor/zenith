#!/bin/bash

# Zenith Repository Cleanup Script
# This script removes unused/duplicate files to optimize the repository

echo "🧹 Starting Zenith Repository Cleanup..."
echo "==========================================="

# Remove unused layout components
echo "📦 Removing unused layout components..."
rm -f src/components/AppLayout.tsx
rm -f src/components/Layout.tsx
rm -f src/components/SimpleLayoutWrapper.tsx

# Remove unused header components
echo "🎨 Removing unused header components..."
rm -f src/components/Header.tsx
rm -f src/components/NewHeader.tsx
rm -f src/components/TwoTierHeader.tsx
rm -f src/components/CollegeHeader.tsx

# Remove unused sidebar components
echo "🗂️ Removing unused sidebar components..."
rm -f src/components/ModernSidebar.tsx
rm -f src/components/NewSidebar.tsx

# Remove unused lib files
echo "🔧 Removing unused lib files..."
rm -f src/lib/encryption_new.ts

# Remove backup files
echo "🗑️ Removing backup files..."
rm -f src/app/login/page_backup.tsx

# Remove template files that aren't being used
echo "📄 Removing unused template files..."
rm -f src/app/layout-template.tsx

echo ""
echo "✅ Cleanup completed!"
echo ""
echo "📊 Summary of removed files:"
echo "   • 3 unused layout components"
echo "   • 4 unused header components"  
echo "   • 2 unused sidebar components"
echo "   • 1 unused lib file"
echo "   • 1 backup file"
echo "   • 1 unused template file"
echo ""
echo "💡 Remaining active files:"
echo "   • LayoutWrapper.tsx (main layout)"
echo "   • MainLayout.tsx (page layout)" 
echo "   • UnifiedHeader.tsx (header)"
echo "   • Sidebar.tsx (navigation)"
echo "   • NewFooter.tsx (footer)"
echo "   • encryption.ts (chat encryption)"
echo ""
