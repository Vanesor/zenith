import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import jwt from "jsonwebtoken";
import Database from "@/lib/database";
import { SessionManager } from "@/lib/SessionManager";

export async function POST(req: NextRequest) {
  try {
    const { userId, code } = await req.json();
    
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

    // Verify the TOTP code
    try {
      const isValid = TwoFactorAuthService.verifyToken(code, userTwoFASecret);

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 400 }
        );
      }
    } catch (verifyError) {
      console.error("Error verifying 2FA token:", verifyError);
      return NextResponse.json(
        { error: "Failed to verify 2FA code. Please try again." },
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

    return response;
  } catch (error) {
    console.error("Error during 2FA verification:", error);
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
