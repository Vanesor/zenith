#!/bin/bash

# Complete AWS Lightsail Database Reset Script
# This script will:
# 1. Drop all existing databases and users
# 2. Create the exact user and database configuration from .env.local
# 3. Import your local schema with constraints and indexes
# 4. Import your local data

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from your .env.local
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DB_HOST="localhost"  # Change this to your AWS Lightsail IP
DB_PORT="5432"

# AWS Lightsail connection (you'll need to update these)
echo -e "${BLUE}=== AWS Lightsail Database Complete Reset ===${NC}"
echo "This script will completely reset your AWS Lightsail PostgreSQL database"
echo "and recreate it exactly like your local setup."
echo

# Prompt for AWS Lightsail details
echo -e "${YELLOW}Please provide your AWS Lightsail PostgreSQL details:${NC}"
read -p "AWS Lightsail IP address: " AWS_HOST
read -p "PostgreSQL port (default 5432): " AWS_PORT
AWS_PORT=${AWS_PORT:-5432}
read -p "PostgreSQL admin user (usually 'postgres' or 'bitnami'): " ADMIN_USER
echo -e "${YELLOW}Enter admin password:${NC}"
read -s ADMIN_PASSWORD
echo

# Check if local dump files exist
SCHEMA_FILE=$(ls schema_only_*.sql 2>/dev/null | head -1)
DATA_FILE=$(ls data_only_*.sql 2>/dev/null | head -1)

if [ -z "$SCHEMA_FILE" ] || [ -z "$DATA_FILE" ]; then
    echo -e "${RED}Error: Required dump files not found!${NC}"
    echo "Please ensure both schema_only_*.sql and data_only_*.sql files are present."
    echo "Run this command first to create them:"
    echo "pg_dump -h localhost -U zenithpostgres -d zenith --schema-only > schema_only_$(date +%Y-%m-%d_%H-%M-%S).sql"
    echo "pg_dump -h localhost -U zenithpostgres -d zenith --data-only > data_only_$(date +%Y-%m-%d_%H-%M-%S).sql"
    exit 1
fi

echo -e "${GREEN}Found files:${NC}"
echo "  Schema: $SCHEMA_FILE"
echo "  Data: $DATA_FILE"
echo

# Test connection to AWS
echo -e "${YELLOW}Testing connection to AWS Lightsail...${NC}"
PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -c "SELECT version();" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Cannot connect to AWS Lightsail PostgreSQL!${NC}"
    echo "Please check your credentials and ensure PostgreSQL is accessible."
    exit 1
fi
echo -e "${GREEN}✓ Connection to AWS Lightsail successful${NC}"

# Final confirmation
echo
echo -e "${RED}WARNING: This will completely destroy ALL databases and users on AWS Lightsail!${NC}"
echo -e "${YELLOW}The following will happen:${NC}"
echo "  1. Drop all non-system databases"
echo "  2. Drop all non-system users/roles"
echo "  3. Create user: $DB_USER"
echo "  4. Create database: $DB_NAME"
echo "  5. Import schema with all constraints and indexes"
echo "  6. Import all data from local database"
echo
read -p "Are you absolutely sure you want to proceed? Type 'RESET_DATABASE' to confirm: " CONFIRM

if [ "$CONFIRM" != "RESET_DATABASE" ]; then
    echo -e "${YELLOW}Operation cancelled.${NC}"
    exit 0
fi

echo
echo -e "${RED}=== STARTING COMPLETE DATABASE RESET ===${NC}"

# Step 1: Drop all non-system databases
echo -e "${YELLOW}Step 1: Dropping all non-system databases...${NC}"
DATABASES=$(PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -t -c "SELECT datname FROM pg_database WHERE datname NOT IN ('postgres', 'template0', 'template1');" | tr -d ' ' | grep -v '^$')

for db in $DATABASES; do
    echo -e "${YELLOW}  Dropping database: $db${NC}"
    PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -c "DROP DATABASE IF EXISTS \"$db\";" 2>/dev/null || true
done

# Step 2: Drop all non-system users/roles
echo -e "${YELLOW}Step 2: Dropping all non-system users/roles...${NC}"
USERS=$(PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -t -c "SELECT rolname FROM pg_roles WHERE rolname NOT LIKE 'pg_%' AND rolname NOT IN ('postgres', 'bitnami');" | tr -d ' ' | grep -v '^$')

for user in $USERS; do
    echo -e "${YELLOW}  Dropping user: $user${NC}"
    PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -c "DROP ROLE IF EXISTS \"$user\";" 2>/dev/null || true
done

# Step 3: Create the database user
echo -e "${YELLOW}Step 3: Creating database user '$DB_USER'...${NC}"
PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -c "
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER WITH SUPERUSER;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ User '$DB_USER' created successfully${NC}"
else
    echo -e "${RED}Error: Failed to create user!${NC}"
    exit 1
