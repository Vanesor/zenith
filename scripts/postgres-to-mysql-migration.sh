#!/bin/bash

# PostgreSQL to MySQL Database Migration Script
# This script exports data from PostgreSQL and imports it into MySQL
# maintaining the same table structure and data.

# Set variables
PG_USER="zenithpostgres"
PG_DB="zenith"
PG_PASSWORD="AtharvaAyush"
MYSQL_USER="zenithmysql"
MYSQL_DB="zenith"
MYSQL_PASSWORD="AtharvaAyush"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Output directory
MIGRATION_DIR="migration_$(date +%Y%m%d_%H%M%S)"
mkdir -p $MIGRATION_DIR

echo -e "${YELLOW}Starting PostgreSQL to MySQL migration...${NC}"

# Step 1: Create MySQL database if it doesn't exist
echo -e "${GREEN}Creating MySQL database if it doesn't exist...${NC}"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON $MYSQL_DB.* TO '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Step 2: Extract PostgreSQL schema and transform it to MySQL
echo -e "${GREEN}Extracting PostgreSQL schema...${NC}"
PGPASSWORD=$PG_PASSWORD pg_dump -U $PG_USER -d $PG_DB --schema-only > $MIGRATION_DIR/schema_pg.sql

# Transform PostgreSQL schema to MySQL compatible syntax
echo -e "${GREEN}Transforming schema for MySQL compatibility...${NC}"
cat $MIGRATION_DIR/schema_pg.sql | \
sed 's/CREATE EXTENSION IF NOT EXISTS.*;//g' | \
sed 's/COMMENT ON EXTENSION.*;//g' | \
sed 's/SET .*;//g' | \
sed 's/SELECT pg_catalog.*;//g' | \
sed "s/DEFAULT public.uuid_generate_v4()/DEFAULT (UUID())/g" | \
sed "s/DEFAULT gen_random_uuid()/DEFAULT (UUID())/g" | \
sed "s/uuid DEFAULT/varchar(36) DEFAULT/g" | \
sed "s/WITH SCHEMA public;//g" | \
sed "s/DEFAULT now()/DEFAULT CURRENT_TIMESTAMP/g" | \
sed "s/timestamp with time zone/timestamp/g" | \
sed "s/timestamp without time zone/timestamp/g" | \
sed "s/\btimestamp\b/timestamp NULL/g" | \
sed "s/character varying/varchar/g" | \
sed "s/boolean/tinyint(1)/g" | \
sed "s/text/longtext/g" | \
sed "s/jsonb/json/g" | \
sed "s/\bAND\b/ AND /g" | \
sed "s/USING btree//g" | \
sed "s/\bbytea\b/longblob/g" | \
sed "s/\binteger\b/int/g" | \
sed "s/CREATE FUNCTION.*END;$$;//g" | \
sed "s/CREATE TRIGGER.*LANGUAGE plpgsql//g" | \
sed "s/\(.*\)::text\(.*\)/\1\2/g" | \
sed "s/\(.*\)::regconfig\(.*\)/\1\2/g" | \
grep -v "OWNER -" > $MIGRATION_DIR/schema_mysql.sql

# Fix MySQL specific syntax issues
echo -e "${GREEN}Fixing MySQL specific syntax...${NC}"
# Remove all PostgreSQL-specific constraints and statements
grep -v "CONSTRAINT.*CHECK" $MIGRATION_DIR/schema_mysql.sql | \
grep -v "ALTER TABLE ONLY" | \
grep -v "ALTER TABLE.*OWNER" | \
grep -v "PRIMARY KEY.*USING INDEX" | \
grep -v "SET default_tablespace" | \
grep -v "SET default_table_access_method" | \
sed "s/CREATE TABLE public\./CREATE TABLE /g" | \
sed "s/ALTER TABLE public\./ALTER TABLE /g" | \
sed "s/\bINDEX\b/KEY/g" > $MIGRATION_DIR/schema_mysql_fixed.sql

# Step 3: Extract table list for data migration
echo -e "${GREEN}Getting list of tables for data migration...${NC}"
PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" > $MIGRATION_DIR/tables.txt

# Add MySQL CREATE DATABASE statement at the beginning
echo -e "${GREEN}Adding CREATE DATABASE statement...${NC}"
echo "DROP DATABASE IF EXISTS $MYSQL_DB;" > $MIGRATION_DIR/final_schema.sql
echo "CREATE DATABASE $MYSQL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" >> $MIGRATION_DIR/final_schema.sql
echo "USE $MYSQL_DB;" >> $MIGRATION_DIR/final_schema.sql
cat $MIGRATION_DIR/schema_mysql_fixed.sql >> $MIGRATION_DIR/final_schema.sql

