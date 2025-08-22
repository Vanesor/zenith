#!/bin/bash

# MySQL Data Import Script
# This script imports data into MySQL from CSV files

# Set variables
MYSQL_USER="zenithmysql"
MYSQL_DB="zenith"
MYSQL_PASSWORD="AtharvaAyush"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Source directory with CSV files
DATA_DIR=${1:-"migration_data"}

if [ ! -d "$DATA_DIR" ]; then
  echo -e "${RED}Error: Directory $DATA_DIR does not exist${NC}"
  echo -e "Usage: $0 [data_directory]"
  exit 1
fi

echo -e "${YELLOW}Starting MySQL data import from $DATA_DIR...${NC}"

# First, make sure MySQL is ready and the database exists
echo -e "${GREEN}Checking MySQL connection and database...${NC}"
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS $MYSQL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON $MYSQL_DB.* TO '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# Look for CSV files in the data directory
for CSV_FILE in $DATA_DIR/*.csv; do
  if [ ! -f "$CSV_FILE" ]; then
    echo -e "${YELLOW}No CSV files found in $DATA_DIR${NC}"
    break
  fi

  TABLE_NAME=$(basename "$CSV_FILE" .csv)
  echo -e "${GREEN}Importing data for table: $TABLE_NAME${NC}"
  
  # Get column names from the first line of the CSV file
  COLUMNS=$(head -1 "$CSV_FILE")
  
  # Create SQL script to load data into MySQL
  IMPORT_SQL="$DATA_DIR/import_$TABLE_NAME.sql"
  
  echo "USE $MYSQL_DB;" > $IMPORT_SQL
  echo "SET FOREIGN_KEY_CHECKS=0;" >> $IMPORT_SQL
  echo "TRUNCATE TABLE $TABLE_NAME;" >> $IMPORT_SQL
  echo "LOAD DATA LOCAL INFILE '$CSV_FILE' 
  INTO TABLE $TABLE_NAME
  FIELDS TERMINATED BY ',' 
  ENCLOSED BY '\"' 
  LINES TERMINATED BY '\n'
  IGNORE 1 LINES
  ($COLUMNS);" >> $IMPORT_SQL
  echo "SET FOREIGN_KEY_CHECKS=1;" >> $IMPORT_SQL
  
  # Import data into MySQL
  mysql -u root -p --local-infile=1 < $IMPORT_SQL
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to import data into table: $TABLE_NAME${NC}"
  else
    echo -e "${GREEN}Successfully imported data for table: $TABLE_NAME${NC}"
    # Count the records imported
    COUNT=$(mysql -u root -p -N -e "USE $MYSQL_DB; SELECT COUNT(*) FROM $TABLE_NAME;")
    echo -e "${GREEN}Imported $COUNT records into $TABLE_NAME${NC}"
  fi
done

echo -e "${YELLOW}Data import completed!${NC}"

# Verify data integrity
echo -e "${GREEN}Running data integrity checks...${NC}"
mysql -u root -p -e "USE $MYSQL_DB; SHOW TABLES;" | grep -v "Tables_in" | while read table; do
  echo -e "${GREEN}Checking table: $table${NC}"
  mysql -u root -p -e "USE $MYSQL_DB; CHECK TABLE $table;"
done

echo -e "${GREEN}MySQL data import process complete!${NC}"
