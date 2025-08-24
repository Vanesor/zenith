#!/bin/bash

# =============================================================================
# Quick Fix Script for Git Permission Issues
# =============================================================================
# Run this script to fix Git permission issues on AWS Lightsail
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

PROJECT_DIR="/opt/zenith"

log "Starting Git permission fix..."

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
    error "Project directory $PROJECT_DIR does not exist"
fi

cd $PROJECT_DIR

# Fix ownership of the entire project directory
log "Fixing ownership permissions..."
sudo chown -R $USER:$USER $PROJECT_DIR

# Fix file permissions
log "Fixing file permissions..."
chmod -R 755 $PROJECT_DIR

# Handle Git directory specifically
if [ -d "$PROJECT_DIR/.git" ]; then
    log "Fixing Git directory permissions..."
    
    # Remove problematic pack files
    log "Cleaning up Git pack files..."
    rm -rf .git/objects/pack/*.idx 2>/dev/null || true
    rm -rf .git/objects/pack/*.pack 2>/dev/null || true
    
    # Fix Git directory permissions
    sudo chown -R $USER:$USER .git
    chmod -R 755 .git
    
    # Configure Git for this directory
    git config --global --add safe.directory $PROJECT_DIR
    git config user.name "Deploy Bot"
    git config user.email "deploy@zenith.com"
    
    # Test Git status
    if git status >/dev/null 2>&1; then
        log "Git repository is now working correctly"
    else
        warning "Git repository still has issues. Reinitializing..."
        
        # Backup current files
        cp -r . ../zenith-backup-$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
        
        # Remove Git directory and reinitialize
        rm -rf .git
        git init
        git config user.name "Deploy Bot"
        git config user.email "deploy@zenith.com"
        git add .
        git commit -m "Reinitialized Git repository after permission fix"
        
        log "Git repository reinitialized successfully"
    fi
else
    log "No Git directory found. Initializing new repository..."
    git init
    git config user.name "Deploy Bot"
    git config user.email "deploy@zenith.com"
    git add .
    git commit -m "Initial commit after permission fix"
fi

# Continue with deployment if the original script was interrupted
log "Checking if deployment can continue..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    log "Installing dependencies..."
    npm install
fi

# Check if build exists
if [ ! -d ".next" ]; then
    log "Building application..."
    npm run build
fi

# Check if PM2 is running the application
if ! pm2 list | grep -q "zenith.*online"; then
    log "Starting application with PM2..."
    pm2 start ecosystem.config.js 2>/dev/null || pm2 start npm --name "zenith" -- start
    pm2 save
fi

log "✅ Git permission fix completed successfully!"
log "🚀 Application should now be running properly"

# Show status
echo ""
log "Current PM2 Status:"
pm2 status

echo ""
log "If you want to run a clean deployment, use the deploy-aws-lightsail-clean.sh script instead"
