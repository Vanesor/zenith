"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  Mail,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import UserAvatar from "@/components/UserAvatar";

interface UnifiedHeaderProps {
  showCollegeBanner?: boolean;
  showNavigation?: boolean;
  className?: string;
}

export function UnifiedHeader({ 
  showCollegeBanner = true, 
  showNavigation = true,
  className = "" 
}: UnifiedHeaderProps) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Apply theme class to document body to ensure proper theme application
  useEffect(() => {
    if (typeof window !== "undefined") {
      const html = document.documentElement;
      const body = document.body;
      
      if (theme === 'dark') {
        html.classList.add('dark');
        html.classList.remove('light');
        body.classList.add('dark');
        body.classList.remove('light');
      } else {
        html.classList.add('light');
        html.classList.remove('dark');
        body.classList.add('light');
        body.classList.remove('dark');
      }
      
      // Force a re-render by updating a data attribute
      html.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Navigation items
  const navigationItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/clubs", label: "Clubs", icon: Users },
    { href: "/calendar", label: "Calendar", icon: Calendar },
    { href: "/assignments", label: "Assignments", icon: BookOpen },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/playground", label: "Playground", icon: Code2 },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target) return;
      
      const target = event.target as Element;
      if (!target.closest(".user-menu-container")) {
        setShowUserMenu(false);
      }
      if (!target.closest(".mobile-menu-container")) {
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <header className={`fixed top-0 inset-x-0 z-50 w-full ${className}`}>
      {/* College Banner */}
      {showCollegeBanner && (
        <div className="bg-zenith-main border-b border-zenith-border transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              {/* Left - College Logo */}
              <div className="flex items-center">
                <div className="relative p-1 rounded-full shadow-md">
                  <Image
                    src="/pallotti-logo.png"
                    alt="St. Vincent Pallotti College of Engineering & Technology Logo"
                    width={56}
                    height={56}
                    className="object-cover rounded-full md:w-[72px] md:h-[72px]"
                    priority
                  />
                </div>
              </div>

              {/* Center - College and Department Name */}
              <div className="flex-1 text-center px-3 md:px-6">
                <h1 className="text-md md:text-xl font-bold text-zenith-primary mb-0.5 transition-colors duration-200">
                  St. Vincent Pallotti College of Engineering & Technology
                </h1>
                <p className="text-xs md:text-base text-zenith-primary font-semibold transition-colors duration-200">
                  Department of Computer Engineering
                </p>
                <p className="text-xs md:text-xs text-zenith-secondary mt-0.5 transition-colors duration-200">
                  Nagpur - An Autonomous Institution
                </p>
              </div>

              {/* Right - Zenith Logo */}
              <div className="flex items-center">
                <div className="relative p-1 bg-transparent rounded-lg">
                  <Image
                    src="/zenithlogo.png"
                    alt="Zenith Platform Logo"
                    width={96}
                    height={64}
                    className="object-contain md:w-[112px] md:h-[72px] drop-shadow-lg"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      {showNavigation && (
        <div className="bg-zenith-card border-b border-zenith-border shadow-sm transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14">
              {/* Left - Platform Name and Navigation */}
              <div className="flex items-center space-x-2 flex-1">
                <Link 
                  href={isAuthenticated ? "/dashboard" : "/"}
                  className="text-xl font-bold text-zenith-primary hover:text-zenith-accent transition-colors duration-200"
                >
                  ZENITH
                </Link>

                {/* Desktop Navigation - Only show when authenticated */}
                {isAuthenticated && (
                  <nav className="hidden lg:flex space-x-8">
                    {navigationItems.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center space-x-3 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                            isActive
                              ? "bg-zenith-accent text-white"
                              : "text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover"
                          }`}
                        >
                          <Icon size={18} />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>

              {/* Spacer */}
              <div className="flex-grow min-w-16"></div>

              {/* Right - Theme Toggle, Auth Buttons, User Menu, Mobile Menu */}
              <div className="flex items-center space-x-4">
                <ThemeToggle />

                {!isAuthenticated ? (
                  /* Auth Buttons for non-authenticated users */
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/login"
                      className="px-5 py-2 text-sm font-medium text-zenith-secondary hover:text-zenith-primary transition-colors duration-200"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/register"
                      className="px-5 py-2 text-sm font-medium bg-zenith-accent hover:bg-zenith-accent/90 text-white rounded-md transition-colors duration-200"
                    >
                      Sign Up
                    </Link>
                  </div>
                ) : (
                  /* User Menu for authenticated users */
                  <div className="relative user-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUserMenu(!showUserMenu);
                      }}
                      className="flex items-center space-x-2 text-zenith-secondary hover:text-zenith-primary transition-colors duration-200"
                    >
                      <UserAvatar 
                        avatar={user?.avatar}
                        name={user?.name || user?.username}
                        email={user?.email}
                        size="sm" 
                        className="w-8 h-8"
                      />
                      <span className="hidden md:block text-sm font-medium">
                        {user?.name || user?.username || user?.email || "User"}
                      </span>
                      <ChevronDown size={16} />
                    </button>

                    {/* User Dropdown */}
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-zenith-card rounded-md shadow-lg border border-zenith-border py-1 transition-colors duration-200">
                        <div className="px-4 py-2 border-b border-zenith-border">
                          <p className="text-sm font-medium text-zenith-primary">
                            {user?.name || user?.username || "User"}
                          </p>
                          <p className="text-sm text-zenith-muted truncate">
                            {user?.email}
                          </p>
                        </div>

                        <Link
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-zenith-secondary hover:bg-zenith-hover hover:text-zenith-primary transition-colors duration-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User size={16} className="mr-3" />
                          Profile
                        </Link>

                        <Link
                          href="/settings"
                          className="flex items-center px-4 py-2 text-sm text-zenith-secondary hover:bg-zenith-hover hover:text-zenith-primary transition-colors duration-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings size={16} className="mr-3" />
                          Settings
                        </Link>

                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut size={16} className="mr-3" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Mobile Menu Button - Only show when authenticated */}
                {isAuthenticated && (
                  <button
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className="lg:hidden p-2 rounded-md text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover mobile-menu-container transition-colors duration-200"
                  >
                    {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Navigation Menu - Only show when authenticated */}
            {showMobileMenu && isAuthenticated && (
              <div className="lg:hidden border-t border-zenith-border py-4">
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-md text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "bg-zenith-accent text-white"
                            : "text-zenith-secondary hover:text-zenith-primary hover:bg-zenith-hover"
                        }`}
                        onClick={() => setShowMobileMenu(false)}
                      >
                        <Icon size={20} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// Export default for easy imports
export default UnifiedHeader;
