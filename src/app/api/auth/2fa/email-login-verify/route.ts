import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import Database from "@/lib/database";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // For login verification, we need to get the user from the session
    // which should have been stored after password verification but before 2FA completion
    const body = await request.json();
    const { otp, userId } = body;
    
    if (!otp || !userId) {
      return NextResponse.json(
        { error: "OTP and userId are required" },
        { status: 400 }
      );
    }
    
    // Verify the provided OTP
    const result = await TwoFactorAuthService.verifyEmailOTP(userId, otp);

    if (!result) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
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
    console.error("Error in email OTP login verification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
