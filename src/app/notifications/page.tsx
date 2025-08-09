"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  Calendar,
  Users,
  FileText,
  Settings,
  Search,
  Send,
  Mail,
  X,
  User as UserIcon,
} from "lucide-react";
import ZenChatbot from "@/components/ZenChatbot";
import { useAuth } from "@/contexts/AuthContext";
import { CreateNotificationRequest } from "@/shared/types";

interface Notification {
  id: string;
  type: "announcement" | "event" | "assignment" | "comment" | "like" | "system";
  title: string;
  message: string;
  club?: string;
  created_at: string;
  read: boolean;
  related_id?: string;
  delivery_method?: 'in-app' | 'email' | 'both';
  email_sent?: boolean;
  sent_by?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  club_id?: string;
}

export default function NotificationsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "unread" | "announcements" | "events" | "assignments"
  >("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // New state for coordinator notification sending
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [clubMembers, setClubMembers] = useState<User[]>([]);
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newNotification, setNewNotification] = useState<CreateNotificationRequest>({
    title: '',
    message: '',
    type: 'announcement',
    delivery_method: 'in-app'
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("zenith-token");
        const response = await fetch(
          `/api/notifications?userId=${user.id}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
        } else {
          console.error("Failed to fetch notifications");
          setNotifications([]);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    
    // Fetch club members if user is coordinator
    if (user?.role === 'coordinator' && user?.club_id) {
      fetchClubMembers();
    }
  }, [user]);

  const fetchClubMembers = async () => {
    if (!user?.club_id) return;

    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch(`/api/clubs/${user.club_id}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClubMembers(data);
      }
    } catch (error) {
      console.error('Failed to fetch club members:', error);
    }
  };

  const createNotification = async () => {
    // Debug logging
    console.log('Form state:', newNotification);
    console.log('Title:', newNotification.title);
    console.log('Message:', newNotification.message);
    
    // Trim whitespace and check if fields are actually filled
    const trimmedTitle = newNotification.title?.trim();
    const trimmedMessage = newNotification.message?.trim();
    
    if (!trimmedTitle || !trimmedMessage) {
      alert(`Please fill in all required fields. Missing: ${!trimmedTitle ? 'Title' : ''} ${!trimmedMessage ? 'Message' : ''}`);
      return;
    }

    if (!sendToAll && selectedUsers.length === 0) {
      alert('Please select at least one recipient');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("zenith-token");
      
      const notificationData = {
        ...newNotification,
        title: trimmedTitle,
        message: trimmedMessage,
        ...(sendToAll 
          ? { club_id: user?.club_id }
          : { recipient_ids: selectedUsers }
        )
      };

      console.log('Sending notification data:', notificationData);

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(notificationData)
      });

      const result = await response.json();
      console.log('API Response:', result);
      
      if (result.success) {
        alert(result.message || 'Notification sent successfully!');
        setShowCreateForm(false);
        resetForm();
        // Refresh notifications
        window.location.reload();
      } else {
        alert(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Failed to create notification:', error);
      alert('Failed to send notification: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewNotification({
      title: '',
      message: '',
      type: 'announcement',
      delivery_method: 'in-app'
    });
    setSendToAll(true);
    setSelectedUsers([]);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem("zenith-token");
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
          read: true,
        }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "announcement":
        return <Bell className="w-5 h-5 text-blue-600" />;
      case "event":
        return <Calendar className="w-5 h-5 text-green-600" />;
      case "assignment":
        return <FileText className="w-5 h-5 text-purple-600" />;
      case "club":
        return <Users className="w-5 h-5 text-orange-600" />;
      case "system":
        return <Settings className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDeliveryIcon = (notification: Notification) => {
    if (notification.delivery_method === 'email' || notification.delivery_method === 'both') {
      return <Mail className="w-4 h-4 text-blue-500" />;
    }
    return null;
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return "just now";
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("zenith-token");
      const unreadNotifications = notifications.filter((n) => !n.read);

      await Promise.all(
        unreadNotifications.map((notification) =>
          fetch("/api/notifications", {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              notificationId: notification.id,
              read: true,
            }),
          })
        )
      );

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.related_id) {
      // Navigate to the related content, e.g., a post
      if (notification.type === "comment" || notification.type === "like") {
        router.push(`/posts/${notification.related_id}`);
      }
      // Add other navigation logic for different notification types
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "unread" && !notif.read) ||
      (filter === "announcements" && notif.type === "announcement") ||
      (filter === "events" && notif.type === "event") ||
      (filter === "assignments" && notif.type === "assignment");

    const matchesSearch =
      notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notif.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (notif.club &&
        notif.club.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  if (isLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zenith-main transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zenith-primary mb-2">
              Notifications
            </h1>
            <p className="text-zenith-muted">
              Stay updated with club activities and important announcements
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 text-sm rounded-full">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>
          <div className="flex space-x-2">
            {user?.role === 'coordinator' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Send size={16} className="mr-2" />
                Send Notification
              </button>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-4 sm:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Check size={16} className="mr-2" />
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-zenith-card rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-zenith-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-zenith-primary"
                />
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All" },
                { key: "unread", label: "Unread" },
                { key: "announcements", label: "Announcements" },
                { key: "events", label: "Events" },
                { key: "assignments", label: "Assignments" },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as typeof filter)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filter === filterOption.key
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Create Notification Modal */}
        {user?.role === 'coordinator' && showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-zenith-card rounded-xl shadow-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-zenith-primary">Send Notification</h3>
                <button 
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => {
                      console.log('Title input changed:', e.target.value);
                      setNewNotification(prev => ({ ...prev, title: e.target.value }));
                    }}
                    className="w-full p-3 border border-zenith-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-zenith-primary"
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message *
                  </label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => {
                      console.log('Message input changed:', e.target.value);
                      setNewNotification(prev => ({ ...prev, message: e.target.value }));
                    }}
                    className="w-full p-3 border border-zenith-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-zenith-primary"
                    rows={4}
                    placeholder="Notification message"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-3 border border-zenith-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-zenith-primary"
                    >
                      <option value="announcement">Announcement</option>
                      <option value="event">Event</option>
                      <option value="assignment">Assignment</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Method
                    </label>
                    <select
                      value={newNotification.delivery_method}
                      onChange={(e) => setNewNotification(prev => ({ ...prev, delivery_method: e.target.value as any }))}
                      className="w-full p-3 border border-zenith-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-zenith-primary"
                    >
                      <option value="in-app">In-App Only</option>
                      <option value="email">Email Only</option>
                      <option value="both">Both In-App & Email</option>
                    </select>
                  </div>
                </div>

                {/* Recipients Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Send To
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={sendToAll}
                        onChange={() => setSendToAll(true)}
                        className="mr-2"
                      />
                      <Users className="w-4 h-4 mr-1" />
                      All Club Members
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!sendToAll}
                        onChange={() => setSendToAll(false)}
                        className="mr-2"
                      />
                      <UserIcon className="w-4 h-4 mr-1" />
                      Specific Members
                    </label>
                  </div>

                  {!sendToAll && (
                    <div className="mt-3 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-2">
                      {clubMembers.map(member => (
                        <label key={member.id} className="flex items-center py-1">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(member.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, member.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== member.id));
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-zenith-primary">{member.name} ({member.email})</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-zenith-muted border border-zenith-border rounded-md hover:bg-zenith-hover"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNotification}
                    disabled={loading || (!sendToAll && selectedUsers.length === 0)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>{loading ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-zenith-card rounded-xl shadow-lg p-12 text-center">
              <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zenith-primary mb-2">
                No notifications found
              </h3>
              <p className="text-zenith-muted">
                {searchTerm
                  ? "Try adjusting your search terms."
                  : "You&apos;re all caught up!"}
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul
                role="list"
                className="divide-y divide-gray-200 dark:divide-gray-700"
              >
                {filteredNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="py-3 sm:py-4 px-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <div
                      className="flex items-center space-x-4 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                            {notification.title}
                          </p>
                          {getDeliveryIcon(notification)}
                          {notification.email_sent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                              ✓ Email Sent
                            </span>
                          )}
                          {!notification.read && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {notification.message}
                        </p>
                        {notification.delivery_method && notification.delivery_method !== 'in-app' && (
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              notification.delivery_method === 'email' 
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
                                : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
                            }`}>
                              {notification.delivery_method === 'email' ? 'Email Only' : 'In-App + Email'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="inline-flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {formatTimestamp(notification.created_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Load More Button (for pagination in real app) */}
        {filteredNotifications.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-zenith-card text-gray-700 dark:text-gray-300 border border-zenith-border rounded-lg hover:bg-zenith-hover transition-colors">
              Load More Notifications
            </button>
          </div>
        )}
      </div>

      <ZenChatbot />
    </div>
  );
}
