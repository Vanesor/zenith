#!/bin/bash

# Fix remaining Next.js API route param patterns
# This fixes inline param destructuring patterns

find /media/vane/Movies/Projects/zenith/src/app/api -name "route.ts" -type f -exec grep -l "{ params }: { params:" {} \; | while read file; do
    echo "Fixing inline params in: $file"
    
    # Replace: { params }: { params: { id: string } }
    # With: { params }: { params: Promise<{ id: string }> }
    sed -i 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }>/g' "$file"
done

echo "Fixed inline param patterns in API routes"
