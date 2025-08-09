"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bell,
  Calendar,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  Code,
  GraduationCap,
  Heart,
  Clock,
  MapPin,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import Layout from "@/components/MainLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Icon mapping for clubs
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Code: Code,
  MessageSquare: MessageSquare,
  GraduationCap: GraduationCap,
  Heart: Heart,
};

interface Club {
  id: string;
  name: string;
  type: string;
  description: string;
  icon: string;
  color: string;
  member_count: number;
  upcoming_events: number;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  created_at: string;
  club_name: string;
  club_color: string;
  author_name: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  club_name: string;
  club_color: string;
  organizer_name: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  club_name: string;
  club_color: string;
  author_name: string;
}

interface DashboardData {
  clubs: Club[];
  announcements: Announcement[];
  upcomingEvents: Event[];
  recentPosts: Post[];
}

export default function DashboardPage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Don't redirect during initial loading
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("zenith-token");
        if (!token) {
          logout();
          router.push("/login");
          return;
        }

        const response = await fetch("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.status === 401) {
          logout();
          router.push("/login");
          return;
        }
        
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError("Failed to load dashboard data");
        console.error("Dashboard data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, router, logout, isLoading]);

  // Show loading spinner during auth validation
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unable to load dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { clubs, announcements, upcomingEvents } = dashboardData;

  return (
    <Layout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here&apos;s what&apos;s happening in your clubs today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Clubs Joined
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {user?.club_id ? 1 : 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upcoming Events
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {upcomingEvents.length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Announcements
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {announcements.length}
              </p>
            </div>
            <Bell className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Assignments
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                5
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* My Clubs */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              My Clubs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Debug information */}
              <div className="hidden">
                <pre>User club_id: {JSON.stringify(user?.club_id)}</pre>
                <pre>Available clubs: {JSON.stringify(clubs?.map(c => c.id))}</pre>
              </div>
              
              {user?.club_id ? (
                // Show the single club the user is a member of
                (() => {
                  const filteredClubs = clubs.filter((club) => club.id === user.club_id);
                  
                  if (filteredClubs.length === 0) {
                    return (
                      <div className="col-span-2 p-4 text-center">
                        <p className="text-gray-500 dark:text-gray-400">Your club was not found. Please refresh the page.</p>
                      </div>
                    );
                  }
                  
                  return filteredClubs.map((club) => {
                    const IconComponent = iconMap[club.icon] || Code;
                    return (
                      <Link
                        key={club.id}
                        href={`/clubs/${club.id}`}
                        className="block"
                      >
                        <motion.div
                          whileHover={{ scale: 1.02 }}
                          className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                        >
                          <div className="flex items-center space-x-3 mb-3">
                            <div
                              className={`w-10 h-10 bg-gradient-to-r ${club.color} rounded-lg flex items-center justify-center`}
                            >
                              <IconComponent className="text-white w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {club.name}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {club.type}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {club.description}
                          </p>
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500">
                            <span>{club.member_count} members</span>
                            <span>{club.upcoming_events} events</span>
                          </div>
                        </motion.div>
                      </Link>
                    );
                  });
                })()
              ) : (
                // Show message if user hasn't joined any club
                <div className="col-span-2 text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    You haven&apos;t joined any club yet.
                  </p>
                  <Link
                    href="/clubs"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Browse Clubs
                  </Link>
                </div>
              )}
            </div>

            <Link
              href="/clubs"
              className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              Explore all clubs →
            </Link>
          </div>

          {/* Recent Announcements */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Recent Announcements
            </h2>
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        announcement.priority === "high"
                          ? "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                          : announcement.priority === "medium"
                          ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <span>{announcement.club_name}</span>
                    <span>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upcoming Events
            </h2>
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="border-l-4 border-blue-500 pl-4"
                >
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                    {event.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                    {event.club_name}
                  </p>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-2">
                    <Clock size={12} />
                    <span>
                      {event.event_date} at {event.event_time}
                    </span>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-500 space-x-2 mt-1">
                    <MapPin size={12} />
                    <span>{event.location}</span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/events"
              className="mt-4 inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium"
            >
              View all events →
            </Link>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="space-y-3">
              <Link
                href="/assignments"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <BookOpen size={16} className="text-purple-600" />
                <span className="text-sm text-gray-900 dark:text-white">
                  View Assignments
                </span>
              </Link>

              <Link
                href="/calendar"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Calendar size={16} className="text-blue-600" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Calendar & Events
                </span>
              </Link>

              <Link
                href="/notifications"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Bell size={16} className="text-orange-600" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Notifications
                </span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings size={16} className="text-gray-600" />
                <span className="text-sm text-gray-900 dark:text-white">
                  Profile Settings
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <ZenChatbot />
    </Layout>
  );
}
