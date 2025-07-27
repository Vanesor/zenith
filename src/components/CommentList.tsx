"use client";

import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Comment from "./Comment";

interface CommentData {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_avatar?: string;
  created_at: string;
  updated_at?: string;
  likeCount: number;
  isLiked: boolean;
}

interface CommentListProps {
  postId: string;
  initialComments?: CommentData[];
}

export default function CommentList({
  postId,
  initialComments = [],
}: CommentListProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [comments, setComments] = useState<CommentData[]>(initialComments);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch comments on component mount if no initial comments provided
  useEffect(() => {
    const loadComments = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}/comments`);
        if (response.ok) {
          const data = await response.json();

          // Fetch like counts and user likes for each comment
          const commentsWithLikes = await Promise.all(
            data.comments.map(async (comment: CommentData) => {
              try {
                const token = localStorage.getItem("zenith-token");
                const likeCountRes = await fetch(
                  `/api/comments/${comment.id}/like-count`
                );

                let userLikeRes = null;
                if (token) {
                  userLikeRes = await fetch(
                    `/api/comments/${comment.id}/user-like`,
                    {
                      headers: { Authorization: `Bearer ${token}` },
                    }
                  );
                }

                const likeCount = likeCountRes.ok
                  ? (await likeCountRes.json()).count
                  : 0;
                const isLiked =
                  userLikeRes && userLikeRes.ok
                    ? (await userLikeRes.json()).isLiked
                    : false;

                return {
                  ...comment,
                  likeCount,
                  isLiked,
                };
              } catch (error) {
                console.error("Error fetching comment likes:", error);
                return {
                  ...comment,
                  likeCount: 0,
                  isLiked: false,
                };
              }
            })
          );

          setComments(commentsWithLikes);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
        showToast({
          type: "error",
          title: "Load Failed",
          message: "Failed to load comments",
        });
      } finally {
        setLoading(false);
      }
    };

    if (initialComments.length === 0 && postId) {
      loadComments();
    }
  }, [postId, initialComments.length, showToast]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast({
        type: "error",
        title: "Authentication Required",
        message: "Please log in to comment",
      });
      return;
    }

    if (!newComment.trim()) {
      showToast({
        type: "error",
        title: "Invalid Content",
        message: "Comment cannot be empty",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          author_id: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newCommentData: CommentData = {
          ...data.comment,
          likeCount: 0,
          isLiked: false,
        };

        setComments((prev: CommentData[]) => [...prev, newCommentData]);
        setNewComment("");
        setShowCommentForm(false);
        showToast({
          type: "success",
          title: "Comment Added",
          message: "Your comment has been added successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Comment Failed",
          message: errorData.error || "Failed to add comment",
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      showToast({
        type: "error",
        title: "Comment Failed",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = (commentId: string, newContent: string) => {
    setComments((prev: CommentData[]) =>
      prev.map((comment: CommentData) =>
        comment.id === commentId
          ? {
              ...comment,
              content: newContent,
              updated_at: new Date().toISOString(),
            }
          : comment
      )
    );
  };

  const handleCommentDelete = (commentId: string) => {
    setComments((prev: CommentData[]) =>
      prev.filter((comment: CommentData) => comment.id !== commentId)
    );
  };

  const handleCommentLike = (commentId: string, isLiked: boolean) => {
    setComments((prev: CommentData[]) =>
      prev.map((comment: CommentData) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked,
              likeCount: isLiked
                ? comment.likeCount + 1
                : comment.likeCount - 1,
            }
          : comment
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Comments</span>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-gray-300 dark:bg-gray-700 rounded-xl h-20"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comments Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <MessageSquare className="w-5 h-5" />
          <span className="font-semibold">Comments ({comments.length})</span>
        </div>
        {user && !showCommentForm && (
          <button
            onClick={() => setShowCommentForm(true)}
            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Comment</span>
          </button>
        )}
      </div>

      {/* New Comment Form */}
      {showCommentForm && (
        <form
          onSubmit={handleSubmitComment}
          className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
        >
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write your comment..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            rows={3}
          />
          <div className="flex items-center justify-between mt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Press Ctrl+Enter to submit
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowCommentForm(false);
                  setNewComment("");
                }}
                className="px-3 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="flex items-center space-x-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                ) : (
                  <Send className="w-3 h-3" />
                )}
                <span>Comment</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              onCommentUpdate={handleCommentUpdate}
              onCommentDelete={handleCommentDelete}
              onCommentLike={handleCommentLike}
            />
          ))
        )}
      </div>
    </div>
  );
}
