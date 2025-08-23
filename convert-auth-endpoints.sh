#!/bin/bash

# Script to convert API endpoints from manual JWT verification to unified auth system

echo "🔄 Converting API endpoints to use unified auth system..."

# List of files that need to be converted
files=(
    "src/app/api/projects/join/route.ts"
    "src/app/api/projects/[id]/permissions/route.ts"
    "src/app/api/projects/[id]/members/route.ts"
    "src/app/api/projects/[id]/invite/route.ts"
    "src/app/api/projects/[id]/invitable-users/route.ts"
    "src/app/api/projects/[id]/tasks/route.ts"
    "src/app/api/projects/[id]/tasks/[taskId]/route.ts"
    "src/app/api/tasks/[id]/assign/route.ts"
    "src/app/api/tasks/[id]/status/route.ts"
    "src/app/api/images/upload/route.ts"
    "src/app/api/images/[imageId]/route.ts"
    "src/app/api/profile/upload-avatar/route.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Processing: $file"
        
        # Add verifyAuth import if not already present
        if ! grep -q "verifyAuth" "$file"; then
            # Add import after existing imports
            sed -i '/^import.*from/a import { verifyAuth } from '\''@/lib/auth-unified'\'';' "$file"
        fi
        
        # Replace JWT verification patterns
        sed -i 's/jwt\.verify(token, .*JWT_SECRET.*)/verifyAuth(request)/g' "$file"
        sed -i 's/const decoded = jwt\.verify.*$/const authResult = await verifyAuth(request);/g' "$file"
        
        # Replace error handling
        sed -i 's/decoded\.userId/authResult.user?.id/g' "$file"
        sed -i 's/decoded\.email/authResult.user?.email/g' "$file"
        
        echo "✅ Updated: $file"
    else
        echo "⚠️  File not found: $file"
    fi
done

echo "🎉 Conversion completed!"
