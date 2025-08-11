"use client";

import React from "react";

interface CollegeHeaderProps {
  className?: string;
}

export function CollegeHeader({ className = "" }: CollegeHeaderProps) {
  return (
    <div className={`bg-gradient-to-r from-blue-800 to-blue-900 text-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          {/* Left - College Logo and Name */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-zenith-card rounded-full flex items-center justify-center">
                <span className="text-blue-800 font-bold text-sm">GOVT</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold">Government Engineering College</h1>
                <p className="text-xs text-blue-100">Excellence in Technical Education</p>
              </div>
              <div className="sm:hidden">
                <h1 className="text-sm font-bold">Govt. Engineering College</h1>
              </div>
            </div>
          </div>

          {/* Center - College Name for mobile */}
          <div className="flex-1 text-center sm:hidden">
            <h1 className="text-sm font-bold truncate">Engineering College</h1>
          </div>

          {/* Right - Zenith Platform Logo */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <h2 className="text-sm font-semibold">Zenith Platform</h2>
              <p className="text-xs text-blue-100">Student Management System</p>
            </div>
            <div className="w-12 h-12 bg-zenith-card rounded-full flex items-center justify-center">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">Z</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
