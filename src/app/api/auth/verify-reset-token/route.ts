import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Check if token exists and is not expired
    const result = await db.query(
      'SELECT id, email, password_reset_token_expires_at FROM users WHERE password_reset_token = $1',
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid reset token" },
        { status: 400 }
      );
    }

    const user = result.rows[0];
    const expiresAt = new Date(user.password_reset_token_expires_at);
    const now = new Date();

    if (expiresAt < now) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Token is valid",
      email: user.email
    });

  } catch (error) {
    console.error("Verify reset token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
