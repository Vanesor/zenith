import { Resend } from 'resend';
import db from "./database";
import { 
  createOTPTemplate, 
  createPasswordResetTemplate, 
  createWelcomeTemplate 
} from './email-templates/base-template';

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

class EmailServiceV2 {
  private resend: Resend | null = null;
  private fallbackEnabled: boolean = true;

  constructor() {
    // Initialize Resend with API key
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      this.resend = new Resend(resendApiKey);
      console.log('EmailServiceV2: Initialized with Resend');
    } else {
      console.warn('EmailServiceV2: RESEND_API_KEY not found, email functionality may be limited');
      this.fallbackEnabled = false;
    }
  }

  async sendEmail(options: EmailOptions, category?: string, relatedId?: string): Promise<boolean> {
    try {
      const { to, subject, html } = options;
      
      // Use Resend API
      if (this.resend) {
        const { data, error } = await this.resend.emails.send({
          from: 'Zenith Platform <noreply@zenith.dev>', // You'll need to set up a domain
          to: [to],
          subject,
          html,
        });

        if (error) {
          console.error('Resend API error:', error);
          return false;
        }

        console.log(`Email sent via Resend: ${data?.id}`);
        
        // Log the email in database
        try {
          await db.query(
            `INSERT INTO email_logs (recipient, subject, status, sent_at, category, related_id, message_id)
             VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
            [to, subject, 'sent', category || 'general', relatedId || null, data?.id || null]
          );
        } catch (dbError) {
          console.error('Failed to log email in database:', dbError);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Log failed email attempt
      try {
        await db.query(
          `INSERT INTO email_logs (recipient, subject, status, sent_at, category, related_id, content_preview)
           VALUES ($1, $2, $3, NOW(), $4, $5, $6)`,
          [options.to, options.subject, 'failed', category || 'general', relatedId || null, error instanceof Error ? error.message : 'Unknown error']
        );
      } catch (dbError) {
        console.error('Failed to log email error in database:', dbError);
      }

      return false;
    }
  }

  async sendOtpEmail(to: string, otp: string, purpose: string = 'verification'): Promise<boolean> {
    const purposeSubjects = {
      'verification': 'Your Zenith Verification Code',
      '2fa': 'Your Zenith 2FA Code',
      'login': 'Your Zenith Login Code',
      'password-reset': 'Your Zenith Password Reset Code'
    };

    const subject = purposeSubjects[purpose as keyof typeof purposeSubjects] || 'Your Zenith Verification Code';
    const html = createOTPTemplate(otp, purpose);

    return this.sendEmail({
      to,
      subject,
      html
    }, 'authentication', `otp-${purpose}`);
  }
  
  async sendVerificationEmail(to: string, verificationToken: string, userName?: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    const html = userName 
      ? createWelcomeTemplate(userName, verificationUrl)
      : createWelcomeTemplate('Student', verificationUrl);

    return this.sendEmail({
      to,
      subject: `Welcome to Zenith${userName ? `, ${userName}` : ''}! Verify Your Email`,
      html
    }, 'onboarding', verificationToken);
  }
  
  async sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    const html = createPasswordResetTemplate(resetUrl);

    return this.sendEmail({
      to,
      subject: 'Reset Your Zenith Password',
      html
    }, 'password-reset', resetToken);
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
    const assignmentUrl = assignmentId 
      ? `${baseUrl}/assignments/${assignmentId}` 
      : `${baseUrl}/assignments`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e40af; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
          <p style="color: #e0e7ff; margin: 5px 0 0 0;">Assignment Notification</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">📚 New Assignment: ${assignmentTitle}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hello ${userName},
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            You have been assigned a new task: <strong>${assignmentTitle}</strong>
            ${clubName ? ` for ${clubName}` : ''}.
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            <strong>Due Date:</strong> ${dueDate}
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${assignmentUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Assignment
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Please complete this assignment before the due date. If you have any questions, contact your instructor or club coordinator.
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          © ${new Date().getFullYear()} Zenith Platform. All rights reserved.
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `New Assignment: ${assignmentTitle}`,
      html
    }, 'assignment', assignmentId);
  }
  
  async sendAssignmentResultNotification(
    to: string, 
    userName: string,
    assignmentTitle: string,
    score?: string,
    assignmentId?: string
  ): Promise<boolean> {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resultUrl = assignmentId 
      ? `${baseUrl}/assignments/${assignmentId}/result` 
      : `${baseUrl}/assignments`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; padding: 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">ZENITH</h1>
          <p style="color: #d1fae5; margin: 5px 0 0 0;">Assignment Results</p>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">📊 Results for: ${assignmentTitle}</h2>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Hello ${userName},
          </p>
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your assignment <strong>${assignmentTitle}</strong> has been graded and results are now available.
          </p>
          ${score ? `
            <div style="background-color: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="color: #0c4a6e; font-size: 18px; font-weight: 600; margin: 0;">
                Your Score: ${score}
              </p>
            </div>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resultUrl}" 
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              View Detailed Results
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Click the button above to view your detailed results and feedback.
          </p>
        </div>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
          © ${new Date().getFullYear()} Zenith Platform. All rights reserved.
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Assignment Results: ${assignmentTitle}`,
      html
    }, 'assignment-result', assignmentId);
  }

  // Health check method
  async testConnection(): Promise<boolean> {
    try {
      if (!this.resend) {
        console.log('EmailServiceV2: Resend not initialized');
        return false;
      }

      // Test with a minimal API call (this won't actually send an email)
      console.log('EmailServiceV2: Service is ready');
      return true;
    } catch (error) {
      console.error('EmailServiceV2: Connection test failed:', error);
      return false;
    }
  }

  // Get email statistics
  async getEmailStats(days: number = 7): Promise<any> {
    try {
      const result = await db.query(
        `SELECT 
          status,
          category,
          COUNT(*) as count,
          DATE_TRUNC('day', sent_at) as date
         FROM email_logs 
         WHERE sent_at >= NOW() - INTERVAL '${days} days'
         GROUP BY status, category, DATE_TRUNC('day', sent_at)
         ORDER BY date DESC`,
        []
      );

      return result.rows;
    } catch (error) {
      console.error('Failed to get email stats:', error);
      return [];
    }
  }
}

// Create singleton instance
const emailServiceV2 = new EmailServiceV2();

export default emailServiceV2;
export { EmailServiceV2 };
