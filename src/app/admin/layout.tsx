"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  // Check if user has admin permissions
  const isZenithCommittee = user && (
    user.role === 'president' ||
    user.role === 'vice_president' ||
    user.role === 'innovation_head' ||
    user.role === 'secretary' ||
    user.role === 'treasurer' ||
    user.role === 'outreach_coordinator' ||
    user.role === 'media_coordinator' ||
    user.role === 'zenith_committee'
  );

  const isClubCoordinator = user && (
    user.role === 'coordinator' ||
    user.role === 'co_coordinator' ||
    user.role === 'club_coordinator' ||
    user.role === 'co-coordinator'
  );

  const isSystemAdmin = user && user.role === 'admin';

  // Check if user has any admin-level access
  const hasAdminAccess = isZenithCommittee || isClubCoordinator || isSystemAdmin;

  if (!hasAdminAccess) {
    redirect("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-zenith-main">
      {children}
    </div>
  );
}
