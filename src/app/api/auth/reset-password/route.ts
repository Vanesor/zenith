import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate token
    if (!token) {
      return NextResponse.json(
        { error: "Reset token is required" },
        { status: 400 }
      );
    }

    // Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find user with this token
    const userResult = await db.query(
      `SELECT id, email, password_reset_token_expires_at 
       FROM users 
       WHERE password_reset_token = $1`,
      [token]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];
    
    // Check if token is expired
    const now = new Date();
    const expiry = new Date(user.password_reset_token_expires_at);
    
    if (now > expiry) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear token
    await db.query(
      `UPDATE users 
       SET 
        password_hash = $1,
        password_reset_token = NULL,
        password_reset_token_expires_at = NULL,
        has_password = true
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      message: "Password has been reset successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
