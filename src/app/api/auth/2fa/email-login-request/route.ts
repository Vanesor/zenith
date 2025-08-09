import { NextRequest, NextResponse } from "next/server";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import Database from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Get the user by email
    const userResult = await Database.query(
      "SELECT id, email, email_otp_enabled FROM users WHERE email = $1",
      [email]
    );
    
    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const user = userResult.rows[0];
    
    // Check if email OTP is enabled for this user
    if (!user.email_otp_enabled) {
      return NextResponse.json(
        { error: "Email OTP not enabled for this user" },
        { status: 400 }
      );
    }
    
    // Generate and send email OTP
    const result = await TwoFactorAuthService.generateAndSendEmailOTP(user.id, user.email);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      userId: user.id // Return the userId for verification
    });
  } catch (error) {
    console.error("Error sending login OTP email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
