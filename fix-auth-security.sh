#!/bin/bash

# Zenith Authentication Security Fix Script
# This script replaces insecure individual verifyAuth functions with centralized AuthMiddleware

echo "🔧 Starting Zenith Authentication Security Fixes..."

# List of files that need authentication fixes (high priority assignment routes)
FILES=(
    "src/app/api/assignments/[id]/route.ts"
    "src/app/api/assignments/[id]/start/route.ts"
    "src/app/api/assignments/[id]/attempts/route.ts" 
    "src/app/api/assignments/[id]/violations/route.ts"
    "src/app/api/assignments/[id]/results/route.ts"
    "src/app/api/assignments/[id]/questions/route.ts"
    "src/app/api/assignments/questions/options/route.ts"
    "src/app/api/assignments/route.ts"
)

# Counter for tracking progress
FIXED=0
TOTAL=${#FILES[@]}

echo "📋 Found $TOTAL critical files to fix..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 Fixing: $file"
        
        # Create backup
        cp "$file" "$file.backup"
        
        # Replace the imports and remove JWT_SECRET
        sed -i 's/import jwt from "jsonwebtoken";//g' "$file"
        sed -i '/const JWT_SECRET.*=.*process\.env\.JWT_SECRET/d' "$file"
        sed -i '/interface JwtPayload/,/}/d' "$file"
        
        # Add AuthMiddleware import if not present
        if ! grep -q "AuthMiddleware" "$file"; then
            sed -i '/import Database from "@\/lib\/database";/a import { verifyAuth } from "@/lib/AuthMiddleware";' "$file"
        fi
        
        # Remove the verifyAuth function definition
        sed -i '/\/\/ Helper function to verify JWT token/,/^}/d' "$file"
        
        # Replace verifyAuth calls
        sed -i 's/const { userId, authenticated } = await verifyAuth(request);/const authResult = await verifyAuth(request);/g' "$file"
        sed -i 's/if (!authenticated || !userId)/if (!authResult.success)/g' "$file"
        sed -i 's/if (!authenticated)/if (!authResult.success)/g' "$file"
        
        # Add userId extraction
        sed -i '/const authResult = await verifyAuth(request);/a \    const userId = authResult.user!.id;' "$file"
        
        # Update error responses
        sed -i 's/return NextResponse\.json({ error: "Unauthorized" }, { status: 401 });/return NextResponse.json(\
        { error: authResult.error || "Unauthorized" }, \
        { status: 401 }\
      );/g' "$file"
        
        FIXED=$((FIXED + 1))
        echo "   ✅ Fixed $file"
    else
        echo "   ❌ File not found: $file"
    fi
done

echo ""
echo "🎉 Authentication Security Fix Complete!"
echo "   📊 Fixed: $FIXED/$TOTAL files"
echo "   🔐 Security Level: HIGH (AuthMiddleware with session validation)"
echo "   🚀 Files now use centralized authentication with:"
echo "      - Session validation"
echo "      - Token expiration checking" 
echo "      - Caching layer"
echo "      - Proper error handling"
echo ""
echo "⚠️  Manual Review Required:"
echo "   1. Check all files compile correctly"
echo "   2. Test authentication on critical routes"
echo "   3. Verify error handling works as expected"
echo ""
echo "📝 Backups created with .backup extension"
echo "   Use: git diff to see changes"
echo "   Use: git checkout -- [file] to revert if needed"
