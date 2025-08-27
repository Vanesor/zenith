#!/bin/bash

# =============================================================================
# AWS Lightsail Database Setup and Deployment Script
# This script will completely reset and recreate the database with your local data
# =============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Database configuration from your .env.local
DB_HOST="your-lightsail-instance-ip"  # Replace with your AWS Lightsail IP
DB_PORT=5432
DB_NAME=zenith
DB_USER=zenithpostgres
DB_PASSWORD="AtharvaAyush"

# Prompt for AWS Lightsail IP if not set
if [ "$DB_HOST" = "your-lightsail-instance-ip" ]; then
    echo -e "${YELLOW}Please enter your AWS Lightsail instance IP address:${NC}"
    read -p "IP Address: " DB_HOST
    if [ -z "$DB_HOST" ]; then
        error "AWS Lightsail IP address is required!"
    fi
fi

log "Starting AWS Lightsail Database Reset and Migration..."
log "Target: PostgreSQL at $DB_HOST:$DB_PORT"
log "Database: $DB_NAME"
log "User: $DB_USER"

# =============================================================================
# Step 1: Test connection to AWS Lightsail
# =============================================================================

log "Testing connection to AWS Lightsail PostgreSQL..."

# Test if we can connect to PostgreSQL
if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -p $DB_PORT -c "SELECT 1;" > /dev/null 2>&1; then
    error "Cannot connect to PostgreSQL on AWS Lightsail. Please check your connection details."
fi

log "✅ Successfully connected to AWS Lightsail PostgreSQL"

# =============================================================================
# Step 2: Drop and recreate database and user
# =============================================================================

log "Dropping existing database and user (if they exist)..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -p $DB_PORT << EOF || warning "Some cleanup operations failed, continuing..."
-- Terminate all connections to the database
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();

-- Drop database and user if they exist
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
EOF

log "Creating new database and user..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U postgres -p $DB_PORT << EOF
-- Create new user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER SUPERUSER;
EOF

log "✅ Database and user created successfully"

# =============================================================================
# Step 3: Create extensions
# =============================================================================

log "Creating required PostgreSQL extensions..."

PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EOF

log "✅ Extensions created successfully"

# =============================================================================
# Step 4: Import schema
# =============================================================================

log "Importing database schema..."

