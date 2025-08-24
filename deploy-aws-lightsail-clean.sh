#!/bin/bash

# =============================================================================
# AWS Lightsail Clean Deployment Script for Zenith Forum
# =============================================================================
# This script deploys from a clean Git clone to avoid permission issues
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
REPO_URL="https://github.com/Vanesor/zenith.git"  # Replace with your repo URL
BRANCH="master"  # or main
DB_NAME="zenith"
DB_USER="zenithpostgres"
DB_PASSWORD="AtharvaAyush"
DOMAIN="zenith.stvincentngp.edu.in"  # Replace with your actual domain
PORT=3000

log "Starting clean AWS Lightsail deployment for Zenith Forum..."

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
    rsync \
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

# Install Node.js using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

log "Node.js installed successfully"

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
# 4. Clean Project Setup
# =============================================================================

log "Step 4: Setting up project from clean Git clone..."

# Remove existing directory if it exists
if [ -d "$PROJECT_DIR" ]; then
    log "Removing existing project directory..."
    sudo rm -rf $PROJECT_DIR
fi

# Create project directory
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Clone the repository
log "Cloning repository from $REPO_URL..."
git clone $REPO_URL $PROJECT_DIR
cd $PROJECT_DIR

# Checkout specific branch if needed
if [ "$BRANCH" != "master" ] && [ "$BRANCH" != "main" ]; then
    git checkout $BRANCH
fi

# Set proper permissions
sudo chown -R $USER:$USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR

log "Project cloned and permissions set successfully"

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

log "Environment configuration created successfully"

# =============================================================================
# 6. Install Dependencies and Build
# =============================================================================

log "Step 6: Installing dependencies and building application..."

# Install dependencies
npm install

# Build the application
npm run build

log "Application built successfully"

# =============================================================================
# 7. Setup Database Schema (if needed)
# =============================================================================

log "Step 7: Setting up database schema..."

# Check if there are any SQL files to import
if [ -f "database_schema.sql" ]; then
    log "Importing database schema..."
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f database_schema.sql
elif [ -f "schema.sql" ]; then
    log "Importing database schema..."
    PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME -f schema.sql
else
    warning "No database schema file found. Make sure to import your schema manually if needed."
fi

log "Database setup completed"

# =============================================================================
# 8. Install and Configure PM2
# =============================================================================

log "Step 8: Installing and configuring PM2..."

# Install PM2 globally
sudo npm install -g pm2

# Create ecosystem file for PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: '$PROJECT_NAME',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: $PORT
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
EOF

# Create logs directory
mkdir -p logs

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
sudo env PATH=\$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $(eval echo ~$USER)

log "PM2 configured and application started successfully"

# =============================================================================
# 9. Configure Nginx
# =============================================================================

