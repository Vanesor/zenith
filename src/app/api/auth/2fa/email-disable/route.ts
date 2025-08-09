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
    
    // Disable email OTP
    const result = await TwoFactorAuthService.disableEmailOTP(userId);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to disable email OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Email OTP disabled successfully",
    });
  } catch (error) {
    console.error("Error disabling email OTP:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