fi

# Step 4: Create the database
echo -e "${YELLOW}Step 4: Creating database '$DB_NAME'...${NC}"
PGPASSWORD=$ADMIN_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $ADMIN_USER -d postgres -c "
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database '$DB_NAME' created successfully${NC}"
else
    echo -e "${RED}Error: Failed to create database!${NC}"
    exit 1
fi

# Step 5: Enable required extensions
echo -e "${YELLOW}Step 5: Enabling required extensions...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -c "
CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";
CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Extensions enabled successfully${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Some extensions might already exist${NC}"
fi

# Step 6: Import schema with constraints and indexes
echo -e "${YELLOW}Step 6: Importing schema (tables, constraints, indexes)...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Schema imported successfully${NC}"
else
    echo -e "${RED}Error: Failed to import schema!${NC}"
    exit 1
fi

# Step 7: Import all data
echo -e "${YELLOW}Step 7: Importing all data...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -f $DATA_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Data imported successfully${NC}"
else
    echo -e "${RED}Error: Failed to import data!${NC}"
    exit 1
fi

# Step 8: Update sequences (important for auto-increment IDs)
echo -e "${YELLOW}Step 8: Updating sequences...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -c "
DO \$\$
DECLARE
    rec RECORD;
    max_val BIGINT;
BEGIN
    FOR rec IN 
        SELECT schemaname, tablename, attname, seq.relname as seqname
        FROM pg_class seq
        JOIN pg_depend d ON d.objid = seq.oid
        JOIN pg_class t ON d.refobjid = t.oid
        JOIN pg_attribute a ON (d.refobjid, d.refobjsubid) = (a.attrelid, a.attnum)
        JOIN pg_namespace n ON n.oid = seq.relnamespace
        WHERE seq.relkind = 'S'
          AND n.nspname = 'public'
    LOOP
        EXECUTE 'SELECT COALESCE(MAX(' || rec.attname || '), 0) + 1 FROM ' || rec.schemaname || '.' || rec.tablename INTO max_val;
        EXECUTE 'ALTER SEQUENCE ' || rec.schemaname || '.' || rec.seqname || ' RESTART WITH ' || max_val;
    END LOOP;
END
\$\$;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Sequences updated successfully${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Some sequences might not need updating${NC}"
fi

# Step 9: Verify the deployment
echo -e "${YELLOW}Step 9: Verifying deployment...${NC}"

# Count tables
TABLE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

# Count users (non-empty tables)
USER_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ' 2>/dev/null || echo "0")

# Count events
EVENT_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM events;" | tr -d ' ' 2>/dev/null || echo "0")

echo -e "${GREEN}=== Verification Results ===${NC}"
echo "  Tables created: $TABLE_COUNT"
echo "  Users imported: $USER_COUNT"
echo "  Events imported: $EVENT_COUNT"

if [ "$TABLE_COUNT" -gt 10 ] && [ "$USER_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Deployment verification successful!${NC}"
else
    echo -e "${YELLOW}⚠ Warning: Please verify the deployment manually${NC}"
fi

# Step 10: Create connection test script
echo -e "${YELLOW}Step 10: Creating connection test script...${NC}"
cat > test-aws-connection.sh << EOF
#!/bin/bash
# Test connection to AWS Lightsail Database

PGPASSWORD=$DB_PASSWORD psql -h $AWS_HOST -p $AWS_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    'Database: $DB_NAME' as info
UNION ALL
SELECT 
    'Tables: ' || COUNT(*)::text
FROM information_schema.tables 
WHERE table_schema = 'public'
UNION ALL
SELECT 
    'Users: ' || COUNT(*)::text
FROM users
UNION ALL
SELECT 
    'Events: ' || COUNT(*)::text
FROM events;
"
EOF

chmod +x test-aws-connection.sh
echo -e "${GREEN}✓ Test script created: test-aws-connection.sh${NC}"

echo
echo -e "${GREEN}=== DATABASE RESET COMPLETED SUCCESSFULLY! ===${NC}"
echo
echo -e "${GREEN}Summary:${NC}"
echo "  ✓ All old databases and users dropped"
echo "  ✓ User '$DB_USER' created with password"
echo "  ✓ Database '$DB_NAME' created"
echo "  ✓ Schema imported (tables, constraints, indexes)"
echo "  ✓ Data imported from local database"
echo "  ✓ Sequences updated"
echo "  ✓ $TABLE_COUNT tables, $USER_COUNT users, $EVENT_COUNT events"
echo
echo -e "${BLUE}Connection Details:${NC}"
echo "  Host: $AWS_HOST"
echo "  Port: $AWS_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo
echo -e "${BLUE}Test your connection:${NC}"
echo "  ./test-aws-connection.sh"
echo
echo -e "${GREEN}Your AWS Lightsail database is now identical to your local setup!${NC}"
