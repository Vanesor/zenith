import React from "react";
import Link from "next/link";
import { Post } from "@/shared/types";
import { formatDate, truncateText } from "@/shared/utils";

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
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Post Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {post.author.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {post.author.username}
            </h3>
            <p className="text-sm text-gray-500">
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
        <Link href={`/posts/${post.id}`} className="hover:underline">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h2>
        </Link>
        <p className="text-gray-700 leading-relaxed">
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
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Post Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 hover:text-blue-500 transition-colors">
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
            className="flex items-center space-x-1 hover:text-blue-500 transition-colors"
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
              <span className="text-yellow-500" title="Pinned">
                📌
              </span>
            )}
            {post.isLocked && (
              <span className="text-red-500" title="Locked">
                🔒
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