# Step 4: Import schema to MySQL
echo -e "${GREEN}Importing schema to MySQL...${NC}"
mysql -u root -p < $MIGRATION_DIR/final_schema.sql

# Step 5: Create data migration script
echo -e "${GREEN}Creating data migration script...${NC}"
cat > $MIGRATION_DIR/migrate_data.sh << 'EOF'
#!/bin/bash

# Read in the variables
PG_USER="zenithpostgres"
PG_DB="zenith"
PG_PASSWORD="AtharvaAyush"
MYSQL_USER="zenithmysql"
MYSQL_DB="zenith"
MYSQL_PASSWORD="AtharvaAyush"
MIGRATION_DIR="$(dirname "$0")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting data migration...${NC}"

# Process each table
while read table; do
  if [ -z "$table" ]; then
    continue
  fi
  
  echo -e "${GREEN}Migrating data for table: $table${NC}"
  
  # Export data from PostgreSQL as CSV
  PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -c "\COPY $table TO '$MIGRATION_DIR/$table.csv' WITH CSV HEADER"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to export data from table: $table${NC}"
    continue
  fi
  
  # Get column names
  COLUMNS=$(head -1 $MIGRATION_DIR/$table.csv)
  
  # Create SQL script to load data into MySQL
  echo "LOAD DATA LOCAL INFILE '$MIGRATION_DIR/$table.csv' 
  INTO TABLE $table
  FIELDS TERMINATED BY ',' 
  ENCLOSED BY '\"' 
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES
  ($COLUMNS);" > $MIGRATION_DIR/import_$table.sql
  
  # Import data into MySQL
  mysql -u root -p --local-infile=1 $MYSQL_DB < $MIGRATION_DIR/import_$table.sql
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import data into table: $table${NC}"
  else
    echo -e "${GREEN}Successfully migrated data for table: $table${NC}"
  fi
done < $MIGRATION_DIR/tables.txt

echo -e "${YELLOW}Data migration completed!${NC}"
EOF

# Make migration script executable
chmod +x $MIGRATION_DIR/migrate_data.sh

# Step 6: Run data migration script
echo -e "${GREEN}Running data migration script...${NC}"
./$MIGRATION_DIR/migrate_data.sh

echo -e "${YELLOW}Migration process completed! Check the output for any errors.${NC}"

# Step 7: Create verification script
cat > $MIGRATION_DIR/verify_migration.sh << 'EOF'
#!/bin/bash

# Verify the migration between PostgreSQL and MySQL

PG_USER="zenithpostgres"
PG_DB="zenith"
PG_PASSWORD="AtharvaAyush"
MYSQL_USER="zenithmysql"
MYSQL_DB="zenith"
MYSQL_PASSWORD="AtharvaAyush"
MIGRATION_DIR="$(dirname "$0")"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting migration verification...${NC}"

# Process each table
while read table; do
  if [ -z "$table" ]; then
    continue
  fi
  
  echo -e "${GREEN}Verifying table: $table${NC}"
  
  # Count records in PostgreSQL
  PG_COUNT=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT COUNT(*) FROM $table;")
  PG_COUNT=$(echo $PG_COUNT | tr -d ' ')
  
  # Count records in MySQL
  MYSQL_COUNT=$(mysql -u root -p $MYSQL_DB -N -e "SELECT COUNT(*) FROM $table;")
  
  echo -e "PostgreSQL count: $PG_COUNT, MySQL count: $MYSQL_COUNT"
  
  if [ "$PG_COUNT" = "$MYSQL_COUNT" ]; then
    echo -e "${GREEN}✓ Table $table verification passed${NC}"
  else
    echo -e "${RED}✗ Table $table verification failed${NC}"
  fi
done < $MIGRATION_DIR/tables.txt

echo -e "${YELLOW}Verification completed!${NC}"
EOF

chmod +x $MIGRATION_DIR/verify_migration.sh

echo -e "${GREEN}Migration scripts created in $MIGRATION_DIR directory.${NC}"
echo -e "${YELLOW}To complete the migration:${NC}"
echo -e "1. Review the generated scripts"
echo -e "2. Run the data migration script: ./$MIGRATION_DIR/migrate_data.sh"
echo -e "3. Verify the migration: ./$MIGRATION_DIR/verify_migration.sh"
