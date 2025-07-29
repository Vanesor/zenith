// Database connection and schema
import { Pool } from "pg";
import { supabase, createAdminClient } from './supabase';

// Create admin client
const supabaseAdmin = createAdminClient();

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Supabase connection pool - using the connection pooler URL for direct PostgreSQL access
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Required for Supabase
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Connection health monitoring
let isConnected = false;

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    isConnected = true;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    isConnected = false;
    return false;
  }
}

// Get connection status
export function getDatabaseStatus(): boolean {
  return isConnected;
}

// Initialize database connection
export async function initializeDatabase(): Promise<void> {
  try {
    await checkDatabaseHealth();
    console.log('Database connection established successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

// Database interfaces
export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar?: string;
  role:
    | "student"
    | "coordinator"
    | "co_coordinator"
    | "secretary"
    | "media"
    | "president"
    | "vice_president"
    | "innovation_head"
    | "treasurer"
    | "outreach";
  club_id: string | null; // Single club membership
  bio?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  long_description: string;
  icon: string;
  color: string;
  coordinator_id: string;
  co_coordinator_id: string;
  secretary_id: string;
  media_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: Date;
  event_time: string;
  location: string;
  club_id: string;
  created_by: string;
  max_attendees?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  club_id: string;
  category?: string;
  image_url?: string;
  view_count: number;
  like_count: number;
  is_announcement: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  is_edited: boolean;
  edit_deadline: Date;
  delete_deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: "general" | "urgent" | "event" | "assignment";
  author_id: string;
  club_id?: string;
  target_audience: "all" | "club_members" | "coordinators";
  priority: "low" | "medium" | "high" | "urgent";
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  club_id: string;
  assigned_by: string;
  due_date: Date;
  max_points: number;
  instructions?: string;
  status: "active" | "completed" | "archived";
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  attachments: string[];
  points_earned?: number;
  feedback?: string;
  status: "submitted" | "graded" | "returned";
  submitted_at: Date;
  graded_at?: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "system" | "assignment" | "event" | "announcement" | "chat";
  is_read: boolean;
  data: Record<string, any>;
  related_id?: string;
  related_type?: string;
  created_at: Date;
}

export interface ChatRoom {
  id: string;
  name: string;
  description?: string;
  club_id?: string;
  type: "public" | "club" | "private";
  created_by: string;
  members: string[];
  is_group: boolean;
  group_admin?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  message_type: "text" | "image" | "file";
  file_url?: string;
  created_at: Date;
}

export interface ZenithCommittee {
  id: string;
  president_id?: string;
  vice_president_id?: string;
  innovation_head_id?: string;
  treasurer_id?: string;
  secretary_id?: string;
  outreach_id?: string;
  created_at: Date;
  updated_at: Date;
}

// Database utility functions
export class Database {
  static async query(text: string, params?: unknown[]) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // User operations
  static async getUserById(id: string): Promise<User | null> {
    const result = await this.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] || null;
  }

  static async createUser(
    user: Omit<User, "id" | "created_at" | "updated_at">
  ): Promise<User> {
    const result = await this.query(
      `INSERT INTO users (email, name, avatar, role, club_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user.email, user.name, user.avatar, user.role, user.club_id]
    );
    return result.rows[0];
  }

  // Club operations
  static async getAllClubs(): Promise<Club[]> {
    const result = await this.query("SELECT * FROM clubs ORDER BY name");
    return result.rows;
  }

  static async getClubById(id: string): Promise<Club | null> {
    const result = await this.query("SELECT * FROM clubs WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  static async getClubMembers(clubId: string): Promise<User[]> {
    const result = await this.query(
      "SELECT * FROM users WHERE club_id = $1 ORDER BY name",
      [clubId]
    );
    return result.rows;
  }

  static async getClubLeadership(clubId: string): Promise<{
    coordinator: User | null;
    coCoordinator: User | null;
    secretary: User | null;
    media: User | null;
  }> {
    const club = await this.getClubById(clubId);
    if (!club)
      return {
        coordinator: null,
        coCoordinator: null,
        secretary: null,
        media: null,
      };

    const [coordinator, coCoordinator, secretary, media] = await Promise.all([
      this.getUserById(club.coordinator_id),
      this.getUserById(club.co_coordinator_id),
      this.getUserById(club.secretary_id),
      this.getUserById(club.media_id),
    ]);

    return { coordinator, coCoordinator, secretary, media };
  }

  // Single club membership management
  static async joinClub(userId: string, clubId: string): Promise<boolean> {
    try {
      const result = await this.query("SELECT join_club($1, $2)", [
        userId,
        clubId,
      ]);
      return result.rows[0].join_club;
    } catch (error) {
      console.error("Error joining club:", error);
      throw error;
    }
  }

  static async leaveClub(userId: string): Promise<boolean> {
    try {
      const result = await this.query("SELECT leave_club($1)", [userId]);
      return result.rows[0].leave_club;
    } catch (error) {
      console.error("Error leaving club:", error);
      throw error;
    }
  }

  static async switchClub(userId: string, newClubId: string): Promise<boolean> {
    try {
      const result = await this.query("SELECT switch_club($1, $2)", [
        userId,
        newClubId,
      ]);
      return result.rows[0].switch_club;
    } catch (error) {
      console.error("Error switching club:", error);
      throw error;
    }
  }

  static async getUserClub(userId: string): Promise<Club | null> {
    const user = await this.getUserById(userId);
    if (!user || !user.club_id) return null;
    return this.getClubById(user.club_id);
  }

  static async validateCollegeEmail(email: string): Promise<boolean> {
    return email.endsWith("@stvincentngp.edu.in");
  }

  // Event operations
  static async getEventsByClub(clubId: string): Promise<Event[]> {
    const result = await this.query(
      "SELECT * FROM events WHERE club_id = $1 ORDER BY event_date ASC",
      [clubId]
    );
    return result.rows;
  }

  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    const query = limit
      ? "SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC LIMIT $1"
      : "SELECT * FROM events WHERE event_date >= CURRENT_DATE ORDER BY event_date ASC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async getAllEvents(limit?: number): Promise<Event[]> {
    const query = limit
      ? "SELECT * FROM events ORDER BY event_date ASC LIMIT $1"
      : "SELECT * FROM events ORDER BY event_date ASC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async createEvent(
    event: Omit<Event, "id" | "created_at" | "updated_at">
  ): Promise<Event> {
    const result = await this.query(
      `INSERT INTO events (title, description, event_date, event_time, location, club_id, created_by, max_attendees, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        event.title,
        event.description,
        event.event_date,
        event.event_time,
        event.location,
        event.club_id,
        event.created_by,
        event.max_attendees,
        event.status,
      ]
    );
    return result.rows[0];
  }

  // Post operations
  static async getPostsByClub(clubId: string, limit?: number): Promise<Post[]> {
    const query = limit
      ? "SELECT * FROM posts WHERE club_id = $1 ORDER BY created_at DESC LIMIT $2"
      : "SELECT * FROM posts WHERE club_id = $1 ORDER BY created_at DESC";
    const params = limit ? [clubId, limit] : [clubId];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async getAllPosts(limit?: number): Promise<Post[]> {
    const query = limit
      ? "SELECT * FROM posts ORDER BY created_at DESC LIMIT $1"
      : "SELECT * FROM posts ORDER BY created_at DESC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async createPost(
    post: Omit<Post, "id" | "created_at" | "updated_at">
  ): Promise<Post> {
    const result = await this.query(
      `INSERT INTO posts (title, content, author_id, club_id, category, image_url, view_count, like_count, is_announcement) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        post.title,
        post.content,
        post.author_id,
        post.club_id,
        post.category || null,
        post.image_url || null,
        post.view_count || 0,
        post.like_count || 0,
        post.is_announcement || false,
      ]
    );
    return result.rows[0];
  }

  // Comment operations
  static async getCommentsByPost(postId: string): Promise<Comment[]> {
    const result = await this.query(
      "SELECT * FROM comments WHERE post_id = $1 ORDER BY created_at ASC",
      [postId]
    );
    return result.rows;
  }

  static async createComment(
    comment: Omit<Comment, "id" | "created_at" | "updated_at">
  ): Promise<Comment> {
    const result = await this.query(
      `INSERT INTO comments (post_id, author_id, content, is_edited, edit_deadline, delete_deadline) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        comment.post_id,
        comment.author_id,
        comment.content,
        comment.is_edited || false,
        comment.edit_deadline || new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        comment.delete_deadline || new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
      ]
    );
    return result.rows[0];
  }

  // Announcement operations
  static async getAnnouncements(limit?: number): Promise<Announcement[]> {
    const query = limit
      ? "SELECT * FROM announcements ORDER BY created_at DESC LIMIT $1"
      : "SELECT * FROM announcements ORDER BY created_at DESC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async createAnnouncement(
    announcement: Omit<Announcement, "id" | "created_at" | "updated_at">
  ): Promise<Announcement> {
    const result = await this.query(
      `INSERT INTO announcements (title, content, type, author_id, club_id, target_audience, priority, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        announcement.title,
        announcement.content,
        announcement.type,
        announcement.author_id,
        announcement.club_id,
        announcement.target_audience,
        announcement.priority,
        announcement.expires_at,
      ]
    );
    return result.rows[0];
  }

  // Assignment operations
  static async getAssignmentsByClub(clubId: string): Promise<Assignment[]> {
    const result = await this.query(
      "SELECT * FROM assignments WHERE club_id = $1 ORDER BY due_date ASC",
      [clubId]
    );
    return result.rows;
  }

  static async createAssignment(
    assignment: Omit<Assignment, "id" | "created_at" | "updated_at">
  ): Promise<Assignment> {
    const result = await this.query(
      `INSERT INTO assignments (title, description, club_id, assigned_by, due_date, max_points, instructions, status, view_count) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        assignment.title,
        assignment.description,
        assignment.club_id,
        assignment.assigned_by,
        assignment.due_date,
        assignment.max_points || 100,
        assignment.instructions || null,
        assignment.status || 'active',
        assignment.view_count || 0,
      ]
    );
    return result.rows[0];
  }

  // Notification operations
  static async getNotificationsByUser(
    userId: string,
    limit?: number
  ): Promise<Notification[]> {
    const query = limit
      ? "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2"
      : "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC";
    const params = limit ? [userId, limit] : [userId];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async createNotification(
    notification: Omit<Notification, "id" | "created_at">
  ): Promise<Notification> {
    const result = await this.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, data, related_id, related_type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [
        notification.user_id,
        notification.title,
        notification.message,
        notification.type,
        notification.is_read || false,
        notification.data || {},
        notification.related_id || null,
        notification.related_type || null,
      ]
    );
    return result.rows[0];
  }

  static async markNotificationAsRead(id: string): Promise<void> {
    await this.query("UPDATE notifications SET is_read = true WHERE id = $1", [
      id,
    ]);
  }
}

