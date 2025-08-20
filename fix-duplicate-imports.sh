#!/bin/bash

# Script to fix duplicate auth imports

echo "🔧 Fixing duplicate auth imports..."

declare -a files_to_fix=(
    "src/app/api/assignments/[id]/attempts/route.ts"
    "src/app/api/assignments/[id]/route.ts"
    "src/app/api/assignments/[id]/results/route.ts"
    "src/app/api/admin/stats/route.ts"
)

for file in "${files_to_fix[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Fixing duplicates in $file"
        
        # Remove duplicate auth-unified imports and merge them
        # First, remove all existing auth-unified imports
        sed -i '/import.*@\/lib\/auth-unified/d' "$file"
        
        # Add a single comprehensive import at the top after other imports
        sed -i '2a import { verifyAuth, withAuth } from "@/lib/auth-unified";' "$file"
        
        # Remove any trailing semicolons that might be duplicated
        sed -i 's/;;/;/g' "$file"
        
        echo "✅ Fixed $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 Duplicate import fixes completed!"
