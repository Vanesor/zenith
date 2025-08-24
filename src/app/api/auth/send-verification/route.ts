import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/database";
import EmailService from "@/lib/EmailService";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const userResult = await db.query(
      'SELECT id, name, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Send verification email
    const result = await EmailService.sendVerificationEmail(email, user.name);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Verification email sent successfully',
        emailAlreadyVerified: user.email_verified
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to send verification email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error sending verification email:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
