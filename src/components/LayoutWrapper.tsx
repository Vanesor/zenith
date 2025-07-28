"use client";

import { usePathname } from "next/navigation";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/contexts/AuthContext";

const noHeaderPaths = ["/", "/login", "/register"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Don't render content for excluded paths (login, etc.)
  const isExcludedPath = noHeaderPaths.includes(pathname);
  
  // Show header when:
  // 1. Not on excluded paths AND
  // 2. (User is authenticated OR still loading authentication)
  const shouldShowHeader = !isExcludedPath && (user || isLoading);

  // Use a loading placeholder for the navbar when checking auth
  return (
    <>
      {shouldShowHeader && (
        <div className="z-50 relative">
          <NavigationHeader />
        </div>
      )}
      <div className={shouldShowHeader ? "mt-16" : ""}>
        {children}
      </div>
    </>
  );
}
