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
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
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
          entry.old_values || null,
          entry.new_values || null,
          entry.metadata || {},
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
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action,
      resource_type: 'auth',
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log user management events
   */
  static async logUserAction(
    action: 'create' | 'update' | 'delete' | 'role_change' | 'profile_update',
    targetUserId: string,
    performedBy?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: performedBy,
      action: `user_${action}`,
      resource_type: 'user',
      resource_id: targetUserId,
      old_values: oldValues,
      new_values: newValues,
      metadata: {
        target_user: targetUserId,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log assignment events
   */
  static async logAssignmentAction(
    action: 'create' | 'update' | 'delete' | 'submit' | 'grade' | 'view',
    assignmentId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `assignment_${action}`,
      resource_type: 'assignment',
      resource_id: assignmentId,
      old_values: oldValues,
      new_values: newValues,
      metadata: {
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log club events
   */
  static async logClubAction(
    action: 'create' | 'update' | 'delete' | 'join' | 'leave' | 'promote' | 'demote',
    clubId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `club_${action}`,
      resource_type: 'club',
      resource_id: clubId,
      old_values: oldValues,
      new_values: newValues,
      metadata: {
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log event management events
   */
  static async logEventAction(
    action: 'create' | 'update' | 'delete' | 'register' | 'unregister' | 'attend',
    eventId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `event_${action}`,
      resource_type: 'event',
      resource_id: eventId,
      old_values: oldValues,
      new_values: newValues,
      metadata: {
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log chat room events
   */
  static async logChatAction(
    action: 'room_create' | 'room_update' | 'room_delete' | 'room_join' | 'room_leave',
    roomId: string,
    userId?: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `chat_${action}`,
      resource_type: 'chat_room',
      resource_id: roomId,
      old_values: oldValues,
      new_values: newValues,
      metadata: {
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Log system events
   */
  static async logSystemAction(
    action: string,
    resourceType: string,
    resourceId?: string,
    userId?: string,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<boolean> {
    return this.log({
      user_id: userId,
      action: `system_${action}`,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: {
        ...metadata,
        timestamp: new Date().toISOString()
      },
      ip_address: ipAddress,
      user_agent: userAgent
    });
  }

  /**
   * Query audit logs
   */
  static async query(filters: AuditQuery = {}): Promise<any[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.userId) {
      conditions.push(`user_id = $${paramIndex++}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`action = $${paramIndex++}`);
      params.push(filters.action);
    }

    if (filters.resourceType) {
      conditions.push(`resource_type = $${paramIndex++}`);
      params.push(filters.resourceType);
    }

    if (filters.resourceId) {
      conditions.push(`resource_id = $${paramIndex++}`);
      params.push(filters.resourceId);
    }

    if (filters.startDate) {
      conditions.push(`created_at >= $${paramIndex++}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push(`created_at <= $${paramIndex++}`);
      params.push(filters.endDate);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;

    try {
      const query = `
        SELECT 
          id, user_id, action, resource_type, resource_id, 
          old_values, new_values, metadata, ip_address, 
          user_agent, created_at
        FROM audit_logs 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;

      const result = await db.query(query, [...params, limit, offset]);
      return result.rows;
    } catch (error) {
      console.error('AuditLogger: Error querying audit logs:', error);
      return [];
    }
  }

  /**
   * Get audit statistics
   */
  static async getStats(timeframe: 'day' | 'week' | 'month' = 'day'): Promise<any> {
    try {
      const interval = timeframe === 'day' ? '24 hours' : 
                     timeframe === 'week' ? '7 days' : '30 days';

      const result = await db.query(`
        SELECT 
          resource_type,
          action,
          COUNT(*) as count
        FROM audit_logs 
        WHERE created_at >= NOW() - INTERVAL '${interval}'
        GROUP BY resource_type, action
        ORDER BY count DESC
      `);

      return result.rows;
    } catch (error) {
      console.error('AuditLogger: Error getting audit stats:', error);
      return [];
    }
  }
}

export default AuditLogger;
