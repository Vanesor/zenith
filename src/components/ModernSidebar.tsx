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
  Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ModernSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function ModernSidebar({ isOpen, onToggle }: ModernSidebarProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Clubs", href: "/clubs", icon: Users },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Assignments", href: "/assignments", icon: BookOpen },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  // Add admin access if user has proper role
  const hasAdminAccess = user && ['admin', 'coordinator', 'co_coordinator'].includes(user.role);
  if (hasAdminAccess) {
    navigationItems.push({ name: "Admin", href: "/admin", icon: Shield });
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isOpen ? (isCollapsed ? 80 : 280) : 0,
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed left-0 top-0 h-full bg-sidebar border-r border-custom z-50 lg:relative lg:z-auto lg:translate-x-0 overflow-hidden flex flex-col"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-custom">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <div>
                  <h2 className="text-primary font-semibold text-lg">Zenith</h2>
                  <p className="text-muted text-xs">College Forum</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="flex items-center space-x-2">
            {/* Collapse Toggle (Desktop) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-hover transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-muted" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-muted" />
              )}
            </button>
            
            {/* Close Button (Mobile) */}
            <button
              onClick={onToggle}
              className="lg:hidden p-1.5 rounded-lg hover:bg-hover transition-colors"
            >
              <X className="w-4 h-4 text-muted" />
            </button>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-4 border-b border-custom">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-semibold text-sm">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </span>
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-primary font-medium text-sm truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-muted text-xs capitalize">
                    {user.role?.replace('_', ' ')}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close mobile sidebar on navigation
                  if (window.innerWidth < 1024) {
                    onToggle();
                  }
                }}
                className={`
                  relative flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                  ${active 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-secondary hover:bg-hover hover:text-primary'
                  }
                `}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="truncate"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute right-2 w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-custom space-y-1">
          <Link
            href="/settings"
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-secondary hover:bg-hover hover:text-primary transition-colors"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  Settings
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  Sign Out
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
