"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  FileText,
  Users,
  Settings,
  Edit,
  Trash2,
  Eye,
  BookOpen,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  attendeeCount: number;
  status: string;
  created_at?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  like_count: number;
  comment_count: number;
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
  const { showToast } = useToast();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeEvents: 0,
    totalPosts: 0,
    totalAssignments: 0,
  });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
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
                totalPosts: 0,
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

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Event",
      message: `Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));

        try {
          const token = localStorage.getItem("zenith-token");
          const response = await fetch(`/api/events/${eventId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setEvents(events.filter((e) => e.id !== eventId));
            setConfirmModal((prev) => ({
              ...prev,
              isOpen: false,
              isLoading: false,
            }));
            showToast({
              type: "success",
              title: "Event Deleted",
              message: `"${eventTitle}" has been successfully deleted.`,
            });
          } else {
            const errorData = await response.json();
            setConfirmModal((prev) => ({ ...prev, isLoading: false }));
            showToast({
              type: "error",
              title: "Deletion Failed",
              message: errorData.error || "Failed to delete event",
            });
          }
        } catch {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          showToast({
            type: "error",
            title: "Deletion Failed",
            message: "An unexpected error occurred while deleting the event",
          });
        }
      },
    });
  };

  const handleDeletePost = async (postId: string, postTitle: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Post",
      message: `Are you sure you want to delete "${postTitle}"? This action cannot be undone.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));

        try {
          const token = localStorage.getItem("zenith-token");
          const response = await fetch(`/api/posts/${postId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setPosts(posts.filter((p) => p.id !== postId));
            setConfirmModal((prev) => ({
              ...prev,
              isOpen: false,
              isLoading: false,
            }));
            showToast({
              type: "success",
              title: "Post Deleted",
              message: `"${postTitle}" has been successfully deleted.`,
            });
          } else {
            const errorData = await response.json();
            setConfirmModal((prev) => ({ ...prev, isLoading: false }));
            showToast({
              type: "error",
              title: "Deletion Failed",
              message: errorData.error || "Failed to delete post",
            });
          }
        } catch {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          showToast({
            type: "error",
            title: "Deletion Failed",
            message: "An unexpected error occurred while deleting the post",
          });
        }
      },
    });
  };

  const handleDeleteAnnouncement = async (
    announcementId: string,
    announcementTitle: string
  ) => {
    setConfirmModal({
      isOpen: true,
      title: "Delete Announcement",
      message: `Are you sure you want to delete "${announcementTitle}"? This action cannot be undone.`,
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));

        try {
          const token = localStorage.getItem("zenith-token");
          const response = await fetch(`/api/announcements/${announcementId}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setAnnouncements(
              announcements.filter((a) => a.id !== announcementId)
            );
            setConfirmModal((prev) => ({
              ...prev,
              isOpen: false,
              isLoading: false,
            }));
            showToast({
              type: "success",
              title: "Announcement Deleted",
              message: `"${announcementTitle}" has been successfully deleted.`,
            });
          } else {
            const errorData = await response.json();
            setConfirmModal((prev) => ({ ...prev, isLoading: false }));
            showToast({
              type: "error",
              title: "Deletion Failed",
              message: errorData.error || "Failed to delete announcement",
            });
          }
        } catch {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          showToast({
            type: "error",
            title: "Deletion Failed",
            message:
              "An unexpected error occurred while deleting the announcement",
          });
        }
      },
    });
  };

  const canEdit = (createdAt: string): boolean => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours <= 3;
  };

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
          <h1 className="text-3xl font-bold text-zenith-primary dark:text-white mb-2">
            Management Dashboard
          </h1>
          <p className="text-zenith-secondary dark:text-zenith-muted">
            Manage your club activities and content
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-zenith-primary dark:text-white">
                  {stats.totalMembers}
                </p>
              </div>
              <Users className="w-8 h-8 text-zenith-primary" />
            </div>
          </div>
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted">
                  Active Events
                </p>
                <p className="text-2xl font-bold text-zenith-primary dark:text-white">
                  {stats.activeEvents}
                </p>
              </div>
              <Calendar className="w-8 h-8 stat-events" />
            </div>
          </div>
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted">
                  Total Posts
                </p>
                <p className="text-2xl font-bold text-zenith-primary dark:text-white">
                  {stats.totalPosts}
                </p>
              </div>
              <FileText className="w-8 h-8 stat-posts" />
            </div>
          </div>
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zenith-secondary dark:text-zenith-muted">
                  Assignments
                </p>
                <p className="text-2xl font-bold text-zenith-primary dark:text-white">
                  {stats.totalAssignments}
                </p>
              </div>
              <BookOpen className="w-8 h-8 stat-posts" />
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-zenith-primary dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/management/create-event"
              className="bg-zenith-primary hover:bg-zenith-primary/90 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Calendar className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xl mb-2">Create Event</h3>
              <p className="text-sm opacity-90">
                Schedule new events for your club members
              </p>
            </Link>
            <Link
              href="/management/create-post"
              className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <FileText className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xl mb-2">Create Post</h3>
              <p className="text-sm opacity-90">
                Share updates and content with members
              </p>
            </Link>
            <Link
              href="/management/create-assignment"
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-2 border-orange-300"
            >
              <div className="flex items-center justify-between mb-4">
                <BookOpen className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="bg-zenith-card bg-opacity-20 text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </span>
              </div>
              <h3 className="font-bold text-xl mb-2">Create Assignment</h3>
              <p className="text-sm opacity-90">
                Assign tasks and projects to members
              </p>
            </Link>
            <Link
              href="/management/create-announcement"
              className="bg-purple-600 hover:bg-zenith-secondary/90 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Edit className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xl mb-2">Announcement</h3>
              <p className="text-sm opacity-90">
                Important club updates and news
              </p>
            </Link>
            <Link
              href="/management/members"
              className="bg-indigo-600 hover:bg-zenith-primary/90 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Users className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xl mb-2">Manage Members</h3>
              <p className="text-sm opacity-90">
                View and manage club memberships
              </p>
            </Link>
            <Link
              href="/management/settings"
              className="bg-zenith-secondary hover:bg-zenith-secondary/90 text-white rounded-xl p-6 transition-all duration-200 group shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <Settings className="w-10 h-10 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="font-bold text-xl mb-2">Settings</h3>
              <p className="text-sm opacity-90">
                Manage club preferences and configuration
              </p>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Events */}
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zenith-primary dark:text-white">
                Recent Events
              </h2>
              <Link
                href="/management/events"
                className="text-zenith-primary hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-zenith-border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-zenith-primary dark:text-white">
                      {event.title}
                    </h3>
                    <div className="flex space-x-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-zenith-primary hover:text-zenith-primary/90"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/management/edit-event/${event.id}`}
                        className="text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event.id, event.title)}
                        className="stat-danger hover:opacity-80"
                        title={
                          !canEdit(
                            event.created_at || new Date().toISOString()
                          ) && !isManager
                            ? "Can only delete within 3 hours"
                            : "Delete event"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-2">
                    {event.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zenith-muted">
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
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zenith-primary dark:text-white">
                Recent Posts
              </h2>
              <Link
                href="/management/posts"
                className="text-zenith-primary hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="border border-zenith-border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-zenith-primary dark:text-white">
                      {post.title}
                    </h3>
                    <div className="flex space-x-2">
                      <Link
                        href={`/posts/${post.id}`}
                        className="text-zenith-primary hover:text-zenith-primary/90"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/management/edit-post/${post.id}`}
                        className={`text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary ${
                          !canEdit(post.created_at) && !isManager
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => handleDeletePost(post.id, post.title)}
                        className={`text-red-600 dark:text-red-400 hover:text-red-800 ${
                          !canEdit(post.created_at) && !isManager
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={!canEdit(post.created_at) && !isManager}
                        title={
                          !canEdit(post.created_at) && !isManager
                            ? "Can only delete within 3 hours"
                            : "Delete post"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-2">
                    By {post.author_name}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zenith-muted">
                    <span>
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      {post.like_count} likes • {post.comment_count} comments
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="mt-8">
          <div className="bg-zenith-card dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-zenith-primary dark:text-white">
                Recent Announcements
              </h2>
              <Link
                href="/management/announcements"
                className="text-zenith-primary hover:underline text-sm"
              >
                View All
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="border border-zenith-border dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        announcement.priority === "high"
                          ? "bg-zenith-section stat-danger"
                          : announcement.priority === "medium"
                          ? "bg-zenith-section stat-warning"
                          : "bg-zenith-section stat-members"
                      }`}
                    >
                      {announcement.priority}
                    </span>
                    <div className="flex space-x-2">
                      <Link
                        href={`/management/edit-announcement/${announcement.id}`}
                        className={`text-zenith-secondary dark:text-zenith-muted hover:text-zenith-primary ${
                          !canEdit(announcement.created_at) && !isManager
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() =>
                          handleDeleteAnnouncement(
                            announcement.id,
                            announcement.title
                          )
                        }
                        className={`text-red-600 dark:text-red-400 hover:text-red-800 ${
                          !canEdit(announcement.created_at) && !isManager
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        disabled={
                          !canEdit(announcement.created_at) && !isManager
                        }
                        title={
                          !canEdit(announcement.created_at) && !isManager
                            ? "Can only delete within 3 hours"
                            : "Delete announcement"
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-medium text-zenith-primary dark:text-white mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-zenith-secondary dark:text-zenith-muted mb-2 line-clamp-2">
                    {announcement.content}
                  </p>
                  <p className="text-xs text-zenith-muted">
                    {new Date(announcement.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        isLoading={confirmModal.isLoading}
        confirmText="Delete"
        type="danger"
      />

      <ZenChatbot />
    </div>
  );
}
