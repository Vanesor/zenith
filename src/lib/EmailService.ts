import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import db from './database';

// Create transporter for Gmail/SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOTPData {
  email: string;
  otp: string;
  type: 'verification' | 'forgot_password';
  expires_at: Date;
}

export interface ProjectInviteData {
  email: string;
  project_id: string;
  project_name: string;
  creator_name: string;
  project_key: string;
  access_key: string;
  expires_at: Date;
}

export interface AssignmentNotificationData {
  email: string;
  assignment_name: string;
  due_date: string;
  created_by: string;
  assignment_id: string;
}

export class EmailService {
  private static fromEmail = 'zenith.forum@stvincentngp.edu.in';
  private static fromName = 'Zenith Platform';

  // Generate 6-digit OTP
  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate secure keys for project invites
  static generateKeys(): { projectKey: string; accessKey: string } {
    return {
      projectKey: randomBytes(16).toString('hex'),
      accessKey: randomBytes(32).toString('hex')
    };
  }

  // Store OTP in database
  static async storeOTP(data: EmailOTPData): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO email_otps (email, otp, type, expires_at, created_at) 
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (email, type) 
         DO UPDATE SET otp = $2, expires_at = $4, created_at = NOW()`,
        [data.email, data.otp, data.type, data.expires_at]
      );
      return true;
    } catch (error) {
      console.error('Error storing OTP:', error);
      return false;
    }
  }

  // Verify OTP
  static async verifyOTP(email: string, otp: string, type: 'verification' | 'forgot_password'): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT * FROM email_otps 
         WHERE email = $1 AND otp = $2 AND type = $3 AND expires_at > NOW()`,
        [email, otp, type]
      );

      if (result.rows.length > 0) {
        // Delete used OTP
        await db.query(
          `DELETE FROM email_otps WHERE email = $1 AND type = $2`,
          [email, type]
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return false;
    }
  }

  // Send verification email
  static async sendVerificationEmail(email: string, name: string): Promise<{ success: boolean; otp?: string }> {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store OTP in database
      const stored = await this.storeOTP({
        email,
        otp,
        type: 'verification',
        expires_at: expiresAt
      });

      if (!stored) {
        return { success: false };
      }

      await transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Verify Your Email - Zenith Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Email Verification</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Zenith Platform</h1>
                <p style="color: #e2e8f0; margin: 10px 0 0 0; font-size: 16px;">Student Collaboration Hub</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Verify Your Email Address</h2>
                
                <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">Hello ${name},</p>
                
                <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                  Welcome to Zenith Platform! To complete your registration and secure your account, please verify your email address using the code below:
                </p>
                
                <!-- OTP Code -->
                <div style="background-color: #f7fafc; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                  <div style="font-size: 36px; font-weight: 700; color: #667eea; letter-spacing: 8px; margin: 0;">${otp}</div>
                  <p style="color: #718096; margin: 15px 0 0 0; font-size: 14px;">Verification Code</p>
                </div>
                
                <div style="background-color: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 30px 0;">
                  <p style="color: #c53030; margin: 0; font-size: 14px; font-weight: 500;">
                    ⚠️ This code will expire in 15 minutes for security reasons.
                  </p>
                </div>
                
                <p style="color: #4a5568; margin: 30px 0 0 0; font-size: 16px;">
                  If you didn't create an account with Zenith Platform, please ignore this email.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1a202c; padding: 30px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                  © 2025 Zenith Platform - St. Vincent Pallotti College of Engineering and Technology
                </p>
                <p style="color: #718096; margin: 10px 0 0 0; font-size: 12px;">
                  Department of Computer Science and Engineering
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return { success: true, otp };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false };
    }
  }

  // Send forgot password email
  static async sendForgotPasswordEmail(email: string, name: string): Promise<{ success: boolean; otp?: string }> {
    try {
      const otp = this.generateOTP();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      const stored = await this.storeOTP({
        email,
        otp,
        type: 'forgot_password',
        expires_at: expiresAt
      });

      if (!stored) {
        return { success: false };
      }

      await transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: email,
        subject: 'Reset Your Password - Zenith Platform',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Password Reset</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Zenith Platform</h1>
                <p style="color: #fce7f3; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">Reset Your Password</h2>
                
                <p style="color: #4a5568; margin: 0 0 20px 0; font-size: 16px;">Hello ${name},</p>
                
                <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                  We received a request to reset your password for your Zenith Platform account. Use the verification code below to proceed:
                </p>
                
                <!-- OTP Code -->
                <div style="background-color: #fef5e7; border: 2px dashed #f093fb; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                  <div style="font-size: 36px; font-weight: 700; color: #f093fb; letter-spacing: 8px; margin: 0;">${otp}</div>
                  <p style="color: #975a16; margin: 15px 0 0 0; font-size: 14px;">Password Reset Code</p>
                </div>
                
                <div style="background-color: #fff5f5; border-left: 4px solid #f56565; padding: 15px; margin: 30px 0;">
                  <p style="color: #c53030; margin: 0; font-size: 14px; font-weight: 500;">
                    ⚠️ This code will expire in 15 minutes. If you didn't request this, please ignore this email.
                  </p>
                </div>
                
                <p style="color: #4a5568; margin: 30px 0 0 0; font-size: 16px;">
                  For security, this code can only be used once to reset your password.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1a202c; padding: 30px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                  © 2025 Zenith Platform - St. Vincent Pallotti College of Engineering and Technology
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return { success: true, otp };
    } catch (error) {
      console.error('Error sending forgot password email:', error);
      return { success: false };
    }
  }

  // Send project invitation email
  static async sendProjectInvitationEmail(data: ProjectInviteData): Promise<boolean> {
    try {
      const inviteUrl = `${process.env.NEXTAUTH_URL}/projects/invite?key=${data.project_key}&access=${data.access_key}`;

      await transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.email,
        subject: `Project Invitation: ${data.project_name} - Zenith Platform`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Project Invitation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Project Invitation</h1>
                <p style="color: #ddd6fe; margin: 10px 0 0 0; font-size: 16px;">Zenith Platform</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">You're Invited to Join a Project!</h2>
                
                <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                  <strong>${data.creator_name}</strong> has invited you to collaborate on the project <strong>"${data.project_name}"</strong> on Zenith Platform.
                </p>
                
                <!-- Project Info -->
                <div style="background-color: #f7fafc; border-radius: 8px; padding: 25px; margin: 30px 0;">
                  <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Project Details</h3>
                  <p style="color: #4a5568; margin: 0 0 10px 0;"><strong>Project Name:</strong> ${data.project_name}</p>
                  <p style="color: #4a5568; margin: 0 0 10px 0;"><strong>Invited by:</strong> ${data.creator_name}</p>
                  <p style="color: #4a5568; margin: 0;"><strong>Project Key:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${data.project_key}</code></p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.3);">
                    Accept Invitation
                  </a>
                </div>
                
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 30px 0;">
                  <p style="color: #1e40af; margin: 0; font-size: 14px;">
                    💡 <strong>Note:</strong> This invitation will expire in 7 days. Click the button above or use the project key to join.
                  </p>
                </div>
                
                <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px;">
                  If you can't click the button, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #7c3aed;">${inviteUrl}</span>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1a202c; padding: 30px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                  © 2025 Zenith Platform - St. Vincent Pallotti College of Engineering and Technology
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending project invitation:', error);
      return false;
    }
  }

  // Send assignment notification email
  static async sendAssignmentNotification(data: AssignmentNotificationData): Promise<boolean> {
    try {
      const assignmentUrl = `${process.env.NEXTAUTH_URL}/assignments/${data.assignment_id}`;
      const formattedDueDate = new Date(data.due_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      await transporter.sendMail({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: data.email,
        subject: `New Assignment: ${data.assignment_name} - Zenith Platform`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Assignment</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">New Assignment</h1>
                <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Zenith Platform</p>
              </div>
              
              <!-- Content -->
              <div style="padding: 40px 30px;">
                <h2 style="color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">📝 ${data.assignment_name}</h2>
                
                <p style="color: #4a5568; margin: 0 0 30px 0; font-size: 16px;">
                  A new assignment has been created by <strong>${data.created_by}</strong> and is now available for you to complete.
                </p>
                
                <!-- Assignment Info -->
                <div style="background-color: #f0fdf4; border-radius: 8px; padding: 25px; margin: 30px 0; border-left: 4px solid #10b981;">
                  <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">Assignment Details</h3>
                  <p style="color: #047857; margin: 0 0 10px 0;"><strong>Assignment:</strong> ${data.assignment_name}</p>
                  <p style="color: #047857; margin: 0 0 10px 0;"><strong>Created by:</strong> ${data.created_by}</p>
                  <p style="color: #dc2626; margin: 0; font-weight: 600;"><strong>Due Date:</strong> ${formattedDueDate}</p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 40px 0;">
                  <a href="${assignmentUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #34d399 100%); color: #ffffff; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                    Start Assignment
                  </a>
                </div>
                
                <div style="background-color: #fefce8; border-left: 4px solid #eab308; padding: 15px; margin: 30px 0;">
                  <p style="color: #a16207; margin: 0; font-size: 14px;">
                    ⏰ <strong>Reminder:</strong> Make sure to complete this assignment before the due date to avoid any penalties.
                  </p>
                </div>
                
                <p style="color: #6b7280; margin: 30px 0 0 0; font-size: 14px;">
                  If you can't click the button, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #10b981;">${assignmentUrl}</span>
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #1a202c; padding: 30px; text-align: center;">
                <p style="color: #a0aec0; margin: 0; font-size: 14px;">
                  © 2025 Zenith Platform - St. Vincent Pallotti College of Engineering and Technology
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      return true;
    } catch (error) {
      console.error('Error sending assignment notification:', error);
      return false;
    }
  }
}

export default EmailService;
