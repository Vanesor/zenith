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
    console.log('🔍 2FA Setup API called');
    
    // Initialize the TwoFactorAuthService
    TwoFactorAuthService.init();
    
    // Verify that the user is authenticated
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      console.log('❌ Auth failed:', authResult.error);
      return NextResponse.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = authResult.user!.id;
    const email = authResult.user!.email;
    console.log('✅ User authenticated:', { userId, email });

    // Generate new secret and QR code
    console.log('🔍 Generating secret...');
    const secret = await TwoFactorAuthService.generateSecret(userId, email);
    console.log('✅ Secret generated:', secret.substring(0, 8) + '...');

    console.log('🔍 Generating QR code...');
    const qrCode = await TwoFactorAuthService.generateQrCode(secret, email);
    console.log('✅ QR code generated, data URL length:', qrCode.length);

    // Also generate recovery codes
    console.log('🔍 Generating recovery codes...');
    const recoveryCodes = await TwoFactorAuthService.generateRecoveryCodes(userId);
    console.log('✅ Recovery codes generated:', recoveryCodes.length, 'codes');

    return NextResponse.json({
      tempSecret: secret,
      qrCode,
      recoveryCodes,
    });
  } catch (error) {
    console.error("❌ Error setting up 2FA:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
