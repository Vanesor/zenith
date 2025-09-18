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
      
      // Zenith Committee Members - can see committee management page
      const zenithRoles = [
        'president',
        'vice_president', 
        'innovation_head',
        'secretary',
        'treasurer',
        'outreach_coordinator',
        'media_coordinator',
        'zenith_committee',
        'joint_secretary',
        'joint_treasurer', 
        'outreach_head', 
        'media_head',
        'secretary_committee'
      ];
      // Case-insensitive check
      const isZenithCommittee = zenithRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

      // Club Coordinators - can only see their club management
      const coordinatorRoles = [
        'coordinator',
        'co_coordinator',
        'club_coordinator',
        'co-coordinator'
      ];
      // Case-insensitive check
      const isClubCoordinator = coordinatorRoles.some(role => role.toLowerCase() === userRole.toLowerCase());

      // System Admin - full access
      const isSystemAdmin = ['admin', 'super_admin'].includes(userRole);

      console.log('Admin redirect logic:', {
        userRole,
        isZenithCommittee,
        isClubCoordinator,
        isSystemAdmin,
        clubId: user.club_id
      });

      console.log('🔍 ADMIN PAGE ACCESS CHECK:');
      console.log('   - isZenithCommittee:', isZenithCommittee);
      console.log('   - isClubCoordinator:', isClubCoordinator);
      console.log('   - isSystemAdmin:', isSystemAdmin);

      // Direct users based on their role
      if (isSystemAdmin) {
        console.log('✅ ADMIN PAGE: Redirecting system admin to /admin/super-admin');
        router.push('/admin/super-admin');
      } else if (isZenithCommittee) {
        console.log('✅ ADMIN PAGE: Redirecting zenith committee to /admin/committee-management');
        router.push('/admin/committee-management');
      } else if (isClubCoordinator) {
        console.log('✅ ADMIN PAGE: Redirecting club coordinator to /admin/club-management');
        router.push('/admin/club-management');
      } else {
        console.log('❌ ADMIN PAGE: Redirecting to /dashboard - NO ACCESS');
        console.log('   - Reason: No valid role found');
        console.log('   - isZenithCommittee:', isZenithCommittee);
        console.log('   - isClubCoordinator:', isClubCoordinator);
        console.log('   - isSystemAdmin:', isSystemAdmin);
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
