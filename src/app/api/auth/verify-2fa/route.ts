import { NextRequest, NextResponse } from "next/server";
import { TwoFactorAuthService } from "@/lib/TwoFactorAuthService";
import db from '@/lib/database';
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

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

    // Find the user using raw SQL query
    const userResult = await db.query(
      `SELECT id, email, name, role, club_id FROM users WHERE id = $1`,
      [userId]
    );
    console.log('User found:', userResult.rows.length > 0 ? { id: userResult.rows[0].id, email: userResult.rows[0].email } : null);

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];

    // Check which 2FA method is enabled
    const methodResult = await db.query(
      `SELECT totp_enabled, email_otp_enabled, totp_secret FROM users WHERE id = $1`,
      [userId]
    );
    
    console.log('2FA method check:', methodResult.rows.length > 0 ? 
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
        isValid = await TwoFactorAuthService.verifyTotp(userId, code);
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
        isValid = await TwoFactorAuthService.verifyEmailOtp(userId, code);
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

    // Create session using SQL query
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + (trustDevice ? 168 : 24)); // 7 days or 24 hours

    const sessionToken = `zenith_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const sessionResult = await db.query(`
      INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [
      user.id,
      sessionToken,
      sessionExpiry,
      req.headers.get('user-agent') || 'Zenith-Client',
      req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1'
    ]);

    const session = sessionResult.rows[0];

    // Generate JWT tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    const accessToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    const refreshTokenData = {
      userId: user.id,
      sessionId: session.id,
    };
    const refreshToken = jwt.sign(refreshTokenData, JWT_SECRET, { expiresIn: '7d' });

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
        try {
          const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await db.query(
            `INSERT INTO trusted_devices (user_id, device_identifier, device_name, ip_address, browser)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, deviceId, userAgent, ipAddress, userAgent]
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
      } catch (outerError) {
        console.error("Error processing trusted device:", outerError);
        // Continue with login even if trusting device fails completely
      }
    }

    return response;
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to verify 2FA code" },
      { status: 500 }
    );
  }
}
