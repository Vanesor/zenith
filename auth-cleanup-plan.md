# Auth System Cleanup Analysis

## Current State
- Main auth system: `auth-unified.ts` (custom JWT-based auth)
- Legacy system: NextAuth (still partially present)
- Mixed usage across the codebase

## Files to Clean Up

### 1. Potentially Removable NextAuth Files
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth handler (check if used)
- `src/lib/auth-options.ts` - NextAuth configuration (if NextAuth removed)

### 2. Legacy Pages Using NextAuth (Need Updating)
- `src/app/register/page.tsx` - Uses `signIn` from next-auth/react
- `src/app/set-password/page.tsx` - Uses `useSession` from next-auth/react  
- `src/app/onboarding/page.tsx` - Uses `useSession` from next-auth/react
- `src/app/login/page_new.tsx` - Uses `signIn` from next-auth/react
- `src/app/login/page.tsx` - Uses `signIn` from next-auth/react

### 3. API Routes Still Using Manual JWT (Convert to verifyAuth)
- `src/app/api/projects/route.ts` ✅ PARTIALLY DONE
- `src/app/api/profile/upload-avatar/route.ts`
- `src/app/api/images/[imageId]/route.ts`
- `src/app/api/images/upload/route.ts`
- `src/app/api/events/[id]/route.ts`
- `src/app/api/posts/[postId]/like/route.ts`
- `src/app/api/posts/[postId]/comments/route.ts`
- `src/app/api/events/upload-image/route.ts`
- `src/app/api/events/permissions/route.ts`
- `src/app/api/posts/[postId]/bookmark/route.ts`
- `src/app/api/projects/[id]/tasks/route.ts` ✅ STARTED
- `src/app/api/events/[id]/join/route.ts`
- `src/app/api/projects/[id]/invitable-users/route.ts` ✅ STARTED
- `src/app/api/projects/[id]/tasks/[taskId]/route.ts` ✅ STARTED
- `src/app/api/dashboard/route.ts` (check if already using verifyAuth)
- `src/app/api/tasks/[id]/assign/route.ts` ✅ STARTED

### 4. Utility Files to Keep (Core Auth System)
- `src/lib/auth-unified.ts` - KEEP (main auth system)
- `src/lib/authUtils.ts` - KEEP (updated client-side utils)
- `src/contexts/AuthContext.tsx` - KEEP (main auth context)
- `src/contexts/AuthModalContext.tsx` - KEEP (auth modal state)
- `src/hooks/useAuthenticatedFetch.ts` - KEEP (new auth hook)

### 5. Components to Keep (Core Auth UI)
- `src/components/GlobalAuthModal.tsx` - KEEP (main auth UI)
- `src/components/GlobalAuthGuard.tsx` - KEEP (route protection)
- `src/components/AuthButton.tsx` - KEEP (auth-aware buttons)
- `src/components/ProtectedContent.tsx` - KEEP (conditional content)

## Cleanup Strategy
1. First, convert all API routes to use unified auth system
2. Update pages that still use NextAuth to use custom auth
3. Remove NextAuth dependencies if no longer needed
4. Clean up duplicate auth files
5. Update package.json dependencies

## Progress
- ✅ Core unified auth system implemented
- ✅ Client-side auth utilities created
- ✅ Auth context and guards implemented
- 🔄 API routes conversion in progress
- ⚠️ Legacy pages need updating
- ❌ NextAuth removal pending
