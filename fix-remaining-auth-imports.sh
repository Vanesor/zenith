#!/bin/bash

# Script to fix remaining auth imports after consolidation

echo "🔧 Fixing remaining auth imports..."

# Files that need FastAuth imports updated
declare -a fastauth_files=(
    "src/app/api/assignments/[id]/attempts/route.ts"
    "src/app/api/assignments/[id]/route.ts"
)

# Files that need AuthMiddleware imports updated  
declare -a authmiddleware_files=(
    "src/app/api/assignments/[id]/results/route.ts"
    "src/app/api/assignments/[id]/route.ts"
)

# Files that need @/lib/auth imports updated
declare -a libauth_files=(
    "src/app/api/admin/stats/route.ts"
)

# Update FastAuth imports
for file in "${fastauth_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating FastAuth imports in $file"
        
        # Replace FastAuth import with auth-unified
        sed -i "s|import.*from.*['\"]@/lib/FastAuth['\"]|import { verifyAuth, withAuth } from '@/lib/auth-unified';|g" "$file"
        
        # Replace FastAuth method calls
        sed -i "s|FastAuth\.verifyToken|verifyAuth|g" "$file"
        sed -i "s|FastAuth\.getUserFromRequest|verifyAuth|g" "$file"
        sed -i "s|FastAuth\.requireAuth|withAuth|g" "$file"
        sed -i "s|FastAuth\.middleware|withAuth|g" "$file"
        
        echo "✅ Updated $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

# Update AuthMiddleware imports
for file in "${authmiddleware_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating AuthMiddleware imports in $file"
        
        # Replace AuthMiddleware import with auth-unified
        sed -i "s|import.*from.*['\"]@/lib/AuthMiddleware['\"]|import { verifyAuth, withAuth } from '@/lib/auth-unified';|g" "$file"
        
        # Replace AuthMiddleware method calls
        sed -i "s|AuthMiddleware\.verifyToken|verifyAuth|g" "$file"
        sed -i "s|AuthMiddleware\.requireAuth|withAuth|g" "$file"
        sed -i "s|AuthMiddleware\.middleware|withAuth|g" "$file"
        
        echo "✅ Updated $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

# Update @/lib/auth imports
for file in "${libauth_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Updating @/lib/auth imports in $file"
        
        # Replace @/lib/auth import with auth-unified
        sed -i "s|import.*from.*['\"]@/lib/auth['\"]|import { verifyAuth, withAuth } from '@/lib/auth-unified';|g" "$file"
        
        echo "✅ Updated $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 Auth import fixes completed!"
