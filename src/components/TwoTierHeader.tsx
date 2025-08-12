"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  LogOut,
  Settings,
  User,
  Home,
  Users,
  Calendar,
  BookOpen,
  ChevronDown,
  MessageSquare,
  Menu,
  X,
  Code2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { CollegeHeader } from "@/components/CollegeHeader";

export function TwoTierHeader() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
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
        }
      } catch (error) {
        console.error("Auth heartbeat error:", error);
      }
    };
    
    if (isAuthenticated && !isLoading) {
      checkAuth();
    }
  }, [heartbeatCount, isAuthenticated, isLoading]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  // Show loading placeholder if we're still checking auth
  if (isLoading) {
    return (
      <header className="fixed top-0 inset-x-0 z-50">
        {/* College Banner - Loading */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="animate-pulse h-10 w-48 bg-blue-700 rounded"></div>
              <div className="animate-pulse h-8 w-32 bg-blue-700 rounded"></div>
            </div>
          </div>
        </div>
        
        {/* Navigation - Loading */}
        <nav className="bg-zenith-section/90 backdrop-blur-md border-b border-zenith-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                <div className="animate-pulse h-8 w-8 bg-zenith-card rounded"></div>
                <div className="animate-pulse h-8 w-64 bg-zenith-card rounded"></div>
              </div>
              <div className="flex items-center space-x-4">
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
  
  // Ensure user is defined for TypeScript
  if (!user) {
    return null;
  }

  const isManager = user && [
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
    { name: "Playground", href: "/playground", icon: Code2 },
    ...(isManager ? [{ name: "Club Management", href: "/club-management", icon: Settings }] : []),
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* College Banner/Header */}
      <CollegeHeader />

      {/* Main Navigation Header */}
      <nav className="bg-zenith-section/90 backdrop-blur-md border-b border-zenith-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left Side - Menu Button */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 rounded-lg hover:bg-zenith-hover transition-colors lg:hidden"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-zenith-secondary" />
                ) : (
                  <Menu className="w-6 h-6 text-zenith-secondary" />
                )}
              </button>
            </div>

            {/* Center - Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

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
            </nav>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-zenith-card transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name?.charAt(0) || user.email.charAt(0)}
                    </span>
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-zenith-primary">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-zenith-muted">
                      {user.role}
                    </p>
                  </div>
                  <ChevronDown
                    size={16}
                    className="text-zenith-muted hidden md:block"
                  />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zenith-card rounded-lg shadow-lg border border-zenith-border py-2">
                    <Link
                      href="/profile"
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-zenith-secondary hover:bg-zenith-hover"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </Link>
                    <hr className="my-2 border-zenith-border" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-500 hover:bg-zenith-hover w-full text-left"
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
        {showMobileMenu && (
          <div className="lg:hidden border-t border-zenith-border bg-zenith-section">
            <div className="px-4 py-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-zenith-accent text-white"
                        : "text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-card"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
