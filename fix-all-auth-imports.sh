#!/bin/bash

# Comprehensive script to fix all remaining auth imports

echo "🔧 Finding and fixing ALL remaining auth imports..."

# Get all TypeScript files with old auth imports
files_with_old_imports=$(find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "FastAuth\|AuthMiddleware\|@/lib/auth['\"]" 2>/dev/null || true)

if [ -z "$files_with_old_imports" ]; then
    echo "✅ No files found with old auth imports!"
    exit 0
fi

echo "📋 Found files with old auth imports:"
echo "$files_with_old_imports"
echo ""

# Process each file
echo "$files_with_old_imports" | while read file; do
    if [ -f "$file" ]; then
        echo "📝 Processing $file"
        
        # Create a backup
        cp "$file" "$file.backup"
        
        # Remove all old auth imports
        sed -i '/import.*FastAuth.*from/d' "$file"
        sed -i '/import.*AuthMiddleware.*from/d' "$file"
        sed -i '/import.*from.*@\/lib\/auth['\''"][^-]/d' "$file"
        sed -i '/import.*from.*@\/lib\/FastAuth/d' "$file"
        sed -i '/import.*from.*@\/lib\/AuthMiddleware/d' "$file"
        
        # Check if verifyAuth import already exists
        if ! grep -q "import.*verifyAuth.*from.*@/lib/auth-unified" "$file"; then
            # Add unified auth import after other imports
            sed -i '/^import/a import { verifyAuth, withAuth } from "@/lib/auth-unified";' "$file" | head -1
        fi
        
        # Replace method calls
        sed -i 's/FastAuth\.verifyToken/verifyAuth/g' "$file"
        sed -i 's/FastAuth\.getUserFromRequest/verifyAuth/g' "$file"
        sed -i 's/FastAuth\.requireAuth/withAuth/g' "$file"
        sed -i 's/FastAuth\.middleware/withAuth/g' "$file"
        
        sed -i 's/AuthMiddleware\.verifyToken/verifyAuth/g' "$file"
        sed -i 's/AuthMiddleware\.requireAuth/withAuth/g' "$file"
        sed -i 's/AuthMiddleware\.middleware/withAuth/g' "$file"
        
        # Clean up any duplicate imports
        awk '!seen[$0]++' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
        
        # Remove trailing semicolons
        sed -i 's/;;/;/g' "$file"
        
        echo "✅ Updated $file"
    fi
done

echo ""
echo "🎉 All auth import fixes completed!"
echo "💾 Backup files created with .backup extension"
