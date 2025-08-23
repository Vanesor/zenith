"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { fetchWithAuth, handleApiResponse } from '@/lib/authUtils';

// Hook to get authenticated fetch function
export const useAuthenticatedFetch = () => {
  const { logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  
  return (url: string, options: RequestInit = {}) => 
    fetchWithAuth(url, options, logout, openAuthModal);
};

// Hook to get the API response handler
export const useApiResponseHandler = () => {
  const { logout } = useAuth();
  const { openAuthModal } = useAuthModal();
  
  return (response: Response) => handleApiResponse(response, logout, openAuthModal);
};
