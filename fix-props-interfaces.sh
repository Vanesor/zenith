#!/bin/bash

# Fix Next.js API route Props interfaces to use Promise<{ id: string }>
# This fixes the Next.js 15 async params issue

find /media/vane/Movies/Projects/zenith/src/app/api -name "route.ts" -type f -exec grep -l "interface Props" {} \; | while read file; do
    echo "Fixing Props interface in: $file"
    
    # Replace: params: { id: string };
    # With: params: Promise<{ id: string }>;
    sed -i 's/params: { \([^}]*\) };/params: Promise<{ \1 }>;/g' "$file"
    
    # Also handle multi-param patterns
    sed -i 's/params: { \([^}]*\), \([^}]*\) };/params: Promise<{ \1, \2 }>;/g' "$file"
done

echo "Fixed Props interfaces in API routes"
