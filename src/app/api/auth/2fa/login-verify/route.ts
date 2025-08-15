import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/database-consolidated";
import { TwoFactorAuthService } from "@/lib/TwoFactorAuthService";
import FastAuth from "@/lib/FastAuth";
import PrismaDB from "@/lib/database-consolidated";

/**
 * API route for verifying a 2FA token during login
 * 
 * @route POST /api/auth/2fa/login-verify
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, token, rememberMe = false } = await req.json();

    if (!userId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the user using the consolidated database
    const userResult = await Database.query(
      "SELECT id, email, name, role, club_id, totp_secret, totp_enabled FROM users WHERE id = $1::uuid",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    if (!user.totp_enabled || !user.totp_secret) {
      return NextResponse.json(
        { error: "2FA not enabled for this user" },
        { status: 400 }
      );
    }

    // Verify the token
    const isValid = TwoFactorAuthService.verifyToken(token, user.totp_secret);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Create session using FastAuth system (consistent with regular login)
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + (rememberMe ? 168 : 24)); // 7 days or 24 hours

    const sessionData = {
      user_id: user.id,
      token: `zenith_${Date.now()}_${Math.random().toString(36).substring(2)}`, // Generate session token
      expires_at: sessionExpiry,
      user_agent: req.headers.get('user-agent') || 'Zenith-Client',
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    };

    const session = await PrismaDB.createSession(sessionData);

    // Generate JWT tokens using FastAuth
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    const accessToken = FastAuth.generateAccessToken(tokenPayload);
    const refreshToken = FastAuth.generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Create the response
    const response = NextResponse.json({
      success: true,
      message: "2FA verification successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        club_id: user.club_id,
      }
    });
    
    // Set secure HTTP-only cookies (consistent with regular login)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    response.cookies.set('zenith-token', accessToken, {
      ...cookieOptions,
      maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 24 hours
    });

    if (refreshToken) {
      response.cookies.set('zenith-refresh-token', refreshToken, {
        ...cookieOptions,
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });
    }

    if (session.id) {
      response.cookies.set('zenith-session', session.id, {
        ...cookieOptions,
        maxAge: rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    }

    return response;

  } catch (error) {
    console.error("2FA login verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
