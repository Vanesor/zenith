import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/AuthMiddleware";
import TwoFactorAuthService from "@/lib/TwoFactorAuthService";
import { prisma, Database } from "@/lib/database-consolidated";

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
    const { code, tempSecret } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // First check if a tempSecret was provided directly from the client
    // This is useful when handling frontend-initiated setup processes
    let secretToVerify = tempSecret;
    
    if (!secretToVerify) {
      // If no tempSecret was provided, get it from the database
      const twoFAStatus = await TwoFactorAuthService.get2FAStatus(userId);
      
      if (!twoFAStatus.tempSecret) {
        return NextResponse.json(
          { error: "No setup in progress" },
          { status: 400 }
        );
      }
      
      secretToVerify = twoFAStatus.tempSecret;
    }

    // Verify the code against the temporary secret
    const isValid = TwoFactorAuthService.verifyToken(code, secretToVerify);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // If tempSecret came directly from the client (not from database fetch),
    // we need to store it first before enabling 2FA
    if (tempSecret && tempSecret === secretToVerify) {
      // Store the verified secret
      await Database.query(
        `UPDATE users 
         SET 
          totp_temp_secret = $1, 
          totp_temp_secret_created_at = NOW()
         WHERE id = $2`,
        [tempSecret, userId]
      );
    }
    
    // Enable 2FA for the user
    const success = await TwoFactorAuthService.enable2FA(userId);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to enable two-factor authentication" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Two-factor authentication enabled successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error verifying 2FA code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
