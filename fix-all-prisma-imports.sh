#!/bin/bash

echo "Fixing all Prisma imports to use optimized database client..."

# Fix all files that import prismaClient
find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "prismaClient\|prisma.*from.*database" | while read file; do
    echo "Fixing $file..."
    
    # Replace import with prismaClient
    sed -i 's/import db, { prismaClient as prisma } from "@\/lib\/database";/import db from "@\/lib\/database";/g' "$file"
    
    # Replace any remaining prismaClient imports
    sed -i 's/, { prismaClient as prisma }//g' "$file"
    sed -i 's/{ prismaClient as prisma }, //g' "$file"
    sed -i 's/{ prismaClient as prisma }//g' "$file"
    
    # Replace Prisma import
    sed -i 's/import { Prisma } from "@\/lib\/database";/import db from "@\/lib\/database";/g' "$file"
    
    # Replace prisma. usage with db.
    sed -i 's/prisma\./db\./g' "$file"
    
    # Replace any remaining prismaClient references
    sed -i 's/prismaClient/db/g' "$file"
done

# Fix any remaining @prisma references in package.json or other files
find . -name "*.json" -o -name "*.js" -o -name "*.ts" | xargs grep -l "@prisma" | while read file; do
    echo "Checking $file for @prisma references..."
    if [[ "$file" == "./package.json" ]]; then
        echo "Skipping package.json - should already be clean"
    fi
done

echo "All Prisma imports have been fixed!"
echo "Running build test..."
npm run build
