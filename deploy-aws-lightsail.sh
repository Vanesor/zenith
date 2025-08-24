#!/bin/bash

# =============================================================================
# AWS Lightsail Deployment Script for Zenith Forum
# =============================================================================
# This script automates the complete deployment of Zenith Forum on AWS Lightsail
# including PostgreSQL setup, environment configuration, build, and PM2 deployment
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# =============================================================================
# Configuration Variables
# =============================================================================

PROJECT_NAME="zenith"
PROJECT_DIR="/opt/zenith"
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DOMAIN="zenith.stvincentngp.edu.in"  # Replace with your actual domain
PORT=3000

log "Starting AWS Lightsail deployment for Zenith Forum..."

# =============================================================================
# 1. System Updates and Dependencies
# =============================================================================

log "Step 1: Updating system and installing dependencies..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y \
    curl \
    wget \
    git \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    nginx \
    certbot \
    python3-certbot-nginx \
    unzip

# =============================================================================
# 2. Install Node.js 18+
# =============================================================================

log "Step 2: Installing Node.js..."

# Remove old Node.js if exists
sudo apt remove -y nodejs npm

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node_version=$(node --version)
npm_version=$(npm --version)
log "Node.js version: $node_version"
log "NPM version: $npm_version"

# Install PM2 globally
sudo npm install -g pm2

# =============================================================================
# 3. Install and Configure PostgreSQL
# =============================================================================

log "Step 3: Installing and configuring PostgreSQL..."

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql << EOF
-- Create database user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Grant additional privileges
ALTER USER $DB_USER CREATEDB;
ALTER USER $DB_USER SUPERUSER;

-- Install required extensions
\c $DB_NAME;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Exit
\q
EOF

# Configure PostgreSQL for external connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf

# Update pg_hba.conf for authentication
sudo bash -c "cat >> /etc/postgresql/*/main/pg_hba.conf << EOF

# Zenith application access
host    $DB_NAME    $DB_USER    127.0.0.1/32    md5
host    $DB_NAME    $DB_USER    localhost       md5
EOF"

# Restart PostgreSQL
sudo systemctl restart postgresql

log "PostgreSQL installed and configured successfully"

# =============================================================================
# 4. Create Project Directory and Clone/Setup Code
# =============================================================================

log "Step 4: Setting up project directory..."

# Create project directory
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# If this script is run from the project directory, copy files
if [ -f "package.json" ] && [ -f "next.config.ts" ]; then
    log "Copying project files..."
    cp -r . $PROJECT_DIR/
    cd $PROJECT_DIR
else
    error "This script must be run from the Zenith project root directory"
fi

# Remove sensitive files
rm -f .env.local.example
rm -f deploy-aws-lightsail.sh

# =============================================================================
# 5. Setup Environment Variables
# =============================================================================

log "Step 5: Creating production environment configuration..."

# Create production .env.local
cat > .env.local << EOF
# =============================================================================
# Production Environment Configuration for AWS Lightsail
# =============================================================================

# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
DIRECT_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Database Connection Details
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

# WebSocket Configuration
WEBSOCKET_PORT=3001
EOF

log "Environment configuration created"

# =============================================================================
# 6. Database Schema and Data Import
# =============================================================================

log "Step 6: Setting up database schema and importing data..."

# Import schema
if [ -f "complete_schema.sql" ]; then
    log "Importing database schema..."
    sudo -u postgres psql -d $DB_NAME -f complete_schema.sql
else
    warning "complete_schema.sql not found, skipping schema import"
fi

