"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, Menu, Settings, User, ChevronDown, Plus, Zap, LogIn, UserPlus, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import SafeAvatar from './SafeAvatar';

interface PaperpalHeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
  showAuthButtons?: boolean;
  expandedHeader?: boolean;
}

export function PaperpalHeader({ 
  onMenuToggle, 
  sidebarOpen, 
  showAuthButtons = false,
  expandedHeader = false 
}: PaperpalHeaderProps) {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Debug logging for user avatar data
  useEffect(() => {
    if (user) {
      console.log('Header user data:', {
        name: user.name,
        avatar: user.avatar,
        profile_image_url: user.profile_image_url,
        combined: user.profile_image_url || user.avatar
      });
    }
  }, [user]);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const notifications = [
    {
      id: 1,
      title: "New assignment published",
      message: "Web Development Workshop assignment is now available",
      time: "2 hours ago",
      unread: true,
      type: "assignment"
    },
    {
      id: 2,
      title: "Event reminder",
      message: "AI/ML Workshop starts tomorrow at 2 PM",
      time: "5 hours ago",
      unread: true,
      type: "event"
    },
    {
      id: 3,
      title: "Club invitation",
      message: "You've been invited to join Robotics Club",
      time: "1 day ago",
      unread: false,
      type: "club"
    }
  ];

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-custom">
      {/* College Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-primary">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0 flex-1">
              <Image
                src="/collegelogo.jpeg"
                alt="St. Vincent Pallotti College of Engineering and Technology"
                width={40}
                height={40}
                className="rounded-full ring-2 ring-white/20 flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-primary leading-tight">St. Vincent Pallotti College of Engineering and Technology</h1>
                <p className="text-sm text-blue-100">Nagpur • Department of Computer Science and Engineering</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
              <div className="hidden md:block text-right">
                <span className="text-lg font-bold text-primary">Zenith Forum</span>
                <p className="text-sm text-blue-100">Student Hub</p>
              </div>
              <Image
                src="/zenithlogo.png"
                alt="Zenith Forum"
                width={32}
                height={32}
                className="rounded ring-1 ring-white/20 flex-shrink-0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className={`px-4 ${expandedHeader ? 'py-4' : 'py-2'}`}>
        <div className="flex items-center justify-between">
          {/* Left Side - Menu Button (only show if authenticated) */}
          <div className="flex items-center space-x-4">
            {user && (
              <button
                onClick={onMenuToggle}
                className="lg:hidden p-2 text-muted hover:text-secondary hover:bg-hover rounded-lg transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* Logo and Title (show prominently when not authenticated) */}
            {(!user || expandedHeader) && (
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">Zenith</h1>
                  <p className="text-sm text-muted">CS Department Forum</p>
                </div>
              </Link>
            )}
          </div>

          {/* Center - Removed search bar as requested */}

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Auth Buttons (when not authenticated) */}
            {showAuthButtons && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-3"
              >
                <Link
                  href="/login"
                  className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-hover rounded-lg transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-primary text-sm font-medium rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Link>
              </motion.div>
            )}

            {/* User Menu (when authenticated) */}
            {user && (
              <>
                {/* Quick Action Button */}
                <Link
                  href="/posts/create"
                  className="hidden sm:inline-flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-muted hover:text-secondary hover:bg-hover rounded-lg transition-colors"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.some(n => n.unread) && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-card rounded-xl shadow-2xl border-custom z-50"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-primary">Notifications</h3>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                                notification.unread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-sm font-medium text-gray-900 dark:text-primary">
                                      {notification.title}
                                    </h4>
                                    {notification.unread && (
                                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                          <Link
                            href="/notifications"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                          >
                            View all notifications
                          </Link>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* User Avatar and Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-200 transition-colors"
                  >
                    <SafeAvatar 
                      src={user.profile_image_url || user.avatar}
                      alt={user.name}
                      size="sm"
                      fallbackName={user.name}
                    />
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-primary">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                    </div>
                    <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
                  </button>

                  {/* User Menu Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-64 bg-card rounded-xl shadow-2xl border-custom z-50"
                      >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-3">
                            <SafeAvatar 
                              src={user.profile_image_url || user.avatar}
                              alt={user.name}
                              size="md"
                              fallbackName={user.name}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-primary">{user.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-2">
                          <Link
                            href="/profile"
                            className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          <hr className="my-2 border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search - Removed as requested */}
    </header>
  );
}
