import { SupabaseClient } from '@supabase/supabase-js';

// Database table definitions that match our Supabase schema
export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'member';
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  club_id: string;
  author_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  post_id: string;
  author_id?: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  user_id: string;
  post_id?: string;
  comment_id?: string;
  created_at: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  club_id: string;
  created_by?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatRoomMember {
  id: string;
  chat_room_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  content: string;
  chat_room_id: string;
  sender_id?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  event_date: string;
  event_time: string;
  end_time?: string;
  location: string;
  max_attendees?: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  club_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  club_id: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  user_id: string;
  content?: string;
  file_url?: string;
  grade?: string;
  feedback?: string;
  submitted_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'announcement' | 'event' | 'assignment' | 'comment' | 'like' | 'system';
  related_id?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  last_active_at: string;
  user_agent?: string;
  ip_address?: string;
}

// Extend the Database interface from Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      clubs: {
        Row: Club;
        Insert: Omit<Club, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Club, 'id' | 'created_at' | 'updated_at'>>;
      };
      club_members: {
        Row: ClubMember;
        Insert: Omit<ClubMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<ClubMember, 'id' | 'joined_at'>>;
      };
      posts: {
        Row: Post;
        Insert: Omit<Post, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;
      };
      comments: {
        Row: Comment;
        Insert: Omit<Comment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Comment, 'id' | 'created_at' | 'updated_at'>>;
      };
      likes: {
        Row: Like;
        Insert: Omit<Like, 'id' | 'created_at'>;
        Update: Partial<Omit<Like, 'id' | 'created_at'>>;
      };
      chat_rooms: {
        Row: ChatRoom;
        Insert: Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ChatRoom, 'id' | 'created_at' | 'updated_at'>>;
      };
      chat_room_members: {
        Row: ChatRoomMember;
        Insert: Omit<ChatRoomMember, 'id' | 'joined_at'>;
        Update: Partial<Omit<ChatRoomMember, 'id' | 'joined_at'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id' | 'created_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>;
      };
      event_attendees: {
        Row: EventAttendee;
        Insert: Omit<EventAttendee, 'id' | 'registered_at'>;
        Update: Partial<Omit<EventAttendee, 'id' | 'registered_at'>>;
      };
      assignments: {
        Row: Assignment;
        Insert: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Assignment, 'id' | 'created_at' | 'updated_at'>>;
      };
      assignment_submissions: {
        Row: AssignmentSubmission;
        Insert: Omit<AssignmentSubmission, 'id' | 'submitted_at' | 'updated_at'>;
        Update: Partial<Omit<AssignmentSubmission, 'id' | 'submitted_at' | 'updated_at'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>;
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'last_active_at'>;
        Update: Partial<Omit<Session, 'id' | 'created_at'>>;
      };
    };
  };
}

// Type-safe Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>;

// Helper functions for type-safe database access
export function getTypedSupabase(client: SupabaseClient): TypedSupabaseClient {
  return client as TypedSupabaseClient;
}
