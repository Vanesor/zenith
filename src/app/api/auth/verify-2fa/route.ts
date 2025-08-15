import { NextRequest, NextResponse } from "next/server";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import { Database } from "@/lib/database-consolidated";
import FastAuth from "@/lib/FastAuth";
import PrismaDB from "@/lib/database-consolidated";

export async function POST(req: NextRequest) {
  try {
    const { userId, code, trustDevice = false } = await req.json();
    
    console.log('2FA Verification attempt:', { userId, code: code ? '[HIDDEN]' : null, trustDevice });
    
    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and verification code are required" },
        { status: 400 }
      );
    }

    // Find the user using the consolidated database
    const user = await PrismaDB.findUserById(userId);
    console.log('User found:', user ? { id: user.id, email: user.email } : null);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check which 2FA method is enabled
    const methodResult = await Database.query(
      "SELECT totp_enabled, email_otp_enabled, totp_secret FROM users WHERE id = $1::uuid",
      [userId]
    );
    
    console.log('2FA method check:', methodResult.rows[0] ? 
      { 
        totp_enabled: methodResult.rows[0].totp_enabled, 
        email_otp_enabled: methodResult.rows[0].email_otp_enabled,
        has_totp_secret: !!methodResult.rows[0].totp_secret 
      } : null);
    
    if (methodResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const { totp_enabled, email_otp_enabled, totp_secret } = methodResult.rows[0];
    
    if (!totp_enabled && !email_otp_enabled) {
      return NextResponse.json(
        { error: "Two-factor authentication is not enabled for this user" },
        { status: 400 }
      );
    }
    
    let isValid = false;
    
    // Verify based on the enabled method
    if (totp_enabled && totp_secret) {
      // Verify the TOTP code
      console.log('Attempting TOTP verification');
      try {
        isValid = TwoFactorAuthService.verifyToken(code, totp_secret);
        console.log('TOTP verification result:', isValid);
      } catch (verifyError) {
        console.error("Error verifying 2FA token:", verifyError);
        return NextResponse.json(
          { error: "Failed to verify 2FA code. Please try again." },
          { status: 400 }
        );
      }
    } else if (email_otp_enabled) {
      // Verify email OTP
      console.log('Attempting email OTP verification');
      try {
        isValid = await TwoFactorAuthService.verifyEmailOTP(userId, code);
        console.log('Email OTP verification result:', isValid);
      } catch (verifyError) {
        console.error("Error verifying email OTP:", verifyError);
        return NextResponse.json(
          { error: "Failed to verify email code. Please try again." },
          { status: 400 }
        );
      }
    }
    
    if (!isValid) {
      console.log('2FA verification failed - invalid code');
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    console.log('2FA verification successful, creating session...');

    // Create session using FastAuth system (consistent with regular login)
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + (trustDevice ? 168 : 24)); // 7 days or 24 hours

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
      token: accessToken,
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
      maxAge: trustDevice ? 7 * 24 * 60 * 60 : 24 * 60 * 60, // 7 days or 24 hours
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
        maxAge: trustDevice ? 7 * 24 * 60 * 60 : 24 * 60 * 60,
      });
    }

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
            sameSite: 'lax' as const,
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
