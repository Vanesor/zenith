/**
 * Authentication Middleware for Zenith
 * This file handles authentication across the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { jwtVerify, createRemoteJWKSet } from 'jose';

// Constants
const COOKIE_NAME = 'zenith_auth';
const SESSION_DURATION = 60 * 60 * 24 * 30; // 30 days for "remember me"
const DEFAULT_SESSION_DURATION = 60 * 60 * 24; // 1 day default

// Import Supabase client
import { createAdminClient } from './supabase';

/**
 * Authenticate a user and create a session
 * @param email User email
 * @param password User password
 * @param rememberMe Whether to set a long-term session
 */
export async function authenticateUser(email, password, rememberMe = false) {
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
      user: userData
    };
  } catch (error) {
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
async function createSessionToken(userId, rememberMe = false) {
  try {
    const jwt = require('jsonwebtoken');
    
    const expiresIn = rememberMe ? SESSION_DURATION : DEFAULT_SESSION_DURATION;
    
    const token = jwt.sign(
      { 
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        type: 'session'
      }, 
      process.env.JWT_SECRET, 
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
async function storeSession(userId, token, rememberMe = false) {
  try {
    const supabase = createAdminClient();
    
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
 * Get current authenticated user
 */
export async function getCurrentUser() {
  try {
    // Use cookies() as an async function
    const cookieStore = await cookies();
    // Access the cookie after awaiting
    const authCookie = cookieStore.get(COOKIE_NAME);
    const token = authCookie?.value;
    
    if (!token) return null;
    
    // Verify token
    const user = await verifyToken(token);
    if (!user) return null;
    
    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Verify JWT token
 * @param token JWT token
 */
export async function verifyToken(token) {
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.sub) return null;
    
    // Check if session exists and is valid
    const supabase = createAdminClient();
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*')
      .eq('token', token)
      .eq('user_id', decoded.sub)
      .single();
      
    if (sessionError || !session) return null;
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Remove expired session
      await supabase.from('sessions').delete().eq('token', token);
      return null;
    }
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.sub)
      .single();
      
    if (userError || !user) return null;
    
    // Update last_active_at
    await supabase
      .from('sessions')
      .update({ last_active_at: new Date().toISOString() })
      .eq('token', token);
      
    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Middleware to check auth status
 */
export async function authMiddleware(req) {
  // Get token from cookies
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(COOKIE_NAME);
  const token = authCookie?.value;
  
  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/register', '/reset-password', '/'];
  const currentPath = req.nextUrl.pathname;
  
  if (publicRoutes.includes(currentPath)) {
    return null; // Allow access to public routes
  }
  
  if (!token) {
    // No token, redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Verify token
  const user = await verifyToken(token);
  
  if (!user) {
    // Invalid token, clear cookie and redirect to login
    cookies().delete(COOKIE_NAME);
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  // Token is valid, allow request
  return null;
}

/**
 * Logout user
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);
    const token = authCookie?.value;
    
    if (token) {
      // Delete session from database
      const supabase = createAdminClient();
      await supabase.from('sessions').delete().eq('token', token);
      
      // Clear cookie
      const cookieStore2 = await cookies();
      cookieStore2.delete(COOKIE_NAME);
    }
    
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}

/**
 * Set authentication cookie
 * @param token JWT token
 * @param rememberMe Whether to set a long-term cookie
 */
export async function setAuthCookie(token, rememberMe = false) {
  const maxAge = rememberMe ? SESSION_DURATION : DEFAULT_SESSION_DURATION;
  
  const cookieStore = await cookies();
  cookieStore.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge,
    sameSite: 'lax'
  });
}

/**
 * Refresh authentication if needed
 */
export async function refreshAuthIfNeeded() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);
    const token = authCookie?.value;
    
    if (!token) return false;
    
    // Verify token
    const jwt = require('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      // Token is invalid or expired
      cookies().delete(COOKIE_NAME);
      return false;
    }
    
    // Check if token is about to expire (less than 1 day left)
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    
    if (expiresIn < 24 * 60 * 60) {
      // Create new token with same expiration policy
      const supabase = createAdminClient();
      
      // Check if the session had "remember me" enabled
      const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('token', token)
        .single();
        
      const rememberMe = session && 
        (new Date(session.expires_at).getTime() - new Date(session.created_at).getTime()) 
        > DEFAULT_SESSION_DURATION * 1000;
      
      // Create new token
      const newToken = await createSessionToken(decoded.sub, rememberMe);
      
      // Update session
      await supabase
        .from('sessions')
        .update({ 
          token: newToken,
          updated_at: new Date().toISOString() 
        })
        .eq('token', token);
      
      // Set new cookie
      setAuthCookie(newToken, rememberMe);
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Auth refresh error:', error);
    return false;
  }
}
