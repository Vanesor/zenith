"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Bell, Menu, Settings, User, ChevronDown, Plus, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

interface PaperpalHeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function PaperpalHeader({ onMenuToggle, sidebarOpen }: PaperpalHeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-gray-900/80 backdrop-blur-lg border-b border-[#e7e2dc] dark:border-gray-800">
      {/* College Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/collegelogo.jpeg"
                alt="St. Joseph Engineering College"
                width={28}
                height={28}
                className="rounded-full ring-2 ring-white/20"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-white">St. Joseph Engineering College</h1>
                <p className="text-xs text-blue-100">Vamanjoor, Mangalore • Computer Science Department</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Image
                src="/zenithlogo.png"
                alt="Zenith Forum"
                width={24}
                height={24}
                className="rounded ring-1 ring-white/20"
              />
              <div className="hidden md:block text-right">
                <span className="text-sm font-medium text-white">Zenith Forum</span>
                <p className="text-xs text-blue-100">Student Hub</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Menu Button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Logo & Search */}
            <div className="flex items-center space-x-4">
              {/* Logo - Hidden when sidebar is open on mobile */}
              <div className={`flex items-center space-x-3 ${sidebarOpen ? 'hidden lg:flex' : 'flex'}`}>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Zenith</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">CS Student Portal</p>
                </div>
              </div>

              {/* Search */}
              <div className="hidden md:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search clubs, events, assignments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-80 pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Quick Action */}
            <Link href="/posts/create">
              <button className="hidden md:flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors shadow-lg hover:shadow-xl">
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </button>
            </Link>

            {/* Search Button (Mobile) */}
            <button className="md:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                  </span>
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
                    className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            notification.unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.unread ? 'bg-blue-600' : 'bg-gray-300'
                            }`} />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                                {notification.title}
                              </h4>
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
                    <div className="p-4 bg-gray-50 dark:bg-gray-800">
                      <Link
                        href="/notifications"
                        className="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
                      >
                        View all notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-semibold text-sm">
                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>

              {/* User Menu Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                  >
                    {user && (
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name?.charAt(0) || user.email?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || user.email}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {user.role?.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="py-2">
                      <Link
                        href="/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        <span>Your Profile</span>
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                      <button
                        onClick={() => {
                          // Handle logout
                          console.log('Logout clicked');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <AnimatePresence>
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside handlers */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
