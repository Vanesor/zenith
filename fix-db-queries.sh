#!/bin/bash

# Script to fix Prisma raw queries to enhanced database client queries
# This replaces $queryRaw and $executeRaw with db.query()

FILES=(
"src/app/api/assignments/[id]/manage/route.ts"
"src/app/api/assignments/[id]/questions/route.ts"
"src/app/api/assignments/[id]/report/route.ts"
"src/app/api/assignments/[id]/results/route.ts"
"src/app/api/assignments/[id]/route.ts"
"src/app/api/assignments/[id]/submissions/route.ts"
"src/app/api/auth/2fa/unified-verify/route.ts"
"src/app/api/auth/forgot-password/route.ts"
"src/app/api/auth/send-verification/route.ts"
"src/app/api/auth/set-password/route.ts"
"src/app/api/auth/verify-2fa-setup/route.ts"
"src/app/api/clubs/[clubId]/management/route.ts"
"src/app/api/clubs/[clubId]/members/[memberId]/route.ts"
"src/app/api/comments/[id]/like/route.ts"
"src/app/api/comments/[id]/like-count/route.ts"
"src/app/api/comments/[id]/route.ts"
"src/app/api/comments/[id]/user-like/route.ts"
"src/app/api/events/[id]/attend/route.ts"
"src/app/api/events/[id]/details/route.ts"
"src/app/api/events/[id]/join/route.ts"
"src/app/api/posts/[id]/route_fixed.ts"
)

echo "Fixing database queries in API files..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Replace $queryRaw with db.query
        sed -i 's/db\.\$queryRaw(/db.query(/g' "$file"
        
        # Replace $executeRaw with db.query (for statements that return data)
        sed -i 's/db\.\$executeRaw(/db.query(/g' "$file"
        
        echo "✓ Fixed $file"
    else
        echo "✗ File not found: $file"
    fi
done

echo ""
echo "Database query fixes completed!"
echo "Note: Manual review may be needed for specific cases."
