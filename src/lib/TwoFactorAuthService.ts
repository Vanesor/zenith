import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import db from './database';
import jwt from 'jsonwebtoken';

export interface User {
  id: string;
  email: string;
  name: string;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  totp_recovery_codes?: string;
  email_otp_enabled: boolean;
}

export interface TwoFactorSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class TwoFactorAuthService {
  // Generate TOTP secret for a user
  static generateTotpSecret(email: string): string {
    return authenticator.generateSecret();
  }

  // Generate QR code for TOTP setup
  static async generateQrCode(email: string, secret: string): Promise<string> {
    const service = 'Zenith Platform';
    const otpauth = authenticator.keyuri(email, service, secret);
    return await QRCode.toDataURL(otpauth);
  }

  // Setup Two-Factor Authentication for a user
  static async setupTwoFactor(userId: string, email: string): Promise<TwoFactorSetupResult> {
    try {
      const secret = this.generateTotpSecret(email);
      const qrCode = await this.generateQrCode(email, secret);
      const backupCodes = this.generateBackupCodes();

      // Store the secret temporarily (not enabling 2FA yet)
      await db.query(
        `UPDATE users SET two_factor_secret = $1, totp_recovery_codes = $2 WHERE id = $3`,
        [secret, JSON.stringify(backupCodes), userId]
      );

      return {
        secret,
        qrCode,
        backupCodes
      };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      throw new Error('Failed to setup two-factor authentication');
    }
  }

  // Verify TOTP code and enable 2FA
  static async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT two_factor_secret FROM users WHERE id = $1`,
        [userId]
      );

      if (!result.rows.length || !result.rows[0].two_factor_secret) {
        return false;
      }

      const secret = result.rows[0].two_factor_secret;
      const isValid = authenticator.verify({ token, secret });

      if (isValid) {
        // Enable 2FA for the user
        await db.query(
          `UPDATE users SET two_factor_enabled = true WHERE id = $1`,
          [userId]
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      return false;
    }
  }

  // Verify TOTP code for login
  static async verifyTotp(userId: string, token: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT two_factor_secret FROM users WHERE id = $1 AND two_factor_enabled = true`,
        [userId]
      );

      if (!result.rows.length || !result.rows[0].two_factor_secret) {
        return false;
      }

      const secret = result.rows[0].two_factor_secret;
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error('Error verifying TOTP:', error);
      return false;
    }
  }

  // Disable Two-Factor Authentication
  static async disableTwoFactor(userId: string): Promise<boolean> {
    try {
      await db.query(
        `UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL, totp_recovery_codes = NULL WHERE id = $1`,
        [userId]
      );
      return true;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    }
  }

  // Generate backup/recovery codes
  static generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  // Verify a recovery code
  static async verifyRecoveryCode(userId: string, providedCode: string): Promise<boolean> {
    try {
      // Get stored recovery codes
      const result = await db.query(
        `SELECT totp_recovery_codes FROM users WHERE id = $1`,
        [userId]
      );
      
      if (!result.rows.length || !result.rows[0].totp_recovery_codes) {
        return false;
      }

      const storedCodes = JSON.parse(result.rows[0].totp_recovery_codes);
      const codeIndex = storedCodes.indexOf(providedCode.toUpperCase());

      if (codeIndex === -1) {
        return false;
      }

      // Remove the used code
      storedCodes.splice(codeIndex, 1);

      // Update the database
      await db.query(
        `UPDATE users SET totp_recovery_codes = $1 WHERE id = $2`,
        [JSON.stringify(storedCodes), userId]
      );

      return true;
    } catch (error) {
      console.error('Error verifying recovery code:', error);
      return false;
    }
  }

  // Generate and send email OTP
  static async generateEmailOtp(userId: string): Promise<boolean> {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.query(
        `UPDATE users SET email_otp = $1, email_otp_expires_at = $2 WHERE id = $3`,
        [hashedOtp, expiresAt, userId]
      );

      // Here you would send the OTP via email
      console.log(`Email OTP for user ${userId}: ${otp}`);
      
      return true;
    } catch (error) {
      console.error('Error generating email OTP:', error);
      return false;
    }
  }

  // Enable email OTP authentication
  static async enableEmailOtp(userId: string): Promise<boolean> {
    try {
      await db.query(
        `UPDATE users SET email_otp_enabled = TRUE, email_otp_verified = TRUE, email_otp_created_at = NOW() WHERE id = $1`,
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error enabling email OTP:', error);
      return false;
    }
  }

  // Verify email OTP
  static async verifyEmailOtp(userId: string, providedOtp: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT email_otp, email_otp_expires_at FROM users WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0 || !result.rows[0].email_otp) {
        return false;
      }

      const storedHash = result.rows[0].email_otp;
      const expiresAt = new Date(result.rows[0].email_otp_expires_at);

      if (new Date() > expiresAt) {
        return false; // OTP expired
      }

      const isValid = await bcrypt.compare(providedOtp, storedHash);

      if (isValid) {
        // Clear the OTP after successful verification
        await db.query(
          `UPDATE users SET email_otp = NULL, email_otp_expires_at = NULL WHERE id = $1`,
          [userId]
        );
      }

      return isValid;
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      return false;
    }
  }

  // Disable email OTP authentication
  static async disableEmailOtp(userId: string): Promise<boolean> {
    try {
      await db.query(
        `UPDATE users SET email_otp_enabled = false, email_otp_enabled_at = NULL WHERE id = $1`,
        [userId]
      );
      
      return true;
    } catch (error) {
      console.error('Error disabling email OTP:', error);
      return false;
    }
  }

  // Create authenticated session token
  static createSessionToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');
  }

  // Check if user has 2FA enabled
  static async isTwoFactorEnabled(userId: string): Promise<boolean> {
    try {
      const result = await db.query(
        `SELECT two_factor_enabled FROM users WHERE id = $1`,
        [userId]
      );

      return result.rows.length > 0 && result.rows[0].two_factor_enabled;
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      return false;
    }
  }
}
