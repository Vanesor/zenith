# Zenith Authentication System Security Audit & Fix Plan

## Critical Issues Identified

### 1. **SECURITY CRITICAL: Inconsistent Authentication Implementation**

**Issue**: Multiple API routes have individual `verifyAuth` functions instead of using the centralized `AuthMiddleware.ts`, creating security inconsistencies.

**Files Affected**:
- `/app/api/assignments/[id]/submit/route.ts` - Basic JWT verification only
- `/app/api/assignments/questions/route.ts` - Basic JWT verification only  
- `/app/api/assignments/[id]/route.ts` - Basic JWT verification only
- `/app/api/assignments/[id]/start/route.ts` - Basic JWT verification only
- `/app/api/assignments/[id]/attempts/route.ts` - Basic JWT verification only
- `/app/api/assignments/[id]/violations/route.ts` - Basic JWT verification only
- `/app/api/assignments/[id]/results/route.ts` - Basic JWT verification only
- `/app/api/user/submissions/route.ts` - Basic JWT verification only
- And 10+ other API routes

**Security Risk**: HIGH - Basic verifyAuth functions don't validate sessions, check token expiration properly, or handle caching. This leaves the system vulnerable to:
- Session hijacking (no session validation)
- Expired token abuse (minimal expiration checking)
- Performance issues (no caching layer)

**Proper Implementation**: Only 2 files use the secure `AuthMiddleware`:
- `/app/api/auth/validate/route.ts` ✅
- `/app/api/admin/system/route.ts` ✅

### 2. **SECURITY CRITICAL: Token Expiration Inconsistencies**

**Issue**: Different token lifespans across the system:
- Access tokens: 15 minutes (login) vs 24 hours (auth.ts) vs 1 hour (docs)
- Refresh tokens: 7 days vs 30 days
- Session validation: 7 days vs different patterns

**Security Risk**: HIGH - Inconsistent token lifespans create security windows

### 3. **SECURITY ISSUE: JWT Secret Fallback Pattern**

**Issue**: Every file has fallback `|| "your-secret-key"` which is extremely insecure for production.

**Code Pattern Found in 20+ files**:
```typescript
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
```

**Security Risk**: MEDIUM - If env var fails to load, system uses hardcoded weak secret

### 4. **Architecture Issue: Multiple Authentication Patterns**

**Current System Has**:
1. `AuthMiddleware.ts` - Comprehensive security (session validation, caching, proper error handling)
2. Individual `verifyAuth` functions - Basic JWT only 
3. `AuthContext.tsx` - Mixed localStorage + session validation
4. `TokenManager.ts` - Client-side token management
5. `SessionManager.ts` - Server-side session tracking
6. `auth.ts` - Legacy authentication utilities

**Issue**: Too many overlapping systems with different security levels

### 5. **Client-Side Security Issues**

**TokenManager Issues**:
- Stores tokens in localStorage (vulnerable to XSS)
- Token expiration check allows 5-minute window (too long)
- Multiple concurrent refresh attempts not properly handled

**AuthContext Issues**:
- Falls back to localStorage after session validation fails
- Mixed authentication sources (session vs token vs localStorage)

### 6. **Session Management Issues**

**SessionManager**:
- In-memory session storage (lost on restart)
- Database sync issues between memory and Supabase
- No proper session cleanup on security events

## Fix Plan - Priority Order

### Phase 1: IMMEDIATE SECURITY FIXES (Critical)

#### 1.1 Replace All Individual verifyAuth with Centralized AuthMiddleware

**Action**: Replace 11+ individual verifyAuth functions with centralized AuthMiddleware

**Files to Fix**:
```typescript
// BEFORE (insecure):
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { authenticated: false, userId: null };
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return { authenticated: true, userId: decoded.userId };
  } catch (error) {
    return { authenticated: false, userId: null };
  }
}

// AFTER (secure):
import { verifyAuth } from "@/lib/AuthMiddleware";

export async function POST(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  const userId = authResult.user!.id;
  // ... rest of implementation
}
```

#### 1.2 Remove Insecure JWT Secret Fallback

**Action**: Remove `|| "your-secret-key"` fallbacks and add proper environment validation

**Solution**:
```typescript
// BEFORE (insecure):
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// AFTER (secure):
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
```

#### 1.3 Standardize Token Lifespans

**Action**: Unify token expiration across the system:

**Standard Configuration**:
```typescript
// Access Tokens: 15 minutes (current login.ts pattern)
const ACCESS_TOKEN_EXPIRY = "15m";

// Refresh Tokens: 7 days (secure default)  
const REFRESH_TOKEN_EXPIRY = "7d";

// Sessions: 7 days (match refresh tokens)
const SESSION_EXPIRY_DAYS = 7;
```

