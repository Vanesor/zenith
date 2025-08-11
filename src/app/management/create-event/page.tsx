"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Users,
  Save,
  X,
} from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

export default function CreateEvent() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    maxAttendees: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          startTime: formData.time,
          location: formData.location,
          maxAttendees: formData.maxAttendees
            ? parseInt(formData.maxAttendees)
            : null,
          imageUrl: null, // We can add image upload later
        }),
      });

      if (response.ok) {
        router.push("/calendar");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create event");
      }
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error creating event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <ThemeToggle />

      {/* Navigation */}
      <nav className="bg-zenith-card/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-zenith-border dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                href="/management"
                className="flex items-center text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary dark:hover:text-white"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Management
              </Link>
            </div>
            <ZenithLogo size="md" />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-zenith-card dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
            <div className="flex items-center space-x-3">
              <Calendar size={32} />
              <div>
                <h1 className="text-2xl font-bold">Create New Event</h1>
                <p className="opacity-90">
                  Schedule an event for your club members
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  Event Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                  placeholder="Enter event title"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                placeholder="Describe your event..."
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="date"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  <Calendar size={16} className="inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  required
                  value={formData.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="time"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  <Clock size={16} className="inline mr-1" />
                  Time *
                </label>
                <input
                  type="time"
                  id="time"
                  name="time"
                  required
                  value={formData.time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="maxAttendees"
                  className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
                >
                  <Users size={16} className="inline mr-1" />
                  Max Attendees
                </label>
                <input
                  type="number"
                  id="maxAttendees"
                  name="maxAttendees"
                  min="1"
                  value={formData.maxAttendees}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                  placeholder="No limit"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="location"
                className="block text-sm font-medium text-zenith-secondary dark:text-gray-300 mb-2"
              >
                <MapPin size={16} className="inline mr-1" />
                Location *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                value={formData.location}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-zenith-primary focus:border-transparent bg-zenith-card dark:bg-gray-700 text-zenith-primary dark:text-white"
                placeholder="Event location"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-zenith-border dark:border-gray-600">
              <Link
                href="/management"
                className="px-6 py-3 border border-zenith-border dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors flex items-center"
              >
                <X size={16} className="mr-2" />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-zenith-primary hover:bg-zenith-primary/90 disabled:bg-blue-400 text-white rounded-lg transition-colors flex items-center"
              >
                <Save size={16} className="mr-2" />
                {isSubmitting ? "Creating..." : "Create Event"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
