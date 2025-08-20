#!/bin/bash

# Script to fix Prisma to Raw SQL conversions in chat, events, and assignments

echo "🔧 Converting Prisma to Raw SQL for Chat, Events, and Assignments..."

# List of files that need to be fixed
FILES=(
    "src/app/api/chat/rooms/route.ts"
    "src/app/api/chat/rooms/[id]/route.ts"
    "src/app/api/chat/rooms/[id]/messages/route.ts"
    "src/app/api/chat/invite/route.ts"
    "src/app/api/chat/messages/[id]/react/route.ts"
    "src/app/api/assignments/route.ts"
    "src/app/api/assignments/[id]/attempts/route.ts"
    "src/app/api/user/assignment-history/route.ts"
    "src/app/api/user/submissions/route.ts"
)

echo "Found ${#FILES[@]} files to fix"

# Create a simple replacement function to convert common Prisma patterns
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "🔧 Processing: $file"
        
        # Backup the file
        cp "$file" "$file.prisma_backup"
        
        # Convert findUnique patterns
        sed -i 's/await db\.users\.findUnique({[^}]*where: { id: \([^}]*\) }[^}]*})/const userResult = await db.query(`SELECT * FROM users WHERE id = $1`, [\1]); const user = userResult.rows[0]/g' "$file"
        
        # Convert findMany patterns
        sed -i 's/await db\.\([a-zA-Z_]*\)\.findMany(/await db.query(`SELECT * FROM \1 WHERE/g' "$file"
        
        echo "  ✅ Converted $file (backup saved as $file.prisma_backup)"
    else
        echo "  ❌ File not found: $file"
    fi
done

echo "🎉 Basic conversion complete!"
echo "⚠️  Manual review and fixes may still be needed for complex queries"
