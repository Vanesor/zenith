"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";

export default function CreateAnnouncementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "general" as "general" | "event" | "urgent" | "academic",
    priority: "medium" as "low" | "medium" | "high",
    target_audience: "all" as "all" | "members" | "coordinators",
    expires_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error("User not authenticated");
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          author_id: user.id,
          club_id: user.club_id,
          expires_at: formData.expires_at || null,
        }),
      });

      if (response.ok) {
        router.push("/management");
      } else {
        const error = await response.json();
        console.error("Error creating announcement:", error);
        alert("Failed to create announcement. Please try again.");
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert("Failed to create announcement. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="text-center">
          <p className="text-secondary">
            Please log in to create announcements.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-main py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/management"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Management
          </Link>
          <h1 className="text-3xl font-bold text-primary">
            Create Announcement
          </h1>
          <p className="text-secondary mt-2">
            Share important updates with your club members
          </p>
        </div>

        {/* Form */}
        <div className="bg-card rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                placeholder="Enter announcement title..."
              />
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                disabled={loading}
                rows={6}
                className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                placeholder="Enter announcement content..."
              />
            </div>

            {/* Type and Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                >
                  <option value="general">General</option>
                  <option value="event">Event</option>
                  <option value="urgent">Urgent</option>
                  <option value="academic">Academic</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="priority"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            {/* Target Audience and Expiry */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="target_audience"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Target Audience
                </label>
                <select
                  id="target_audience"
                  name="target_audience"
                  value={formData.target_audience}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                >
                  <option value="all">All Users</option>
                  <option value="members">Club Members</option>
                  <option value="coordinators">Coordinators Only</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="expires_at"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  id="expires_at"
                  name="expires_at"
                  value={formData.expires_at}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-2 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/management"
                className="px-6 py-2 border border-custom dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-zenith-primary text-primary rounded-lg hover:bg-zenith-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Create Announcement</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
