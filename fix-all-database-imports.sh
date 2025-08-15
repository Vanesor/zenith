#!/bin/bash

# Comprehensive script to update all database imports to use consolidated database

echo "🔄 Updating all database imports to use consolidated database..."

# Find all TypeScript files and update imports
find src/ -name "*.ts" -o -name "*.tsx" | while read -r file; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Replace import statements
        sed -i 's|import.*from.*"@/lib/database";|import { Database } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"@/lib/PrismaDatabase";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"@/lib/prisma";|import { prisma } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"@/lib/OptimizedPrismaDB";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
        
        # Also handle relative imports
        sed -i 's|import.*from.*"\.\./\.\./lib/database";|import { Database } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"\.\./\.\./lib/PrismaDatabase";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"\.\./lib/database";|import { Database } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"\.\./lib/PrismaDatabase";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"\./database";|import { Database } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import.*from.*"\./PrismaDatabase";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
        
        # Handle default imports that might be named differently
        sed -i 's|import Database from.*"@/lib/database";|import { Database } from "@/lib/database-consolidated";|g' "$file"
        sed -i 's|import PrismaDB from.*"@/lib/PrismaDatabase";|import PrismaDB from "@/lib/database-consolidated";|g' "$file"
    fi
done

echo "✅ Import updates complete!"

# Count remaining references
echo ""
echo "📊 Checking remaining references..."
echo "PrismaDatabase.ts references:" $(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -c "PrismaDatabase" 2>/dev/null | awk -F: '{sum += $2} END {print sum}' 2>/dev/null || echo "0")
echo "database.ts references:" $(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -c 'from.*"@/lib/database"' 2>/dev/null | awk -F: '{sum += $2} END {print sum}' 2>/dev/null || echo "0")
echo "prisma.ts references:" $(find src/ -name "*.ts" -o -name "*.tsx" | xargs grep -c 'from.*"@/lib/prisma"' 2>/dev/null | awk -F: '{sum += $2} END {print sum}' 2>/dev/null || echo "0")

echo ""
echo "🎯 Import migration script completed!"
