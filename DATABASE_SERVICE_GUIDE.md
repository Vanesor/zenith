# Zenith Database Service Guide

## Overview

The Zenith application uses a centralized database service pattern for all database operations. This guide explains how to use the database service correctly.

## Architecture

![Database Architecture](https://via.placeholder.com/800x400?text=Zenith+Database+Architecture)

The database architecture consists of:

1. **Prisma Schema**: Defines database models and relationships (`prisma/schema.prisma`)
2. **Generated Prisma Client**: Auto-generated TypeScript types and database access methods (`src/generated/prisma/`)
3. **Database Client Singleton**: Prevents connection pool exhaustion (`src/lib/db.ts`)
4. **Database Service**: Provides common operations and helpers (`src/lib/database-service.ts`)
5. **Unified Export**: Re-exports everything for easy imports (`src/lib/database.ts`)

## Usage Guide

### Basic Import

Always import from the database service rather than using Prisma directly:

```typescript
// ✅ CORRECT: Import from the database service
import { db, findUserByEmail } from '@/lib/database';

// ❌ INCORRECT: Don't import directly from Prisma
import { PrismaClient } from '@prisma/client';
```

### Direct Database Access

When you need direct access to the database client:

```typescript
import { db } from '@/lib/database';

// Query example
const users = await db.users.findMany({
  where: {
    role: 'student'
  },
  select: {
    id: true,
    name: true,
    email: true
  }
});
```

### Using Helper Functions

The database service provides helper functions for common operations:

```typescript
import { findUserByEmail, findAllClubs, findEventWithDetails } from '@/lib/database';

// Find a user
const user = await findUserByEmail('student@zenith.com');

// Get all clubs with limit
const clubs = await findAllClubs({ limit: 10 });

// Get event with related data
const event = await findEventWithDetails('event-uuid');
```

### Creating Records

```typescript
import { createUser, createClub, createEvent } from '@/lib/database';

// Create a user
const newUser = await createUser({
  email: 'new-user@zenith.com',
  password_hash: 'hashed_password',
  name: 'New User',
  role: 'student'
});

// Create a club
const newClub = await createClub({
  name: 'New Club',
  description: 'A new club for students'
});
```

### Working with Transactions

For operations that need to be atomic:

```typescript
import { transaction, db } from '@/lib/database';

// Example: Create user and profile in a transaction
const result = await transaction(async (tx) => {
  const user = await tx.users.create({
    data: {
      email: 'user@example.com',
      password_hash: 'hashed_password',
      name: 'Example User'
    }
  });
  
  // Other operations in the same transaction
  // ...
  
  return user;
});
```

## Field Naming Convention

Our database uses snake_case for field names, so use the exact field names from the database:

```typescript
// Example with snake_case fields
const user = await db.users.create({
  data: {
    email: 'user@example.com',
    password_hash: 'hashed_password', // Snake_case field
    profile_image_url: 'https://...', // Snake_case field
    created_at: new Date()           // Snake_case field
  }
});
```

## Best Practices

1. **Always use the singleton**: Import database operations from `@/lib/database` rather than creating new instances.

2. **Prefer helper functions**: Use the provided helpers for common operations instead of writing your own queries.

3. **Use transactions for multi-step operations**: When multiple database operations need to be atomic, wrap them in a transaction.

4. **Select only needed fields**: Specify which fields to include in your queries to reduce data transfer.

5. **Disconnect after long-running operations**: For scripts that run outside the normal application lifecycle, call `db.$disconnect()` when done.

## Advanced Usage

### Custom Queries

For complex queries not covered by helper functions:

```typescript
import { db, Prisma } from '@/lib/database';

// Example: Advanced query with nested relations and filtering
const results = await db.events.findMany({
  where: {
    AND: [
      { event_date: { gte: new Date() } },
      { status: 'upcoming' }
    ]
  },
  orderBy: { event_date: 'asc' },
  include: {
    club: true,
    event_attendees: {
      where: { status: 'confirmed' },
      include: { user: true }
    }
  }
});
```

### Raw SQL Queries

For cases where you need direct SQL:

```typescript
import { db, Prisma } from '@/lib/database';

const result = await db.$queryRaw`
  SELECT u.id, u.name, COUNT(e.id) as event_count
  FROM users u
  JOIN event_attendees ea ON u.id = ea.user_id
  JOIN events e ON ea.event_id = e.id
  WHERE u.role = 'student'
  GROUP BY u.id, u.name
  HAVING COUNT(e.id) > 5
  ORDER BY event_count DESC
  LIMIT 10
`;
```

## Maintenance

### Updating the Schema

When the database structure changes:

```bash
# Pull the latest schema from the database
npx prisma db pull

# Generate the updated Prisma client
npx prisma generate
```

### Verifying Setup

Run the verification script:

```bash
npx tsx verify-schema.ts
```

### Updating Imports

To update database imports across the codebase:

```bash
./update-database-imports.sh
```
