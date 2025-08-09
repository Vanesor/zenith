#!/bin/bash

# Script to apply the email OTP column fix

echo "Applying email OTP column fix..."

# Check if database connection details are provided in environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_USER" ] || [ -z "$DB_NAME" ]; then
    echo "Database connection details missing. Using default values..."
    
    # Use default values if environment variables are not set
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-5432}
    DB_USER=${DB_USER:-postgres}
    DB_NAME=${DB_NAME:-zenith}
fi

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -n "Enter database password for user $DB_USER: "
    read -s DB_PASSWORD
    echo ""
fi

# Apply the migration
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/fix_email_otp_column.sql

if [ $? -eq 0 ]; then
    echo "✅ Email OTP column successfully updated to CHAR(64) type"
    echo "The system will now be able to store hashed OTP codes properly"
else
    echo "❌ Error applying migration. Please check the database connection and try again."
    exit 1
fi

echo "Migration complete!"
