'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface UseAuthGuardOptions {
  redirectReason?: string;
  requireAuth?: boolean;
  redirectOnClose?: boolean;
  redirectPath?: string;
  requiredRoles?: string[];
  onAuthRequired?: () => void;
  onUnauthorized?: () => void;
}

interface AuthGuardResult {
  isAuthenticated: boolean;
  hasPermission: boolean;
  isLoading: boolean;
  user: any;
  requireAuthentication: () => boolean;
  checkRole: (roles: string[]) => boolean;
  canAccess: boolean;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}): AuthGuardResult => {
  const { user, isLoading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const router = useRouter();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  
  const { 
    redirectReason = 'Please sign in to access this feature', 
    requireAuth = true,
    redirectOnClose = false,
    redirectPath = '/login',
    requiredRoles = [],
    onAuthRequired,
    onUnauthorized
  } = options;

  const isAuthenticated = !!user;
  
  const checkRole = (roles: string[]): boolean => {
    if (!user || roles.length === 0) return true;
    return roles.includes(user.role);
  };

  const hasPermission = checkRole(requiredRoles);
  const canAccess = (!requireAuth || isAuthenticated) && hasPermission;

  const requireAuthentication = (): boolean => {
    if (!user && !isLoading && requireAuth) {
      if (onAuthRequired) {
        onAuthRequired();
      } else {
        openAuthModal(redirectReason, redirectOnClose, redirectPath);
      }
      return false;
    }
    
    if (user && requiredRoles.length > 0 && !checkRole(requiredRoles)) {
      if (onUnauthorized) {
        onUnauthorized();
      } else {
        router.push('/dashboard'); // Redirect to safe page
      }
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    if (!isLoading && !hasCheckedAuth) {
      setHasCheckedAuth(true);
      
      if (requireAuth && !user) {
        requireAuthentication();
      } else if (user && requiredRoles.length > 0 && !checkRole(requiredRoles)) {
        requireAuthentication();
      }
    }
  }, [user, isLoading, requireAuth, requiredRoles, hasCheckedAuth]);

  return {
    isAuthenticated,
    hasPermission,
    isLoading,
    user,
    requireAuthentication,
    checkRole,
    canAccess,
  };
};

// Hook for role-based access control
export const useRoleGuard = (requiredRoles: string[]) => {
  return useAuthGuard({ requiredRoles, requireAuth: true });
};

// Hook for management access
export const useManagementGuard = () => {
  return useRoleGuard(['admin', 'coordinator', 'co_coordinator', 'secretary', 'president', 'vice_president']);
};

// Hook for admin access
export const useAdminGuard = () => {
  return useRoleGuard(['admin']);
};

// Hook for checking if user can manage a specific club
export const useClubManagementGuard = (clubId?: string) => {
  const { user } = useAuth();
  const isManager = useManagementGuard();
  
  const canManageClub = user && (
    user.role === 'admin' || 
    (isManager.hasPermission && user.club_id === clubId)
  );
  
  return {
    ...isManager,
    canManageClub: !!canManageClub,
  };
};

// Hook for requiring authentication without redirect
export const useAuthRequired = (options: Omit<UseAuthGuardOptions, 'requireAuth'> = {}) => {
  return useAuthGuard({ ...options, requireAuth: true, redirectOnClose: false });
};

// Hook for optional authentication (mixed routes)
export const useOptionalAuth = () => {
  return useAuthGuard({ requireAuth: false });
};

export default useAuthGuard;