// Supabase helper methods using the JavaScript client
export class SupabaseHelpers {
  // Get stats using Supabase client
  static async getHomeStats() {
    try {
      // Use the supabase client with anon key for basic operations
      const client = supabaseAdmin || supabase;
      
      const [usersCount, postsCount, eventsCount, clubsCount] = await Promise.all([
        client.from('users').select('*', { count: 'exact', head: true }),
        client.from('posts').select('*', { count: 'exact', head: true }),
        client.from('events').select('*', { count: 'exact', head: true }),
        client.from('clubs').select('*', { count: 'exact', head: true })
      ]);

      return {
        totalUsers: usersCount.count || 0,
        totalPosts: postsCount.count || 0,
        totalEvents: eventsCount.count || 0,
        totalClubs: clubsCount.count || 0
      };
    } catch (error) {
      console.error('Error fetching stats with Supabase:', error);
      throw error;
    }
  }

  // Get all users
  static async getAllUsers() {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Get all posts with club and author information
  static async getAllPosts(limit?: number) {
    const client = supabaseAdmin || supabase;
    let query = client
      .from('posts')
      .select(`
        *,
        clubs:clubs(name, color),
        users:users(name)
      `)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Get upcoming events with club information
  static async getUpcomingEvents(limit: number = 6) {
    const client = supabaseAdmin || supabase;
    const { data, error } = await client
      .from('events')
      .select(`
        *,
        clubs:clubs(name, color),
        users:users(name)
      `)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  // Get all clubs with member counts
  static async getClubsWithStats() {
    const client = supabaseAdmin || supabase;
    
    // Get clubs
    const { data: clubs, error: clubsError } = await client
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });
    
    if (clubsError) throw clubsError;
    
    // Get member counts for each club
    const clubsWithStats = await Promise.all(
      clubs.map(async (club: Club) => {
        const { count: memberCount } = await client
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id);
          
        const { count: eventCount } = await client
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('club_id', club.id)
          .gte('event_date', new Date().toISOString().split('T')[0]);
        
        return {
          ...club,
          member_count: memberCount || 0,
          upcoming_events: eventCount || 0
        };
      })
    );
    
    return clubsWithStats;
  }
}

export default Database;
