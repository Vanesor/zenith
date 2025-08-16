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
  const isAdmin = user && (
    user.role === 'admin' ||
    user.role === 'coordinator' ||
    user.role === 'co_coordinator' ||
    user.role === 'secretary' ||
    user.role === 'committee_member'
  );

  if (!isAdmin) {
    redirect("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-zenith-main">
      {children}
    </div>
  );
}
