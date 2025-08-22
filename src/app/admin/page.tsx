"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Check if user has proper role for club management
    const hasAccess = user && [
      'coordinator', 
      'co_coordinator', 
      'club_coordinator',
      'co-coordinator'
    ].includes(user.role?.toLowerCase() || '');

    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (!hasAccess) {
        router.push('/dashboard');
      } else {
        // Redirect to club management
        router.push('/admin/club-management');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen zenith-bg-main flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="zenith-text-secondary">Loading admin portal...</p>
        </div>
      </div>
    );
  }

  return null; // This will redirect
}
