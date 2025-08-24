#!/bin/bash

# Database connection details from .env.local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=zenith
DB_USER=zenithpostgres
DB_PASSWORD=AtharvaAyush

# Create output directories
mkdir -p db_export/csv
mkdir -p db_export/insert_scripts

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

# Export indexes and constraints specifically
echo "Exporting indexes and constraints..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --schema-only \
  --section=post-data \
  --no-owner \
  --no-privileges \
  > indexes_constraints.sql

echo "Indexes and constraints export completed."

# Get a list of all tables in the database
TABLES=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "\dt" | awk '{print $3}')

# Export data from each table to CSV
echo "Exporting table data to CSV files..."
for TABLE in $TABLES
do
    echo "Exporting $TABLE to CSV..."
    # Export with proper escaping
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "\COPY $TABLE TO 'db_export/csv/$TABLE.csv' WITH CSV HEADER FORCE QUOTE *"
    
    # Also create an SQL insert script for this table
    echo "Generating INSERT statements for $TABLE..."
    PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
      --table=$TABLE \
      --data-only \
      --column-inserts \
      --no-owner \
      --no-privileges \
      > "db_export/insert_scripts/$TABLE.sql"
done

echo "CSV and INSERT script exports completed."

# Create a complete dump with both schema and data
echo "Creating complete database dump..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --no-owner \
  --no-privileges \
  > "complete_dump_$TIMESTAMP.sql"

echo "Complete dump created as complete_dump_$TIMESTAMP.sql"

# Create a data-only dump
echo "Creating data-only dump..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
  --data-only \
  --no-owner \
  --no-privileges \
  > "data_only_dump_$TIMESTAMP.sql"

echo "Data-only dump created as data_only_dump_$TIMESTAMP.sql"

# Create a compressed archive of all exports
echo "Creating compressed archive of all exports..."
tar -czf "zenith_db_export_$TIMESTAMP.tar.gz" schema.sql indexes_constraints.sql db_export complete_dump_$TIMESTAMP.sql data_only_dump_$TIMESTAMP.sql

echo "Database export completed successfully!"
echo "Files created:"
echo "- schema.sql (database schema only)"
echo "- indexes_constraints.sql (indexes and constraints)"
echo "- db_export/csv/ (CSV files for each table)"
echo "- db_export/insert_scripts/ (SQL INSERT statements for each table)"
echo "- complete_dump_$TIMESTAMP.sql (complete dump with schema and data)"
echo "- data_only_dump_$TIMESTAMP.sql (data only, no schema)"
echo "- zenith_db_export_$TIMESTAMP.tar.gz (compressed archive of all exports)"

# Generate a table list with row counts for documentation
echo "Generating table statistics..."
echo "Table Statistics - Generated on $(date)" > table_stats.txt
echo "=======================================" >> table_stats.txt
echo "" >> table_stats.txt

for TABLE in $TABLES
do
    COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM $TABLE")
    echo "$TABLE: $COUNT rows" >> table_stats.txt
done

echo "Table statistics saved to table_stats.txt"
