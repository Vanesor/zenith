import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/database-consolidated";

export async function POST(request: NextRequest) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json(
        { error: "User ID and recovery code are required" },
        { status: 400 }
      );
    }

    // Import TwoFactorAuthService
    const { TwoFactorAuthService } = await import("@/lib/TwoFactorAuthService");
    
    // Verify recovery code
    const isValid = await TwoFactorAuthService.verifyRecoveryCode(userId, code);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid recovery code" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Recovery code accepted",
      success: true,
    });
  } catch (error) {
    console.error("Error verifying recovery code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
