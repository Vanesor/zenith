"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { PaperpalHeader } from './PaperpalHeader';
import { PaperpalSidebar } from './PaperpalSidebar';
import { UniversalLoader } from './UniversalLoader';
import { useAuth } from '@/contexts/AuthContext';

interface PaperpalLayoutWrapperProps {
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

export function PaperpalLayoutWrapper({ children }: PaperpalLayoutWrapperProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open on desktop
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Set initial sidebar state based on screen size and authentication
    const handleResize = () => {
      if (user) {
        // For authenticated users: on desktop keep sidebar open, on mobile close it
        if (window.innerWidth < 1024) {
          setSidebarOpen(false); // Closed on mobile/tablet
        } else {
          setSidebarOpen(true); // Open on desktop for authenticated users
        }
      } else {
        // For unauthenticated users: always keep sidebar closed
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [user]);

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

  // Handle sidebar state on route change and authentication changes
  useEffect(() => {
    // Responsive behavior for sidebar based on authentication state and screen size
    if (user) {
      // For authenticated users: on desktop keep sidebar open, on mobile close it
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    } else {
      // For unauthenticated users: always keep sidebar closed
      setSidebarOpen(false);
    }
  }, [pathname, user]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sidebar with Cmd/Ctrl + B
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setSidebarOpen(!sidebarOpen);
      }
      
      // Close sidebar with Escape (mobile only)
      if (e.key === 'Escape' && sidebarOpen && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Show universal loader
  if (!mounted || isLoading) {
    return <UniversalLoader message="Loading Zenith..." />;
  }

  // Render without layout for auth pages
  if (isAuthPage) {
    return <>{children}</>;
  }

  // Render without sidebar for special pages
  if (shouldHideSidebar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <PaperpalHeader 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          showAuthButtons={!user}
          expandedHeader={!user}
        />
        <main className="w-full">
          {children}
        </main>
      </div>
    );
  }

  // Show sidebar only for authenticated users
  const showSidebar = !!user;

  return (
    <div className="min-h-screen bg-[#fefcf7] dark:bg-gray-900">
      {/* Global Sidebar - Always render but conditionally show */}
      {showSidebar && (
        <PaperpalSidebar 
          isOpen={sidebarOpen} 
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onCollapseChange={setSidebarCollapsed}
        />
      )}
      
      {/* Mobile Backdrop - Enhanced overlay */}
      {sidebarOpen && showSidebar && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Main Content - Dynamic spacing based on sidebar state and authentication */}
      <div className={`transition-all duration-500 ease-in-out ${
        showSidebar && sidebarOpen 
          ? (sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-80') 
          : showSidebar 
          ? 'lg:ml-20' 
          : 'ml-0'
      } ml-0`}>
        {/* Note: ml-0 on mobile ensures no margin, sidebar overlays */}
        {/* Header */}
        <PaperpalHeader 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)} 
          sidebarOpen={sidebarOpen}
          showAuthButtons={!user}
          expandedHeader={!user}
        />
        
        {/* Page Content */}
        <main className="min-h-[calc(100vh-80px)] p-6">
          {children}
        </main>
        
        {/* Footer */}
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Z</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Zenith - CS Department Forum
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    St. Joseph Engineering College, Vamanjoor
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                <a href="/privacy" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Privacy
                </a>
                <a href="/terms" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Terms
                </a>
                <a href="/support" className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                  Support
                </a>
                <span className="text-xs">
                  © 2025 SJEC Zenith
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
