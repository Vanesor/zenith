"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/NewFooter";
import { useAuth } from "@/contexts/AuthContext";
import { SessionExpirationHandler } from "@/components/SessionExpirationHandler";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const noHeaderPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password", "/setup-2fa"];
const noFooterPaths = ["/login", "/register", "/forgot-password", "/verify-email", "/reset-password", "/setup-2fa"]; // Pages with no footer or their own footer

// Paths where the header should be hidden (like during tests/exams)
const hideHeaderPaths = [
  "/assignments/",
  "/test",
  "/exam", 
  "/quiz"
];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Don't render content for excluded paths (login, etc.)
  const isExcludedPath = noHeaderPaths.includes(pathname);
  
  // Don't show footer on special paths like login/register or during tests
  const shouldShowFooter = !noFooterPaths.includes(pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Global theme toggle - appears on all pages except auth pages */}

      <main className="flex-grow pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          {/* Only wrap with SessionExpirationHandler if authenticated */}
          {user && !isExcludedPath ? (
            <SessionExpirationHandler>{children}</SessionExpirationHandler>
          ) : (
            children
          )}
        </div>
      </main>
      
      {/* Footer - show on appropriate pages */}
      {shouldShowFooter && (
        <Footer />
      )}
    </div>
  );
}
