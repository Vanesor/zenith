// Shared types for the forum application

export interface User {
  id: string;
  username?: string;
  email: string;
  name: string;
  avatar?: string;
  role:
    | "admin"
    | "moderator"
    | "member"
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
  joinDate?: Date;
  bio?: string;
  social_links?: Record<string, string>;
  preferences?: Record<string, any>;
  created_at?: Date;
  updated_at?: Date;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author?: User;
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
  author?: User;
  content: string;
  is_edited: boolean;
  edit_deadline: Date;
  delete_deadline: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  postCount: number;
}

export interface ForumStats {
  totalPosts: number;
  totalUsers: number;
  totalComments: number;
  activeUsers: number;
}

export interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  long_description: string;
  icon: string;
  color: string;
  coordinator_id?: string;
  co_coordinator_id?: string;
  secretary_id?: string;
  media_id?: string;
  guidelines?: string;
  meeting_schedule?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  club_id: string;
  created_by: string;
  event_date: Date;
  event_time: string;
  location: string;
  max_attendees?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  image_url?: string;
  view_count: number;
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
  reply_to_message_id?: string;
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "system" | "assignment" | "event" | "announcement" | "chat";
  read: boolean;
  data: Record<string, any>;
  related_id?: string;
  related_type?: string;
  created_at: Date;
  delivery_method: 'in-app' | 'email' | 'both';
  sent_by?: string; // ID of the coordinator who sent the notification
  club_id?: string; // Club associated with the notification
  email_sent?: boolean; // Track if email was successfully sent
  email_sent_at?: Date; // When email was sent
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: "system" | "assignment" | "event" | "announcement" | "chat";
  delivery_method: 'in-app' | 'email' | 'both';
  recipient_ids?: string[]; // Specific users to notify
  club_id?: string; // If provided, notify all club members
  related_id?: string;
  related_type?: string;
  data?: Record<string, any>;
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

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
  tags: string[];
  view_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ChatbotKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
