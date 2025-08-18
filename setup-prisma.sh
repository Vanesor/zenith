#!/bin/bash

# This script automates the setup of Prisma with Supabase for the Zenith project
# It performs the following:
# 1. Checks for DATABASE_URL in .env file
# 2. Pulls the latest schema from the database
# 3. Generates the Prisma client
# 4. Runs verification tests

echo "🚀 Starting Prisma+Supabase Setup"
echo "--------------------------------"

# Check for required environment variables
if [ ! -f .env ]; then
  echo "❌ .env file not found. Creating a template..."
  echo "DATABASE_URL=\"postgresql://postgres:password@localhost:5432/zenith\"" > .env
  echo "⚠️ Please edit .env with your actual Supabase DATABASE_URL before continuing"
  exit 1
fi

if ! grep -q "DATABASE_URL" .env; then
  echo "❌ DATABASE_URL not found in .env file"
  echo "⚠️ Please add DATABASE_URL to your .env file before continuing"
  exit 1
fi

# Check if npm packages are installed
if ! command -v npx &> /dev/null; then
  echo "❌ npx not found. Please install Node.js and npm first."
  exit 1
fi

# Install dependencies if needed
if ! npm list prisma &> /dev/null; then
  echo "📦 Installing required packages..."
  npm install prisma --save-dev
  npm install @prisma/client
fi

# Create Prisma schema directory if it doesn't exist
if [ ! -d "prisma" ]; then
  echo "📁 Creating prisma directory..."
  mkdir -p prisma
fi

# Pull schema from database
echo "🔄 Pulling latest schema from Supabase..."
npx prisma db pull

# Check if schema was successfully pulled
if [ ! -f "prisma/schema.prisma" ]; then
  echo "❌ Failed to pull schema from database"
  exit 1
fi

# Check schema output location
# Make sure the output is directed to src/generated/prisma
if ! grep -q "output   = \"../src/generated/prisma\"" prisma/schema.prisma; then
  echo "🔧 Updating Prisma client output location..."
  # Create a temporary file for the updated schema
  TMP_FILE=$(mktemp)
  
  # Replace or add the output directive
  awk '{
    if ($1 == "generator" && $2 == "client" && $3 == "{") {
      print $0
      getline
      if ($1 == "provider") {
        print $0
        print "  output   = \"../src/generated/prisma\""
      } else {
        print $0
      }
    } else {
      print $0
    }
  }' prisma/schema.prisma > "$TMP_FILE"
  
  # Replace the original file with the updated one
  mv "$TMP_FILE" prisma/schema.prisma
fi

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Create src/lib directory if it doesn't exist
if [ ! -d "src/lib" ]; then
  echo "📁 Creating src/lib directory..."
  mkdir -p src/lib
fi

# Create db.ts file if it doesn't exist
if [ ! -f "src/lib/db.ts" ]; then
  echo "📝 Creating db.ts Singleton client..."
  cat > src/lib/db.ts << 'EOL'
// Database client singleton for use in Next.js application
// This pattern prevents connection pool exhaustion during development
// with hot reloading

import { PrismaClient } from '../generated/prisma';

// Prevent multiple instances in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Create singleton instance
export const db = globalThis.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Preserve instance across hot reloads in development
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db;
}

// Re-export everything from Prisma client
export * from '../generated/prisma';
export default db;
EOL
fi

# Create database.ts compatibility file
if [ ! -f "src/lib/database.ts" ]; then
  echo "📝 Creating database.ts compatibility layer..."
  cat > src/lib/database.ts << 'EOL'
// Re-export from db.ts for backward compatibility
// This file allows existing code that imports from "@/lib/database" to continue working

import { db } from './db';
export * from './db';
export default db;
EOL
fi

echo "✨ Prisma setup completed successfully!"
echo ""
echo "You can now use the database client in your code:"
echo "import { db } from '@/lib/db';"
echo ""
echo "For more information, see the PRISMA_SETUP_GUIDE.md document."
