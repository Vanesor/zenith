#!/bin/bash

echo "🔍 Comprehensive Database Operation Check"
echo "========================================"

echo "
1. Checking for MySQL placeholder syntax (?) in Database.query calls..."
grep -r "Database\.query.*\?" src/ --include="*.ts" --include="*.tsx" | head -10

echo "
2. Checking for proper PostgreSQL placeholders (\$1, \$2)..."
grep -r "Database\.query.*\$[0-9]" src/ --include="*.ts" --include="*.tsx" | wc -l
echo "   ^^ Number of Database.query calls with proper PostgreSQL syntax"

echo "
3. Checking for SELECT * queries (potentially inefficient)..."
grep -r "SELECT \*" src/ --include="*.ts" --include="*.tsx" | head -5

echo "
4. Checking for N+1 query patterns..."
grep -r "\.map.*async.*Database\.query\|for.*of.*Database\.query\|forEach.*Database\.query" src/ --include="*.ts" --include="*.tsx"

echo "
5. Checking for missing transaction usage in multi-step operations..."
grep -r "BEGIN\|COMMIT\|ROLLBACK\|transaction" src/ --include="*.ts" --include="*.tsx" | head -3

echo "
6. Checking specific files for optimization..."
echo "   - Assignments questions route (N+1 fix applied)"
grep -A5 -B5 "ANY(\$1)" src/app/api/assignments/[id]/questions/route.ts

echo "
7. Sample database operations validation..."
echo "   Checking user badges route for schema compliance..."
grep -A3 -B3 "badge_name\|badge_description" src/app/api/users/badges/route.ts

echo "
🎯 Summary & Recommendations:
- ✅ Use PostgreSQL parameter placeholders (\$1, \$2) instead of MySQL (?)
- 🚀 Replace N+1 query patterns with JOIN operations or bulk queries
- 📊 Use explicit column selection instead of SELECT *
- 🔄 Implement transactions for multi-step operations
- 🎯 Ensure all queries match database schema
"

echo "🎉 Database operation check complete!"
echo "📝 Review the output above for any issues that need fixing."
