#!/bin/bash

echo "Final cleanup of remaining API files..."

# List of files that still have issues
FILES=(
"src/app/api/assignments/[id]/submit/route.ts"
"src/app/api/assignments/[id]/violations/route.ts"
"src/app/api/auth/verify-2fa-setup/route.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Replace $executeRaw with db.query
        sed -i 's/await db\.\$executeRaw(/await db.query(/g' "$file"
        sed -i 's/db\.\$executeRaw(/db.query(/g' "$file"
        
        # Replace $queryRaw with db.query
        sed -i 's/await db\.\$queryRaw/await db.query/g' "$file"
        sed -i 's/db\.\$queryRaw/db.query/g' "$file"
        
        # Fix template literals to proper parameters
        sed -i 's/`\([^`]*\)\${[^}]*}\([^`]*\)`/`\1$1\2`/g' "$file"
        
        echo "✓ Fixed $file"
    else
        echo "✗ File not found: $file"
    fi
done

echo ""
echo "Final API cleanup completed!"
