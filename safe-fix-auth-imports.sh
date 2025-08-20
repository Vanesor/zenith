#!/bin/bash

# Safe script to fix auth imports without breaking syntax

echo "🔧 Safely fixing auth imports..."

# Get all files with old auth imports
files=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "FastAuth\|AuthMiddleware\|from.*@/lib/auth['\"]" | grep -v "auth-unified" | head -20)

for file in $files; do
    if [ -f "$file" ]; then
        echo "📝 Processing $file"
        
        # Only replace imports, not the whole structure
        # Replace FastAuth imports
        sed -i 's/import.*FastAuth.*from.*@\/lib\/FastAuth.*/import { verifyAuth, withAuth } from "@\/lib\/auth-unified";/g' "$file"
        
        # Replace AuthMiddleware imports  
        sed -i 's/import.*AuthMiddleware.*from.*@\/lib\/AuthMiddleware.*/import { verifyAuth, withAuth } from "@\/lib\/auth-unified";/g' "$file"
        
        # Replace basic auth imports
        sed -i 's/import.*from.*@\/lib\/auth['\''"];/import { verifyAuth, withAuth } from "@\/lib\/auth-unified";/g' "$file"
        
        # Replace method calls
        sed -i 's/FastAuth\.verifyToken/verifyAuth/g' "$file"
        sed -i 's/FastAuth\.getUserFromRequest/verifyAuth/g' "$file"
        sed -i 's/FastAuth\.requireAuth/withAuth/g' "$file"
        
        sed -i 's/AuthMiddleware\.verifyToken/verifyAuth/g' "$file"
        sed -i 's/AuthMiddleware\.requireAuth/withAuth/g' "$file"
        
        echo "✅ Updated $file"
    fi
done

echo "🎉 Safe auth import fixes completed!"