### Phase 2: ARCHITECTURE CONSOLIDATION (High Priority)

#### 2.1 Centralize Authentication Configuration

**Create**: `/src/lib/AuthConfig.ts`
```typescript
export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRY: "15m",
  REFRESH_TOKEN_EXPIRY: "7d", 
  SESSION_EXPIRY_DAYS: 7,
  TOKEN_REFRESH_THRESHOLD: 300, // 5 minutes in seconds
  MAX_SESSIONS_PER_USER: 5,
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET
} as const;

// Validate required environment variables
if (!AUTH_CONFIG.JWT_SECRET || !AUTH_CONFIG.REFRESH_SECRET) {
  throw new Error("Required authentication environment variables missing");
}
```

#### 2.2 Enhance AuthMiddleware for Universal Use

**Action**: Make AuthMiddleware the single source of truth for all API authentication

### Phase 3: CLIENT-SIDE SECURITY IMPROVEMENTS (Medium Priority)

#### 3.1 Move to HTTP-Only Cookies

**Action**: Replace localStorage tokens with secure HTTP-only cookies for enhanced XSS protection

#### 3.2 Improve Session Persistence  

**Action**: Enhance SessionManager with proper database synchronization and cleanup

### Phase 4: MONITORING & AUDITING (Low Priority)

#### 4.1 Add Authentication Logging
#### 4.2 Implement Security Event Tracking
#### 4.3 Add Rate Limiting to Auth Endpoints

## Files Requiring Immediate Fixes (Phase 1)

### Critical Files:
1. All assignment API routes (11 files)
2. Chat API routes (5 files) 
3. User/posts API routes (4 files)
4. Events/announcements API routes (4 files)

### Total Estimated Impact:
- **24+ API routes** need authentication standardization
- **Security Level**: Currently MEDIUM, Target HIGH
- **Estimated Time**: 2-3 hours for Phase 1 critical fixes

## Immediate Action Required

The authentication system has significant security vulnerabilities that need immediate attention. The mixed authentication patterns and basic JWT-only verification in critical routes like assignment submissions create serious security risks.

**Recommendation**: Implement Phase 1 fixes immediately, especially standardizing all API routes to use AuthMiddleware instead of individual verifyAuth functions.
- **Student**: `student1@zenith.edu`

### All Available Accounts:

**Ascend Club (Coding):**

- Coordinator: `alex.chen.coord@zenith.edu`
- Co-Coordinator: `sarah.johnson.cocoord@zenith.edu`
- Secretary: `mike.davis.sec@zenith.edu`
- Media Head: `emily.zhang.media@zenith.edu`

**Aster Club (Soft Skills):**

- Coordinator: `jessica.liu.coord@zenith.edu`
- Co-Coordinator: `david.park.cocoord@zenith.edu`
- Secretary: `rachel.green.sec@zenith.edu`
- Media Head: `tom.wilson.media@zenith.edu`

**Achievers Club (Higher Studies):**

- Coordinator: `priya.sharma.coord@zenith.edu`
- Co-Coordinator: `kevin.lee.cocoord@zenith.edu`
- Secretary: `lisa.wang.sec@zenith.edu`
- Media Head: `jake.thompson.media@zenith.edu`

**Altogether Club (Holistic Growth):**

- Coordinator: `maya.patel.coord@zenith.edu`
- Co-Coordinator: `chris.martinez.cocoord@zenith.edu`
- Secretary: `anna.brown.sec@zenith.edu`
- Media Head: `sam.rodriguez.media@zenith.edu`

**Zenith Committee:**

- President: `robert.president@zenith.edu`
- Vice President: `maria.vp@zenith.edu`
- Innovation Head: `james.innovation@zenith.edu`
- Treasurer: `sophia.treasurer@zenith.edu`
- Outreach: `daniel.outreach@zenith.edu`

**Students:**

- `student1@zenith.edu` - `student5@zenith.edu`

## 🔧 Files Modified

1. **`database/00_setup_all.sql`** - Complete database setup with proper bcrypt hashes
2. **`src/app/api/auth/login/route.ts`** - Fixed to use raw SQL queries
3. **`src/app/api/auth/register/route.ts`** - Fixed to work with SQL schema
4. **`database/auth_validation.sql`** - SQL queries for authentication validation
5. **`tests/login-test.js`** - Test script for validating login credentials

## 🚀 Ready to Use

The project is now fully configured and ready for development. All authentication errors have been resolved, and the database schema is consistent. You can now:

1. Run the database setup
2. Start the development server
3. Test login with any provided credentials
4. Begin development on your forum features

**No additional Prisma configuration needed - just `npm run dev`!**
