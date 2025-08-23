# Zenith Quick Reference Card

## 🚀 INSTANT DEVELOPER CHECKLIST

### ⚡ BEFORE ANY CODE CHANGES:

```bash
# 1. Check unified auth system
cat src/lib/auth-unified.ts

# 2. Validate database schema  
grep -A 10 "CREATE TABLE" schema.sql | grep "table_name"

# 3. Review existing auth patterns
grep -r "verifyAuth" src/app/api/ | head -5
```

### 🔐 AUTHENTICATION - COPY/PASTE TEMPLATE:

```typescript
import { verifyAuth } from "@/lib/auth-unified";

export async function METHOD_NAME(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json(
      { error: authResult.error || "Unauthorized" },
      { status: 401 }
    );
  }
  const userId = authResult.user!.id;
  // Your code here...
}
```

### 📊 DATABASE - VALIDATION CHECKLIST:

- [ ] Table exists in `schema.sql`
- [ ] Column names match schema exactly
- [ ] Data types are PostgreSQL compatible
- [ ] Foreign keys validated
- [ ] Constraints respected

### 🚫 NEVER DO:
- `jwt.verify()` in business logic
- Manual `Authorization` header parsing
- Unvalidated database column names
- Missing auth on protected routes

### ✅ ALWAYS DO:
- Use `verifyAuth` for authentication
- Check `schema.sql` before database operations
- Implement proper error handling
- Use parameterized queries
- Return consistent response formats

---
**Compliance with these standards is MANDATORY for all development work.**
