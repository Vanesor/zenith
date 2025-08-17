export interface EmailTemplateProps {
  title: string;
  content: string;
  actionButton?: {
    text: string;
    url: string;
    color?: string;
  };
  footerText?: string;
}

export const createBaseEmailTemplate = ({
  title,
  content,
  actionButton,
  footerText
}: EmailTemplateProps): string => {
  const currentYear = new Date().getFullYear();
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f8fafc;
      padding: 20px;
      line-height: 1.6;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
      padding: 40px 30px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    
    .header::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
      100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    
    .college-logo {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.3);
    }
    
    .zenith-logo {
      width: 60px;
      height: 60px;
      border-radius: 15px;
      object-fit: cover;
      border: 3px solid rgba(255, 255, 255, 0.4);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    }
    
    .brand-text {
      color: white;
      font-size: 32px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      letter-spacing: 2px;
      position: relative;
      z-index: 1;
    }
    
    .subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      font-weight: 400;
      margin-top: 8px;
      position: relative;
      z-index: 1;
    }
    
    .content {
      background: white;
      padding: 50px 40px;
      position: relative;
    }
    
    .content::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6, #ef4444, #f59e0b);
    }
    
    .content-title {
      color: #1f2937;
      font-size: 28px;
      font-weight: 600;
      margin-bottom: 20px;
      text-align: center;
    }
    
    .content-text {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.7;
      margin-bottom: 30px;
    }
    
    .action-button {
      display: inline-block;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: white;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
      margin: 20px auto;
      display: block;
      width: fit-content;
    }
    
    .action-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 30px rgba(59, 130, 246, 0.4);
    }
    
    .otp-container {
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border: 2px dashed #9ca3af;
      border-radius: 16px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
      position: relative;
      overflow: hidden;
    }
    
    .otp-container::before {
      content: '🔒';
      position: absolute;
      top: -10px;
      right: -10px;
      font-size: 30px;
      opacity: 0.3;
    }
    
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #1f2937;
      font-family: 'Monaco', 'Courier New', monospace;
      background: white;
      padding: 20px 30px;
      border-radius: 12px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
      margin: 10px 0;
      display: inline-block;
    }
    
    .security-note {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-left: 4px solid #f59e0b;
      padding: 20px;
      border-radius: 0 12px 12px 0;
      margin: 30px 0;
    }
    
    .security-note-title {
      color: #92400e;
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .security-note-text {
      color: #b45309;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .footer {
      background: #1f2937;
      padding: 30px;
      text-align: center;
      color: #9ca3af;
    }
    
    .footer-links {
      display: flex;
      justify-content: center;
      gap: 20px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    
    .footer-link {
      color: #60a5fa;
      text-decoration: none;
      font-size: 14px;
      transition: color 0.3s ease;
    }
    
    .footer-link:hover {
      color: #93c5fd;
    }
    
    .footer-text {
      font-size: 12px;
      line-height: 1.5;
    }
    
    .responsive-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    @media only screen and (max-width: 600px) {
      .email-container {
        margin: 10px;
        border-radius: 15px;
      }
      
      .header, .content {
        padding: 30px 20px;
      }
      
      .logo-container {
        flex-direction: column;
        gap: 10px;
      }
      
      .brand-text {
        font-size: 24px;
      }
      
      .content-title {
        font-size: 24px;
      }
      
      .otp-code {
        font-size: 28px;
        letter-spacing: 4px;
        padding: 15px 20px;
      }
      
      .footer-links {
        flex-direction: column;
        gap: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header with Logos -->
    <div class="header">
      <div class="logo-container">
        <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/collegelogo.jpeg" alt="College Logo" class="college-logo" />
        <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/zenithlogo.png" alt="Zenith Logo" class="zenith-logo" />
      </div>
      <div class="brand-text">ZENITH</div>
      <div class="subtitle">Student Management Platform</div>
    </div>
    
    <!-- Main Content -->
    <div class="content">
      <div class="content-title">${title}</div>
      <div class="content-text">${content}</div>
      
      ${actionButton ? `
        <a href="${actionButton.url}" class="action-button" style="background: linear-gradient(135deg, ${actionButton.color || '#3b82f6'} 0%, #8b5cf6 100%);">
          ${actionButton.text}
        </a>
      ` : ''}
    </div>
    
    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/terms" class="footer-link">Terms of Service</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/privacy" class="footer-link">Privacy Policy</a>
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/security" class="footer-link">Security</a>
      </div>
      <div class="footer-text">
        ${footerText || `© ${currentYear} Zenith Platform. All rights reserved.<br>
        This email was sent from a secure server. Please do not reply to this email.`}
      </div>
    </div>
  </div>
</body>
</html>`;
};

export const createOTPTemplate = (otp: string, purpose: string = 'verification'): string => {
  const purposeText = {
    'verification': 'Email Verification',
    '2fa': 'Two-Factor Authentication',
    'login': 'Login Verification',
    'password-reset': 'Password Reset'
  }[purpose] || 'Verification';

  return createBaseEmailTemplate({
    title: `${purposeText} Code`,
    content: `
      <p>Here is your secure verification code for ${purposeText.toLowerCase()}:</p>
      
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">
          This code will expire in <strong>10 minutes</strong>
        </p>
      </div>
      
      <div class="security-note">
        <div class="security-note-title">
          🔐 Security Notice
        </div>
        <div class="security-note-text">
          • Never share this code with anyone<br>
          • Zenith staff will never ask for this code<br>
          • If you didn't request this, please ignore this email
        </div>
      </div>
      
      <p>For your security, please enter this code within the next 10 minutes to complete your ${purposeText.toLowerCase()}.</p>
    `,
    footerText: `This verification code was generated for your Zenith account security. 
                 If you didn't request this code, you can safely ignore this email.`
  });
};

export const createPasswordResetTemplate = (resetUrl: string): string => {
  return createBaseEmailTemplate({
    title: 'Password Reset Request',
    content: `
      <p>We received a request to reset your password for your Zenith account. If you made this request, click the button below to create a new password:</p>
      
      <div class="security-note">
        <div class="security-note-title">
          ⏰ Important
        </div>
        <div class="security-note-text">
          • This link will expire in <strong>30 minutes</strong><br>
          • You can only use this link once<br>
          • If you didn't request this reset, you can safely ignore this email
        </div>
      </div>
      
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; background: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px;">
        ${resetUrl}
      </p>
    `,
    actionButton: {
      text: '🔑 Reset My Password',
      url: resetUrl,
      color: '#ef4444'
    },
    footerText: `If you didn't request a password reset, someone may have entered your email address by mistake. 
                 You can safely ignore this email - your password will not be changed.`
  });
};

export const createWelcomeTemplate = (userName: string, verificationUrl: string): string => {
  return createBaseEmailTemplate({
    title: `Welcome to Zenith, ${userName}!`,
    content: `
      <p>Thank you for joining the Zenith Student Management Platform! We're excited to have you as part of our community.</p>
      
      <p>To get started and access all features, please verify your email address by clicking the button below:</p>
      
      <div style="background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%); padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;">
        <h3 style="color: #1e40af; margin-bottom: 15px;">🎓 What's Next?</h3>
        <p style="color: #3730a3; font-size: 14px; line-height: 1.6;">
          After verification, you'll be able to:<br>
          • Join clubs and committees<br>
          • Access assignments and resources<br>
          • Participate in events and activities<br>
          • Connect with fellow students
        </p>
      </div>
      
      <p>If you have any questions, our support team is here to help!</p>
    `,
    actionButton: {
      text: '✨ Verify Email Address',
      url: verificationUrl,
      color: '#10b981'
    },
    footerText: `Welcome to the Zenith community! We're here to support your academic journey.`
  });
};
