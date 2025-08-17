"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Search, Bell, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernThemeToggle } from './ModernThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

interface ModernHeaderProps {
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function ModernHeader({ onMenuToggle, sidebarOpen }: ModernHeaderProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header className="sticky top-0 z-30 bg-nav border-b border-custom backdrop-blur-lg bg-opacity-80">
      {/* College Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Image
              src="/collegelogo.jpeg"
              alt="St. Joseph Engineering College"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="hidden sm:block">
              <h1 className="text-sm font-semibold">St. Joseph Engineering College</h1>
              <p className="text-xs opacity-90">Vamanjoor, Mangalore</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Image
              src="/zenithlogo.png"
              alt="Zenith Forum"
              width={24}
              height={24}
              className="rounded"
            />
            <span className="hidden sm:inline text-sm font-medium">Computer Science Department</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Menu Button */}
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg hover:bg-hover transition-colors lg:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-secondary" />
            </button>

            {/* Logo & Title - Hidden when sidebar is open on mobile */}
            <div className={`flex items-center space-x-3 ${sidebarOpen ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
              <div className="hidden sm:block">
                <h2 className="text-primary font-semibold text-lg">Zenith</h2>
                <p className="text-muted text-xs">CS Department Forum</p>
              </div>
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-section border border-custom rounded-lg text-sm text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg hover:bg-hover transition-colors">
              <Bell className="w-5 h-5 text-secondary" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </button>

            {/* Theme Toggle */}
            <ModernThemeToggle />

            {/* User Avatar */}
            {user && (
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer"
              >
                <span className="text-white font-semibold text-sm">
                  {user.name?.charAt(0) || user.email.charAt(0)}
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
