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
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: User;
  categoryId: string;
  category: Category;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isLiked: boolean;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: User;
  postId: string;
  parentId?: string; // For nested comments
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
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
