import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import db from "./database";
import emailService from './EmailService';
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

export class PrismaTwoFactorAuthService {
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
    
    // Store secret temporarily (will be verified later) using db
    await db.setupTOTP(userId, secret, true);
    
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
    
    // Store hashed codes in the database using db
    await db.storeRecoveryCodes(userId, hashedCodes);
    
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

  // Verify setup and finalize 2FA activation
  static async verifyAndActivate(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's temporary secret
      const twoFAStatus = await db.get2FAStatus(userId);
      
      if (!twoFAStatus.tempSecret) {
        console.error('No temporary secret found for 2FA setup');
        return false;
      }
      
      // Verify the token against the temporary secret
      const isValid = this.verifyToken(token, twoFAStatus.tempSecret);
      
      if (!isValid) {
        return false;
      }
      
      // Activate 2FA by storing the secret permanently
      await db.setupTOTP(userId, twoFAStatus.tempSecret, false);
      
      // Generate recovery codes for the user
      await this.generateRecoveryCodes(userId);
      
      return true;
    } catch (error) {
      console.error('Error verifying and activating 2FA:', error);
      return false;
    }
  }

  // Disable 2FA for a user
  static async disable2FA(userId: string): Promise<boolean> {
    try {
      return await db.disable2FA(userId);
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  // Get a user's 2FA status
  static async get2FAStatus(userId: string): Promise<TwoFactorAuthStatus> {
    try {
      return await db.get2FAStatus(userId);
    } catch (error) {
      console.error('Error getting 2FA status:', error);
      return { enabled: false };
    }
  }

  // Email OTP methods
  static async generateEmailOTP(userId: string, email: string): Promise<string> {
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Generate a secret for this OTP session
    const secret = crypto.randomBytes(16).toString('hex');
    
    // Store the OTP and secret using db
    await db.setupEmailOTP(userId, otp, secret);
    
    // Send the OTP email
    await emailService.sendEmail({
      to: email,
      subject: 'Your Zenith verification code',
      text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`
    });
    
    return secret; // Return the secret for verification
  }

  // Verify Email OTP
  static async verifyEmailOTP(userId: string, otp: string): Promise<boolean> {
    try {
      return await db.verifyEmailOTP(userId, otp);
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return false;
    }
  }

  // Trusted device management
  static async trustDevice(
    userId: string,
    deviceInfo: {
      deviceId: string;
      userAgent: string;
      ipAddress: string;
    },
    trustLevel: 'login_only' | 'full' = 'login_only'
  ): Promise<string | null> {
    try {
      const parser = new UAParser(deviceInfo.userAgent);
      const browser = parser.getBrowser();
      const os = parser.getOS();
      const device = parser.getDevice();
      
      // Create a user-friendly device name
      const browserName = browser.name || 'Unknown Browser';
      const osName = os.name || 'Unknown OS';
      const deviceType = device.type || 'desktop';
      
      const deviceName = `${browserName} on ${osName} (${deviceType})`;
      
      // Add trusted device using db
      const deviceId = await db.addTrustedDevice(userId, {
        device_identifier: deviceInfo.deviceId,
        device_name: deviceName,
        device_type: deviceType,
        browser: browserName,
        os: osName,
        ip_address: deviceInfo.ipAddress,
        trust_level: trustLevel
      });
      
      return deviceId;
    } catch (error) {
      console.error('Error trusting device:', error);
      return null;
    }
  }

  // Check if a device is trusted
  static async isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      return await db.isTrustedDevice(userId, deviceId);
    } catch (error) {
      console.error('Error checking trusted device:', error);
      return false;
    }
  }

  // Get all trusted devices for a user
  static async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      return await db.getTrustedDevices(userId);
    } catch (error) {
      console.error('Error getting trusted devices:', error);
      return [];
    }
  }

  // Remove a trusted device
  static async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      return await db.removeTrustedDevice(userId, deviceId);
    } catch (error) {
      console.error('Error removing trusted device:', error);
      return false;
    }
  }

  // Update trusted device last used timestamp
  static async updateTrustedDeviceUsage(userId: string, deviceId: string): Promise<boolean> {
    try {
      return await db.updateTrustedDeviceLastUsed(userId, deviceId);
    } catch (error) {
      console.error('Error updating trusted device usage:', error);
      return false;
    }
  }
}

// Export singleton
export default PrismaTwoFactorAuthService;
