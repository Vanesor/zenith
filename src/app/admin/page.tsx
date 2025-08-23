"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      // Determine user role and redirect accordingly
      const userRole = user.role?.toLowerCase() || '';
      
      // Zenith Committee Members - can see all clubs
      const isZenithCommittee = [
        'president',
        'vice_president', 
        'innovation_head',
        'secretary',
        'treasurer',
        'outreach_coordinator',
        'media_coordinator',
        'zenith_committee'
      ].includes(userRole);

      // Club Coordinators - can only see their club management
      const isClubCoordinator = [
        'coordinator',
        'co_coordinator',
        'club_coordinator',
        'co-coordinator'
      ].includes(userRole);

      // System Admin - full access
      const isSystemAdmin = userRole === 'admin';

      console.log('Admin redirect logic:', {
        userRole,
        isZenithCommittee,
        isClubCoordinator,
        isSystemAdmin,
        clubId: user.club_id
      });

      if (isZenithCommittee || isSystemAdmin) {
        // Zenith committee members and admins can see all clubs
        router.push('/admin/club-management');
      } else if (isClubCoordinator) {
        // Club coordinators go to their club management (existing page)
        router.push('/club-management');
      } else {
        // No admin access, redirect to dashboard
        router.push('/dashboard');
      }
    } else if (!isLoading && !user) {
      router.push('/login');
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
