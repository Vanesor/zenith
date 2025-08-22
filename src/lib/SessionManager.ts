/**
 * SessionManager - Centralized session management for Zenith
 * Works with the unified auth system and database client
 */

import { createSession, getSession, deleteSession } from './database';
import { generateToken } from './auth-unified';
import DatabaseClient from './database';

const db = DatabaseClient;

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
}

export interface SessionMetadata {
  ip?: string;
  userAgent?: string;
}

export class SessionManager {
  /**
   * Create a new session for a user
   */
  static async createSession(
    userId: string, 
    expiresAt: Date, 
    metadata?: SessionMetadata
  ): Promise<Session | null> {
    try {
      const sessionToken = generateToken({ userId, sessionId: true }, '24h');
      
      const sessionData = {
        user_id: userId,
        token: sessionToken,
        expires_at: expiresAt,
        ip_address: metadata?.ip,
        user_agent: metadata?.userAgent
      };

      const result = await createSession(sessionData);
      
      if (!result) return null;

      return {
        id: result.id,
        user_id: result.user_id,
        token: result.token,
        expires_at: result.expires_at,
        created_at: result.created_at || new Date(),
        updated_at: result.updated_at || new Date(),
        ip_address: result.ip_address,
        user_agent: result.user_agent,
        is_active: true
      };
    } catch (error) {
      console.error('SessionManager: Error creating session:', error);
      return null;
    }
  }

  /**
   * Validate and retrieve a session by token or session ID
   */
  static async validateSession(sessionIdentifier: string): Promise<Session | null> {
    try {
      // Try to get session by token (sessionIdentifier is the token)
      const result = await getSession(sessionIdentifier);
      
      if (!result) return null;

      // Check if session is expired
      if (new Date(result.expires_at) < new Date()) {
        // Session expired, delete it
        await deleteSession(sessionIdentifier);
        return null;
      }

      return {
        id: result.id,
        user_id: result.user_id,
        token: result.token,
        expires_at: result.expires_at,
        created_at: result.created_at || new Date(),
        updated_at: result.updated_at || new Date(),
        ip_address: result.ip_address,
        user_agent: result.user_agent,
        is_active: true
      };
    } catch (error) {
      console.error('SessionManager: Error validating session:', error);
      return null;
    }
  }

  /**
   * Get session by token
   */
  static async getSession(token: string): Promise<Session | null> {
    return await this.validateSession(token);
  }

  /**
   * Destroy a specific session
   */
  static async destroySession(sessionIdentifier: string): Promise<boolean> {
    try {
      const result = await deleteSession(sessionIdentifier);
      return result;
    } catch (error) {
      console.error('SessionManager: Error destroying session:', error);
      return false;
    }
  }

  /**
   * Destroy all sessions for a user
   */
  static async destroyAllUserSessions(userId: string): Promise<boolean> {
    try {
      // Delete all sessions for the user
      const result = await db.query(
        `UPDATE sessions SET is_active = false WHERE user_id = $1`,
        [userId]
      );
      
      // Also physically delete them
      await db.query(
        `DELETE FROM sessions WHERE user_id = $1`,
        [userId]
      );

      return true;
    } catch (error) {
      console.error('SessionManager: Error destroying user sessions:', error);
      return false;
    }
  }

  /**
   * Clean up expired sessions (background task)
   */
  static async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await db.query(
        `DELETE FROM sessions WHERE expires_at < NOW()`
      );

      console.log(`SessionManager: Cleaned up ${result.rowCount || 0} expired sessions`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('SessionManager: Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  /**
   * Get all active sessions for a user
   */
  static async getUserSessions(userId: string): Promise<Session[]> {
    try {
      const result = await db.query(
        `SELECT * FROM sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
        [userId]
      );

      return result.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        token: row.token,
        expires_at: row.expires_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        is_active: true
      }));
    } catch (error) {
      console.error('SessionManager: Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Update session metadata (IP, user agent, etc.)
   */
  static async updateSessionMetadata(
    sessionToken: string, 
    metadata: SessionMetadata
  ): Promise<boolean> {
    try {
      await db.query(
        `UPDATE sessions SET 
         ip_address = $2, 
         user_agent = $3, 
         updated_at = NOW() 
         WHERE token = $1`,
        [sessionToken, metadata.ip, metadata.userAgent]
      );

      return true;
    } catch (error) {
      console.error('SessionManager: Error updating session metadata:', error);
      return false;
    }
  }

  /**
   * Extend session expiry
   */
  static async extendSession(sessionToken: string, additionalTime: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    try {
      const newExpiryTime = new Date(Date.now() + additionalTime);
      
      await db.query(
        `UPDATE sessions SET 
         expires_at = $2, 
         updated_at = NOW() 
         WHERE token = $1`,
        [sessionToken, newExpiryTime]
      );

      return true;
    } catch (error) {
      console.error('SessionManager: Error extending session:', error);
      return false;
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    recentLogins: number;
  }> {
    try {
      const activeResult = await db.query(
        `SELECT COUNT(*) as count FROM sessions WHERE expires_at > NOW()`
      );

      const expiredResult = await db.query(
        `SELECT COUNT(*) as count FROM sessions WHERE expires_at <= NOW()`
      );

      const recentResult = await db.query(
        `SELECT COUNT(*) as count FROM sessions 
         WHERE created_at > NOW() - INTERVAL '24 hours' AND expires_at > NOW()`
      );

      return {
        totalActive: parseInt(activeResult.rows[0]?.count || '0'),
        totalExpired: parseInt(expiredResult.rows[0]?.count || '0'),
        recentLogins: parseInt(recentResult.rows[0]?.count || '0')
      };
    } catch (error) {
      console.error('SessionManager: Error getting session stats:', error);
      return {
        totalActive: 0,
        totalExpired: 0,
        recentLogins: 0
      };
    }
  }
}

export default SessionManager;
