# Zenith Database Export Documentation

This document provides an overview of the database export scripts and exported files, along with instructions for importing the data back into a PostgreSQL database.

## Export Files

The export process creates several files:

1. **schema.sql**: Contains the complete database schema (tables, views, functions, etc.) without data
2. **indexes_constraints.sql**: Contains indexes, constraints, and foreign keys
3. **db_export/csv/**: Directory containing CSV files for each table
4. **db_export/insert_scripts/**: Directory containing SQL INSERT statements for each table
5. **complete_dump_[timestamp].sql**: Complete database dump with schema and data
6. **data_only_dump_[timestamp].sql**: Data-only dump (no schema)
7. **table_stats.txt**: Table statistics with row counts
8. **zenith_db_export_[timestamp].tar.gz**: Compressed archive containing all exports

## Export Scripts

Two export scripts are provided:

1. **export-db.sh**: Basic export script that generates the schema and CSV files
2. **export-db-advanced.sh**: Advanced export script that also generates INSERT statements and additional documentation

## How to Import the Data

### Option 1: Restore complete dump

```bash
# Create a new database (if needed)
createdb -h localhost -U your_username your_database_name

# Import the complete dump
psql -h localhost -U your_username -d your_database_name -f complete_dump_[timestamp].sql
```

### Option 2: Restore schema and data separately

```bash
# Create a new database (if needed)
createdb -h localhost -U your_username your_database_name

# Import the schema first
psql -h localhost -U your_username -d your_database_name -f schema.sql

# Import the data (choose one method)
# Method A: Using the data-only dump
psql -h localhost -U your_username -d your_database_name -f data_only_dump_[timestamp].sql

# Method B: Using individual INSERT scripts
# Run each INSERT script for each table
for file in db_export/insert_scripts/*.sql; do
    psql -h localhost -U your_username -d your_database_name -f "$file"
done
```

### Option 3: Import from CSV files

```bash
# Create a new database (if needed)
createdb -h localhost -U your_username your_database_name

# Import the schema first
psql -h localhost -U your_username -d your_database_name -f schema.sql

# Import data from CSV files
# Run this for each table (replace TABLE_NAME with actual table name)
psql -h localhost -U your_username -d your_database_name -c "\COPY TABLE_NAME FROM 'db_export/csv/TABLE_NAME.csv' WITH CSV HEADER"
```

## Data Dictionary

The export includes these main tables:

- **users**: User accounts and authentication information
- **clubs**: Club information
- **club_members**: Membership data linking users to clubs
- **events**: Event information
- **posts**: Forum posts
- **comments**: Comments on posts
- **projects**: Project information
- **assignments**: Assignment data
- ... (other tables specific to your application)

## Important Notes

1. The CSV files may contain special characters or array data that requires special handling during import
2. The INSERT scripts handle proper escaping of special characters
3. When importing to a new database, you may need to disable foreign key constraints temporarily
4. The export does not include user passwords in plaintext (they remain hashed)

## Troubleshooting

If you encounter issues during import:

1. Check that the target database has the same PostgreSQL version as the source
2. You may need to create extensions first (e.g., `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`)
3. For foreign key issues, you may need to import tables in a specific order or temporarily disable constraints

For additional assistance, refer to the PostgreSQL documentation at https://www.postgresql.org/docs/
