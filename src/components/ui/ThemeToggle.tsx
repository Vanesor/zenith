'use client';

import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Enhanced toggle function with theme enforcement
  const handleToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="p-2 rounded-lg bg-card border border-custom">
        <div className="h-5 w-5 animate-pulse bg-zenith-hover rounded"></div>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg bg-card border border-custom dark:border-gray-600 hover:bg-zenith-hover dark:hover:bg-gray-700 transition-all duration-200 group"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-yellow-500 group-hover:text-yellow-400 transition-colors" />
      ) : (
        <Moon className="h-5 w-5 text-gray-600 group-hover:text-gray-800 transition-colors" />
      )}
    </button>
  );
}
