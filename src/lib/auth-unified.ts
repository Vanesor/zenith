/**
 * Unified Authentication System for Zenith
 * Consolidated from multiple auth files for optimal performance
 * Includes: JWT handling, session management, user operations, middleware
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import DatabaseClient from './database';
import crypto from 'crypto';

const db = DatabaseClient;

// Environment variables - fail fast if not set in production
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required JWT secrets in production environment');
  }
  console.warn('⚠️  JWT secrets not set - this is only acceptable in development');
}

// Helper functions to ensure secrets are defined
const getJwtSecret = (): string => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET not configured');
  return JWT_SECRET;
};

const getRefreshSecret = (): string => {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET not configured');
  return JWT_REFRESH_SECRET;
};

// ==================== INTERFACES ====================

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  club_id?: string;
  avatar?: string;
  profile_image_url?: string;
  email_verified?: boolean;
}

export interface UserWithPassword extends User {
  password_hash: string;
  email_verified?: boolean;
  totp_enabled?: boolean;
  has_password?: boolean;
  oauth_provider?: string;
  oauth_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
  requiresTwoFactor?: boolean;
  sessionId?: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
    club_id?: string | null;
  };
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

// ==================== PASSWORD UTILITIES ====================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// ==================== JWT UTILITIES ====================

export function generateToken(payload: object, expiresIn: string = '24h'): string {
  return jwt.sign(payload, getJwtSecret(), { 
    expiresIn,
    issuer: 'zenith-auth',
    audience: 'zenith-users'
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: object): string {
  return jwt.sign(payload, getRefreshSecret(), { 
    expiresIn: '7d',
    issuer: 'zenith-auth',
    audience: 'zenith-users'
  });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): any {
  try {
    return jwt.verify(token, getRefreshSecret());
  } catch (error) {
    return null;
  }
}

// ==================== COOKIE UTILITIES ====================

export function setAuthCookie(token: string, rememberMe: boolean = false): string {
  const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // 7 days or 1 day
  return `zenith-token=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure`;
}

export function clearAuthCookie(): string {
  return 'zenith-token=; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure';
}

// ==================== OAUTH PASSWORD UTILITIES ====================

/**
 * Generate a deterministic password hash for OAuth users
 * This ensures OAuth users have a valid password_hash in the database
 * The password is generated using email + salt and then hashed
 */
export async function generateOAuthPasswordHash(email: string, provider: string): Promise<string> {
  const oauthSalt = process.env.OAUTH_PASSWORD_SALT || 'default_oauth_salt_zenith_2025';
  
  // Create a deterministic password using email, provider, and salt
  const deterministic_password = crypto
    .createHash('sha256')
    .update(`${email}_${provider}_${oauthSalt}`)
    .digest('hex');
  
  // Hash the deterministic password using bcrypt (same as regular passwords)
  const passwordHash = await bcrypt.hash(deterministic_password, 12);
  return passwordHash;
}

/**
 * Verify OAuth user password for cases where they might need to authenticate
 * This allows OAuth users to use their deterministic password if needed
 */
export async function verifyOAuthPassword(email: string, provider: string, hashedPassword: string): Promise<boolean> {
  const oauthSalt = process.env.OAUTH_PASSWORD_SALT || 'default_oauth_salt_zenith_2025';
  
  // Recreate the deterministic password
  const deterministic_password = crypto
    .createHash('sha256')
    .update(`${email}_${provider}_${oauthSalt}`)
    .digest('hex');
  
  // Verify against the stored hash
  return await bcrypt.compare(deterministic_password, hashedPassword);
}

// ==================== USER OPERATIONS ====================

