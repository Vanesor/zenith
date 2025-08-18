#!/bin/bash

# This script updates database imports across the codebase to use the new database-service.ts file
# It will replace imports from various sources to use the centralized "@/lib/database"

echo "🔄 Starting database import updates..."
echo "📦 Consolidating imports to use @/lib/database"

# Exclude directories from search
EXCLUDE_DIRS="--exclude-dir=node_modules --exclude-dir=.next --exclude-dir=src/generated --exclude-dir=src/lib --exclude-dir=backup --exclude-dir=*backup --exclude-dir=*-backup --exclude-dir=*-old --exclude-dir=tmp"

# Count affected files for different import patterns
PRISMA_IMPORTS=$(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@prisma/client['\"]" /media/vane/Movies/Projects/zenith/src | wc -l)
DB_IMPORTS=$(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@/lib/db['\"]" /media/vane/Movies/Projects/zenith/src | wc -l)
OLD_PRISMA_IMPORTS=$(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@/lib/prisma['\"]" /media/vane/Movies/Projects/zenith/src | wc -l)

TOTAL_COUNT=$((PRISMA_IMPORTS + DB_IMPORTS + OLD_PRISMA_IMPORTS))

echo "🔍 Found imports to update:"
echo "   - $PRISMA_IMPORTS files with @prisma/client imports"
echo "   - $DB_IMPORTS files with @/lib/db imports"
echo "   - $OLD_PRISMA_IMPORTS files with @/lib/prisma imports"
echo "   - $TOTAL_COUNT total files to process"

# Function to update imports in a file
update_imports() {
  local file=$1
  local original_content=$(cat "$file")
  local updated_content
  
  # Replace direct Prisma client imports
  updated_content=$(echo "$original_content" | sed "s/from ['\"]@prisma\/client['\"]/from '@\/lib\/database'/g")
  
  # Replace PrismaClient instantiation
  updated_content=$(echo "$updated_content" | sed "s/new PrismaClient()/{*} from '@\/lib\/database'/g")
  updated_content=$(echo "$updated_content" | sed "s/new PrismaClient(/db(/g")
  
  # Replace imports from old locations
  updated_content=$(echo "$updated_content" | sed "s/from ['\"]@\/lib\/prisma['\"]/from '@\/lib\/database'/g")
  updated_content=$(echo "$updated_content" | sed "s/from ['\"]@\/lib\/db['\"]/from '@\/lib\/database'/g")
  
  # Replace specific common imports
  updated_content=$(echo "$updated_content" | sed "s/import { db } from '@\/lib\/db'/import { db } from '@\/lib\/database'/g")
  updated_content=$(echo "$updated_content" | sed "s/import db from '@\/lib\/db'/import db from '@\/lib\/database'/g")
  
  # Check if content was changed
  if [[ "$original_content" != "$updated_content" ]]; then
    echo "$updated_content" > "$file"
    echo "✅ Updated imports in $file"
    return 0
  else
    return 1
  fi
}

echo "🔄 Updating imports..."

# Process files with @prisma/client imports
FILES_UPDATED=0
while IFS= read -r file_with_line; do
  file=$(echo "$file_with_line" | cut -d':' -f1)
  
  if update_imports "$file"; then
    FILES_UPDATED=$((FILES_UPDATED + 1))
  fi
done < <(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@prisma/client['\"]" /media/vane/Movies/Projects/zenith/src 2>/dev/null || echo "")

# Process files with @/lib/db imports
while IFS= read -r file_with_line; do
  file=$(echo "$file_with_line" | cut -d':' -f1)
  
  if update_imports "$file"; then
    FILES_UPDATED=$((FILES_UPDATED + 1))
  fi
done < <(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@/lib/db['\"]" /media/vane/Movies/Projects/zenith/src 2>/dev/null || echo "")

# Process files with @/lib/prisma imports
while IFS= read -r file_with_line; do
  file=$(echo "$file_with_line" | cut -d':' -f1)
  
  if update_imports "$file"; then
    FILES_UPDATED=$((FILES_UPDATED + 1))
  fi
done < <(grep -r $EXCLUDE_DIRS --include="*.ts" --include="*.tsx" "from ['\"]@/lib/prisma['\"]" /media/vane/Movies/Projects/zenith/src 2>/dev/null || echo "")

echo "✨ Database import updates complete!"
echo "📊 Summary: Updated $FILES_UPDATED files out of $TOTAL_COUNT detected"
echo ""
echo "� The new database service now provides:"
echo "   - A singleton Prisma client"
echo "   - Helper functions for common database operations"
echo "   - Type-safe interfaces for all database operations"
echo ""
echo "📘 Usage examples:"
echo "   import { db, findUserByEmail } from '@/lib/database';"
echo ""
echo "⚠️ You may still need to manually check complex imports or usages."
