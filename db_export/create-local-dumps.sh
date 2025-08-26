#!/bin/bash

# Generate required dump files from local database
# This script creates the schema and data files needed for AWS deployment

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Local database configuration (from your .env.local)
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${GREEN}=== Generating Database Export Files ===${NC}"
echo "Creating schema and data files from your local database..."
echo

# Test local connection
echo -e "${YELLOW}Testing local database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Cannot connect to local database!${NC}"
    echo "Please ensure your local PostgreSQL is running and credentials are correct."
    exit 1
fi
echo -e "${GREEN}✓ Local database connection successful${NC}"

# Create timestamp for files
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)

# Export schema only (tables, constraints, indexes, functions, etc.)
echo -e "${YELLOW}Exporting schema (tables, constraints, indexes)...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --schema-only \
    --no-owner \
    --no-privileges \
    --verbose \
    > "schema_only_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema exported to: schema_only_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}Error: Failed to export schema!${NC}"
    exit 1
fi

# Export data only
echo -e "${YELLOW}Exporting data...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --data-only \
    --no-owner \
    --no-privileges \
    --verbose \
    --disable-triggers \
    > "data_only_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data exported to: data_only_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}Error: Failed to export data!${NC}"
    exit 1
fi

# Create a complete dump as backup
echo -e "${YELLOW}Creating complete backup dump...${NC}"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --verbose \
    --no-owner \
    --no-privileges \
    > "complete_backup_${TIMESTAMP}.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Complete backup created: complete_backup_${TIMESTAMP}.sql${NC}"
else
    echo -e "${RED}Error: Failed to create complete backup!${NC}"
    exit 1
fi

# Show file sizes
echo
echo -e "${GREEN}=== Export Complete ===${NC}"
echo "Files created:"
ls -lh schema_only_${TIMESTAMP}.sql data_only_${TIMESTAMP}.sql complete_backup_${TIMESTAMP}.sql

echo
echo -e "${GREEN}Ready for AWS deployment!${NC}"
echo "Now run: ./complete-aws-database-reset.sh"