if [ -f "db_export/schema_only_2025-08-26_17-13-52.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT < db_export/schema_only_2025-08-26_17-13-52.sql
    log "✅ Schema imported successfully"
else
    error "Schema file not found: db_export/schema_only_2025-08-26_17-13-52.sql"
fi

# =============================================================================
# Step 5: Import data (excluding sensitive OAuth data)
# =============================================================================

log "Importing database data..."

if [ -f "db_export/committee_data_export.sql" ]; then
    # Remove any OAuth tokens from the committee data before importing
    sed 's/gho_[a-zA-Z0-9_]*/OAUTH_TOKEN_PLACEHOLDER/g' db_export/committee_data_export.sql > /tmp/sanitized_committee_data.sql
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT < /tmp/sanitized_committee_data.sql
    rm /tmp/sanitized_committee_data.sql
    log "✅ Committee data imported successfully (OAuth tokens sanitized)"
else
    warning "Committee data file not found, skipping..."
fi

# Import other essential data if available
if [ -f "db_export/clubs_data.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT < db_export/clubs_data.sql
    log "✅ Clubs data imported successfully"
fi

if [ -f "db_export/events_data.sql" ]; then
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT < db_export/events_data.sql
    log "✅ Events data imported successfully"
fi

# =============================================================================
# Step 6: Verify the setup
# =============================================================================

log "Verifying database setup..."

# Check if main tables exist
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -p $DB_PORT << EOF
\dt
SELECT 'Users: ' || COUNT(*) FROM users;
SELECT 'Committees: ' || COUNT(*) FROM committees;
SELECT 'Committee Members: ' || COUNT(*) FROM committee_members;
SELECT 'Clubs: ' || COUNT(*) FROM clubs;
EOF

log "✅ Database verification completed"

# =============================================================================
# Step 7: Create .env.production for deployment
# =============================================================================

log "Creating production environment configuration..."

cat > .env.production << EOF
# Production Environment Configuration for AWS Lightsail
# Generated on $(date)

# PostgreSQL Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
DIRECT_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Database connection details
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Secrets (keep from your local .env)
JWT_SECRET="8899cf1f2dfa3946e5d4356bb744fac05daf61e56c83342a7b46aed664238eed0aeb81a75a19a9551b"
NEXTAUTH_SECRET="9b6caef029c807e86e2a3ecae1a724b2a62ce70e25054521fea9e63b80b3dc0c89f1211721b1f238cf"
NEXTAUTH_URL="http://$DB_HOST:3000"  # Update this with your domain
JWT_REFRESH_SECRET="0e25054521fea9e63b80b3dc0c89f1211721b1f238cf8303cda417a373582f3d366a5a7dec1e5201a3"

# OAuth Configuration (update with your production keys)
GOOGLE_CLIENT_ID="824195153103-9ggpn8tno8vsstjhgo9o2tr1c3jn9t0v.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GITHUB_CLIENT_ID="Ov23liDmhUZmvO1fOoeX"
GITHUB_CLIENT_SECRET="9c89a719c279170e01175c2cb0e1bb0f25a4f976"

# Email Configuration
RESEND_API_KEY="re_KDcLCzRw_Jh1QVcp68q1oc6XSiovEMCDW"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="zenith.forum@stvincentngp.edu.in"
EMAIL_PASSWORD="vhwy wmdd xoue tgfg"

# Production App Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL="http://$DB_HOST:3000"  # Update with your domain

# Other configurations from your local .env
OAUTH_PASSWORD_SALT="zenith_oauth_salt_2025_secure_key_for_deterministic_password_generation"
TOTP_ISSUER="Zenith Platform"
TOTP_ENCRYPTION_KEY="6e2a3ecae1a724b2a62ce70el50o4j21"
TOTP_RECOVERY_CODES_COUNT=10

# Code execution service
CODE_EXECUTION_SERVICE_URL=https://execution-compiler.onrender.com
CODE_EXECUTION_SERVICE_API_KEY="e78899cf1f2dfa3946e5d4356bb744fac05daf61e56c83342a7b46aed664238eed0aeb81a75a19a9551b8c0c8217a8453d6eab52603040ba0071627c1e59b6caef029c807e86e2a3ecae1a724b2a62ce70e25054521fea9e63b80b3dc0c89f1211721b1f238cf8303cda417a373582f3d366a5a7dec1e5201a347eed486a243ede3982db31f2d83da495c0fc8fe22f6d4fb5b531dda0da49f2a65e0ee10720"

# reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcKlK8rAAAAAAKmNb8F9z5zEhzuiZgLDD11RVec"
RECAPTCHA_SECRET_KEY="6LcKlK8rAAAAAN8dZdC7MBmuvP_kEJJcgQhKiWu5"

# Gemini AI Configuration
GEMINI_API_KEY="AIzaSyDcKfbe_kN-Ez-rCp6jHJUk964l89_G1sY"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyDcKfbe_kN-Ez-rCp6jHJUk964l89_G1sY"
EOF

log "✅ Production environment file created: .env.production"

# =============================================================================
# Final Summary
# =============================================================================

log "🎉 AWS Lightsail Database Setup Complete!"
info "Database URL: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
info "Next steps:"
info "1. Copy .env.production to your AWS Lightsail instance"
info "2. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL with your actual domain"
info "3. Deploy your Next.js application"
info "4. Test the application functionality"

warning "⚠️  Security Note: Make sure to:"
warning "   - Restrict database access to your application only"
warning "   - Use HTTPS in production"
warning "   - Update OAuth redirect URLs for production domain"
warning "   - Keep your environment variables secure"

log "Deployment script completed successfully! 🚀"
