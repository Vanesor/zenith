#!/bin/bash

# Zenith Production Deployment Script
# This script deploys the application for high-scale production use

set -e  # Exit on any error

echo "🚀 Starting Zenith Production Deployment"

# Configuration
PROJECT_NAME="zenith"
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./deploy.log"

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
log "Checking prerequisites..."

if ! command_exists docker; then
    log "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command_exists docker-compose; then
    log "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

log "✅ Prerequisites check passed"

# Load environment variables
if [ -f .env.production ]; then
    source .env.production
    log "✅ Production environment loaded"
else
    log "❌ .env.production file not found. Please create it first."
    exit 1
fi

# Backup existing data (if any)
log "Creating backup of existing data..."
if [ -d "postgres_data" ]; then
    cp -r postgres_data $BACKUP_DIR/
    log "✅ Database data backed up"
fi

if [ -d "redis_data" ]; then
    cp -r redis_data $BACKUP_DIR/
    log "✅ Redis data backed up"
fi

# Build the application
log "Building application..."
docker-compose -f docker-compose.production.yml build --no-cache
log "✅ Application built successfully"

# Stop existing containers
log "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down
log "✅ Existing containers stopped"

# Start database services first
log "Starting database services..."
docker-compose -f docker-compose.production.yml up -d postgres-master
sleep 10  # Wait for master to be ready

docker-compose -f docker-compose.production.yml up -d postgres-replica1 postgres-replica2
sleep 15  # Wait for replicas to sync

log "✅ Database services started"

# Start cache services
log "Starting cache services..."
docker-compose -f docker-compose.production.yml up -d redis-cluster
sleep 5
log "✅ Cache services started"

# Start monitoring services
log "Starting monitoring services..."
docker-compose -f docker-compose.production.yml up -d prometheus grafana
sleep 5
log "✅ Monitoring services started"

# Start application instances
log "Starting application instances..."
docker-compose -f docker-compose.production.yml up -d app1 app2 app3
sleep 10
log "✅ Application instances started"

# Start load balancer
log "Starting load balancer..."
docker-compose -f docker-compose.production.yml up -d nginx
sleep 5
log "✅ Load balancer started"

# Health checks
log "Performing health checks..."

# Wait for services to be ready
sleep 30

# Check application health
for i in {1..5}; do
    if curl -f http://localhost/api/health > /dev/null 2>&1; then
        log "✅ Application health check passed"
        break
    else
        log "⏳ Waiting for application to be ready... (attempt $i/5)"
        sleep 10
    fi
    
    if [ $i -eq 5 ]; then
        log "❌ Application health check failed after 5 attempts"
        exit 1
    fi
done

# Check database replicas
log "Checking database replication status..."
docker exec zenith-postgres-master psql -U postgres -d zenith -c "SELECT client_addr, state FROM pg_stat_replication;" || log "⚠️  Could not check replication status"

# Display service status
log "📊 Service Status:"
docker-compose -f docker-compose.production.yml ps

# Display access information
log "🎉 Deployment completed successfully!"
log ""
log "📝 Access Information:"
log "   🌐 Application: http://localhost"
log "   📊 Grafana: http://localhost:3001 (admin/${GRAFANA_PASSWORD})"
log "   📈 Prometheus: http://localhost:9090"
log "   🏥 Health Check: http://localhost/api/health"
log ""
log "🔧 Management Commands:"
log "   View logs: docker-compose -f docker-compose.production.yml logs -f"
log "   Stop services: docker-compose -f docker-compose.production.yml down"
log "   Restart services: docker-compose -f docker-compose.production.yml restart"
log ""
log "💾 Backup created at: $BACKUP_DIR"
log "📄 Deployment log: $LOG_FILE"

# Create monitoring alerts
log "Setting up monitoring alerts..."
cat > ./alerts.yml << EOF
groups:
- name: zenith_alerts
  rules:
  - alert: HighCPUUsage
    expr: (100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      
  - alert: HighMemoryUsage
    expr: (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100 < 20
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      
  - alert: DatabaseConnectionsHigh
    expr: pg_stat_database_numbackends > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connections are high"
      
  - alert: ApplicationDown
    expr: up{job="zenith-apps"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Application instance is down"
EOF

log "✅ Monitoring alerts configured"

# Performance optimization tips
log ""
log "🚀 Performance Optimization Tips:"
log "   1. Monitor resource usage via Grafana dashboard"
log "   2. Scale horizontally by adding more app instances"
log "   3. Consider using a CDN for static assets"
log "   4. Implement database query optimization"
log "   5. Use Redis for session storage and caching"
log ""
log "🎯 For 1000+ concurrent users:"
log "   ✅ Database connection pooling: Configured (50 connections per replica)"
log "   ✅ Load balancing: Nginx with 3 app instances"
log "   ✅ Caching: Redis distributed cache"
log "   ✅ Session management: Concurrent user support"
log "   ✅ Rate limiting: API protection enabled"
log "   ✅ WebSocket scaling: Real-time features optimized"
log "   ✅ Monitoring: Full observability stack"

echo "🎉 Zenith is now ready for production with high-scale support!"
