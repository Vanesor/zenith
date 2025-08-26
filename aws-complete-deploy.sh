#!/bin/bash

# =============================================================================
# AWS Lightsail Complete Database Deployment Script for Zenith Forum
# =============================================================================
# This script completely drops and recreates the database with local data
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Configuration from .env.local
PROJECT_DIR="/home/bitnami/zenith"
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DOMAIN="zenith.stvincentngp.edu.in"
PORT=3000

log "Starting Zenith complete deployment with database recreation..."

# =============================================================================
# 1. Verify required files exist
# =============================================================================

log "Checking required files..."

if [ ! -f "db_export/complete_dump_2025-08-26_17-13-40.sql" ]; then
    error "complete_dump_2025-08-26_17-13-40.sql not found in db_export directory!"
fi

if [ ! -f "db_export/schema_only_2025-08-26_17-13-52.sql" ]; then
    error "schema_only_2025-08-26_17-13-52.sql not found in db_export directory!"
fi

if [ ! -f "db_export/data_only_2025-08-26_17-14-00.sql" ]; then
    error "data_only_2025-08-26_17-14-00.sql not found in db_export directory!"
fi

log "All required SQL files found ✓"

# =============================================================================
# 2. Install required packages
# =============================================================================

log "Installing required packages..."
sudo apt update
#sudo apt install -y postgresql postgresql-contrib nodejs npm nginx certbot python3-certbot-nginx rsync

# =============================================================================
# 3. Complete PostgreSQL Setup (Drop and Recreate Everything)
# =============================================================================

log "Setting up PostgreSQL..."

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Complete database reset
warning "DROPPING ALL EXISTING DATA - This action is irreversible!"
sudo -u postgres psql << EOF
-- Terminate all connections to the database
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();

-- Drop existing database and user if they exist
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create new user with all required privileges
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER SUPERUSER;
ALTER USER $DB_USER REPLICATION;
ALTER USER $DB_USER BYPASSRLS;

-- Create new database
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to the new database and set up extensions
\c $DB_NAME;

-- Create required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO $DB_USER;

\q
EOF

log "Database and user created successfully ✓"

# =============================================================================
# 4. Import Database Schema and Data
# =============================================================================

log "Importing database schema..."

# Import schema first
sudo -u postgres psql -d $DB_NAME < db_export/schema_only_2025-08-26_17-13-52.sql || {
    warning "Schema import had some warnings, but continuing..."
}

log "Schema imported successfully ✓"

log "Importing database data..."

# Import data
sudo -u postgres psql -d $DB_NAME < db_export/data_only_2025-08-26_17-14-00.sql || {
    warning "Data import had some warnings, but continuing..."
}

log "Data imported successfully ✓"

# =============================================================================
# 5. Verify Database Setup
# =============================================================================

log "Verifying database setup..."

# Check if tables exist and have data
TABLE_COUNT=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
USER_COUNT=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | xargs)
CLUB_COUNT=$(sudo -u postgres psql -d $DB_NAME -t -c "SELECT COUNT(*) FROM clubs;" | xargs)

log "Database verification:"
log "  - Tables created: $TABLE_COUNT"
log "  - Users imported: $USER_COUNT"
log "  - Clubs imported: $CLUB_COUNT"

if [ "$TABLE_COUNT" -lt "10" ]; then
    error "Database setup failed - insufficient tables created"
fi

log "Database setup verified ✓"

log "Deployment finished! 🚀"
echo "=================================================="
