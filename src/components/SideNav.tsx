"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { 
  LogOut, 
  Settings, 
  User, 
  Home, 
  Users, 
  Calendar, 
  BookOpen, 
  MessageSquare,
  Menu,
  X,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface SideNavProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function SideNav({ isOpen, toggleSidebar }: SideNavProps) {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Ensure user is defined for TypeScript
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
    { name: "Settings", href: "/settings", icon: Settings },
    ...(isManager ? [{ name: "Club Management", href: "/club-management", icon: Settings }] : []),
  ];

  return (
    <>
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full bg-zenith-card dark:bg-gray-900 shadow-lg z-50 transition-all duration-300 ease-in-out 
        ${isOpen ? 'w-64' : 'w-0 md:w-16'} overflow-hidden`}>
        
        {/* Logo and toggle */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-zenith-border dark:border-gray-700">
          <Link href="/dashboard" className={`flex items-center space-x-2 ${!isOpen && 'md:hidden'}`}>
            <Image 
              src="/zenith-logo.svg"
              alt="College Logo"
              width={32}
              height={32}
            />
            <span className={`font-semibold text-zenith-primary dark:text-white transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
              Zenith
            </span>
          </Link>
          <button 
            onClick={toggleSidebar} 
            className="text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-white"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        
        {/* Nav Links */}
        <div className="mt-4">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-white hover:bg-zenith-section dark:hover:bg-gray-800"
                  }`}
              >
                <Icon size={20} />
                <span className={`transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
        
        {/* User Profile at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-zenith-border dark:border-gray-700 p-4">
          <div 
            className="flex items-center space-x-3 cursor-pointer rounded-lg p-2 hover:bg-zenith-section dark:hover:bg-gray-800"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {user.name?.charAt(0) || user.email.charAt(0)}
              </span>
            </div>
            <div className={`transition-all duration-300 ${isOpen ? 'block' : 'hidden'}`}>
              <p className="text-sm font-medium text-zenith-primary dark:text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-zenith-muted dark:text-zenith-muted">
                {user.role}
              </p>
            </div>
            <ChevronDown 
              size={16} 
              className={`text-zenith-muted dark:text-zenith-muted transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}
            />
          </div>
          
          {/* User dropdown */}
          {showUserMenu && isOpen && (
            <div className="mt-2 bg-zenith-card dark:bg-gray-800 rounded-lg shadow-lg border border-zenith-border dark:border-gray-700 py-2">
              <Link
                href="/profile"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-zenith-secondary/90"
                onClick={() => setShowUserMenu(false)}
              >
                <User size={16} />
                <span>Profile</span>
              </Link>
              <Link
                href="/settings"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-zenith-secondary dark:text-gray-300 hover:bg-zenith-section dark:hover:bg-zenith-secondary/90"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings size={16} />
                <span>Settings</span>
              </Link>
              <hr className="my-2 border-zenith-border dark:border-gray-700" />
              <button
                onClick={() => logout()}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-zenith-section dark:hover:bg-zenith-secondary/90 w-full text-left"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