export async function createUser(userData: {
  email: string;
  password: string;
  name: string;
  role?: string;
  club_id?: string;
  phone?: string;
  dateOfBirth?: string;
}): Promise<User | null> {
  try {
    const hashedPassword = await hashPassword(userData.password);

    const result = await db.query(
      `INSERT INTO users (email, password_hash, name, role, club_id, phone, date_of_birth, email_verified, has_password, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, email, name, role, club_id, phone, date_of_birth`,
      [
        userData.email.toLowerCase(),
        hashedPassword,
        userData.name,
        userData.role || 'student',
        userData.club_id || null,
        userData.phone || null,
        userData.dateOfBirth || null,
        false,
        true
      ]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id || undefined
    };

  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, club_id, avatar, profile_image_url FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id || undefined,
      avatar: user.avatar,
      profile_image_url: user.profile_image_url
    };

  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

export async function getUserByEmail(email: string): Promise<UserWithPassword | null> {
  try {
    const result = await db.query(
      `SELECT id, email, name, role, club_id, password_hash, email_verified, totp_enabled, has_password, oauth_provider, oauth_id, created_at, updated_at, avatar, profile_image_url
       FROM users WHERE email = $1`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) return null;

    const user = result.rows[0];
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id,
      avatar: user.avatar,
      profile_image_url: user.profile_image_url,
      password_hash: user.password_hash,
      email_verified: user.email_verified,
      totp_enabled: user.totp_enabled,
      has_password: user.has_password,
      oauth_provider: user.oauth_provider,
      oauth_id: user.oauth_id,
      created_at: user.created_at,
      updated_at: user.updated_at
    };

  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  try {
    const user = await db.users.update({
      where: { id: userId },
      data: {
        ...updates,
        updated_at: new Date()
      }
    });

    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id || undefined
    };

  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

export async function updatePassword(userId: string, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await hashPassword(newPassword);

    await db.users.update({
      where: { id: userId },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date()
      }
    });

    return true;
  } catch (error) {
    console.error('Error updating password:', error);
    return false;
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    // Use soft delete
    await db.users.update({
      where: { id: userId },
      data: { is_active: false }
    });

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

// ==================== AUTHENTICATION ====================

export async function authenticateUser(email: string, password: string): Promise<AuthResult> {
  try {
    const user = await getUserByEmail(email);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    if (!user.password_hash) {
      return {
        success: false,
        error: 'Password not set. Please use social login or reset password.',
      };
    }

    // First try regular password verification
    let isValidPassword = await verifyPassword(password, user.password_hash);
    
    // If regular password fails and user has OAuth provider, try OAuth password verification
    if (!isValidPassword && user.oauth_provider) {
      const oauthUser = await db.query(
        `SELECT oauth_provider FROM users WHERE email = $1`,
        [email]
      );
      
      if (oauthUser.rows.length > 0) {
        isValidPassword = await verifyOAuthPassword(email, oauthUser.rows[0].oauth_provider, user.password_hash);
      }
    }
    
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    // Create session
    const session = await createSession(user.id, new Date(Date.now() + 24 * 60 * 60 * 1000));
    
    if (!session) {
      return {
        success: false,
        error: 'Failed to create session',
      };
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id
    };

    const accessToken = generateToken(tokenPayload, '24h');
    const refreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
      type: 'refresh'
    });

    return {
      success: true,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        club_id: user.club_id,
        avatar: user.avatar,
        profile_image_url: user.profile_image_url,
        email_verified: user.email_verified
      },
      sessionId: session.id,
    };

  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed. Please try again.',
    };
  }
}

// ==================== SESSION MANAGEMENT ====================

export async function createSession(
  userId: string, 
  expiresAt: Date, 
  metadata?: { ip?: string; userAgent?: string }
): Promise<Session | null> {
  try {
    const sessionData = {
      user_id: userId,
      token: generateToken({ userId }, '24h'), // Generate a session token
      expires_at: expiresAt,
      ip_address: metadata?.ip,
      user_agent: metadata?.userAgent
    };

    const session = await db.createSession(sessionData);
    
    if (!session) return null;

    return {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
      created_at: session.created_at || new Date(),
      updated_at: session.updated_at || new Date(),
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      is_active: true
    };
  } catch (error) {
    console.error('Error creating session:', error);
    return null;
  }
}

