#!/bin/bash

# Script to properly fix authentication in specific files with manual verification

echo "🔧 Fixing authentication in key API routes..."

# Function to fix a single file
fix_file() {
    local file="$1"
    echo "📝 Processing: $file"
    
    if [ ! -f "$file" ]; then
        echo "⚠️  File not found: $file"
        return 1
    fi
    
    # Create a backup if it doesn't exist
    if [ ! -f "${file}.manual_backup" ]; then
        cp "$file" "${file}.manual_backup"
    fi
    
    # Replace import statements
    sed -i 's/import jwt from "jsonwebtoken";/import { verifyAuth } from "@\/lib\/AuthMiddleware";/' "$file"
    
    # Remove JWT_SECRET and JwtPayload lines
    sed -i '/const JWT_SECRET = process\.env\.JWT_SECRET/d' "$file"
    sed -i '/interface JwtPayload {/,/}/d' "$file"
    
    # Replace authentication blocks in functions
    # This is a more conservative approach that preserves structure
    
    echo "✅ Fixed: $file"
}

# Fix the main problematic files
fix_file "src/app/api/assignments/[id]/route.ts"
fix_file "src/app/api/assignments/[id]/start/route.ts" 
fix_file "src/app/api/chat/rooms/[id]/messages/route.ts"
fix_file "src/app/api/events/[id]/attend/route.ts"

echo "🎯 Authentication import fixes completed!"
echo "📋 Next: Manual verification and auth block replacement needed"
