#!/bin/bash

# Database connection details from .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zenith
DB_USER=zenithpostgres
DB_PASSWORD=AtharvaAyush

# Create output directories
mkdir -p db_export/csv

# Set the date for filename
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")

# Export schema (structure only) to schema.sql
echo "Exporting database schema to schema.sql..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --schema-only \
  --no-owner \
  --no-privileges \
  > schema.sql

echo "Schema export completed."

# Get a list of all tables in the database
TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "\dt" | awk '{print $3}')

# Export data from each table to CSV
echo "Exporting table data to CSV files..."
for TABLE in $TABLES
do
    echo "Exporting $TABLE to CSV..."
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\COPY $TABLE TO 'db_export/csv/$TABLE.csv' WITH CSV HEADER"
done

echo "CSV exports completed."

# Create a complete dump with both schema and data
echo "Creating complete database dump..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --no-owner \
  --no-privileges \
  > "complete_dump_$TIMESTAMP.sql"

echo "Complete dump created as complete_dump_$TIMESTAMP.sql"

# Create a compressed archive of all exports
echo "Creating compressed archive of all exports..."
tar -czf "zenith_db_export_$TIMESTAMP.tar.gz" schema.sql db_export complete_dump_$TIMESTAMP.sql

echo "Database export completed successfully!"
echo "Files created:"
echo "- schema.sql (database schema only)"
echo "- db_export/csv/ (CSV files for each table)"
echo "- complete_dump_$TIMESTAMP.sql (complete dump with schema and data)"
echo "- zenith_db_export_$TIMESTAMP.tar.gz (compressed archive of all exports)"
