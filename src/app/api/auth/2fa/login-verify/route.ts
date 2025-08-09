import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TwoFactorAuthService } from "@/lib/TwoFactorAuthService";

/**
 * API route for verifying a 2FA token during login
 * 
 * @route POST /api/auth/2fa/login-verify
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, token } = await req.json();

    if (!userId || !token) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        totp_secret: true,
        totp_enabled: true,
      },
    });

    if (!user || !user.totp_enabled || !user.totp_secret) {
      return NextResponse.json(
        { error: "Invalid user or 2FA not enabled" },
        { status: 400 }
      );
    }

    // Verify the token
    const twoFactorAuthService = new TwoFactorAuthService();
    const isValid = twoFactorAuthService.verifyToken(user.totp_secret, token);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // Return a success response with the token and user info
    // In a real app, you might want to generate a proper auth token here
    return NextResponse.json(
      { 
        success: true,
        message: "2FA verification successful",
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token: `2fa_verified_${user.id}`  // This is just a placeholder, use a real token system
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("2FA login verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
