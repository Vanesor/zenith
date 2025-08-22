"use client";

import React, { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

// This is the old fixed-position ThemeToggle - Use ui/ThemeToggle instead
// Keeping for backwards compatibility
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4 z-[60] p-3 rounded-full bg-card border border-custom backdrop-blur-md hover:bg-zenith-section transition-all duration-300 shadow-lg hover:shadow-xl group"
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
