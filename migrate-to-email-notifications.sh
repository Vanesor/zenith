#!/bin/bash

# Script to migrate from in-app notifications to email-only notifications for Supabase

echo "Starting migration from in-app notifications to email-only notifications on Supabase..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Supabase CLI is not installed. Please install it first."
  echo "Follow the instructions at: https://supabase.com/docs/reference/cli/installing-and-updating"
  exit 1
fi

# Check if user is logged in to Supabase
if ! supabase projects list &> /dev/null; then
  echo "Please login to Supabase first using: supabase login"
  exit 1
fi

# Combine the SQL files into a single migration file
echo "Preparing migration SQL..."
mkdir -p ./supabase/migrations
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_FILE="./supabase/migrations/${TIMESTAMP}_email_notifications_migration.sql"

# Create the migration file
echo "-- Migration: Switch from in-app to email-only notifications" > $MIGRATION_FILE
echo "-- Created at: $(date)" >> $MIGRATION_FILE
echo "" >> $MIGRATION_FILE
cat ./database/create_email_logs_table.sql >> $MIGRATION_FILE
echo "" >> $MIGRATION_FILE
cat ./database/remove_notifications_table.sql >> $MIGRATION_FILE
echo "" >> $MIGRATION_FILE
cat ./database/add_2fa_columns.sql >> $MIGRATION_FILE

echo "Migration file created at: $MIGRATION_FILE"

# Ask for confirmation
read -p "Do you want to apply this migration to your Supabase project now? (y/n): " CONFIRM

if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
  echo "Applying migration to Supabase..."
  supabase db push
  echo "Migration completed successfully!"
else
  echo "Migration file created but not applied. Run 'supabase db push' manually when ready."
fi
echo ""
echo "NOTE: Make sure your email service configuration is correct in the .env file:"
echo "EMAIL_HOST=smtp.example.com"
echo "EMAIL_PORT=587"
echo "EMAIL_SECURE=false"
echo "EMAIL_USER=your-email@example.com"
echo "EMAIL_PASSWORD=your-email-password"
echo ""
echo "All notifications will now be sent via email only."
