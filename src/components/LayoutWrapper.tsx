"use client";

import { usePathname } from "next/navigation";
import { TwoTierHeader } from "@/components/TwoTierHeader";
import { useAuth } from "@/contexts/AuthContext";
import { SessionExpirationHandler } from "@/components/SessionExpirationHandler";

const noHeaderPaths = ["/", "/login", "/register"];

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
  
  // Check if current path should hide header (like test-taking interfaces)
  // Special handling for assignment taking pages
  const shouldHideHeader = hideHeaderPaths.some(path => {
    if (path === "/assignments/") {
      // Only hide header for assignment taking pages, not listing or viewing
      return pathname.includes("/assignments/") && pathname.includes("/take");
    }
    return pathname.startsWith(path);
  });
  
  // Show header when:
  // 1. Not on excluded paths AND
  // 2. Not on test-taking paths 
  // (Always show header regardless of auth status - the header components handle auth state internally)
  const shouldShowHeader = !isExcludedPath && !shouldHideHeader;

  // Calculate top margin based on header height (college banner + nav = ~112px)
  const topMargin = shouldShowHeader ? "mt-28" : "";

  return (
    <>
      {shouldShowHeader && (
        <div className="z-50 relative">
          <TwoTierHeader />
        </div>
      )}
      <div className={topMargin}>
        {/* Only wrap with SessionExpirationHandler if authenticated */}
        {user && !isExcludedPath ? (
          <SessionExpirationHandler>{children}</SessionExpirationHandler>
        ) : (
          children
        )}
      </div>
    </>
  );
}
