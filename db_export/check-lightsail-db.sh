#!/bin/bash

# Check AWS Lightsail Database Setup
# This script helps you verify and set up the database properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AWS Lightsail Database Setup Checker ===${NC}"
echo

# Configuration - Update these with your AWS Lightsail details
DB_HOST="ls-xxx.xxxxx.us-east-1.rds.amazonaws.com"  # Replace with your Lightsail DB endpoint
DB_PORT="5432"
DB_USER="postgres"  # Default user for Lightsail PostgreSQL
# DB_USER="zenithpostgres"  # Use this if you created a custom user

echo -e "${YELLOW}Please enter your AWS Lightsail PostgreSQL details:${NC}"
echo
read -p "Database Host/Endpoint: " DB_HOST
read -p "Database Port (default 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}
read -p "Database User (default postgres): " DB_USER
DB_USER=${DB_USER:-postgres}
echo

# Prompt for database password
echo -e "${YELLOW}Please enter the PostgreSQL password:${NC}"
read -s DB_PASSWORD
echo

# Test database connection
echo -e "${YELLOW}Testing database connection...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Cannot connect to database!${NC}"
    echo "Please check:"
    echo "1. Database endpoint URL"
    echo "2. Username and password"
    echo "3. Security group settings (port 5432 should be open)"
    echo "4. Database is running and accessible"
    exit 1
fi
echo -e "${GREEN}✓ Database connection successful${NC}"

# List existing databases
echo
echo -e "${BLUE}=== Existing Databases ===${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\l"

echo
echo -e "${YELLOW}=== Current Database Users ===${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "\du"

# Check if zenith database exists
echo
echo -e "${YELLOW}Checking if 'zenith' database exists...${NC}"
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='zenith';" | tr -d ' \n')

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓ Database 'zenith' exists${NC}"
    
    # Check tables in zenith database
    echo
    echo -e "${BLUE}=== Tables in 'zenith' database ===${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d zenith -c "\dt"
else
    echo -e "${RED}✗ Database 'zenith' does not exist${NC}"
    echo
    echo -e "${YELLOW}Would you like to create the 'zenith' database? (yes/no):${NC}"
    read -p "" CREATE_DB
    
    if [ "$CREATE_DB" = "yes" ]; then
        echo -e "${YELLOW}Creating 'zenith' database...${NC}"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE zenith;"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Database 'zenith' created successfully${NC}"
        else
            echo -e "${RED}Error: Failed to create database 'zenith'${NC}"
            exit 1
        fi
    fi
fi

# Check if zenithpostgres user exists
echo
echo -e "${YELLOW}Checking if 'zenithpostgres' user exists...${NC}"
USER_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_user WHERE usename='zenithpostgres';" | tr -d ' \n')

if [ "$USER_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓ User 'zenithpostgres' exists${NC}"
else
    echo -e "${RED}✗ User 'zenithpostgres' does not exist${NC}"
    echo
    echo -e "${YELLOW}Would you like to create the 'zenithpostgres' user? (yes/no):${NC}"
    read -p "" CREATE_USER
    
    if [ "$CREATE_USER" = "yes" ]; then
        echo -e "${YELLOW}Please enter password for 'zenithpostgres' user:${NC}"
        read -s ZENITH_PASSWORD
        echo
        
        echo -e "${YELLOW}Creating 'zenithpostgres' user...${NC}"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE USER zenithpostgres WITH PASSWORD '$ZENITH_PASSWORD';"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE zenith TO zenithpostgres;"
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "ALTER USER zenithpostgres CREATEDB;"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ User 'zenithpostgres' created successfully${NC}"
            echo -e "${BLUE}Note: Save this password for deployment: $ZENITH_PASSWORD${NC}"
        else
            echo -e "${RED}Error: Failed to create user 'zenithpostgres'${NC}"
            exit 1
        fi
    fi
fi

echo
echo -e "${GREEN}=== Setup Summary ===${NC}"
echo "Database Host: $DB_HOST"
echo "Database Port: $DB_PORT"
echo "Admin User: $DB_USER"
echo "Application User: zenithpostgres (if created)"
echo "Application Database: zenith"
echo
echo -e "${GREEN}Setup check completed!${NC}"
echo
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update deploy-to-lightsail.sh with your correct database details"
echo "2. Run the deployment script to import your data"
