"use client";

import { usePathname } from "next/navigation";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/contexts/AuthContext";

const noHeaderPaths = ["/", "/login", "/register"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  // Show header when user is authenticated and not on excluded paths
  // Don't show header while still loading to prevent flashing
  const shouldShowHeader = !isLoading && user && !noHeaderPaths.includes(pathname);

  return (
    <>
      {shouldShowHeader && <NavigationHeader />}
      {children}
    </>
  );
}
