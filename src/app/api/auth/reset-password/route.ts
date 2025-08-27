import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import { validatePasswordStrength } from '@/lib/password-validation';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: "Password does not meet security requirements",
          details: passwordValidation.errors,
          strength: passwordValidation.strength
        },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const userResult = await db.query(
      'SELECT id, email FROM users WHERE password_reset_token = $1 AND password_reset_token_expires_at > NOW()',
      [token]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    const user = userResult.rows[0];

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_token_expires_at = NULL WHERE id = $2',
      [hashedPassword, user.id]
    );

    return NextResponse.json({
      message: "Password reset successfully"
    });

  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
