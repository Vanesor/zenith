#!/bin/bash
# MySQL Schema Creation Script

set -e # Exit on error

# Configuration - modify these variables
MYSQL_HOST="localhost"
MYSQL_PORT="3306"
MYSQL_USER="root"
MYSQL_PASSWORD="" # Set password or use environment variable
MYSQL_DB="zenith"

echo "Creating MySQL database and importing schema..."

# Create database if it doesn't exist
echo "CREATE DATABASE IF NOT EXISTS ${MYSQL_DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" | \
mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PASSWORD}

echo "Database ${MYSQL_DB} created or confirmed existing."

# Import the MySQL schema
if [ -f "./migration/mysql_schema_enhanced.sql" ]; then
  echo "Importing enhanced schema..."
  mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DB} < ./migration/mysql_schema_enhanced.sql
  echo "Enhanced schema imported successfully."
elif [ -f "./migration/mysql_schema.sql" ]; then
  echo "Importing basic schema..."
  mysql -h${MYSQL_HOST} -P${MYSQL_PORT} -u${MYSQL_USER} -p${MYSQL_PASSWORD} ${MYSQL_DB} < ./migration/mysql_schema.sql
  echo "Basic schema imported successfully."
else
  echo "ERROR: No schema file found in ./migration/ directory."
  echo "Run postgres-to-mysql-migration.sh or pg-to-mysql-converter.js first."
  exit 1
fi

echo "Schema import completed."
echo "Next step: Import data using the mysql_import.sql script."
