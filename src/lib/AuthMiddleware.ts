import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { SessionManager } from "./SessionManager";
import { CacheManager, CacheKeys } from "./CacheManager";
import { db, executeRawSQL, queryRawSQL } from "./database-service";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
    club_id?: string | null;
  };
}

async function checkTrustedDevice(userId: string, request: NextRequest): Promise<boolean> {
  const trustedDeviceId = request.cookies.get('zenith-trusted-device')?.value;
  if (!trustedDeviceId) return false;
  
  try {
    // Use Prisma directly to avoid type casting issues with raw queries    
    try {
      const device = await db.trusted_devices.findFirst({
        where: {
          user_id: userId,
          device_identifier: trustedDeviceId,
          expires_at: {
            gt: new Date()
          }
        }
      });
      
      return !!device;
    } catch (prismaError) {
      console.error("Error in checkTrustedDevice with Prisma:", prismaError);
      return false;
    }
  } catch (error) {
    console.error('Error checking trusted device:', error);
    return false;
  }
}

export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
    club_id?: string | null;
  };
  error?: string;
  expired?: boolean;
  expiredAt?: Date;
  trustedDevice?: boolean;
  newToken?: string; // Add this field for token refresh
}> {
  try {
    // Try to get token from Authorization header first (API calls)
    const authHeader = request.headers.get("authorization");
    let token = authHeader?.replace("Bearer ", "");

    // If no Authorization header, try to get token from cookies (browser requests)
    if (!token) {
      token = request.cookies.get("zenith-token")?.value;
    }

    // Additional validation - check if token looks like a JWT
    if (token) {
      // Check if token has proper JWT format (3 parts separated by dots)
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        console.error("Token format invalid - not a proper JWT");
        return { success: false, error: "Invalid token format" };
      }
      
      // Check if token is a placeholder value
      if (token === 'session-based' || token === 'null' || token === 'undefined') {
        console.error("Token is placeholder value:", token);
        return { success: false, error: "Invalid token - placeholder value" };
      }
    }

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
      
      // Specific handling for expired tokens
      if (tokenError instanceof jwt.TokenExpiredError) {
        // Try to use refresh token
        const refreshToken = request.cookies.get("zenith-refresh-token")?.value;
        if (refreshToken) {
          try {
            // Verify refresh token
            const refreshDecoded = jwt.verify(refreshToken, JWT_SECRET) as {
              userId: string;
              sessionId: string;
              type: string;
            };
            
            if (refreshDecoded.type === 'refresh') {
              // Generate a new access token
              const newAccessToken = jwt.sign({
                userId: refreshDecoded.userId,
                sessionId: refreshDecoded.sessionId,
                type: 'access'
              }, JWT_SECRET, {
                expiresIn: '24h',
                issuer: 'zenith-auth',
                audience: 'zenith-users',
              });
              
              // Store the new token and also use the decoded refresh token data
              const newUserToken = jwt.sign({
                userId: refreshDecoded.userId,
                email: '', // Will be filled in from database
                role: '',  // Will be filled in from database
                sessionId: refreshDecoded.sessionId
              }, JWT_SECRET, {
                expiresIn: '24h',
                issuer: 'zenith-auth',
                audience: 'zenith-users',
              });
              
              // Get user data to fill in email and role
              try {
                // Import UUIDUtils for proper UUID handling
                // We no longer need UUIDUtils with the new database interface
                
                // Process parameters to handle UUID types correctly
                const params = [refreshDecoded.userId];
                
                const userResult = await queryRawSQL(
                  "SELECT email, role FROM users WHERE id = $1::uuid",
                  refreshDecoded.userId
                );
                
                if (userResult.rows.length > 0) {
                  decoded = {
                    userId: refreshDecoded.userId,
                    email: userResult.rows[0].email,
                    role: userResult.rows[0].role,
                    sessionId: refreshDecoded.sessionId
                  };
                  
                  // Return both the auth info and the new token
                  return {
                    success: true,
                    user: {
                      id: refreshDecoded.userId,
                      email: userResult.rows[0].email,
                      role: userResult.rows[0].role,
                      sessionId: refreshDecoded.sessionId,
                      // club_id will be fetched later in the function
                    },
                    newToken: newUserToken
                  };
                }
              } catch (dbError) {
                console.error("Error fetching user info for token refresh:", dbError);
              }
              
              // Fallback to using just the ID info
              decoded = {
                userId: refreshDecoded.userId,
                email: '', // Will be filled in later
                role: '',  // Will be filled in later
                sessionId: refreshDecoded.sessionId
              };
            } else {
              return { 
                success: false, 
                error: "Invalid refresh token", 
                expired: true,
                expiredAt: tokenError.expiredAt 
              };
            }
          } catch (refreshError) {
            return { 
              success: false, 
              error: "Both tokens expired", 
              expired: true,
              expiredAt: tokenError.expiredAt 
            };
          }
        } else {
          return { 
            success: false, 
            error: "Token expired", 
            expired: true,
            expiredAt: tokenError.expiredAt 
          };
        }
      } else {
        return { success: false, error: "Invalid token" };
      }
    }

    try {
      // Validate session - but don't fail if session is invalid when we have a valid token
      const session = await SessionManager.validateSession(decoded.sessionId);
      if (!session) {
        // Just log warning but don't fail the request since token is valid
        console.warn(`Auth warning: Valid token but invalid session ${decoded.sessionId}`);
        // Continue anyway since token is valid
      }
    } catch (sessionError) {
      // Log the error but continue since token is valid
      console.error("Session validation error:", sessionError);
      // Don't fail due to session errors when token is valid
    }
    
    // Check if this is a trusted device
    const isTrustedDevice = await checkTrustedDevice(decoded.userId, request);

    // Check if user data is cached
    interface UserData {
      id: string;
      email: string;
      role: string;
      club_id?: string | null;
    }
    
    let userData: UserData | null = await CacheManager.get(CacheKeys.user(decoded.userId));
    
    if (!userData) {
      // If not cached, we could fetch from database here
      // For now, use the token data
      userData = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    // Try to get club_id from database
    let club_id = null;
    if (userData && userData.club_id) {
      club_id = userData.club_id;
    } else {
      // Try to fetch from database
      try {
        // Import UUIDUtils for proper UUID handling
        // We no longer need UUIDUtils with the new database interface
        
        try {
          // Process parameters to handle UUID types correctly
          const params = [decoded.userId];
          
          const userResult = await queryRawSQL(
            "SELECT club_id FROM users WHERE id = $1::uuid",
            decoded.userId
          );
          if (userResult && userResult.rows && userResult.rows.length > 0) {
            club_id = userResult.rows[0].club_id;
          }
        } catch (queryError) {
          console.error("Error in raw query for user club_id:", queryError);
          
          // Fallback to standard Prisma
          const user = await db.users.findUnique({
            where: { id: decoded.userId },
            select: { club_id: true }
          });
          
          if (user) {
            club_id = user.club_id;
          }
        }
      } catch (dbError) {
        console.error("Error fetching user club_id:", dbError);
      }
    }

    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
        club_id: club_id
      },
      trustedDevice: isTrustedDevice
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
