'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthGuardOptions {
  redirectReason?: string;
  requireAuth?: boolean;
  redirectOnClose?: boolean;
  redirectPath?: string;
}

export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { user, isLoading } = useAuth();
  const { openAuthModal, isAuthModalOpen } = useAuthModal();
  const router = useRouter();
  const { 
    redirectReason = 'Please sign in to access this feature', 
    requireAuth = true,
    redirectOnClose = true,
    redirectPath = '/login'
  } = options;

  const requireAuthentication = () => {
    if (!user && !isLoading && requireAuth) {
      openAuthModal(redirectReason, redirectOnClose, redirectPath);
      return false;
    }
    return true;
  };

  useEffect(() => {
    if (requireAuth && !isLoading && !user) {
      openAuthModal(redirectReason, redirectOnClose, redirectPath);
    }
  }, [user, isLoading, requireAuth, redirectReason, redirectOnClose, redirectPath, openAuthModal]);

  // Reopen modal if user closes it on a protected page
  useEffect(() => {
    if (requireAuth && !user && !isLoading && !isAuthModalOpen) {
      const timer = setTimeout(() => {
        if (redirectOnClose) {
          router.push(redirectPath);
        } else {
          openAuthModal(redirectReason, redirectOnClose, redirectPath);
        }
      }, 1000); // 1 second delay before reopening/redirecting

      return () => clearTimeout(timer);
    }
  }, [user, isLoading, isAuthModalOpen, requireAuth, redirectOnClose, redirectPath, redirectReason, router, openAuthModal]);

  return {
    isAuthenticated: !!user,
    isLoading,
    requireAuthentication,
    user,
  };
};
