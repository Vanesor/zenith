import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";

export async function GET(request: NextRequest) {
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

    // Get the current 2FA status for the user
    const twoFAStatus = await TwoFactorAuthService.get2FAStatus(userId);

    return NextResponse.json(twoFAStatus);
  } catch (error) {
    console.error("Error getting 2FA status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    // Generate new secret and QR code
    const secret = await TwoFactorAuthService.generateSecret(userId, email);
    const qrCode = await TwoFactorAuthService.generateQrCode(secret, email);

    // Also generate recovery codes
    const recoveryCodes = await TwoFactorAuthService.generateRecoveryCodes(userId);

    return NextResponse.json({
      tempSecret: secret,
      qrCode,
      recoveryCodes,
    });
  } catch (error) {
    console.error("Error setting up 2FA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
