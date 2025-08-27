import { NextRequest, NextResponse } from "next/server";
import { db } from '@/lib/database';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

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
    const resetTokenExpiry = new Date(Date.now() + 900000); // 15 minutes from now

    // Store reset token in database
    await db.query(
      'UPDATE users SET password_reset_token = $1, password_reset_token_expires_at = $2 WHERE id = $3',
      [resetToken, resetTokenExpiry, user.id]
    );

    // Send password reset email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"Zenith Platform" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🔐 Reset Your Zenith Account Password',
        html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Zenith Password</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <div style="background: white; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <span style="font-size: 32px; font-weight: bold; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Z</span>
            </div>
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">Reset Your Password</h1>
          </div>
          
          <div style="background: white; padding: 40px 30px; margin: 0; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="font-size: 16px; margin-bottom: 20px; color: #555;">Hi ${user.name || 'there'},</p>
            
            <p style="font-size: 16px; margin-bottom: 25px; color: #555;">
              We received a request to reset your password for your Zenith account. If you didn't make this request, please ignore this email.
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s ease;">
                🔐 Reset My Password
              </a>
            </div>
            
            <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">
                <strong>🕒 This link expires in 15 minutes</strong> for your security.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="background: #f8fafc; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #667eea; border: 1px solid #e2e8f0;">
              ${resetLink}
            </p>
            
            <div style="border-top: 1px solid #e2e8f0; margin-top: 30px; padding-top: 20px;">
              <p style="font-size: 12px; color: #999; margin: 0; text-align: center;">
                This email was sent by the Zenith Platform. If you didn't request this, please contact our support team.
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
            <p style="margin: 0;">© 2025 Zenith Platform. All rights reserved.</p>
          </div>
        </body>
        </html>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
    } else {
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      // Remove this line in production
      ...(process.env.NODE_ENV === 'development' && { devToken: resetToken })
    });

  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
