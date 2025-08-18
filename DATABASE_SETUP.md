# Zenith Database Setup

This document explains the database setup for the Zenith project.

## Overview

We've set up a clean, optimized database configuration using Prisma with Supabase. The setup follows best practices for performance, type safety, and code organization.

## Key Components

1. **Prisma Schema** (`prisma/schema.prisma`)
   - Automatically generated from the Supabase database structure
   - Defines all models, relationships, and fields
   - Configured for PostgreSQL with proper data types

2. **Database Client** (`src/lib/db.ts`)
   - Implements the singleton pattern for Prisma client
   - Optimized for Next.js hot reloading
   - Includes graceful shutdown handlers
   - Exports types for better TypeScript integration

3. **Legacy Adapter** (`src/lib/database.ts`)
   - Re-exports the new db client for backward compatibility
   - Allows existing code to continue working without changes
   - Marked as deprecated to encourage migration to the new import path

## Usage

### For New Code

```typescript
// Import the database client
import { db } from '@/lib/db';

// Use the client in your code
async function getUsers() {
  const users = await db.users.findMany();
  return users;
}
```

### Important Notes

1. **Model Names:** Model names in Prisma directly match table names from Supabase (e.g., `users`, `assignments`, not `user`, `assignment`)

2. **Type Exports:** You can import Prisma types directly from the db module:
   ```typescript
   import { db, users } from '@/lib/db';
   
   async function createUser(userData: Prisma.usersCreateInput) {
     return db.users.create({ data: userData });
   }
   ```

3. **Connection Management:** The client handles connection pooling automatically. For long-running scripts or edge functions, make sure to call `db.$disconnect()` when done.

## Verification

You can verify the database setup is working correctly by running:

```bash
npx tsx verify-db.ts
```

This script performs several checks:
- Tests basic connectivity
- Retrieves table statistics
- Tests relationships with sample queries
- Verifies transaction support

## Migration from Old Setup

If you find code still using the old database imports, update them to use the new pattern:

Old:
```typescript
import { prismaClient } from '@/lib/database';
// or
import db from '@/lib/database';
```

New:
```typescript
import { db } from '@/lib/db';
```
