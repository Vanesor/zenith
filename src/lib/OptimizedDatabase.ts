// Optimized Database Query Helper - Reduces SELECT * queries and improves performance
import { Pool } from "pg";
import { CacheManager } from './CacheManager';
import type { User, Club, Event, Post, Comment, Assignment, Notification } from './database';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 25, // Increased pool size for better concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Faster timeout
  statement_timeout: 30000, // 30 second query timeout
});

// Optimized field selections to replace SELECT *
const USER_FIELDS = 'id, email, name, avatar, role, club_id, bio, created_at, updated_at';
const USER_PUBLIC_FIELDS = 'id, name, avatar, role, club_id'; // For public queries
const CLUB_FIELDS = 'id, name, type, description, icon, color, member_count, created_at';
const POST_FIELDS = 'id, title, content, excerpt, author_id, club_id, published, pinned, created_at, updated_at';
const POST_LIST_FIELDS = 'id, title, excerpt, author_id, club_id, published, pinned, created_at'; // For list views
const EVENT_FIELDS = 'id, title, description, event_date, event_time, end_time, location, club_id, max_attendees, status, created_at';
const COMMENT_FIELDS = 'id, content, author_id, post_id, created_at, updated_at';
const ASSIGNMENT_FIELDS = 'id, title, description, due_date, max_points, club_id, created_by, status, created_at';
const NOTIFICATION_FIELDS = 'id, user_id, title, message, type, read, created_at, expires_at';

export class OptimizedDatabase {
  // Optimized user queries
  static async getUserById(id: string, includePrivate: boolean = false): Promise<User | null> {
    const cacheKey = `user:${id}:${includePrivate ? 'private' : 'public'}`;
    const cached = await CacheManager.get<User>(cacheKey);
    if (cached) return cached;

    const fields = includePrivate ? USER_FIELDS : USER_PUBLIC_FIELDS;
    const result = await pool.query(
      `SELECT ${fields} FROM users WHERE id = $1 AND active = true`,
      [id]
    );

    const user = result.rows[0] || null;
    if (user) {
      await CacheManager.set(cacheKey, user, includePrivate ? 300 : 1800); // Private: 5min, Public: 30min
    }
    
    return user;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const cacheKey = `user:email:${email.toLowerCase()}`;
    const cached = await CacheManager.get<User>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${USER_FIELDS} FROM users WHERE LOWER(email) = $1 AND active = true`,
      [email.toLowerCase()]
    );

    const user = result.rows[0] || null;
    if (user) {
      await CacheManager.set(cacheKey, user, 300); // 5 minutes for email lookups
    }
    
    return user;
  }

  static async getClubMembers(clubId: string, limit?: number): Promise<User[]> {
    const cacheKey = `club:${clubId}:members${limit ? `:${limit}` : ''}`;
    const cached = await CacheManager.get<User[]>(cacheKey);
    if (cached) return cached;

    const query = limit 
      ? `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE club_id = $1 AND active = true ORDER BY name LIMIT $2`
      : `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE club_id = $1 AND active = true ORDER BY name`;
    
    const params = limit ? [clubId, limit] : [clubId];
    const result = await pool.query(query, params);

    const members = result.rows;
    await CacheManager.set(cacheKey, members, 600); // 10 minutes

    return members;
  }

  // Optimized club queries
  static async getAllClubs(): Promise<Club[]> {
    const cacheKey = 'clubs:all';
    const cached = await CacheManager.get<Club[]>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${CLUB_FIELDS} FROM clubs ORDER BY name`
    );

    const clubs = result.rows;
    await CacheManager.set(cacheKey, clubs, 1800); // 30 minutes

