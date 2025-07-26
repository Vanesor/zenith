"use client";

import { usePathname } from "next/navigation";
import { NavigationHeader } from "@/components/NavigationHeader";
import { useAuth } from "@/contexts/AuthContext";

const noHeaderPaths = ["/", "/login", "/register"];

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();

  const shouldShowHeader = user && !noHeaderPaths.includes(pathname);

  return (
    <>
      {shouldShowHeader && <NavigationHeader />}
      {children}
    </>
  );
}
