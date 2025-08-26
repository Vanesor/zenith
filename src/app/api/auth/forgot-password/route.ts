import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await db.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal whether user exists for security
      return NextResponse.json({
        message: "If an account with that email exists, a password reset link has been sent."
      });
    }

    const user = userResult.rows[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      // Remove this line in production
      devToken: resetToken
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
