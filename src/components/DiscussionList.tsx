"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Eye, Pin, Lock, Clock, User } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import UserBadge from "./UserBadge";

interface Discussion {
  id: string;
  title: string;
  description: string;
  author_id: string;
  author_name: string;
  author_role: string;
  author_avatar: string;
  club_id: string;
  category: string;
  tags: string[];
  pinned: boolean;
  locked: boolean;
  views: number;
  reply_count: number;
  last_activity: string;
  created_at: string;
}

interface DiscussionListProps {
  clubId?: string;
  limit?: number;
}

export default function DiscussionList({
  clubId,
  limit = 20,
}: DiscussionListProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === "dark";

  const fetchDiscussions = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(clubId && { club_id: clubId }),
      });

      const response = await fetch(`/api/discussions?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDiscussions(data.discussions);
      }
    } catch (error) {
      console.error("Error fetching discussions:", error);
    } finally {
      setLoading(false);
    }
  }, [clubId, limit]);

  useEffect(() => {
    fetchDiscussions();
  }, [fetchDiscussions]);

  const createDiscussion = async (formData: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }) => {
    if (!user) {
      console.error("User not authenticated");
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          club_id: clubId,
          author_id: user.id,
        }),
      });

      if (response.ok) {
        await fetchDiscussions();
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        console.error("Error creating discussion:", error);
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`p-4 rounded-lg ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            } animate-pulse`}
          >
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-16"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2
          className={`text-2xl font-bold ${
            isDarkMode ? "text-white" : "text-gray-900"
          }`}
        >
          Discussions
        </h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Start Discussion
        </button>
      </div>

      {/* Create Discussion Form */}
      {showCreateForm && (
        <CreateDiscussionForm
          onSubmit={createDiscussion}
          onCancel={() => setShowCreateForm(false)}
          loading={creating}
        />
      )}

      {/* Discussions List */}
      <div className="space-y-4">
        {discussions.map((discussion) => (
          <div
            key={discussion.id}
            className={`p-6 rounded-lg border hover:shadow-md transition-all cursor-pointer ${
              isDarkMode
                ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                : "bg-white border-gray-200 hover:shadow-lg"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center gap-2">
                  {discussion.pinned && (
                    <Pin className="w-4 h-4 text-yellow-500" />
                  )}
                  {discussion.locked && (
                    <Lock className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <h3
                  className={`text-lg font-semibold line-clamp-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {discussion.title}
                </h3>
              </div>
              <span
                className={`text-sm px-2 py-1 rounded-full ${
                  isDarkMode
                    ? "bg-gray-700 text-gray-300"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {discussion.category}
              </span>
            </div>

            {/* Description */}
            {discussion.description && (
              <p
                className={`text-sm mb-4 line-clamp-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                {discussion.description}
              </p>
            )}

            {/* Tags */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {discussion.tags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs px-2 py-1 rounded-full ${
                      isDarkMode
                        ? "bg-blue-900 text-blue-300"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                    }`}
                  >
                    {discussion.author_avatar ? (
                      <Image
                        src={discussion.author_avatar}
                        alt={discussion.author_name}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {discussion.author_name}
                    </p>
                    <UserBadge
                      userId={discussion.author_id}
                      role={discussion.author_role}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {discussion.reply_count}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-gray-500" />
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {discussion.views}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {formatDate(discussion.last_activity)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {discussions.length === 0 && (
          <div
            className={`text-center py-12 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No discussions yet. Be the first to start one!</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Create Discussion Form Component
interface CreateDiscussionFormProps {
  onSubmit: (data: {
    title: string;
    description: string;
    category: string;
    tags: string[];
  }) => void;
  onCancel: () => void;
  loading: boolean;
}

function CreateDiscussionForm({
  onSubmit,
  onCancel,
  loading,
}: CreateDiscussionFormProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "general",
    tags: "",
  });
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      tags: formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <div
      className={`p-6 rounded-lg border ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      <h3
        className={`text-lg font-semibold mb-4 ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        Start New Discussion
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            placeholder="What would you like to discuss?"
            required
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              isDarkMode ? "text-gray-300" : "text-gray-700"
            }`}
          >
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
            rows={4}
            placeholder="Provide more details about your discussion..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="general">General</option>
              <option value="technical">Technical</option>
              <option value="tips">Tips & Tricks</option>
              <option value="guidance">Guidance</option>
              <option value="announcements">Announcements</option>
              <option value="introductions">Introductions</option>
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder="e.g., javascript, beginners, help"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Discussion"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              isDarkMode
                ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
            }`}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
