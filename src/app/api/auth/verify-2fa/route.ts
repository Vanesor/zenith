import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import jwt from "jsonwebtoken";
import Database from "@/lib/database";
import { SessionManager } from "@/lib/SessionManager";

export async function POST(req: NextRequest) {
  try {
    const { userId, code, trustDevice = false } = await req.json();
    
    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and verification code are required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await Database.getUserById(userId);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if 2FA is enabled for this user
    const twoFAStatus = await TwoFactorAuthService.get2FAStatus(userId);

    if (!twoFAStatus.enabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled for this user" },
        { status: 400 }
      );
    }

    // The secret should be available in the 2FA status object
    if (!twoFAStatus.secret) {
      return NextResponse.json(
        { error: "Two-factor authentication is not properly set up" },
        { status: 400 }
      );
    }
    
    const userTwoFASecret = twoFAStatus.secret;
    
    if (!userTwoFASecret) {
      return NextResponse.json(
        { error: "Two-factor authentication setup is incomplete" },
        { status: 400 }
      );
    }

    // Check which 2FA method is enabled
    const methodResult = await Database.query(
      "SELECT totp_enabled, email_otp_enabled FROM users WHERE id = $1",
      [userId]
    );
    
    if (methodResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const { totp_enabled, email_otp_enabled } = methodResult.rows[0];
    let isValid = false;
    
    // Verify based on the enabled method
    if (totp_enabled) {
      // Verify the TOTP code
      try {
        isValid = TwoFactorAuthService.verifyToken(code, userTwoFASecret);
      } catch (verifyError) {
        console.error("Error verifying 2FA token:", verifyError);
        return NextResponse.json(
          { error: "Failed to verify 2FA code. Please try again." },
          { status: 400 }
        );
      }
    } else if (email_otp_enabled) {
      // Verify email OTP
      try {
        isValid = await TwoFactorAuthService.verifyEmailOTP(userId, code);
      } catch (verifyError) {
        console.error("Error verifying email OTP:", verifyError);
        return NextResponse.json(
          { error: "Failed to verify email code. Please try again." },
          { status: 400 }
        );
      }
    }
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Get device info for session tracking
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Create session
    const sessionId = await SessionManager.createSession(
      user.id,
      userAgent,
      ipAddress
    );

    // Generate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        sessionId: sessionId
      },
      JWT_SECRET,
      {
        expiresIn: "15m", // Short-lived access token
      }
    );

    // Generate refresh token
    const REFRESH_SECRET = process.env.REFRESH_SECRET || "your-refresh-secret-key";
    const refreshToken = jwt.sign(
      { userId: user.id, sessionId: sessionId, type: 'refresh' },
      REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Get additional user details with a fresh query to ensure we have all fields
    const userDetailsResult = await Database.query(
      "SELECT id, email, name, role, avatar FROM users WHERE id = $1",
      [userId]
    );
    
    const userDetails = userDetailsResult.rows[0];
    
    // Prepare user data
    const userData = {
      id: userDetails.id,
      email: userDetails.email,
      name: userDetails.name,
      role: userDetails.role,
      avatar: userDetails.avatar
    };

    // Create a response with appropriate cookies
    const response = NextResponse.json({
      success: true,
      token,
      refreshToken,
      user: userData,
    });

    // Set secure HTTP-only cookie for additional security
    response.cookies.set('zenith-session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });
    
    // If user wants to trust this device, register it
    if (trustDevice) {
      try {
        // Get device info
        const userAgent = req.headers.get('user-agent') || 'Unknown';
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const ipAddress = forwardedFor?.split(',')[0] || realIp || 'unknown';
        
        // Create a trusted device
        const deviceId = await TwoFactorAuthService.trustDevice(
          userId,
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
            maxAge: 30 * 24 * 60 * 60, // 30 days
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
    console.error("Error during 2FA verification:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
