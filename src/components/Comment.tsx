"use client";

import React, { useState } from "react";
import { Heart, Edit, Trash2, Clock, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ConfirmationModal from "./ConfirmationModal";

interface CommentProps {
  comment: {
    id: string;
    content: string;
    author_id: string;
    author_name: string;
    author_role: string;
    author_avatar?: string;
    created_at: string;
    updated_at?: string;
    likeCount?: number;
    isLiked?: boolean;
  };
  onCommentUpdate: (commentId: string, newContent: string) => void;
  onCommentDelete: (commentId: string) => void;
  onCommentLike: (commentId: string, isLiked: boolean) => void;
}

export default function Comment({
  comment,
  onCommentUpdate,
  onCommentDelete,
  onCommentLike,
}: CommentProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isAuthor = user?.id === comment.author_id;
  const isManager =
    user &&
    [
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

  const canEdit = () => {
    if (!user || !isAuthor) return false;
    const created = new Date(comment.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 1;
  };

  const canDelete = () => {
    if (!user) return false;
    if (isManager) return true;
    if (!isAuthor) return false;
    const created = new Date(comment.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 3;
  };

  const getRoleBadgeColor = (role: string) => {
    const roleColors: { [key: string]: string } = {
      coordinator: "bg-purple-100 text-purple-800 border-purple-200",
      co_coordinator: "bg-blue-100 text-blue-800 border-blue-200",
      secretary: "bg-green-100 text-green-800 border-green-200",
      media: "bg-pink-100 text-pink-800 border-pink-200",
      president: "bg-red-100 text-red-800 border-red-200",
      vice_president: "bg-orange-100 text-orange-800 border-orange-200",
      innovation_head: "bg-indigo-100 text-indigo-800 border-indigo-200",
      treasurer: "bg-yellow-100 text-yellow-800 border-yellow-200",
      outreach: "bg-teal-100 text-teal-800 border-teal-200",
    };
    return roleColors[role] || "bg-zenith-section text-zenith-primary border-zenith-border";
  };

  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleEdit = () => {
    if (!canEdit()) {
      showToast({
        type: "error",
        title: "Cannot Edit",
        message: "You can only edit comments within 1 hour of creation",
      });
      return;
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      showToast({
        type: "error",
        title: "Invalid Content",
        message: "Comment cannot be empty",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      if (response.ok) {
        onCommentUpdate(comment.id, editContent.trim());
        setIsEditing(false);
        showToast({
          type: "success",
          title: "Comment Updated",
          message: "Your comment has been updated successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Update Failed",
          message: errorData.error || "Failed to update comment",
        });
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      showToast({
        type: "error",
        title: "Update Failed",
        message: "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!canDelete()) {
      showToast({
        type: "error",
        title: "Cannot Delete",
        message: "You can only delete comments within 3 hours of creation",
      });
      return;
    }

    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onCommentDelete(comment.id);
        setShowDeleteModal(false);
        showToast({
          type: "success",
          title: "Comment Deleted",
          message: "Comment has been deleted successfully",
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: "error",
          title: "Delete Failed",
          message: errorData.error || "Failed to delete comment",
        });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      showToast({
        type: "error",
        title: "Delete Failed",
        message: "An unexpected error occurred",
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      showToast({
        type: "error",
        title: "Authentication Required",
        message: "Please log in to like comments",
      });
      return;
    }

    try {
      const token = localStorage.getItem("zenith-token");
      const method = comment.isLiked ? "DELETE" : "POST";

      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        onCommentLike(comment.id, !comment.isLiked);
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

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <>
      <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-zenith-border dark:border-gray-700">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
              {comment.author_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-semibold text-zenith-primary dark:text-white text-sm">
                  {comment.author_name}
                </h4>
                {comment.author_role && comment.author_role !== "member" && (
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getRoleBadgeColor(
                      comment.author_role
                    )}`}
                  >
                    {formatRole(comment.author_role)}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-xs text-zenith-muted dark:text-zenith-muted">
                <Clock className="w-3 h-3" />
                <span>{formatTimestamp(comment.created_at)}</span>
                {comment.updated_at &&
                  comment.updated_at !== comment.created_at && (
                    <span>(edited)</span>
                  )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {user && (
            <div className="flex items-center space-x-2">
              {canEdit() && (
                <button
                  onClick={handleEdit}
                  className="text-zenith-muted hover:text-zenith-primary dark:text-zenith-muted dark:hover:text-blue-400 transition-colors p-1"
                  title="Edit comment"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {canDelete() && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-zenith-muted hover:text-red-600 dark:text-zenith-muted dark:hover:text-red-400 transition-colors p-1"
                  title="Delete comment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="mb-3">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-zenith-border dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent dark:bg-gray-700 dark:text-white"
                rows={3}
                placeholder="Write your comment..."
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-zenith-primary text-white rounded-md hover:bg-zenith-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="px-3 py-1.5 bg-zenith-section text-zenith-secondary rounded-md hover:bg-zenith-hover disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1 dark:bg-zenith-secondary dark:text-gray-300 dark:hover:bg-zenith-section0"
                >
                  <X className="w-3 h-3" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="text-zenith-secondary dark:text-gray-300 text-sm leading-relaxed">
              {comment.content}
            </p>
          )}
        </div>

        {/* Comment Actions */}
        {!isEditing && (
          <div className="flex items-center justify-between">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 text-sm transition-colors ${
                comment.isLiked
                  ? "text-red-600 dark:text-red-400"
                  : "text-zenith-muted dark:text-zenith-muted hover:text-red-600 dark:hover:text-red-400"
              }`}
            >
              <Heart
                className={`w-4 h-4 ${comment.isLiked ? "fill-current" : ""}`}
              />
              <span>{comment.likeCount || 0}</span>
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
}
