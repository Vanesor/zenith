import nodemailer from 'nodemailer';
import db from "./database";

export type EmailOptions = {
  to: string;
  subject: string;
  text?: string;
  html: string;
  attachments?: {
    filename: string;
    content: any;
    contentType?: string;
  }[];
};

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Create a transporter using environment variables
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
    });
  }

  async sendEmail(options: EmailOptions, category?: string, relatedId?: string): Promise<boolean> {
    try {
      const { to, subject, text, html, attachments } = options;
      
      const mailOptions = {
        from: `"Zenith Platform" <${process.env.EMAIL_USER || 'noreply@zenith.com'}>`,
        to,
        subject,
        text: text || html.replace(/<[^>]*>?/gm, ''), // Strip HTML if no text is provided
        html,
        attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`Email sent: ${info.messageId}`);
      
      // Log the email in database
      try {
        await db.executeRawSQL(
          `INSERT INTO email_logs (recipient, subject, content_preview, status, message_id, category, related_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [to, subject, html.substring(0, 200), 'sent', info.messageId, category || null, relatedId || null]
        );
      } catch (dbError: unknown) {
        // Log any database errors
        if (dbError instanceof Error) {
          console.log("Email log not saved to database:", dbError.message);
        } else {
          console.log("Email log not saved to database: Unknown error");
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Try to log the failed email
      try {
        await db.executeRawSQL(
          `INSERT INTO email_logs (recipient, subject, content_preview, status)
           VALUES ($1, $2, $3, $4)`,
          [options.to, options.subject, options.html.substring(0, 200), 'failed']
        );
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
      
      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h1 style="color: #333; font-size: 24px;">Your Verification Code</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            Here is your one-time password (OTP) for Zenith authentication:
          </p>
          <div style="margin: 20px 0; text-align: center;">
            <div style="font-size: 32px; letter-spacing: 5px; font-weight: bold; background-color: #eee; padding: 15px; border-radius: 5px;">
              ${otp}
            </div>
          </div>
          <p style="color: #555; font-size: 14px;">
            This code will expire in 10 minutes.
          </p>
          <p style="color: #555; font-size: 14px;">
            If you didn't request this code, please ignore this email or contact support.
          </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Your Zenith Verification Code',
      html
    }, 'authentication');
  }
  
  async sendVerificationEmail(to: string, verificationToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h2 style="color: #4a5568;">Verify Your Email Address</h2>
          <p>Thank you for registering with Zenith. Please click the link below to verify your email address:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a 
              href="${verificationUrl}" 
              style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;"
            >
              Verify Email
            </a>
          </p>
          <p>If you did not create an account with us, you can safely ignore this email.</p>
          <p>This verification link will expire in 24 hours.</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;
    
    return this.sendEmail({
      to,
      subject: 'Verify Your Email Address - Zenith',
      html
    }, 'verification');
  }
  
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h1 style="color: #333; font-size: 24px;">Reset Your Password</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.5;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <div style="margin: 30px 0; text-align: center;">
            <a href="${resetUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p style="color: #555; font-size: 14px;">
            This link will expire in 30 minutes for security reasons.
          </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Reset Your Zenith Password',
      html
    }, 'password-reset');
  }
  
  async sendAssignmentNotification(
    to: string, 
    userName: string,
    assignmentTitle: string,
    dueDate: string,
    clubName?: string,
    assignmentId?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h2 style="color: #4a5568;">New Assignment Available</h2>
          <p>Hello ${userName},</p>
          <p>A new assignment has been posted ${clubName ? `for ${clubName}` : ''}:</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0; color: #4a5568;">${assignmentTitle}</h3>
            <p style="margin: 10px 0 0 0;">Due: ${dueDate}</p>
          </div>
          
          <p style="text-align: center; margin: 25px 0;">
            <a 
              href="${baseUrl}/assignments${assignmentId ? `/${assignmentId}` : ''}" 
              style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;"
            >
              View Assignment
            </a>
          </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;
    
    return this.sendEmail(
      {
        to,
        subject: `New Assignment: ${assignmentTitle}`,
        html
      }, 
      'assignment',
      assignmentId
    );
  }
  
  async sendAssignmentResultNotification(
    to: string, 
    userName: string,
    assignmentTitle: string,
    score?: string,
    assignmentId?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h2 style="color: #4a5568;">Assignment Results Available</h2>
          <p>Hello ${userName},</p>
          <p>Your results for the following assignment are now available:</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0; color: #4a5568;">${assignmentTitle}</h3>
            ${score ? `<p style="margin: 10px 0 0 0;">Score: ${score}</p>` : ''}
          </div>
          
          <p style="text-align: center; margin: 25px 0;">
            <a 
              href="${baseUrl}/assignments${assignmentId ? `/${assignmentId}/results` : ''}" 
              style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;"
            >
              View Results
            </a>
          </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;
    
    return this.sendEmail(
      {
        to,
        subject: `Results Available: ${assignmentTitle}`,
        html
      }, 
      'assignment-result',
      assignmentId
    );
  }
  
  async sendEventNotification(
    to: string, 
    userName: string,
    eventTitle: string,
    eventDate: string,
    eventLocation: string,
    clubName?: string,
    eventId?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0d1829; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
        </div>
        <div style="padding: 20px; background-color: #f9f9f9; border-radius: 0 0 5px 5px;">
          <h2 style="color: #4a5568;">New Event Announced</h2>
          <p>Hello ${userName},</p>
          <p>A new event has been announced ${clubName ? `for ${clubName}` : ''}:</p>
          
          <div style="background-color: #f7fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0; color: #4a5568;">${eventTitle}</h3>
            <p style="margin: 10px 0 0 0;">Date: ${eventDate}</p>
            <p style="margin: 5px 0 0 0;">Location: ${eventLocation}</p>
          </div>
          
          <p style="text-align: center; margin: 25px 0;">
            <a 
              href="${baseUrl}/events${eventId ? `/${eventId}` : ''}" 
              style="background-color: #4f46e5; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;"
            >
              View Event Details
            </a>
          </p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #777;">
          &copy; ${new Date().getFullYear()} Zenith. All rights reserved.
        </div>
      </div>
    `;
    
    return this.sendEmail(
      {
        to,
        subject: `New Event: ${eventTitle}`,
        html
      },
      'event',
      eventId
    );
  }
  
}

// Create a singleton instance
const emailService = new EmailService();
export default emailService;
export { emailService };
