"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, Clock, Award, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateAssignmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    instructions: "",
    dueDate: "",
    dueTime: "",
    maxPoints: 100,
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "maxPoints" ? parseInt(value) || 0 : value,
    }));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isManager) {
      setError("Unauthorized access");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("zenith-token");
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);

      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          clubId: user.club_id,
          dueDate: dueDateTime.toISOString(),
          maxPoints: formData.maxPoints,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create assignment");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/management");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create assignment"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isManager) {
    return (
      <div className="min-h-screen zenith-bg-main flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold zenith-text-primary mb-4">
            Unauthorized Access
          </h2>
          <p className="zenith-text-secondary mb-6">
            You don&apos;t have permission to create assignments.
          </p>
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary px-6 py-3 rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen zenith-bg-main flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold zenith-text-primary mb-4">
            Assignment Created Successfully!
          </h2>
          <p className="zenith-text-secondary">
            Redirecting to management dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen zenith-bg-main">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              href="/management"
              className="mr-4 p-2 zenith-text-secondary hover:zenith-text-primary transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold zenith-text-primary">
                Create Assignment
              </h1>
              <p className="zenith-text-secondary mt-2">
                Create a new assignment for your club members
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="zenith-bg-card rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium zenith-text-secondary mb-2"
              >
                Assignment Title *
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 zenith-text-muted" />
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border zenith-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent zenith-bg-card zenith-text-primary"
                  placeholder="Enter assignment title"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium zenith-text-secondary mb-2"
              >
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border zenith-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent zenith-bg-card zenith-text-primary resize-none"
                placeholder="Provide a brief description of the assignment"
              />
            </div>

            {/* Instructions */}
            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                Detailed Instructions
              </label>
              <textarea
                id="instructions"
                name="instructions"
                rows={6}
                value={formData.instructions}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary resize-none"
                placeholder="Provide detailed instructions, requirements, and submission guidelines"
              />
            </div>

            {/* Due Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="dueDate"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Due Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 w-5 h-5 text-zenith-muted" />
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    required
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-4 py-3 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="dueTime"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Due Time *
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-5 h-5 text-zenith-muted" />
                  <input
                    type="time"
                    id="dueTime"
                    name="dueTime"
                    required
                    value={formData.dueTime}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Max Points */}
            <div>
              <label
                htmlFor="maxPoints"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                Maximum Points
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 w-5 h-5 text-zenith-muted" />
                <input
                  type="number"
                  id="maxPoints"
                  name="maxPoints"
                  min={1}
                  max={1000}
                  value={formData.maxPoints}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-custom dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-card dark:bg-gray-700 text-primary"
                  placeholder="100"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-800 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-4 pt-6">
              <Link
                href="/management"
                className="px-6 py-3 border border-custom dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="bg-zenith-primary hover:bg-zenith-primary/90 disabled:bg-blue-400 text-primary px-8 py-3 rounded-lg transition-colors flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Create Assignment</span>
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
