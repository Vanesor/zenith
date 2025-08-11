"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  Search,
  Code,
  MessageSquare,
  GraduationCap,
  Heart,
  ExternalLink,
} from "lucide-react";
import MainLayout from "@/components/MainLayout";
import ZenChatbot from "@/components/ZenChatbot";

interface EventItem {
  id: number;
  title: string;
  club: string;
  clubIcon: React.ComponentType<{ className?: string }>;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  description: string;
  image: string;
  category: string;
  difficulty: string;
  tags: string[];
  clubColor: string;
  bgColor: string;
  borderColor: string;
  status: string;
  // Adding missing properties from the database
  event_date?: string;
  event_time?: string;
  price: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem("zenith-token");
      if (!token) return;

      const response = await fetch("/api/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const eventsData = await response.json();
        // Transform the API data to match the component expectations
        const transformedEvents = eventsData.map((event: {
          id: number;
          title: string;
          club: string;
          date: string;
          time?: string;
          startTime?: string;
          location: string;
          attendees: number;
          maxAttendees: number;
          description: string;
          image?: string;
          category: string;
          difficulty: string;
          tags?: string[];
          status: string;
          price?: string;
        }) => ({
          ...event,
          // Add any missing fields or transformations needed
          clubIcon: getClubIcon(event.club),
          clubColor: getClubColor(event.club),
          bgColor: getBgColor(event.club),
          borderColor: getBorderColor(event.club),
          time: event.startTime || (event as any).event_time, // Type assertion to handle potential mismatch
          event_date: (event as any).event_date, // Add event_date from database
          event_time: (event as any).event_time, // Add event_time from database
          tags: event.tags || [],
          image: event.image || "/images/default-event.jpg",
          price: event.price || "Free",
        }));
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Helper functions for club styling
  const getClubIcon = (clubName: string) => {
    switch (clubName?.toLowerCase()) {
      case "ascend":
        return Code;
      case "aster":
        return MessageSquare;
      case "achievers":
        return GraduationCap;
      case "altogether":
        return Heart;
      default:
        return Calendar;
    }
  };

  const getClubColor = (clubName: string) => {
    switch (clubName?.toLowerCase()) {
      case "ascend":
        return "text-zenith-primary dark:text-blue-400";
      case "aster":
        return "text-green-600 dark:text-green-400";
      case "achievers":
        return "text-purple-600 dark:text-purple-400";
      case "altogether":
        return "text-pink-600 dark:text-pink-400";
      default:
        return "text-zenith-secondary dark:text-zenith-muted";
    }
  };

  const getBgColor = (clubName: string) => {
    switch (clubName?.toLowerCase()) {
      case "ascend":
        return "bg-blue-50 dark:bg-blue-900/20";
      case "aster":
        return "bg-green-50 dark:bg-green-900/20";
      case "achievers":
        return "bg-purple-50 dark:bg-purple-900/20";
      case "altogether":
        return "bg-pink-50 dark:bg-pink-900/20";
      default:
        return "bg-zenith-section dark:bg-gray-900/20";
    }
  };

  const getBorderColor = (clubName: string) => {
    switch (clubName?.toLowerCase()) {
      case "ascend":
        return "border-blue-200 dark:border-blue-800";
      case "aster":
        return "border-green-200 dark:border-green-800";
      case "achievers":
        return "border-purple-200 dark:border-purple-800";
      case "altogether":
        return "border-pink-200 dark:border-pink-800";
      default:
        return "border-zenith-border dark:border-gray-800";
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesClub =
      selectedFilter === "all" ||
      event.club.toLowerCase() === selectedFilter.toLowerCase();
    const matchesCategory =
      selectedCategory === "all" ||
      event.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesClub && matchesCategory;
  });

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date not specified";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <MainLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-zenith-primary dark:text-white mb-4">
            Upcoming{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Events
            </span>
          </h1>
          <p className="text-xl text-zenith-secondary dark:text-gray-300 max-w-3xl mx-auto">
            Discover workshops, competitions, and networking opportunities
            designed to accelerate your learning and growth.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex flex-col lg:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted dark:text-zenith-muted w-5 h-5" />
            <input
              type="text"
              placeholder="Search events, topics, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary bg-zenith-card dark:bg-gray-800 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zenith-muted dark:text-zenith-muted w-5 h-5" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary bg-zenith-card dark:bg-gray-800 text-zenith-primary dark:text-white"
              >
                <option value="all">All Clubs</option>
                <option value="ascend">Ascend</option>
                <option value="aster">Aster</option>
                <option value="achievers">Achievers</option>
                <option value="altogether">Altogether</option>
              </select>
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-zenith-border dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-zenith-primary bg-zenith-card dark:bg-gray-800 text-zenith-primary dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="workshop">Workshop</option>
              <option value="competition">Competition</option>
              <option value="tech talk">Tech Talk</option>
              <option value="study session">Study Session</option>
              <option value="wellness">Wellness</option>
            </select>
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredEvents.map((event, index) => {
            const IconComponent = event.clubIcon;
            const attendancePercentage =
              (event.attendees / event.maxAttendees) * 100;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className={`bg-zenith-card dark:bg-gray-800 rounded-2xl shadow-lg border-2 ${event.borderColor} overflow-hidden hover:shadow-xl transition-all duration-300`}
              >
                {/* Event Image Placeholder */}
                <div
                  className={`h-48 ${event.bgColor} flex items-center justify-center`}
                >
                  <IconComponent className={`w-16 h-16 ${event.clubColor}`} />
                </div>

                <div className="p-6">
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${event.bgColor} ${event.clubColor} mb-2`}
                      >
                        {event.club}
                      </span>
                      <h3 className="text-lg font-bold text-zenith-primary dark:text-white mb-1">
                        {event.title}
                      </h3>
                      <span className="inline-block px-2 py-1 bg-zenith-section dark:bg-gray-700 text-zenith-secondary dark:text-gray-300 text-xs rounded">
                        {event.category}
                      </span>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-zenith-secondary dark:text-zenith-muted">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center text-sm text-zenith-secondary dark:text-zenith-muted">
                      <Clock className="w-4 h-4 mr-2" />
                      {event.event_time || event.time || "Time not specified"}
                    </div>
                    <div className="flex items-center text-sm text-zenith-secondary dark:text-zenith-muted">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                    <div className="flex items-center text-sm text-zenith-secondary dark:text-zenith-muted">
                      <Users className="w-4 h-4 mr-2" />
                      {event.attendees}/{event.maxAttendees} attending
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-zenith-secondary dark:text-gray-300 text-sm mb-4 line-clamp-3">
                    {event.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {event.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-zenith-section dark:bg-gray-700 text-zenith-secondary dark:text-gray-300 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Attendance Progress */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-zenith-secondary dark:text-zenith-muted mb-1">
                      <span>Spots filled</span>
                      <span>{Math.round(attendancePercentage)}%</span>
                    </div>
                    <div className="w-full bg-zenith-section dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          attendancePercentage > 80
                            ? "bg-red-500"
                            : attendancePercentage > 60
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${attendancePercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    <button
                      className={`flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:opacity-90 transition-opacity font-medium text-sm`}
                    >
                      Register Now
                    </button>
                    <button className="px-4 py-2 border border-zenith-border dark:border-gray-600 text-zenith-secondary dark:text-gray-300 rounded-lg hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Price and Difficulty */}
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-zenith-border dark:border-gray-700">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {event.price}
                    </span>
                    <span className="text-xs text-zenith-muted dark:text-zenith-muted">
                      {event.difficulty} Level
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredEvents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-zenith-muted dark:text-zenith-muted mb-4">
              <Calendar className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-zenith-primary dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-zenith-secondary dark:text-zenith-muted">
              Try adjusting your search terms or filters.
            </p>
          </motion.div>
        )}

          <ZenChatbot />
        </>
      )}
    </MainLayout>
  );
}
