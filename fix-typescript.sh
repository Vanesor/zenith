#!/bin/bash

# TypeScript Error Fix Script
echo "🔧 Fixing TypeScript errors in API routes..."

# Fix manage route - replace any with unknown
echo "Fixing manage route..."
sed -i 's/: any/: unknown/g' src/app/api/assignments/[id]/manage/route.ts

# Fix questions route - replace any with unknown and let with const
echo "Fixing questions route..."
sed -i 's/: any/: unknown/g' src/app/api/assignments/[id]/questions/route.ts
sed -i 's/let questionsToReturn/const questionsToReturn/g' src/app/api/assignments/[id]/questions/route.ts

# Fix report route - replace any with unknown
echo "Fixing report route..."
sed -i 's/: any/: unknown/g' src/app/api/assignments/[id]/report/route.ts

# Fix results route - replace any with unknown and let with const
echo "Fixing results route..."
sed -i 's/: any/: unknown/g' src/app/api/assignments/[id]/results/route.ts
sed -i 's/let testCaseResults/const testCaseResults/g' src/app/api/assignments/[id]/results/route.ts

# Fix main route - replace any with unknown
echo "Fixing main route..."
sed -i 's/: any/: unknown/g' src/app/api/assignments/[id]/route.ts

echo "✅ TypeScript error fixes applied!"
