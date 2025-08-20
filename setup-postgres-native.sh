#!/bin/bash

echo "🚀 Setting up PostgreSQL without Docker for Zenith project..."

# Update package list
echo "📦 Updating package list..."
sudo apt update

# Install PostgreSQL
echo "🐘 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Start PostgreSQL service
echo "🔄 Starting PostgreSQL service..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
echo "👤 Creating database and user..."
sudo -u postgres psql << EOF
CREATE DATABASE zenith;
CREATE USER ZenithPostgres WITH PASSWORD 'AtharvaAyush';
GRANT ALL PRIVILEGES ON DATABASE zenith TO ZenithPostgres;
ALTER USER ZenithPostgres CREATEDB;
\q
EOF

# Enable UUID extension
echo "🔧 Setting up database extensions..."
sudo -u postgres psql -d zenith << EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
EOF

echo "✅ PostgreSQL setup complete!"
echo ""
echo "📊 Database Details:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: zenith"
echo "   User: ZenithPostgres"
echo "   Password: AtharvaAyush"
echo ""
echo "🔧 Connection URL: postgresql://ZenithPostgres:AtharvaAyush@localhost:5432/zenith"
echo ""

# Test connection
echo "🧪 Testing database connection..."
if PGPASSWORD=AtharvaAyush psql -h localhost -U ZenithPostgres -d zenith -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed"
    echo "   Try: sudo -u postgres psql"
    echo "   Then: ALTER USER ZenithPostgres WITH PASSWORD 'AtharvaAyush';"
fi

echo ""
echo "📝 Next steps:"
echo "   1. Update your .env file (if not already done)"
echo "   2. Run: npm run db:migrate:dev"
echo "   3. Run: npm run db:generate"
echo "   4. Run: npm run dev"