export async function getSession(sessionId: string): Promise<Session | null> {
  try {
    // Use the session token to get session (our database uses token-based sessions)
    const session = await db.getSession(sessionId);
    
    if (!session) return null;

    return {
      id: session.id,
      user_id: session.user_id,
      expires_at: session.expires_at,
      created_at: session.created_at || new Date(),
      updated_at: session.updated_at || new Date(),
      ip_address: session.ip_address,
      user_agent: session.user_agent,
      is_active: true
    };
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    // Use the token to delete session
    const result = await db.deleteSession(sessionId);
    return result;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
}

export async function deleteUserSessions(userId: string): Promise<boolean> {
  try {
    // For now, we'll implement this using direct SQL since the database client doesn't have this method
    await db.query('UPDATE sessions SET is_active = false WHERE user_id = $1', [userId]);
    return true;
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    return false;
  }
}

// ==================== REQUEST UTILITIES ====================

export function getTokenFromRequest(request: NextRequest): string | null {
  // Try Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Try cookies as fallback
  const token = request.cookies.get('zenith-token')?.value;
  return token || null;
}

export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return null;
    }

    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return null;
    }

    return await getUserById(decoded.userId);

  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function getAuthUser(request: NextRequest): Promise<User | null> {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return null;

    const JWT_SECRET_ENCODED = new TextEncoder().encode(getJwtSecret());
    const { payload } = await jwtVerify(token, JWT_SECRET_ENCODED);
    if (!payload || !payload.sub) return null;

    return await getUserById(payload.sub as string);
  } catch (error) {
    console.error('Error getting auth user:', error);
    return null;
  }
}

// ==================== MIDDLEWARE & VERIFICATION ====================

export async function verifyAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
    sessionId: string;
    club_id?: string | null;
    name?: string;
    email_verified?: boolean;
    totp_enabled?: boolean;
    has_password?: boolean;
    avatar?: string | null;
    profile_image_url?: string | null;
  };
  sessionId?: string;
  error?: string;
  expired?: boolean;
  expiredAt?: Date;
  newToken?: string;
  tokenExpiresIn?: number;
  tokenExpiresAt?: Date;
  refreshToken?: string;
}> {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return { success: false, error: "No token provided" };
    }

    // Validate token format
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      return { success: false, error: "Invalid token format" };
    }

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret()) as {
        userId: string;
        email: string;
        role: string;
        sessionId: string;
        exp?: number;
        iat?: number;
      };
    } catch (tokenError) {
      if (tokenError instanceof jwt.TokenExpiredError) {
        // Try refresh token
        const refreshToken = request.cookies.get("zenith-refresh-token")?.value;
        if (refreshToken) {
          try {
            const refreshDecoded = jwt.verify(refreshToken, getRefreshSecret()) as {
              userId: string;
              sessionId: string;
              type: string;
            };
            
            if (refreshDecoded.type === 'refresh') {
              // Get user data for new token
              const user = await getUserById(refreshDecoded.userId);
              if (user) {
                const newTokenPayload = {
                  userId: user.id,
                  email: user.email,
                  role: user.role,
                  sessionId: refreshDecoded.sessionId
                };
                
                const newToken = generateToken(newTokenPayload, '24h');
                
                return {
                  success: true,
                  user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    sessionId: refreshDecoded.sessionId,
                    club_id: user.club_id,
                    avatar: user.avatar,
                    profile_image_url: user.profile_image_url
                  },
                  newToken
                };
              }
            }
          } catch (refreshError) {
            return { 
              success: false, 
              error: "Both tokens expired", 
              expired: true,
              expiredAt: tokenError.expiredAt 
            };
          }
        }
        
        return { 
          success: false, 
          error: "Token expired", 
          expired: true,
          expiredAt: tokenError.expiredAt 
        };
      } else {
        return { success: false, error: "Invalid token" };
      }
    }

    // Validate session (optional, log warning if invalid but don't fail)
    try {
      const session = await getSession(decoded.sessionId);
      if (!session) {
        console.warn(`Valid token but invalid session ${decoded.sessionId}`);
      }
    } catch (sessionError) {
      console.error("Session validation error:", sessionError);
    }

    // Get user's club_id and other data from database
    let club_id = null;
    let userName = '';
    let emailVerified = false;
    let totpEnabled = false;
    let hasPassword = true;
    let avatar = null;
    let profileImageUrl = null;
    
    try {
      const result = await db.query(
        `SELECT club_id, name, email_verified, totp_enabled, has_password, avatar, profile_image_url 
         FROM users WHERE id = $1`,
        [decoded.userId]
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        club_id = user.club_id;
        userName = user.name;
        emailVerified = user.email_verified || false;
        totpEnabled = user.totp_enabled || false;
        hasPassword = user.has_password !== false;
        avatar = user.avatar;
        profileImageUrl = user.profile_image_url;
      }
    } catch (dbError) {
      console.error("Error fetching user data:", dbError);
    }

    // Calculate token expiration info
    const tokenExpTime = decoded.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    const tokenExpiresIn = Math.max(0, Math.floor((tokenExpTime - Date.now()) / 1000));
    const tokenExpiresAt = new Date(tokenExpTime);

    return {
      success: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        sessionId: decoded.sessionId,
        club_id: club_id,
        name: userName,
        email_verified: emailVerified,
        totp_enabled: totpEnabled,
        has_password: hasPassword,
        avatar: avatar,
        profile_image_url: profileImageUrl
      },
      sessionId: decoded.sessionId,
      tokenExpiresIn,
      tokenExpiresAt
    };

  } catch (error) {
    console.error("Auth verification error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

// ==================== TOKEN REFRESH ====================

export async function refreshTokens(refreshToken: string): Promise<{
  success: boolean;
  token?: string;
  refreshToken?: string;
  user?: User;
  error?: string;
}> {
  try {
    const decoded = verifyRefreshToken(refreshToken);
    
    if (!decoded || !decoded.userId || decoded.type !== 'refresh') {
      return {
        success: false,
        error: 'Invalid refresh token'
      };
    }

    // Get user data
    const user = await getUserById(decoded.userId);
    if (!user) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Generate new tokens
    const newTokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: decoded.sessionId || 'refresh-session'
    };

    const newToken = generateToken(newTokenPayload, '24h');
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      sessionId: decoded.sessionId,
      type: 'refresh'
    });

    return {
      success: true,
      token: newToken,
      refreshToken: newRefreshToken,
      user
    };

  } catch (error) {
    console.error('Token refresh error:', error);
    return {
      success: false,
      error: 'Token refresh failed'
    };
  }
}

