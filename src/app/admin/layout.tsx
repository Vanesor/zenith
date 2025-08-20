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

  // Check if user has admin permissions - only coordinators and Zenith committee members
  const isZenithCommittee = user && (
    user.role === 'president' ||
    user.role === 'vice_president' ||
    user.role === 'innovation_head' ||
    user.role === 'secretary' ||
    user.role === 'treasurer' ||
    user.role === 'outreach_coordinator' ||
    user.role === 'media_coordinator'
  );

  const isClubCoordinator = user && (
    user.role === 'coordinator' ||
    user.role === 'co_coordinator'
  );

  const isAdmin = user && user.role === 'admin';

  if (!isZenithCommittee && !isClubCoordinator && !isAdmin) {
    redirect("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-zenith-main">
      {children}
    </div>
  );
}
