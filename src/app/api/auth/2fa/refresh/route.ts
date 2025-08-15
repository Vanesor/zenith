import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 QR Refresh API called');
    
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
    console.log('✅ User authenticated for QR refresh:', { userId, email });

    // Generate new secret and QR code
    const secret = await TwoFactorAuthService.generateSecret(userId, email);
    const qrCode = await TwoFactorAuthService.generateQrCode(secret, email);

    // Also regenerate recovery codes for fresh setup
    const recoveryCodes = await TwoFactorAuthService.generateRecoveryCodes(userId);

    console.log('✅ QR refresh completed successfully');

    return NextResponse.json({
      tempSecret: secret,
      qrCode,
      recoveryCodes,
      refreshed: true
    });
  } catch (error) {
    console.error("❌ Error refreshing QR code:", error);
    return NextResponse.json(
      { error: "Failed to refresh QR code" },
      { status: 500 }
    );
  }
}
