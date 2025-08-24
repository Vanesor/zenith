#!/bin/bash

# =============================================================================
# Quick Fix Script for PM2 Issues
# =============================================================================
# Run this script to fix the errored PM2 processes
# =============================================================================

set -e

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
}

log "Starting PM2 cleanup and restart..."

# Stop all PM2 processes
log "Stopping all PM2 processes..."
pm2 stop all 2>/dev/null || true

# Delete all PM2 processes
log "Deleting all PM2 processes..."
pm2 delete all 2>/dev/null || true

# Clear PM2 logs
log "Clearing PM2 logs..."
pm2 flush

# Navigate to project directory
cd /opt/zenith || cd /home/bitnami/zenith || cd ~/zenith || {
    error "Could not find project directory. Please run this script from your project directory."
    exit 1
}

# Make sure the build exists
if [ ! -d ".next" ]; then
    log "Building Next.js application..."
    npm run build
fi

# Create logs directory
mkdir -p logs

# Start the application with the corrected ecosystem config
log "Starting application with PM2..."
pm2 start ecosystem.config.js

# Save PM2 configuration
log "Saving PM2 configuration..."
pm2 save

# Show status
log "Current PM2 status:"
pm2 list

# Show recent logs
log "Recent application logs:"
pm2 logs zenith --lines 10

log "✅ PM2 cleanup and restart completed!"
echo ""
echo "🔍 To check status: pm2 status"
echo "📝 To view logs: pm2 logs zenith"
echo "🔄 To restart: pm2 restart zenith"
echo ""
log "Your application should now be running properly! 🚀"
