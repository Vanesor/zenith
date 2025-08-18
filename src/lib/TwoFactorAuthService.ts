import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import db, { prismaClient as prisma } from "./database";
import crypto from 'crypto';
import { HashAlgorithms } from 'otplib/core';
import emailServiceV2 from './EmailServiceV2';
import { TrustedDeviceService } from './TrustedDeviceService';
import { UAParser } from 'ua-parser-js';

export type TwoFactorAuthStatus = {
  enabled: boolean;
  verified?: boolean;
  tempSecret?: string;
  secret?: string; // Permanent secret for verification
  emailOtpEnabled?: boolean; // Whether email OTP is enabled
  method?: '2fa_app' | 'email_otp'; // Method used for 2FA
  trustedDevice?: boolean; // Whether the current device is trusted
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
    await db.users.update({
      where: { id: userId },
      data: {
        totp_temp_secret: secret,
        totp_temp_secret_created_at: new Date()
      }
    });
    
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
    
    // Store hashed codes in the database using Prisma
    await db.users.update({
      where: { id: userId },
      data: {
        totp_recovery_codes: JSON.stringify(hashedCodes) as any
      }
    });
    
    // Return the original unhashed codes to the user (they need to save these)
    return codes;
  }

  // Generate QR code for TOTP setup
  static async generateQrCode(secret: string, email: string): Promise<string> {
    console.log('🔍 Generating QR code for:', email);
    const otpauth = authenticator.keyuri(email, this.issuer, secret);
    console.log('✅ OTP URI:', otpauth);
    
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(otpauth);
      console.log('✅ QR code generated, length:', qrCodeDataUrl.length);
      return qrCodeDataUrl;
    } catch (error) {
      console.error('❌ QR code generation failed:', error);
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
      // Get the temp secret first
      const user = await db.users.findUnique({
        where: { id: userId },
        select: { totp_temp_secret: true }
      });
      
      if (!user?.totp_temp_secret) {
        return false;
      }
      
      // Move temporary secret to permanent secret
      const result = await db.users.update({
        where: { id: userId },
        data: {
          totp_secret: user.totp_temp_secret,
          totp_temp_secret: null,
          totp_temp_secret_created_at: null,
          totp_enabled: true,
          totp_enabled_at: new Date()
        },
        select: { id: true }
      });
      
      return !!result;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  // Disable 2FA for a user
  static async disable2FA(userId: string): Promise<boolean> {
    try {
      const result = await db.executeRawSQL(
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
      const result = await db.executeRawSQL(
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
      
      await db.executeRawSQL(
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
  static async get2FAStatus(userId: string, deviceId?: string): Promise<TwoFactorAuthStatus> {
    try {
      const result = await db.users.findUnique({
        where: { id: userId },
        select: {
          totp_enabled: true,
          totp_temp_secret: true,
          totp_secret: true,
          email_otp_enabled: true
        }
      });
      
      if (!result) {
        return { enabled: false };
      }
      
      const { totp_enabled, totp_temp_secret, totp_secret, email_otp_enabled } = result;
      
      // Check if this is a trusted device
      let trustedDevice = false;
      let method: '2fa_app' | 'email_otp' | undefined = undefined;
      
      if (deviceId) {
        const trustStatus = await TrustedDeviceService.verifyTrustedDevice(userId, deviceId);
        trustedDevice = trustStatus.trusted;
      }
      
      // Determine 2FA method
      if (totp_enabled) {
        method = '2fa_app';
      } else if (email_otp_enabled) {
        method = 'email_otp';
      }
      
      return { 
        enabled: totp_enabled === true || email_otp_enabled === true,
        tempSecret: totp_temp_secret || undefined,
        secret: totp_secret || undefined,
        verified: totp_enabled === true,
        emailOtpEnabled: email_otp_enabled === true,
        method,
        trustedDevice
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
      
      // Hash the OTP for storage - will be stored in the updated CHAR(64) field
      const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
      
      // Store hashed OTP in database with expiration (10 minutes)
      await db.executeRawSQL(
        `UPDATE users 
         SET 
          email_otp = $1, 
          email_otp_created_at = NOW(),
          email_otp_expires_at = NOW() + INTERVAL '10 minutes'
         WHERE id = $2`,
        [hashedOtp, userId]
      );
      
      // Send OTP via email
      const emailSent = await emailServiceV2.sendOtpEmail(email, otp, '2fa');
      
      // Log security event if email was sent successfully
      if (emailSent) {
        await TrustedDeviceService.logSecurityEvent(userId, 'email_otp_sent', {
          email: email.replace(/^(.{2})(.*)(@.*)$/, '$1***$3') // Partially mask email for logging
        });
      }
      
      return emailSent;
    } catch (error) {
      console.error('Error generating and sending email OTP:', error);
      return false;
    }
  }
  
  // Enable email OTP as 2FA method
  static async enableEmailOTP(userId: string): Promise<boolean> {
    try {
      const result = await db.executeRawSQL(
        `UPDATE users 
         SET 
          email_otp_enabled = TRUE,
          email_otp_verified = TRUE,
          email_otp_created_at = NOW()
         WHERE id = $1
         RETURNING id`,
        [userId]
      );
      
      const success = result.rows.length > 0;
      
      if (success) {
        await TrustedDeviceService.logSecurityEvent(userId, 'email_otp_enabled', {});
      }
      
      return success;
    } catch (error) {
      console.error('Error enabling email OTP:', error);
      return false;
    }
  }
  
  // Verify email OTP code
  static async verifyEmailOTP(userId: string, otp: string): Promise<boolean> {
    try {
      const result = await db.executeRawSQL(
        `SELECT 
          email_otp,
          email_otp_expires_at
         FROM users 
         WHERE id = $1`,
        [userId]
      );
      
      if (result.rows.length === 0 || !result.rows[0].email_otp) {
        return false;
      }
      
      const storedHash = result.rows[0].email_otp;
      const expiresAt = new Date(result.rows[0].email_otp_expires_at);
      
      // Check if OTP has expired
      if (expiresAt < new Date()) {
        return false;
      }
      
      // Hash the provided OTP and compare
      const providedOtpHash = crypto.createHash('sha256').update(otp).digest('hex');
      
      if (providedOtpHash !== storedHash) {
        // Log failed attempt
        await TrustedDeviceService.logSecurityEvent(userId, 'email_otp_failed', {});
        return false;
      }
      
      // Clear the OTP after successful verification
      await db.executeRawSQL(
        `UPDATE users 
         SET 
          email_otp = NULL,
          email_otp_expires_at = NULL,
          email_otp_last_used = NOW()
         WHERE id = $1`,
        [userId]
      );
      
      await TrustedDeviceService.logSecurityEvent(userId, 'email_otp_verified', {});
      
      return true;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return false;
    }
  }
  
  // Create and trust a device after successful 2FA
  static async trustDevice(
    userId: string, 
    userAgent: string,
    ipAddress?: string,
    trustLevel: 'login_only' | 'full_access' = 'login_only'
  ): Promise<string | null> {
    try {
      let deviceInfo = {
        deviceName: 'Unknown Device',
        deviceType: 'unknown',
        browser: 'Unknown Browser',
        os: 'Unknown OS',
        ipAddress,
        userAgent
      };
      
      // Parse user agent
      if (userAgent) {
        try {
          // Note: We'll install this package later
          const parser = new UAParser(userAgent);
          const result = parser.getResult();
          
          deviceInfo.browser = `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`;
          deviceInfo.os = `${result.os.name || 'Unknown'} ${result.os.version || ''}`;
          
          if (result.device.type) {
            deviceInfo.deviceType = result.device.type;
            if (result.device.type === 'mobile') deviceInfo.deviceName = 'Mobile Device';
            else if (result.device.type === 'tablet') deviceInfo.deviceName = 'Tablet';
            else deviceInfo.deviceName = 'Desktop';
            
            if (result.device.vendor) {
              deviceInfo.deviceName = `${result.device.vendor} ${deviceInfo.deviceName}`;
            }
          } else {
            deviceInfo.deviceName = 'Desktop';
          }
        } catch (e) {
          console.error('Error parsing user agent:', e);
        }
      }
      
      // Register trusted device
      const deviceId = await TrustedDeviceService.registerTrustedDevice(
        userId,
        deviceInfo,
        trustLevel
      );
      
      return deviceId;
    } catch (error) {
      console.error('Error trusting device:', error);
      return null;
    }
  }
  
  // Disable email OTP as 2FA method
  static async disableEmailOTP(userId: string): Promise<boolean> {
    try {
      const result = await db.executeRawSQL(
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
