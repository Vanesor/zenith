#!/bin/bash
# Import database schema to Supabase
# Make sure to update your .env.local file with Supabase credentials first

# Load environment variables
source .env.local

echo "Importing schema to Supabase database..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"
echo "User: $DB_USER"

# Import schema
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/schema.sql

echo "Schema import completed!"

# Optional: Import sample data
read -p "Do you want to import sample data? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/sample_data.sql
    echo "Sample data imported!"
fi
