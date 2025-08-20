#!/bin/bash

# Database Migration Script - Update all API routes to use new database client
echo "🚀 Starting database migration for API routes..."

# Create backup directory
echo "📦 Creating backup directory..."
mkdir -p backup-api-routes

# List of files that need database updates
declare -a files=(
    "src/app/api/admin/stats/route.ts"
    "src/app/api/assignments/[assignmentId]/attempts/route.ts"
    "src/app/api/assignments/[assignmentId]/route.ts"
    "src/app/api/assignments/[assignmentId]/submissions/route.ts"
    "src/app/api/assignments/route.ts"
    "src/app/api/chat/rooms/[roomId]/route.ts"
    "src/app/api/chat/rooms/route.ts"
    "src/app/api/clubs/route.ts"
    "src/app/api/events/route.ts"
    "src/app/api/login/route.ts"
    "src/app/api/register/route.ts"
    "src/app/api/user/profile/route.ts"
    "src/app/api/members/route.ts"
    "src/app/api/dashboard/route.ts"
)

# Function to backup a file
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "📋 Backing up: $file"
        cp "$file" "backup-api-routes/$(basename "$file" .ts)-$(date +%Y%m%d-%H%M%S).ts"
    fi
}

# Function to update database imports
update_database_imports() {
    local file="$1"
    if [ -f "$file" ]; then
        echo "🔄 Updating database imports in: $file"
        
        # Replace old database imports with new ones
        sed -i 's/import.*prisma.*from.*lib\/prisma.*/import db from '\''@\/lib\/database'\'';/g' "$file"
        sed -i 's/import.*db.*from.*lib\/db.*/import db from '\''@\/lib\/database'\'';/g' "$file"
        sed -i 's/import.*database.*from.*lib\/database-old.*/import db from '\''@\/lib\/database'\'';/g' "$file"
        sed -i 's/import.*{.*query.*}.*from.*lib\/database.*/import db from '\''@\/lib\/database'\'';/g' "$file"
        
        # Replace prisma usage with db usage
        sed -i 's/prisma\./db\./g' "$file"
        
        # Replace specific database queries
        sed -i 's/query(/db.query(/g' "$file"
        sed -i 's/executeQuery(/db.query(/g' "$file"
        sed -i 's/pool\.query(/db.query(/g' "$file"
        
        echo "✅ Updated: $file"
    else
        echo "⚠️ File not found: $file"
    fi
}

# Main migration process
echo "🔄 Starting file migration..."

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        update_database_imports "$file"
    else
        echo "⚠️ Skipping non-existent file: $file"
    fi
done

echo ""
echo "🧹 Additional cleanup tasks..."

# Clean up any remaining database references
echo "🔍 Searching for remaining old database patterns..."
grep -r "import.*prisma" src/app/api/ --include="*.ts" | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    echo "📝 Found prisma import in: $file"
    update_database_imports "$file"
done

grep -r "import.*pool" src/app/api/ --include="*.ts" | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    echo "📝 Found pool import in: $file"
    update_database_imports "$file"
done

# Remove any import of old database files
find src/app/api/ -name "*.ts" -exec sed -i '/lib\/database-old/d' {} \;
find src/app/api/ -name "*.ts" -exec sed -i '/lib\/db/d' {} \;
find src/app/api/ -name "*.ts" -exec sed -i '/lib\/prisma/d' {} \;

echo ""
echo "🎯 Migration Summary:"
echo "✅ Enhanced database client created: src/lib/database.ts"
echo "✅ Old database client backed up: src/lib/database-old.ts"
echo "✅ API routes updated to use new database client"
echo "✅ Backup created in: backup-api-routes/"

echo ""
echo "🔍 Verification..."
echo "API routes with new database import:"
grep -r "import db from" src/app/api/ --include="*.ts" | wc -l
echo ""
echo "Remaining old database patterns:"
grep -r "import.*prisma\|import.*pool" src/app/api/ --include="*.ts" | wc -l

echo ""
echo "✨ Database migration complete!"
echo "📋 Next steps:"
echo "   1. Test the application with: npm run dev"
echo "   2. Check for any TypeScript errors"
echo "   3. Test database operations in each route"
echo "   4. Remove backup files once everything works"
