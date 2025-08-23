# Zenith Development Guidelines

## 🔐 Authentication & Security Standards

### MANDATORY: Use Unified Authentication System

**All API routes MUST use the unified authentication system. Manual JWT verification is PROHIBITED.**

#### ✅ Correct Implementation:
```typescript
import { verifyAuth } from "@/lib/auth-unified";

export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }
  
  const userId = authResult.user!.id;
  // Continue with authenticated logic...
}
```

#### ❌ NEVER Use Manual JWT:
```typescript
// PROHIBITED - DO NOT USE
import jwt from 'jsonwebtoken';

const authHeader = request.headers.get("Authorization");
const token = authHeader.substring(7);
const decoded = jwt.verify(token, JWT_SECRET);
```

### Authentication Security Checklist:
- [ ] Import `verifyAuth` from `@/lib/auth-unified`
- [ ] Call `verifyAuth(request)` at the start of protected routes
- [ ] Check `authResult.success` before proceeding
- [ ] Use `authResult.user!.id` for user identification
- [ ] Return 401 with consistent error format on auth failure
- [ ] Remove any manual JWT verification code
- [ ] Remove unused JWT imports and dependencies

## 📊 Database Schema Validation

### MANDATORY: Validate Against schema.sql

**All database operations MUST be validated against the canonical schema in `schema.sql`.**

#### Schema Validation Process:
1. **Check Table Structure**: Verify table exists in `schema.sql`
2. **Validate Column Names**: Ensure all columns match schema exactly
3. **Verify Data Types**: Confirm PostgreSQL data types are correct
4. **Check Constraints**: Validate foreign keys, unique constraints, etc.
5. **Review Indexes**: Ensure proper indexing for performance

#### Required Schema Validation Steps:
```bash
# Before implementing any database operation:
1. grep -n "table_name" schema.sql
2. Review column definitions and constraints
3. Verify foreign key relationships
4. Check for any recent schema updates
```

#### Database Query Standards:
```typescript
// ✅ Correct: Use exact schema column names
const result = await db.query(`
  SELECT 
    id,
    name,
    created_at,
    updated_at
  FROM users 
  WHERE deleted_at IS NULL
`, []);

// ❌ Incorrect: Using non-existent columns
const result = await db.query(`
  SELECT user_name, creation_date FROM users
`);
```

## 🔍 Pre-Development Checklist

### Before Starting Any Feature:

#### Authentication Verification:
- [ ] Confirm route requires authentication
- [ ] Import `verifyAuth` from unified auth system
- [ ] Implement proper error handling for auth failures
- [ ] Test authentication flow with valid/invalid tokens

#### Database Schema Validation:
- [ ] Open and review `schema.sql`
- [ ] Verify target table structure
- [ ] Confirm column names and data types
- [ ] Check foreign key relationships
- [ ] Validate constraints and indexes

#### Code Quality Standards:
- [ ] Use TypeScript with proper type definitions
- [ ] Implement proper error handling
- [ ] Add appropriate logging for debugging
- [ ] Follow consistent response patterns
- [ ] Add input validation and sanitization

## 🛠 Development Workflow

### 1. Schema-First Development:
1. Review `schema.sql` for relevant tables
2. Understand relationships and constraints
3. Plan queries based on actual schema structure
4. Validate column names and data types

### 2. Authentication-First Security:
1. Implement unified auth at route entry point
2. Extract user information from auth result
3. Apply role-based permissions if needed
4. Handle authentication failures gracefully

### 3. Implementation Standards:
1. Use exact schema column names
2. Implement proper SQL parameter binding
3. Add comprehensive error handling
4. Include audit logging for sensitive operations
5. Test with realistic data scenarios

## 📝 Code Examples

### Complete Route Implementation Template:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import { verifyAuth } from "@/lib/auth-unified";

export async function POST(request: NextRequest) {
  // 1. Authenticate user
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = authResult.user!.id;

  try {
    // 2. Parse and validate request body
    const body = await request.json();
    // Add validation logic here

    // 3. Database operation using schema-validated query
    const result = await db.query(`
      INSERT INTO table_name (column1, column2, user_id, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING id, column1, column2, created_at
    `, [body.value1, body.value2, userId]);

    // 4. Return success response
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## 🚫 Common Anti-Patterns to Avoid

### Authentication Anti-Patterns:
- Manual JWT verification in business logic routes
- Inconsistent error response formats
- Missing authentication on protected routes
- Hardcoded JWT secrets in route files

### Database Anti-Patterns:
- Using column names not in schema.sql
- Ignoring foreign key constraints
- Missing input validation and SQL injection protection
- Not using parameterized queries

### General Anti-Patterns:
- Incomplete error handling
- Missing TypeScript type definitions
- Inconsistent response formats
- Lack of audit logging for sensitive operations

## 🔄 Migration and Updates

### When Updating Authentication:
1. Never modify individual routes manually
2. Update the unified auth system centrally
3. Test authentication across all affected routes
4. Verify backward compatibility

### When Updating Schema:
1. Update `schema.sql` first
2. Review all affected database queries
3. Update TypeScript interfaces accordingly
4. Test with realistic data scenarios
5. Document breaking changes

## 📚 Reference Files

### Key Files to Consult:
- `schema.sql` - Canonical database schema
- `src/lib/auth-unified.ts` - Unified authentication system
- `src/lib/database.ts` - Database connection and utilities
- `DEVELOPMENT_GUIDELINES.md` - This document

### Before Making Changes:
1. Review relevant sections of this guide
2. Check schema.sql for database structure
3. Verify unified auth implementation
4. Test authentication and database operations
5. Validate against existing patterns

---

**Remember: Security and schema compliance are non-negotiable. Always validate against these standards before implementing any feature.**
