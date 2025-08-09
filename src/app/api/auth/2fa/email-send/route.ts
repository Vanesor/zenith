import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";

export async function POST(request: NextRequest) {
  try {
    // Verify that the user is authenticated
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const email = authResult.user!.email;
    
    // Generate and send email OTP
    const result = await TwoFactorAuthService.generateAndSendEmailOTP(userId, email);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send OTP email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
