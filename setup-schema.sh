#!/bin/bash

echo "🚀 Setting up Zenith database schema in local PostgreSQL..."

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "❌ PostgreSQL is not running. Starting it..."
    sudo systemctl start postgresql
fi

# Test connection first
echo "🔌 Testing database connection..."
if ! PGPASSWORD=AtharvaAyush psql -h localhost -U zenithpostgres -d zenith -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Cannot connect to database. Make sure PostgreSQL is set up correctly."
    echo "   Run: ./setup-postgres-native.sh first"
    exit 1
fi

echo "✅ Database connection successful!"

# Run the schema setup
echo "📊 Creating database schema..."
PGPASSWORD=AtharvaAyush psql -h localhost -U zenithpostgres -d zenith -f setup-local-schema.sql

if [ $? -eq 0 ]; then
    echo "✅ Database schema created successfully!"
    echo ""
    echo "📋 Database Summary:"
    echo "   • All tables created with proper relationships"
    echo "   • All indexes created for optimal performance"
    echo "   • All constraints and foreign keys established"
    echo "   • Update triggers configured"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Update your .env file to use local database:"
    echo "      DATABASE_URL=\"postgresql://zenithpostgres:AtharvaAyush@localhost:5432/zenith\""
    echo "   2. Generate Prisma client: npm run db:generate"
    echo "   3. Run your application: npm run dev"
    echo ""
    echo "📖 Use POSTGRESQL_COMMANDS_REFERENCE.md for database commands reference"
else
    echo "❌ Failed to create database schema"
    echo "   Check the error messages above"
    exit 1
fi
