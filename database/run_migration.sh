#!/bin/bash

# ==============================================================================
# ZENITH FORUM - SINGLE CLUB MIGRATION SCRIPT
# ==============================================================================
# This script performs the complete migration from multiple clubs per user
# to single club per user with college email validation
# ==============================================================================

echo "🚀 Starting Zenith Forum Single Club Migration..."
echo "=================================================="

# Check if PostgreSQL is running
echo "📋 Checking PostgreSQL connection..."
psql -U postgres -d zenith_forum -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Error: Cannot connect to PostgreSQL database 'zenith_forum'"
    echo "   Please ensure PostgreSQL is running and the database exists."
    exit 1
fi

echo "✅ PostgreSQL connection successful"

# Run the migration SQL script
echo ""
echo "🔄 Running database migration..."
echo "--------------------------------"

psql -U postgres -d zenith_forum -f "01_single_club_migration.sql"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database migration completed successfully!"
    echo ""
    echo "📊 Migration Summary:"
    echo "   - Users now have single club membership (club_id column)"
    echo "   - College email validation constraint added"
    echo "   - Helper functions created for club management"
    echo "   - All test data updated with proper college emails"
    echo ""
    echo "🔑 Test Credentials:"
    echo "   College Student: demo@stvincentngp.edu.in / password123"
    echo "   President: president@stvincentngp.edu.in / password123" 
    echo "   Coordinator: ascend.coordinator@stvincentngp.edu.in / password123"
    echo ""
    echo "🎯 Business Rules Implemented:"
    echo "   ✓ Students can only join ONE club at a time"
    echo "   ✓ College emails must end with @stvincentngp.edu.in"
    echo "   ✓ External users can also join (limited to one club)"
    echo "   ✓ All data is now dynamic, not static"
    echo ""
    echo "🚀 Next Steps:"
    echo "   1. Restart your Next.js development server"
    echo "   2. Test login with updated credentials"
    echo "   3. Verify single club restriction in UI"
    echo "   4. Test email validation during registration"
    echo ""
    echo "✨ Migration completed successfully! ✨"
else
    echo ""
    echo "❌ Migration failed! Please check the error messages above."
    echo "   - Ensure the database is accessible"
    echo "   - Check for conflicting data"
    echo "   - Verify SQL syntax in migration file"
    exit 1
fi
