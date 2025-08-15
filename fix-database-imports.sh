#!/bin/bash
# Script to update database imports across the project
# This will update all imports to use the consolidated database file

# 1. Replace PrismaDatabase imports with database-consolidated
echo "Updating PrismaDatabase imports..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import PrismaDatabase from "\.\.\/lib\/PrismaDatabase"/import PrismaDB from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import PrismaDatabase from "@\/lib\/PrismaDatabase"/import PrismaDB from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as PrismaDatabase } from "@\/lib\/PrismaDatabase"/import PrismaDB from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as PrismaDatabase } from "\.\.\/lib\/PrismaDatabase"/import PrismaDB from "\.\.\/lib\/database-consolidated"/g'

# 2. Replace database.ts imports with database-consolidated
echo "Updating database imports..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import Database from "\.\.\/lib\/database"/import { Database } from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import Database from "@\/lib\/database"/import { Database } from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as Database } from "@\/lib\/database"/import { Database } from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as Database } from "\.\.\/lib\/database"/import { Database } from "\.\.\/lib\/database-consolidated"/g'

# 3. Replace prisma.ts imports with database-consolidated
echo "Updating prisma.ts imports..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { prisma } from "\.\.\/lib\/prisma"/import { prisma } from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { prisma } from "@\/lib\/prisma"/import { prisma } from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import prisma from "\.\.\/lib\/prisma"/import { prisma } from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import prisma from "@\/lib\/prisma"/import { prisma } from "@\/lib\/database-consolidated"/g'

# 4. Replace OptimizedPrismaDB imports with database-consolidated
echo "Updating OptimizedPrismaDB imports..."
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import OptimizedPrismaDB from "\.\.\/lib\/OptimizedPrismaDB"/import PrismaDB from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import OptimizedPrismaDB from "@\/lib\/OptimizedPrismaDB"/import PrismaDB from "@\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as OptimizedPrismaDB } from "\.\.\/lib\/OptimizedPrismaDB"/import PrismaDB from "\.\.\/lib\/database-consolidated"/g'
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/import { default as OptimizedPrismaDB } from "@\/lib\/OptimizedPrismaDB"/import PrismaDB from "\.\.\/lib\/database-consolidated"/g'

echo "Done updating imports. Now running a type check..."
npx tsc --noEmit

echo "Database import update complete!"
