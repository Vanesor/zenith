import { NextRequest, NextResponse } from "next/server";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import { db } from '@/lib/database-service';
import FastAuth from "@/lib/FastAuth";
import { db } from '@/lib/database-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, userId, method, rememberMe = false, trustDevice = false } = body;
    
    if (!otp || !userId || !method) {
      return NextResponse.json(
        { error: "OTP, userId, and method are required" },
        { status: 400 }
      );
    }
    
    let verificationResult = false;
    
    // Verify based on the chosen 2FA method
    if (method === "app") {
      // Get user's TOTP secret
      const userResult = await db.executeRawSQL(
        "SELECT totp_secret FROM users WHERE id = $1::uuid AND totp_enabled = true",
        [userId]
      );
      
      if (userResult.rows.length === 0 || !userResult.rows[0].totp_secret) {
        return NextResponse.json(
          { error: "App-based 2FA not enabled for this user" },
          { status: 400 }
        );
      }
      
      // Verify with app-based TOTP
      const secret = userResult.rows[0].totp_secret;
      verificationResult = TwoFactorAuthService.verifyToken(otp, secret);
    } 
    else if (method === "email") {
      // Verify with email OTP
      verificationResult = await TwoFactorAuthService.verifyEmailOTP(userId, otp);
    }
    else {
      return NextResponse.json(
        { error: "Invalid 2FA method" },
        { status: 400 }
      );
    }

    if (!verificationResult) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }

    // Get the user details to create a full session using FastAuth system
    const user = await PrismaDB.findUserById(userId);

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create session using FastAuth system (consistent with regular login)
    const sessionExpiry = new Date();
    sessionExpiry.setHours(sessionExpiry.getHours() + (rememberMe ? 168 : 24)); // 7 days or 24 hours

    const sessionData = {
      user_id: user.id,
      token: `zenith_${Date.now()}_${Math.random().toString(36).substring(2)}`, // Generate session token
      expires_at: sessionExpiry,
      user_agent: request.headers.get('user-agent') || 'Zenith-Client',
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1'
    };

    const session = await PrismaDB.createSession(sessionData);

    // Generate JWT tokens using FastAuth
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    const accessToken = FastAuth.generateAccessToken(tokenPayload, rememberMe);
    const refreshToken = FastAuth.generateRefreshToken({
      userId: user.id,
      sessionId: session.id,
    });

    // Create the response
    const response = NextResponse.json({
      success: true,
      token: accessToken, // Include token in response for localStorage
      refreshToken: refreshToken, // Include refresh token too
      message: "Two-factor authentication successful",
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
    
    // If user chose to trust this device, store it in the database
    if (trustDevice) {
      try {
        const deviceId = `${Math.random().toString(36).substring(2)}${Date.now()}`;
        const userAgent = request.headers.get('user-agent') || 'Unknown Device';
        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
        
        // Use the correct schema column names (expires_at instead of trusted_until)
        await db.executeRawSQL(`
          INSERT INTO trusted_devices 
          (user_id, device_identifier, device_name, ip_address, browser)
          VALUES ($1::uuid, $2, $3, $4, $5)
        `, [
          user.id,
          deviceId,
          userAgent,
          ipAddress,
          userAgent
        ]);
        
        // Set a cookie to identify this trusted device
        response.cookies.set('zenith-trusted-device', deviceId, {
          ...cookieOptions,
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      } catch (error) {
        console.error("Error storing trusted device:", error);
        // Continue even if storing trusted device fails
      }
    }

    return response;

  } catch (error) {
    console.error("2FA verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification" },
      { status: 500 }
    );
  }
}
