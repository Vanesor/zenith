"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Send, Loader2, Paperclip } from "lucide-react";
import Link from "next/link";

export default function CreatePostPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    attachments: [] as string[],
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
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          author_id: user.id,
          club_id: user.club_id,
        }),
      });

      if (response.ok) {
        router.push("/management");
      } else {
        const error = await response.json();
        console.error("Error creating post:", error);
        alert("Failed to create post. Please try again.");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-zenith-section dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-zenith-secondary dark:text-zenith-muted">
            Please log in to create posts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-section dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/management"
            className="inline-flex items-center text-zenith-primary dark:text-blue-400 hover:text-zenith-primary/90 dark:hover:text-blue-300 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Management
          </Link>
          <h1 className="text-3xl font-bold text-zenith-primary dark:text-white">
            Create Post
          </h1>
          <p className="text-zenith-secondary dark:text-zenith-muted mt-2">
            Share updates, insights, and engage with your club community
          </p>
        </div>

        {/* Form */}
        <div className="bg-zenith-card dark:bg-gray-800 rounded-xl shadow-lg p-6">
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
                className="w-full px-4 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white disabled:opacity-50"
                placeholder="Enter post title..."
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
                rows={8}
                className="w-full px-4 py-2 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white disabled:opacity-50"
                placeholder="Write your post content here..."
              />
            </div>

            {/* Attachments (placeholder for future file upload) */}
            <div>
              <label className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2">
                Attachments
              </label>
              <div className="border-2 border-dashed border-zenith-border dark:border-gray-600 rounded-lg p-6 text-center">
                <Paperclip size={24} className="mx-auto text-zenith-muted mb-2" />
                <p className="text-zenith-muted dark:text-zenith-muted">
                  File upload feature coming soon
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/management"
                className="px-6 py-2 border border-zenith-border dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>Create Post</span>
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
