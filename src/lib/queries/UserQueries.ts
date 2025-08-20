/**
 * User Database Operations
 * Optimized PostgreSQL queries for user management
 */

import databaseClient from '../database';
import { QueryResult, PoolClient } from 'pg';
import { createHash } from 'crypto';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  username?: string;
  role: 'admin' | 'coordinator' | 'committee_member' | 'student';
  club_id?: string;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
  is_active: boolean;
}

export interface CreateUserData {
  email: string;
  password_hash: string;
  name: string;
  username?: string;
  role?: string;
  club_id?: string;
}

export class UserQueries {
  /**
   * Find user by ID with caching
   */
  static async findById(userId: string): Promise<User | null> {
    const result = await databaseClient.query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [userId],
      { cache: true }
    );
    
    return result.rows[0] || null;
  }

  /**
   * Find user by email with optimized index usage
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result = await databaseClient.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email],
      { cache: true }
    );
    
    return result.rows[0] || null;
  }

  /**
   * Create user with optimized insertion
   */
  static async create(userData: CreateUserData): Promise<User> {
    const userId = createHash('sha256').update(`${userData.email}-${Date.now()}`).digest('hex').substring(0, 32);
    
    const result = await databaseClient.query(`
      INSERT INTO users (
        id, email, password_hash, name, username, role, club_id, 
        created_at, updated_at, is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true
      ) RETURNING *
    `, [
      userId,
      userData.email.toLowerCase(),
      userData.password_hash,
      userData.name,
      userData.username || null,
      userData.role || 'student',
      userData.club_id || null
    ]);
    
    return result.rows[0];
  }

  /**
   * Update user with optimistic locking
   */
  static async update(userId: string, updateData: Partial<User>): Promise<User> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at' && value !== undefined) {
        fields.push(`${key} = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    const result = await databaseClient.query(`
      UPDATE users 
      SET ${fields.join(', ')}, updated_at = NOW()
      WHERE id = $1 AND is_active = true
      RETURNING *
    `, [userId, ...values]);

    if (result.rows.length === 0) {
      throw new Error('User not found or already deleted');
    }

    return result.rows[0];
  }

  /**
   * Soft delete user
   */
  static async softDelete(userId: string): Promise<void> {
    await databaseClient.query(
      'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Get users by role with pagination
   */
  static async findByRole(role: string, limit: number = 50, offset: number = 0): Promise<User[]> {
    const result = await databaseClient.query(`
      SELECT * FROM users 
      WHERE role = $1 AND is_active = true
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [role, limit, offset]);
    
    return result.rows;
  }

  /**
   * Search users with full-text search
   */
  static async search(searchTerm: string, limit: number = 20): Promise<User[]> {
    const result = await databaseClient.query(`
      SELECT *, 
        ts_rank(to_tsvector('english', name || ' ' || COALESCE(username, '') || ' ' || email), plainto_tsquery('english', $1)) as rank
      FROM users 
      WHERE (
        to_tsvector('english', name || ' ' || COALESCE(username, '') || ' ' || email) @@ plainto_tsquery('english', $1)
        OR name ILIKE $2
        OR username ILIKE $2
        OR email ILIKE $2
      ) AND is_active = true
      ORDER BY rank DESC, created_at DESC
      LIMIT $3
    `, [searchTerm, `%${searchTerm}%`, limit]);
    
    return result.rows;
  }

  /**
   * Get user statistics
   */
  static async getStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    recentSignups: number;
    activeToday: number;
  }> {
    const totalResult = await databaseClient.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    );
    
    const roleResult = await databaseClient.query(`
      SELECT role, COUNT(*) as count 
      FROM users 
      WHERE is_active = true 
      GROUP BY role
    `);
    
    const recentResult = await databaseClient.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE created_at >= NOW() - INTERVAL '7 days' AND is_active = true
    `);
    
    const activeResult = await databaseClient.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login >= NOW() - INTERVAL '1 day' AND is_active = true
    `);

    const byRole: Record<string, number> = {};
    roleResult.rows.forEach((row: any) => {
      byRole[row.role] = parseInt(row.count);
    });

    return {
      total: parseInt(totalResult.rows[0].count),
      byRole,
      recentSignups: parseInt(recentResult.rows[0].count),
      activeToday: parseInt(activeResult.rows[0].count)
    };
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(userId: string): Promise<void> {
    await databaseClient.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [userId]
    );
  }

  /**
   * Get users by club with role information
   */
  static async findByClub(clubId: string): Promise<User[]> {
    const result = await databaseClient.query(`
      SELECT u.*, cm.role as club_role, cm.joined_at as club_joined_at
      FROM users u
      LEFT JOIN club_members cm ON u.id = cm.user_id
      WHERE (u.club_id = $1 OR cm.club_id = $1) AND u.is_active = true
      ORDER BY cm.joined_at ASC, u.created_at ASC
    `, [clubId]);
    
    return result.rows;
  }

  /**
   * Bulk create users in transaction
   */
  static async bulkCreate(usersData: CreateUserData[]): Promise<User[]> {
    return databaseClient.transaction(async (client) => {
      const results: User[] = [];
      
      for (const userData of usersData) {
        const userId = createHash('sha256').update(`${userData.email}-${Date.now()}-${Math.random()}`).digest('hex').substring(0, 32);
        
        const result = await client.query(`
          INSERT INTO users (
            id, email, password_hash, name, username, role, club_id, 
            created_at, updated_at, is_active
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), true
          ) RETURNING *
        `, [
          userId,
          userData.email.toLowerCase(),
          userData.password_hash,
          userData.name,
          userData.username || null,
          userData.role || 'student',
          userData.club_id || null
        ]);
        
        results.push(result.rows[0]);
      }
      
      return results;
    });
  }
}

export default UserQueries;
