#!/bin/bash

# Script to apply the trusted device functionality migration
set -e

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Database connection settings
DB_NAME=${1:-"zenith"}
DB_USER=${2:-"postgres"}

echo "Applying trusted device functionality migration to database '$DB_NAME' as user '$DB_USER'"

# Apply the migration script
psql -U "$DB_USER" -d "$DB_NAME" -f "$DIR/database/add_trusted_devices_functionality.sql"

# Apply the 2FA system fixes (if needed)
if [ -f "$DIR/database/fix_2fa_system.sql" ]; then
  echo "Applying 2FA system fixes..."
  psql -U "$DB_USER" -d "$DB_NAME" -f "$DIR/database/fix_2fa_system.sql"
fi

echo "Migration completed successfully!"