# Import data from db_export if available
if [ -d "db_export/insert_scripts" ]; then
    log "Importing database data..."
    for sql_file in db_export/insert_scripts/*.sql; do
        if [ -f "$sql_file" ]; then
            log "Importing $(basename $sql_file)..."
            sudo -u postgres psql -d $DB_NAME -f "$sql_file" || warning "Failed to import $(basename $sql_file)"
        fi
    done
else
    warning "db_export/insert_scripts directory not found, skipping data import"
fi

log "Database setup completed"

# =============================================================================
# 7. Install Dependencies and Build
# =============================================================================

log "Step 7: Installing dependencies and building application..."

# Install dependencies
npm ci --production=false

# Build the application
npm run build

log "Application built successfully"

# =============================================================================
# 8. Configure PM2
# =============================================================================

log "Step 8: Configuring PM2..."

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'zenith-forum',
      script: 'npm',
      args: 'start',
      cwd: '$PROJECT_DIR',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: $PORT
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: $PORT
      },
      log_file: '/var/log/pm2/zenith-combined.log',
      out_file: '/var/log/pm2/zenith-out.log',
      error_file: '/var/log/pm2/zenith-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      min_uptime: '10s',
      max_restarts: 10,
      autorestart: true,
      watch: false
    }
  ]
};
EOF

# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start application with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER

log "PM2 configured and application started"

# =============================================================================
# 9. Configure Nginx
# =============================================================================

log "Step 9: Configuring Nginx..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/zenith << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration (will be configured by Certbot)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;
    
    # File upload size
    client_max_body_size 10M;
    
    # Proxy settings
    proxy_set_header Host \$host;
    proxy_set_header X-Real-IP \$remote_addr;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_cache_bypass \$http_upgrade;
    
    # Main application
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Static files
    location /_next/static/ {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:$PORT;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/zenith /etc/nginx/sites-enabled/

# Remove default Nginx site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

log "Nginx configured successfully"

# =============================================================================
# 10. Setup SSL with Let's Encrypt
# =============================================================================

log "Step 10: Setting up SSL certificate..."

# Obtain SSL certificate
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Setup automatic renewal
sudo systemctl enable certbot.timer

log "SSL certificate configured"

# =============================================================================
# 11. Configure Firewall
# =============================================================================

log "Step 11: Configuring firewall..."

# Enable UFW
sudo ufw --force enable

# Configure firewall rules
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432 # PostgreSQL (if needed for external access)

log "Firewall configured"

# =============================================================================
# 12. Setup Monitoring and Logs
# =============================================================================

log "Step 12: Setting up monitoring and log rotation..."

# Setup log rotation for PM2 logs
sudo tee /etc/logrotate.d/pm2 << EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create monitoring script
sudo tee /usr/local/bin/zenith-monitor.sh << EOF
#!/bin/bash
# Zenith monitoring script

# Check if application is running
if ! pm2 list | grep -q "zenith-forum.*online"; then
    echo "\$(date): Zenith application is down, restarting..." >> /var/log/zenith-monitor.log
    pm2 restart zenith-forum
fi

# Check database connection
if ! sudo -u postgres psql -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "\$(date): Database connection failed" >> /var/log/zenith-monitor.log
    sudo systemctl restart postgresql
fi

# Check disk space
DISK_USAGE=\$(df / | awk 'NR==2 {print \$5}' | sed 's/%//')
if [ \$DISK_USAGE -gt 85 ]; then
    echo "\$(date): Disk usage is \${DISK_USAGE}%" >> /var/log/zenith-monitor.log
fi
EOF

sudo chmod +x /usr/local/bin/zenith-monitor.sh

# Add cron job for monitoring
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/zenith-monitor.sh") | crontab -

# =============================================================================
# 13. Create Backup Script
# =============================================================================

log "Step 13: Creating backup script..."

sudo tee /usr/local/bin/zenith-backup.sh << EOF
#!/bin/bash
# Zenith backup script

BACKUP_DIR="/opt/backups/zenith"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p \$BACKUP_DIR

# Database backup
sudo -u postgres pg_dump $DB_NAME > \$BACKUP_DIR/db_backup_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/app_backup_\$DATE.tar.gz -C $PROJECT_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "\$(date): Backup completed - \$BACKUP_DIR/backup_\$DATE.*"
EOF

sudo chmod +x /usr/local/bin/zenith-backup.sh

# Add daily backup cron job
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/zenith-backup.sh") | crontab -

# =============================================================================
# 14. Final Setup and Verification
# =============================================================================

log "Step 14: Final verification and cleanup..."

# Set proper permissions
sudo chown -R $USER:$USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
chmod 600 $PROJECT_DIR/.env.local

# Restart all services
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart all

# Wait for services to start
sleep 10

# Verify services
log "Verifying deployment..."

# Check PostgreSQL
if sudo systemctl is-active --quiet postgresql; then
    log "✓ PostgreSQL is running"
else
    error "✗ PostgreSQL is not running"
fi

# Check Nginx
if sudo systemctl is-active --quiet nginx; then
    log "✓ Nginx is running"
else
    error "✗ Nginx is not running"
fi

# Check PM2
if pm2 list | grep -q "zenith-forum.*online"; then
    log "✓ Zenith application is running"
else
    error "✗ Zenith application is not running"
fi

# Check HTTP response
if curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT | grep -q "200\|301\|302"; then
    log "✓ Application is responding"
else
    warning "✗ Application may not be responding correctly"
fi

# =============================================================================
# 15. Display Summary
# =============================================================================

log "🎉 Deployment completed successfully!"

echo ""
echo "=========================================="
echo "        DEPLOYMENT SUMMARY"
echo "=========================================="
echo "Project: Zenith Forum"
echo "Domain: https://$DOMAIN"
echo "Database: PostgreSQL ($DB_NAME)"
echo "Application: Running on port $PORT"
echo "Process Manager: PM2"
echo "Web Server: Nginx with SSL"
echo ""
echo "Useful Commands:"
echo "- View application logs: pm2 logs zenith-forum"
echo "- Restart application: pm2 restart zenith-forum"
echo "- Check status: pm2 status"
echo "- View Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo "- Database backup: /usr/local/bin/zenith-backup.sh"
echo "- Monitor application: tail -f /var/log/zenith-monitor.log"
echo ""
echo "Next Steps:"
echo "1. Update your domain DNS to point to this server"
echo "2. Test the application at https://$DOMAIN"
echo "3. Configure any additional environment variables if needed"
echo "4. Set up monitoring and alerting as required"
echo ""
echo "=========================================="

log "Deployment script completed. Your Zenith Forum should now be live!"
