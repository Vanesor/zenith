"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  LogOut,
  Settings,
  User,
  Home,
  Users,
  Calendar,
  BookOpen,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { ZenithLogo } from "@/components/ZenithLogo";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import UserAvatar from "@/components/UserAvatar";
import ThemeToggle from "@/components/ui/ThemeToggle";

export function NavigationHeader() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [heartbeatCount, setHeartbeatCount] = useState(0);

  // Periodic heartbeat to keep session alive and verify auth status
  useEffect(() => {
    const heartbeat = setInterval(() => {
      setHeartbeatCount(prev => prev + 1);
    }, 60000); // Check every minute
    
    return () => clearInterval(heartbeat);
  }, []);
  
  // Re-check auth status periodically
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check");
        if (!response.ok) {
          console.log("Auth check failed, session may be expired");
          // Don't logout automatically - let the AuthContext handle it
        }
      } catch (error) {
        console.error("Auth heartbeat error:", error);
      }
    };
    
    if (isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [heartbeatCount, isAuthenticated, isLoading]);

  // // Fetch notifications when component loads or auth status changes
  // useEffect(() => {
  //   const fetchNotifications = async () => {
  //     if (!user || !user.id) return;

  //     try {
  //       const token = localStorage.getItem("zenith-token");
  //       const response = await fetch(`/api/notifications?userId=${user.id}`, {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       });

  //       if (response.ok) {
  //         const data = await response.json();
  //         setNotifications(data);
  //         const unread = data.filter((n: { read: boolean }) => !n.read).length;
  //         setUnreadCount(unread);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching notifications:", error);
  //     }
  //   };

  //   fetchNotifications();
  // }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Show loading placeholder if we're still checking auth
  if (isLoading) {
    return (
      <header className="fixed top-0 inset-x-0 z-50">
        <nav className="bg-zenith-section backdrop-blur-md border-b border-zenith">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex">
                <ZenithLogo size="md" />
              </div>
              <div className="flex items-center space-x-4">
                <div className="animate-pulse h-8 w-8 bg-zenith-card rounded-full"></div>
                <div className="animate-pulse h-8 w-8 bg-zenith-card rounded-full"></div>
                <div className="animate-pulse h-8 w-8 bg-zenith-card rounded-full"></div>
                <div className="animate-pulse h-8 w-24 bg-zenith-card rounded"></div>
              </div>
            </div>
          </div>
        </nav>
      </header>
    );
  }
  
  // Don't show navigation for unauthenticated users
  if (!user && !isAuthenticated) {
    return null;
  }
  
  // Ensure user is defined for TypeScript - this shouldn't happen based on our checks above
  // but this keeps TypeScript happy
  if (!user) {
    return null;
  }

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

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Clubs", href: "/clubs", icon: Users },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Assignments", href: "/assignments", icon: BookOpen },
    { name: "Notifications", href: "/notifications", icon: Bell },
    ...(isManager ? [{ name: "Club Management", href: "/club-management", icon: Settings }] : []),
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="bg-zenith-section backdrop-blur-md border-b border-zenith">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard">
            <ZenithLogo size="md" />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-zenith-accent text-white"
                      : "text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-card"
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zenith-card transition-colors"
              >
                <UserAvatar 
                  avatar={user.avatar}
                  name={user.name}
                  email={user.email}
                  size="md"
                  showOnlineStatus={true}
                  isOnline={true}
                />
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-zenith-primary">
                    {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.name}
                  </p>
                  <p className="text-xs text-zenith-muted">
                    {user.role}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className="text-zenith-muted"
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-zenith-card rounded-lg shadow-lg border border-zenith py-2">
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-zenith-secondary hover:bg-zenith-section"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User size={16} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-zenith-secondary hover:bg-zenith-section"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings size={16} />
                    <span>Settings</span>
                  </Link>
                  <hr className="my-2 border-zenith" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-zenith-section w-full text-left"
                  >
                    <LogOut size={16} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-zenith">
        <div className="px-4 py-2 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zenith-accent text-white"
                    : "text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-card"
                }`}
              >
                <Icon size={16} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
    </header>
  );
}
