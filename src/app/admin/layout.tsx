"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { redirect } from "next/navigation";

interface UserPermissions {
  canAccessAdmin: boolean;
  accessLevel: string;
  loading: boolean;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [permissions, setPermissions] = useState<UserPermissions>({
    canAccessAdmin: false,
    accessLevel: 'none',
    loading: true
  });

  // Check user permissions using our role hierarchy system
  useEffect(() => {
    const checkPermissions = async () => {
      console.log('=== ADMIN LAYOUT PERMISSION CHECK START ===');
      console.log('1. User loading status:', isLoading);
      console.log('2. User object:', user);
      
      if (!user) {
        console.log('❌ STEP 2 FAILED: No user found, denying access');
        setPermissions({ canAccessAdmin: false, accessLevel: 'none', loading: false });
        return;
      }

      try {
        console.log('✅ STEP 2 PASSED: User found');
        console.log('3. User details:', { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        });

        // Case-insensitive role check
        const userRole = (user.role || '').toLowerCase();

        // Check base roles first
        if (userRole === 'admin' || userRole === 'super_admin') {
          console.log('✅ STEP 3 PASSED: User has admin/super_admin base role, granting access');
          setPermissions({ canAccessAdmin: true, accessLevel: userRole, loading: false });
          return;
        }
        
        // Check for innovation_head or other committee roles directly
        const privilegedRoles = [
          'joint_secretary', 'joint_treasurer', 'outreach_head', 'media_head',
          'secretary_committee', 'treasurer', 'innovation_head', 'vice_president', 
          'president'
        ];
        
        // Case insensitive check - make sure to toLowerCase for comparison
        if (privilegedRoles.some(role => role.toLowerCase() === userRole.toLowerCase())) {
          console.log(`✅ DIRECT ROLE CHECK: User has privileged role ${userRole}, granting access`);
          setPermissions({ canAccessAdmin: true, accessLevel: 'zenith', loading: false });
          return;
        }

        // Check for committee roles and club coordinator roles
        console.log('4. Fetching committee roles from API...');
        const token = localStorage.getItem('zenith-token');
        console.log('5. Token found:', !!token);
        console.log('6. Token preview:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
        
        const response = await fetch('/api/user/committee-roles', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('7. API response status:', response.status);
        console.log('8. API response ok:', response.ok);

        if (response.ok) {
          const roleData = await response.json();
          console.log('9. API response data:', JSON.stringify(roleData, null, 2));
          
          // Check if user has Zenith committee access (privileged committee roles)
          const hasZenithAccess = roleData.hasZenithAccess;
          console.log('10. Has Zenith access from API:', hasZenithAccess);
          
          // Check if user has club coordinator access
          const hasClubAccess = roleData.clubRoles?.some((role: any) => 
            role.isCurrentTerm && (role.role === 'coordinator' || role.role === 'co_coordinator')
          );
          console.log('11. Has club access:', hasClubAccess);
          console.log('12. Club roles data:', roleData.clubRoles);

          console.log('=== FINAL ACCESS DECISION ===');
          if (hasZenithAccess) {
            console.log('✅ ACCESS GRANTED: Zenith committee access');
            setPermissions({ canAccessAdmin: true, accessLevel: 'zenith', loading: false });
          } else if (hasClubAccess) {
            console.log('✅ ACCESS GRANTED: Club coordinator access');
            setPermissions({ canAccessAdmin: true, accessLevel: 'club', loading: false });
          } else {
            console.log('❌ ACCESS DENIED: No admin access found');
            console.log('Denial reasons:');
            console.log('- hasZenithAccess:', hasZenithAccess);
            console.log('- hasClubAccess:', hasClubAccess);
            console.log('- baseRole:', user.role);
            setPermissions({ canAccessAdmin: false, accessLevel: 'none', loading: false });
          }
        } else {
          console.error('❌ STEP 4 FAILED: API request failed');
          console.error('Response status:', response.status);
          const errorText = await response.text();
          console.error('Error response:', errorText);
          setPermissions({ canAccessAdmin: false, accessLevel: 'none', loading: false });
        }
      } catch (error) {
        console.error('💥 FATAL ERROR in permission check:', error);
        setPermissions({ canAccessAdmin: false, accessLevel: 'none', loading: false });
      }
      
      console.log('=== ADMIN LAYOUT PERMISSION CHECK END ===');
    };

    if (!isLoading) {
      console.log('🚀 Starting permission check (user loading complete)');
      checkPermissions();
    } else {
      console.log('⏳ Waiting for user to load...');
    }
  }, [user, isLoading]);

  // Handle loading state
  if (isLoading || permissions.loading) {
    console.log('AdminLayout: Loading state - isLoading:', isLoading, 'permissions.loading:', permissions.loading);
    return (
      <div className="min-h-screen bg-zenith-main flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zenith-primary"></div>
      </div>
    );
  }

  console.log('AdminLayout: Final access check - canAccessAdmin:', permissions.canAccessAdmin, 'accessLevel:', permissions.accessLevel);

  // Redirect if no admin access
  if (!permissions.canAccessAdmin) {
    console.log('AdminLayout: Access denied, redirecting to login');
    redirect("/login");
    return null;
  }

  // Get current path to check for access to specific admin areas
  const pathname = window.location.pathname;
  
  // Access control for specific admin sections
  const userRole = (user?.role || '').toLowerCase();
  
  // System admin roles (can access everything)
  const isSystemAdmin = ['admin', 'super_admin'].includes(userRole);
  
  // Check if user is trying to access super-admin area without proper permissions
  if (pathname.includes('/admin/super-admin') && !isSystemAdmin) {
    console.log('AdminLayout: Access denied to super-admin area');
    redirect("/admin");
    return null;
  }
  
  // Zenith committee roles (can access committee management)
  const zenithRoles = [
    'president', 'vice_president', 'innovation_head', 'secretary', 'treasurer', 
    'outreach_coordinator', 'media_coordinator', 'zenith_committee', 'joint_secretary', 
    'joint_treasurer', 'outreach_head', 'media_head', 'secretary_committee'
  ];
  
  // Club coordinator roles (can access club management)
  const coordinatorRoles = [
    'coordinator', 'co_coordinator', 'club_coordinator', 'co-coordinator'
  ];
  
  const isZenithCommittee = zenithRoles.some(role => role.toLowerCase() === userRole);
  const isClubCoordinator = coordinatorRoles.some(role => role.toLowerCase() === userRole);
  
  // Check if user is trying to access committee management without proper permissions
  if (pathname.includes('/admin/committee-management') && !isZenithCommittee && !isSystemAdmin) {
    console.log('AdminLayout: Access denied to committee management area');
    redirect("/admin");
    return null;
  }

  console.log('AdminLayout: Access granted, rendering admin layout');
  return (
    <div className="min-h-screen bg-zenith-main">
      {children}
    </div>
  );
}
