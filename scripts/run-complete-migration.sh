#!/bin/bash

# Complete PostgreSQL to MySQL Migration Orchestration Script
# This script orchestrates the full migration process from PostgreSQL to MySQL

# Set variables
PG_USER="zenithpostgres"
PG_DB="zenith"
PG_PASSWORD="AtharvaAyush"
MYSQL_USER="zenithmysql"
MYSQL_DB="zenith"
MYSQL_PASSWORD="AtharvaAyush"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Output directory
MIGRATION_DIR="migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p $MIGRATION_DIR
SCRIPT_DIR="$(dirname "$(readlink -f "$0")")"

echo -e "${YELLOW}=======================================================${NC}"
echo -e "${YELLOW}   Starting Complete PostgreSQL to MySQL Migration      ${NC}"
echo -e "${YELLOW}=======================================================${NC}"

# Export PostgreSQL password to avoid prompts
export PGPASSWORD=$PG_PASSWORD

# Step 1: Extract PostgreSQL schema
echo -e "\n${BLUE}Step 1: Extracting PostgreSQL schema...${NC}"
pg_dump -U $PG_USER -d $PG_DB --schema-only > $MIGRATION_DIR/postgres_schema.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to extract PostgreSQL schema. Please check your credentials and try again.${NC}"
  exit 1
fi

echo -e "${GREEN}PostgreSQL schema extracted successfully!${NC}"

# Step 2: Convert schema to MySQL format
echo -e "\n${BLUE}Step 2: Converting schema to MySQL format...${NC}"
$SCRIPT_DIR/convert-schema-to-mysql.sh $MIGRATION_DIR/postgres_schema.sql $MIGRATION_DIR/mysql_schema.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to convert schema to MySQL format.${NC}"
  exit 1
fi

echo -e "${GREEN}Schema conversion completed!${NC}"

# Step 3: Create MySQL database and import schema
echo -e "\n${BLUE}Step 3: Creating MySQL database and importing schema...${NC}"
echo -e "${YELLOW}You will be prompted for MySQL root password...${NC}"

mysql -u root -p -e "DROP DATABASE IF EXISTS $MYSQL_DB;"
mysql -u root -p -e "CREATE DATABASE $MYSQL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON $MYSQL_DB.* TO '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
mysql -u root -p -e "FLUSH PRIVILEGES;"
mysql -u root -p $MYSQL_DB < $MIGRATION_DIR/mysql_schema.sql

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to create MySQL database or import schema.${NC}"
  exit 1
fi

echo -e "${GREEN}MySQL database created and schema imported successfully!${NC}"

# Step 4: Extract table list for data migration
echo -e "\n${BLUE}Step 4: Generating table list for data migration...${NC}"
psql -U $PG_USER -d $PG_DB -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" | grep -v "^\s*$" > $MIGRATION_DIR/tables.txt

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to extract table list from PostgreSQL.${NC}"
  exit 1
fi

TABLES_COUNT=$(cat $MIGRATION_DIR/tables.txt | wc -l)
echo -e "${GREEN}Found $TABLES_COUNT tables to migrate.${NC}"

# Step 5: Export data from PostgreSQL and prepare for import
echo -e "\n${BLUE}Step 5: Exporting data from PostgreSQL to CSV files...${NC}"

mkdir -p $MIGRATION_DIR/data

while read table; do
  if [ -z "$table" ]; then
    continue
  fi
  
  table=$(echo $table | tr -d ' ')
  echo -e "${GREEN}Exporting data for table: $table${NC}"
  
  # Export data from PostgreSQL as CSV
  psql -U $PG_USER -d $PG_DB -c "\COPY $table TO '$MIGRATION_DIR/data/$table.csv' WITH CSV HEADER"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Warning: Failed to export data from table: $table${NC}"
    continue
  fi
  
  echo -e "${GREEN}✓ Data exported for table: $table${NC}"
done < $MIGRATION_DIR/tables.txt

echo -e "${GREEN}PostgreSQL data exported successfully!${NC}"

# Step 6: Import data into MySQL
echo -e "\n${BLUE}Step 6: Importing data into MySQL...${NC}"
$SCRIPT_DIR/import-mysql-data.sh $MIGRATION_DIR/data

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Data import process encountered issues.${NC}"
else
  echo -e "${GREEN}MySQL data import completed!${NC}"
fi

# Step 7: Verify migration
echo -e "\n${BLUE}Step 7: Verifying migration...${NC}"
$SCRIPT_DIR/verify-migration.sh

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Migration verification encountered issues.${NC}"
else
  echo -e "${GREEN}Migration verification completed!${NC}"
fi

echo -e "\n${YELLOW}=======================================================${NC}"
echo -e "${YELLOW}   PostgreSQL to MySQL Migration Process Complete      ${NC}"
echo -e "${YELLOW}=======================================================${NC}"
echo -e "\n${GREEN}Migration artifacts stored in: $MIGRATION_DIR${NC}"
echo -e "${YELLOW}Please review the verification report and check your MySQL database.${NC}"
