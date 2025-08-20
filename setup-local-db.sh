#!/bin/bash

echo "🚀 Setting up local database for Zenith project..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    echo "📥 Download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

echo "✅ Docker is installed"

# Start PostgreSQL container
echo "🐘 Starting PostgreSQL container..."
if command -v docker-compose &> /dev/null; then
    sudo docker-compose up -d
else
    sudo docker compose up -d
fi

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 10

# Check if PostgreSQL is running
if sudo docker ps | grep -q zenith_postgres; then
    echo "✅ PostgreSQL container is running"
else
    echo "❌ Failed to start PostgreSQL container"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate dev --name init

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "✅ Local database setup complete!"
echo ""
echo "🎉 Your local database is ready!"
echo "📊 Access Prisma Studio: npx prisma studio"
echo "🐘 PostgreSQL URL: postgresql://ZenithPostgres:AtharvaAyush@localhost:5432/zenith"
echo ""
echo "🚀 Start your development server: npm run dev"
