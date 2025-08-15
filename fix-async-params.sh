#!/bin/bash

# Fix async params in Next.js API routes
# This script updates the pattern `const { id } = params;` to `const { id } = await params;`

find /media/vane/Movies/Projects/zenith/src/app/api -name "route.ts" -type f -exec grep -l "const.*=.*params.*;" {} \; | while read file; do
    echo "Fixing async params in: $file"
    
    # Replace patterns like: const { id } = params;
    # With: const { id } = await params;
    sed -i 's/const { \([^}]*\) } = params;/const { \1 } = await params;/g' "$file"
    
    # Replace patterns like: const params = params;  
    # With: const params = await params;
    sed -i 's/const \([a-zA-Z_][a-zA-Z0-9_]*\) = params;/const \1 = await params;/g' "$file"
done

echo "Fixed async params in API routes"
