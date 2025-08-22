#!/bin/bash

# PostgreSQL to MySQL Schema Conversion Script
# This script converts a PostgreSQL schema dump to MySQL compatible format

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if input file is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Please provide the PostgreSQL schema dump file${NC}"
  echo -e "Usage: $0 pg_schema.sql [output_file]"
  exit 1
fi

INPUT_FILE="$1"
OUTPUT_FILE="${2:-mysql_schema.sql}"

if [ ! -f "$INPUT_FILE" ]; then
  echo -e "${RED}Error: Input file $INPUT_FILE not found${NC}"
  exit 1
fi

echo -e "${YELLOW}Converting PostgreSQL schema to MySQL format...${NC}"
echo -e "${GREEN}Input: $INPUT_FILE${NC}"
echo -e "${GREEN}Output: $OUTPUT_FILE${NC}"

# Add header to the output file
cat > "$OUTPUT_FILE" << 'EOL'
-- Converted from PostgreSQL to MySQL schema
-- Conversion date: $(date)

-- MySQL database creation
DROP DATABASE IF EXISTS zenith;
CREATE DATABASE zenith CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE zenith;

-- Disable foreign key checks temporarily for table creation
SET FOREIGN_KEY_CHECKS=0;

EOL

# Process the schema file for MySQL compatibility
cat "$INPUT_FILE" | \
# Remove PostgreSQL-specific extensions and settings
sed 's/CREATE EXTENSION IF NOT EXISTS.*;//g' | \
sed 's/COMMENT ON EXTENSION.*;//g' | \
sed 's/SET .*;//g' | \
sed 's/SELECT pg_catalog.*;//g' | \
# Replace UUID functions
sed "s/DEFAULT public.uuid_generate_v4()/DEFAULT (UUID())/g" | \
sed "s/DEFAULT gen_random_uuid()/DEFAULT (UUID())/g" | \
sed "s/uuid DEFAULT/varchar(36) DEFAULT/g" | \
sed "s/uuid NOT NULL/varchar(36) NOT NULL/g" | \
sed "s/uuid,/varchar(36),/g" | \
# Remove schema references
sed "s/WITH SCHEMA public;//g" | \
sed "s/public\.//g" | \
# Convert timestamp types
sed "s/DEFAULT now()/DEFAULT CURRENT_TIMESTAMP/g" | \
sed "s/timestamp with time zone/timestamp/g" | \
sed "s/timestamp without time zone/timestamp/g" | \
sed "s/\btimestamp\b/timestamp NULL/g" | \
# Convert data types
sed "s/character varying/varchar(255)/g" | \
sed "s/varchar(/ varchar(/g" | \
sed "s/varchar without length specifier/varchar(255)/g" | \
sed "s/boolean/tinyint(1)/g" | \
sed "s/text/longtext/g" | \
sed "s/jsonb/json/g" | \
sed "s/\bbytea\b/longblob/g" | \
sed "s/\binteger\b/int/g" | \
sed "s/\bserial\b/int AUTO_INCREMENT/g" | \
sed "s/\bbigserial\b/bigint AUTO_INCREMENT/g" | \
# Remove PostgreSQL functions and triggers
sed '/CREATE FUNCTION/,/END;$$/d' | \
sed '/CREATE TRIGGER/,/LANGUAGE plpgsql/d' | \
# Remove type casts
sed "s/\(.*\)::text\(.*\)/\1\2/g" | \
sed "s/\(.*\)::regconfig\(.*\)/\1\2/g" | \
# Filter out PostgreSQL-specific ownership lines
grep -v "OWNER -" | \
# Remove check constraints
grep -v "CONSTRAINT.*CHECK" | \
# Fix table creation syntax
sed "s/CREATE TABLE public\./CREATE TABLE /g" | \
sed "s/ALTER TABLE public\./ALTER TABLE /g" | \
# Convert index keywords
sed "s/\bINDEX\b/KEY/g" | \
# Remove statements that MySQL doesn't support
grep -v "ALTER TABLE ONLY" | \
grep -v "ALTER TABLE.*OWNER" | \
grep -v "PRIMARY KEY.*USING INDEX" | \
grep -v "SET default_tablespace" | \
grep -v "SET default_table_access_method" | \
# Remove sequence definitions
grep -v "CREATE SEQUENCE" | \
grep -v "SELECT setval" | \
# Remove PostgreSQL-specific indexing methods
sed "s/USING btree//g" | \
sed "s/USING gin//g" | \
# Add each line to the output file
while read line; do
  # Skip empty lines
  if [ -z "$line" ]; then
    continue
  fi
  
  # Add to output file
  echo "$line" >> "$OUTPUT_FILE"
done

# Add footer to re-enable foreign key checks
cat >> "$OUTPUT_FILE" << 'EOL'

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS=1;
EOL

echo -e "${GREEN}Schema conversion completed!${NC}"
echo -e "${YELLOW}Please review the converted schema file before importing to MySQL.${NC}"
echo -e "${YELLOW}You may need to make additional manual adjustments for complex schema elements.${NC}"
