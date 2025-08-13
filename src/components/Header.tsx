"use client";

import React from "react";
import Image from "next/image";
import { Menu, Bell, Search, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="bg-zenith-card dark:bg-gray-900 border-b border-zenith-border dark:border-gray-700 sticky top-0 z-30">
      {/* College Banner */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            {/* Left - College Logo */}
            <div className="flex items-center">
              <Image
                src="/pallotti-college-logo.jpeg"
                alt="St. Vincent Pallotti College Logo"
                width={50}
                height={50}
                className="rounded-full object-contain"
                priority
              />
            </div>

            {/* Center - College and Department Name */}
            <div className="flex-1 text-center px-4 md:px-8">
              <h1 className="text-lg md:text-2xl font-bold text-black mb-1">
                St. Vincent Pallotti College of Engineering & Technology
              </h1>
              <p className="text-sm md:text-lg text-black font-semibold">
                Department of Computer Engineering
              </p>
              <p className="text-xs md:text-sm text-gray-600 mt-1">
                Nagpur - An Autonomous Institution
              </p>
            </div>

            {/* Right - Zenith Logo */}
            <div className="flex items-center">
              <Image
                src="/zenithlogo.png"
                alt="Zenith Logo"
                width={110}
                height={90}
                className="object-contain shadow-lg md:w-[140px] md:h-[110px]"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left Side - Menu and Search */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-lg hover:bg-zenith-section dark:hover:bg-gray-800 transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-6 h-6 text-zenith-secondary dark:text-gray-300" />
            </button>

            {/* Search Bar */}
            <div className="hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zenith-muted" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 w-64 border border-zenith-border dark:border-gray-600 rounded-lg bg-zenith-card dark:bg-gray-800 text-zenith-primary dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-zenith-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Center - Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link
              href="/dashboard"
              className="text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-blue-400 font-medium transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/assignments"
              className="text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-blue-400 font-medium transition-colors"
            >
              Assignments
            </Link>
            <Link
              href="/playground"
              className="text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-blue-400 font-medium transition-colors"
            >
              Playground
            </Link>
            <Link
              href="/events"
              className="text-zenith-secondary dark:text-gray-300 hover:text-zenith-primary dark:hover:text-blue-400 font-medium transition-colors"
            >
              Events
            </Link>
          </nav>

          {/* Right Side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Search for mobile */}
            <button className="p-2 rounded-lg hover:bg-zenith-section dark:hover:bg-gray-800 transition-colors md:hidden">
              <Search className="w-5 h-5 text-zenith-secondary dark:text-gray-300" />
            </button>

            {/* Notifications */}
            <Link
              href="/notifications"
              className="relative p-2 rounded-lg hover:bg-zenith-section dark:hover:bg-gray-800 transition-colors"
            >
              <Bell className="w-5 h-5 text-zenith-secondary dark:text-gray-300" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-zenith-section dark:hover:bg-gray-800 transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5 text-zenith-secondary dark:text-gray-300" />
              ) : (
                <Moon className="w-5 h-5 text-zenith-secondary dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
