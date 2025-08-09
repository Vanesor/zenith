import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { createAdminClient } from './supabase';
import { User } from './supabase-types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { userId: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const tokenCookie = request.cookies.get('token');
  return tokenCookie?.value || null;
}

export function getUserFromRequest(request: NextRequest): { userId: string; email: string } | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return verifyToken(token);
}

/**
 * Get current authenticated user from cookies
 */
export async function getCurrentUser() {
  try {
    // Check for cookie in server component
    let token = null;
    
    // For API routes, we'll rely on the request context
    // This is a simplified version since we're in API routes that should receive the token from headers or cookies
    // Client-side - Parse cookies from document.cookie if available
    if (typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      token = cookies['zenith-token'];
    }
    
    if (!token) return null;
    
    // Verify token
    const decoded = verifyToken(token);
    if (!decoded) return null;
    
    // Fetch user data from database or Supabase
    const { supabase } = await import('./supabase');
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
      
    if (error || !user) return null;
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

// Authentication result interface
export interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

/**
 * Authenticate a user and create a session
 * @param email User email
 * @param password User password
 * @param rememberMe Whether to set a long-term session
 */
export async function authenticateUser(
  email: string, 
  password: string, 
  rememberMe: boolean = false
): Promise<AuthResult> {
  try {
    const supabase = createAdminClient();
    
    // First, try to authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) throw new Error(authError.message);
    
    // Now get the user details from our users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
      
    if (userError) throw new Error(userError.message);
    
    // Create JWT session token
    const token = await createSessionToken(userData.id, rememberMe);
    
    // Store session in database for additional security and monitoring
    await storeSession(userData.id, token, rememberMe);
    
    return { 
      success: true, 
      token,
      user: userData as User
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

/**
 * Create a JWT session token
 * @param userId User ID
 * @param rememberMe Whether to set a long-term session
 */
async function createSessionToken(userId: string, rememberMe: boolean = false): Promise<string> {
  try {
    const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days for "remember me"
    const DEFAULT_SESSION_DURATION = 60 * 60 * 24; // 1 day default
    
    const expiresIn = rememberMe ? SESSION_DURATION : DEFAULT_SESSION_DURATION;
    
    const token = jwt.sign(
      { 
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        type: 'session'
      }, 
      process.env.JWT_SECRET || '', 
      { expiresIn }
    );
    
    return token;
  } catch (error) {
    console.error('Token creation error:', error);
    throw error;
  }
}

/**
 * Store session in database
 * @param userId User ID
 * @param token JWT token
 * @param rememberMe Whether to set a long-term session
 */
async function storeSession(userId: string, token: string, rememberMe: boolean = false): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    
    const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days for "remember me"
    const DEFAULT_SESSION_DURATION = 60 * 60 * 24; // 1 day default
    
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + (rememberMe ? SESSION_DURATION : DEFAULT_SESSION_DURATION)
    );
    
    // Get user agent and IP if available
    let userAgent = '';
    let ipAddress = '';
    
    if (typeof window !== 'undefined') {
      userAgent = window.navigator.userAgent;
    }
    
    // Store the session
    const { error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        token,
        expires_at: expiresAt.toISOString(),
        user_agent: userAgent,
        ip_address: ipAddress
      });
      
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Session storage error:', error);
    throw error;
  }
}

/**
 * Set authentication cookie
 * @param token JWT token
 * @param rememberMe Whether to set a long-term cookie
 */
export function setAuthCookie(token: string, rememberMe: boolean = false): void {
  const COOKIE_NAME = 'zenith_auth';
  const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days for "remember me"
  const DEFAULT_SESSION_DURATION = 60 * 60 * 24; // 1 day default
  
  const maxAge = rememberMe ? SESSION_DURATION : DEFAULT_SESSION_DURATION;
  
  // In a browser environment
  document.cookie = `${COOKIE_NAME}=${token}; max-age=${maxAge}; path=/; samesite=lax; ${process.env.NODE_ENV === 'production' ? 'secure; ' : ''}httponly;`;
}
