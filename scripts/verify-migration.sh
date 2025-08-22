#!/bin/bash

# PostgreSQL to MySQL Migration Verification Script
# This script verifies that data was properly migrated between PostgreSQL and MySQL

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
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Report file
REPORT_FILE="migration_verification_report_$(date +%Y%m%d_%H%M%S).txt"

echo "PostgreSQL to MySQL Migration Verification Report" > $REPORT_FILE
echo "Generated on $(date)" >> $REPORT_FILE
echo "----------------------------------------" >> $REPORT_FILE

echo -e "${YELLOW}Starting migration verification...${NC}"

# Get list of tables from PostgreSQL
echo -e "${BLUE}Retrieving table list from PostgreSQL...${NC}"
PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';" > pg_tables.txt

echo "Table Count Verification:" >> $REPORT_FILE

# Process each table
TOTAL_TABLES=0
VERIFIED_TABLES=0
FAILED_TABLES=0

while read table; do
  if [ -z "$table" ]; then
    continue
  fi
  
  table=$(echo $table | tr -d ' ')
  TOTAL_TABLES=$((TOTAL_TABLES+1))
  
  echo -e "${GREEN}Verifying table: $table${NC}"
  
  # Count records in PostgreSQL
  PG_COUNT=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT COUNT(*) FROM $table;")
  PG_COUNT=$(echo $PG_COUNT | tr -d ' ')
  
  # Count records in MySQL
  MYSQL_COUNT=$(mysql -u root -p -N -e "USE $MYSQL_DB; SELECT COUNT(*) FROM $table;")
  
  echo -e "PostgreSQL count: $PG_COUNT, MySQL count: $MYSQL_COUNT"
  
  if [ "$PG_COUNT" = "$MYSQL_COUNT" ]; then
    echo -e "${GREEN}✓ Table $table verification passed${NC}"
    echo "✓ $table: PostgreSQL=$PG_COUNT, MySQL=$MYSQL_COUNT - PASSED" >> $REPORT_FILE
    VERIFIED_TABLES=$((VERIFIED_TABLES+1))
  else
    echo -e "${RED}✗ Table $table verification failed${NC}"
    echo "✗ $table: PostgreSQL=$PG_COUNT, MySQL=$MYSQL_COUNT - FAILED" >> $REPORT_FILE
    FAILED_TABLES=$((FAILED_TABLES+1))
    
    # Check for any errors in the MySQL table
    mysql -u root -p -e "USE $MYSQL_DB; CHECK TABLE $table;" >> $REPORT_FILE 2>&1
  fi

  # Sample data verification for text fields (optional for large tables)
  echo -e "${BLUE}Performing sample data verification for $table...${NC}"
  
  # Get primary key column name
  PK_COLUMN=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "
    SELECT a.attname
    FROM   pg_index i
    JOIN   pg_attribute a ON a.attrelid = i.indrelid
                        AND a.attnum = ANY(i.indkey)
    WHERE  i.indrelid = '$table'::regclass
    AND    i.indisprimary;
  ")
  
  PK_COLUMN=$(echo $PK_COLUMN | tr -d ' ')
  
  if [ ! -z "$PK_COLUMN" ]; then
    # Get a sample row from PostgreSQL
    SAMPLE_ID=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT $PK_COLUMN FROM $table LIMIT 1;")
    SAMPLE_ID=$(echo $SAMPLE_ID | tr -d ' ')
    
    if [ ! -z "$SAMPLE_ID" ]; then
      echo "  Sample data verification for ID=$SAMPLE_ID" >> $REPORT_FILE
      
      # Get text columns
      TEXT_COLUMNS=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='$table' 
        AND (data_type='text' OR data_type='character varying')
        LIMIT 3;
      ")
      
      if [ ! -z "$TEXT_COLUMNS" ]; then
        for column in $TEXT_COLUMNS; do
          # Clean column name
          column=$(echo $column | tr -d ' ')
          
          # Get sample data from PostgreSQL
          PG_SAMPLE=$(PGPASSWORD=$PG_PASSWORD psql -U $PG_USER -d $PG_DB -t -c "SELECT $column FROM $table WHERE $PK_COLUMN='$SAMPLE_ID' LIMIT 1;")
          PG_SAMPLE=$(echo $PG_SAMPLE | tr -d ' ')
          
          # Get sample data from MySQL
          MYSQL_SAMPLE=$(mysql -u root -p -N -e "USE $MYSQL_DB; SELECT $column FROM $table WHERE $PK_COLUMN='$SAMPLE_ID' LIMIT 1;")
          
          # Compare MD5 hashes of the values to avoid string comparison issues
          PG_HASH=$(echo -n "$PG_SAMPLE" | md5sum | awk '{print $1}')
          MYSQL_HASH=$(echo -n "$MYSQL_SAMPLE" | md5sum | awk '{print $1}')
          
          if [ "$PG_HASH" = "$MYSQL_HASH" ]; then
            echo "    ✓ Column $column matches" >> $REPORT_FILE
          else
            echo "    ✗ Column $column differs" >> $REPORT_FILE
          fi
        done
      fi
    fi
  fi
done < pg_tables.txt

# Clean up temporary files
rm pg_tables.txt

# Summary
echo -e "\n${YELLOW}Verification Summary:${NC}"
echo -e "${BLUE}Total tables: $TOTAL_TABLES${NC}"
echo -e "${GREEN}Verified tables: $VERIFIED_TABLES${NC}"
echo -e "${RED}Failed tables: $FAILED_TABLES${NC}"

# Add summary to report
echo "" >> $REPORT_FILE
echo "Verification Summary:" >> $REPORT_FILE
echo "Total tables: $TOTAL_TABLES" >> $REPORT_FILE
echo "Verified tables: $VERIFIED_TABLES" >> $REPORT_FILE
echo "Failed tables: $FAILED_TABLES" >> $REPORT_FILE

if [ $FAILED_TABLES -eq 0 ]; then
  echo -e "${GREEN}All tables were successfully verified!${NC}"
  echo "All tables were successfully verified!" >> $REPORT_FILE
else
  echo -e "${RED}Some tables failed verification. See the report file for details.${NC}"
  echo "Some tables failed verification." >> $REPORT_FILE
fi

echo -e "${YELLOW}Verification report saved to: $REPORT_FILE${NC}"
echo -e "${GREEN}Verification process completed!${NC}"
