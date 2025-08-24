#!/bin/bash

# =============================================================================
# Simple AWS Lightsail Deployment Script for Zenith Forum
# =============================================================================
# This script only does what's required: database setup, build, PM2, and Nginx
# =============================================================================

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Configuration
PROJECT_DIR="/opt/zenith"
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DOMAIN="zenith.stvincentngp.edu.in"
PORT=3000

log "Starting Zenith deployment..."

# =============================================================================
# 1. Install required packages
# =============================================================================

log "Installing required packages..."
sudo apt update
sudo apt install -y postgresql postgresql-contrib nodejs npm nginx certbot python3-certbot-nginx

# =============================================================================
# 2. Setup PostgreSQL
# =============================================================================

log "Setting up PostgreSQL..."

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER SUPERUSER;
\c $DB_NAME;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
\q
EOF

# Import schema
log "Importing database schema..."
sudo -u postgres psql -d $DB_NAME < complete_schema.sql

# Import data if insert scripts exist
if [ -d "db_export/insert_scripts" ]; then
    log "Importing database data..."
    for sql_file in db_export/insert_scripts/*.sql; do
        if [ -f "$sql_file" ]; then
            sudo -u postgres psql -d $DB_NAME < "$sql_file"
        fi
    done
fi

log "Database setup completed"

# =============================================================================
# 3. Setup project
# =============================================================================

log "Setting up project..."

# Create project directory
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Copy project files (excluding unnecessary files)
rsync -av --exclude='node_modules' --exclude='.next' --exclude='.git' --exclude='db_export' . $PROJECT_DIR/
cd $PROJECT_DIR

# Create production environment file
cat > .env.local << EOF
# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
DIRECT_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT Configuration
JWT_SECRET="8899cf1f2dfa3946e5d4356bb744fac05daf61e56c83342a7b46aed664238eed0aeb81a75a19a9551b"
NEXTAUTH_SECRET="9b6caef029c807e86e2a3ecae1a724b2a62ce70e25054521fea9e63b80b3dc0c89f1211721b1f238cf"
NEXTAUTH_URL="https://$DOMAIN"
JWT_REFRESH_SECRET="0e25054521fea9e63b80b3dc0c89f1211721b1f238cf8303cda417a373582f3d366a5a7dec1e5201a3"

# Code Execution Services
CODE_EXECUTION_SERVICE_URL=https://execution-compiler.onrender.com
CODE_EXECUTION_SERVICE_API_KEY="e78899cf1f2dfa3946e5d4356bb744fac05daf61e56c83342a7b46aed664238eed0aeb81a75a19a9551b8c0c8217a8453d6eab52603040ba0071627c1e59b6caef029c807e86e2a3ecae1a724b2a62ce70e25054521fea9e63b80b3dc0c89f1211721b1f238cf8303cda417a373582f3d366a5a7dec1e5201a347eed486a243ede3982db31f2d83da495c0fc8fe22f6d4fb5b531dda0da49f2a65e0ee10720"
CODE_EXECUTION_TIMEOUT=10000
CODE_EXECUTION_MEMORY_LIMIT=128

# Google Services
GEMINI_API_KEY="AIzaSyDcKfbe_kN-Ez-rCp6jHJUk964l89_G1sY"
GOOGLE_GENERATIVE_AI_API_KEY="AIzaSyDcKfbe_kN-Ez-rCp6jHJUk964l89_G1sY"

# reCAPTCHA Configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="6LcKlK8rAAAAAAKmNb8F9z5zEhzuiZgLDD11RVec"
RECAPTCHA_SECRET_KEY="6LcKlK8rAAAAAN8dZdC7MBmuvP_kEJJcgQhKiWu5"

# OAuth Configuration
GOOGLE_CLIENT_ID="824195153103-9ggpn8tno8vsstjhgo9o2tr1c3jn9t0v.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
GITHUB_CLIENT_ID="Ov23liDmhUZmvO1fOoeX"
GITHUB_CLIENT_SECRET="9c89a719c279170e01175c2cb0e1bb0f25a4f976"

# Email Service Configuration
RESEND_API_KEY="re_KDcLCzRw_Jh1QVcp68q1oc6XSiovEMCDW"
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_SECURE="false"
EMAIL_USER="zenith.forum@stvincentngp.edu.in"
EMAIL_PASSWORD="vhwy wmdd xoue tgfg"

# Security Configuration
TOTP_ISSUER="Zenith Platform"
TOTP_ENCRYPTION_KEY="6e2a3ecae1a724b2a62ce70el50o4j21"
TOTP_RECOVERY_CODES_COUNT=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/gif,application/pdf"

# App Configuration
NEXT_PUBLIC_APP_URL="https://$DOMAIN"
NODE_ENV=production
PORT=$PORT
EOF

# Install dependencies and build
log "Installing dependencies..."
npm install

log "Building application..."
npm run build

# =============================================================================
# 4. Setup PM2
# =============================================================================

log "Setting up PM2..."

# Install PM2
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'zenith',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $(eval echo ~$USER)

# =============================================================================
# 5. Setup Nginx with HTTPS
# =============================================================================

log "Setting up Nginx..."

# Create Nginx config
sudo tee /etc/nginx/sites-available/zenith << EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static files
    location /_next/static {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/zenith /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL
log "Setting up SSL certificate..."
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# =============================================================================
# Complete
# =============================================================================

log "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is now running at: https://$DOMAIN"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs zenith"
echo ""
log "Deployment finished! 🚀"
