#!/bin/bash
# Auth System Migration Script
# Consolidates all auth imports to use the new unified auth system

echo "🔄 Migrating auth imports to unified auth system..."

# Update all AuthMiddleware imports
find . -name "*.ts" -type f -exec grep -l "from.*AuthMiddleware" {} \; | while read file; do
    echo "📝 Updating $file"
    sed -i 's/from "@\/lib\/AuthMiddleware"/from "@\/lib\/auth-unified"/g' "$file"
done

# Update all basic auth imports (but preserve auth-options)
find . -name "*.ts" -type f -exec grep -l "from.*@\/lib\/auth\"" {} \; | while read file; do
    echo "📝 Updating $file"
    sed -i 's/from "@\/lib\/auth"/from "@\/lib\/auth-unified"/g' "$file"
done

# Update authUtils imports
find . -name "*.ts" -type f -exec grep -l "from.*authUtils" {} \; | while read file; do
    echo "📝 Updating $file"
    sed -i 's/from "@\/lib\/authUtils"/from "@\/lib\/auth-unified"/g' "$file"
done

# Update FastAuth imports - more complex as we need to replace methods
find . -name "*.ts" -type f -exec grep -l "FastAuth" {} \; | while read file; do
    echo "⚠️  Manual review needed for FastAuth in: $file"
    echo "   - Replace FastAuth.verifyToken() with verifyToken()"
    echo "   - Replace FastAuth.getUserFromRequest() with verifyAuth()"
    echo "   - Replace FastAuth.generateAccessToken() with generateToken()"
    echo "   - Replace FastAuth.generateRefreshToken() with generateRefreshToken()"
done

echo "✅ Basic import migration complete!"
echo ""
echo "📋 Summary of changes:"
echo "   ✅ Created auth-unified.ts with all auth functions"
echo "   ✅ Optimized auth-options.ts for NextAuth"
echo "   ✅ Removed redundant files: auth.ts, AuthMiddleware.ts, authUtils.ts, FastAuth.ts"
echo "   🔄 Updated imports to use auth-unified.ts"
echo ""
echo "🔧 Manual steps required:"
echo "   1. Review files using FastAuth and update method calls"
echo "   2. Test authentication flows"
echo "   3. Update any remaining custom implementations"
echo ""
echo "🚀 Benefits achieved:"
echo "   - Single source of truth for authentication"
echo "   - Optimized database queries with proper parameter arrays"
echo "   - Consolidated session management"
echo "   - Removed duplicate code and dependencies"
echo "   - Better TypeScript typing and error handling"
