import PrismaDB, { prisma, Database } from './database-consolidated';
import crypto from 'crypto';

interface DeviceInfo {
  deviceName: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  ipAddress?: string;
  lastUsed: Date;
  createdAt: Date;
  expiresAt: Date;
  trustLevel: 'login_only' | 'full_access';
}

export class TrustedDeviceService {
  /**
   * Register a new trusted device for a user
   */
  static async registerTrustedDevice(
    userId: string, 
    deviceInfo: DeviceInfo,
    trustLevel: 'login_only' | 'full_access' = 'login_only'
  ): Promise<string> {
    try {
      // Generate a unique device identifier
      const deviceIdentifier = crypto
        .createHash('sha256')
        .update(`${userId}-${deviceInfo.userAgent}-${Date.now()}`)
        .digest('hex');
      
      // Store device information
      await Database.query(
        `INSERT INTO trusted_devices
         (user_id, device_identifier, device_name, device_type, browser, os, ip_address, trust_level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          userId,
          deviceIdentifier,
          deviceInfo.deviceName || 'Unknown Device',
          deviceInfo.deviceType || 'unknown',
          deviceInfo.browser || null,
          deviceInfo.os || null,
          deviceInfo.ipAddress || null,
          trustLevel
        ]
      );
      
      // Log security event
      await this.logSecurityEvent(userId, 'device_trusted', {
        deviceName: deviceInfo.deviceName,
        ipAddress: deviceInfo.ipAddress,
        trustLevel
      });
      
      return deviceIdentifier;
    } catch (error) {
      console.error('Error registering trusted device:', error);
      throw error;
    }
  }
  
  /**
   * Verify if a device is trusted for a user
   */
  static async verifyTrustedDevice(
    userId: string, 
    deviceIdentifier: string
  ): Promise<{trusted: boolean, trustLevel?: string}> {
    try {
      const result = await Database.query(
        `SELECT trust_level, expires_at
         FROM trusted_devices
         WHERE user_id = $1 AND device_identifier = $2`,
        [userId, deviceIdentifier]
      );
      
      if (result.rows.length === 0) {
        return { trusted: false };
      }
      
      const device = result.rows[0];
      
      // Check if trust has expired
      if (new Date(device.expires_at) < new Date()) {
        // Trust has expired, remove it
        await Database.query(
          `DELETE FROM trusted_devices 
           WHERE user_id = $1 AND device_identifier = $2`,
          [userId, deviceIdentifier]
        );
        return { trusted: false };
      }
      
      // Update last used timestamp
      await Database.query(
        `UPDATE trusted_devices
         SET last_used = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND device_identifier = $2`,
        [userId, deviceIdentifier]
      );
      
      return { trusted: true, trustLevel: device.trust_level };
    } catch (error) {
      console.error('Error verifying trusted device:', error);
      return { trusted: false };
    }
  }
  
  /**
   * Get all trusted devices for a user
   */
  static async getTrustedDevices(userId: string): Promise<TrustedDevice[]> {
    try {
      const result = await Database.query(
        `SELECT 
           id, device_name, device_type, browser, os, ip_address,
           last_used, created_at, expires_at, trust_level
         FROM trusted_devices
         WHERE user_id = $1
         ORDER BY last_used DESC`,
        [userId]
      );
      
      return result.rows.map((row: any) => ({
        id: row.id,
        deviceName: row.device_name,
        deviceType: row.device_type,
        browser: row.browser,
        os: row.os,
        ipAddress: row.ip_address,
        lastUsed: new Date(row.last_used),
        createdAt: new Date(row.created_at),
        expiresAt: new Date(row.expires_at),
        trustLevel: row.trust_level
      }));
    } catch (error) {
      console.error('Error getting trusted devices:', error);
      return [];
    }
  }
  
  /**
   * Remove a trusted device
   */
  static async removeTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
    try {
      const result = await Database.query(
        `DELETE FROM trusted_devices
         WHERE user_id = $1 AND id = $2
         RETURNING id`,
        [userId, deviceId]
      );
      
      if (result.rows.length > 0) {
        // Log security event
        await this.logSecurityEvent(userId, 'device_untrusted', {
          deviceId
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error removing trusted device:', error);
      return false;
    }
  }
  
  /**
   * Remove all trusted devices for a user
   */
  static async removeAllTrustedDevices(userId: string): Promise<number> {
    try {
      const result = await Database.query(
        `DELETE FROM trusted_devices
         WHERE user_id = $1
         RETURNING id`,
        [userId]
      );
      
      const count = result.rows.length;
      
      // Log security event
      if (count > 0) {
        await this.logSecurityEvent(userId, 'all_devices_untrusted', {
          count
        });
      }
      
      return count;
    } catch (error) {
      console.error('Error removing all trusted devices:', error);
      return 0;
    }
  }
  
  /**
   * Get active sessions for a user
   */
  static async getActiveSessions(userId: string): Promise<any[]> {
    try {
      const result = await Database.query(
        `SELECT 
           id, user_agent, ip_address, created_at, last_active_at, device_info
         FROM sessions
         WHERE user_id = $1 AND expires_at > NOW()
         ORDER BY last_active_at DESC`,
        [userId]
      );
      
      return result.rows.map((session: any) => {
        // Parse device info to more readable format
        let deviceName = 'Unknown Device';
        let browser = 'Unknown Browser';
        let os = 'Unknown OS';
        
        try {
          const deviceInfo = session.device_info || {};
          const userAgent = session.user_agent || '';
          
          if (deviceInfo.browser) browser = `${deviceInfo.browser.name} ${deviceInfo.browser.version || ''}`;
          if (deviceInfo.os) os = `${deviceInfo.os.name} ${deviceInfo.os.version || ''}`;
          
          if (deviceInfo.device && deviceInfo.device.type) {
            if (deviceInfo.device.type === 'mobile') deviceName = 'Mobile';
            else if (deviceInfo.device.type === 'tablet') deviceName = 'Tablet';
            else deviceName = 'Desktop';
            
            if (deviceInfo.device.vendor) {
              deviceName = `${deviceInfo.device.vendor} ${deviceName}`;
            }
          }
        } catch (e) {
          console.error('Error parsing device info:', e);
        }
        
        return {
          id: session.id,
          deviceName,
          browser,
          os,
          ipAddress: session.ip_address,
          createdAt: new Date(session.created_at),
          lastActiveAt: new Date(session.last_active_at)
        };
      });
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }
  
  /**
   * Revoke a specific session
   */
  static async revokeSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      const result = await Database.query(
        `DELETE FROM sessions
         WHERE user_id = $1 AND id = $2
         RETURNING id`,
        [userId, sessionId]
      );
      
      if (result.rows.length > 0) {
        // Log security event
        await this.logSecurityEvent(userId, 'session_revoked', {
          sessionId
        });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error revoking session:', error);
      return false;
    }
  }
  
  /**
   * Revoke all sessions except the current one
   */
  static async revokeAllOtherSessions(userId: string, currentSessionId: string): Promise<number> {
    try {
      const result = await Database.query(
        `DELETE FROM sessions
         WHERE user_id = $1 AND id != $2
         RETURNING id`,
        [userId, currentSessionId]
      );
      
      const count = result.rows.length;
      
      // Log security event
      if (count > 0) {
        await this.logSecurityEvent(userId, 'all_other_sessions_revoked', {
          count
        });
      }
      
      return count;
    } catch (error) {
      console.error('Error revoking other sessions:', error);
      return 0;
    }
  }
  
  /**
   * Log a security event
   */
  static async logSecurityEvent(
    userId: string, 
    eventType: string, 
    eventData: any = {},
    ipAddress?: string
  ): Promise<void> {
    try {
      await Database.query(
        `INSERT INTO security_events
         (user_id, event_type, ip_address, event_data)
         VALUES ($1, $2, $3, $4)`,
        [userId, eventType, ipAddress || null, eventData]
      );
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }
}

export default TrustedDeviceService;
