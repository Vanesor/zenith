# Database Consolidation Guide

## Overview

This document provides guidance on the database consolidation process for the Zenith application. Previously, the application used multiple database interfaces, which caused confusion and maintenance issues. We've now consolidated these into a single source of truth.

## Files Consolidated

The following files have been consolidated into a single `database-consolidated.ts` file:

1. `database.ts` - Legacy database implementation using PostgreSQL pool
2. `PrismaDatabase.ts` - Prisma database implementation developed during migration
3. `OptimizedPrismaDB.ts` - Alternative Prisma implementation
4. `prisma.ts` - Simple Prisma client setup

## New Database Interface

The consolidated file provides:

1. **PrismaDB instance** - A singleton instance of the PrismaDatabase class with all methods
2. **Legacy compatibility layer** - Support for legacy code that uses the Database class
3. **Direct Prisma client export** - For advanced use cases requiring direct Prisma client access

## How to Use

### For New Code

Always use the PrismaDB singleton for database operations:

```typescript
import PrismaDB from '@/lib/database-consolidated';

// Example usage
const user = await PrismaDB.findUserById(userId);
const events = await PrismaDB.getAllEvents(userId, 10);
```

### For Legacy Code

Legacy code can continue using the Database class for backward compatibility:

```typescript
import { Database } from '@/lib/database-consolidated';

// Legacy usage
const result = await Database.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0];
```

## Migration Steps

1. Replace imports of the old database files with the new consolidated one:
   - Change `import PrismaDB from '@/lib/PrismaDatabase'` to `import PrismaDB from '@/lib/database-consolidated'`
   - Change `import Database from '@/lib/database'` to `import { Database } from '@/lib/database-consolidated'`
   - Change `import { prisma } from '@/lib/prisma'` to `import { prisma } from '@/lib/database-consolidated'`

2. Verify that all code functions correctly with the new imports

3. Once all code is updated and tested, the old database files can be safely removed

## Best Practices

1. Always prefer direct PrismaDB method calls over raw SQL queries when possible
2. Use the transaction method for operations that need to be atomic
3. Handle errors appropriately using try-catch blocks
4. Log database errors consistently using the built-in error handlers

## Performance Considerations

The consolidated database interface maintains all the performance benefits of Prisma:

1. Connection pooling for efficient resource use
2. Type safety for queries through TypeScript
3. Optimized SQL generation
4. Proper transaction support
5. Automatic disconnection on process exit