log "Step 9: Configuring Nginx..."

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/$PROJECT_NAME << EOF
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
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Static files
    location /_next/static {
        proxy_cache STATIC;
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Image optimization
    location /_next/image {
        proxy_pass http://localhost:$PORT;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/$PROJECT_NAME /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

log "Nginx configured successfully"

# =============================================================================
# 10. Setup SSL with Let's Encrypt
# =============================================================================

log "Step 10: Setting up SSL certificate..."

# Get SSL certificate
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

# Setup auto-renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

log "SSL certificate configured successfully"

# =============================================================================
# 11. Setup Monitoring and Backup Scripts
# =============================================================================

log "Step 11: Setting up monitoring and backup scripts..."

# Create backup script
sudo tee /usr/local/bin/backup-zenith.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/zenith"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
sudo -u postgres pg_dump zenith > $BACKUP_DIR/database_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt zenith --exclude=node_modules --exclude=.next

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make backup script executable
sudo chmod +x /usr/local/bin/backup-zenith.sh

# Setup daily backup cron job
sudo crontab -l | { cat; echo "0 2 * * * /usr/local/bin/backup-zenith.sh"; } | sudo crontab -

# Create monitoring script
sudo tee /usr/local/bin/monitor-zenith.sh << 'EOF'
#!/bin/bash
LOG_FILE="/var/log/zenith-monitor.log"

# Check if application is running
if ! pm2 list | grep -q "online"; then
    echo "$(date): Application is down, restarting..." >> $LOG_FILE
    cd /opt/zenith && pm2 restart all
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "$(date): Nginx is down, restarting..." >> $LOG_FILE
    sudo systemctl restart nginx
fi

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "$(date): PostgreSQL is down, restarting..." >> $LOG_FILE
    sudo systemctl restart postgresql
fi
EOF

# Make monitoring script executable
sudo chmod +x /usr/local/bin/monitor-zenith.sh

# Setup monitoring cron job (every 5 minutes)
sudo crontab -l | { cat; echo "*/5 * * * * /usr/local/bin/monitor-zenith.sh"; } | sudo crontab -

log "Monitoring and backup scripts configured successfully"

# =============================================================================
# 12. Final Security Configuration
# =============================================================================

log "Step 12: Applying final security configurations..."

# Configure UFW firewall
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Secure shared memory
echo 'tmpfs /run/shm tmpfs defaults,noexec,nosuid 0 0' | sudo tee -a /etc/fstab

# Set proper file permissions
chmod 600 $PROJECT_DIR/.env.local
sudo chown -R $USER:$USER $PROJECT_DIR

log "Security configurations applied successfully"

# =============================================================================
# Deployment Complete
# =============================================================================

log "🎉 Deployment completed successfully!"
echo ""
echo -e "${GREEN}==============================================================================${NC}"
echo -e "${GREEN}                    ZENITH FORUM DEPLOYMENT SUMMARY${NC}"
echo -e "${GREEN}==============================================================================${NC}"
echo ""
echo -e "${BLUE}📱 Application:${NC}      https://$DOMAIN"
echo -e "${BLUE}🗄️  Database:${NC}        PostgreSQL on localhost:5432"
echo -e "${BLUE}📂 Project Directory:${NC} $PROJECT_DIR"
echo -e "${BLUE}🔧 Process Manager:${NC}   PM2"
echo -e "${BLUE}🌐 Web Server:${NC}       Nginx with SSL"
echo ""
echo -e "${YELLOW}📋 Useful Commands:${NC}"
echo -e "${YELLOW}• View application logs:${NC}    pm2 logs $PROJECT_NAME"
echo -e "${YELLOW}• Restart application:${NC}      pm2 restart $PROJECT_NAME"
echo -e "${YELLOW}• Check application status:${NC} pm2 status"
echo -e "${YELLOW}• View Nginx logs:${NC}          sudo tail -f /var/log/nginx/error.log"
echo -e "${YELLOW}• Manual backup:${NC}            sudo /usr/local/bin/backup-zenith.sh"
echo ""
echo -e "${GREEN}🔐 Security Features Enabled:${NC}"
echo -e "${GREEN}• SSL/HTTPS certificate${NC}"
echo -e "${GREEN}• UFW firewall configured${NC}"
echo -e "${GREEN}• Security headers in Nginx${NC}"
echo -e "${GREEN}• Automated backups (daily at 2 AM)${NC}"
echo -e "${GREEN}• Health monitoring (every 5 minutes)${NC}"
echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo -e "${BLUE}1. Update DNS records to point $DOMAIN to this server${NC}"
echo -e "${BLUE}2. Test the application: https://$DOMAIN${NC}"
echo -e "${BLUE}3. Monitor logs for any issues${NC}"
echo -e "${BLUE}4. Set up additional monitoring if needed${NC}"
echo ""
echo -e "${GREEN}==============================================================================${NC}"

# Show current status
echo ""
log "Current Application Status:"
pm2 status
echo ""
log "Current System Status:"
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l

log "Deployment script completed successfully! 🚀"
