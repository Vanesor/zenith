# Zenith Database Setup

## Overview

This document explains the database architecture for the Zenith project, which uses Prisma with a Supabase PostgreSQL database.

## Database Architecture

The setup follows these principles:

1. **Single Source of Truth**: The schema is defined in `prisma/schema.prisma` and is the source of truth for the database structure.
2. **Singleton Pattern**: A single database client instance is used throughout the application to avoid connection pool exhaustion.
3. **Type Safety**: Full TypeScript support for database operations.

## Key Components

### 1. Prisma Schema (`prisma/schema.prisma`)

The schema defines all models, relationships, and fields for our database. It's automatically generated from the existing database structure using `prisma db pull`.

```prisma
// Example model from our schema
model users {
  id                           String    @id @default(uuid()) @db.Uuid
  email                        String    @unique
  password_hash                String
  name                         String?
  // ... more fields
}
```

### 2. Database Client (`src/lib/db.ts`)

A singleton Prisma client that maintains a single connection pool:

```typescript
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

export * from '../generated/prisma';
export default db;
```

## Usage Guide

### Importing the Database Client

```typescript
// Import the database client
import { db } from '@/lib/db';

// Example: Fetch all users
async function getUsers() {
  return await db.users.findMany();
}
```

### Working with Snake_Case Field Names

Our database uses snake_case for field names (e.g., `password_hash`, `created_at`). When using these in your code, use the exact field name from the database:

```typescript
const newUser = await db.users.create({
  data: {
    email: 'user@example.com',
    password_hash: hashedPassword,
    name: 'Example User',
    created_at: new Date(),
    // Use snake_case for field names to match the database schema
  }
});
```

### Best Practices

1. **Always use the singleton**: Import `db` from `@/lib/db` rather than creating new PrismaClient instances.

2. **Disconnect when done**: For long-running scripts or serverless functions, call `db.$disconnect()` when finished.

3. **Use transactions for multi-operation changes**:
   ```typescript
   await db.$transaction(async (tx) => {
     await tx.users.create({ /* ... */ });
     await tx.profiles.create({ /* ... */ });
   });
   ```

4. **Include only necessary fields** in queries:
   ```typescript
   const users = await db.users.findMany({
     select: {
       id: true,
       name: true,
       email: true
     }
   });
   ```

## Maintenance

### Updating the Schema

When the database structure changes, update the Prisma schema:

```bash
# Pull the latest schema from the database
npx prisma db pull

# Generate the updated Prisma client
npx prisma generate
```

### Verifying the Setup

You can run the test script to verify your database setup:

```bash
npx tsx test-schema-fields.ts
```
