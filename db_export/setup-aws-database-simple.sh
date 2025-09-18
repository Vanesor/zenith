#!/bin/bash

# AWS PostgreSQL Database Setup Script - SIMPLE VERSION (using complete backup)
# Creates zenithpostgres user and zenith database with complete backup file
# Date: September 18, 2025
# 
# USAGE:
# 1. Upload this script and complete_backup_2025-09-18_14-08-40.sql to your AWS instance
# 2. Run: chmod +x setup-aws-database-simple.sh
# 3. Run: sudo ./setup-aws-database-simple.sh

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database configuration
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"

# Local AWS connection (since we're running ON the AWS instance)
AWS_HOST="localhost"
AWS_PORT="5432"
AWS_ADMIN_USER="postgres"
AWS_ADMIN_PASSWORD=""  # Will be prompted if needed

# Backup file (complete schema + data in one file)
BACKUP_FILE="complete_backup_2025-09-18_14-08-40.sql"

echo -e "${BLUE}=== AWS PostgreSQL Database Setup - Simple Version ===${NC}"
echo "This script will:"
echo "1. Create the zenithpostgres user"
echo "2. Create the zenith database"
echo "3. Import the complete backup (schema + data) from one file"
echo ""

# Check if backup file exists
echo -e "${YELLOW}Checking backup file...${NC}"
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file $BACKUP_FILE not found!${NC}"
    echo "Please upload the complete backup file to this directory."
    echo "Expected file: $BACKUP_FILE"
    exit 1
fi

echo -e "${GREEN}✓ Backup file found: $BACKUP_FILE ($(ls -lh $BACKUP_FILE | awk '{print $5}'))${NC}"
echo ""

# Check if PostgreSQL is running
echo -e "${YELLOW}Checking PostgreSQL service...${NC}"
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓ PostgreSQL service is running${NC}"
else
    echo -e "${YELLOW}Starting PostgreSQL service...${NC}"
    sudo systemctl start postgresql
    if systemctl is-active --quiet postgresql; then
        echo -e "${GREEN}✓ PostgreSQL service started${NC}"
    else
        echo -e "${RED}Error: Failed to start PostgreSQL service${NC}"
        exit 1
    fi
fi

# Warning message
echo -e "${RED}WARNING: This will completely reset your PostgreSQL database!${NC}"
echo "This will:"
echo "- Drop the existing '$DB_NAME' database if it exists"
echo "- Drop the existing '$DB_USER' user if it exists" 
echo "- Create fresh database and user with imported data"
echo ""
read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Get postgres admin password if not set
if [ -z "$AWS_ADMIN_PASSWORD" ]; then
    echo -e "${YELLOW}PostgreSQL admin password needed...${NC}"
    read -s -p "Enter postgres user password (leave empty if no password): " AWS_ADMIN_PASSWORD
    echo
fi

# Test PostgreSQL connection
echo -e "${YELLOW}Testing PostgreSQL connection...${NC}"
if [ -z "$AWS_ADMIN_PASSWORD" ]; then
    # Try without password (peer authentication)
    sudo -u postgres psql -c "SELECT version();" > /dev/null 2>&1
    CONNECTION_METHOD="peer"
else
    # Try with password
    export PGPASSWORD="$AWS_ADMIN_PASSWORD"
    psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$AWS_ADMIN_USER" -d postgres -c "SELECT version();" > /dev/null 2>&1
    CONNECTION_METHOD="password"
fi

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Cannot connect to PostgreSQL!${NC}"
    echo "Please check:"
    echo "- PostgreSQL is running: sudo systemctl status postgresql"
    echo "- Correct admin password"
    exit 1
fi
echo -e "${GREEN}✓ PostgreSQL connection successful (using $CONNECTION_METHOD authentication)${NC}"

# Function to run psql commands based on connection method
run_psql_admin() {
    if [ "$CONNECTION_METHOD" = "peer" ]; then
        sudo -u postgres psql "$@"
    else
        export PGPASSWORD="$AWS_ADMIN_PASSWORD"
        psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$AWS_ADMIN_USER" -d postgres "$@"
    fi
}

# Drop existing database and user if they exist
echo -e "${YELLOW}Cleaning up existing database and user...${NC}"

# Terminate active connections to the database
run_psql_admin -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity 
    WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
" 2>/dev/null || echo "No existing connections to terminate"

# Drop database if exists
run_psql_admin -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || echo "Database $DB_NAME didn't exist"

# Drop user if exists
run_psql_admin -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || echo "User $DB_USER didn't exist"

echo -e "${GREEN}✓ Cleanup completed${NC}"

# Create new user
echo -e "${YELLOW}Creating user $DB_USER...${NC}"
run_psql_admin -c "
    CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
    ALTER USER $DB_USER CREATEDB;
    ALTER USER $DB_USER WITH SUPERUSER;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ User $DB_USER created successfully${NC}"
else
    echo -e "${RED}Error: Failed to create user $DB_USER${NC}"
    exit 1
fi

# Create database
echo -e "${YELLOW}Creating database $DB_NAME...${NC}"
run_psql_admin -c "
    CREATE DATABASE $DB_NAME OWNER $DB_USER;
    GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database $DB_NAME created successfully${NC}"
else
    echo -e "${RED}Error: Failed to create database $DB_NAME${NC}"
    exit 1
fi

# Import complete backup (schema + data)
echo -e "${YELLOW}Importing complete backup (schema + data)...${NC}"
export PGPASSWORD="$DB_PASSWORD"
psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Complete backup imported successfully${NC}"
else
    echo -e "${RED}Error: Failed to import backup${NC}"
    exit 1
fi

# Verify the setup
echo -e "${YELLOW}Verifying database setup...${NC}"

# Check tables
TABLE_COUNT=$(psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
echo "Tables created: $TABLE_COUNT"

# Check users
USER_COUNT=$(psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" | xargs)
echo "Users imported: $USER_COUNT"

# Check clubs
CLUB_COUNT=$(psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM clubs;" | xargs)
echo "Clubs imported: $CLUB_COUNT"

# Check club members
MEMBER_COUNT=$(psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM club_members WHERE is_current_term = true;" | xargs)
echo "Current club members: $MEMBER_COUNT"

# Check committees
COMMITTEE_COUNT=$(psql -h "$AWS_HOST" -p "$AWS_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM committees;" | xargs)
echo "Committees imported: $COMMITTEE_COUNT"

echo ""
echo -e "${GREEN}=== Database Setup Complete! ===${NC}"
echo ""
echo "Connection Details for your application:"
echo "  Host: localhost (or your AWS instance IP for external connections)"
echo "  Port: $AWS_PORT"
echo "  Database: $DB_NAME"
echo "  Username: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo ""
echo "For your application, update the DATABASE_URL environment variable:"
echo ""
echo "DATABASE_URL=\"postgres://$DB_USER:$DB_PASSWORD@localhost:$AWS_PORT/$DB_NAME\""
echo ""
echo "For external connections:"
echo "DATABASE_URL=\"postgres://$DB_USER:$DB_PASSWORD@YOUR_AWS_PUBLIC_IP:$AWS_PORT/$DB_NAME\""
echo ""
echo -e "${BLUE}Data Summary:${NC}"
echo "- $USER_COUNT users with synchronized club_id"
echo "- $CLUB_COUNT clubs with current memberships"  
echo "- $MEMBER_COUNT active club members"
echo "- $COMMITTEE_COUNT committees"
echo "- Academic year: 2025-2026"
echo "- Leadership hierarchy: Updated with mentor/outreach/technical roles"
echo ""
echo -e "${GREEN}✅ Your AWS PostgreSQL database is ready!${NC}"