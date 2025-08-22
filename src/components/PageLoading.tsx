"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UniversalLoader } from '@/components/UniversalLoader';

interface PageLoadingProps {
  children: React.ReactNode;
  loadingTime?: number;
}

export function PageLoading({ children, loadingTime = 800 }: PageLoadingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [loadingTime]);

  if (isLoading) {
    return <UniversalLoader message="Loading page content..." />;
  }

  return <>{children}</>;
}

// Hook for manual loading states
export function usePageLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  return {
    isLoading,
    startLoading,
    stopLoading,
    LoadingComponent: isLoading ? <UniversalLoader /> : null
  };
}
