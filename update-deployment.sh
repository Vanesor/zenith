#!/bin/bash

# =============================================================================
# Update Deployment Script - No Git Issues
# =============================================================================
# Use this script to update your deployed application safely
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

PROJECT_DIR="/opt/zenith"
BACKUP_DIR="/opt/backups/zenith"
REPO_URL="https://github.com/Vanesor/zenith.git"  # Replace with your repo URL
BRANCH="master"

log "Starting application update..."

# Create backup directory
sudo mkdir -p $BACKUP_DIR

# Create backup of current deployment
log "Creating backup of current deployment..."
DATE=$(date +%Y%m%d_%H%M%S)
sudo tar -czf $BACKUP_DIR/pre-update-backup-$DATE.tar.gz -C /opt zenith --exclude=node_modules --exclude=.next --exclude=.git

# Stop the application
log "Stopping application..."
pm2 stop zenith 2>/dev/null || true

# Create temporary directory for new code
TEMP_DIR="/tmp/zenith-update-$DATE"
log "Downloading latest code to $TEMP_DIR..."

# Clone fresh copy
git clone $REPO_URL $TEMP_DIR
cd $TEMP_DIR

# Checkout specific branch if needed
if [ "$BRANCH" != "master" ] && [ "$BRANCH" != "main" ]; then
    git checkout $BRANCH
fi

# Copy environment file from current deployment
if [ -f "$PROJECT_DIR/.env.local" ]; then
    log "Preserving environment configuration..."
    cp $PROJECT_DIR/.env.local .env.local
fi

# Copy any uploaded files/media
if [ -d "$PROJECT_DIR/public/uploads" ]; then
    log "Preserving uploaded files..."
    mkdir -p public/uploads
    cp -r $PROJECT_DIR/public/uploads/* public/uploads/ 2>/dev/null || true
fi

# Install dependencies
log "Installing dependencies..."
npm install

# Build the application
log "Building application..."
npm run build

# Replace old deployment with new one
log "Deploying new version..."
cd /opt

# Remove old deployment (keep backup)
sudo mv zenith zenith-old-$DATE

# Move new deployment
sudo mv $TEMP_DIR zenith

# Fix permissions
sudo chown -R $USER:$USER zenith
chmod -R 755 zenith

cd $PROJECT_DIR

# Start the application
log "Starting application..."
pm2 start ecosystem.config.js 2>/dev/null || pm2 start npm --name "zenith" -- start
pm2 save

# Wait a moment for startup
sleep 5

# Check if application started successfully
if pm2 list | grep -q "zenith.*online"; then
    log "✅ Application updated and started successfully!"
    
    # Clean up old deployment after successful start
    sudo rm -rf /opt/zenith-old-$DATE
    
    info "Application is running at: $(pm2 list | grep zenith)"
else
    error "❌ Application failed to start. Rolling back..."
    
    # Rollback
    pm2 stop zenith 2>/dev/null || true
    sudo rm -rf zenith
    sudo mv zenith-old-$DATE zenith
    cd $PROJECT_DIR
    pm2 start ecosystem.config.js 2>/dev/null || pm2 start npm --name "zenith" -- start
    
    error "Rollback completed. Check logs for issues."
fi

# Clean up temp files
rm -rf /tmp/zenith-update-*

log "Update process completed!"

# Show current status
echo ""
log "Current Application Status:"
pm2 status
pm2 logs zenith --lines 20
