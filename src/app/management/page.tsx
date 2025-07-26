"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Calendar,
  FileText,
  Users,
  BarChart,
  Settings,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendeeCount: number;
  status: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: { name: string };
  likeCount: number;
  commentCount: number;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  created_at: string;
}

export default function ManagementDashboard() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    totalPosts: 0,
    unreadNotifications: 0,
  });

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

  useEffect(() => {
    if (!isLoading && (!user || !isManager)) {
      router.push("/dashboard");
    }
  }, [user, isLoading, isManager, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch events, posts, and announcements based on user's club
        const userClub = user?.club_id;

        if (userClub) {
          const [eventsRes, postsRes, announcementsRes] = await Promise.all([
            fetch(`/api/events?limit=5&clubId=${userClub}`),
            fetch(`/api/posts?limit=5&clubId=${userClub}`),
            fetch(`/api/announcements?limit=5&clubId=${userClub}`),
          ]);

          if (eventsRes.ok) setEvents(await eventsRes.json());
          if (postsRes.ok) setPosts(await postsRes.json());
          if (announcementsRes.ok)
            setAnnouncements(await announcementsRes.json());

          // Fetch management stats
          const token = localStorage.getItem("zenith-token");
          if (token) {
            const statsResponse = await fetch("/api/management/stats", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });

            if (statsResponse.ok) {
              const statsData = await statsResponse.json();
              setStats(statsData);
            } else {
              setStats({
                totalMembers: 0,
                activeEvents: 0,
                totalAssignments: 0,
                unreadNotifications: 0,
              });
            }
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    if (user && isManager) {
      fetchDashboardData();
    }
  }, [user, isManager]);

  if (isLoading || !user || !isManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-900 dark:to-blue-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Management Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your club activities and content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalMembers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Events
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.activeEvents}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Posts
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalPosts}
                </p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Analytics
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  View
                </p>
              </div>
              <BarChart className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Link
            href="/management/create-event"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 transition-colors"
          >
            <Plus className="w-6 h-6 mb-2" />
            <h3 className="font-semibold">Create Event</h3>
            <p className="text-sm opacity-90">Schedule new events</p>
          </Link>
          <Link
            href="/management/create-post"
            className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-4 transition-colors"
          >
            <FileText className="w-6 h-6 mb-2" />
            <h3 className="font-semibold">Create Post</h3>
            <p className="text-sm opacity-90">Share with members</p>
          </Link>
          <Link
            href="/management/create-announcement"
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-4 transition-colors"
          >
            <Edit className="w-6 h-6 mb-2" />
            <h3 className="font-semibold">Announcement</h3>
            <p className="text-sm opacity-90">Important updates</p>
          </Link>
          <Link
            href="/management/settings"
            className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl p-4 transition-colors"
          >
            <Settings className="w-6 h-6 mb-2" />
            <h3 className="font-semibold">Settings</h3>
            <p className="text-sm opacity-90">Manage preferences</p>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Events */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Events
              </h2>
              <Link
                href="/management/events"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {event.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {event.date} at {event.time}
                    </span>
                    <span>{event.attendeeCount} attendees</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Posts
              </h2>
              <Link
                href="/management/posts"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {post.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800">
                        <Eye size={16} />
                      </button>
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    By {post.author.name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      {post.likeCount} likes • {post.commentCount} comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="mt-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Announcements
              </h2>
              <Link
                href="/management/announcements"
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.priority === "high"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : announcement.priority === "medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {announcement.priority}
                    </span>
                    <div className="flex space-x-2">
                      <button className="text-gray-600 dark:text-gray-400 hover:text-gray-800">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-800">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ZenChatbot />
    </div>
  );
}
