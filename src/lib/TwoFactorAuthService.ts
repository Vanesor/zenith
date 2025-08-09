import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import Database from './database';
import crypto from 'crypto';
import { HashAlgorithms } from 'otplib/core';
import emailService from './EmailService';

export type TwoFactorAuthStatus = {
  enabled: boolean;
  verified?: boolean;
  tempSecret?: string;
  secret?: string; // Permanent secret for verification
  emailOtpEnabled?: boolean; // Whether email OTP is enabled
};

export class TwoFactorAuthService {
  // Default configuration
  private static issuer = 'Zenith Platform';
  private static timeStep = 30; // Default TOTP time step (seconds)

  // Initialize the authenticator with custom settings
  static init() {
    authenticator.options = {
      step: this.timeStep,
      window: 1, // Allow 1 step before and after current time
      digits: 6,
    };
  }

  // Generate a new secret for a user
  static async generateSecret(userId: string, email: string): Promise<string> {
    const secret = authenticator.generateSecret(); // 32 characters by default
    
    // Store secret temporarily (will be verified later)
    await Database.query(
      `UPDATE users 
       SET 
        totp_temp_secret = $1, 
        totp_temp_secret_created_at = NOW()
       WHERE id = $2`,
      [secret, userId]
    );
    
    return secret;
  }

  // Generate a recovery code set for a user
  static async generateRecoveryCodes(userId: string): Promise<string[]> {
    // Generate 10 random recovery codes (12 characters each)
    const codes = Array(10).fill(0).map(() => 
      crypto.randomBytes(6).toString('hex')
    );
    
    // Hash each code before storing
    const hashedCodes = await Promise.all(
      codes.map(async (code) => {
        // Simple hash - in production you may want a more secure method
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        return hash;
      })
    );
    
    // Store hashed codes in the database
    await Database.query(
      `UPDATE users 
       SET 
        totp_recovery_codes = $1
       WHERE id = $2`,
      [JSON.stringify(hashedCodes), userId]
    );
    
    // Return the original unhashed codes to the user (they need to save these)
    return codes;
  }

  // Generate QR code for TOTP setup
  static async generateQrCode(secret: string, email: string): Promise<string> {
    const otpauth = authenticator.keyuri(email, this.issuer, secret);
    
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  // Verify TOTP code
  static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  // Finalize and enable 2FA for a user
  static async enable2FA(userId: string): Promise<boolean> {
    try {
      // Move temporary secret to permanent secret
      const result = await Database.query(
        `UPDATE users 
         SET 
          totp_secret = totp_temp_secret,
          totp_temp_secret = NULL,
          totp_temp_secret_created_at = NULL,
          totp_enabled = true,
          totp_enabled_at = NOW()
         WHERE id = $1 AND totp_temp_secret IS NOT NULL
         RETURNING id`,
        [userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  // Disable 2FA for a user
  static async disable2FA(userId: string): Promise<boolean> {
    try {
      const result = await Database.query(
        `UPDATE users 
         SET 
          totp_secret = NULL,
          totp_enabled = false,
          totp_enabled_at = NULL,
          totp_recovery_codes = NULL
         WHERE id = $1
         RETURNING id`,
        [userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  // Verify a recovery code
  static async verifyRecoveryCode(userId: string, providedCode: string): Promise<boolean> {
    try {
      // Get stored recovery codes
      const result = await Database.query(
        `SELECT totp_recovery_codes FROM users WHERE id = $1`,
        [userId]
      );
      
      if (!result.rows.length || !result.rows[0].totp_recovery_codes) {
        return false;
      }
      
      // Hash the provided code
      const providedCodeHash = crypto.createHash('sha256').update(providedCode).digest('hex');
      
      // Parse stored codes
      const storedCodes = JSON.parse(result.rows[0].totp_recovery_codes);
      
      // Check if the provided code matches any stored code
      const matchIndex = storedCodes.findIndex((code: string) => code === providedCodeHash);
      
      if (matchIndex === -1) {
        return false;
      }
      
      // Remove used recovery code and update database
      storedCodes.splice(matchIndex, 1);
      
      await Database.query(
        `UPDATE users SET totp_recovery_codes = $1 WHERE id = $2`,
        [JSON.stringify(storedCodes), userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return false;
    }
  }

  // Get user's 2FA status
  static async get2FAStatus(userId: string): Promise<TwoFactorAuthStatus> {
    try {
      const result = await Database.query(
        `SELECT 
          totp_enabled, 
          totp_temp_secret,
          totp_secret,
          email_otp_enabled
         FROM users 
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0) {
        return { enabled: false };
      }
      
      const { totp_enabled, totp_temp_secret, totp_secret, email_otp_enabled } = result.rows[0];
      
      return { 
        enabled: totp_enabled === true || email_otp_enabled === true,
        tempSecret: totp_temp_secret || undefined,
        secret: totp_secret || undefined,
        verified: totp_enabled === true,
        emailOtpEnabled: email_otp_enabled === true
      };
      
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      return { enabled: false };
    }
  }

  // Generate and send email OTP
  static async generateAndSendEmailOTP(userId: string, email: string): Promise<boolean> {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Hash the OTP for storage
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      
      // Store hashed OTP in database with expiration (10 minutes)
      await Database.query(
        `UPDATE users 
         SET 
          email_otp = $1, 
          email_otp_created_at = NOW(),
          email_otp_expires_at = NOW() + INTERVAL '10 minutes'
         WHERE id = $2`,
        [hashedOtp, userId]
      );
      
      // Send OTP via email
      const emailSent = await emailService.sendOtpEmail(email, otp);
      
      return emailSent;
    } catch (error) {
      console.error('Error generating and sending email OTP:', error);
      return false;
    }
  }
  
  // Verify email OTP
  static async verifyEmailOTP(userId: string, providedOtp: string): Promise<boolean> {
    try {
      // Hash the provided OTP for comparison
      const hashedOtp = crypto.createHash('sha256').update(providedOtp).digest('hex');
      
      // Check if OTP is valid and not expired
      const result = await Database.query(
        `SELECT id FROM users 
         WHERE id = $1 
         AND email_otp = $2 
         AND email_otp_expires_at > NOW()`,
        [userId, hashedOtp]
      );
      
      if (result.rows.length === 0) {
        return false;
      }
      
      // Clear the OTP after successful verification
      await Database.query(
        `UPDATE users 
         SET 
          email_otp = NULL, 
          email_otp_created_at = NULL,
          email_otp_expires_at = NULL
         WHERE id = $1`,
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return false;
    }
  }
  
  // Enable email OTP as 2FA method
  static async enableEmailOTP(userId: string): Promise<boolean> {
    try {
      const result = await Database.query(
        `UPDATE users 
         SET 
          email_otp_enabled = true,
          email_otp_enabled_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error enabling email OTP:', error);
      return false;
    }
  }
  
  // Disable email OTP as 2FA method
  static async disableEmailOTP(userId: string): Promise<boolean> {
    try {
      const result = await Database.query(
        `UPDATE users 
         SET 
          email_otp_enabled = false,
          email_otp_enabled_at = NULL
         WHERE id = $1
         RETURNING id`,
        [userId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error disabling email OTP:', error);
      return false;
    }
  }
}

// Initialize the authenticator
TwoFactorAuthService.init();

export default TwoFactorAuthService;
