#!/bin/bash
# Master Migration Script for PostgreSQL to MySQL

set -e # Exit on error

echo "====================================================="
echo "Zenith Database Migration: PostgreSQL to MySQL"
echo "====================================================="
echo

# 1. Create migration directory
mkdir -p ./migration
echo "Created migration directory."
echo

# 2. Export PostgreSQL schema and convert to MySQL format
echo "Step 1: Exporting PostgreSQL schema and generating MySQL schema..."
bash ./scripts/postgres-to-mysql-migration.sh
echo "Basic schema conversion completed."
echo

# 3. Run enhanced schema converter
echo "Step 2: Running enhanced schema converter..."
node ./scripts/pg-to-mysql-converter.js ./migration/schema.sql ./migration/mysql_schema_enhanced.sql
echo "Enhanced schema conversion completed."
echo

# 4. Create MySQL database and import schema
echo "Step 3: Creating MySQL database and importing schema..."
bash ./scripts/create-mysql-db.sh
echo "Database and schema creation completed."
echo

# 5. Import data
echo "Step 4: Importing data into MySQL..."
bash ./scripts/import-mysql-data.sh
echo "Data import completed."
echo

echo "====================================================="
echo "Migration completed successfully!"
echo "====================================================="
echo
echo "Post-migration tasks:"
echo "1. Verify data integrity"
echo "2. Update application connection settings"
echo "3. Run tests to ensure application works with MySQL"
echo
