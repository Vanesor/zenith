"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
// import { Footer } from "./NewFooter";
import { useTheme } from "next-themes";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-college-medium dark:bg-college-dark text-white flex flex-col">
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
        
        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Content Container */}
          <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
      
      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
};

export default Layout;
