# Database Column Name Inconsistency Issue

## Problem Description

We've identified inconsistencies in the column naming between the SQL database, TypeScript interfaces, and Prisma schema for the `events` table. These inconsistencies are causing runtime errors when the application tries to access fields that don't exist.

## Current State

### SQL Database Schema (final_corrected_setup.sql)
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    club_id VARCHAR(50) REFERENCES clubs(id),
    created_by UUID REFERENCES users(id),
    event_date DATE NOT NULL,
    event_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    max_attendees INTEGER,
    status VARCHAR(50) DEFAULT 'upcoming',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript Interface (src/lib/database.ts)
The TypeScript interface has been updated from:
```typescript
export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  club_id: string;
  created_by: string;
  max_attendees?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: Date;
  // ...
}
```

To:
```typescript
export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: Date;
  event_time: string;
  location: string;
  club_id: string;
  created_by: string;
  max_attendees?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: Date;
  // ...
}
```

### Prisma Schema (prisma/schema.prisma)
However, the Prisma schema uses different field names:
```prisma
model Event {
  id          String   @id @default(cuid())
  title       String
  description String
  location    String?
  startDate   DateTime
  endDate     DateTime?
  authorId    String
  clubId      String?
  isGlobal    Boolean  @default(false)
  maxAttendees Int?
  // ...
}
```

### Frontend Components
Frontend components are still using the old field names:
```typescript
const [newEvent, setNewEvent] = useState({
  title: "",
  description: "",
  date: "", // Should be event_date
  time: "", // Should be event_time
  location: "",
});
```

## Issues Caused

1. SQL queries fail with errors like "column 'date' does not exist"
2. TypeScript compile errors when trying to access non-existent fields
3. Data mapping issues between the API, database, and frontend

## Actions Taken

1. Updated SQL queries in API routes to use `event_date` and `event_time`
2. Updated the TypeScript interface in `database.ts`
3. Fixed the `createEvent` function parameters

## Recommended Actions

To fully resolve this inconsistency, we need to:

1. **Option 1: Update all frontend components**
   - Update all frontend components to use `event_date` and `event_time` instead of `date` and `time`
   - Update the Prisma schema to match the SQL schema 
   - Pros: Matches existing database schema
   - Cons: Requires changes to many frontend files

2. **Option 2: Use mapping in the API layer**
   - Keep the frontend using `date` and `time`
   - Add mapping in the API layer to translate between field names
   - Pros: Minimal frontend changes
   - Cons: Adds complexity to the API layer

## Decision

We've initially implemented Option 1 by updating:
- The TypeScript interface to match the database schema
- SQL queries in API routes
- The event creation API

The following files still need to be updated:
- Frontend components in `/src/app/club-management/page.tsx` 
- Other components that use `event.date` and `event.time`

## Long-term Solution

Consider standardizing naming conventions across the codebase to avoid similar issues in the future:
1. Use consistent naming patterns across database schemas, TypeScript interfaces, and Prisma models
2. Add data transformation layers where necessary to maintain backward compatibility
3. Implement a comprehensive test suite to catch field mapping issues early
