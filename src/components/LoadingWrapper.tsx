"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { UniversalLoader } from './UniversalLoader';

interface LoadingWrapperProps {
  children: React.ReactNode;
  loadingDuration?: number;
  skipPaths?: string[];
}

export function LoadingWrapper({ 
  children, 
  loadingDuration = 600,
  skipPaths = ['/login', '/register'] 
}: LoadingWrapperProps) {
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    // Skip loading for certain paths
    if (skipPaths.includes(pathname)) {
      setIsLoading(false);
      return;
    }

    // Set loading state
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingDuration);

    return () => clearTimeout(timer);
  }, [pathname, loadingDuration, skipPaths]);

  if (isLoading) {
    return <UniversalLoader message="Loading page..." />;
  }

  return <>{children}</>;
}

export default LoadingWrapper;
