"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Eye,
  Clock,
  Edit,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import CommentList from "@/components/CommentList";
import SafeAvatar from "@/components/SafeAvatar";
import ConfirmationModal from "@/components/ConfirmationModal";
import SafeAvatar from "@/components/SafeAvatar";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  club_name: string;
  club_color?: string;
  created_at: string;
  updated_at?: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  isLiked: boolean;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = params.id as string;
  const { user } = useAuth();
  const { showToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const token = localStorage.getItem("zenith-token");
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`/api/posts/${postId}`, { headers });
        if (response.ok) {
          const data = await response.json();
          setPost(data.post);
          setIsLiked(data.isLiked || false);
          setLikeCount(data.likeCount || 0);
          setViewCount(data.viewCount || 0);
        } else {
          console.error("Failed to fetch post");
        }
      } catch (error) {
        console.error("Error fetching post:", error);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  useEffect(() => {
    const trackView = async () => {
      try {
        const response = await fetch(`/api/posts/${postId}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setViewCount(data.viewCount);
        }
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    };

    if (post && postId) {
      trackView();
    }
  }, [post, postId]);

  const handleLike = async () => {
    if (!user) {
      showToast({
        type: "error",
        title: "Authentication Required",
        message: "Please log in to like posts",
      });
      return;
    }

    try {
      const token = localStorage.getItem("zenith-token");
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(`/api/posts/${postId}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        showToast({
          type: "success",
          title: isLiked ? "Post Unliked" : "Post Liked",
          message: isLiked ? "You unliked this post" : "You liked this post",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Like Failed",
          message: errorData.error || "Failed to update like",
        });
      }
    } catch (error) {
      console.error("Error updating like:", error);
      showToast({
        type: "error",
        title: "Like Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  const canEdit = (): boolean => {
    if (!user || !post) return false;
    const isManager = [
      "coordinator",
      "co_coordinator",
      "secretary",
      "media",
      "president",
      "vice_president",
      "innovation_head",
      "treasurer",
      "outreach",
    ].includes(user.role);

    if (isManager) return true;
    if (post.author_id !== user.id) return false;

    const created = new Date(post.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 3;
  };

  const handleDelete = async () => {
    if (!post) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        showToast({
          type: "success",
          title: "Post Deleted",
          message: "Post has been deleted successfully",
        });
        // Redirect to dashboard after deletion
        window.location.href = "/dashboard";
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Delete Failed",
          message: errorData.error || "Failed to delete post",
        });
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-zenith-primary dark:text-white mb-4">
            Post Not Found
          </h2>
          <Link
            href="/dashboard"
            className="text-zenith-primary hover:text-zenith-primary/90 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 text-zenith-secondary hover:text-zenith-primary dark:text-zenith-muted dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>

        {/* Post Container */}
        <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-lg border border-zenith-border dark:border-gray-700">
          {/* Post Header */}
          <div className="p-6 border-b border-zenith-border dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {post.author_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-zenith-primary dark:text-white text-lg">
                    {post.author_name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-zenith-muted dark:text-zenith-muted">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimestamp(post.created_at)}</span>
                    {post.updated_at && post.updated_at !== post.created_at && (
                      <span>(edited)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Club Badge */}
                <span
                  className="px-3 py-1 rounded-full text-sm font-medium border"
                  style={{
                    backgroundColor: post.club_color
                      ? `${post.club_color}20`
                      : "#3B82F620",
                    color: post.club_color || "#3B82F6",
                    borderColor: post.club_color || "#3B82F6",
                  }}
                >
                  {post.club_name}
                </span>

                {/* Action Buttons */}
                {canEdit() && (
                  <div className="flex items-center space-x-2">
                    <Link
                      href={`/posts/${post.id}/edit`}
                      className="text-zenith-muted hover:text-zenith-primary dark:text-zenith-muted dark:hover:text-blue-400 transition-colors p-2"
                      title="Edit post"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="text-zenith-muted hover:text-red-600 dark:text-zenith-muted dark:hover:text-red-400 transition-colors p-2"
                      title="Delete post"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Post Content */}
          <div className="p-6">
            <h1 className="text-3xl font-bold text-zenith-primary dark:text-white mb-4">
              {post.title}
            </h1>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-zenith-secondary dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-6 py-4 bg-zenith-section dark:bg-gray-700 border-t border-zenith-border dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Like Button */}
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 text-sm transition-colors ${
                    isLiked
                      ? "text-red-600 dark:text-red-400"
                      : "text-zenith-muted dark:text-zenith-muted hover:text-red-600 dark:hover:text-red-400"
                  }`}
                >
                  <Heart
                    className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`}
                  />
                  <span className="font-medium">{likeCount}</span>
                </button>

                {/* Comment Count */}
                <div className="flex items-center space-x-2 text-sm text-zenith-muted dark:text-zenith-muted">
                  <MessageSquare className="w-5 h-5" />
                  <span className="font-medium">{post.comment_count}</span>
                </div>

                {/* View Count */}
                <div className="flex items-center space-x-2 text-sm text-zenith-muted dark:text-zenith-muted">
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">{viewCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-8">
          <div
            id="comments"
            className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-lg border border-zenith-border dark:border-gray-700 p-6"
          >
            <CommentList postId={postId} />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message={`Are you sure you want to delete "${post.title}"? This action cannot be undone.`}
        confirmText="Delete"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
