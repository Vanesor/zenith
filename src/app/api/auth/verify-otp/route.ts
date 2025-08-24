import { NextRequest, NextResponse } from 'next/server';
import EmailService from '@/lib/EmailService';
import db from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, type = 'verification' } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await EmailService.verifyOTP(email, otp, type);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    if (type === 'verification') {
      // Update user email verification status
      await db.query(
        'UPDATE users SET email_verified = true WHERE email = $1',
        [email]
      );

      return NextResponse.json({
        success: true,
        message: 'Email verified successfully',
        emailVerified: true
      });
    }

    if (type === 'forgot_password') {
      // For password reset, return success but don't change anything yet
      return NextResponse.json({
        success: true,
        message: 'OTP verified successfully',
        canResetPassword: true
      });
    }

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully'
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
