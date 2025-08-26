import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth-unified";
import { db } from '@/lib/database';

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

    // Disable 2FA for the user
    await db.query(
      `UPDATE users SET 
        totp_enabled = false, 
        email_otp_enabled = false, 
        totp_secret = NULL,
        backup_codes = NULL,
        updated_at = NOW()
      WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({
      message: "Two-factor authentication has been disabled"
    });

  } catch (error) {
    console.error("Disable 2FA error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
