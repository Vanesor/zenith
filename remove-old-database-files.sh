#!/bin/bash
# Script to remove old database files after migration to consolidated database

# Check if the import migration script has been run
if [ ! -f "DATABASE_MIGRATION_COMPLETE.md" ]; then
  echo "ERROR: Please run the fix-database-imports.sh script first and ensure all imports are updated!"
  echo "Once you've verified all imports are fixed, create DATABASE_MIGRATION_COMPLETE.md to mark completion."
  exit 1
fi

# Display a warning message
echo "WARNING: This script will remove old database files."
echo "Make sure you have run fix-database-imports.sh and fixed any issues."
echo "Do you want to continue? (y/n)"
read -r response
if [[ ! "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
  echo "Operation canceled."
  exit 0
fi

# Backup old database files
echo "Creating backups of old database files..."
mkdir -p backup/lib

if [ -f "src/lib/database.ts" ]; then
  cp src/lib/database.ts backup/lib/
fi

if [ -f "src/lib/PrismaDatabase.ts" ]; then
  cp src/lib/PrismaDatabase.ts backup/lib/
fi

if [ -f "src/lib/prisma.ts" ]; then
  cp src/lib/prisma.ts backup/lib/
fi

if [ -f "src/lib/OptimizedPrismaDB.ts" ]; then
  cp src/lib/OptimizedPrismaDB.ts backup/lib/
fi

# Remove old database files
echo "Removing old database files..."
rm -f src/lib/database.ts
rm -f src/lib/PrismaDatabase.ts
rm -f src/lib/prisma.ts
rm -f src/lib/OptimizedPrismaDB.ts

echo "Old database files removed successfully. Backups stored in backup/lib/ directory."
echo "Please run npm run dev to verify that the application still works correctly."
