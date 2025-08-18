#!/bin/bash

# Script to fix database-consolidated references in the codebase
# This will update all files to use the new database.ts structure

# Find all files that import from database-consolidated
grep -l -r "import.*database-consolidated" --include="*.ts" --include="*.tsx" src/ > affected_files.txt

# Process each file to update imports
while IFS= read -r file; do
  echo "Processing $file..."
  
  # Fix PrismaDB imports
  sed -i 's/import PrismaDB.*from.*database-consolidated.*/import db from ".\/database";/g' "$file"
  sed -i 's/import PrismaDB.*from.*@\/lib\/database-consolidated.*/import db from "@\/lib\/database";/g' "$file"
  
  # Fix Database imports
  sed -i 's/import.*{ Database }.*from.*database-consolidated.*/import db from ".\/database";/g' "$file"
  sed -i 's/import.*{ Database }.*from.*@\/lib\/database-consolidated.*/import db from "@\/lib\/database";/g' "$file"
  
  # Fix prisma imports
  sed -i 's/import.*{ prisma }.*from.*database-consolidated.*/import { prismaClient as prisma } from ".\/database";/g' "$file"
  sed -i 's/import.*{ prisma }.*from.*@\/lib\/database-consolidated.*/import { prismaClient as prisma } from "@\/lib\/database";/g' "$file"
  
  # Fix combined imports
  sed -i 's/import.*{ prisma, Database }.*from.*database-consolidated.*/import db, { prismaClient as prisma } from ".\/database";/g' "$file"
  sed -i 's/import.*{ prisma, Database }.*from.*@\/lib\/database-consolidated.*/import db, { prismaClient as prisma } from "@\/lib\/database";/g' "$file"
  
  # Fix UUIDUtils imports
  sed -i 's/import.*{ UUIDUtils }.*from.*database-consolidated.*/import db from ".\/database";/g' "$file"
  sed -i 's/import.*{ UUIDUtils }.*from.*@\/lib\/database-consolidated.*/import db from "@\/lib\/database";/g' "$file"

  # Replace dynamic imports
  sed -i 's/await import(.\/database-consolidated)/await import(".\/database")/g' "$file"
  sed -i 's/await import(@\/lib\/database-consolidated)/await import("@\/lib\/database")/g' "$file"
  
  # Replace Database.query with db.executeRawQuery
  sed -i 's/Database\.query/db.executeRawQuery/g' "$file"
  
  # Replace PrismaDB.getClient() with prisma
  sed -i 's/PrismaDB\.getClient()/prisma/g' "$file"
  
  # Fix dynamic references to Database object from dynamic imports
  sed -i 's/const { Database }/const db/g' "$file"
  sed -i 's/dbModule\.Database/db/g' "$file"
  
  # Fix UUIDUtils usage - remove processParams calls
  sed -i 's/UUIDUtils\.processParams(\([^)]*\))/\1/g' "$file"
  
  echo "Completed processing $file"
done < affected_files.txt

echo "Fixing completed. Some files may still need manual adjustments."
