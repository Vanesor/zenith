"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Bell,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Shield,
  BarChart3,
  Search,
  Plus,
  Sun,
  Moon,
  Monitor,
  Zap,
  Target,
  Award,
  Code2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';

interface PaperpalSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

export function PaperpalSidebar({ isOpen, onToggle, onCollapseChange }: PaperpalSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Notify parent when collapse state changes
  useEffect(() => {
    if (onCollapseChange) {
      onCollapseChange(isCollapsed);
    }
  }, [isCollapsed, onCollapseChange]);

  const mainNavigation = [
    { 
      name: "Dashboard", 
      href: "/dashboard", 
      icon: Home,
      description: "Overview & insights"
    },
    { 
      name: "Clubs", 
      href: "/clubs", 
      icon: Users,
      description: "Explore & join clubs"
    },
    { 
      name: "Events", 
      href: "/events", 
      icon: Calendar,
      description: "Upcoming activities"
    },
    { 
      name: "Assignments", 
      href: "/assignments", 
      icon: BookOpen,
      description: "Tasks & projects"
    },
    { 
      name: "Chat", 
      href: "/chat", 
      icon: MessageSquare,
      description: "Connect with peers"
    },
    { 
      name: "Playground", 
      href: "/playground", 
      icon: Code2,
      description: "Code & experiment"
    },
  ];

  const quickActions = [
    { 
      name: "New Post", 
      href: "/posts/create", 
      icon: Plus,
      color: "text-blue-600"
    },
    { 
      name: "Join Club", 
      href: "/clubs", 
      icon: Users,
      color: "text-green-600"
    },
    { 
      name: "Analytics", 
      href: "/analytics", 
      icon: BarChart3,
      color: "text-purple-600"
    },
  ];

  // Add admin access if user has proper role
  const hasAdminAccess = user && ['admin', 'coordinator', 'co_coordinator'].includes(user.role);

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sidebarVariants = {
    open: {
      width: isCollapsed ? "80px" : "320px",
      x: 0
    },
    closed: {
      width: isCollapsed ? "80px" : "320px",
      x: isDesktop ? 0 : "-100%" // On desktop, always visible; on mobile, slide out
    }
  };

  const contentVariants = {
    open: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3, delay: 0.1 }
    },
    closed: {
      opacity: 0,
      x: -20,
      transition: { duration: 0.2 }
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        variants={sidebarVariants}
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} // Smoother cubic-bezier
        className="fixed left-0 top-0 h-full bg-[#fefcf7] dark:bg-gray-900 border-r border-[#e7e2dc] dark:border-gray-800 z-50 lg:z-30 shadow-2xl lg:shadow-lg overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={contentVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="flex flex-col h-full"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-3"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                        <Zap className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Zenith</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CS Department</p>
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Collapse Toggle (Desktop) */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronLeft className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                    
                    {/* Close Button (Mobile) */}
                    <button
                      onClick={onToggle}
                      className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Search */}
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="p-4"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search anything..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="space-y-6">
                  {/* Main Navigation */}
                  <div>
                    {!isCollapsed && (
                      <motion.h3
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3"
                      >
                        Navigation
                      </motion.h3>
                    )}
                    <nav className="space-y-1">
                      {mainNavigation.map((item, index) => {
                        const IconComponent = item.icon;
                        const active = isActive(item.href);
                        return (
                          <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 + index * 0.05 }}
                          >
                            <Link
                              href={item.href}
                              className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                                active
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                              }`}
                            >
                              <IconComponent className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                                active ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                              }`} />
                              {!isCollapsed && (
                                <div className="flex-1">
                                  <div className="font-medium">{item.name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                    {item.description}
                                  </div>
                                </div>
                              )}
                              {!isCollapsed && active && (
                                <motion.div
                                  layoutId="activeIndicator"
                                  className="w-2 h-2 bg-blue-600 rounded-full"
                                />
                              )}
                            </Link>
                          </motion.div>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Quick Actions */}
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        {quickActions.map((action, index) => {
                          const IconComponent = action.icon;
                          return (
                            <motion.div
                              key={action.name}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.4 + index * 0.05 }}
                            >
                              <Link
                                href={action.href}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                              >
                                <IconComponent className={`w-4 h-4 mr-3 ${action.color}`} />
                                <span className="group-hover:text-gray-900 dark:group-hover:text-white">
                                  {action.name}
                                </span>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* Admin Section */}
                  {hasAdminAccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      {!isCollapsed && (
                        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                          Administration
                        </h3>
                      )}
                      <Link
                        href="/admin"
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          isActive('/admin')
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Shield className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                          isActive('/admin') ? 'text-purple-600' : 'text-gray-500'
                        }`} />
                        {!isCollapsed && <span>Admin Panel</span>}
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Theme Toggle */}
              {!isCollapsed && mounted && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="p-4 border-t border-gray-200 dark:border-gray-800"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: 'Light', value: 'light', icon: Sun },
                      { name: 'Dark', value: 'dark', icon: Moon },
                      { name: 'System', value: 'system', icon: Monitor }
                    ].map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setTheme(option.value)}
                          className={`flex flex-col items-center p-2 rounded-lg text-xs transition-colors ${
                            theme === option.value
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          <IconComponent className="w-4 h-4 mb-1" />
                          <span>{option.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* User Profile */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="p-4 border-t border-gray-200 dark:border-gray-800"
              >
                {user && (
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </span>
                    </div>
                    {!isCollapsed && (
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {user.name || user.email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {user.role?.replace('_', ' ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-1">
                  <Link
                    href="/profile"
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive('/profile')
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <User className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Profile</span>}
                  </Link>
                  
                  <Link
                    href="/settings"
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Settings className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Settings</span>}
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className={`w-4 h-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span>Sign Out</span>}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </>
  );
}
