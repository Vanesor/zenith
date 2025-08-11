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
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import ClubLogo from "@/components/ClubLogo";

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zenith-muted">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zenith-primary mb-4">
            Unable to load dashboard
          </h1>
          <p className="text-zenith-muted mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { clubs, announcements, upcomingEvents } = dashboardData;

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zenith-primary mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-zenith-secondary">
            Here&apos;s what&apos;s happening in your clubs today.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Clubs Joined
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {user?.club_id ? 1 : 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-zenith-primary" />
            </div>
          </div>

          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Upcoming Events
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {upcomingEvents.length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Announcements
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
                  {announcements.length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zenith-muted">
                  Assignments
                </p>
                <p className="text-2xl font-bold text-zenith-primary">
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
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-zenith-primary mb-6">
                My Clubs
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user?.club_id ? (
                  // Show the single club the user is a member of
                  clubs
                    .filter((club) => club.id === user.club_id)
                    .map((club) => {
                      const IconComponent = iconMap[club.icon] || Code;
                      return (
                        <Link
                          key={club.id}
                          href={`/clubs/${club.id}`}
                          className="block"
                        >
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-4 rounded-lg border border-zenith-border hover:border-zenith-primary transition-colors"
                          >
                            <div className="flex items-center space-x-3 mb-3">
                              <div
                                className={`w-14 h-14 bg-gradient-to-r ${club.color} rounded-lg flex items-center justify-center`}
                              >
                                <ClubLogo 
                                  clubId={club.id}
                                  clubName={club.name}
                                  size="md"
                                  fallbackIcon={club.icon}
                                  className="text-white"
                                />
                              </div>
                              <div>
                                <h3 className="font-semibold text-zenith-primary">
                                  {club.name}
                                </h3>
                                <p className="text-sm text-zenith-muted">
                                  {club.type}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-zenith-muted mb-3">
                              {club.description}
                            </p>
                            <div className="flex justify-between text-xs text-zenith-muted">
                              <span>{club.member_count} members</span>
                              <span>{club.upcoming_events} events</span>
                            </div>
                          </motion.div>
                        </Link>
                      );
                    })
                ) : (
                  // Show message if user hasn't joined any club
                  <div className="col-span-2 text-center py-8">
                    <p className="text-zenith-muted mb-4">
                      You haven&apos;t joined any club yet.
                    </p>
                    <Link
                      href="/clubs"
                      className="inline-flex items-center px-4 py-2 bg-zenith-primary text-white rounded-lg hover:bg-zenith-primary/90 transition-colors"
                    >
                      Browse Clubs
                    </Link>
                  </div>
                )}
              </div>

              <Link
                href="/clubs"
                className="mt-4 inline-flex items-center text-zenith-primary hover:text-zenith-primary/90 text-sm font-medium"
              >
                Explore all clubs →
              </Link>
            </div>

            {/* Recent Announcements */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-zenith-primary mb-6">
                Recent Announcements
              </h2>
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="p-4 rounded-lg border border-zenith-border hover:border-zenith-primary transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-zenith-primary">
                        {announcement.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          announcement.priority === "high"
                            ? "bg-red-100 text-red-800"
                            : announcement.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-zenith-section text-zenith-primary"
                        }`}
                      >
                        {announcement.priority}
                      </span>
                    </div>
                    <p className="text-sm text-zenith-muted mb-2">
                      {announcement.content}
                    </p>
                    <div className="flex items-center justify-between text-xs text-zenith-muted">
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
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zenith-primary mb-4">
                Upcoming Events
              </h2>
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-zenith-primary pl-4"
                  >
                    <h3 className="font-medium text-zenith-primary text-sm">
                      {event.title}
                    </h3>
                    <p className="text-xs text-zenith-muted mb-1">
                      {event.club_name}
                    </p>
                    <div className="flex items-center text-xs text-zenith-muted space-x-2">
                      <Clock size={12} />
                      <span>
                        {event.event_date} at {event.event_time}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-zenith-muted space-x-2 mt-1">
                      <MapPin size={12} />
                      <span>{event.location}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/events"
                className="mt-4 inline-flex items-center text-zenith-primary hover:text-zenith-primary/90 text-sm font-medium"
              >
                View all events →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-zenith-card rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-zenith-primary mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Link
                  href="/assignments"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors"
                >
                  <BookOpen size={16} className="text-purple-600" />
                  <span className="text-sm text-zenith-primary">
                    View Assignments
                  </span>
                </Link>

                <Link
                  href="/calendar"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors"
                >
                  <Calendar size={16} className="text-zenith-primary" />
                  <span className="text-sm text-zenith-primary">
                    Calendar & Events
                  </span>
                </Link>

                <Link
                  href="/notifications"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors"
                >
                  <Bell size={16} className="text-orange-600" />
                  <span className="text-sm text-zenith-primary">
                    Notifications
                  </span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center space-x-3 p-3 rounded-lg hover:bg-zenith-hover transition-colors"
                >
                  <Settings size={16} className="text-zenith-secondary" />
                  <span className="text-sm text-zenith-primary">
                    Profile Settings
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ZenChatbot />
      </div>
  );
}
