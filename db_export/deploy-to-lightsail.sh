#!/bin/bash

# Deploy Zenith Database to AWS Lightsail
# This script replaces the existing database with the new export

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${GREEN}=== Zenith Database Deployment Script ===${NC}"
echo "This script will replace the existing database with the new export."
echo

# Check if dump file exists
DUMP_FILE=$(ls complete_dump_*.sql 2>/dev/null | head -1)
if [ -z "$DUMP_FILE" ]; then
    echo -e "${RED}Error: No complete dump file found!${NC}"
    echo "Please ensure the complete_dump_*.sql file is in the current directory."
    exit 1
fi

echo -e "${YELLOW}Found dump file: $DUMP_FILE${NC}"
echo

# Prompt for database password
echo -e "${YELLOW}Please enter the PostgreSQL password for user '$DB_USER':${NC}"
read -s DB_PASSWORD
echo

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Cannot connect to database!${NC}"
    echo "Please check your credentials and database server status."
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"

# Create backup of current database
echo -e "${YELLOW}Creating backup of current database...${NC}"
BACKUP_FILE="backup-before-replacement-$(date +%Y-%m-%d_%H-%M-%S).sql"
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME > $BACKUP_FILE
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
else
    echo -e "${RED}Error: Failed to create backup!${NC}"
    exit 1
fi

# Final confirmation
echo
echo -e "${RED}WARNING: This will completely replace the existing database!${NC}"
echo -e "${YELLOW}Current database will be dropped and recreated with new data.${NC}"
echo -e "${YELLOW}Backup saved as: $BACKUP_FILE${NC}"
echo
read -p "Are you sure you want to proceed? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Execute the database replacement
echo
echo -e "${YELLOW}Executing database replacement...${NC}"
echo "This may take several minutes depending on the database size."
echo

# Run the dump file (it includes DROP DATABASE, CREATE DATABASE, and all data)
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f $DUMP_FILE

if [ $? -eq 0 ]; then
    echo
    echo -e "${GREEN}✓ Database replacement completed successfully!${NC}"
    echo
    echo -e "${GREEN}=== Deployment Summary ===${NC}"
    echo "• Old database backed up to: $BACKUP_FILE"
    echo "• New database deployed from: $DUMP_FILE"
    echo "• Database: $DB_NAME"
    echo "• Host: $DB_HOST:$DB_PORT"
    echo "• User: $DB_USER"
    echo
    echo -e "${GREEN}Deployment completed successfully!${NC}"
else
    echo
    echo -e "${RED}Error: Database replacement failed!${NC}"
    echo "You may need to restore from backup: $BACKUP_FILE"
    echo
    echo "To restore backup:"
    echo "PGPASSWORD=your_password psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f $BACKUP_FILE"
    exit 1
fi

# Verify deployment
echo
echo -e "${YELLOW}Verifying deployment...${NC}"
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLE_COUNT" -gt 50 ]; then
    echo -e "${GREEN}✓ Verification successful: $TABLE_COUNT tables found${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Only $TABLE_COUNT tables found. Please verify manually.${NC}"
fi

echo
echo -e "${GREEN}Database deployment to AWS Lightsail completed!${NC}"
