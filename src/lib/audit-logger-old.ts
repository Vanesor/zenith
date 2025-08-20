/**
 * Audit Logger - Centralized audit logging for Zenith
 * Tracks user actions, authentication events, and system changes
 */

import DatabaseClient from './database';

const db = DatabaseClient;

export interface AuditLogEntry {
  id?: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: Date;
}

export interface AuditQuery {
  userId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO audit_logs 
         (user_id, action, resource_type, resource_id, old_values, new_values, metadata, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          entry.user_id || null,
          entry.action,
          entry.resource_type,
          entry.resource_id || null,
          entry.details?.old_values || null,
          entry.details?.new_values || null,
          entry.details || null,
          entry.ip_address || null,
          entry.user_agent || null
        ]
      );

      return true;
    } catch (error) {
      console.error('AuditLogger: Error logging audit entry:', error);
      return false;
    }
  }

  /**
   * Log authentication events
   */
  static async logAuth(
    action: 'login' | 'logout' | 'register' | 'password_change' | 'password_reset' | 'email_verification' | 'otp_verification',
    userId?: string,
    status: 'success' | 'failure' = 'success',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action,
      resource_type: 'auth',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Log user management events
   */
  static async logUserAction(
    action: 'create' | 'update' | 'delete' | 'role_change' | 'profile_update',
    targetUserId: string,
    performedBy?: string,
    status: 'success' | 'failure' = 'success',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: performedBy,
      action: `user_${action}`,
      resource_type: 'user',
      resource_id: targetUserId,
      details: {
        ...details,
        target_user: targetUserId,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Log assignment events
   */
  static async logAssignmentAction(
    action: 'create' | 'update' | 'delete' | 'submit' | 'grade' | 'view',
    assignmentId: string,
    userId?: string,
    status: 'success' | 'failure' = 'success',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `assignment_${action}`,
      resource_type: 'assignment',
      resource_id: assignmentId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Log club events
   */
  static async logClubAction(
    action: 'create' | 'update' | 'delete' | 'join' | 'leave' | 'promote' | 'demote',
    clubId: string,
    userId?: string,
    status: 'success' | 'failure' = 'success',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `club_${action}`,
      resource_type: 'club',
      resource_id: clubId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Log event management events
   */
  static async logEventAction(
    action: 'create' | 'update' | 'delete' | 'register' | 'unregister' | 'attend',
    eventId: string,
    userId?: string,
    status: 'success' | 'failure' = 'success',
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `event_${action}`,
      resource_type: 'event',
      resource_id: eventId,
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Log system events
   */
  static async logSystemAction(
    action: string,
    status: 'success' | 'failure' | 'warning' = 'success',
    details?: Record<string, any>,
    userId?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `system_${action}`,
      resource_type: 'system',
      details: {
        ...details,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent,
      status
    });
  }

  /**
   * Query audit logs with filters
   */
  static async query(filters: AuditQuery = {}): Promise<AuditLogEntry[]> {
    try {
      let query = `SELECT * FROM audit_logs WHERE 1=1`;
      const params: any[] = [];
      let paramCount = 0;

      if (filters.userId) {
        paramCount++;
        query += ` AND user_id = $${paramCount}`;
        params.push(filters.userId);
      }

      if (filters.action) {
        paramCount++;
        query += ` AND action = $${paramCount}`;
        params.push(filters.action);
      }

      if (filters.resourceType) {
        paramCount++;
        query += ` AND resource_type = $${paramCount}`;
        params.push(filters.resourceType);
      }

      if (filters.resourceId) {
        paramCount++;
        query += ` AND resource_id = $${paramCount}`;
        params.push(filters.resourceId);
      }

      if (filters.status) {
        paramCount++;
        query += ` AND status = $${paramCount}`;
        params.push(filters.status);
      }

      if (filters.startDate) {
        paramCount++;
        query += ` AND timestamp >= $${paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        paramCount++;
        query += ` AND timestamp <= $${paramCount}`;
        params.push(filters.endDate);
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters.limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
      }

      if (filters.offset) {
        paramCount++;
        query += ` OFFSET $${paramCount}`;
        params.push(filters.offset);
      }

      const result = await db.query(query, params);

      return result.rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        action: row.action,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        details: row.details ? JSON.parse(row.details) : {},
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        timestamp: row.timestamp,
        status: row.status
      }));
    } catch (error) {
      console.error('AuditLogger: Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit log statistics
   */
  static async getStats(days: number = 7): Promise<{
    totalEntries: number;
    successfulActions: number;
    failedActions: number;
    warningActions: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ user_id: string; count: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Total entries
      const totalResult = await db.query(
        `SELECT COUNT(*) as count FROM audit_logs WHERE timestamp >= $1`,
        [startDate]
      );

      // Status breakdown
      const statusResult = await db.query(
        `SELECT status, COUNT(*) as count FROM audit_logs 
         WHERE timestamp >= $1 GROUP BY status`,
        [startDate]
      );

      // Top actions
      const actionsResult = await db.query(
        `SELECT action, COUNT(*) as count FROM audit_logs 
         WHERE timestamp >= $1 GROUP BY action ORDER BY count DESC LIMIT 10`,
        [startDate]
      );

      // Top users
      const usersResult = await db.query(
        `SELECT user_id, COUNT(*) as count FROM audit_logs 
         WHERE timestamp >= $1 AND user_id IS NOT NULL 
         GROUP BY user_id ORDER BY count DESC LIMIT 10`,
        [startDate]
      );

      const statusCounts = {
        successful: 0,
        failed: 0,
        warning: 0
      };

      statusResult.rows.forEach((row: any) => {
        const count = parseInt(row.count);
        switch (row.status) {
          case 'success':
            statusCounts.successful = count;
            break;
          case 'failure':
            statusCounts.failed = count;
            break;
          case 'warning':
            statusCounts.warning = count;
            break;
        }
      });

      return {
        totalEntries: parseInt(totalResult.rows[0]?.count || '0'),
        successfulActions: statusCounts.successful,
        failedActions: statusCounts.failed,
        warningActions: statusCounts.warning,
        topActions: actionsResult.rows.map((row: any) => ({
          action: row.action,
          count: parseInt(row.count)
        })),
        topUsers: usersResult.rows.map((row: any) => ({
          user_id: row.user_id,
          count: parseInt(row.count)
        }))
      };
    } catch (error) {
      console.error('AuditLogger: Error getting audit stats:', error);
      return {
        totalEntries: 0,
        successfulActions: 0,
        failedActions: 0,
        warningActions: 0,
        topActions: [],
        topUsers: []
      };
    }
  }

  /**
   * Clean up old audit logs
   */
  static async cleanup(olderThanDays: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await db.query(
        `DELETE FROM audit_logs WHERE timestamp < $1`,
        [cutoffDate]
      );

      console.log(`AuditLogger: Cleaned up ${result.rowCount || 0} old audit logs`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('AuditLogger: Error cleaning up audit logs:', error);
      return 0;
    }
  }

  /**
   * Export audit logs to JSON
   */
  static async export(filters: AuditQuery = {}): Promise<AuditLogEntry[]> {
    return this.query({
      ...filters,
      limit: undefined, // Remove limit for export
      offset: undefined // Remove offset for export
    });
  }
}

export default AuditLogger;
