/**
 * Consolidated Database Service
 * 
 * This file combines and replaces all previous database implementations:
 * - database.ts (legacy)
 * - PrismaDatabase.ts
 * - OptimizedPrismaDB.ts
 * - prisma.ts
 * 
 * It provides a single, unified database interface with Prisma and
 * backward compatibility exports for legacy imports.
 */

import { PrismaClient, Prisma } from '@prisma/client';

// Singleton Prisma client with optimizations for Supabase
class PrismaDatabase {
  private static instance: PrismaDatabase;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
      datasources: {
        db: {
          url: process.env.DIRECT_URL || process.env.DATABASE_URL
        }
      },
      // Optimized error handling
      errorFormat: 'pretty'
    });
    
    // Enable connection pooling optimization at the driver level if needed
    // This is handled by Prisma internally

    // Handle connection cleanup
    process.on('beforeExit', async () => {
      await this.prisma.$disconnect();
    });

    // Handle unexpected shutdowns
    process.on('SIGINT', async () => {
      await this.prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.prisma.$disconnect();
      process.exit(0);
    });
  }

  public static getInstance(): PrismaDatabase {
    if (!PrismaDatabase.instance) {
      PrismaDatabase.instance = new PrismaDatabase();
    }
    return PrismaDatabase.instance;
  }

  // Get Prisma client
  getClient(): PrismaClient {
    return this.prisma;
  }

  // Connection health check with wake-up functionality
  async isHealthy(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error('Prisma health check failed:', error);
      
      // Try to wake up the database with a simple reconnection
      try {
        await this.prisma.$disconnect();
        // Small delay before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.prisma.$queryRaw`SELECT 1`;
        console.log('Database connection restored after reconnection');
        return true;
      } catch (reconnectError) {
        console.error('Database reconnection failed:', reconnectError);
        return false;
      }
    }
  }

  // ==================== User Operations ====================
  
  // Get a user by ID (alias for findUserById for compatibility)
  async getUserById(id: string) {
    return this.findUserById(id);
  }

  // Optimized authentication queries using existing database structure
  async findUserByEmail(email: string) {
    try {
      // Use Prisma's type-safe query builder instead of raw SQL
      // This provides better security against SQL injection and type safety
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          password_hash: true,
          role: true,
          avatar: true,
          email_verified: true,
          created_at: true,
          club_id: true,
          totp_enabled: true
        }
      });
      
      // Transform to match expected output format
      if (user) {
        return {
          ...user,
          verified: user.email_verified,
          two_factor_enabled: user.totp_enabled
        };
      }
      return null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findUserById(id: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT id, email, name, role, avatar, email_verified as verified, 
               created_at, last_activity, club_id
        FROM users 
        WHERE id = ${id}::uuid
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  async createUser(userData: {
    email: string;
    name: string;
    password: string;
    role?: string;
    avatar?: string;
  }) {
    try {
      // Use Prisma's built-in types for better type safety and security
      // This also allows Prisma to optimize the query
      const user = await this.prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          password_hash: userData.password,
          role: userData.role || 'student',
          avatar: userData.avatar || null,
          email_verified: true
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          created_at: true
        }
      });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // ==================== Committee Operations ====================

  async getMainCommittee() {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          c.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', cr.id,
                'name', cr.name,
                'description', cr.description,
                'hierarchy', cr.hierarchy,
                'permissions', cr.permissions
              )
              ORDER BY cr.hierarchy
            ) FILTER (WHERE cr.id IS NOT NULL), 
            '[]'::json
          ) as committee_roles,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', cmd.id,
                  'user_id', cmd.user_id,
                  'role_id', cmd.role_id,
                  'status', cmd.status,
                  'joined_at', cmd.joined_at,
                  'term_start', cmd.term_start,
                  'term_end', cmd.term_end,
                  'achievements', cmd.achievements,
                  'user', json_build_object(
                    'id', cmd.user_id,
                    'name', cmd.user_name,
                    'email', cmd.user_email,
                    'avatar', cmd.user_avatar,
                    'role', cmd.user_role
                  )
                )
              )
              FROM committee_member_details cmd
              WHERE cmd.committee_id = c.id
            ),
            '[]'::json
          ) as committee_members
        FROM committees c
        LEFT JOIN committee_roles cr ON cr.committee_id = c.id
        WHERE c.name = 'Zenith Main Committee' AND c.is_active = true
        GROUP BY c.id
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting main committee:', error);
      return null;
    }
  }

  // ==================== Club Operations ====================

  async getAllClubs(limit = 20, offset = 0) {
    try {
      // More optimized query that includes member_count from the schema
      // This avoids separate queries for each club's stats
      const clubs = await this.prisma.club.findMany({
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          created_at: true,
          logo_url: true,
          banner_image_url: true,
          type: true,
          icon: true,
          color: true,
          member_count: true,
          _count: {
            select: {
              events: true,  // Count related events
            }
          }
        }
      });
      
      // Transform to add event_count property
      return clubs.map(club => ({
        ...club,
        event_count: club._count?.events || 0,
        _count: undefined // Remove the _count property from result
      }));
    } catch (error) {
      console.error('Error getting clubs:', error);
      return [];
    }
  }
  
  async getEventsByClub(clubId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM events
        WHERE club_id = ${clubId}
        ORDER BY event_date DESC
      `;
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getEventsByClub:', error);
      return [];
    }
  }
  
  async getPostsByClub(clubId: string, limit?: number) {
    try {
      const query = limit
        ? this.prisma.$queryRaw`
            SELECT p.*, u.name as author_name, u.avatar as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.club_id = ${clubId}
            ORDER BY p.created_at DESC
            LIMIT ${limit}
          `
        : this.prisma.$queryRaw`
            SELECT p.*, u.name as author_name, u.avatar as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.club_id = ${clubId}
            ORDER BY p.created_at DESC
          `;
          
      return await query;
    } catch (error) {
      console.error('Error in getPostsByClub:', error);
      return [];
    }
  }
  
  async getCommentsByPost(postId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT c.*, u.name as author_name, u.avatar as author_avatar
        FROM comments c
        LEFT JOIN users u ON c.author_id = u.id
        WHERE c.post_id = ${postId}::uuid
        ORDER BY c.created_at ASC
      `;
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getCommentsByPost:', error);
      return [];
    }
  }

  async getClubById(id: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT cas.*, 
               COALESCE(
                 (
                   SELECT json_agg(
                     json_build_object(
                       'id', cm.id,
                       'user_id', cm.user_id,
                       'is_leader', cm.is_leader,
                       'joined_at', cm.joined_at,
                       'user', json_build_object(
                         'id', u.id,
                         'name', u.name,
                         'email', u.email,
                         'avatar', u.avatar
                       )
                     )
                   )
                   FROM club_members cm
                   JOIN users u ON cm.user_id = u.id
                   WHERE cm.club_id = cas.id
                 ),
                 '[]'::json
               ) as members
        FROM club_activity_summary cas
        WHERE cas.id = ${id}
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting club by ID:', error);
      return null;
    }
  }

  async getClubMembers(clubId: string, limit?: number) {
    try {
      const query = limit
        ? this.prisma.$queryRaw`
            SELECT 
              cm.id as membership_id,
              cm.user_id,
              cm.is_leader,
              cm.joined_at,
              u.name,
              u.email,
              u.avatar,
              u.role
            FROM club_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = ${clubId}
            ORDER BY cm.is_leader DESC, u.name ASC
            LIMIT ${limit}
          `
        : this.prisma.$queryRaw`
            SELECT 
              cm.id as membership_id,
              cm.user_id,
              cm.is_leader,
              cm.joined_at,
              u.name,
              u.email,
              u.avatar,
              u.role
            FROM club_members cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.club_id = ${clubId}
            ORDER BY cm.is_leader DESC, u.name ASC
          `;
          
      const result = await query;
      return result;
    } catch (error) {
      console.error('Error getting club members:', error);
      return [];
    }
  }

  async getClubLeadership(clubId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          c.coordinator_id,
          c.co_coordinator_id,
          c.secretary_id,
          c.media_id,
          coordinator.name as coordinator_name,
          coordinator.email as coordinator_email,
          coordinator.avatar as coordinator_avatar,
          coCoordinator.name as co_coordinator_name,
          coCoordinator.email as co_coordinator_email,
          coCoordinator.avatar as co_coordinator_avatar,
          secretary.name as secretary_name,
          secretary.email as secretary_email,
          secretary.avatar as secretary_avatar,
          media.name as media_name,
          media.email as media_email,
          media.avatar as media_avatar
        FROM clubs c
        LEFT JOIN users coordinator ON c.coordinator_id = coordinator.id
        LEFT JOIN users coCoordinator ON c.co_coordinator_id = coCoordinator.id
        LEFT JOIN users secretary ON c.secretary_id = secretary.id
        LEFT JOIN users media ON c.media_id = media.id
        WHERE c.id = ${clubId}
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : {};
    } catch (error) {
      console.error('Error in getClubLeadership:', error);
      return {};
    }
  }
  
  // Club membership management
  async joinClub(userId: string, clubId: string): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET club_id = ${clubId}::uuid
        WHERE id = ${userId}::uuid
      `;
      return true;
    } catch (error) {
      console.error("Error joining club:", error);
      return false;
    }
  }

  async leaveClub(userId: string): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET club_id = NULL
        WHERE id = ${userId}::uuid
      `;
      return true;
    } catch (error) {
      console.error("Error leaving club:", error);
      return false;
    }
  }

  async switchClub(userId: string, newClubId: string): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET club_id = ${newClubId}::uuid
        WHERE id = ${userId}::uuid
      `;
      return true;
    } catch (error) {
      console.error("Error switching club:", error);
      return false;
    }
  }

  async getUserClub(userId: string) {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.club_id) return null;
      return this.getClubById(user.club_id);
    } catch (error) {
      console.error("Error getting user club:", error);
      return null;
    }
  }

  // ==================== Event Operations ====================
  
  async getAllEvents(userId: string, limit?: number, clubId?: string) {
    try {
      // First, query the events with basic information
      const events = await this.prisma.event.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          event_date: true,
          event_time: true,
          location: true,
          max_attendees: true,
          status: true,
          // Removed 'category' as it doesn't exist in EventSelect type
          club_id: true,
          created_by: true,
          // Include only the fields that exist in the schema
        },
        where: clubId ? {
          club_id: clubId
        } : undefined,
        orderBy: {
          event_date: 'desc'
        },
        ...(limit ? { take: limit } : {})
      });
      
      // In a separate query, get the club information for all events efficiently
      const clubIds = events.map(event => event.club_id).filter(Boolean);
      const clubs = await this.prisma.club.findMany({
        where: {
          id: {
            in: clubIds as string[]
          }
        },
        select: {
          id: true,
          name: true,
          color: true
        }
      });
      const clubsMap = new Map(clubs.map(club => [club.id, club]));
      
      // Get user information for creators
      const creatorIds = events.map(event => event.created_by).filter(Boolean);
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            in: creatorIds as string[]
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      const usersMap = new Map(users.map(user => [user.id, user]));
      
      // Check which events the user is attending
      const eventIds = events.map(event => event.id);
      const attendances = await this.prisma.event_attendees.findMany({
        where: {
          event_id: {
            in: eventIds
          },
          user_id: userId
        },
        select: {
          event_id: true
        }
      });
      const attendingEventIds = new Set(attendances.map((a: { event_id: string | null }) => a.event_id).filter((id): id is string => id !== null));
      
      // Transform the result to match the expected format
      return events.map(event => {
        const clubInfo = event.club_id ? clubsMap.get(event.club_id) : null;
        const creatorInfo = event.created_by ? usersMap.get(event.created_by) : null;
        
        return {
          ...event,
          club_name: clubInfo?.name || null,
          club_color: clubInfo?.color || null,
          organizer_name: creatorInfo?.name || null,
          attendee_count: 0, // This would need a separate count query
          is_attending: attendingEventIds.has(event.id)
        };
      });
    } catch (error) {
      console.error('Error in getAllEvents:', error);
      return [];
    }
  }
  
  async getEventById(eventId: string, userId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          e.*,
          c.name as club_name,
          c.color as club_color,
          u.name as organizer_name,
          COALESCE(
            (SELECT COUNT(*) FROM event_attendees WHERE event_id = ${eventId}::uuid), 
            0
          ) as attendee_count,
          EXISTS(
            SELECT 1 FROM event_attendees 
            WHERE event_id = ${eventId}::uuid AND user_id = ${userId}::uuid
          ) as is_attending
        FROM events e
        JOIN clubs c ON e.club_id = c.id
        JOIN users u ON e.created_by = u.id
        WHERE e.id = ${eventId}::uuid
        LIMIT 1
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error in getEventById:', error);
      return null;
    }
  }
  
  async getEventAttendees(eventId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          u.id, u.name, u.email, u.avatar, u.role,
          ea.registered_at, ea.attendance_status
        FROM event_attendees ea
        JOIN users u ON ea.user_id = u.id
        WHERE ea.event_id = ${eventId}::uuid
        ORDER BY ea.registered_at DESC
      `;
      
      return result;
    } catch (error) {
      console.error('Error in getEventAttendees:', error);
      return [];
    }
  }
  
  async createEvent(eventData: {
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    club_id: string;
    created_by: string;
    max_attendees?: number;
    status?: string;
    image_url?: string;
  }) {
    try {
      const result = await this.prisma.$queryRaw`
        INSERT INTO events (
          title,
          description,
          event_date,
          event_time,
          location,
          club_id,
          created_by,
          max_attendees,
          status,
          image_url
        ) VALUES (
          ${eventData.title},
          ${eventData.description},
          ${eventData.event_date},
          ${eventData.event_time},
          ${eventData.location},
          ${eventData.club_id},
          ${eventData.created_by}::uuid,
          ${eventData.max_attendees || null},
          ${eventData.status || 'upcoming'},
          ${eventData.image_url || null}
        ) RETURNING id
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error in createEvent:', error);
      return null;
    }
  }
  
  async updateEvent(eventData: {
    id: string;
    title: string;
    description: string;
    event_date: string;
    event_time: string;
    location: string;
    max_attendees?: number;
    status?: string;
    image_url?: string;
  }) {
    try {
      const result = await this.prisma.$queryRaw`
        UPDATE events SET
          title = ${eventData.title},
          description = ${eventData.description},
          event_date = ${eventData.event_date},
          event_time = ${eventData.event_time},
          location = ${eventData.location},
          max_attendees = ${eventData.max_attendees || null},
          status = ${eventData.status || 'upcoming'},
          image_url = ${eventData.image_url || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${eventData.id}::uuid
        RETURNING id
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error in updateEvent:', error);
      return null;
    }
  }

  // ==================== Post Operations ====================

  async getPosts(limit = 20, offset = 0, searchQuery?: string) {
    try {
      let query;
      if (searchQuery) {
        query = this.prisma.$queryRaw`
          SELECT p.*, 
                 u.name as author_name,
                 u.avatar as author_avatar,
                 c.name as club_name,
                 c.logo_url as club_logo
          FROM posts p
          JOIN users u ON p.author_id = u.id
          LEFT JOIN clubs c ON p.club_id = c.id
          WHERE p.search_vector @@ plainto_tsquery(${searchQuery})
          ORDER BY ts_rank(p.search_vector, plainto_tsquery(${searchQuery})) DESC,
                   p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        query = this.prisma.$queryRaw`
          SELECT p.*, 
                 u.name as author_name,
                 u.avatar as author_avatar,
                 c.name as club_name,
                 c.logo_url as club_logo
          FROM posts p
          JOIN users u ON p.author_id = u.id
          LEFT JOIN clubs c ON p.club_id = c.id
          ORDER BY p.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting posts:', error);
      return [];
    }
  }

  async getAllPosts(limit?: number) {
    try {
      const query = limit
        ? this.prisma.$queryRaw`
            SELECT p.*, u.name as author_name, u.avatar as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
            LIMIT ${limit}
          `
        : this.prisma.$queryRaw`
            SELECT p.*, u.name as author_name, u.avatar as author_avatar
            FROM posts p
            LEFT JOIN users u ON p.author_id = u.id
            ORDER BY p.created_at DESC
          `;
          
      return await query;
    } catch (error) {
      console.error('Error getting all posts:', error);
      return [];
    }
  }

  // ==================== Dashboard Operations ====================

  async getUserDashboard(userId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM user_dashboard
        WHERE id = ${userId}::uuid
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting user dashboard:', error);
      return null;
    }
  }

  async getRecentActivity(limit = 50) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM recent_activity
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      return result;
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return [];
    }
  }

  // ==================== Session Management ====================

  async createSession(sessionData: {
    user_id: string;
    token: string;
    expires_at: Date;
    user_agent?: string;
    ip_address?: string;
  }) {
    try {
      const result = await this.prisma.$queryRaw`
        INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address, last_active_at)
        VALUES (${sessionData.user_id}::uuid, ${sessionData.token}, 
                ${sessionData.expires_at}, ${sessionData.user_agent || null},
                ${sessionData.ip_address || null}, NOW())
        RETURNING *
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }
  
  async findSession(token: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT s.*, u.id as user_id, u.email, u.name, u.role, u.avatar
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ${token} AND s.expires_at > NOW()
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error finding session:', error);
      return null;
    }
  }

  async getSession(token: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM sessions
        WHERE token = ${token} AND expires_at > NOW()
        LIMIT 1
      `;
      return Array.isArray(result) && result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(token: string) {
    try {
      await this.prisma.$queryRaw`
        DELETE FROM sessions
        WHERE token = ${token}
      `;
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  }

  // ==================== Notification System ====================

  async createNotification(notificationData: {
    user_id: string;
    title: string;
    message: string;
    type: string;
    data?: any;
    related_id?: string;
    emailOnly?: boolean;
  }) {
    try {
      // Set email_sent to true for email-only notifications
      const emailOnly = notificationData.emailOnly === true;
      
      const result = await this.prisma.$queryRaw`
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          metadata,
          related_id,
          email_sent,
          delivery_method
        ) VALUES (
          ${notificationData.user_id}::uuid,
          ${notificationData.title},
          ${notificationData.message},
          ${notificationData.type},
          ${JSON.stringify(notificationData.data || {})}::jsonb,
          ${notificationData.related_id ? `${notificationData.related_id}::uuid` : null},
          ${emailOnly}, /* mark as email sent if emailOnly */
          ${emailOnly ? 'email' : 'in-app'}
        ) RETURNING id
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  async getUserNotifications(userId: string, limit = 10, offset = 0, includeRead = false) {
    try {
      let query;
      
      if (includeRead) {
        query = this.prisma.$queryRaw`
          SELECT * FROM notifications
          WHERE user_id = ${userId}::uuid
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      } else {
        query = this.prisma.$queryRaw`
          SELECT * FROM notifications
          WHERE user_id = ${userId}::uuid AND read = false
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
      }
      
      return await query;
    } catch (error) {
      console.error('Error in getUserNotifications:', error);
      return [];
    }
  }
  
  async getUnreadNotificationCount(userId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT COUNT(*) as count 
        FROM notifications 
        WHERE user_id = ${userId}::uuid AND read = false
      `;
      
      return Array.isArray(result) && result.length > 0 ? parseInt(result[0].count.toString()) : 0;
    } catch (error) {
      console.error('Error in getUnreadNotificationCount:', error);
      return 0;
    }
  }
  
  async markNotificationRead(notificationId: number, userId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        UPDATE notifications
        SET read = true
        WHERE id = ${notificationId} AND user_id = ${userId}::uuid
        RETURNING id
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error in markNotificationRead:', error);
      return null;
    }
  }
  
  async markAllNotificationsRead(userId: string) {
    try {
      await this.prisma.$queryRaw`
        UPDATE notifications
        SET read = true
        WHERE user_id = ${userId}::uuid AND read = false
      `;
      
      return true;
    } catch (error) {
      console.error('Error in markAllNotificationsRead:', error);
      return false;
    }
  }
  
  async createBatchNotifications(userIds: string[], notification: {
    title: string;
    message: string;
    type: string;
    data?: any;
    related_id?: string;
    emailOnly?: boolean;
  }) {
    try {
      const emailOnly = notification.emailOnly === true;
      
      // For batch notifications, we'll use a raw query
      await this.prisma.$executeRaw`
        INSERT INTO notifications (
          user_id,
          title,
          message,
          type,
          metadata,
          related_id,
          email_sent,
          delivery_method
        )
        SELECT 
          id as user_id,
          ${notification.title} as title,
          ${notification.message} as message,
          ${notification.type} as type,
          ${JSON.stringify(notification.data || {})}::jsonb as metadata,
          ${notification.related_id ? `${notification.related_id}::uuid` : null} as related_id,
          ${emailOnly} as email_sent,
          ${emailOnly ? 'email' : 'in-app'} as delivery_method
        FROM users
        WHERE id = ANY(ARRAY[${userIds.map(id => `${id}::uuid`).join(',')}])
      `;
      
      return true;
    } catch (error) {
      console.error('Error in createBatchNotifications:', error);
      return false;
    }
  }

  // ==================== Two-Factor Authentication ====================

  async get2FAStatus(userId: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          totp_enabled, 
          totp_secret, 
          totp_temp_secret,
          totp_temp_secret_created_at,
          totp_enabled_at,
          totp_recovery_codes,
          email_otp_enabled,
          email_otp_verified,
          email_otp_secret
        FROM users
        WHERE id = ${userId}::uuid
      `;
      
      if (!Array.isArray(result) || result.length === 0) {
        return { enabled: false };
      }
      
      const user = result[0];
      
      return {
        enabled: user.totp_enabled || user.email_otp_enabled || false,
        verified: user.totp_enabled || user.email_otp_verified || false,
        tempSecret: user.totp_temp_secret,
        secret: user.totp_secret,
        emailOtpEnabled: user.email_otp_enabled || false,
        method: user.totp_enabled ? '2fa_app' as const : (user.email_otp_enabled ? 'email_otp' as const : undefined),
        recoveryCodes: user.totp_recovery_codes
      };
    } catch (error) {
      console.error('Error in get2FAStatus:', error);
      return { enabled: false };
    }
  }
  
  async setupTOTP(userId: string, secret: string, isTemp = true) {
    try {
      if (isTemp) {
        await this.prisma.$queryRaw`
          UPDATE users
          SET 
            totp_temp_secret = ${secret},
            totp_temp_secret_created_at = NOW()
          WHERE id = ${userId}::uuid
        `;
      } else {
        await this.prisma.$queryRaw`
          UPDATE users
          SET 
            totp_secret = ${secret},
            totp_enabled = true,
            totp_enabled_at = NOW(),
            totp_temp_secret = NULL,
            totp_temp_secret_created_at = NULL
          WHERE id = ${userId}::uuid
        `;
      }
      
      return true;
    } catch (error) {
      console.error('Error in setupTOTP:', error);
      return false;
    }
  }
  
  async setupEmailOTP(userId: string, otp: string, secret: string) {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET 
          email_otp = ${otp},
          email_otp_secret = ${secret},
          email_otp_expires_at = NOW() + INTERVAL '10 minutes',
          email_otp_created_at = NOW()
        WHERE id = ${userId}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error in setupEmailOTP:', error);
      return false;
    }
  }
  
  async verifyEmailOTP(userId: string, otp: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT 
          email_otp, 
          email_otp_expires_at
        FROM users
        WHERE id = ${userId}::uuid
      `;
      
      if (!Array.isArray(result) || result.length === 0) {
        return false;
      }
      
      const user = result[0];
      
      if (!user.email_otp || user.email_otp !== otp) {
        return false;
      }
      
      if (user.email_otp_expires_at < new Date()) {
        return false; // OTP expired
      }
      
      // Clear the OTP and mark email OTP as enabled and verified
      await this.prisma.$queryRaw`
        UPDATE users
        SET 
          email_otp = NULL,
          email_otp_expires_at = NULL,
          email_otp_enabled = true,
          email_otp_verified = true,
          email_otp_last_used = NOW()
        WHERE id = ${userId}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error in verifyEmailOTP:', error);
      return false;
    }
  }
  
  async storeRecoveryCodes(userId: string, hashedCodes: string[]) {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET totp_recovery_codes = ${JSON.stringify(hashedCodes)}::jsonb
        WHERE id = ${userId}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error in storeRecoveryCodes:', error);
      return false;
    }
  }
  
  async disable2FA(userId: string) {
    try {
      await this.prisma.$queryRaw`
        UPDATE users
        SET 
          totp_enabled = false,
          totp_secret = NULL,
          email_otp_enabled = false,
          email_otp_secret = NULL
        WHERE id = ${userId}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error in disable2FA:', error);
      return false;
    }
  }
  
  // ==================== Trusted Device Management ====================
  
  async getTrustedDevices(userId: string): Promise<any[]> {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM trusted_devices
        WHERE user_id = ${userId}::uuid
        ORDER BY last_used DESC
      `;
      
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error in getTrustedDevices:', error);
      return [];
    }
  }
  
  async addTrustedDevice(userId: string, deviceData: {
    device_identifier: string;
    device_name: string;
    device_type?: string;
    browser?: string;
    os?: string;
    ip_address?: string;
    trust_level?: 'login_only' | 'full';
  }) {
    try {
      const result = await this.prisma.$queryRaw`
        INSERT INTO trusted_devices (
          user_id,
          device_identifier,
          device_name,
          device_type,
          browser,
          os,
          ip_address,
          trust_level
        ) VALUES (
          ${userId}::uuid,
          ${deviceData.device_identifier},
          ${deviceData.device_name},
          ${deviceData.device_type || null},
          ${deviceData.browser || null},
          ${deviceData.os || null},
          ${deviceData.ip_address || null},
          ${deviceData.trust_level || 'login_only'}
        ) RETURNING id
      `;
      
      return Array.isArray(result) && result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error('Error in addTrustedDevice:', error);
      return null;
    }
  }
  
  async isTrustedDevice(userId: string, deviceIdentifier: string) {
    try {
      const result = await this.prisma.$queryRaw`
        SELECT * FROM trusted_devices
        WHERE 
          user_id = ${userId}::uuid
          AND device_identifier = ${deviceIdentifier}
          AND expires_at > NOW()
      `;
      
      return Array.isArray(result) && result.length > 0;
    } catch (error) {
      console.error('Error in isTrustedDevice:', error);
      return false;
    }
  }
  
  async removeTrustedDevice(userId: string, deviceId: string) {
    try {
      await this.prisma.$queryRaw`
        DELETE FROM trusted_devices
        WHERE user_id = ${userId}::uuid AND id = ${deviceId}::uuid
      `;
      
      return true;
    } catch (error) {
      console.error('Error in removeTrustedDevice:', error);
      return false;
    }
  }
  
  async updateTrustedDeviceLastUsed(userId: string, deviceIdentifier: string) {
    try {
      await this.prisma.$queryRaw`
        UPDATE trusted_devices
        SET last_used = NOW()
        WHERE user_id = ${userId}::uuid AND device_identifier = ${deviceIdentifier}
      `;
      
      return true;
    } catch (error) {
      console.error('Error in updateTrustedDeviceLastUsed:', error);
      return false;
    }
  }

  // Transaction support
  async transaction<T>(callback: (prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends">) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(callback);
  }

  // Cleanup and maintenance
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

// Export singleton instance
const PrismaDB = PrismaDatabase.getInstance();
export default PrismaDB;

// ==================== Legacy Compatibility Layer ====================

// Export legacy format functions for backward compatibility
export const checkDatabaseHealth = async (): Promise<boolean> => {
  return await PrismaDB.isHealthy();
};

export const getDatabaseStatus = (): boolean => {
  return true; // We're always connected with the Prisma client
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    await PrismaDB.isHealthy();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

// UUID Utility Functions
export const UUIDUtils = {
  /**
   * Check if a string is a valid UUID
   */
  isUUID(value: any): boolean {
    return typeof value === 'string' && 
           /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  },
  
  /**
   * Format a value as a UUID for PostgreSQL queries
   */
  formatUUID(value: string): any {
    return Prisma.raw(`'${value}'::uuid`);
  },
  
  /**
   * Safe conversion to UUID - handles edge cases like JSONB and nulls
   */
  safeUUID(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    
    // If it's already a Prisma.raw value, return as is
    if (value && typeof value === 'object' && value.__prisma_raw__) {
      return value;
    }
    
    // For valid UUID strings, return them as-is (don't wrap in Prisma.raw)
    // PostgreSQL will handle the type conversion automatically
    if (UUIDUtils.isUUID(value)) {
      return value;  // Return plain string, let PostgreSQL handle casting
    }
    
    // For non-UUID strings, return as-is
    if (typeof value === 'string') {
      return value;
    }
    
    // Handle JSON objects by converting to string
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch (e) {
        console.warn("Failed to stringify object for database query:", e);
        return value;
      }
    }
    
    return value;
  },
  
  /**
   * Process query parameters to properly handle UUIDs and other types
   */
  processParams(params: any[]): any[] {
    return params.map(param => UUIDUtils.safeUUID(param));
  }
};

// Legacy Database class for backward compatibility
export class Database {
  // Utility function to correctly format values for SQL queries, particularly UUIDs
  static formatValueForQuery(value: any): any {
    if (UUIDUtils.isUUID(value)) {
      return UUIDUtils.formatUUID(value);
    }
    return value;
  }
  
  // Process params to handle UUIDs correctly
  static processQueryParams(params: any[]): any[] {
    return params.map(param => Database.formatValueForQuery(param));
  }

  // Static query method that forwards to PrismaDB with retry logic and UUID handling
  static async query(text: string, params: any[] = []): Promise<{ rows: any[] }> {
    const maxRetries = 3;
    let retryCount = 0;
    
    // Process parameters to handle UUIDs correctly
    const processedParams = UUIDUtils.processParams(params);
    
    while (retryCount < maxRetries) {
      try {
        // Make query with properly formatted parameters
        const result = await PrismaDB.getClient().$queryRawUnsafe(text, ...processedParams);
        return { rows: Array.isArray(result) ? result : [] };
      } catch (error: any) {
        console.error(`Database query attempt ${retryCount + 1} failed:`, error);
        
        // Special handling for type casting errors
        if (error.message && (
            error.message.includes('operator does not exist') || 
            error.message.includes('cannot cast') || 
            error.message.includes('type jsonb'))) {
          
          console.log("Type casting error detected, falling back to Prisma methods");
          throw error; // Let the calling code handle fallback to Prisma methods
        }
        retryCount++;
        
        // If this is a type casting error, try alternative approach
        if (error.code === '42883' || error.code === '42846') {
          try {
            // Try alternative approach with explicit type casts in the SQL
            const modifiedText = text.replace(/\$(\d+)/g, (match, num) => {
              const paramIndex = parseInt(num) - 1;
              if (paramIndex >= 0 && paramIndex < params.length && UUIDUtils.isUUID(params[paramIndex])) {
                return `$${num}::text::uuid`;
              }
              return match;
            });
            
            const result = await PrismaDB.getClient().$queryRawUnsafe(modifiedText, ...params);
            return { rows: Array.isArray(result) ? result : [] };
          } catch (fallbackError) {
            console.error(`Fallback query attempt failed:`, fallbackError);
          }
        }
        
        // Check if it's a connection error that might benefit from retry
        const isConnectionError = error.code === 'P1001' || 
                              error.code === 'P1017' || 
                              error.message?.includes("Can't reach database server") ||
                              error.message?.includes("Connection timeout") ||
                              error.message?.includes("Connection refused");
        
        if (isConnectionError && retryCount < maxRetries - 1) {
          retryCount++;
          // Exponential backoff: wait 1s, then 2s, then 4s
          const delay = Math.pow(2, retryCount) * 1000;
          console.log(`Retrying database connection in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // If it's not a connection error or we've exhausted retries, throw the error
        throw error;
      }
    }
    
    // This should never be reached, but TypeScript requires it
    throw new Error('Database query failed after all retry attempts');
  }
  
  // User methods
  static async getUserById(id: string) {
    const result = await PrismaDB.findUserById(id);
    return result;
  }
  
  static async getUserByEmail(email: string) {
    const result = await PrismaDB.findUserByEmail(email);
    return result;
  }
  
  // Club methods
  static async getClubById(id: string) {
    return await PrismaDB.getClubById(id);
  }
  
  static async getAllClubs(limit?: number, offset?: number) {
    return await PrismaDB.getAllClubs(limit, offset || 0);
  }
  
  // Event methods
  static async getAllEvents(userId: string, limit?: number, clubId?: string) {
    return await PrismaDB.getAllEvents(userId, limit, clubId);
  }
  
  static async getEventById(id: string, userId: string) {
    return await PrismaDB.getEventById(id, userId);
  }
  
  // Announcement methods
  static async getAnnouncements(limit?: number) {
    try {
      if (limit) {
        const result = await PrismaDB.getClient().$queryRaw`
          SELECT * FROM announcements 
          ORDER BY created_at DESC 
          LIMIT ${limit}
        `;
        return result;
      } else {
        const result = await PrismaDB.getClient().$queryRaw`
          SELECT * FROM announcements 
          ORDER BY created_at DESC
        `;
        return result;
      }
    } catch (error) {
      console.error('Error getting announcements:', error);
      return [];
    }
  }
  
  // Post methods
  static async getPosts(limit?: number, offset?: number, searchQuery?: string) {
    return await PrismaDB.getPosts(limit, offset || 0, searchQuery);
  }
  
  // Notification methods
  static async getUnreadNotificationCount(userId: string) {
    return await PrismaDB.getUnreadNotificationCount(userId);
  }
  
  // Club membership methods
  static async joinClub(userId: string, clubId: string): Promise<boolean> {
    return await PrismaDB.joinClub(userId, clubId);
  }
  
  static async leaveClub(userId: string): Promise<boolean> {
    return await PrismaDB.leaveClub(userId);
  }
  
  static async switchClub(userId: string, newClubId: string): Promise<boolean> {
    return await PrismaDB.switchClub(userId, newClubId);
  }
  
  static async getUserClub(userId: string) {
    return await PrismaDB.getUserClub(userId);
  }
  
  // Post methods
  static async getAllPosts(limit?: number) {
    return await PrismaDB.getAllPosts(limit);
  }
  
  static async getCommentsByPost(postId: string) {
    return await PrismaDB.getCommentsByPost(postId);
  }
  
  // Add more methods as needed to maintain compatibility
}

// Export the raw prisma client for direct access
export const prisma = PrismaDB.getClient();
