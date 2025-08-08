/**
 * Centralized Authentication Configuration for Zenith
 * 
 * This file provides a single source of truth for all authentication-related
 * constants and ensures consistent security settings across the application.
 */

// Validate required environment variables at startup
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required for authentication");
}

if (!REFRESH_SECRET) {
  throw new Error("REFRESH_SECRET environment variable is required for token refresh");
}

export const AUTH_CONFIG = {
  // Token Lifespans - Standardized across the system
  ACCESS_TOKEN_EXPIRY: "15m",           // 15 minutes (secure default)
  REFRESH_TOKEN_EXPIRY: "7d",           // 7 days (secure default)
  SESSION_EXPIRY_DAYS: 7,               // 7 days (matches refresh tokens)
  
  // Security Thresholds
  TOKEN_REFRESH_THRESHOLD: 300,         // 5 minutes in seconds (refresh proactively)
  MAX_SESSIONS_PER_USER: 5,             // Limit concurrent sessions
  
  // Secrets (validated at startup)
  JWT_SECRET,
  REFRESH_SECRET,
  
  // Cookie Configuration
  COOKIE_CONFIG: {
    ACCESS_TOKEN_COOKIE: 'zenith-token',
    SESSION_COOKIE: 'zenith-session',
    SECURE: process.env.NODE_ENV === 'production',
    HTTP_ONLY: true,
    SAME_SITE: 'lax' as const,
    PATH: '/',
  },
  
  // Rate Limiting
  RATE_LIMITS: {
    LOGIN_ATTEMPTS: 5,                  // Max login attempts per IP
    LOGIN_WINDOW: 15 * 60 * 1000,      // 15 minutes window
    TOKEN_REFRESH: 10,                  // Max refresh attempts per session
    TOKEN_REFRESH_WINDOW: 60 * 1000,   // 1 minute window
  },
  
  // Security Headers
  SECURITY_HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  }
} as const;

// Type exports for TypeScript support
export type AuthConfig = typeof AUTH_CONFIG;

// Helper functions for common auth operations
export const getJWTSecret = () => AUTH_CONFIG.JWT_SECRET;
export const getRefreshSecret = () => AUTH_CONFIG.REFRESH_SECRET;
export const getAccessTokenExpiry = () => AUTH_CONFIG.ACCESS_TOKEN_EXPIRY;
export const getRefreshTokenExpiry = () => AUTH_CONFIG.REFRESH_TOKEN_EXPIRY;

// Validation helper
export const validateAuthConfig = () => {
  const requiredVars = ['JWT_SECRET', 'REFRESH_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return true;
};

export default AUTH_CONFIG;
