import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SessionManager } from "@/lib/SessionManager";
import { RateLimiter } from "@/lib/RateLimiter";
import { CacheManager, CacheKeys } from "@/lib/CacheManager";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key";
const authLimiter = RateLimiter.createAuthLimiter();

function generateToken(payload: {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "15m" }); // Short-lived access token
}

function generateRefreshToken(payload: {
  userId: string;
  sessionId: string;
}): string {
  return jwt.sign(
    { ...payload, type: 'refresh' }, 
    REFRESH_SECRET, 
    { expiresIn: "7d" } // Long-lived refresh token
  );
}

import { TrustedDeviceService } from "@/lib/TrustedDeviceService";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResponse = await authLimiter.middleware(request);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { email, password, rememberMe = false } = await request.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check rate limit for this specific email (prevent brute force on specific accounts)
    const emailKey = `login_attempts:${email}`;
    const attemptCount = await CacheManager.get<number>(emailKey) || 0;
    
    if (attemptCount >= 5) {
      return NextResponse.json(
        { error: "Too many failed login attempts for this account. Try again in 15 minutes." },
        { status: 429 }
      );
    }

    // Check if user exists in database
    const existingUser = await Database.getUserByEmail(email);
    if (!existingUser) {
      // Increment failed attempts
      await CacheManager.set(emailKey, attemptCount + 1, 900); // 15 minutes
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password_hash
    );
    
    if (!isValidPassword) {
      // Increment failed attempts
      await CacheManager.set(emailKey, attemptCount + 1, 900); // 15 minutes
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Clear failed login attempts on successful login
    await CacheManager.delete(emailKey);
    
    // Check if 2FA is enabled for this user and get trusted device status
    // First, check for a trusted device cookie
    const trustedDeviceId = request.cookies.get('zenith-trusted-device')?.value;
    let isTrustedDevice = false;
    
    if (trustedDeviceId) {
      const trustStatus = await TrustedDeviceService.verifyTrustedDevice(
        existingUser.id, 
        trustedDeviceId
      );
      isTrustedDevice = trustStatus.trusted;
    }
    
    const twoFAStatus = await TwoFactorAuthService.get2FAStatus(
      existingUser.id,
      trustedDeviceId || undefined
    );
    
    // If 2FA is enabled and this is not a trusted device, require verification
    if (twoFAStatus.enabled && !isTrustedDevice) {
      // For email OTP method, we should generate and send the code automatically
      if (twoFAStatus.method === 'email_otp') {
        await TwoFactorAuthService.generateAndSendEmailOTP(
          existingUser.id,
          existingUser.email
        );
      }
      
      return NextResponse.json({
        requiresTwoFactor: true,
        userId: existingUser.id,
        method: twoFAStatus.method,
        message: "Two-factor authentication required"
      });
    }

    // Get device info for session tracking
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Create session
    const sessionId = await SessionManager.createSession(
      existingUser.id,
      userAgent,
      ipAddress
    );

    // Get user's club information if they have one
    let userClub = null;
    if (existingUser.club_id) {
      userClub = await Database.getClubById(existingUser.club_id);
    }

    // Generate JWT token with session ID
    const token = generateToken({
      userId: existingUser.id,
      email: existingUser.email,
      role: existingUser.role,
      sessionId: sessionId,
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken({
      userId: existingUser.id,
      sessionId: sessionId,
    });

    // Prepare user data (exclude password_hash)
    const userData = {
      id: existingUser.id,
      email: existingUser.email,
      name: existingUser.name,
      role: existingUser.role,
      club_id: existingUser.club_id,
      avatar: existingUser.avatar,
      bio: existingUser.bio,
    };

    // Cache user data for quick access
    await CacheManager.set(CacheKeys.user(existingUser.id), userData, 3600);

    // Log successful login
    console.log(`User ${existingUser.email} logged in successfully from ${ipAddress}`);

    const response = NextResponse.json({
      message: "Login successful",
      token,
      refreshToken,
      user: userData,
      club: userClub
        ? {
            id: userClub.id,
            name: userClub.name,
            type: userClub.type,
            color: userClub.color,
          }
        : null,
    });

    // Set secure HTTP-only cookie for additional security
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days if remember me is checked, otherwise 7 days
    
    response.cookies.set('zenith-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge, 
    });
    
    // If user checked "remember me" and they don't have 2FA enabled,
    // we can register this as a trusted device directly
    if (rememberMe && !twoFAStatus.enabled) {
      try {
        // Create a trusted device
        const deviceId = await TwoFactorAuthService.trustDevice(
          existingUser.id,
          userAgent,
          ipAddress,
          'login_only' // Only bypass 2FA for login, still require for sensitive actions
        );
        
        if (deviceId) {
          // Set a cookie to identify this device in the future
          response.cookies.set('zenith-trusted-device', deviceId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/'
          });
        }
      } catch (trustError) {
        console.error("Error trusting device:", trustError);
        // Continue with login even if trusting device fails
      }
    }

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
