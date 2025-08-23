import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { TwoFactorAuthService } from "@/lib/TwoFactorAuthService";

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

    // Use the enableTwoFactor method which exists and includes verification
    const success = await TwoFactorAuthService.enableTwoFactor(userId, code);
    
    if (!success) {
      return NextResponse.json(
        { error: "Invalid verification code or failed to enable 2FA" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Two-factor authentication enabled successfully",
      success: true,
    });
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
