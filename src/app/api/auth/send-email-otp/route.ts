import { NextRequest, NextResponse } from "next/server";
import { TwoFactorAuthService } from "@/lib/TwoFactorAuthService";
import db from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { error: "User ID or email is required" },
        { status: 400 }
      );
    }

    let targetUserId = userId;

    // If email provided instead of userId, find the user
    if (email && !userId) {
      const userResult = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }

      targetUserId = userResult.rows[0].id;
    }

    // Generate and send email OTP
    const success = await TwoFactorAuthService.generateEmailOtp(targetUserId);

    if (success) {
      return NextResponse.json(
        { message: "Email OTP sent successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to send email OTP" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
