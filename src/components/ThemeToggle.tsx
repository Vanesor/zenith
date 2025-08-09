"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

  // Don't render until theme is loaded to prevent flash
  if (!isLoaded) {
    return null;
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-[60] p-3 rounded-full bg-zenith-card border border-zenith backdrop-blur-md hover:bg-zenith-section transition-all duration-300 shadow-lg hover:shadow-xl group"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="relative w-5 h-5">
        {theme === "light" ? (
          <Moon className="w-5 h-5 text-zenith-secondary group-hover:text-zenith-accent transition-colors" />
        ) : (
          <Sun className="w-5 h-5 text-zenith-brand group-hover:text-yellow-400 transition-colors" />
        )}
      </div>
    </button>
  );
}
