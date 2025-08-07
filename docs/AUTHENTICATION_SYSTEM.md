# Zenith Authentication System Documentation

## Overview

The Zenith platform implements a robust JWT-based authentication system with token refresh mechanisms, session validation, and automatic redirection for expired tokens. This document provides an overview of the authentication system and explains how token expiration is handled.

## Authentication Components

### 1. TokenManager

**Location:** `src/lib/TokenManager.ts`

The TokenManager is a singleton class responsible for managing JWT tokens. It provides methods for:

- Getting and setting access/refresh tokens in localStorage
- Checking token expiration status
- Refreshing tokens automatically before they expire
- Making authenticated API requests with automatic token refresh
- Redirecting users to the login page on authentication failures

```typescript
// Example usage
const tokenManager = TokenManager.getInstance();
const accessToken = await tokenManager.getValidAccessToken();

// Authenticated fetch with automatic token refresh
const response = await tokenManager.authenticatedFetch('/api/protected-endpoint');
```

### 2. AuthMiddleware

**Location:** `src/lib/AuthMiddleware.ts`

Server-side middleware for validating JWT tokens in API routes. It:

- Extracts JWT tokens from Authorization headers
- Verifies token signatures
- Checks token expiration
- Validates user sessions
- Returns detailed error information for expired tokens

```typescript
// Example usage in an API route
export async function GET(request: NextRequest) {
  const authResult = await verifyAuth(request);
  if (!authResult.success) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }
  // Continue with authenticated API logic
}
```

### 3. AuthContext/useAuth Hook

**Location:** `src/contexts/AuthContext.tsx`

React context provider and hook for client-side authentication state management. It:

- Tracks user login state
- Handles login/logout operations
- Validates and refreshes tokens automatically
- Redirects to login page when sessions expire

```tsx
// Example usage in a component
const { user, isLoading, login, logout } = useAuth();

if (isLoading) return <Loading />;
if (!user) return <Redirect to="/login" />;
```

### 4. SessionExpirationHandler

**Location:** `src/components/SessionExpirationHandler.tsx`

Component that wraps authenticated routes to provide automatic:

- Periodic token expiration checks
- Proactive token refreshing
- User notifications about session status
- Redirection to login on expired sessions

## Token Expiration Flow

1. **Regular validation**: Tokens are validated periodically to detect upcoming expiration
2. **Proactive refreshing**: Tokens within 5 minutes of expiry are automatically refreshed
3. **Notifications**: Users receive toast messages about session status
4. **Expired tokens**: When a token expires:
   - User receives an error message
   - They're redirected to login with `?expired=true` parameter
   - The login page shows a session expired message

## Security Features

- JWT signatures are validated on every request
- Refresh tokens are used for obtaining new access tokens
- Sessions are validated against a server-side session store
- Short-lived access tokens (1 hour) reduce the risk of token theft
- Automatic logout on any authentication failures

## API Authentication Flow

1. Client makes request with JWT token in Authorization header
2. Server validates the token using AuthMiddleware
3. If valid, the request proceeds
4. If expired, the server returns 401 with `expired: true`
5. Client attempts to refresh the token:
   - If successful, the original request is retried
   - If refresh fails, user is redirected to login

## Local Token Storage

Tokens are stored in localStorage for persistence across browser sessions:

- `zenith-token`: JWT access token
- `zenith-refresh-token`: Refresh token for obtaining new access tokens
- `zenith-user`: User profile information

## Additional Security Recommendations

1. Implement CSRF protection for token endpoints
2. Add rate limiting to authentication endpoints
3. Consider HTTP-only cookies for sensitive environments
4. Add IP-based session validation for high-security areas
