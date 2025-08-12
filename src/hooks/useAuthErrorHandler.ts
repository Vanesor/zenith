'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useEffect } from 'react';

export const useAuthErrorHandler = () => {
  const { user } = useAuth();
  const { openAuthModal } = useAuthModal();

  const handleAuthError = (error: any) => {
    if (error?.status === 401 || error?.message?.includes('unauthorized') || error?.message?.includes('expired')) {
      openAuthModal('Your session has expired. Please sign in again.');
      return true;
    }
    return false;
  };

  return { handleAuthError };
};
