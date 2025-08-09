import { NextRequest, NextResponse } from "next/server";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import Database from "@/lib/database";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, userId, method } = body;
    
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
      const userResult = await Database.query(
        "SELECT totp_secret FROM users WHERE id = $1 AND totp_enabled = true",
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

    // Get the user details to create a full session
    const userResult = await Database.query(
      "SELECT * FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Create a JWT token for the authenticated session
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      club_id: user.club_id,
    });

    // Create the response
    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        club_id: user.club_id,
      }
    });
    
    // Set the token in a cookie
    response.cookies.set('zenith-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
    });

    return response;
  } catch (error) {
    console.error("Error in 2FA verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
