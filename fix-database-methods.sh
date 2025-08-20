#!/bin/bash

# Script to replace Database method calls with SQL queries

FILES=(
"src/app/api/clubs/membership/route.ts"
"src/app/api/posts/[id]/route_fixed.ts"
"src/app/api/auth/refresh/route.ts"
)

echo "Fixing Database method calls..."

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "Processing: $file"
        
        # Replace Database.getUserById calls
        sed -i 's/await Database\.getUserById(\([^)]*\))/await db.query(`SELECT id, email, name, role, club_id FROM users WHERE id = $1 AND deleted_at IS NULL`, [\1]).then(r => r.rows[0] || null)/g' "$file"
        
        # Replace Database.getClubById calls
        sed -i 's/await Database\.getClubById(\([^)]*\))/await db.query(`SELECT * FROM clubs WHERE id = $1 AND deleted_at IS NULL`, [\1]).then(r => r.rows[0] || null)/g' "$file"
        
        # Replace Database.joinClub calls
        sed -i 's/await Database\.joinClub(\([^,]*\), \([^)]*\))/await db.query(`UPDATE users SET club_id = $1, updated_at = NOW() WHERE id = $2`, [\2, \1])/g' "$file"
        
        # Replace Database.leaveClub calls
        sed -i 's/await Database\.leaveClub(\([^)]*\))/await db.query(`UPDATE users SET club_id = NULL, updated_at = NOW() WHERE id = $1`, [\1])/g' "$file"
        
        # Replace Database.switchClub calls
        sed -i 's/await Database\.switchClub(\([^,]*\), \([^)]*\))/await db.query(`UPDATE users SET club_id = $1, updated_at = NOW() WHERE id = $2`, [\2, \1])/g' "$file"
        
        echo "✓ Fixed $file"
    else
        echo "✗ File not found: $file"
    fi
done

echo ""
echo "Database method call fixes completed!"
