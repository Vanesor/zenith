import { NextRequest, NextResponse } from "next/server";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import { db } from '@/lib/database-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;
    
    if (!email && !userId) {
      return NextResponse.json(
        { error: "Either email or userId is required" },
        { status: 400 }
      );
    }
    
    let user;
    
    if (userId) {
      // Get the user by ID
      user = await db.users.findUnique({
        where: { id: userId }
      });
    } else {
      // Get the user by email
      user = await db.users.findUnique({
        where: { email }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if email OTP is enabled for this user
    if (!(user as any).email_otp_enabled) {
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