    return clubs;
  }

  static async getClubById(id: string): Promise<Club | null> {
    const cacheKey = `club:${id}`;
    const cached = await CacheManager.get<Club>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${CLUB_FIELDS} FROM clubs WHERE id = $1`,
      [id]
    );

    const club = result.rows[0] || null;
    if (club) {
      await CacheManager.set(cacheKey, club, 1800); // 30 minutes
    }

    return club;
  }

  // Optimized post queries
  static async getClubPosts(clubId: string, limit?: number, offset: number = 0): Promise<Post[]> {
    const cacheKey = `club:${clubId}:posts:${limit || 'all'}:${offset}`;
    const cached = await CacheManager.get<Post[]>(cacheKey);
    if (cached) return cached;

    const query = limit
      ? `SELECT ${POST_LIST_FIELDS} FROM posts WHERE club_id = $1 AND published = true ORDER BY pinned DESC, created_at DESC LIMIT $2 OFFSET $3`
      : `SELECT ${POST_LIST_FIELDS} FROM posts WHERE club_id = $1 AND published = true ORDER BY pinned DESC, created_at DESC OFFSET $2`;
    
    const params = limit ? [clubId, limit, offset] : [clubId, offset];
    const result = await pool.query(query, params);

    const posts = result.rows;
    await CacheManager.set(cacheKey, posts, 300); // 5 minutes

    return posts;
  }

  static async getAllPosts(limit?: number, offset: number = 0): Promise<Post[]> {
    const cacheKey = `posts:all:${limit || 'all'}:${offset}`;
    const cached = await CacheManager.get<Post[]>(cacheKey);
    if (cached) return cached;

    const query = limit
      ? `SELECT ${POST_LIST_FIELDS} FROM posts WHERE published = true ORDER BY pinned DESC, created_at DESC LIMIT $1 OFFSET $2`
      : `SELECT ${POST_LIST_FIELDS} FROM posts WHERE published = true ORDER BY pinned DESC, created_at DESC OFFSET $1`;
    
    const params = limit ? [limit, offset] : [offset];
    const result = await pool.query(query, params);

    const posts = result.rows;
    await CacheManager.set(cacheKey, posts, 300); // 5 minutes

    return posts;
  }

  static async getPostById(id: string): Promise<Post | null> {
    const cacheKey = `post:${id}`;
    const cached = await CacheManager.get<Post>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${POST_FIELDS} FROM posts WHERE id = $1 AND published = true`,
      [id]
    );

    const post = result.rows[0] || null;
    if (post) {
      await CacheManager.set(cacheKey, post, 600); // 10 minutes
    }

    return post;
  }

  // Optimized event queries
  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    const cacheKey = `events:upcoming:${limit || 'all'}`;
    const cached = await CacheManager.get<Event[]>(cacheKey);
    if (cached) return cached;

    const query = limit
      ? `SELECT ${EVENT_FIELDS} FROM events WHERE event_date >= CURRENT_DATE AND status = 'upcoming' ORDER BY event_date ASC, event_time ASC LIMIT $1`
      : `SELECT ${EVENT_FIELDS} FROM events WHERE event_date >= CURRENT_DATE AND status = 'upcoming' ORDER BY event_date ASC, event_time ASC`;
    
    const params = limit ? [limit] : [];
    const result = await pool.query(query, params);

    const events = result.rows;
    await CacheManager.set(cacheKey, events, 300); // 5 minutes

    return events;
  }

  static async getClubEvents(clubId: string): Promise<Event[]> {
    const cacheKey = `club:${clubId}:events`;
    const cached = await CacheManager.get<Event[]>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${EVENT_FIELDS} FROM events WHERE club_id = $1 ORDER BY event_date ASC, event_time ASC`,
      [clubId]
    );

    const events = result.rows;
    await CacheManager.set(cacheKey, events, 600); // 10 minutes

    return events;
  }

  // Optimized comment queries
  static async getPostComments(postId: string): Promise<Comment[]> {
    const cacheKey = `post:${postId}:comments`;
    const cached = await CacheManager.get<Comment[]>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${COMMENT_FIELDS} FROM comments WHERE post_id = $1 ORDER BY created_at ASC`,
      [postId]
    );

    const comments = result.rows;
    await CacheManager.set(cacheKey, comments, 300); // 5 minutes

    return comments;
  }

  // Optimized assignment queries
  static async getClubAssignments(clubId: string): Promise<Assignment[]> {
    const cacheKey = `club:${clubId}:assignments`;
    const cached = await CacheManager.get<Assignment[]>(cacheKey);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT ${ASSIGNMENT_FIELDS} FROM assignments WHERE club_id = $1 AND status = 'published' ORDER BY due_date ASC`,
      [clubId]
    );

    const assignments = result.rows;
    await CacheManager.set(cacheKey, assignments, 600); // 10 minutes

    return assignments;
  }

  // Optimized notification queries
  static async getUserNotifications(userId: string, limit?: number, unreadOnly: boolean = false): Promise<Notification[]> {
    const cacheKey = `user:${userId}:notifications:${limit || 'all'}:${unreadOnly}`;
    const cached = await CacheManager.get<Notification[]>(cacheKey);
    if (cached) return cached;

    let query = `SELECT ${NOTIFICATION_FIELDS} FROM notifications WHERE user_id = $1`;
    const params: any[] = [userId];

    if (unreadOnly) {
      query += ` AND read = false`;
    }

    query += ` ORDER BY created_at DESC`;

    if (limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(limit);
    }

    const result = await pool.query(query, params);

    const notifications = result.rows;
    await CacheManager.set(cacheKey, notifications, 120); // 2 minutes (notifications change frequently)

    return notifications;
  }

  // Optimized batch queries
  static async getUsersById(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];

    const cacheKey = `users:batch:${ids.sort().join(',')}`;
    const cached = await CacheManager.get<User[]>(cacheKey);
    if (cached) return cached;

    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(
      `SELECT ${USER_PUBLIC_FIELDS} FROM users WHERE id IN (${placeholders}) AND active = true ORDER BY name`,
      ids
    );

    const users = result.rows;
    await CacheManager.set(cacheKey, users, 600); // 10 minutes

    return users;
  }

  // Performance monitoring
  static async getPerformanceStats(): Promise<any> {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        n_tup_ins as inserts,
        n_tup_upd as updates,
        n_tup_del as deletes,
        n_live_tup as live_tuples,
        n_dead_tup as dead_tuples
      FROM pg_stat_user_tables 
      WHERE schemaname = 'public'
      ORDER BY n_live_tup DESC;
    `);

    return result.rows;
  }

  // Cache invalidation helpers
  static async invalidateUserCache(userId: string): Promise<void> {
    await CacheManager.clearPattern(`user:${userId}:*`);
    await CacheManager.clearPattern(`*:user:${userId}`);
  }

  static async invalidateClubCache(clubId: string): Promise<void> {
    await CacheManager.clearPattern(`club:${clubId}:*`);
    await CacheManager.clearPattern(`*:club:${clubId}`);
  }

  static async invalidatePostCache(postId: string): Promise<void> {
    await CacheManager.clearPattern(`post:${postId}:*`);
    await CacheManager.clearPattern(`*:post:${postId}`);
  }

  // Health check
  static async healthCheck(): Promise<{ healthy: boolean; latency: number }> {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      const latency = Date.now() - start;
      return { healthy: true, latency };
    } catch (error) {
      const latency = Date.now() - start;
      console.error('Database health check failed:', error);
      return { healthy: false, latency };
    }
  }
}

// Connection monitoring
setInterval(async () => {
  const health = await OptimizedDatabase.healthCheck();
  if (!health.healthy || health.latency > 1000) {
    console.warn(`Database performance issue: healthy=${health.healthy}, latency=${health.latency}ms`);
  }
}, 30000); // Every 30 seconds