// ==================== MIDDLEWARE WRAPPERS ====================

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

// ==================== ROLE-BASED ACCESS CONTROL ====================

export function hasRole(user: User | null, role: string): boolean {
  return user?.role === role;
}

export function hasAnyRole(user: User | null, roles: string[]): boolean {
  return user ? roles.includes(user.role) : false;
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, 'admin');
}

export function isCoordinator(user: User | null): boolean {
  return hasRole(user, 'coordinator');
}

export function isCommitteeMember(user: User | null): boolean {
  return hasRole(user, 'committee_member');
}

export function canAccessAdminFeatures(user: User | null): boolean {
  return hasAnyRole(user, ['admin', 'coordinator', 'committee_member']);
}

export function canManageClub(user: User | null, clubId?: string): boolean {
  if (!user) return false;
  
  if (isAdmin(user)) return true;
  
  if ((isCoordinator(user) || isCommitteeMember(user)) && user.club_id === clubId) {
    return true;
  }
  
  return false;
}

// Management roles array
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

export function requireRole(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, { requiredRole: roles });
}

export function allowRoles(roles: string[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) =>
    withAuth(handler, { allowedRoles: roles });
}

// ==================== UTILITY FUNCTIONS ====================

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authResult = await verifyAuth(request);
  return authResult.success ? authResult.user!.id : null;
}

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

  if (MANAGEMENT_ROLES.includes(userRole)) {
    return true;
  }

  if (userRole === 'student') {
    switch (permission) {
      case 'read':
        return true;
      case 'write':
        return resource !== 'announcements' && resource !== 'events';
      case 'delete':
        return false;
      case 'manage':
        return false;
      default:
        return false;
    }
  }

  return false;
}

// Export legacy function names for compatibility
export const requireAuth = withAuth;
export const requireManagement = withAuth;
