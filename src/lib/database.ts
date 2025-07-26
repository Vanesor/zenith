// Database connection and schema
import { Pool } from "pg";

// Database connection pool
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "zenith",
  password: process.env.DB_PASSWORD || "1234",
  port: parseInt(process.env.DB_PORT || "5432"),
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
  date: Date;
  time: string;
  location: string;
  club_id: string;
  created_by: string;
  max_attendees?: number;
  attendees: string[];
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
  likes: string[];
  comments: Comment[];
  attachments: string[];
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  post_id: string;
  parent_id?: string;
  likes: string[];
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
  created_by: string;
  due_date: Date;
  attachments: string[];
  submissions: Submission[];
  max_points: number;
  status: "draft" | "published" | "closed";
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
  type: "announcement" | "event" | "assignment" | "comment" | "like" | "system";
  related_id?: string;
  read: boolean;
  created_at: Date;
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
      "SELECT * FROM events WHERE club_id = $1 ORDER BY date ASC",
      [clubId]
    );
    return result.rows;
  }

  static async getUpcomingEvents(limit?: number): Promise<Event[]> {
    const query = limit
      ? "SELECT * FROM events WHERE date >= CURRENT_DATE ORDER BY date ASC LIMIT $1"
      : "SELECT * FROM events WHERE date >= CURRENT_DATE ORDER BY date ASC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async getAllEvents(limit?: number): Promise<Event[]> {
    const query = limit
      ? "SELECT * FROM events ORDER BY date ASC LIMIT $1"
      : "SELECT * FROM events ORDER BY date ASC";
    const params = limit ? [limit] : [];
    const result = await this.query(query, params);
    return result.rows;
  }

  static async createEvent(
    event: Omit<Event, "id" | "created_at" | "updated_at">
  ): Promise<Event> {
    const result = await this.query(
      `INSERT INTO events (title, description, date, time, location, club_id, created_by, max_attendees, attendees, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        event.title,
        event.description,
        event.date,
        event.time,
        event.location,
        event.club_id,
        event.created_by,
        event.max_attendees,
        event.attendees,
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
      `INSERT INTO posts (title, content, author_id, club_id, likes, comments, attachments) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [
        post.title,
        post.content,
        post.author_id,
        post.club_id,
        post.likes,
        post.comments,
        post.attachments,
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
      `INSERT INTO comments (content, author_id, post_id, parent_id, likes) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        comment.content,
        comment.author_id,
        comment.post_id,
        comment.parent_id,
        comment.likes,
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
      `INSERT INTO assignments (title, description, club_id, created_by, due_date, attachments, submissions, max_points, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        assignment.title,
        assignment.description,
        assignment.club_id,
        assignment.created_by,
        assignment.due_date,
        assignment.attachments,
        assignment.submissions,
        assignment.max_points,
        assignment.status,
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
      `INSERT INTO notifications (user_id, title, message, type, related_id, read) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        notification.user_id,
        notification.title,
        notification.message,
        notification.type,
        notification.related_id,
        notification.read,
      ]
    );
    return result.rows[0];
  }

  static async markNotificationAsRead(id: string): Promise<void> {
    await this.query("UPDATE notifications SET read = true WHERE id = $1", [
      id,
    ]);
  }
}

export default Database;
