import React from "react";
import Link from "next/link";
// Simple Post interface for component
interface Post {
  id: string;
  title: string;
  content: string;
  author: { username: string };
  created_at: string;
  createdAt: string;
  category: { name: string; color: string };
  tags: string[];
  likes: number;
  comment_count: number;
  isPinned: boolean;
  isLocked: boolean;
}

// Simple utility functions
const formatDate = (date: string) => new Date(date).toLocaleDateString();
const truncateText = (text: string, limit: number = 150) => text.length > limit ? text.substring(0, limit) + '...' : text;

interface PostCardProps {
  post: Post;
  showCategory?: boolean;
  truncateContent?: number;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  showCategory = true,
  truncateContent = 150,
}) => {
  return (
    <div className="bg-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-zenith-primary rounded-full flex items-center justify-center text-primary font-semibold">
            {post.author.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-primary">
              {post.author.username}
            </h3>
            <p className="text-sm text-zenith-muted">
              {formatDate(post.createdAt)}
            </p>
          </div>
        </div>
        {showCategory && (
          <span
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: post.category.color + "20",
              color: post.category.color,
            }}
          >
            {post.category.name}
          </span>
        )}
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <Link href={`/posts/${post.id}`} className="hover:no-underline">
          <h2 className="text-xl font-bold text-primary mb-2">{post.title}</h2>
        </Link>
        <p className="text-zenith-secondary leading-relaxed">
          {truncateText(post.content, truncateContent)}
        </p>
      </div>

      {/* Post Tags */}
      {post.tags.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span
                key={tag}
                className="px-2 py-1 bg-zenith-section text-zenith-secondary text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-zenith-muted">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 hover:text-primary transition-colors">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            <span>{post.likes}</span>
          </button>

          <Link
            href={`/posts/${post.id}#comments`}
            className="flex items-center space-x-1 hover:text-primary transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>{post.comment_count}</span>
          </Link>
        </div>

        {(post.isPinned || post.isLocked) && (
          <div className="flex items-center space-x-2">
            {post.isPinned && (
              <span className="text-zenith-secondary" title="Pinned">
                📌
              </span>
            )}
            {post.isLocked && (
              <span className="text-zenith-secondary" title="Locked">
                🔒
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
