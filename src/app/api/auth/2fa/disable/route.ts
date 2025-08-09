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
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Try to verify with recovery code first
    const isRecoveryCodeValid = await TwoFactorAuthService.verifyRecoveryCode(userId, code);
    
    if (isRecoveryCodeValid) {
      // Generate new recovery codes if we're down to the last 2
      const status = await TwoFactorAuthService.get2FAStatus(userId);
      
      return NextResponse.json({
        message: "Recovery code accepted. Two-factor authentication disabled.",
        success: true,
        recoveryCodes: null,
      });
    }

    // Disable 2FA for the user (if user confirmed they want to disable it)
    const success = await TwoFactorAuthService.disable2FA(userId);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to disable two-factor authentication" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Two-factor authentication disabled successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error disabling 2FA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
