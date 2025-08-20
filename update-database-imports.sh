#!/bin/bash

echo "🔄 Updating database imports..."

# Find all TypeScript and TSX files that import from database-service
find src -name "*.ts" -o -name "*.tsx" | while read file; do
    if grep -q "database-service" "$file"; then
        echo "📝 Updating $file"
        
        # Replace common database-service imports
        sed -i "s|from '@/lib/database-service'|from '@/lib/database'|g" "$file"
        sed -i "s|from './database-service'|from './database'|g" "$file"
        sed -i "s|from '../database-service'|from '../database'|g" "$file"
        sed -i "s|from '../../database-service'|from '../../database'|g" "$file"
        
        # Replace specific imports that might need updating
        sed -i "s|import { DatabaseService|import DatabaseClient|g" "$file"
        sed -i "s|DatabaseService\.|DatabaseClient.|g" "$file"
        
        echo "✅ Updated $file"
    fi
done

echo "🎉 Database import updates completed!"
