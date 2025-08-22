#!/bin/bash
# Update Prisma configuration for MySQL

set -e # Exit on error

echo "Updating Prisma configuration for MySQL..."

# Check if schema.prisma exists
if [ ! -f "./prisma/schema.prisma" ]; then
  echo "ERROR: Prisma schema file not found at ./prisma/schema.prisma"
  exit 1
fi

# Backup the current schema
cp ./prisma/schema.prisma ./prisma/schema.prisma.pg.bak
echo "Backed up original Prisma schema to ./prisma/schema.prisma.pg.bak"

# Replace PostgreSQL datasource with MySQL
sed -i 's/provider = "postgresql"/provider = "mysql"/' ./prisma/schema.prisma
sed -i 's|url      = env("DATABASE_URL")|url      = env("DATABASE_URL")\nrelationMode = "foreignKeys"|' ./prisma/schema.prisma

echo "Updated database provider to MySQL in Prisma schema"

# Update environment variables if .env exists
if [ -f "./.env" ]; then
  # Backup the current .env
  cp ./.env ./.env.pg.bak
  echo "Backed up original .env to ./.env.pg.bak"
  
  # Get the current PostgreSQL URL
  PG_URL=$(grep DATABASE_URL ./.env)
  
  # Create a MySQL URL template
  MYSQL_URL="DATABASE_URL=\"mysql://user:password@localhost:3306/zenith\""
  
  # Replace the DATABASE_URL line
  sed -i "s|$PG_URL|$MYSQL_URL|" ./.env
  
  echo "Updated DATABASE_URL in .env with MySQL template"
  echo "IMPORTANT: Edit ./.env and update the MySQL connection details"
fi

echo "Prisma configuration updated for MySQL."
echo "Next steps:"
echo "1. Update your DATABASE_URL in .env with the correct MySQL connection details"
echo "2. Run 'npx prisma generate' to update the Prisma client"
echo "3. Run 'npx prisma db pull' to verify the schema matches your MySQL database"
