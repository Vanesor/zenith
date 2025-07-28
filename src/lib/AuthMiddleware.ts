import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SessionManager } from "./SessionManager";
import { CacheManager, CacheKeys } from "./CacheManager";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
}

export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
  };
  error?: string;
}> {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      console.log("Auth failed: No token provided");
      return { success: false, error: "No token provided" };
    }

    console.log(`Verifying auth token: ${token.substring(0, 10)}...`);
    // Production verification logic
    let decoded;
    try {
      // Verify JWT token
      decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
        sessionId: string;
      };
    } catch (tokenError) {
      console.error("Token verification failed:", tokenError);
      return { success: false, error: "Invalid token" };
    }

    // Validate session
    const session = await SessionManager.validateSession(decoded.sessionId);
    if (!session) {
      return { success: false, error: "Session expired or invalid" };
    }

    // Check if user data is cached
    let userData = await CacheManager.get(CacheKeys.user(decoded.userId));
    
    if (!userData) {
      // If not cached, we could fetch from database here
      // For now, use the token data
      userData = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
      }
    };

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return { success: false, error: "Token expired" };
    } else if (error instanceof jwt.JsonWebTokenError) {
      return { success: false, error: "Invalid token" };
    } else {
      console.error("Auth verification error:", error);
      return { success: false, error: "Authentication failed" };
    }
  }
}

// Middleware wrapper for API routes
export function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    requiredRole?: string[];
    allowedRoles?: string[];
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await verifyAuth(request);

    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    // Check role-based permissions
    if (options.requiredRole && options.requiredRole.length > 0) {
      if (!options.requiredRole.includes(authResult.user!.role)) {
        return NextResponse.json(
          { error: "Insufficient permissions" },
          { status: 403 }
        );
      }
    }

    if (options.allowedRoles && options.allowedRoles.length > 0) {
      if (!options.allowedRoles.includes(authResult.user!.role)) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Add user to request object
    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = authResult.user;

    return handler(authenticatedRequest);
  };
}

// Role-based access control helpers
export const requireManagement = withAuth;
export const requireAuth = withAuth;

export function requireRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, { requiredRole: roles });
}

export function allowRoles(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, { allowedRoles: roles });
}

// Management roles
export const MANAGEMENT_ROLES = [
  "coordinator",
  "co_coordinator", 
  "secretary",
  "media",
  "president",
  "vice_president",
  "innovation_head",
  "treasurer",
  "outreach"
];

export const requireManagementRole = (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
  withAuth(handler, { allowedRoles: MANAGEMENT_ROLES });

// Helper to extract user ID from request
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authResult = await verifyAuth(request);
  return authResult.success ? authResult.user!.id : null;
}

// Helper to check if user has specific permission
export async function hasPermission(
  request: NextRequest, 
  permission: 'read' | 'write' | 'delete' | 'manage',
  resource?: string
): Promise<boolean> {
  const authResult = await verifyAuth(request);
  
  if (!authResult.success) {
    return false;
  }

  const userRole = authResult.user!.role;

  // Admin and management roles have all permissions
  if (MANAGEMENT_ROLES.includes(userRole)) {
    return true;
  }

  // Students have limited permissions
  if (userRole === 'student') {
    switch (permission) {
      case 'read':
        return true;
      case 'write':
        return resource !== 'announcements' && resource !== 'events';
      case 'delete':
        return false; // Students can't delete anything by default
      case 'manage':
        return false;
      default:
        return false;
    }
  }

  return false;
}

// Session activity tracker
export async function trackActivity(request: NextRequest): Promise<void> {
  const authResult = await verifyAuth(request);
  
  if (authResult.success) {
    // Update session activity
    await SessionManager.validateSession(authResult.user!.sessionId);
    
    // Track API usage for analytics
    const endpoint = new URL(request.url).pathname;
    const activityKey = `activity:${authResult.user!.id}:${endpoint}`;
    await CacheManager.increment(activityKey);
  }
}
