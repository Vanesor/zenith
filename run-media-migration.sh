#!/bin/bash

# Media Migration Runner for Zenith
# This script helps you run the comprehensive media migration

echo "🚀 Zenith Media System Migration"
echo "================================="

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL (psql) is not installed or not in PATH"
    echo "Please install PostgreSQL and try again"
    exit 1
fi

# Get database connection details
read -p "Enter your database name (default: zenith): " DB_NAME
DB_NAME=${DB_NAME:-zenith}

read -p "Enter your database user (default: postgres): " DB_USER
DB_USER=${DB_USER:-zenithpostgres}

read -p "Enter your database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter your database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "📋 Migration Summary:"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo ""

# Confirm before proceeding
read -p "Do you want to proceed with the migration? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "🔄 Running comprehensive media migration..."
echo ""

# Run the migration
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f comprehensive-media-migration.sql; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎯 What was created:"
    echo "   • media_files table (core file tracking)"
    echo "   • submission_attachments table (assignment files)"
    echo "   • post_attachments table (blog post files)"
    echo "   • chat_attachments table (chat files)"
    echo "   • Added image columns to users, clubs, events tables"
    echo "   • Created performance indexes"
    echo ""
    echo "🔧 Next steps:"
    echo "   1. Run: ./setup-local-storage.sh (to create upload directories)"
    echo "   2. Create default images for fallbacks"
    echo "   3. Test file uploads in your application"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
