"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ModernHeader } from './ModernHeader';
import { ModernSidebar } from './ModernSidebar';
import { useAuth } from '@/contexts/AuthContext';

interface ModernLayoutWrapperProps {
  children: React.ReactNode;
}

// Pages that don't need the layout (auth pages)
const noLayoutPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/setup-2fa'
];

// Pages where sidebar should be hidden (like tests/exams)
const hideSidebarPaths = [
  '/assignments/',
  '/test',
  '/exam',
  '/quiz'
];

export function ModernLayoutWrapper({ children }: ModernLayoutWrapperProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render layout for auth pages
  const isAuthPage = noLayoutPaths.includes(pathname);
  
  // Check if current path should hide sidebar (like test-taking interfaces)
  const shouldHideSidebar = hideSidebarPaths.some(path => {
    if (path === "/assignments/") {
      // Only hide sidebar for assignment taking pages, not listing or viewing
      return pathname.includes("/assignments/") && pathname.includes("/take");
    }
    return pathname.startsWith(path);
  });

  // Show layout when:
  // 1. Not on auth pages AND
  // 2. User is authenticated AND
  // 3. Component is mounted (to avoid hydration issues)
  const shouldShowLayout = !isAuthPage && user && mounted;

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading || !mounted) {
    return (
      <div className="min-h-screen bg-main flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-75"></div>
          <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    );
  }

  if (isAuthPage || !user) {
    return <div className="min-h-screen bg-main">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-main flex flex-col">
      {/* Header */}
      {shouldShowLayout && (
        <ModernHeader 
          onMenuToggle={handleSidebarToggle} 
          sidebarOpen={sidebarOpen}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {shouldShowLayout && !shouldHideSidebar && (
          <ModernSidebar 
            isOpen={sidebarOpen} 
            onToggle={handleSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
