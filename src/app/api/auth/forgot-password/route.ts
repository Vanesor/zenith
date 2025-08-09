import { NextRequest, NextResponse } from "next/server";
import Database from "@/lib/database";
import { v4 as uuidv4 } from "uuid";
import emailService from "@/lib/EmailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Check if user exists
    const userResult = await Database.query(
      "SELECT id, email, name FROM users WHERE email = $1",
      [email]
    );

    // Always return success even if user doesn't exist (security best practice)
    if (userResult.rows.length === 0) {
      return NextResponse.json({
        message: "If a user with that email exists, a password reset link has been sent.",
        success: true,
      });
    }

    const user = userResult.rows[0];

    // Generate password reset token
    const resetToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1); // 1 hour validity

    // Save token in database
    await Database.query(
      `UPDATE users 
       SET 
        password_reset_token = $1, 
        password_reset_token_expires_at = $2
       WHERE id = $3`,
      [resetToken, tokenExpiry, user.id]
    );

    // Send password reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send password reset email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "If a user with that email exists, a password reset link has been sent.",
      success: true,
    });
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
