import { NextRequest, NextResponse } from "next/server";
import { prisma, Database } from "@/lib/database-consolidated";
import { v4 as uuidv4 } from "uuid";
import emailService from "@/lib/EmailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Check if user exists
    const userResult = await Database.query(
      "SELECT id, email, name, email_verified FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // If already verified, return success
    if (user.email_verified) {
      return NextResponse.json({
        message: "Email already verified",
        success: true,
      });
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours validity

    // Save token in database
    await Database.query(
      `UPDATE users 
       SET 
        email_verification_token = $1, 
        email_verification_token_expires_at = $2
       WHERE id = $3`,
      [verificationToken, tokenExpiry, user.id]
    );

    // Send verification email
    const emailSent = await emailService.sendVerificationEmail(
      user.email,
      verificationToken
    );

    if (!emailSent) {
      return NextResponse.json(
        { error: "Failed to send verification email" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Verification email sent",
      success: true,
    });
  } catch (error) {
    console.error("Error sending verification email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
