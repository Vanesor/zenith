"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings,
  ChevronLeft,
  User,
  LogOut,
  Bell,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatedPlaygroundIcon } from "@/components/icons/AnimatedPlaygroundIcon";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navigationItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Assignments", href: "/assignments", icon: BookOpen },
    { name: "Events", href: "/events", icon: Calendar },
    { name: "Playground", href: "/playground", icon: AnimatedPlaygroundIcon, isCustom: true },
    { name: "Discussions", href: "/discussions", icon: MessageSquare },
    { name: "Members", href: "/members", icon: Users },
    { name: "Notifications", href: "/notifications", icon: Bell },
  ];

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-zenith-card dark:bg-gray-900 border-r border-zenith-border dark:border-gray-700 z-50 lg:relative lg:translate-x-0"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-zenith-border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-zenith-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <span className="font-semibold text-zenith-primary dark:text-white">
                  Zenith
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zenith-section dark:hover:bg-gray-800 lg:hidden"
              >
                <X className="w-5 h-5 text-zenith-muted" />
              </button>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-b border-zenith-border dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 dark:bg-zenith-secondary rounded-full flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-zenith-secondary dark:text-zenith-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zenith-primary dark:text-white truncate">
                    {user?.name || "Guest User"}
                  </p>
                  <p className="text-xs text-zenith-muted dark:text-zenith-muted truncate">
                    {user?.role || "Student"}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                      isActive(item.href)
                        ? "bg-blue-50 dark:bg-blue-900/20 text-zenith-primary dark:text-blue-400"
                        : "text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-gray-800"
                    }`}
                  >
                    {item.isCustom ? (
                      <Icon className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-zenith-border dark:border-gray-700 space-y-2">
              <Link
                href="/settings"
                onClick={onClose}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-gray-800 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
